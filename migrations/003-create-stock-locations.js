// migrations/003-create-stock-locations.js
// Create table untuk store custom stock locations agar bisa di-share antar device

const { pool } = require('../db');

async function migrate() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // ─ Cek apakah tabel sudah ada ─
    const tableExists = await client.query(`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'stock_locations'
      );
    `);

    if (tableExists.rows[0].exists) {
      console.log('⚠️  Tabel stock_locations sudah ada, skip creation');
      await client.query('COMMIT');
      return;
    }

    // ─ Buat tabel stock_locations ─
    await client.query(`
      CREATE TABLE stock_locations (
        id SERIAL PRIMARY KEY,
        nama_lokasi VARCHAR(255) NOT NULL UNIQUE,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    console.log('✅ Tabel stock_locations berhasil dibuat');

    // ─ Insert default locations jika belum ada ─
    await client.query(`
      INSERT INTO stock_locations (nama_lokasi) 
      VALUES 
        ('Gudang A, Rak 1'),
        ('Gudang B')
      ON CONFLICT (nama_lokasi) DO NOTHING;
    `);

    console.log('✅ Default locations berhasil di-insert');

    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Migration error:', err.message);
    throw err;
  } finally {
    client.release();
    await pool.end();
    process.exit(0);
  }
}

migrate();
