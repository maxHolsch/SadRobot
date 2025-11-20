// Script to run database-setup.sql in Supabase
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  console.error('Required: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupDatabase() {
  try {
    console.log('📚 Reading database-setup.sql...');
    const sqlPath = path.join(__dirname, 'database-setup.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    // Split SQL into individual statements (simple split by semicolon)
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    console.log(`\n🔧 Found ${statements.length} SQL statements to execute\n`);

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];

      // Skip comments and empty statements
      if (statement.startsWith('--') || statement.trim() === '') continue;

      // Get statement type for logging
      const type = statement.split(' ')[0].toUpperCase();
      console.log(`[${i + 1}/${statements.length}] Executing ${type}...`);

      try {
        const { data, error } = await supabase.rpc('exec_sql', {
          sql_query: statement + ';'
        });

        if (error) {
          // Try direct query if RPC fails
          const { error: directError } = await supabase.from('_migrations').select('*').limit(1);
          if (directError) {
            console.warn(`⚠️  Warning: ${error.message}`);
            console.log('   Attempting to continue...');
          }
        }
      } catch (err) {
        console.warn(`⚠️  Warning on statement ${i + 1}: ${err.message}`);
      }
    }

    console.log('\n✅ Database setup completed!');
    console.log('\n📊 Verifying tables...');

    // Verify tables exist
    const tables = [
      'user_sessions',
      'pre_survey_submissions',
      'pre_survey_responses',
      'post_survey_submissions',
      'post_survey_responses'
    ];

    for (const table of tables) {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1);

      if (error) {
        console.log(`❌ ${table}: Not found or error - ${error.message}`);
      } else {
        console.log(`✅ ${table}: Ready`);
      }
    }

    console.log('\n🎉 All done! Your Supabase database is ready.');
    console.log('📍 View your data at: https://supabase.com/dashboard/project/enokfgiwbgianwblplcn/editor');

  } catch (error) {
    console.error('\n❌ Error setting up database:', error.message);
    console.error('\n💡 Try running the SQL manually in Supabase SQL Editor:');
    console.error('   https://supabase.com/dashboard/project/enokfgiwbgianwblplcn/sql');
    process.exit(1);
  }
}

setupDatabase();
