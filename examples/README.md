# Example Data Files

This directory contains example data files that you can use to test the Gantt Project Manager in demo mode.

## Available Files

### CSV Files

#### `tasks.csv` - Complete Example
A full-featured CSV file with 13 tasks across 5 project phases.

**Includes:**
- All optional fields (owner, group, progress, description)
- Multiple phases and team members
- Realistic project timeline
- Various status types (Done, In Progress, To Do)

**Use this when:**
- You want to see all available features
- Testing with realistic project data
- Learning the full data structure

#### `tasks-simple.csv` - Minimal Example
A simplified CSV with only required fields and 6 tasks.

**Includes:**
- Only essential fields (name, dates, status)
- Simple project structure
- Easy to understand format

**Use this when:**
- Getting started with CSV import
- You only need basic task tracking
- Creating a template for your own data

### JSON Files

#### `tasks.json` - Standard JSON Format
Complete project data in JSON format with 13 tasks.

**Features:**
- Proper nested status objects
- ISO date formatting
- All fields included
- Same data as `tasks.csv` but in JSON

**Use this when:**
- You prefer working with JSON
- Exporting from other tools that output JSON
- Need a structured data format

#### `tasks-complex.json` - Advanced Example
A comprehensive example with 25 tasks across a multi-phase software project.

**Features:**
- Multiple team members and phases
- Various status types including "Blocked" and "Review"
- Detailed descriptions
- Realistic dependencies and timeline
- Progress tracking for each task

**Use this when:**
- Testing with a large dataset
- Understanding complex project structures
- Learning how to handle task dependencies
- Demonstrating to stakeholders

## Field Descriptions

### Required Fields

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `name` | String | Task name | "Build API" |
| `startAt` | Date (ISO) | Start date | "2024-01-15" |
| `endAt` | Date (ISO) | End date | "2024-01-30" |
| `status` | String/Object | Task status | "In Progress" or `{"name": "In Progress", "color": "#3b82f6"}` |

### Optional Fields

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `owner` | String | Task owner/assignee | "Alice" |
| `group` | String | Task category/phase | "Phase 2: Backend" |
| `progress` | Number | Completion % (0-100) | 75 |
| `description` | String | Task details | "Build REST API endpoints" |
| `statusColor` | String | Status color hex code (CSV only) | "#3b82f6" |

## CSV Format Notes

### Headers
CSV files must include headers in the first row:
```csv
name,startAt,endAt,status,statusColor,owner,group,progress,description
```

### Status in CSV
For CSV files, status is split into two fields:
- `status`: The status name (e.g., "In Progress")
- `statusColor`: The hex color code (e.g., "#3b82f6")

### Date Format
Dates must be in ISO format: `YYYY-MM-DD`
- ✅ Good: "2024-01-15"
- ❌ Bad: "1/15/2024" or "15-Jan-2024"

## JSON Format Notes

### Status Object
In JSON, status is a nested object:
```json
"status": {
  "id": "2",
  "name": "In Progress",
  "color": "#3b82f6"
}
```

### Date Format
Dates are ISO strings:
```json
"startAt": "2024-01-15",
"endAt": "2024-01-30"
```

## Common Status Colors

| Status | Color Code | Color Name |
|--------|-----------|------------|
| To Do | `#94a3b8` | Slate Gray |
| In Progress | `#3b82f6` | Blue |
| Review | `#f59e0b` | Amber |
| Done | `#22c55e` | Green |
| Blocked | `#ef4444` | Red |

## How to Use These Files

### 1. Via UI (Recommended)

1. Start the app in demo mode
2. Navigate to the Gantt page
3. Click **"Upload Data"** button
4. Select one of these example files
5. Data loads instantly!

### 2. As Templates

Copy any of these files and modify for your project:

```bash
# Copy and edit
cp examples/tasks-simple.csv my-project.csv
# Edit my-project.csv with your data
# Upload through the UI
```

### 3. For Testing

Use these files to test features during development:

```bash
# In your code
import exampleTasks from '@/examples/tasks.json'
```

## Creating Your Own Files

### From Excel/Google Sheets

1. **Set up columns** matching the field names above
2. **Enter your data** with proper date formatting
3. **Export as CSV**:
   - Excel: File → Save As → CSV (Comma delimited)
   - Google Sheets: File → Download → Comma Separated Values
4. **Upload** through the UI

### From JSON

If you're exporting from another tool:

```javascript
// Example: Converting from your format
const myTasks = [
  {
    title: "My Task",  // Convert to "name"
    start: "2024-01-15",  // Convert to "startAt"
    end: "2024-01-30",  // Convert to "endAt"
    state: "Active"  // Convert to "status"
  }
]

// Transform to required format
const ganttTasks = myTasks.map(task => ({
  name: task.title,
  startAt: task.start,
  endAt: task.end,
  status: {
    name: task.state,
    color: "#3b82f6"
  }
}))

// Save as JSON
JSON.stringify(ganttTasks, null, 2)
```

## Troubleshooting

### "Invalid date format"
- Ensure dates are in `YYYY-MM-DD` format
- Check for missing or malformed dates

### "Missing required fields"
- CSV must have `name`, `startAt`, `endAt`, and `status` columns
- JSON objects must have these fields

### "Status color not showing"
- CSV: Make sure `statusColor` column has valid hex codes
- JSON: Ensure status object has `color` field

### "File won't upload"
- Check file extension (.csv or .json)
- Verify file isn't corrupted
- Try opening in a text editor to check format

## Additional Resources

- [Demo Mode Guide](../docs/DEMO_MODE.md)
- [Baserow Setup Guide](../docs/BASEROW_SETUP.md)
- [Main README](../README.md)

---

**Need help?** Open an issue on GitHub with your data format question!
