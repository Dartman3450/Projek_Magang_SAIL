const { pool } = require('./db.js');

pool.query(
  `SELECT id, project_name, tanggal, jar_alum, jar_total 
   FROM de_limbah 
   WHERE project_name = $1 
   ORDER BY id DESC 
   LIMIT 5`,
  ['arabika gold edition'],
  (err, res) => {
    if (err) {
      console.log('ERROR:', err.message);
    } else {
      console.log('\n📊 Jar Data di Database:');
      console.log(JSON.stringify(res.rows, null, 2));
    }
    process.exit(0);
  }
);
