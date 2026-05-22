// Migration: Add finished column to kartu_stok table
const { pool } = require('../db');

async function migrate() {
  try {
    console.log('🔄 Adding "finished" column to kartu_stok table...');
    await pool.query(`
      ALTER TABLE kartu_stok 
      ADD COLUMN finished BOOLEAN DEFAULT false
    `);
    console.log('✅ Column "finished" added successfully!');
  } catch (err) {
    if (err.message.includes('already exists') || err.code === '42701') {
      console.log('✅ Column "finished" already exists');
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
