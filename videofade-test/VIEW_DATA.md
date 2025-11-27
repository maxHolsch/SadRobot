# How to View Survey Data from PostgreSQL

There are several ways to view your survey data stored in PostgreSQL. Choose the method that works best for you.

## Method 1: Using Vercel Dashboard (Easiest - if using Vercel Postgres)

1. Go to your Vercel project dashboard
2. Navigate to the **Storage** tab
3. Click on your Postgres database
4. Go to the **Data** tab
5. You'll see a table browser where you can:
   - View all tables (`user_sessions`, `pre_survey_submissions`, `post_survey_submissions`, etc.)
   - Click on a table to see its data
   - Use the SQL editor to run custom queries

### Quick Queries in Vercel Dashboard:

**View all pre-surveys:**
```sql
SELECT * FROM pre_survey_submissions ORDER BY submitted_at DESC LIMIT 10;
```

**View all post-surveys:**
```sql
SELECT * FROM post_survey_submissions ORDER BY submitted_at DESC LIMIT 10;
```

**View linked pre/post surveys:**
```sql
SELECT * FROM user_survey_pairs;
```

**View qualitative responses (text answers):**
```sql
SELECT 
  id,
  session_id,
  responses->'page6_statement1' as what_stood_out,
  responses->'page6_statement2' as emotional_response,
  responses->'page6_statement3' as improvement_suggestions,
  responses->'page6_statement4' as would_interact_again
FROM post_survey_submissions
ORDER BY submitted_at DESC;
```

## Method 2: Using a Database Client (Recommended for Advanced Users)

### Option A: DBeaver (Free, Cross-platform)
1. Download from: https://dbeaver.io/
2. Create a new PostgreSQL connection
3. Use connection details from Vercel:
   - Host: From `POSTGRES_HOST` env variable
   - Port: 5432 (default)
   - Database: From `POSTGRES_DATABASE` env variable
   - Username: From `POSTGRES_USER` env variable
   - Password: From `POSTGRES_PASSWORD` env variable
4. Connect and browse tables

### Option B: pgAdmin (PostgreSQL Official Tool)
1. Download from: https://www.pgadmin.org/
2. Add a new server with your Vercel Postgres credentials
3. Browse and query your data

### Option C: TablePlus (Mac/Windows, Paid with Free Trial)
1. Download from: https://tableplus.com/
2. Create PostgreSQL connection
3. Enter your credentials

## Method 3: Using psql Command Line

1. Install PostgreSQL client tools (if not already installed)
2. Connect using your connection string:
   ```bash
   psql $POSTGRES_URL
   ```
   Or use individual parameters:
   ```bash
   psql -h $POSTGRES_HOST -U $POSTGRES_USER -d $POSTGRES_DATABASE
   ```

3. Run queries:
   ```sql
   -- List all tables
   \dt
   
   -- View pre-surveys
   SELECT * FROM pre_survey_submissions;
   
   -- View post-surveys
   SELECT * FROM post_survey_submissions;
   
   -- Exit
   \q
   ```

## Method 4: Using Supabase Studio (if using Supabase)

1. Go to your Supabase project dashboard
2. Click on **Table Editor** in the left sidebar
3. Browse your tables and data
4. Use **SQL Editor** for custom queries

## Method 5: Create a Simple Admin API Endpoint

You can create a simple API endpoint to view data. Create `api/view-surveys.js`:

```javascript
const { sql } = require('@vercel/postgres');

module.exports = async function handler(req, res) {
  // Add authentication here in production!
  
  try {
    const { type = 'all', limit = 50 } = req.query;
    
    let result;
    
    if (type === 'pre') {
      result = await sql`
        SELECT * FROM pre_survey_submissions 
        ORDER BY submitted_at DESC 
        LIMIT ${parseInt(limit)}
      `;
    } else if (type === 'post') {
      result = await sql`
        SELECT * FROM post_survey_submissions 
        ORDER BY submitted_at DESC 
        LIMIT ${parseInt(limit)}
      `;
    } else {
      // Get linked surveys
      result = await sql`
        SELECT * FROM user_survey_pairs 
        ORDER BY pre_submitted_at DESC 
        LIMIT ${parseInt(limit)}
      `;
    }
    
    res.status(200).json({ data: result.rows });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  }
};
```

Then access: `https://your-app.vercel.app/api/view-surveys?type=post&limit=10`

## Useful SQL Queries

### Count surveys
```sql
-- Count pre-surveys
SELECT COUNT(*) FROM pre_survey_submissions;

-- Count post-surveys
SELECT COUNT(*) FROM post_survey_submissions;

-- Count users who completed both
SELECT COUNT(*) FROM user_survey_pairs;
```

### View complete survey data for a session
```sql
SELECT 
  us.session_id,
  pre.responses as pre_responses,
  post.responses as post_responses,
  pre.submitted_at as pre_submitted_at,
  post.submitted_at as post_submitted_at,
  EXTRACT(EPOCH FROM (post.submitted_at - pre.submitted_at)) / 60 as minutes_between
FROM user_sessions us
LEFT JOIN pre_survey_submissions pre ON us.pre_survey_id = pre.id
LEFT JOIN post_survey_submissions post ON us.post_survey_id = post.id
WHERE us.session_id = 'your-session-id';
```

### Export data to CSV
```sql
-- In psql, you can export:
\copy (SELECT * FROM post_survey_submissions) TO '/path/to/file.csv' CSV HEADER;
```

### View qualitative responses nicely formatted
```sql
SELECT 
  session_id,
  submitted_at,
  responses->>'page6_statement1' as "What stood out?",
  responses->>'page6_statement2' as "Emotional response",
  responses->>'page6_statement3' as "Improvement suggestions",
  responses->>'page6_statement4' as "Would interact again?"
FROM post_survey_submissions
WHERE responses->>'page6_statement1' IS NOT NULL
ORDER BY submitted_at DESC;
```

## Getting Your Connection Details

### From Vercel Dashboard:
1. Go to your project → Settings → Environment Variables
2. Look for:
   - `POSTGRES_URL` (full connection string)
   - `POSTGRES_HOST`
   - `POSTGRES_USER`
   - `POSTGRES_PASSWORD`
   - `POSTGRES_DATABASE`

### From Vercel CLI:
```bash
vercel env pull .env.local
```

## Security Note

⚠️ **Important**: Never expose your database credentials publicly. If creating an admin endpoint, add authentication (API keys, password protection, etc.).

## Troubleshooting

### "Connection refused"
- Check your database is running
- Verify firewall settings allow your IP
- For Vercel Postgres, ensure you're using the correct connection string

### "Table does not exist"
- Run the `database-setup.sql` script
- Verify you're connected to the correct database

### "Permission denied"
- Check your database user has SELECT permissions
- Verify you're using the correct credentials

