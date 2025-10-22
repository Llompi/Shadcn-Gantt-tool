# Deployment Checklist

Use this checklist to ensure a smooth deployment to Vercel.

## Pre-Deployment

### Baserow Setup
- [ ] Baserow account created
- [ ] Tasks table created with required fields:
  - [ ] Name (Text)
  - [ ] Start Date (Date)
  - [ ] End Date (Date)
  - [ ] Status (Link to table or Single Select)
  - [ ] Optional: Group, Owner, Description, Progress
- [ ] Statuses table created with:
  - [ ] Name (Text)
  - [ ] Color (Text - hex codes)
- [ ] Sample statuses added (e.g., "To Do", "In Progress", "Done")
- [ ] Database token generated
- [ ] Table IDs noted (from URLs or API docs)

### Code Preparation
- [ ] All code committed to Git
- [ ] Code pushed to GitHub/GitLab/Bitbucket
- [ ] `.env.local` is NOT committed (check `.gitignore`)
- [ ] `vercel.json` is present
- [ ] Build succeeds locally: `npm run build`
- [ ] No TypeScript errors: `npm run type-check`
- [ ] No ESLint errors: `npm run lint`

## Vercel Setup

### Account & Project
- [ ] Vercel account created
- [ ] Project imported from Git repository
- [ ] Framework detected as Next.js
- [ ] Build settings correct:
  - Build Command: `npm run build`
  - Output Directory: `.next`
  - Install Command: `npm install`

### Environment Variables
Set these in Vercel dashboard (Settings → Environment Variables):

**Required:**
- [ ] `BASEROW_BASE_URL` = `https://api.baserow.io` (or your instance)
- [ ] `BASEROW_TOKEN` = Your database token
- [ ] `BASEROW_TABLE_ID_TASKS` = Your tasks table ID
- [ ] `BASEROW_TABLE_ID_STATUSES` = Your statuses table ID
- [ ] `DATA_PROVIDER` = `baserow`

**Optional:**
- [ ] `BASEROW_WEBHOOK_SECRET` = Random secret string (for webhook security)

**Environment Selection:**
- [ ] Variables added to Production
- [ ] Variables added to Preview (recommended)
- [ ] Variables added to Development (if using `vercel dev`)

## Deployment

### Initial Deploy
- [ ] First deployment triggered (automatic or manual)
- [ ] Build completed successfully
- [ ] No build errors in logs
- [ ] Deployment preview URL received

### Testing
- [ ] Visit homepage (`/`)
- [ ] Navigate to Gantt chart (`/gantt`)
- [ ] Tasks load correctly
- [ ] No console errors in browser
- [ ] Can create a new task
- [ ] Can drag/resize tasks
- [ ] Statuses display with colors
- [ ] API endpoints work:
  - [ ] `GET /api/tasks`
  - [ ] `POST /api/tasks`
  - [ ] `PATCH /api/tasks/[id]`
  - [ ] `GET /api/statuses`

### Webhook Setup (Optional but Recommended)
- [ ] Copy production URL from Vercel
- [ ] In Baserow, go to Tasks table → Webhooks
- [ ] Create new webhook:
  - [ ] URL: `https://your-app.vercel.app/api/webhooks/baserow`
  - [ ] Events: rows.created, rows.updated, rows.deleted
  - [ ] Header: `X-Webhook-Secret` = your secret (if using)
- [ ] Webhook marked as Active
- [ ] Test webhook:
  - [ ] Create/update/delete a task in Baserow
  - [ ] Check Vercel logs for webhook event
  - [ ] Verify Gantt updates after refresh

## Post-Deployment

### Production URL
- [ ] Production deployment successful
- [ ] Custom domain configured (if desired)
- [ ] HTTPS working (automatic with Vercel)
- [ ] DNS propagated (if using custom domain)

### Monitoring
- [ ] Check Vercel dashboard for any errors
- [ ] Review runtime logs for API calls
- [ ] Monitor for any failed requests
- [ ] Set up Vercel Analytics (optional, paid)

### Documentation
- [ ] Update team with production URL
- [ ] Document environment variables (securely)
- [ ] Share Baserow table structure with team
- [ ] Link to deployment docs in README

### Security
- [ ] Environment variables not exposed in client code
- [ ] Webhook secret configured (if using webhooks)
- [ ] Baserow token kept secure (not in code)
- [ ] `.env.local` in `.gitignore`

## Continuous Deployment

### Git Integration
- [ ] Automatic deployments enabled
- [ ] Production branch set (usually `main`)
- [ ] Preview deployments working for PRs
- [ ] Build notifications configured (optional)

### Branch Strategy
- [ ] Production branch: `main`
- [ ] Development branch: `develop` (optional)
- [ ] Feature branches create preview deployments

## Troubleshooting Checklist

If something goes wrong:

### Build Failures
- [ ] Check Vercel build logs
- [ ] Verify all dependencies in `package.json`
- [ ] Ensure `package-lock.json` is committed
- [ ] Test build locally: `npm run build`

### Runtime Errors
- [ ] Check Vercel runtime logs: `vercel logs`
- [ ] Verify environment variables are set
- [ ] Test API endpoints with curl/Postman
- [ ] Check Baserow token permissions

### Data Not Loading
- [ ] Verify Baserow token is valid
- [ ] Check table IDs are correct
- [ ] Test Baserow API directly
- [ ] Review field mapping in code
- [ ] Check browser console for errors

### Webhook Issues
- [ ] Verify webhook URL is correct
- [ ] Check webhook secret matches
- [ ] Look for webhook events in Vercel logs
- [ ] Test webhook with Baserow UI

## Rollback Plan

If deployment has critical issues:

- [ ] Note current deployment ID
- [ ] Find last working deployment
- [ ] Promote previous deployment to production:
  ```bash
  vercel promote <previous-deployment-url>
  ```
- [ ] Investigate issues in development
- [ ] Fix and redeploy

## Performance Checklist

### Optimization
- [ ] Images optimized (using Next.js Image if applicable)
- [ ] API responses reasonable (<2s)
- [ ] No unnecessary re-renders in React
- [ ] Pagination working for large datasets

### Monitoring
- [ ] Check function execution times
- [ ] Monitor bandwidth usage
- [ ] Review Vercel analytics (if available)

## Team Communication

- [ ] Announce deployment to team
- [ ] Share production URL
- [ ] Document known issues (if any)
- [ ] Schedule follow-up review

## Success Criteria

Your deployment is successful when:
- ✅ Application loads without errors
- ✅ Tasks fetch from Baserow
- ✅ Users can create/update/delete tasks
- ✅ Webhooks trigger updates (if configured)
- ✅ No console errors
- ✅ Performance is acceptable
- ✅ HTTPS working
- ✅ Team can access the application

---

## Notes Section

Use this space for deployment-specific notes:

**Deployment Date:** _______________

**Production URL:** _______________

**Baserow Instance:** _______________

**Issues Encountered:**
-
-
-

**Resolved By:**
-
-
-

**Team Notified:** [ ]

**Follow-up Actions:**
-
-
-

---

Congratulations on your deployment! 🎉
