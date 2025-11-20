# Supabase Integration Setup Guide

## ✅ Completed Steps

1. **Installed Dependencies**
   - `@supabase/supabase-js` package installed

2. **Environment Configuration**
   - `.env.local` created with Supabase credentials
   - `.gitignore` updated to exclude `.env.local`

3. **Code Integration**
   - `lib/supabaseClient.js` - Reusable Supabase client helper
   - `api/submit-survey.js` - Updated to use Supabase
   - `server.js` - Updated with Supabase + JSON fallback

## ⚠️ Required: Manual Database Setup

**You need to run the database setup SQL manually in Supabase:**

### Option 1: Supabase Dashboard (Recommended)
1. Open Supabase SQL Editor: https://supabase.com/dashboard/project/enokfgiwbgianwblplcn/sql/new
2. Copy the entire contents of `database-setup.sql`
3. Paste into the SQL Editor
4. Click "Run" to execute

### Option 2: Supabase CLI (if installed)
```bash
supabase db push
```

## 🧪 Testing the Integration

### Start the Local Server
```bash
npm start
# or
node server.js
```

The server will:
- Try to save to Supabase first
- Fallback to JSON files if Supabase fails
- Log which storage method was used

### Test Survey Submission

1. Open http://localhost:3000 in your browser
2. Complete a pre-survey
3. Check server console for: `✅ Survey saved to Supabase: [ID]`
4. Verify data in Supabase dashboard: https://supabase.com/dashboard/project/enokfgiwbgianwblplcn/editor

### Verify Data Storage

**Supabase Dashboard:**
- Tables: https://supabase.com/dashboard/project/enokfgiwbgianwblplcn/editor
- Check these tables:
  - `user_sessions`
  - `pre_survey_submissions`
  - `pre_survey_responses`
  - `post_survey_submissions`
  - `post_survey_responses`

**Local Fallback:**
- If Supabase fails, check `data/survey-responses.json`
- Server will log: `📁 Survey saved to JSON file: [filename]`

## 📊 Database Schema

### Tables Created
- `user_sessions` - Links pre/post surveys via session_id
- `pre_survey_submissions` - Pre-survey master records
- `pre_survey_responses` - Individual scale responses (normalized)
- `post_survey_submissions` - Post-survey master records
- `post_survey_responses` - Individual scale responses (normalized)

### Views Available
- `pre_survey_summary` - Aggregated pre-survey statistics
- `post_survey_summary` - Aggregated post-survey statistics
- `user_survey_pairs` - Links pre/post surveys with timing data

## 🔑 Environment Variables

Your `.env.local` file contains:
```
SUPABASE_URL=https://enokfgiwbgianwblplcn.supabase.co
SUPABASE_ANON_KEY=[your-anon-key]
SUPABASE_SERVICE_ROLE_KEY=[your-service-key]
```

## 🚀 Deployment to Vercel

When deploying to Vercel:

1. Add environment variables in Vercel dashboard:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`

2. Deploy as usual - serverless function will work automatically

## 🔍 Troubleshooting

### "relation does not exist" error
- You need to run `database-setup.sql` in Supabase dashboard
- Tables haven't been created yet

### "Supabase error, falling back to JSON files"
- Check `.env.local` exists and has correct credentials
- Verify database tables exist
- Server will continue working with JSON files as fallback

### No data appearing in Supabase
- Check server console for error messages
- Verify `database-setup.sql` was run successfully
- Check Supabase dashboard for table permissions

## 📈 Data Analysis

### Query Examples

**Get all pre-survey submissions:**
```sql
SELECT * FROM pre_survey_submissions ORDER BY submitted_at DESC;
```

**Get average responses by page:**
```sql
SELECT page_number, AVG(response_value) as avg_response
FROM pre_survey_responses
GROUP BY page_number
ORDER BY page_number;
```

**Link pre/post surveys:**
```sql
SELECT * FROM user_survey_pairs WHERE post_survey_id IS NOT NULL;
```

## 🎯 Next Steps

1. Run `database-setup.sql` in Supabase (REQUIRED)
2. Start server: `npm start`
3. Test survey submission
4. Verify data in Supabase dashboard
5. Deploy to Vercel (optional)
