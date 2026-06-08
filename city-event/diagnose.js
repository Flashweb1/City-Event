#!/usr/bin/env node

/**
 * Diagnostic Script for City Event Registration Issues
 * Run: node diagnose.js
 */

const http = require('http');
const { Pool } = require('pg');

console.log('🔍 City Event - Registration Diagnosis\n');
console.log('=' .repeat(50));

// Test 1: Backend Health Check
console.log('\n1️⃣  Checking Backend Health...');
const options = {
  hostname: 'localhost',
  port: 3001,
  path: '/api/health',
  method: 'GET',
  timeout: 5000
};

const req = http.request(options, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    if (res.statusCode === 200) {
      try {
        const result = JSON.parse(data);
        console.log('✅ Backend is running');
        console.log('   Status:', result.status);
        console.log('   Database:', result.database);
        console.log('   Users:', result.stats.users);
      } catch (e) {
        console.log('⚠️  Backend returned invalid JSON');
      }
    } else {
      console.log('⚠️  Backend responded with status:', res.statusCode);
      console.log('   Response:', data);
    }
    testDatabaseConnection();
  });
});

req.on('error', (err) => {
  console.log('❌ Backend is not running or not responding');
  console.log('   Error:', err.message);
  console.log('   Make sure to run: npm run dev (in backend folder)');
  testDatabaseConnection();
});

req.on('timeout', () => {
  console.log('❌ Backend request timed out');
  req.destroy();
  testDatabaseConnection();
});

// Test 2: Direct Database Connection
async function testDatabaseConnection() {
  console.log('\n2️⃣  Checking Database Connection...');
  
  const db = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/cityevent'
  });

  try {
    const result = await db.query('SELECT 1');
    console.log('✅ Database connection successful');
    
    // Check tables
    const tables = await db.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    
    const tableNames = tables.rows.map(r => r.table_name);
    console.log('   Tables found:', tableNames.join(', ') || 'None');
    
    if (tableNames.includes('users')) {
      const userCount = await db.query('SELECT COUNT(*) FROM users');
      console.log('   Users in database:', userCount.rows[0].count);
    } else {
      console.log('⚠️  Users table not found - will be created on first startup');
    }
    
  } catch (err) {
    console.log('❌ Database connection failed');
    console.log('   Error:', err.message);
    console.log('\n   Possible solutions:');
    console.log('   1. Is PostgreSQL running?');
    console.log('   2. Check credentials: postgresql://postgres:password@localhost:5432/cityevent');
    console.log('   3. Does database "cityevent" exist?');
    console.log('\n   Create database with:');
    console.log('   psql -U postgres -c "CREATE DATABASE cityevent;"');
  } finally {
    await db.end();
    testValidation();
  }
}

// Test 3: Validation
function testValidation() {
  console.log('\n3️⃣  Checking Form Validation...');
  
  const testCases = [
    { email: 'test@example.com', password: 'password123', fullName: 'Test User', expected: 'valid' },
    { email: 'invalid', password: 'pass', fullName: 'Test', expected: 'invalid' },
    { email: 'test@test.com', password: 'short', fullName: 'Test', expected: 'invalid' },
    { email: '', password: 'password123', fullName: 'Test', expected: 'invalid' }
  ];
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  let passed = 0;
  
  testCases.forEach((test, i) => {
    const emailValid = emailRegex.test(test.email);
    const passwordValid = test.password.length >= 6;
    const nameValid = test.fullName && test.fullName.trim().length >= 2;
    const isValid = emailValid && passwordValid && nameValid;
    
    if ((isValid && test.expected === 'valid') || (!isValid && test.expected === 'invalid')) {
      console.log(`   ✅ Test ${i + 1}: ${test.email || 'empty'}`);
      passed++;
    } else {
      console.log(`   ❌ Test ${i + 1}: ${test.email || 'empty'}`);
    }
  });
  
  console.log(`   Passed: ${passed}/${testCases.length}`);
  
  console.log('\n' + '='.repeat(50));
  console.log('\n✨ Diagnosis complete!\n');
}
