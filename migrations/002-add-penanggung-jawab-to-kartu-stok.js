// Migration: Add penanggung_jawab column to kartu_stok table
const { pool } = require('../db');

async function migrate() {
  try {
    console.log('🔄 Adding "penanggung_jawab" column to kartu_stok table...');
    await pool.query(`
      ALTER TABLE kartu_stok 
      ADD COLUMN penanggung_jawab TEXT
    `);
    console.log('✅ Column "penanggung_jawab" added successfully!');
  } catch (err) {
    if (err.message.includes('already exists') || err.code === '42701') {
      console.log('✅ Column "penanggung_jawab" already exists');
    } else {
      console.error('❌ Migration error:', err.message);
      process.exit(1);
    }
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  migrate();
}

module.exports = { migrate };
