-- ============================================================
-- Gantt Project Manager - PostgreSQL Schema
-- ============================================================
-- This schema provides a complete database structure for the
-- Gantt Project Manager application.
--
-- Features:
--   - Tasks table with full project management fields
--   - Statuses table for task states
--   - Task dependencies support
--   - Indexes for performance
--   - Constraints for data integrity
--   - Timestamps for auditing
-- ============================================================

-- Enable UUID extension (optional but recommended)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- STATUSES TABLE
-- ============================================================
-- Stores the different states a task can be in
-- (e.g., "To Do", "In Progress", "Done")
-- ============================================================

CREATE TABLE IF NOT EXISTS statuses (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  color VARCHAR(7) DEFAULT '#3b82f6',  -- Hex color code
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- TASKS TABLE
-- ============================================================
-- Stores all project tasks with scheduling and metadata
-- ============================================================

CREATE TABLE IF NOT EXISTS tasks (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  start_at DATE NOT NULL,
  end_at DATE NOT NULL,
  status_id INTEGER REFERENCES statuses(id) ON DELETE SET NULL,
  "group" VARCHAR(100),  -- Quoted because 'group' is a reserved word
  owner VARCHAR(100),
  description TEXT,
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  -- Constraints
  CONSTRAINT valid_date_range CHECK (end_at >= start_at)
);

-- ============================================================
-- TASK DEPENDENCIES TABLE (Future feature - v1.2.0)
-- ============================================================
-- Stores relationships between tasks
-- ============================================================

CREATE TABLE IF NOT EXISTS task_dependencies (
  id SERIAL PRIMARY KEY,
  task_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  depends_on_task_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  dependency_type VARCHAR(20) DEFAULT 'finish_to_start',  -- finish_to_start, start_to_start, etc.
  lag_days INTEGER DEFAULT 0,  -- Delay between tasks
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  -- Prevent duplicate dependencies
  CONSTRAINT unique_dependency UNIQUE (task_id, depends_on_task_id),

  -- Prevent self-referencing dependencies
  CONSTRAINT no_self_dependency CHECK (task_id != depends_on_task_id)
);

-- ============================================================
-- INDEXES
-- ============================================================
-- Performance optimization for common queries
-- ============================================================

-- Task queries by date range
CREATE INDEX IF NOT EXISTS idx_tasks_start_at ON tasks(start_at);
CREATE INDEX IF NOT EXISTS idx_tasks_end_at ON tasks(end_at);

-- Task queries by status
CREATE INDEX IF NOT EXISTS idx_tasks_status_id ON tasks(status_id);

-- Task queries by group/owner
CREATE INDEX IF NOT EXISTS idx_tasks_group ON tasks("group");
CREATE INDEX IF NOT EXISTS idx_tasks_owner ON tasks(owner);

-- Full-text search on task names (future feature)
CREATE INDEX IF NOT EXISTS idx_tasks_name_trgm ON tasks USING gin (name gin_trgm_ops);

-- Dependencies lookup
CREATE INDEX IF NOT EXISTS idx_dependencies_task_id ON task_dependencies(task_id);
CREATE INDEX IF NOT EXISTS idx_dependencies_depends_on ON task_dependencies(depends_on_task_id);

-- ============================================================
-- TRIGGERS
-- ============================================================
-- Automatic timestamp updates
-- ============================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for tasks table
DROP TRIGGER IF EXISTS update_tasks_updated_at ON tasks;
CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger for statuses table
DROP TRIGGER IF EXISTS update_statuses_updated_at ON statuses;
CREATE TRIGGER update_statuses_updated_at
  BEFORE UPDATE ON statuses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- DEFAULT DATA
-- ============================================================
-- Insert default statuses for new installations
-- ============================================================

INSERT INTO statuses (name, color) VALUES
  ('To Do', '#94a3b8'),
  ('In Progress', '#3b82f6'),
  ('In Review', '#f59e0b'),
  ('Done', '#10b981'),
  ('Blocked', '#ef4444')
ON CONFLICT (name) DO NOTHING;

-- ============================================================
-- SAMPLE DATA (Optional - for testing)
-- ============================================================
-- Uncomment to insert sample tasks
-- ============================================================

/*
INSERT INTO tasks (name, start_at, end_at, status_id, "group", owner, description, progress) VALUES
  ('Project Planning', '2025-10-20', '2025-10-25', 4, 'Setup', 'Alice', 'Define project scope and objectives', 100),
  ('Design System Setup', '2025-10-22', '2025-10-28', 4, 'Design', 'Bob', 'Setup shadcn/ui and design tokens', 100),
  ('Database Schema Design', '2025-10-25', '2025-10-30', 3, 'Backend', 'Charlie', 'Design PostgreSQL schema', 90),
  ('API Development', '2025-10-28', '2025-11-05', 2, 'Backend', 'Charlie', 'Build REST API endpoints', 60),
  ('Frontend Components', '2025-11-01', '2025-11-10', 2, 'Frontend', 'Alice', 'Build React components', 40),
  ('Testing & QA', '2025-11-05', '2025-11-15', 1, 'QA', 'Bob', 'Comprehensive testing', 0),
  ('Documentation', '2025-11-08', '2025-11-12', 1, 'Docs', 'Alice', 'Write user documentation', 0),
  ('Deployment', '2025-11-12', '2025-11-15', 1, 'DevOps', 'Charlie', 'Deploy to production', 0);
*/

-- ============================================================
-- VIEWS (Optional - for convenience)
-- ============================================================
-- Pre-joined views for common queries
-- ============================================================

-- Tasks with status information
CREATE OR REPLACE VIEW tasks_with_status AS
SELECT
  t.*,
  s.name AS status_name,
  s.color AS status_color
FROM tasks t
LEFT JOIN statuses s ON t.status_id = s.id;

-- ============================================================
-- PERMISSIONS (Adjust based on your security requirements)
-- ============================================================
-- Example: Grant permissions to application user
-- ============================================================

-- Uncomment and adjust for your application user
/*
GRANT SELECT, INSERT, UPDATE, DELETE ON tasks TO gantt_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON statuses TO gantt_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON task_dependencies TO gantt_user;
GRANT USAGE, SELECT ON SEQUENCE tasks_id_seq TO gantt_user;
GRANT USAGE, SELECT ON SEQUENCE statuses_id_seq TO gantt_user;
GRANT USAGE, SELECT ON SEQUENCE task_dependencies_id_seq TO gantt_user;
*/

-- ============================================================
-- CLEANUP COMMANDS (for development/testing)
-- ============================================================
-- Use these to reset the database
-- ============================================================

-- Drop all tables (CASCADE removes dependent objects)
-- DROP TABLE IF EXISTS task_dependencies CASCADE;
-- DROP TABLE IF EXISTS tasks CASCADE;
-- DROP TABLE IF EXISTS statuses CASCADE;
-- DROP FUNCTION IF EXISTS update_updated_at_column CASCADE;

-- ============================================================
-- VERIFICATION QUERIES
-- ============================================================
-- Run these to verify the schema is set up correctly
-- ============================================================

-- Check tables exist
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';

-- Check default statuses
-- SELECT * FROM statuses;

-- Check for sample data
-- SELECT COUNT(*) FROM tasks;

-- ============================================================
-- END OF SCHEMA
-- ============================================================
