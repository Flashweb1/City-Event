import admin from 'firebase-admin';
import dotenv from 'dotenv';

dotenv.config();

let firestore;

export const initDB = async () => {
  try {
    if (admin.apps.length === 0) {
      const initOpts = { projectId: process.env.FIREBASE_PROJECT_ID };
      if (process.env.FIREBASE_SERVICE_ACCOUNT) {
        initOpts.credential = admin.credential.cert(
          JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
        );
      }
      admin.initializeApp(initOpts);
    }
    firestore = admin.firestore();
    const ok = await firestore.collection('_health').doc('_check').get();
    console.log('✅ Firestore Connected');
  } catch (err) {
    console.error('❌ Firestore connection error:', err.message);
    process.exit(1);
  }
};

const FieldValue = admin.firestore.FieldValue;

const db = {
  firestore: () => firestore,
  FieldValue,

  collection: (path) => firestore.collection(path),

  doc: (path) => firestore.doc(path),

  getDoc: async (collection, id) => {
    const snap = await firestore.collection(collection).doc(id).get();
    return snap.exists ? { id: snap.id, ...snap.data() } : null;
  },

  getDocs: async (collection, ids) => {
    if (ids.length === 0) return [];
    const batches = [];
    for (let i = 0; i < ids.length; i += 10) {
      const batch = ids.slice(i, i + 10);
      const refs = batch.map(id => firestore.collection(collection).doc(id));
      const snap = await firestore.getAll(...refs);
      batches.push(...snap.map(d => (d.exists ? { id: d.id, ...d.data() } : null)).filter(Boolean));
    }
    return batches;
  },

  setDoc: async (collection, id, data) => {
    await firestore.collection(collection).doc(id).set({
      ...data,
      createdAt: FieldValue.serverTimestamp(),
    });
    return { id, ...data };
  },

  updateDoc: async (collection, id, data) => {
    await firestore.collection(collection).doc(id).update({
      ...data,
      updatedAt: FieldValue.serverTimestamp(),
    });
  },

  deleteDoc: async (collection, id) => {
    await firestore.collection(collection).doc(id).delete();
  },

  deleteDocsByField: async (collection, field, value) => {
    const snap = await firestore.collection(collection)
      .where(field, '==', value)
      .select()
      .get();
    if (snap.empty) return;
    const batch = firestore.batch();
    snap.docs.forEach(d => batch.delete(d.ref));
    await batch.commit();
  },

  query: async (collection, opts = {}) => {
    let q = firestore.collection(collection);

    if (opts.where) {
      for (const w of opts.where) {
        if (Array.isArray(w)) {
          q = q.where(...w);
        } else {
          q = q.where(w.field, w.op || '==', w.value);
        }
      }
    }

    if (opts.orderBy) {
      const field = typeof opts.orderBy === 'string' ? opts.orderBy : opts.orderBy.field;
      const dir = opts.orderBy?.dir || opts.orderBy?.direction || 'desc';
      q = q.orderBy(field, dir);
    }

    if (opts.limit) q = q.limit(opts.limit);
    if (opts.offset) q = q.offset(opts.offset);

    const snap = await q.get();
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  },

  queryFirst: async (collection, opts = {}) => {
    const results = await db.query(collection, { ...opts, limit: 1 });
    return results[0] || null;
  },

  count: async (collection, where = []) => {
    let q = firestore.collection(collection);
    for (const w of where) {
      if (Array.isArray(w)) {
        q = q.where(...w);
      } else {
        q = q.where(w.field, w.op || '==', w.value);
      }
    }
    const snap = await q.count().get();
    return snap.data().count;
  },

  sum: async (collection, field, where = []) => {
    let q = firestore.collection(collection);
    for (const w of where) {
      if (Array.isArray(w)) {
        q = q.where(...w);
      } else {
        q = q.where(w.field, w.op || '==', w.value);
      }
    }
    const snap = await q.get();
    return snap.docs.reduce((total, d) => total + (parseFloat(d.data()[field]) || 0), 0);
  },

  increment: async (collection, id, field, amount = 1) => {
    await firestore.collection(collection).doc(id).update({
      [field]: FieldValue.increment(amount),
    });
  },

  runTransaction: async (fn) => {
    return firestore.runTransaction(fn);
  },

  batchSet: async (items) => {
    const batch = firestore.batch();
    items.forEach(({ collection, id, data }) => {
      batch.set(firestore.collection(collection).doc(id), data);
    });
    await batch.commit();
  },

  batchDelete: async (collection, ids) => {
    const batch = firestore.batch();
    ids.forEach(id => batch.delete(firestore.collection(collection).doc(id)));
    await batch.commit();
  },

  batch: () => firestore.batch(),
};

export { db };
export default { db, initDB, FieldValue };