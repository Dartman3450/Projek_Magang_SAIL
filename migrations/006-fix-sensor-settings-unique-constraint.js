/**
 * Migration: Add UNIQUE constraint to sensor_settings table
 * 
 * Purpose: Fix ON CONFLICT (fixed_id) error in iotController.js
 * The saveSensorSettings() function uses ON CONFLICT (fixed_id) DO UPDATE
 * but the table doesn't have a UNIQUE constraint on fixed_id column
 */

const { poolIoT } = require('../db');

async function up() {
  try {
    console.log('\n📋 Checking sensor_settings table structure...');
    
    // Check if table exists
    const tableCheck = await poolIoT.query(`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'sensor_settings'
      )
    `);
    
    const tableExists = tableCheck.rows[0].exists;
    
    if (!tableExists) {
      console.log('📝 Creating sensor_settings table from scratch...');
      
      // Create table with UNIQUE constraint
      await poolIoT.query(`
        CREATE TABLE sensor_settings (
          id SERIAL PRIMARY KEY,
          fixed_id VARCHAR(50) UNIQUE NOT NULL,
          key VARCHAR(20),
          name VARCHAR(100),
          shape VARCHAR(20) DEFAULT 'persegi',
          orientasi VARCHAR(20) DEFAULT 'vertikal',
          tinggi NUMERIC,
          panjang NUMERIC,
          lebar NUMERIC,
          diameter NUMERIC,
          sensor_zero_cm NUMERIC DEFAULT 0,
          warn_pct INTEGER DEFAULT 40,
          crit_pct INTEGER DEFAULT 15,
          notes TEXT,
          is_active BOOLEAN DEFAULT true,
          settings_data JSONB,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      
      console.log('✅ sensor_settings table created with UNIQUE constraint on fixed_id');
      return;
    }
    
    // Table exists, check if UNIQUE constraint already exists
    console.log('📝 sensor_settings table exists, checking constraints...');
    
    const constraintCheck = await poolIoT.query(`
      SELECT constraint_name 
      FROM information_schema.table_constraints 
      WHERE table_name = 'sensor_settings' 
        AND constraint_type = 'UNIQUE'
        AND constraint_name LIKE '%fixed_id%'
    `);
    
    const hasConstraint = constraintCheck.rows.length > 0;
    
    if (hasConstraint) {
      console.log('✅ UNIQUE constraint already exists on sensor_settings.fixed_id');
      return;
    }
    
    // Constraint doesn't exist, add it
    console.log('🔧 Adding UNIQUE constraint to sensor_settings.fixed_id...');
    
    // First, remove any duplicate fixed_id values by keeping only the latest
    await poolIoT.query(`
      DELETE FROM sensor_settings s1 
      WHERE id NOT IN (
        SELECT MAX(id) 
        FROM sensor_settings s2 
        WHERE s2.fixed_id = s1.fixed_id 
        GROUP BY s2.fixed_id
      ) AND fixed_id IS NOT NULL
    `);
    
    // Add the UNIQUE constraint
    await poolIoT.query(`
      ALTER TABLE sensor_settings 
      ADD CONSTRAINT sensor_settings_fixed_id_unique 
      UNIQUE (fixed_id)
    `);
    
    console.log('✅ UNIQUE constraint added to sensor_settings.fixed_id');
    
  } catch (err) {
    console.error('❌ Migration error:', err.message);
    throw err;
  }
}

async function down() {
  try {
    console.log('\n📋 Removing UNIQUE constraint from sensor_settings.fixed_id...');
    
    // Remove the constraint (don't drop table)
    await poolIoT.query(`
      ALTER TABLE sensor_settings 
      DROP CONSTRAINT sensor_settings_fixed_id_unique
    `);
    
    console.log('✅ UNIQUE constraint removed');
    
  } catch (err) {
    // Constraint might not exist, which is fine
    if (err.message.includes('does not exist')) {
      console.log('ℹ️ Constraint didn\'t exist, nothing to remove');
    } else {
      console.error('⚠️ Error removing constraint:', err.message);
      throw err;
    }
  }
}

// Export for migration runner
module.exports = { up, down };

// Allow direct execution: node migrations/006-fix-sensor-settings-unique-constraint.js up
if (require.main === module) {
  const action = process.argv[2] || 'up';
  (async () => {
    try {
      if (action === 'up') {
        await up();
      } else if (action === 'down') {
        await down();
      }
      console.log('\n✨ Migration complete\n');
      process.exit(0);
    } catch (err) {
      console.error('\n❌ Migration failed\n', err);
      process.exit(1);
    }
  })();
}
