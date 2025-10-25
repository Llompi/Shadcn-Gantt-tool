# Gantt Project Manager

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/Llompi/Shadcn-Gantt-tool)

A modern, flexible Gantt chart tool built with Next.js, shadcn/ui, and Tailwind CSS. Transform your Baserow databases into powerful project management tools with visual Gantt charts, real-time updates via webhooks, and a clean, intuitive interface.

## Deployment Modes

This project officially supports **two distinct deployment strategies** to meet different use cases:

### 🚀 Easy Mode (API Connector)
**Best for:** Rapid prototyping, demos, public projects, and general use cases

- Connect to an existing Baserow or PostgreSQL instance via API
- **UI-based configuration**: Adjust connection settings live through the interface
  - Edit Baserow API credentials without redeploying
  - Switch between workspaces, tables, and views on-the-fly
  - Test connections and browse available data sources
- **Flexible demo data**: Use built-in samples, upload CSV/JSON files, or connect to live data
- Quick deployment to Vercel, Netlify, or similar platforms
- Minimal infrastructure requirements
- Perfect for getting started quickly

**[Quick Start Guide](#getting-started)** | **[Deploy to Vercel](#deploy-to-vercel-recommended)** | **[Demo Mode Guide](./docs/DEMO_MODE.md)**

### 🔒 Install Mode (Secure Self-Hosted)
**Best for:** Sensitive data, CUI/CMMC compliance, air-gapped environments

- Self-contained Docker Compose deployment
- All services run in an isolated, secure environment
- Direct database connections (no external APIs)
- FIPS-compliant components available
- Designed for Windows environments with BitLocker encryption

**[Secure Deployment Guide](./docs/CMMC_DEPLOYMENT.md)** *(Coming Soon)*

---

## Features

- **Multiple Data Providers**:
  - **Baserow**: Connect to Baserow via API for no-code database management
  - **PostgreSQL**: Direct database connection with full SQL power and control (NEW in v1.1.0)
  - **Demo Mode**: Built-in sample data for quick testing and evaluation
- **UI-Based Configuration** (NEW in v1.1.0):
  - Visual configuration interface at `/config`
  - Live connection testing and validation
  - Baserow workspace/table/view browser
  - Field inspector for mapping
  - No need to edit .env files manually
- **API-Adapter Architecture**: Agnostic design allows easy switching between data providers
- **Flexible Data Sources**:
  - Connect to Baserow or PostgreSQL databases
  - Use built-in demo data for testing
  - CSV/JSON file upload support (coming in v1.2.0)
- **Server-Side Security**: All database credentials and API tokens are kept server-side, never exposed to the browser
- **Real-time Updates**: Webhook support for instant synchronization when data changes in Baserow
- **Drag & Drop**: Intuitive task manipulation with drag-to-move and resize handles
- **Responsive Design**: Built with Tailwind CSS and shadcn/ui for a modern, accessible UI
- **Type-Safe**: Full TypeScript support with strict mode enabled
- **Field Mapping**: Configurable field mapping to adapt to your evolving database schema

## Architecture

```
┌─────────────┐      ┌──────────────┐      ┌─────────────┐
│   Browser   │─────▶│  Next.js API │─────▶│   Baserow   │
│  (Gantt UI) │◀─────│   Routes     │◀─────│     API     │
└─────────────┘      └──────────────┘      └─────────────┘
                             │
                             │ Webhooks
                             ▼
                     ┌──────────────┐
                     │ Cache/Notify │
                     └──────────────┘
```

- **Frontend**: React-based Gantt UI components from shadcn
- **API Layer**: Next.js App Router API routes (server-side only)
- **Data Provider**: Pluggable adapter pattern (currently Baserow, extensible to Postgres)
- **Webhooks**: Real-time event receiver for database changes

## Prerequisites

- Node.js 18+ and npm/pnpm
- One of the following data sources:
  - **Demo Mode**: No setup required
  - **Baserow**: A Baserow account (free tier works fine)
  - **PostgreSQL**: PostgreSQL 12+ database (see [PostgreSQL Setup Guide](./docs/POSTGRES_SETUP.md))
- Basic knowledge of Next.js and React

## Getting Started

### 1. Clone the repository

```bash
git clone <repository-url>
cd Shadcn-Gantt-tool
```

### 2. Install dependencies

```bash
npm install
# or
pnpm install
```

### 3. Choose Your Data Provider

You can choose one of three data providers:

#### Option A: Demo Mode (Quickest)
No setup required! Just set `DATA_PROVIDER=demo` in `.env.local` and skip to step 4.

#### Option B: Baserow (Easy Mode)
Perfect for no-code database management. Follow the Baserow setup below.

#### Option C: PostgreSQL (Install Mode)
For maximum control and performance. See the [PostgreSQL Setup Guide](./docs/POSTGRES_SETUP.md).

### 3a. Set up Baserow (Optional)

#### Create your tables

You'll need two tables in Baserow:

**Tasks Table** (customize field names as needed):
- `Name` (Text) - Task name
- `Start Date` (Date) - When the task starts
- `End Date` (Date) - When the task ends
- `Status` (Link to Status table or Single Select) - Current status
- `Group` (Text, optional) - Task grouping
- `Owner` (Text, optional) - Task owner
- `Description` (Long Text, optional) - Task details
- `Progress` (Number, optional) - Completion percentage

**Statuses Table**:
- `Name` (Text) - Status name (e.g., "To Do", "In Progress", "Done")
- `Color` (Text) - Hex color code (e.g., "#3b82f6")

#### Get your Database Token

1. Go to your Baserow account settings
2. Navigate to "Database tokens" or "API tokens"
3. Create a new token with access to your tables
4. Copy the token (keep it secure!)

#### Find your Table IDs

1. Open your table in Baserow
2. Look at the URL: `https://baserow.io/database/{workspace}/table/{TABLE_ID}/`
3. Note the Table IDs for both Tasks and Statuses tables

#### Useful Baserow API Resources

- **REST API Docs**: Available at `https://api.baserow.io/api/redoc/`
- **Per-Table API Docs**: Click "View API documentation" in your table's context menu
- **OpenAPI Spec**: `https://api.baserow.io/api/redoc/` provides interactive docs

### 4. Configure environment variables

#### Quick Configuration (UI Method - Recommended)

1. Start the dev server: `npm run dev`
2. Navigate to [http://localhost:3000/config](http://localhost:3000/config)
3. Select your provider type (Demo, Baserow, or PostgreSQL)
4. Enter your connection details
5. Test the connection
6. Copy the generated environment variables to `.env.local`

#### Manual Configuration

Copy the example environment file:

```bash
cp .env.example .env.local
```

**For Demo Mode:**
```env
DATA_PROVIDER=demo
```

**For Baserow:**
```env
DATA_PROVIDER=baserow
BASEROW_BASE_URL=https://api.baserow.io
BASEROW_TOKEN=your_database_token_here
BASEROW_TABLE_ID_TASKS=12345
BASEROW_TABLE_ID_STATUSES=12346
BASEROW_WEBHOOK_SECRET=your_webhook_secret_here  # Optional
```

**For PostgreSQL:**
```env
DATA_PROVIDER=postgres
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=gantt_db
POSTGRES_USER=gantt_user
POSTGRES_PASSWORD=your_secure_password
POSTGRES_SSL=false  # Set to true for production
```

See [PostgreSQL Setup Guide](./docs/POSTGRES_SETUP.md) for detailed PostgreSQL configuration.

### 5. Customize field mapping (if needed)

If your Baserow field names differ from the defaults, update the mapping in:

```typescript
// lib/providers/baserow/field-mapping.ts

export const DEFAULT_FIELD_MAPPING: BaserowFieldMapping = {
  tasks: {
    id: "id",
    name: "Name",           // Change to match your field name
    startAt: "Start Date",  // Change to match your field name
    endAt: "End Date",      // Change to match your field name
    // ... etc
  },
  // ...
}
```

### 6. Run the development server

```bash
npm run dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to see the home page, then navigate to [http://localhost:3000/gantt](http://localhost:3000/gantt) to view your Gantt chart.

## Deployment

### Deploy to Vercel (Recommended)

The easiest way to deploy this application is using [Vercel](https://vercel.com):

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/Shadcn-Gantt-tool)

#### Quick Deploy Steps:

1. **Click the "Deploy" button above** or go to [vercel.com/new](https://vercel.com/new)

2. **Import your repository** - Vercel will auto-detect Next.js

3. **Add Environment Variables** in the Vercel dashboard:
   ```
   BASEROW_BASE_URL=https://api.baserow.io
   BASEROW_TOKEN=your_database_token_here
   BASEROW_TABLE_ID_TASKS=12345
   BASEROW_TABLE_ID_STATUSES=12346
   DATA_PROVIDER=baserow
   BASEROW_WEBHOOK_SECRET=your_webhook_secret_here
   ```

4. **Click Deploy** - Your app will be live in ~2 minutes at `your-project.vercel.app`

5. **Update Baserow Webhook URL** to `https://your-project.vercel.app/api/webhooks/baserow`

📖 **Detailed Instructions**: See [VERCEL_DEPLOYMENT.md](./docs/VERCEL_DEPLOYMENT.md) for complete deployment guide

✅ **Deployment Checklist**: Use [DEPLOYMENT_CHECKLIST.md](./docs/DEPLOYMENT_CHECKLIST.md) to ensure nothing is missed

#### Why Vercel?

- ✅ **Zero Configuration**: Automatic Next.js detection
- ✅ **Free Tier**: Perfect for personal projects
- ✅ **Automatic HTTPS**: SSL certificates included
- ✅ **Edge Network**: Fast global performance
- ✅ **Preview Deployments**: Every PR gets a preview URL
- ✅ **Environment Variables**: Secure credential management

### Other Deployment Options

This Next.js app can also be deployed to:
- **Docker**: Create a `Dockerfile` with `node:18-alpine` base
- **Netlify**: Similar to Vercel with automatic detection
- **Railway**: One-click deploy with database hosting
- **Self-hosted**: Use `npm run build && npm start`

See the [Next.js deployment documentation](https://nextjs.org/docs/deployment) for more options.

## Setting up Webhooks (Optional)

Webhooks enable real-time updates when data changes in Baserow.

### Configure Baserow Webhook

1. In Baserow, go to your Tasks table
2. Click the table dropdown menu → "Webhooks"
3. Click "Create webhook"
4. Configure:
   - **URL**: `https://your-domain.com/api/webhooks/baserow`
   - **Events**: Select `rows.created`, `rows.updated`, `rows.deleted`
   - **Headers** (optional): Add `X-Webhook-Secret: your_secret_here` for authentication
5. Save the webhook

### Test the webhook

```bash
# Test the webhook endpoint
curl http://localhost:3000/api/webhooks/baserow

# Should return: {"status":"ok","message":"Baserow webhook endpoint is ready",...}
```

When Baserow sends webhook events, they'll be logged in your server console and trigger cache invalidation for the Gantt chart.

## API Endpoints

### Tasks

- `GET /api/tasks` - List tasks with pagination
  - Query params: `page`, `pageSize`, `all` (set to "true" to fetch all)
- `POST /api/tasks` - Create a new task
- `GET /api/tasks/[id]` - Get a single task
- `PATCH /api/tasks/[id]` - Update a task
- `DELETE /api/tasks/[id]` - Delete a task

### Statuses

- `GET /api/statuses` - List all statuses

### Webhooks

- `POST /api/webhooks/baserow` - Receive Baserow webhook events
- `GET /api/webhooks/baserow` - Health check

## Pagination & Filtering

The Baserow provider supports:

- **Pagination**: Uses Baserow's standard `page` and `size` parameters
- **Auto-pagination**: `getAllTasks()` automatically fetches all pages
- **Safety limit**: Auto-pagination stops at 10,000 rows to prevent infinite loops
- **Filtering**: Extensible via the `TaskQueryParams` interface

## Customization

### Adding New Fields

1. Add the field to your Baserow table
2. Update the TypeScript types in `types/task.ts`
3. Update the field mapping in `lib/providers/baserow/field-mapping.ts`
4. Update the mapper in `lib/providers/baserow/baserow-provider.ts`

### Switching Between Providers

The application supports seamless switching between providers:

**Current Providers:**
- **Demo**: `DATA_PROVIDER=demo` - Built-in sample data
- **Baserow**: `DATA_PROVIDER=baserow` - No-code database ([Setup Guide](./docs/BASEROW_SETUP.md))
- **PostgreSQL**: `DATA_PROVIDER=postgres` - SQL database ([Setup Guide](./docs/POSTGRES_SETUP.md))

**To Switch:**
1. Update `DATA_PROVIDER` in `.env.local`
2. Add provider-specific configuration (see `.env.example`)
3. Restart the development server
4. Or use the [Configuration UI](http://localhost:3000/config) for visual setup

**Adding Custom Providers:**

1. Implement the `IDataProvider` interface
2. Add your provider to `lib/providers/`
3. Register in `provider-factory.ts`
4. Set `DATA_PROVIDER=your_provider`

Example structure:

```typescript
export class CustomProvider implements IDataProvider {
  async getTasks(params?: TaskQueryParams): Promise<PaginatedResponse<Task>>
  async getAllTasks(): Promise<Task[]>
  async getTaskById(id: string): Promise<Task | null>
  async createTask(data: CreateTaskDTO): Promise<Task>
  async updateTask(id: string, data: UpdateTaskDTO): Promise<Task>
  async deleteTask(id: string): Promise<void>
  async getStatuses(): Promise<TaskStatus[]>
  async getStatusById(id: string): Promise<TaskStatus | null>
  async isHealthy(): Promise<boolean>
}
```

See existing providers in `lib/providers/` for reference.

### Customizing the UI

All Gantt components are in `components/ui/gantt.tsx` and can be customized:

- Colors and styling via Tailwind classes
- Behavior via props and callbacks
- Layout by modifying the component structure

## Development

### Type Checking

```bash
npm run type-check
```

### Linting

```bash
npm run lint
```

### Building

```bash
npm run build
```

### Production

```bash
npm run build
npm start
```

## Why Server-Side Proxy?

This project uses a server-side proxy pattern for several critical reasons:

1. **Security**: Database tokens and credentials never reach the browser
2. **API Key Protection**: Your Baserow token is kept in environment variables server-side
3. **Rate Limiting**: Centralized request handling helps manage API quotas
4. **Data Validation**: Server validates and sanitizes all data before sending to Baserow
5. **Flexibility**: Easy to add caching, logging, or switch providers without changing the frontend

## Troubleshooting

### "Failed to fetch tasks"

- Verify your `BASEROW_TOKEN` is correct
- Check that `BASEROW_TABLE_ID_TASKS` matches your table ID
- Ensure your token has permissions to access the table
- Check the server logs for detailed error messages

### Tasks not updating in real-time

- Verify your webhook is configured correctly in Baserow
- Check that the webhook URL is accessible from the internet (use ngrok for local testing)
- Look at server logs to confirm webhook events are being received

### Field mapping errors

- Ensure field names in `field-mapping.ts` exactly match your Baserow field names (case-sensitive)
- Check that date fields are actually Date type in Baserow
- Verify linked fields (like Status) are configured correctly

### TypeScript errors

```bash
# Clear Next.js cache
rm -rf .next

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

## Contributing

We welcome contributions from developers, designers, project managers, and AI tools! This project is set up for easy collaboration with clear guidelines and progress tracking.

### Quick Start for Contributors

1. **Read the docs**: Check [CONTRIBUTING.md](./CONTRIBUTING.md) for comprehensive guidelines
2. **See current work**: Review [PROJECT_STATUS.md](./PROJECT_STATUS.md) for ongoing tasks
3. **Pick a task**: Look at [open issues](https://github.com/Llompi/Shadcn-Gantt-tool/issues) or the [ROADMAP.md](./ROADMAP.md)
4. **Fork & code**: Create a branch, make your changes, and submit a PR
5. **AI tools**: See [AI_COLLABORATION.md](./AI_COLLABORATION.md) for AI-specific workflows

### For AI Tools

This repository is AI-friendly with:
- Clear [AI collaboration guidelines](./AI_COLLABORATION.md)
- Progress tracking in [PROJECT_STATUS.md](./PROJECT_STATUS.md)
- Structured issue and PR templates
- Conventional commit messages

### Documentation

- **[CONTRIBUTING.md](./CONTRIBUTING.md)** - How to contribute (humans and AI)
- **[AI_COLLABORATION.md](./AI_COLLABORATION.md)** - AI-specific guidelines
- **[PROJECT_STATUS.md](./PROJECT_STATUS.md)** - Current work and goals
- **[ROADMAP.md](./ROADMAP.md)** - Future plans and features
- **[CHANGELOG.md](./CHANGELOG.md)** - Version history

### Ways to Contribute

- 🐛 **Report bugs** using our [bug report template](https://github.com/Llompi/Shadcn-Gantt-tool/issues/new?template=bug_report.md)
- ✨ **Request features** using our [feature request template](https://github.com/Llompi/Shadcn-Gantt-tool/issues/new?template=feature_request.md)
- 💻 **Write code** - Check issues tagged `good first issue`
- 📖 **Improve docs** - Help make our guides better
- 🧪 **Test features** - Try new features and report issues
- 💬 **Join discussions** - Share ideas and feedback

## License

See [LICENSE](./LICENSE) file for details.

## Roadmap

See [ROADMAP.md](./ROADMAP.md) for the complete roadmap with detailed timelines and feature descriptions.

### Current Focus (v1.1.0 - v1.5.0)
- [x] **PostgreSQL provider implementation** *(High Priority)* - v1.1.0 ✅ COMPLETED
- [x] **UI-based configuration interface** *(High Priority)* - v1.1.0 ✅ COMPLETED
  - [x] Live connection settings editor
  - [x] Workspace/table/view selector for Baserow
  - [x] Connection testing and validation
  - [ ] CSV/JSON file upload for demo data (deferred to v1.2.0)
- [ ] **Task dependencies visualization** - v1.2.0 (Next)
- [ ] **Export to PDF/PNG/CSV** - v1.3.0
- [ ] **Advanced filtering and search** - v1.4.0
- [ ] **Performance optimization** - v1.5.0

### Future Enhancements (v2.0.0+)
- [ ] Resource allocation and management
- [ ] Milestone markers and tracking
- [ ] Real-time collaboration features
- [ ] Workflow automation
- [ ] Advanced analytics and reporting
- [ ] AI-powered features
- [ ] Mobile native apps
- [ ] Enterprise features

**Track Progress**: Check [PROJECT_STATUS.md](./PROJECT_STATUS.md) for current sprint goals and completed work.

## Support

For issues, questions, or feature requests, please open an issue on GitHub.

---

Built with [Next.js](https://nextjs.org/), [shadcn/ui](https://ui.shadcn.com/), [Tailwind CSS](https://tailwindcss.com/), and [Baserow](https://baserow.io/).
