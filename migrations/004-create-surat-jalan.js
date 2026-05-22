// migrations/004-create-surat-jalan.js
const { pool } = require('../db');

async function migrate() {
  try {
    console.log('📦 Running migration 004: Create surat_jalan table...');

    // Check if table already exists
    const check = await pool.query(`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'surat_jalan'
      ) AS exists
    `);

    if (check.rows[0].exists) {
      console.log('⚠️  Table surat_jalan already exists, dropping...');
      await pool.query('DROP TABLE IF EXISTS surat_jalan CASCADE');
    }

    // Create table with JSONB column
    await pool.query(`
      CREATE TABLE surat_jalan (
        id SERIAL PRIMARY KEY,
        nomor VARCHAR(255) UNIQUE NOT NULL,
        tanggal DATE NOT NULL,
        penerima VARCHAR(255) NOT NULL,
        alamat TEXT,
        pengirim VARCHAR(255),
        kendaraan VARCHAR(255),
        items JSONB DEFAULT '[]'::jsonb,
        catatan TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Table surat_jalan created');

    // Create GIN index untuk JSONB queries
    await pool.query(`
      CREATE INDEX idx_surat_jalan_items 
      ON surat_jalan USING GIN (items)
    `);
    console.log('✅ GIN index created for items column');

    // Create update_updated_at trigger
    const triggerFn = `
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `;
    
    await pool.query(triggerFn);
    console.log('✅ Trigger function created');

    // Create trigger
    await pool.query(`
      CREATE TRIGGER update_surat_jalan_updated_at
      BEFORE UPDATE ON surat_jalan
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column()
    `);
    console.log('✅ Trigger created');

    console.log('✅ Migration 004 completed successfully');
    process.exit(0);
  } catch (err) {
    console.error('❌ Migration error:', err.message);
    process.exit(1);
  }
}

migrate();
