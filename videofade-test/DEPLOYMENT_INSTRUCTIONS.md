# Deployment Instructions - Conversation ID Linking

## ✅ What We Fixed

We successfully found the conversation ID! It's stored in `conversation.connection.conversationId` and is now being extracted correctly:

```
Conversation ID: conv_9301kavr77jrfs4b1fdcqmsabn09
```

## 🚀 Deploy to Vercel

The API endpoint `/api/update-conversation-id` needs to be deployed to Vercel.

### Option 1: Deploy via Vercel CLI (Recommended)

```bash
cd /Users/alrightsettledownwethroughtoday/Desktop/Coding/AffectiveComputing/SadRobotDemo/SadRobot/videofade-test

# Deploy to Vercel
vercel --prod
```

### Option 2: Deploy via Git Push

If your project is connected to Git and Vercel auto-deploys:

```bash
git add api/update-conversation-id.js
git add server.js index.html
git commit -m "Add conversation ID linking functionality"
git push
```

Vercel will automatically deploy the changes.

### Option 3: Drag & Drop (Vercel Dashboard)

1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Find your project
3. Go to "Settings" → "Git" → "Production Branch"
4. Or use "Import Project" → drag your folder

## 🧪 After Deployment - Test It

1. **Wait for deployment** to complete (usually 1-2 minutes)
2. **Clear browser cache** or hard refresh (Cmd+Shift+R / Ctrl+Shift+F5)
3. **Start a new conversation** with the Sad Robot
4. **Check the browser console** - You should see:
   ```
   Final extracted Conversation ID: conv_xxxxxxxxxxxxx
   ✅ Conversation ID stored successfully
   ```

## 🔍 Verify in Database

After a successful conversation, query your Supabase database:

```sql
SELECT
  session_id,
  conversation_id,
  pre_survey_id,
  post_survey_id
FROM user_sessions
WHERE conversation_id IS NOT NULL
ORDER BY created_at DESC
LIMIT 5;
```

You should see the conversation ID populated!

## 📊 Retrieve Full Conversation Data

Once you have the conversation ID, you can fetch the full transcript from ElevenLabs:

```bash
curl -X GET \
  "https://api.elevenlabs.io/v1/convai/conversations/conv_9301kavr77jrfs4b1fdcqmsabn09" \
  -H "xi-api-key: YOUR_ELEVENLABS_API_KEY"
```

Or use the query examples in [query-examples.sql](query-examples.sql) to link conversation IDs with survey responses.

## 🐛 Troubleshooting

### Issue: Still getting 404 error

**Solution**: Make sure you deployed to Vercel. The local server won't work because your app is hosted on Vercel.

### Issue: "Conversation ID is null"

**Solution**: This shouldn't happen anymore since we found it in `conversation.connection.conversationId`. If it does, check the browser console for the debug logs.

### Issue: "Failed to update conversation ID"

**Solution**: Check that your Supabase environment variables are set in Vercel:
- Go to Vercel Dashboard → Your Project → Settings → Environment Variables
- Verify `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are set

## ✨ Success Indicators

When everything is working, you'll see:

1. **Browser Console**:
   ```
   Voice agent connected
   Connection object keys: [...'conversationId'...]
   Final extracted Conversation ID: conv_xxxxxxxxxxxxx
   ✅ Conversation ID stored successfully
   ```

2. **Database**:
   - `conversation_id` field is populated in `user_sessions` table
   - Can query linked survey + conversation data

3. **No Errors**:
   - No 404 errors
   - No "Conversation ID is null" warnings

## 📝 Next Steps

After deployment works:

1. Complete a full user flow (pre-survey → conversation → post-survey)
2. Query the linked data using [query-examples.sql](query-examples.sql)
3. Fetch conversation transcripts from ElevenLabs API
4. Analyze the relationship between conversations and survey responses

---

**Need Help?**

If you encounter issues, check:
- Vercel deployment logs
- Browser console (F12)
- Supabase logs
- Network tab in DevTools
