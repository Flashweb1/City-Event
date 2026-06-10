import pg from 'pg';
import admin from 'firebase-admin';
import dotenv from 'dotenv';
import { createInterface } from 'readline';

dotenv.config();

const rl = createInterface({ input: process.stdin, output: process.stdout });
const ask = (q) => new Promise(r => rl.question(q, r));

const BATCH_SIZE = 450;

const TABLES = ['profiles', 'events', 'registrations', 'waitlist', 'promo_codes', 'ticket_tiers', 'reviews'];
const FOREIGN_KEYS = {
  events: 'organizer_id',
  registrations: ['event_id', 'user_id'],
  waitlist: ['event_id', 'user_id'],
  promo_codes: 'event_id',
  ticket_tiers: 'event_id',
  reviews: ['event_id', 'user_id'],
};

let pgPool;
let firestore;

async function connectPostgres() {
  const { Pool } = pg;
  pgPool = new Pool({ connectionString: process.env.DATABASE_URL });
  const res = await pgPool.query('SELECT NOW()');
  console.log(`✅ PostgreSQL connected — server time: ${res.rows[0].now}`);
}

async function connectFirestore() {
  if (admin.apps.length === 0) {
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      admin.initializeApp({
        credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)),
      });
    } else {
      admin.initializeApp({ projectId: process.env.FIREBASE_PROJECT_ID });
    }
  }
  firestore = admin.firestore();
  console.log('✅ Firestore connected');
}

function toPlainObj(row) {
  const obj = {};
  for (const [k, v] of Object.entries(row)) {
    if (v instanceof Date) obj[k] = v.toISOString();
    else if (Buffer.isBuffer(v)) obj[k] = v.toString();
    else obj[k] = v;
  }
  return obj;
}

async function countPostgres(table) {
  const res = await pgPool.query(`SELECT COUNT(*) FROM "${table}"`);
  return parseInt(res.rows[0].count);
}

async function migrateTable(table, dryRun) {
  console.log(`\n── Migrating ${table} ──`);

  const pgCount = await countPostgres(table);
  console.log(`  PostgreSQL: ${pgCount} documents`);

  if (pgCount === 0) {
    console.log('  ⏭️  Empty, skipping');
    return { table, pgCount, firestoreCount: 0, status: 'skipped' };
  }

  let offset = 0;
  let migrated = 0;

  while (offset < pgCount) {
    const res = await pgPool.query(`SELECT * FROM "${table}" ORDER BY id LIMIT ${BATCH_SIZE} OFFSET ${offset}`);
    const docs = res.rows.map(toPlainObj);

    if (dryRun) {
      console.log(`  [dry-run] Batch ${offset / BATCH_SIZE + 1}: ${docs.length} docs (would write ids ${docs[0]?.id}..${docs[docs.length - 1]?.id})`);
    } else {
      const batch = firestore.batch();
      let batchCount = 0;
      for (const doc of docs) {
        const ref = firestore.collection(table).doc(String(doc.id));
        batch.set(ref, doc, { merge: false });
        batchCount++;
        if (batchCount >= 500) {
          await batch.commit();
          batchCount = 0;
        }
      }
      if (batchCount > 0) await batch.commit();
      migrated += docs.length;
      console.log(`  ✓ Batch wrote ${docs.length} docs (${migrated}/${pgCount})`);

      // Rate-limit to avoid Firestore write spikes
      await new Promise(r => setTimeout(r, 200));
    }

    offset += BATCH_SIZE;
  }

  const fsCount = dryRun ? 0 : await countPostgres(table); // will fix below
  console.log(`  ✅ ${dryRun ? 'Would migrate' : 'Migrated'} ${pgCount} ${table}`);
  return { table, pgCount, firestoreCount: fsCount, status: dryRun ? 'dry-run' : 'migrated' };
}

async function validate(table) {
  try {
    const pgCount = await countPostgres(table);
    const snap = await firestore.collection(table).count().get();
    const fsCount = snap.data().count;
    const match = pgCount === fsCount;
    console.log(`  ${match ? '✅' : '❌'} ${table}: PG=${pgCount} FS=${fsCount} ${match ? 'MATCH' : 'MISMATCH'}`);
    return { table, pgCount, fsCount, match };
  } catch (err) {
    console.log(`  ⚠️  ${table}: validation error — ${err.message}`);
    return { table, pgCount: -1, fsCount: -1, match: false };
  }
}

async function main() {
  console.log('═══════════════════════════════════');
  console.log('  Postgres → Firestore Migration');
  console.log('═══════════════════════════════════\n');

  const mode = process.argv.includes('--dry-run') ? 'dry-run' : 'migrate';
  const doValidate = process.argv.includes('--validate');

  if (mode === 'dry-run') console.log('🔍 DRY RUN MODE — no data will be written\n');

  await connectPostgres();
  await connectFirestore();

  if (doValidate) {
    console.log('\n── Validation Only ──');
    for (const table of TABLES) {
      await validate(table);
    }
    console.log('\n✅ Validation complete');
    rl.close();
    return;
  }

  if (mode === 'migrate') {
    const answer = await ask(`⚠️  This will write ${TABLES.length} collections to Firestore. Continue? (yes/no): `);
    if (answer.toLowerCase() !== 'yes') {
      console.log('Aborted');
      rl.close();
      return;
    }
  }

  const results = [];
  for (const table of TABLES) {
    const result = await migrateTable(table, mode === 'dry-run');
    results.push(result);
  }

  if (mode === 'migrate') {
    console.log('\n── Validation ──');
    for (const table of TABLES) {
      await validate(table);
    }
  }

  console.log('\n═══════════════════════════════════');
  console.log('  Migration Summary');
  console.log('═══════════════════════════════════');
  for (const r of results) {
    console.log(`  ${r.status === 'skipped' ? '⏭️' : r.status === 'dry-run' ? '🔍' : '✅'} ${r.table}`);
  }
  console.log('═══════════════════════════════════\n');

  rl.close();
  process.exit(0);
}

main().catch(err => {
  console.error('❌ Migration failed:', err);
  process.exit(1);
});