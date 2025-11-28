# Robot Tag Setup Guide

This guide explains how the `robot_tag` feature works and how to set it up for your control group ("happy" robot) branch.

## Overview

The `robot_tag` is a simple variable that identifies which version of the robot is being used in a session:
- **"sad"** - The experimental group (default, current branch)
- **"happy"** - The control group (for your other branch)

This tag is automatically included in all database records, allowing you to filter and compare data between the two groups.

## Code Changes Made

### 1. Frontend Files

**`js/survey.js`** (Line 4-6):
- Added `ROBOT_TAG` constant set to `'sad'`
- Included `robotTag` in survey submission data

**`index.html`** (Line 170-174):
- Added `ROBOT_TAG` constant (should match survey.js)
- Included `robotTag` when updating conversation ID

### 2. Backend API Files

**`api/submit-survey.js`**:
- Extracts `robotTag` from survey data (defaults to 'sad' if not provided)
- Saves `robot_tag` to `user_sessions` table when creating/updating sessions
- Saves `robot_tag` to `pre_survey_submissions` and `post_survey_submissions` tables

**`api/update-conversation-id.js`**:
- Accepts `robotTag` in request body
- Updates `robot_tag` in `user_sessions` table when updating conversation ID

### 3. Database Migration

**`database-migration-add-robot-tag.sql`**:
- Adds `robot_tag` column to:
  - `user_sessions` table
  - `pre_survey_submissions` table
  - `post_survey_submissions` table
- Creates indexes for better query performance
- Sets default value to 'sad' for existing records

## How to Set Up for Control Group ("Happy" Robot)

### Step 1: Update the Code

In your "happy" robot branch, change the `ROBOT_TAG` constant in **two places**:

1. **`js/survey.js`** (around line 5):
   ```javascript
   const ROBOT_TAG = 'happy';  // Changed from 'sad'
   ```

2. **`index.html`** (around line 172):
   ```javascript
   const ROBOT_TAG = 'happy';  // Changed from 'sad'
   ```

### Step 2: Run Database Migration

**IMPORTANT**: You only need to run the migration **once** in your Supabase database. It will work for both "sad" and "happy" tags.

1. Open Supabase SQL Editor: https://supabase.com/dashboard/project/[your-project-id]/sql/new
2. Copy the entire contents of `database-migration-add-robot-tag.sql`
3. Paste into the SQL Editor
4. Click "Run" to execute

The migration will:
- Add `robot_tag` columns to all relevant tables
- Create indexes for better query performance
- Set default values for existing records

## How It Works

1. **When a user starts a session:**
   - The `ROBOT_TAG` constant is included in survey submission data
   - When the first survey is submitted, a `user_sessions` record is created with the `robot_tag`

2. **When conversation ID is updated:**
   - The `robot_tag` is included in the update request
   - The `user_sessions` record is updated with both `conversation_id` and `robot_tag`

3. **When surveys are submitted:**
   - Both pre and post surveys include the `robot_tag` in their submission records
   - This allows you to filter surveys by robot type

## Querying Data by Robot Tag

Once the migration is run, you can query data filtered by robot tag:

### Get all sessions for "sad" robot:
```sql
SELECT * FROM user_sessions WHERE robot_tag = 'sad';
```

### Get all sessions for "happy" robot:
```sql
SELECT * FROM user_sessions WHERE robot_tag = 'happy';
```

### Compare survey responses between groups:
```sql
SELECT 
  robot_tag,
  COUNT(*) as total_surveys,
  AVG(duration) as avg_duration
FROM pre_survey_submissions
GROUP BY robot_tag;
```

### Get complete user journey with robot tag:
```sql
SELECT 
  us.session_id,
  us.robot_tag,
  us.conversation_id,
  pre.submitted_at as pre_survey_time,
  post.submitted_at as post_survey_time
FROM user_sessions us
LEFT JOIN pre_survey_submissions pre ON us.pre_survey_id = pre.id
LEFT JOIN post_survey_submissions post ON us.post_survey_id = post.id
WHERE us.robot_tag = 'sad';  -- or 'happy'
```

## Testing

1. **Test "sad" tag (current branch):**
   - Complete a survey session
   - Check Supabase dashboard - `robot_tag` should be 'sad' in all records

2. **Test "happy" tag (control branch):**
   - Switch to your "happy" robot branch
   - Change `ROBOT_TAG` to 'happy' in both files
   - Complete a survey session
   - Check Supabase dashboard - `robot_tag` should be 'happy' in all records

## Notes

- The `robot_tag` defaults to 'sad' if not provided (backward compatibility)
- Both branches can use the same database - the tag differentiates them
- The migration is safe to run multiple times (uses `IF NOT EXISTS`)
- Existing records will be set to 'sad' by default after migration

## Troubleshooting

**Issue**: `robot_tag` column doesn't exist error
- **Solution**: Run `database-migration-add-robot-tag.sql` in Supabase SQL Editor

**Issue**: All records show 'sad' even in happy branch
- **Solution**: Make sure you changed `ROBOT_TAG` in both `survey.js` AND `index.html`

**Issue**: Tag not appearing in database
- **Solution**: Check browser console for errors, verify API endpoints are receiving the tag

