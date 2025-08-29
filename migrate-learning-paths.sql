-- Learning Paths Migration
-- Add learning paths and user progress tracking

USE codequest_db;

-- Learning paths table
CREATE TABLE IF NOT EXISTS learning_paths (
    id VARCHAR(36) PRIMARY KEY,
    slug VARCHAR(100) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    icon VARCHAR(50) DEFAULT 'fas fa-code',
    color VARCHAR(7) DEFAULT '#6366f1',
    estimated_hours INT DEFAULT 0,
    total_modules INT DEFAULT 0,
    difficulty ENUM('beginner', 'intermediate', 'advanced') DEFAULT 'beginner',
    order_index INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_slug (slug),
    INDEX idx_order_index (order_index),
    INDEX idx_difficulty (difficulty)
);

-- Learning path modules (junction table)
CREATE TABLE IF NOT EXISTS learning_path_modules (
    id VARCHAR(36) PRIMARY KEY,
    path_id VARCHAR(36) NOT NULL,
    module_id VARCHAR(36) NOT NULL,
    order_index INT DEFAULT 0,
    is_required BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (path_id) REFERENCES learning_paths(id) ON DELETE CASCADE,
    FOREIGN KEY (module_id) REFERENCES modules(id) ON DELETE CASCADE,
    UNIQUE KEY unique_path_module (path_id, module_id),
    INDEX idx_path_id (path_id),
    INDEX idx_module_id (module_id),
    INDEX idx_order_index (order_index)
);

-- User learning path progress
CREATE TABLE IF NOT EXISTS user_learning_path_progress (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    path_id VARCHAR(36) NOT NULL,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP NULL,
    progress_percentage DECIMAL(5,2) DEFAULT 0.00,
    completed_modules INT DEFAULT 0,
    total_modules INT DEFAULT 0,
    xp_earned INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (path_id) REFERENCES learning_paths(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_path (user_id, path_id),
    INDEX idx_user_id (user_id),
    INDEX idx_path_id (path_id),
    INDEX idx_progress (progress_percentage)
);

-- Insert default learning paths
INSERT INTO learning_paths (id, slug, title, description, icon, color, estimated_hours, total_modules, difficulty, order_index) VALUES
(UUID(), 'frontend-development', 'Frontend Development', 'Master HTML, CSS, JavaScript and modern frameworks to build beautiful, interactive websites.', 'fas fa-paint-brush', '#f59e0b', 120, 8, 'beginner', 1),
(UUID(), 'backend-development', 'Backend Development', 'Learn server-side programming, databases, APIs and authentication to power your applications.', 'fas fa-server', '#10b981', 90, 6, 'intermediate', 2),
(UUID(), 'fullstack-mastery', 'Full Stack Mastery', 'Combine frontend and backend skills to build complete, production-ready web applications.', 'fas fa-code', '#8b5cf6', 200, 12, 'advanced', 3);

-- Update modules table to add path associations (if needed)
ALTER TABLE modules ADD COLUMN IF NOT EXISTS primary_path_id VARCHAR(36) NULL;
ALTER TABLE modules ADD FOREIGN KEY IF NOT EXISTS (primary_path_id) REFERENCES learning_paths(id) ON DELETE SET NULL;

-- Add index for better performance
ALTER TABLE modules ADD INDEX IF NOT EXISTS idx_primary_path_id (primary_path_id);

-- Update user_progress table to include path-specific stats
ALTER TABLE user_progress ADD COLUMN IF NOT EXISTS html_xp INT DEFAULT 0;
ALTER TABLE user_progress ADD COLUMN IF NOT EXISTS css_xp INT DEFAULT 0;
ALTER TABLE user_progress ADD COLUMN IF NOT EXISTS javascript_xp INT DEFAULT 0;
ALTER TABLE user_progress ADD COLUMN IF NOT EXISTS html_lessons INT DEFAULT 0;
ALTER TABLE user_progress ADD COLUMN IF NOT EXISTS css_lessons INT DEFAULT 0;
ALTER TABLE user_progress ADD COLUMN IF NOT EXISTS javascript_lessons INT DEFAULT 0;
ALTER TABLE user_progress ADD COLUMN IF NOT EXISTS html_progress DECIMAL(5,2) DEFAULT 0.00;
ALTER TABLE user_progress ADD COLUMN IF NOT EXISTS css_progress DECIMAL(5,2) DEFAULT 0.00;
ALTER TABLE user_progress ADD COLUMN IF NOT EXISTS javascript_progress DECIMAL(5,2) DEFAULT 0.00;

-- User module progress table
CREATE TABLE IF NOT EXISTS user_module_progress (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    module_id VARCHAR(36) NOT NULL,
    progress_percentage DECIMAL(5,2) DEFAULT 0.00,
    is_completed BOOLEAN DEFAULT FALSE,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (module_id) REFERENCES modules(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_module (user_id, module_id),
    INDEX idx_user_id (user_id),
    INDEX idx_module_id (module_id),
    INDEX idx_progress (progress_percentage)
);

-- Associate existing modules with learning paths
INSERT IGNORE INTO learning_path_modules (id, path_id, module_id, order_index, is_required)
SELECT 
    UUID() as id,
    lp.id as path_id,
    m.id as module_id,
    m.order_index,
    TRUE as is_required
FROM learning_paths lp
CROSS JOIN modules m
WHERE 
    (lp.slug = 'frontend-development' AND m.category IN ('html', 'css', 'javascript'))
    OR (lp.slug = 'backend-development' AND m.category = 'javascript')
    OR (lp.slug = 'fullstack-mastery' AND m.category IN ('html', 'css', 'javascript', 'projects'));

-- Update learning paths with calculated totals
UPDATE learning_paths lp SET 
    total_modules = (
        SELECT COUNT(*) 
        FROM learning_path_modules lpm 
        WHERE lpm.path_id = lp.id
    ),
    estimated_hours = (
        SELECT COALESCE(CEIL(SUM(l.duration_minutes) / 60), 0)
        FROM learning_path_modules lpm
        JOIN lessons l ON l.module_id = lpm.module_id
        WHERE lpm.path_id = lp.id AND l.is_active = TRUE
    )
WHERE lp.is_active = TRUE;

-- Insert sample path-module associations
INSERT IGNORE INTO learning_path_modules (id, path_id, module_id, order_index) 
SELECT 
    UUID(),
    (SELECT id FROM learning_paths WHERE slug = 'frontend-development'),
    m.id,
    ROW_NUMBER() OVER (ORDER BY m.order_index)
FROM modules m 
WHERE m.category IN ('html', 'css', 'javascript')
LIMIT 8;

INSERT IGNORE INTO learning_path_modules (id, path_id, module_id, order_index)
SELECT 
    UUID(),
    (SELECT id FROM learning_paths WHERE slug = 'backend-development'),
    m.id,
    ROW_NUMBER() OVER (ORDER BY m.order_index)
FROM modules m 
WHERE m.category IN ('javascript', 'projects')
LIMIT 6;

INSERT IGNORE INTO learning_path_modules (id, path_id, module_id, order_index)
SELECT 
    UUID(),
    (SELECT id FROM learning_paths WHERE slug = 'fullstack-mastery'),
    m.id,
    ROW_NUMBER() OVER (ORDER BY m.order_index)
FROM modules m 
WHERE m.category IN ('html', 'css', 'javascript', 'projects')
LIMIT 12;