# Vercel Deployment Guide - Supabase Integration

## ✅ Prerequisites

1. Database tables created in Supabase (run `database-setup.sql`)
2. Code updated locally with Supabase integration
3. Vercel account and project connected to your repository

---

## 🔧 Step 1: Set Environment Variables in Vercel

You need to add your Supabase credentials to Vercel's environment variables:

### Via Vercel Dashboard

1. Go to your Vercel project: https://vercel.com/dashboard
2. Click on your project
3. Go to **Settings** → **Environment Variables**
4. Add these three variables:

| Name | Value | Environments |
|------|-------|--------------|
| `SUPABASE_URL` | `https://enokfgiwbgianwblplcn.supabase.co` | Production, Preview, Development |
| `SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVub2tmZ2l3YmdpYW53YmxwbGNuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzMxMDA4OTYsImV4cCI6MjA0ODY3Njg5Nn0._e-EAUc8zRK509PkaUMTxODow-nozB54N2ExcYeKqU8` | Production, Preview, Development |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVub2tmZ2l3YmdpYW53YmxwbGNuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczMzEwMDg5NiwiZXhwIjoyMDQ4Njc2ODk2fQ.hAn2YOw__hWjfrXX6RGnhWs06Lb5vu0n9vWsxc7x14Q` | Production, Preview, Development |

### Via Vercel CLI (Alternative)

```bash
vercel env add SUPABASE_URL production
# Paste: https://enokfgiwbgianwblplcn.supabase.co

vercel env add SUPABASE_ANON_KEY production
# Paste your anon key

vercel env add SUPABASE_SERVICE_ROLE_KEY production
# Paste your service role key
```

---

## 🗑️ Step 2: Remove Old Vercel Postgres Variables (Optional)

If you previously had Vercel Postgres configured, you can remove these old variables:

- `POSTGRES_URL`
- `POSTGRES_URL_NON_POOLING`
- `POSTGRES_PRISMA_URL`
- `POSTGRES_USER`
- `POSTGRES_PASSWORD`
- `POSTGRES_HOST`
- `POSTGRES_DATABASE`

These are no longer needed with Supabase.

---

## 🚀 Step 3: Deploy to Vercel

### Option A: Push to Git (Automatic Deployment)

```bash
git add .
git commit -m "Migrate from Vercel Postgres to Supabase"
git push origin main
```

Vercel will automatically deploy when you push to your connected repository.

### Option B: Manual Deploy via CLI

```bash
vercel --prod
```

---

## 🧪 Step 4: Test the Deployment

1. Wait for deployment to complete
2. Get your production URL from Vercel dashboard
3. Open your production URL in browser
4. Submit a test survey
5. Check Supabase dashboard for new data: https://supabase.com/dashboard/project/enokfgiwbgianwblplcn/editor

---

## 🔍 Troubleshooting

### Error: "missing_connection_string"

**Cause:** Vercel environment variables not set or old code deployed

**Fix:**
1. Verify environment variables are set in Vercel dashboard
2. Ensure `package.json` doesn't have `@vercel/postgres` dependency
3. Redeploy: `vercel --prod --force`

### Error: "relation does not exist"

**Cause:** Database tables not created in Supabase

**Fix:**
1. Open Supabase SQL Editor: https://supabase.com/dashboard/project/enokfgiwbgianwblplcn/sql/new
2. Copy and run entire `database-setup.sql` file

### Error: "Invalid API key"

**Cause:** Wrong Supabase credentials in Vercel

**Fix:**
1. Double-check environment variables in Vercel match your `.env.local`
2. Verify keys haven't been regenerated in Supabase
3. Redeploy after fixing

### Deployment shows old code

**Cause:** Cached build or stale deployment

**Fix:**
```bash
vercel --prod --force
```

---

## 📊 Monitoring After Deployment

### Check Logs

**Vercel Logs:**
```bash
vercel logs --follow
```

Or in Vercel dashboard: **Deployments** → Click deployment → **Logs**

**Expected Success Log:**
```
✅ Survey saved to Supabase: 2025-11-20T21-53-35-123Z-abc123
```

**Supabase Logs:**
Go to: https://supabase.com/dashboard/project/enokfgiwbgianwblplcn/logs/postgres-logs

### Check Database

Verify data is being saved:
1. Go to Supabase dashboard
2. Click **Table Editor**
3. Check `user_sessions`, `pre_survey_submissions`, `post_survey_submissions`

---

## 🎯 Deployment Checklist

- [ ] Database tables created in Supabase
- [ ] `@vercel/postgres` removed from `package.json`
- [ ] Three Supabase environment variables set in Vercel
- [ ] Code committed and pushed to Git
- [ ] Deployment successful
- [ ] Test survey submitted on production URL
- [ ] Data appears in Supabase dashboard

---

## 🔐 Security Notes

### Environment Variables

- ✅ **SUPABASE_ANON_KEY**: Safe for client-side use (already public in your frontend)
- ⚠️ **SUPABASE_SERVICE_ROLE_KEY**: Server-side only, bypasses RLS - keep secret!

### Vercel Serverless Functions

Your `/api/submit-survey.js` runs server-side, so it's safe to use `SUPABASE_SERVICE_ROLE_KEY` there.

---

## 📈 Next Steps After Deployment

1. **Monitor Usage**: Check Supabase dashboard for usage metrics
2. **Set Up Row Level Security (RLS)**: Add RLS policies to protect data
3. **Backup Strategy**: Configure automated backups in Supabase
4. **Analytics**: Set up data analysis queries and dashboards

---

## 🆘 Need Help?

**Vercel Issues:**
- Vercel Dashboard: https://vercel.com/dashboard
- Vercel Docs: https://vercel.com/docs

**Supabase Issues:**
- Supabase Dashboard: https://supabase.com/dashboard/project/enokfgiwbgianwblplcn
- Supabase Docs: https://supabase.com/docs

**Code Issues:**
- Check local logs: `npm start` and test locally first
- Compare with `SUPABASE_SETUP.md` for local setup
