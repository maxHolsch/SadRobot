# PostgreSQL Database Setup Guide

This guide explains how to set up PostgreSQL for the survey system on Vercel.

## Prerequisites

1. A Vercel account
2. A Vercel Postgres database (or external PostgreSQL database)

## Option 1: Using Vercel Postgres (Recommended)

### Step 1: Create Vercel Postgres Database

1. Go to your Vercel project dashboard
2. Navigate to the **Storage** tab
3. Click **Create Database** → Select **Postgres**
4. Choose a name for your database (e.g., `sad-robot-db`)
5. Select a region close to your users
6. Click **Create**

### Step 2: Connect to Your Database

Vercel automatically provides connection environment variables:
- `POSTGRES_URL`
- `POSTGRES_PRISMA_URL`
- `POSTGRES_URL_NON_POOLING`
- `POSTGRES_USER`
- `POSTGRES_HOST`
- `POSTGRES_PASSWORD`
- `POSTGRES_DATABASE`

These are automatically available in your serverless functions when using `@vercel/postgres`.

### Step 3: Run Database Schema

1. **Using Vercel Dashboard:**
   - Go to your project → Storage → Postgres
   - Click on your database
   - Go to the **Data** tab
   - Click **Query** or use the SQL editor
   - Copy and paste the contents of `database-setup.sql`
   - Execute the script

2. **Using Vercel CLI:**
   ```bash
   # Install Vercel CLI if not already installed
   npm i -g vercel
   
   # Link your project
   vercel link
   
   # Connect to your database (if using external PostgreSQL)
   # Or use the Vercel Postgres connection string
   ```

3. **Using psql (for external PostgreSQL):**
   ```bash
   psql $POSTGRES_URL < database-setup.sql
   ```

## Option 2: Using External PostgreSQL (Supabase, Railway, etc.)

### Step 1: Get Connection String

Get your PostgreSQL connection string from your provider:
- **Supabase**: Project Settings → Database → Connection String
- **Railway**: Database → Connect → Connection String
- **Other providers**: Check their documentation

### Step 2: Set Environment Variables in Vercel

1. Go to your Vercel project → Settings → Environment Variables
2. Add the following variables:
   - `POSTGRES_URL`: Your full PostgreSQL connection string
   - `POSTGRES_USER`: Database username
   - `POSTGRES_PASSWORD`: Database password
   - `POSTGRES_HOST`: Database host
   - `POSTGRES_DATABASE`: Database name

### Step 3: Run Database Schema

Use your database provider's SQL editor or connect via psql:
```bash
psql $POSTGRES_URL < database-setup.sql
```

## Database Schema

The database consists of separate tables for pre and post surveys, linked by user sessions:

### `user_sessions`
Links pre and post surveys from the same user:
- `session_id`: Unique session identifier (stored in browser localStorage)
- `created_at`: When the session was created
- `pre_survey_id`: Reference to the pre-survey submission
- `post_survey_id`: Reference to the post-survey submission

### `pre_survey_submissions`
Stores complete pre-survey submission records:
- `id`: Unique submission ID
- `session_id`: Links to `user_sessions` table
- `submitted_at`: Timestamp when survey was submitted
- `duration`: Time taken to complete survey (milliseconds)
- `user_agent`: Browser user agent string
- `responses`: JSON object with all responses
- `page_data`: JSON array with page structure and responses
- `created_at`: Record creation timestamp

### `pre_survey_responses`
Stores individual pre-survey scale responses (1-5) for easier querying:
- `id`: Auto-incrementing primary key
- `submission_id`: Foreign key to `pre_survey_submissions`
- `page_number`: Page number (1-5)
- `statement`: The statement text
- `response_value`: Response value (1-5)
- `created_at`: Record creation timestamp

### `post_survey_submissions`
Stores complete post-survey submission records (includes qualitative text responses):
- `id`: Unique submission ID
- `session_id`: Links to `user_sessions` table
- `submitted_at`: Timestamp when survey was submitted
- `duration`: Time taken to complete survey (milliseconds)
- `user_agent`: Browser user agent string
- `responses`: JSON object with all responses (includes text responses about the interaction)
- `page_data`: JSON array with page structure and responses
- `created_at`: Record creation timestamp

### `post_survey_responses`
Stores individual post-survey scale responses (1-5) for easier querying:
- `id`: Auto-incrementing primary key
- `submission_id`: Foreign key to `post_survey_submissions`
- `page_number`: Page number (1-6, includes qualitative questions page)
- `statement`: The statement text
- `response_value`: Response value (1-5)
- `created_at`: Record creation timestamp

**Note**: Text responses (qualitative questions) are stored in the JSONB `responses` and `page_data` columns, not in the `*_survey_responses` tables. The `*_survey_responses` tables only contain scale responses (1-5).

## Querying Data

### Get all pre-survey submissions
```sql
SELECT * FROM pre_survey_submissions ORDER BY submitted_at DESC;
```

### Get all post-survey submissions
```sql
SELECT * FROM post_survey_submissions ORDER BY submitted_at DESC;
```

### Link pre and post surveys for the same user
```sql
SELECT * FROM user_survey_pairs ORDER BY pre_submitted_at DESC;
```

### Get a user's complete survey data (pre + post)
```sql
SELECT 
  us.session_id,
  pre.responses as pre_responses,
  post.responses as post_responses,
  pre.submitted_at as pre_submitted_at,
  post.submitted_at as post_submitted_at
FROM user_sessions us
LEFT JOIN pre_survey_submissions pre ON us.pre_survey_id = pre.id
LEFT JOIN post_survey_submissions post ON us.post_survey_id = post.id
WHERE us.session_id = 'your-session-id';
```

### Get pre-survey submission with all scale responses
```sql
SELECT 
  s.*,
  json_agg(r.*) as scale_responses
FROM pre_survey_submissions s
LEFT JOIN pre_survey_responses r ON s.id = r.submission_id
WHERE s.id = 'your-submission-id'
GROUP BY s.id;
```

### Get post-survey qualitative responses (text answers)
```sql
SELECT 
  id,
  session_id,
  responses->'page6_statement1' as what_stood_out,
  responses->'page6_statement2' as emotional_response,
  responses->'page6_statement3' as improvement_suggestions,
  responses->'page6_statement4' as would_interact_again
FROM post_survey_submissions
WHERE session_id = 'your-session-id';
```

### Get average response per statement (pre-survey)
```sql
SELECT 
  statement,
  AVG(response_value) as avg_response,
  COUNT(*) as response_count
FROM pre_survey_responses
GROUP BY statement
ORDER BY avg_response DESC;
```

### Get average response per statement (post-survey)
```sql
SELECT 
  statement,
  AVG(response_value) as avg_response,
  COUNT(*) as response_count
FROM post_survey_responses
GROUP BY statement
ORDER BY avg_response DESC;
```

### Use the summary views
```sql
-- Pre-survey summary
SELECT * FROM pre_survey_summary ORDER BY submitted_at DESC;

-- Post-survey summary
SELECT * FROM post_survey_summary ORDER BY submitted_at DESC;
```

## Troubleshooting

### Error: "relation does not exist"
- Make sure you've run the `database-setup.sql` script
- Verify you're connected to the correct database

### Error: "Connection refused"
- Check your environment variables in Vercel
- Verify your database is accessible from Vercel's IP ranges
- For external databases, ensure your firewall allows Vercel's IPs

### Error: "Authentication failed"
- Verify your `POSTGRES_USER` and `POSTGRES_PASSWORD` are correct
- Check that your database user has the necessary permissions

## Local Development

For local development, you can use:
1. **Docker PostgreSQL:**
   ```bash
   docker run --name postgres -e POSTGRES_PASSWORD=password -p 5432:5432 -d postgres
   ```

2. **Local .env file:**
   Create a `.env` file with:
   ```
   POSTGRES_URL=postgresql://user:password@localhost:5432/sadrobot
   ```

3. Run the schema:
   ```bash
   psql $POSTGRES_URL < database-setup.sql
   ```

## Notes

- The `@vercel/postgres` package automatically handles connection pooling
- JSONB columns allow for flexible querying of nested data
- Indexes are created for common query patterns
- The `survey_responses` table uses CASCADE delete, so deleting a submission removes all related responses

