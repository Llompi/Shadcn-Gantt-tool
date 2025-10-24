# Baserow Setup Guide

> **Note**: This guide applies to both deployment modes:
> - **Easy Mode**: Use cloud-hosted Baserow (baserow.io)
> - **Install Mode**: Use self-hosted Baserow (see [CMMC_DEPLOYMENT.md](./CMMC_DEPLOYMENT.md))

This guide walks you through setting up Baserow for use with the Gantt Project Manager.

## Step 1: Create a Baserow Account

1. Go to [Baserow.io](https://baserow.io/)
2. Sign up for a free account
3. Verify your email address

## Step 2: Create a New Database

1. Click "Create new" → "Database"
2. Name it (e.g., "Project Management")

## Step 3: Create the Tasks Table

1. Create a new table called "Tasks"
2. Add the following fields:

| Field Name | Field Type | Configuration |
|------------|------------|---------------|
| Name | Text | Required |
| Start Date | Date | Date only, no time |
| End Date | Date | Date only, no time |
| Status | Link to table | Link to "Statuses" table |
| Group | Text | Optional, for grouping tasks |
| Owner | Text | Optional, task assignee |
| Description | Long text | Optional |
| Progress | Number | Optional, 0-100 |

**Note**: Baserow automatically creates `id`, `created_on`, and `updated_on` fields.

## Step 4: Create the Statuses Table

1. Create a new table called "Statuses"
2. Add the following fields:

| Field Name | Field Type | Example Values |
|------------|------------|----------------|
| Name | Text | "To Do", "In Progress", "Done" |
| Color | Text | "#3b82f6", "#10b981", "#8b5cf6" |

3. Add some sample statuses:
   - To Do (Color: #94a3b8)
   - In Progress (Color: #3b82f6)
   - Review (Color: #f59e0b)
   - Done (Color: #10b981)

## Step 5: Add Sample Data

Add a few sample tasks to test with:

| Name | Start Date | End Date | Status | Group |
|------|------------|----------|--------|-------|
| Setup project | 2024-01-01 | 2024-01-07 | Done | Phase 1 |
| Design UI | 2024-01-08 | 2024-01-21 | In Progress | Phase 1 |
| Build API | 2024-01-15 | 2024-02-01 | To Do | Phase 2 |

## Step 6: Get Your Database Token

1. Click on your profile picture (top right)
2. Go to "Settings" → "API tokens" or "Database tokens"
3. Click "Create token"
4. Name it (e.g., "Gantt App")
5. Select the database you created
6. Copy the token and save it securely

**Important**: This token gives full access to your database. Keep it secret!

## Step 7: Find Your Table IDs

### Method 1: From the URL
1. Open your Tasks table in Baserow
2. Look at the browser URL:
   ```
   https://baserow.io/database/{workspace_id}/table/{TABLE_ID}/
   ```
3. The number after `/table/` is your table ID
4. Repeat for the Statuses table

### Method 2: From the API
1. Go to [Baserow API Docs](https://api.baserow.io/api/redoc/)
2. Click "Authorize" and enter your token
3. Use the `/api/database/tables/` endpoint to list all tables
4. Find your table IDs in the response

## Step 8: Configure Field Linking

Make sure the "Status" field in your Tasks table is properly linked:

1. Click on the "Status" field in Tasks table
2. Ensure it's set as "Link to table" type
3. Select "Statuses" as the linked table
4. Choose "Multiple" or "Single" based on your needs
5. Save the field configuration

## Step 9: Set Up Webhooks (Optional)

For real-time updates:

1. Open your Tasks table
2. Click the table menu (three dots) → "Webhooks"
3. Click "Create webhook"
4. Configure:
   - **Name**: "Gantt App Webhook"
   - **URL**: `https://your-domain.com/api/webhooks/baserow`
   - **Events**: Select all (rows.created, rows.updated, rows.deleted)
   - **Active**: Yes
5. Optionally add a header for security:
   - Header name: `X-Webhook-Secret`
   - Header value: Generate a random string and save it
6. Click "Create"

## Step 10: Test Your Setup

1. Copy your credentials to `.env.local`:
   ```env
   BASEROW_BASE_URL=https://api.baserow.io
   BASEROW_TOKEN=your_token_here
   BASEROW_TABLE_ID_TASKS=12345
   BASEROW_TABLE_ID_STATUSES=12346
   ```

2. Start the app:
   ```bash
   npm run dev
   ```

3. Navigate to http://localhost:3000/gantt

4. You should see your tasks displayed in the Gantt chart!

## Troubleshooting

### "Failed to fetch tasks"
- Double-check your token is correct
- Verify table IDs match your Baserow tables
- Ensure the token has access to both tables

### Tasks not showing
- Check that you have data in your Tasks table
- Verify the field names match the mapping in `field-mapping.ts`
- Look at browser console for error messages

### Status colors not appearing
- Ensure Color field in Statuses table contains valid hex codes
- Check that Status field in Tasks is properly linked

## Advanced: Custom Field Mapping

If you want to use different field names:

1. Edit `lib/providers/baserow/field-mapping.ts`
2. Update the field names to match your Baserow table
3. Restart the dev server

Example:
```typescript
export const DEFAULT_FIELD_MAPPING: BaserowFieldMapping = {
  tasks: {
    name: "Task Name",      // Your custom field name
    startAt: "Start",       // Your custom field name
    endAt: "Finish",        // Your custom field name
    // ... etc
  },
}
```

## API Documentation

Baserow provides auto-generated API docs for your specific database:

1. In Baserow, open your database
2. Click "View API documentation" (in database menu)
3. You'll see interactive docs with your exact field names and IDs

This is invaluable for understanding the API structure and testing requests!
