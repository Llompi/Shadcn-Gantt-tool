# Quick Start: Deploy to Vercel Now

Your code is ready in the `main` branch! Follow these steps to connect and deploy.

## Step 1: Connect GitHub Repository to Vercel

### Option A: Via Vercel Dashboard (Easiest)

1. **Go to Vercel**
   - Visit: https://vercel.com/new
   - Sign in with your GitHub account (recommended)

2. **Import Git Repository**
   - Click "Add New..." → "Project"
   - You'll see "Import Git Repository"
   - Search for: `Shadcn-Gantt-tool`
   - Click "Import" next to your repository

3. **Configure Project**
   Vercel should auto-detect:
   - ✅ Framework Preset: **Next.js**
   - ✅ Root Directory: `./`
   - ✅ Build Command: `npm run build`
   - ✅ Output Directory: `.next`
   - ✅ Install Command: `npm install`

   If not detected, select "Next.js" from the Framework Preset dropdown.

4. **Add Environment Variables** (IMPORTANT!)

   Click "Environment Variables" and add these **one by one**:

   | Name | Value | Notes |
   |------|-------|-------|
   | `BASEROW_BASE_URL` | `https://api.baserow.io` | Or your Baserow instance URL |
   | `BASEROW_TOKEN` | `your_actual_token_here` | Get from Baserow settings |
   | `BASEROW_TABLE_ID_TASKS` | `12345` | Your tasks table ID |
   | `BASEROW_TABLE_ID_STATUSES` | `12346` | Your statuses table ID |
   | `DATA_PROVIDER` | `baserow` | Leave as-is |
   | `BASEROW_WEBHOOK_SECRET` | `random_secret_123` | Optional but recommended |

   **Where to find these values:**
   - **BASEROW_TOKEN**: Baserow → Settings → Database tokens → Create token
   - **Table IDs**: Look at Baserow table URL: `.../table/{TABLE_ID}/`

5. **Deploy!**
   - Click "Deploy" button
   - Wait 2-3 minutes for build to complete
   - You'll get a URL like: `shadcn-gantt-tool.vercel.app`

### Option B: Via Vercel CLI (Alternative)

```bash
# Install Vercel CLI globally
npm install -g vercel

# Login to Vercel
vercel login

# Deploy from main branch (make sure you're on main)
git checkout main
vercel

# Follow the prompts:
# - Set up and deploy? Y
# - Which scope? [Select your account]
# - Link to existing project? N (first time)
# - What's your project's name? shadcn-gantt-tool
# - In which directory is your code located? ./
# - Want to override settings? N

# Add environment variables
vercel env add BASEROW_BASE_URL production
# Enter: https://api.baserow.io

vercel env add BASEROW_TOKEN production
# Enter: your_token_here

vercel env add BASEROW_TABLE_ID_TASKS production
# Enter: your_table_id

vercel env add BASEROW_TABLE_ID_STATUSES production
# Enter: your_table_id

vercel env add DATA_PROVIDER production
# Enter: baserow

# Deploy to production
vercel --prod
```

## Step 2: Verify Deployment

Once deployed, you should see:

### In Vercel Dashboard:
- ✅ Deployment status: "Ready"
- ✅ Build logs show "Compiled successfully"
- ✅ Domain: Your project URL (e.g., `shadcn-gantt-tool.vercel.app`)

### Test Your Deployment:

1. **Visit the homepage**
   ```
   https://your-project.vercel.app
   ```
   You should see the landing page.

2. **Visit the Gantt chart**
   ```
   https://your-project.vercel.app/gantt
   ```
   You should see your tasks (or empty state if no tasks yet).

3. **Test API endpoints**
   ```bash
   # Check tasks API
   curl https://your-project.vercel.app/api/tasks

   # Check webhook health
   curl https://your-project.vercel.app/api/webhooks/baserow
   ```

## Step 3: Update Baserow Webhook (If Using Webhooks)

1. Go to your Baserow Tasks table
2. Click table menu → "Webhooks"
3. Edit your webhook (or create new one)
4. Update URL to:
   ```
   https://your-project.vercel.app/api/webhooks/baserow
   ```
5. Add header (if using webhook secret):
   - Name: `X-Webhook-Secret`
   - Value: Same as `BASEROW_WEBHOOK_SECRET` env var
6. Save

## Troubleshooting: No Deployments Showing

### If you don't see any deployments after clicking "Deploy":

1. **Check Build Logs**
   - In Vercel dashboard, click on your project
   - Click "Deployments" tab
   - If there's a deployment, click it to see logs
   - Look for errors in "Building" or "Runtime Logs"

2. **Common Issues:**

   **Missing Environment Variables**
   - Error: "Cannot read BASEROW_TOKEN..."
   - Fix: Add missing env vars in Settings → Environment Variables
   - Then: Redeploy (Deployments → ⋯ → Redeploy)

   **Build Failing**
   - Error: "Command failed: npm run build"
   - Fix: Check that build works locally: `npm run build`
   - Check: All dependencies in `package.json`

   **No Deployments Tab**
   - You might be on the wrong project
   - Check: Project name matches your repo
   - Or: Repository not connected - reconnect in Settings → Git

3. **Force a New Deployment**

   Make a small change and push:
   ```bash
   # Make a small change (add a comment)
   echo "# Trigger deployment" >> README.md

   # Commit and push
   git add README.md
   git commit -m "trigger: force Vercel deployment"
   git push origin main
   ```

   Vercel should automatically detect the push and deploy.

4. **Re-import Repository**

   If still no deployments:
   - Go to Vercel dashboard
   - Click your project → Settings → Git
   - Click "Disconnect"
   - Then: Import the repository again from vercel.com/new

## Step 4: Enable Automatic Deployments

Once the first deployment works:

1. **Production Deployments**
   - Every push to `main` = automatic production deployment
   - Vercel watches your GitHub repo

2. **Preview Deployments**
   - Every pull request = preview URL
   - Test changes before merging

3. **Branch Deployments**
   - Push to any branch = preview deployment
   - Great for feature testing

## What If Nothing Works?

### Check These in Order:

1. ✅ **Repository is public or Vercel has access**
   - GitHub: Settings → Integrations → Vercel
   - Grant access to your repository

2. ✅ **You're on the correct Vercel account/team**
   - Check account selector in top-right
   - Switch if needed

3. ✅ **Your package.json has all dependencies**
   ```bash
   # Test locally
   rm -rf node_modules package-lock.json
   npm install
   npm run build
   ```

4. ✅ **Environment variables are set correctly**
   - No extra spaces in values
   - Token is valid and not expired
   - Table IDs are numbers (no quotes in Vercel)

### Still Stuck?

1. **Share your deployment URL** - I can help debug
2. **Check Vercel Status** - https://www.vercel-status.com
3. **View detailed logs** - `vercel logs your-project.vercel.app`

## Success Checklist

Your deployment is successful when you can:

- [ ] Visit homepage without errors
- [ ] Navigate to `/gantt` and see UI
- [ ] See tasks loaded from Baserow (or empty state)
- [ ] Create a new task via UI
- [ ] Drag/resize tasks
- [ ] No errors in browser console
- [ ] API endpoints respond: `/api/tasks`, `/api/statuses`
- [ ] Webhook endpoint responds: `/api/webhooks/baserow`

## Next Steps After Deployment

1. **Add a Custom Domain** (Optional)
   - Vercel → Settings → Domains
   - Add your domain (e.g., `gantt.yourdomain.com`)
   - Update DNS records as instructed

2. **Enable Analytics** (Optional, Paid)
   - Vercel Analytics for performance monitoring
   - Real-time visitor tracking

3. **Set Up Alerts** (Optional)
   - Vercel → Settings → Notifications
   - Get notified of failed deployments

4. **Invite Team Members** (Pro Plan)
   - Collaborate on the project
   - Share deployment access

---

## Quick Reference: Common Commands

```bash
# Deploy to production
vercel --prod

# View deployment logs
vercel logs your-project.vercel.app

# List all deployments
vercel ls

# Check environment variables
vercel env ls

# Promote a deployment to production
vercel promote <deployment-url>

# Rollback to previous deployment
vercel rollback
```

---

**Need help?**
- Check [VERCEL_DEPLOYMENT.md](./VERCEL_DEPLOYMENT.md) for detailed guide
- Use [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md) for step-by-step checklist
- Open an issue on GitHub

Good luck with your deployment! 🚀
