const { pool } = require('./db');

async function checkColumns() {
  try {
    const result = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'kartu_stok' 
      AND column_name IN ('finished', 'penanggung_jawab')
    `);
    
    console.log('✅ Columns found:', result.rows.length);
    result.rows.forEach(row => {
      console.log('  - ' + row.column_name);
    });
    
    if (result.rows.length === 2) {
      console.log('✅ All required columns exist!');
    } else {
      console.log('⚠️ Only ' + result.rows.length + ' of 2 columns found');
    }
  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    await pool.end();
  }
}

checkColumns();
