# Demo Mode - Run Without Baserow

Don't have Baserow set up yet? No problem! The app includes a **demo mode** with sample data so you can:
- ✅ Test the Gantt chart UI immediately
- ✅ See how the app works before setting up Baserow
- ✅ Demo the app to stakeholders
- ✅ Develop locally without external dependencies

## Quick Start with Demo Mode

### 1. Set Environment Variable

**Option A: For Vercel Deployment**
1. Go to Vercel → Your Project → **Settings** → **Environment Variables**
2. Add **ONE** environment variable:
   ```
   Name: DATA_PROVIDER
   Value: demo
   ```
3. Deploy or redeploy your project

**Option B: For Local Development**
1. Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

2. Edit `.env.local` and set:
   ```env
   DATA_PROVIDER=demo
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Visit: http://localhost:3000/gantt

### 2. What You'll See

The demo includes 12 sample tasks across 5 phases:

- **Phase 1: Foundation** - Planning and design system
- **Phase 2: Backend** - Database and API development
- **Phase 3: Frontend** - UI components and authentication
- **Phase 4: Testing** - Integration tests and optimization
- **Phase 5: Launch** - Documentation, beta testing, deployment

Tasks have realistic:
- ✅ Start and end dates (relative to today)
- ✅ Status indicators (To Do, In Progress, Review, Done, Blocked)
- ✅ Team members (Alice, Bob, Charlie)
- ✅ Progress percentages
- ✅ Descriptions and groupings

### 3. Interactive Features

In demo mode, you can:

**✅ View the Gantt Chart**
- See all tasks in timeline view
- Navigate dates with Previous/Next/Today buttons
- View task details on hover

**✅ Create New Tasks**
- Click "Add Task" button
- Enter task name
- New task added to the chart

**✅ Move Tasks**
- Drag tasks to change dates
- Changes persist in-memory during the session

**✅ Resize Tasks**
- Drag task edges to adjust duration
- Updates start/end dates

**⚠️ Limitations in Demo Mode**
- Data resets on page refresh
- No database persistence
- No webhook support (demo only)
- Changes are session-only

## Demo Data Details

### Sample Statuses

| Status | Color | Use Case |
|--------|-------|----------|
| To Do | Gray | Tasks not started |
| In Progress | Blue | Currently working |
| Review | Amber | Awaiting review |
| Done | Green | Completed |
| Blocked | Red | Waiting on dependencies |

### Sample Tasks Timeline

```
Past          Today          Future
 ├─────────────┼─────────────────┤
 Done          In Progress       To Do
```

- 3 completed tasks (before today)
- 3 active tasks (around today)
- 6 future tasks (after today)

This gives you a realistic view of a project in progress!

## When to Use Demo Mode

### ✅ Perfect For:

1. **Initial Testing**
   - Just cloned the repo and want to see it work
   - Evaluating the tool before Baserow setup

2. **Local Development**
   - Baserow is on a remote server/network
   - Working offline or without internet

3. **Demonstrations**
   - Showing the tool to team/clients
   - Presenting without live data concerns

4. **UI Development**
   - Building new features without backend
   - Testing component changes quickly

### ❌ Not Recommended For:

1. **Production Use**
   - Data doesn't persist
   - No real database backing

2. **Real Project Management**
   - Changes lost on refresh
   - Can't share with team

3. **Multi-User Scenarios**
   - No collaboration features
   - Each user sees their own session

## Switching from Demo to Baserow

When you're ready to use real data:

### 1. Set Up Baserow

Follow the [Baserow Setup Guide](./BASEROW_SETUP.md)

### 2. Update Environment Variables

**Vercel:**
1. Settings → Environment Variables
2. Change `DATA_PROVIDER` from `demo` to `baserow`
3. Add Baserow credentials:
   ```
   BASEROW_BASE_URL=https://api.baserow.io
   BASEROW_TOKEN=your_actual_token
   BASEROW_TABLE_ID_TASKS=12345
   BASEROW_TABLE_ID_STATUSES=12346
   ```
4. Redeploy

**Local:**
Update `.env.local`:
```env
DATA_PROVIDER=baserow
BASEROW_BASE_URL=https://api.baserow.io
BASEROW_TOKEN=your_actual_token
BASEROW_TABLE_ID_TASKS=12345
BASEROW_TABLE_ID_STATUSES=12346
```

Restart: `npm run dev`

### 3. Migrate Demo Data (Optional)

Want to keep the demo tasks? Export them first:

1. **While in demo mode**, open browser console
2. Run:
   ```javascript
   // Fetch all tasks
   fetch('/api/tasks?all=true')
     .then(r => r.json())
     .then(data => {
       console.log(JSON.stringify(data.data, null, 2))
       // Copy this JSON
     })
   ```

3. **Switch to Baserow mode**

4. **Import to Baserow** manually or via CSV

## Customizing Demo Data

Want different sample data? Edit the demo provider:

### 1. Edit Sample Data

File: `data/sample/demo-data.ts`

```typescript
export const DEMO_TASKS: Task[] = [
  {
    id: "1",
    name: "Your Custom Task",
    startAt: new Date("2024-01-01"),
    endAt: new Date("2024-01-07"),
    status: DEMO_STATUSES[0],
    group: "Your Phase",
    owner: "Your Name",
    // ... etc
  },
  // Add more tasks...
]
```

### 2. Add More Statuses

```typescript
export const DEMO_STATUSES: TaskStatus[] = [
  {
    id: "6",
    name: "Custom Status",
    color: "#8b5cf6", // purple
  },
  // ... etc
]
```

### 3. Restart Server

```bash
npm run dev
```

Your custom data will appear!

## Loading Data from JSON

You can also load tasks from external JSON files:

### 1. Create JSON File

`data/custom-tasks.json`:
```json
[
  {
    "id": "1",
    "name": "Custom Task",
    "startAt": "2024-01-01",
    "endAt": "2024-01-07",
    "status": {
      "id": "1",
      "name": "To Do",
      "color": "#94a3b8"
    }
  }
]
```

### 2. Load in Provider

Modify `lib/providers/demo/demo-provider.ts`:

```typescript
import customTasks from "@/data/custom-tasks.json"

constructor() {
  this.loadTasksFromJSON(customTasks as Task[])
}
```

## Advanced: CSV Import (Future Feature)

We're planning to add CSV import functionality:

```csv
name,start,end,status,owner,group
Setup Project,2024-01-01,2024-01-07,Done,Alice,Phase 1
Build API,2024-01-08,2024-01-21,In Progress,Bob,Phase 2
```

This will allow you to:
- Import from Excel/Google Sheets
- Bulk load project data
- Migrate from other tools

**Coming soon!** Track progress: https://github.com/yourusername/repo/issues

## Troubleshooting Demo Mode

### Tasks Not Showing

**Check environment variable:**
```bash
# Should output: demo
echo $DATA_PROVIDER
```

**Verify in code:**
```javascript
// In browser console on /gantt page
fetch('/api/tasks')
  .then(r => r.json())
  .then(console.log)
```

Should show demo tasks.

### Getting Baserow Errors

**You're mixing demo and Baserow configs:**
- Either set `DATA_PROVIDER=demo` (no Baserow vars needed)
- Or set `DATA_PROVIDER=baserow` (with all Baserow vars)

**Don't mix them!**

### Changes Not Persisting

**This is expected!** Demo mode is in-memory only.

To persist data:
- Switch to Baserow mode
- Or implement custom persistence layer

## FAQ

**Q: Can I use demo mode in production?**
A: Not recommended. Data won't persist and will reset on deployment.

**Q: Can multiple users share demo data?**
A: No, each session has isolated data. Use Baserow for multi-user.

**Q: How do I export demo data?**
A: Use the browser console method above, or call `/api/tasks?all=true`

**Q: Can I customize the demo data?**
A: Yes! Edit `data/sample/demo-data.ts` and restart.

**Q: Does demo mode support webhooks?**
A: No, webhooks require a real backend (Baserow).

**Q: What about local Baserow instances?**
A: If Baserow is only accessible locally, use demo mode for Vercel deployments, and Baserow mode for local development.

## Next Steps

- ✅ **Try Demo Mode** - Get familiar with the UI
- 📖 **Read** [Baserow Setup Guide](./BASEROW_SETUP.md)
- 🚀 **Deploy** with demo mode first, add Baserow later
- 🔧 **Customize** demo data for your use case

---

**Pro Tip:** Start with demo mode on Vercel to show stakeholders, then switch to Baserow when ready for real project management!
