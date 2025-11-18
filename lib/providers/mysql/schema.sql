-- MySQL Schema for Gantt Tool

-- Task Statuses Table
CREATE TABLE IF NOT EXISTS task_statuses (
  id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  color VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tasks Table
CREATE TABLE IF NOT EXISTS tasks (
  id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(500) NOT NULL,
  start_at DATETIME NOT NULL,
  end_at DATETIME NOT NULL,
  status_id VARCHAR(255),
  group_name VARCHAR(255),
  owner VARCHAR(255),
  description TEXT,
  progress INT DEFAULT 0,
  priority ENUM('low', 'medium', 'high', 'critical'),
  estimated_hours DECIMAL(10, 2),
  actual_hours DECIMAL(10, 2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (status_id) REFERENCES task_statuses(id) ON DELETE SET NULL,
  INDEX idx_start_at (start_at),
  INDEX idx_end_at (end_at),
  INDEX idx_status_id (status_id),
  INDEX idx_group_name (group_name),
  INDEX idx_owner (owner)
);

-- Task Dependencies Table
CREATE TABLE IF NOT EXISTS task_dependencies (
  id VARCHAR(255) PRIMARY KEY,
  predecessor_id VARCHAR(255) NOT NULL,
  successor_id VARCHAR(255) NOT NULL,
  type ENUM('finish-to-start', 'start-to-start', 'finish-to-finish', 'start-to-finish') DEFAULT 'finish-to-start',
  lag_days INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (predecessor_id) REFERENCES tasks(id) ON DELETE CASCADE,
  FOREIGN KEY (successor_id) REFERENCES tasks(id) ON DELETE CASCADE,
  INDEX idx_predecessor (predecessor_id),
  INDEX idx_successor (successor_id)
);

-- Resources Table
CREATE TABLE IF NOT EXISTS resources (
  id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  role VARCHAR(255),
  avatar VARCHAR(500),
  availability INT DEFAULT 100,
  color VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Resource Allocations Table
CREATE TABLE IF NOT EXISTS resource_allocations (
  id VARCHAR(255) PRIMARY KEY,
  task_id VARCHAR(255) NOT NULL,
  resource_id VARCHAR(255) NOT NULL,
  allocation INT DEFAULT 100,
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
  FOREIGN KEY (resource_id) REFERENCES resources(id) ON DELETE CASCADE,
  INDEX idx_task_id (task_id),
  INDEX idx_resource_id (resource_id)
);

-- Task Tags Table
CREATE TABLE IF NOT EXISTS task_tags (
  task_id VARCHAR(255) NOT NULL,
  tag VARCHAR(100) NOT NULL,
  PRIMARY KEY (task_id, tag),
  FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
  INDEX idx_tag (tag)
);

-- Comments Table
CREATE TABLE IF NOT EXISTS comments (
  id VARCHAR(255) PRIMARY KEY,
  task_id VARCHAR(255) NOT NULL,
  user_id VARCHAR(255) NOT NULL,
  user_name VARCHAR(255) NOT NULL,
  user_avatar VARCHAR(500),
  content TEXT NOT NULL,
  parent_id VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
  FOREIGN KEY (parent_id) REFERENCES comments(id) ON DELETE CASCADE,
  INDEX idx_task_id (task_id),
  INDEX idx_user_id (user_id)
);

-- Change History Table
CREATE TABLE IF NOT EXISTS change_history (
  id VARCHAR(255) PRIMARY KEY,
  task_id VARCHAR(255) NOT NULL,
  change_type ENUM('create', 'update', 'delete') NOT NULL,
  field VARCHAR(255),
  old_value TEXT,
  new_value TEXT,
  user_id VARCHAR(255),
  user_name VARCHAR(255),
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
  INDEX idx_task_id (task_id),
  INDEX idx_timestamp (timestamp)
);

-- Insert default statuses
INSERT INTO task_statuses (id, name, color) VALUES
  ('status_1', 'To Do', '#94a3b8'),
  ('status_2', 'In Progress', '#3b82f6'),
  ('status_3', 'In Review', '#f59e0b'),
  ('status_4', 'Blocked', '#ef4444'),
  ('status_5', 'Done', '#10b981')
ON DUPLICATE KEY UPDATE name=name;
