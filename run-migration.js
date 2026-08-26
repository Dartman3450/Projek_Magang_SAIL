const fs = require('fs');
const { Pool } = require('pg');

// Read SQL migration file
const sql = fs.readFileSync('./migrations/005-create-sensor-settings.sql', 'utf8');

// Create pool with explicit credentials
const pool = new Pool({
  host: '192.168.0.85',
  user: 'postgres',
  password: '1234',
  database: 'backend_db',
  port: 5432
});

// Execute migration
(async () => {
  try {
    console.log('📊 Executing migration for sensor_settings table...');
    const result = await pool.query(sql);
    console.log('✅ Migration executed successfully!');
    console.log('📋 Result:', result);
    await pool.end();
    process.exit(0);
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    console.error('Details:', err);
    process.exit(1);
  }
})();
