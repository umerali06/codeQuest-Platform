-- CodeQuest Database Schema
-- Migration: 001_create_tables.sql

-- Users table (mirrors Appwrite users)
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(36) PRIMARY KEY,
    appwrite_id VARCHAR(36) UNIQUE NOT NULL,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(100),
    avatar_url TEXT,
    country VARCHAR(50),
    timezone VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_appwrite_id (appwrite_id),
    INDEX idx_email (email),
    INDEX idx_username (username)
);

-- Modules table (HTML, CSS, JavaScript learning paths)
CREATE TABLE IF NOT EXISTS modules (
    id VARCHAR(36) PRIMARY KEY,
    slug VARCHAR(50) UNIQUE NOT NULL,
    title VARCHAR(100) NOT NULL,
    description TEXT,
    icon VARCHAR(10),
    color VARCHAR(7),
    difficulty ENUM('beginner', 'intermediate', 'advanced', 'expert') DEFAULT 'beginner',
    estimated_hours INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_slug (slug),
    INDEX idx_difficulty (difficulty),
    INDEX idx_is_active (is_active)
);

-- Lessons table (individual lessons within modules)
CREATE TABLE IF NOT EXISTS lessons (
    id VARCHAR(36) PRIMARY KEY,
    module_id VARCHAR(36) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    content_md LONGTEXT,
    video_url TEXT,
    duration_minutes INT DEFAULT 0,
    difficulty ENUM('beginner', 'intermediate', 'advanced', 'expert') DEFAULT 'beginner',
    prerequisites JSON,
    learning_objectives JSON,
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (module_id) REFERENCES modules(id) ON DELETE CASCADE,
    INDEX idx_module_id (module_id),
    INDEX idx_slug (slug),
    INDEX idx_difficulty (difficulty)
);

-- Challenges table (coding challenges)
CREATE TABLE IF NOT EXISTS challenges (
    id VARCHAR(36) PRIMARY KEY,
    lesson_id VARCHAR(36),
    title VARCHAR(200) NOT NULL,
    description TEXT,
    difficulty ENUM('beginner', 'intermediate', 'advanced', 'expert') DEFAULT 'beginner',
    category ENUM('html', 'css', 'javascript', 'responsive', 'accessibility', 'fullstack') NOT NULL,
    xp_reward INT DEFAULT 0,
    time_limit_minutes INT DEFAULT 0,
    starter_code_html TEXT,
    starter_code_css TEXT,
    starter_code_js TEXT,
    solution_code_html TEXT,
    solution_code_css TEXT,
    solution_code_js TEXT,
    test_spec_json JSON,
    hints JSON,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE SET NULL,
    INDEX idx_lesson_id (lesson_id),
    INDEX idx_difficulty (difficulty),
    INDEX idx_category (category)
);

-- User Progress table (tracks completion of lessons and challenges)
CREATE TABLE IF NOT EXISTS user_progress (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    lesson_id VARCHAR(36),
    challenge_id VARCHAR(36),
    status ENUM('not_started', 'in_progress', 'completed', 'failed') DEFAULT 'not_started',
    started_at TIMESTAMP NULL,
    completed_at TIMESTAMP NULL,
    time_spent_seconds INT DEFAULT 0,
    attempts_count INT DEFAULT 0,
    best_score DECIMAL(5,2) DEFAULT 0.00,
    xp_earned INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE CASCADE,
    FOREIGN KEY (challenge_id) REFERENCES challenges(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_lesson (user_id, lesson_id),
    UNIQUE KEY unique_user_challenge (user_id, challenge_id),
    INDEX idx_user_id (user_id),
    INDEX idx_lesson_id (lesson_id),
    INDEX idx_challenge_id (challenge_id),
    INDEX idx_status (status)
);

-- Challenge Attempts table (stores individual challenge submissions)
CREATE TABLE IF NOT EXISTS challenge_attempts (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    challenge_id VARCHAR(36) NOT NULL,
    submitted_code_html TEXT,
    submitted_code_css TEXT,
    submitted_code_js TEXT,
    test_results JSON,
    lint_errors JSON,
    score DECIMAL(5,2) DEFAULT 0.00,
    time_taken_seconds INT DEFAULT 0,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (challenge_id) REFERENCES challenges(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_challenge_id (challenge_id),
    INDEX idx_created_at (created_at)
);

-- Games table (coding games)
CREATE TABLE IF NOT EXISTS games (
    id VARCHAR(36) PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    category ENUM('speed', 'puzzle', 'bugfix', 'algorithm', 'memory') NOT NULL,
    difficulty ENUM('beginner', 'intermediate', 'advanced', 'expert') DEFAULT 'beginner',
    xp_reward INT DEFAULT 0,
    icon VARCHAR(10),
    color VARCHAR(7),
    rules JSON,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_category (category),
    INDEX idx_difficulty (difficulty)
);

-- Game Results table (stores game scores and achievements)
CREATE TABLE IF NOT EXISTS game_results (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    game_id VARCHAR(36) NOT NULL,
    score INT DEFAULT 0,
    time_taken_seconds INT DEFAULT 0,
    accuracy DECIMAL(5,2) DEFAULT 0.00,
    xp_earned INT DEFAULT 0,
    achievements JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_game_id (game_id),
    INDEX idx_score (score),
    INDEX idx_created_at (created_at)
);

-- User Statistics table (aggregated user metrics)
CREATE TABLE IF NOT EXISTS user_statistics (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    total_xp INT DEFAULT 0,
    current_level INT DEFAULT 1,
    current_streak INT DEFAULT 0,
    longest_streak INT DEFAULT 0,
    lessons_completed INT DEFAULT 0,
    challenges_completed INT DEFAULT 0,
    games_played INT DEFAULT 0,
    total_time_spent_seconds INT DEFAULT 0,
    badges_earned JSON,
    achievements JSON,
    last_activity TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_stats (user_id),
    INDEX idx_user_id (user_id),
    INDEX idx_total_xp (total_xp),
    INDEX idx_current_level (current_level)
);

-- AI Interactions table (logs AI assistant usage)
CREATE TABLE IF NOT EXISTS ai_interactions (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    context_type ENUM('lesson', 'challenge', 'game', 'general') NOT NULL,
    context_id VARCHAR(36),
    prompt TEXT NOT NULL,
    response TEXT NOT NULL,
    tokens_used INT DEFAULT 0,
    cost_usd DECIMAL(10,4) DEFAULT 0.0000,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_context_type (context_type),
    INDEX idx_created_at (created_at)
);
