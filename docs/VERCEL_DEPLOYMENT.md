# Deploying to Vercel

This guide walks you through deploying the Gantt Project Manager to Vercel.

## Prerequisites

- A [Vercel account](https://vercel.com/signup) (free tier works)
- A [Baserow account](https://baserow.io/) with configured tables
- Your Baserow database token and table IDs

## Quick Deploy

The fastest way to deploy is using the Vercel CLI or dashboard.

### Option 1: Deploy via Vercel Dashboard (Recommended)

1. **Push your code to GitHub**
   ```bash
   git push origin main
   ```

2. **Import to Vercel**
   - Go to [vercel.com/new](https://vercel.com/new)
   - Click "Import Project"
   - Select your GitHub repository
   - Vercel will auto-detect Next.js

3. **Configure Environment Variables**

   Add these environment variables in the Vercel dashboard:

   | Variable | Value | Example |
   |----------|-------|---------|
   | `BASEROW_BASE_URL` | Your Baserow API URL | `https://api.baserow.io` |
   | `BASEROW_TOKEN` | Your database token | `your_token_here` |
   | `BASEROW_TABLE_ID_TASKS` | Tasks table ID | `12345` |
   | `BASEROW_TABLE_ID_STATUSES` | Statuses table ID | `12346` |
   | `DATA_PROVIDER` | Provider type | `baserow` |
   | `BASEROW_WEBHOOK_SECRET` | (Optional) Webhook secret | `random_secret_string` |

4. **Deploy**
   - Click "Deploy"
   - Wait for the build to complete (~2-3 minutes)
   - Your app will be live at `your-project.vercel.app`

### Option 2: Deploy via Vercel CLI

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**
   ```bash
   vercel login
   ```

3. **Deploy**
   ```bash
   vercel
   ```

   Follow the prompts:
   - Set up and deploy? **Y**
   - Which scope? Select your account
   - Link to existing project? **N** (first time)
   - What's your project's name? Enter a name
   - In which directory is your code located? `./`
   - Want to override settings? **N**

4. **Add Environment Variables**
   ```bash
   vercel env add BASEROW_BASE_URL
   vercel env add BASEROW_TOKEN
   vercel env add BASEROW_TABLE_ID_TASKS
   vercel env add BASEROW_TABLE_ID_STATUSES
   vercel env add DATA_PROVIDER
   ```

   For each command, select "Production" and enter the value.

5. **Deploy to Production**
   ```bash
   vercel --prod
   ```

## Setting Up Environment Variables in Vercel

### Via Dashboard

1. Go to your project in Vercel
2. Click "Settings" → "Environment Variables"
3. Add each variable:
   - **Name**: Variable name (e.g., `BASEROW_TOKEN`)
   - **Value**: The actual value
   - **Environment**: Select "Production", "Preview", and "Development"
4. Click "Save"

### Via CLI

```bash
# Production
vercel env add BASEROW_BASE_URL production
vercel env add BASEROW_TOKEN production

# Preview (for pull requests)
vercel env add BASEROW_BASE_URL preview
vercel env add BASEROW_TOKEN preview

# Development (for local dev with `vercel dev`)
vercel env add BASEROW_BASE_URL development
vercel env add BASEROW_TOKEN development
```

## Configuring Webhooks for Production

After deployment, update your Baserow webhook URL:

1. In Baserow, go to your Tasks table
2. Navigate to Webhooks
3. Edit your webhook
4. Update URL to: `https://your-project.vercel.app/api/webhooks/baserow`
5. Add header (if using webhook secret):
   - **Name**: `X-Webhook-Secret`
   - **Value**: Your `BASEROW_WEBHOOK_SECRET` value
6. Save the webhook

## Custom Domain

To use a custom domain:

1. Go to your project in Vercel
2. Click "Settings" → "Domains"
3. Click "Add Domain"
4. Enter your domain (e.g., `gantt.yourdomain.com`)
5. Follow the DNS configuration instructions
6. Update your Baserow webhook URL to use the custom domain

## Automatic Deployments

Vercel automatically deploys:
- **Production**: Every push to `main` branch
- **Preview**: Every push to other branches and pull requests

### Branch Configuration

You can configure which branch is production:

1. Go to "Settings" → "Git"
2. Set "Production Branch" to your preferred branch
3. Save

## Performance Optimizations

The project includes several Vercel optimizations:

### Enabled by Default

- ✅ **Edge Functions**: API routes run on Vercel's edge network
- ✅ **Automatic Caching**: Static assets are cached globally
- ✅ **Image Optimization**: Next.js Image component optimized
- ✅ **Code Splitting**: Automatic bundle optimization

### In vercel.json

- **Region**: Set to `iad1` (US East, change if needed)
- **No-Cache Headers**: API routes don't cache stale data
- **Next.js Detection**: Framework auto-detected

### Region Selection

To deploy to a different region, edit `vercel.json`:

```json
{
  "regions": ["sfo1"]  // San Francisco
}
```

Available regions:
- `iad1` - Washington, D.C., USA (default)
- `sfo1` - San Francisco, CA, USA
- `cdg1` - Paris, France
- `hnd1` - Tokyo, Japan
- And more: https://vercel.com/docs/edge-network/regions

## Monitoring and Logs

### View Deployment Logs

```bash
vercel logs your-project.vercel.app
```

Or in the dashboard:
1. Go to your project
2. Click "Deployments"
3. Click on a deployment
4. View "Building" and "Runtime Logs"

### Real-time Logs

```bash
vercel logs --follow
```

## Troubleshooting

### Build Fails

**Error: "Module not found"**
- Solution: Ensure all dependencies are in `package.json`
- Run: `npm install` locally and commit `package-lock.json`

**Error: "Environment variable not found"**
- Solution: Add missing environment variables in Vercel dashboard
- Redeploy after adding variables

### Runtime Errors

**Error: "Failed to fetch tasks"**
- Check environment variables are set correctly
- Verify `BASEROW_TOKEN` has access to tables
- Check Vercel logs: `vercel logs`

**Webhook not working**
- Verify webhook URL is correct in Baserow
- Check `BASEROW_WEBHOOK_SECRET` matches in both places
- View logs in Vercel dashboard

### Performance Issues

**Slow API responses**
- Consider adding caching layer (Redis, Vercel KV)
- Check Baserow API response times
- Monitor in Vercel Analytics (paid feature)

## Environment-Specific Configuration

### Development vs Production

Create different Baserow tables for each environment:

**Production:**
```
BASEROW_TABLE_ID_TASKS=12345
BASEROW_TABLE_ID_STATUSES=12346
```

**Preview/Development:**
```
BASEROW_TABLE_ID_TASKS=67890
BASEROW_TABLE_ID_STATUSES=67891
```

This prevents development changes from affecting production data.

## Advanced Configuration

### Preview Deployments

Every pull request gets a unique preview URL. Configure in `.github/workflows/preview.yml`:

```yaml
name: Preview Deployment
on: [pull_request]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
```

### Serverless Function Timeout

Vercel has a 10-second timeout for Hobby plan (60s for Pro).

If you need longer timeouts for large datasets:
1. Upgrade to Pro plan
2. Or implement pagination client-side
3. Or use Incremental Static Regeneration (ISR)

### Edge Functions

To run API routes on the edge (lower latency):

```typescript
// app/api/tasks/route.ts
export const runtime = 'edge'
```

Note: Not all Node.js APIs work on edge runtime. Test thoroughly.

## Security Best Practices

1. **Never commit `.env.local`** - Always use Vercel environment variables
2. **Use webhook secret** - Set `BASEROW_WEBHOOK_SECRET` to validate webhooks
3. **HTTPS only** - Vercel provides automatic HTTPS
4. **Rate limiting** - Consider adding rate limiting to API routes
5. **CORS** - Configure if you need cross-origin requests

## Cost Considerations

### Vercel Pricing

**Hobby (Free):**
- ✅ Perfect for personal projects
- ✅ Unlimited deployments
- ✅ 100 GB bandwidth/month
- ✅ Automatic HTTPS
- ⚠️ 10s function timeout
- ⚠️ No team collaboration

**Pro ($20/month):**
- ✅ 1 TB bandwidth/month
- ✅ 60s function timeout
- ✅ Team collaboration
- ✅ Advanced analytics
- ✅ Password protection

### Optimizing Costs

- Use static generation where possible
- Implement efficient caching
- Optimize images with Next.js Image component
- Use pagination for large datasets

## Rollback

If a deployment has issues:

```bash
# List deployments
vercel ls

# Promote a previous deployment to production
vercel promote <deployment-url>
```

Or in the dashboard:
1. Go to "Deployments"
2. Find the working deployment
3. Click "..." → "Promote to Production"

## Continuous Deployment

Every push triggers a deployment:

```bash
git add .
git commit -m "feat: add new feature"
git push origin main
```

Vercel automatically:
1. Detects the push
2. Runs `npm run build`
3. Deploys to production
4. Updates your domain

Preview URLs are created for branches and PRs automatically.

## Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Next.js on Vercel](https://vercel.com/docs/frameworks/nextjs)
- [Environment Variables](https://vercel.com/docs/environment-variables)
- [Serverless Functions](https://vercel.com/docs/serverless-functions/introduction)

## Support

If you encounter issues:
1. Check Vercel logs: `vercel logs`
2. Review [Vercel Status](https://www.vercel-status.com/)
3. Visit [Vercel Community](https://github.com/vercel/vercel/discussions)
4. Open an issue in this repository

---

Happy deploying! Your Gantt app will be live in minutes. 🚀
