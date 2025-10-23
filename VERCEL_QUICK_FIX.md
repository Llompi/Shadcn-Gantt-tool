# Fix Your Vercel Deployment - 2 Minutes

Your Vercel project is set up, but you're seeing errors. Here's the fastest fix:

## The Problem

You're getting: `Environment Variable "BASEROW_BASE_URL" references Secret "@baserow_base_url", which does not exist.`

**This happens because:**
- The old `vercel.json` used `@secret` syntax (which requires creating secrets first)
- You added environment variables with `@` references instead of direct values

## The Solution (Choose One)

### Option 1: Use Demo Mode (Fastest - Works Immediately!)

**No Baserow needed! Get the app running in 30 seconds:**

1. **Go to Vercel** → Your Project → **Settings** → **Environment Variables**

2. **Delete ALL existing variables** (the ones with errors)

3. **Add ONE new variable:**
   ```
   Name: DATA_PROVIDER
   Value: demo
   ```
   - Select: ✅ Production, ✅ Preview, ✅ Development
   - Click "Save"

4. **Redeploy:**
   - Go to "Deployments" tab
   - Click "⋯" on the latest deployment → **"Redeploy"**
   - OR click **"Create Deployment"** → select `main` → Deploy

5. **Wait 2-3 minutes** for build to complete

6. **Visit your app:**
   ```
   https://your-project.vercel.app/gantt
   ```

**You'll see 12 sample tasks with a working Gantt chart! 🎉**

---

### Option 2: Use Baserow (For Production Data)

**If you have Baserow set up and want real data:**

1. **Go to Vercel** → Your Project → **Settings** → **Environment Variables**

2. **Delete ALL existing variables** (the ones with `@` references)

3. **Add these 5 variables** (paste values DIRECTLY, no `@` symbols):

   | Name | Value (direct, not @secret) |
   |------|---------------------------|
   | `DATA_PROVIDER` | `baserow` |
   | `BASEROW_BASE_URL` | `https://api.baserow.io` |
   | `BASEROW_TOKEN` | Paste your actual token (no `@`) |
   | `BASEROW_TABLE_ID_TASKS` | Paste your table ID (e.g., `12345`) |
   | `BASEROW_TABLE_ID_STATUSES` | Paste your table ID (e.g., `12346`) |

   **For each variable:**
   - Click "Add New"
   - Enter Name and Value (paste directly!)
   - Select: ✅ Production, ✅ Preview, ✅ Development
   - Click "Save"

4. **Redeploy** (same as Option 1, step 4)

5. **Visit your app** - you'll see your Baserow data!

---

## Why Did This Happen?

The `@secret_name` syntax in `vercel.json` is for Vercel's **secret management** feature, which requires:
1. Creating secrets via CLI: `vercel secrets add secret-name value`
2. Then referencing them with `@secret-name`

**But that's overkill for most projects!**

Instead, just:
- Add environment variables directly in the dashboard
- Paste values without any `@` symbols
- Let Vercel handle the encryption

## Verification

After redeploying, check:

✅ **Build succeeds** (no more secret errors)
✅ **Deployment shows "Ready"** (green checkmark)
✅ **Visit /gantt** and see the chart

### If Still Failing

Check build logs:
1. Click on the failed deployment
2. Look at "Building" logs
3. Share the error message for help

Common issues:
- Missing `DATA_PROVIDER` variable
- Typo in variable names (case-sensitive!)
- Wrong Baserow credentials (if using Baserow mode)

## What's Next?

### Using Demo Mode?

**Advantages:**
- ✅ Works immediately
- ✅ No external dependencies
- ✅ Great for testing/demos
- ✅ 12 realistic sample tasks

**Limitations:**
- ❌ Data resets on each deployment
- ❌ Changes don't persist
- ❌ Not for production

**When ready for real data:**
- Follow [Baserow Setup Guide](./docs/BASEROW_SETUP.md)
- Switch to Option 2 above

### Using Baserow?

**Next steps:**
1. Test the app with your data
2. Set up webhooks: [VERCEL_DEPLOYMENT.md](./docs/VERCEL_DEPLOYMENT.md#configuring-webhooks-for-production)
3. Optional: Add custom domain

## Still Stuck?

1. **Check these files are updated:**
   - `vercel.json` should NOT have any `@` references
   - Pull latest `main` branch: `git pull origin main`

2. **View detailed errors:**
   ```bash
   vercel logs your-project.vercel.app
   ```

3. **Re-import repository:**
   - Vercel → Settings → Git → Disconnect
   - Then import again from vercel.com/new

4. **Ask for help:**
   - Share your build logs
   - Mention which option you chose (demo or Baserow)

---

## Summary

**Fastest path to working deployment:**

```
1. Delete all environment variables with errors
2. Add: DATA_PROVIDER = demo
3. Redeploy
4. Visit /gantt
5. See working Gantt chart! 🎉
```

That's it! Your app will be live with sample data in under 3 minutes.

**Want real Baserow data later?** Just change `DATA_PROVIDER` to `baserow` and add the 4 Baserow variables. Easy!
