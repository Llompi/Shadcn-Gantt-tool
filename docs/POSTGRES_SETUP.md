# PostgreSQL Setup Guide

This guide will help you set up and configure PostgreSQL as the data provider for the Gantt Project Manager.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Database Setup](#database-setup)
- [Configuration](#configuration)
- [Testing the Connection](#testing-the-connection)
- [Troubleshooting](#troubleshooting)
- [Advanced Configuration](#advanced-configuration)

---

## Prerequisites

Before you begin, ensure you have:

- PostgreSQL 12 or higher installed
- Basic knowledge of PostgreSQL commands
- Node.js 18+ and npm/pnpm (for the application)
- Administrator access to create databases and users

### Installing PostgreSQL

**macOS** (using Homebrew):
```bash
brew install postgresql@15
brew services start postgresql@15
```

**Ubuntu/Debian**:
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

**Windows**:
Download and install from [postgresql.org](https://www.postgresql.org/download/windows/)

---

## Installation

### 1. Install Dependencies

The `pg` library is already included in `package.json`. Install it with:

```bash
npm install
# or
pnpm install
```

### 2. Create Database and User

Connect to PostgreSQL as a superuser:

```bash
# macOS/Linux
sudo -u postgres psql

# Windows (run as Administrator)
psql -U postgres
```

Create the database and user:

```sql
-- Create database
CREATE DATABASE gantt_db;

-- Create user with password
CREATE USER gantt_user WITH ENCRYPTED PASSWORD 'your_secure_password_here';

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE gantt_db TO gantt_user;

-- Exit psql
\q
```

---

## Database Setup

### 1. Run the Schema Script

The schema file is located at `lib/providers/postgres/schema.sql`. Apply it to your database:

```bash
# Using psql command
psql -U gantt_user -d gantt_db -f lib/providers/postgres/schema.sql

# Or copy the schema and paste in psql
psql -U gantt_user -d gantt_db
```

You'll be prompted for the password you set earlier.

### 2. Verify Schema Installation

Check that tables were created:

```sql
-- List all tables
\dt

-- Should show:
-- - tasks
-- - statuses
-- - task_dependencies (for future features)

-- View statuses (should have 5 default statuses)
SELECT * FROM statuses;

-- Exit
\q
```

Expected output:
```
 id |    name     |  color
----+-------------+---------
  1 | To Do       | #94a3b8
  2 | In Progress | #3b82f6
  3 | In Review   | #f59e0b
  4 | Done        | #10b981
  5 | Blocked     | #ef4444
```

---

## Configuration

### 1. Update Environment Variables

Create or update your `.env.local` file in the project root:

```bash
# Copy the example file
cp .env.example .env.local
```

Edit `.env.local`:

```env
# Set provider to postgres
DATA_PROVIDER=postgres

# PostgreSQL connection settings
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=gantt_db
POSTGRES_USER=gantt_user
POSTGRES_PASSWORD=your_secure_password_here
POSTGRES_SSL=false  # Set to true for production with SSL
```

**Security Note**:
- Never commit `.env.local` to version control
- Use strong passwords in production
- Enable SSL for production deployments
- Consider using environment-specific secrets management

### 2. SSL Configuration (Production)

For production deployments, enable SSL:

```env
POSTGRES_SSL=true
```

If using self-signed certificates or need custom SSL settings, you can modify the SSL configuration in `lib/providers/provider-factory.ts`.

---

## Testing the Connection

### Option 1: Using the UI (Recommended)

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Navigate to the configuration page:
   ```
   http://localhost:3000/config
   ```

3. Select "PostgreSQL" as the provider type

4. Enter your connection details

5. Click "Test Connection"

### Option 2: Manual Testing

Create a test script `test-postgres.ts`:

```typescript
import { PostgresProvider } from './lib/providers/postgres'

async function test() {
  const provider = new PostgresProvider({
    host: 'localhost',
    port: 5432,
    database: 'gantt_db',
    user: 'gantt_user',
    password: 'your_password',
    ssl: false,
  })

  const isHealthy = await provider.isHealthy()
  console.log('Connection healthy:', isHealthy)

  const statuses = await provider.getStatuses()
  console.log('Statuses:', statuses.length)

  const tasks = await provider.getAllTasks()
  console.log('Tasks:', tasks.length)
}

test().catch(console.error)
```

Run with:
```bash
npx tsx test-postgres.ts
```

---

## Adding Sample Data

The schema includes commented-out sample data. To add it:

1. Open `lib/providers/postgres/schema.sql`

2. Uncomment the sample data section (near the bottom):

```sql
INSERT INTO tasks (name, start_at, end_at, status_id, "group", owner, description, progress) VALUES
  ('Project Planning', '2025-10-20', '2025-10-25', 4, 'Setup', 'Alice', 'Define project scope', 100),
  -- ... rest of sample tasks
```

3. Re-run the schema:

```bash
psql -U gantt_user -d gantt_db -f lib/providers/postgres/schema.sql
```

Or insert via the Gantt UI once the app is running.

---

## Troubleshooting

### Connection Refused

**Error**: `Error: connect ECONNREFUSED 127.0.0.1:5432`

**Solutions**:
- Verify PostgreSQL is running:
  ```bash
  # macOS/Linux
  sudo systemctl status postgresql
  # or
  brew services list | grep postgresql

  # Windows
  # Check Services app for PostgreSQL service
  ```

- Check if PostgreSQL is listening on the correct port:
  ```bash
  sudo lsof -i :5432
  ```

### Authentication Failed

**Error**: `password authentication failed for user "gantt_user"`

**Solutions**:
1. Verify the password is correct in `.env.local`
2. Check PostgreSQL authentication settings in `pg_hba.conf`:
   ```bash
   # Find pg_hba.conf location
   psql -U postgres -c "SHOW hba_file;"

   # Edit the file (requires sudo)
   sudo nano /path/to/pg_hba.conf
   ```

   Ensure there's a line like:
   ```
   # TYPE  DATABASE        USER            ADDRESS                 METHOD
   local   all             all                                     md5
   host    all             all             127.0.0.1/32            md5
   ```

3. Reload PostgreSQL configuration:
   ```bash
   sudo systemctl reload postgresql
   ```

### Permission Denied

**Error**: `permission denied for table tasks`

**Solution**: Grant proper permissions:
```sql
-- Connect as superuser
sudo -u postgres psql gantt_db

-- Grant permissions
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO gantt_user;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO gantt_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO gantt_user;
```

### SSL Connection Error

**Error**: `SSL connection error`

**Solution**:
- If using localhost, set `POSTGRES_SSL=false`
- For production, ensure SSL certificates are properly configured
- Check PostgreSQL `postgresql.conf` for SSL settings

---

## Advanced Configuration

### Connection Pooling

The PostgreSQL client uses connection pooling by default. You can customize pool settings by modifying `lib/providers/postgres/postgres-client.ts`:

```typescript
this.pool = new Pool({
  // ... existing config
  max: 20,                    // Maximum pool size (default: 10)
  idleTimeoutMillis: 30000,   // Close idle clients after 30 seconds
  connectionTimeoutMillis: 2000, // Timeout for new connections
})
```

### Performance Optimization

#### Indexes

The schema includes indexes for common queries. If you have large datasets, consider adding additional indexes:

```sql
-- Index on progress for filtering
CREATE INDEX idx_tasks_progress ON tasks(progress);

-- Composite index for date range queries
CREATE INDEX idx_tasks_date_range ON tasks(start_at, end_at);

-- Partial index for active tasks
CREATE INDEX idx_active_tasks ON tasks(status_id) WHERE status_id IN (1, 2, 3);
```

#### Query Optimization

For large datasets (10,000+ tasks), consider:

1. **Pagination**: Always use the paginated `getTasks()` method
2. **Materialized Views**: Create for frequently accessed data
3. **Table Partitioning**: Partition by date for very large datasets

Example materialized view:

```sql
CREATE MATERIALIZED VIEW task_summary AS
SELECT
  status_id,
  COUNT(*) as task_count,
  AVG(progress) as avg_progress
FROM tasks
GROUP BY status_id;

-- Refresh periodically
REFRESH MATERIALIZED VIEW task_summary;
```

### Backup and Restore

#### Backup

```bash
# Full database backup
pg_dump -U gantt_user -d gantt_db -F c -f gantt_backup.dump

# Schema only
pg_dump -U gantt_user -d gantt_db --schema-only -f gantt_schema.sql

# Data only
pg_dump -U gantt_user -d gantt_db --data-only -f gantt_data.sql
```

#### Restore

```bash
# Restore from custom format
pg_restore -U gantt_user -d gantt_db gantt_backup.dump

# Restore from SQL
psql -U gantt_user -d gantt_db -f gantt_backup.sql
```

### Migration from Baserow

If you're migrating from Baserow to PostgreSQL:

1. Export your Baserow data to CSV
2. Use the CSV import functionality (coming in v1.2.0) or import manually:

```sql
-- Create temporary table
CREATE TEMP TABLE temp_tasks (
  name TEXT,
  start_date DATE,
  end_date DATE,
  status TEXT
);

-- Import CSV
COPY temp_tasks FROM '/path/to/tasks.csv' CSV HEADER;

-- Insert into tasks table
INSERT INTO tasks (name, start_at, end_at, status_id)
SELECT
  t.name,
  t.start_date,
  t.end_date,
  s.id
FROM temp_tasks t
LEFT JOIN statuses s ON s.name = t.status;
```

---

## Next Steps

1. ✅ PostgreSQL is configured
2. → Start the application: `npm run dev`
3. → Navigate to `/gantt` to see your Gantt chart
4. → Add tasks via the UI or API
5. → Set up webhooks (optional) for real-time updates

## Additional Resources

- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [pg (node-postgres) Documentation](https://node-postgres.com/)
- [Gantt Project Manager - Main README](../README.md)
- [Baserow Setup Guide](./BASEROW_SETUP.md) (for comparison)

---

**Need Help?** Open an issue on [GitHub](https://github.com/Llompi/Shadcn-Gantt-tool/issues) with the label `postgres-setup`.
