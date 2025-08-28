-- CodeQuest Database Schema
-- MySQL/MariaDB compatible

-- Create database
CREATE DATABASE IF NOT EXISTS codequest_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE codequest_db;

-- Users table (for local auth fallback)
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(36) PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255),
    appwrite_user_id VARCHAR(255) UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_appwrite_user_id (appwrite_user_id)
);

-- User progress table
CREATE TABLE IF NOT EXISTS user_progress (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    total_xp INT DEFAULT 0,
    level INT DEFAULT 1,
    level_title VARCHAR(100) DEFAULT 'Beginner',
    streak INT DEFAULT 0,
    last_login TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_total_xp (total_xp)
);

-- Learning modules table
CREATE TABLE IF NOT EXISTS modules (
    id VARCHAR(36) PRIMARY KEY,
    slug VARCHAR(100) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    category ENUM('html', 'css', 'javascript', 'projects') NOT NULL,
    icon VARCHAR(10) DEFAULT '📚',
    color VARCHAR(7) DEFAULT '#6366f1',
    difficulty ENUM('beginner', 'intermediate', 'advanced') DEFAULT 'beginner',
    estimated_hours INT DEFAULT 1,
    order_index INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_category (category),
    INDEX idx_order_index (order_index),
    INDEX idx_difficulty (difficulty)
);

-- Lessons table
CREATE TABLE IF NOT EXISTS lessons (
    id VARCHAR(36) PRIMARY KEY,
    module_id VARCHAR(36) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    content_md LONGTEXT,
    starter_code JSON,
    test_spec_json JSON,
    solution_code JSON,
    difficulty ENUM('easy', 'medium', 'hard') DEFAULT 'easy',
    duration_minutes INT DEFAULT 15,
    xp_reward INT DEFAULT 10,
    order_index INT DEFAULT 0,
    prerequisites JSON,
    learning_objectives JSON,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (module_id) REFERENCES modules(id) ON DELETE CASCADE,
    INDEX idx_module_id (module_id),
    INDEX idx_order_index (order_index),
    INDEX idx_difficulty (difficulty)
);

-- Challenges table
CREATE TABLE IF NOT EXISTS challenges (
    id VARCHAR(36) PRIMARY KEY,
    slug VARCHAR(100) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    instructions LONGTEXT,
    starter_code JSON,
    solution_code JSON,
    tests JSON,
    difficulty ENUM('easy', 'medium', 'hard') DEFAULT 'easy',
    xp_reward INT DEFAULT 25,
    category ENUM('html', 'css', 'javascript', 'mixed') NOT NULL,
    tags JSON,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_category (category),
    INDEX idx_difficulty (difficulty)
);

-- User lesson completions
CREATE TABLE IF NOT EXISTS user_lesson_completions (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    lesson_id VARCHAR(36) NOT NULL,
    completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    xp_earned INT DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_lesson (user_id, lesson_id),
    INDEX idx_user_id (user_id),
    INDEX idx_lesson_id (lesson_id)
);

-- User challenge attempts
CREATE TABLE IF NOT EXISTS user_challenge_attempts (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    challenge_id VARCHAR(36) NOT NULL,
    code JSON,
    is_completed BOOLEAN DEFAULT FALSE,
    tests_passed INT DEFAULT 0,
    total_tests INT DEFAULT 0,
    xp_earned INT DEFAULT 0,
    completed_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (challenge_id) REFERENCES challenges(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_challenge_id (challenge_id),
    INDEX idx_completed (is_completed)
);

-- User achievements
CREATE TABLE IF NOT EXISTS user_achievements (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    achievement_id VARCHAR(100) NOT NULL,
    earned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_achievement (user_id, achievement_id),
    INDEX idx_user_id (user_id)
);

-- User projects
CREATE TABLE IF NOT EXISTS user_projects (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    code JSON,
    is_public BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_public (is_public)
);

-- Games and mini-games results
CREATE TABLE IF NOT EXISTS game_results (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    game_type VARCHAR(100) NOT NULL,
    score INT DEFAULT 0,
    level_reached INT DEFAULT 1,
    time_spent INT DEFAULT 0,
    xp_earned INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_game_type (game_type),
    INDEX idx_score (score)
);

-- User statistics (aggregated data for performance)
CREATE TABLE IF NOT EXISTS user_statistics (
    user_id VARCHAR(36) PRIMARY KEY,
    html_xp INT DEFAULT 0,
    html_lessons INT DEFAULT 0,
    html_progress DECIMAL(5,2) DEFAULT 0.00,
    css_xp INT DEFAULT 0,
    css_lessons INT DEFAULT 0,
    css_progress DECIMAL(5,2) DEFAULT 0.00,
    javascript_xp INT DEFAULT 0,
    javascript_lessons INT DEFAULT 0,
    javascript_progress DECIMAL(5,2) DEFAULT 0.00,
    challenges_completed INT DEFAULT 0,
    games_played INT DEFAULT 0,
    projects_created INT DEFAULT 0,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create views for common queries
CREATE OR REPLACE VIEW user_leaderboard AS
SELECT 
    u.id,
    u.name,
    u.email,
    up.total_xp,
    up.level,
    up.streak,
    us.challenges_completed,
    us.projects_created,
    COUNT(ua.id) as total_achievements,
    ROW_NUMBER() OVER (ORDER BY up.total_xp DESC) as rank_position
FROM users u
LEFT JOIN user_progress up ON u.id = up.user_id
LEFT JOIN user_statistics us ON u.id = us.user_id
LEFT JOIN user_achievements ua ON u.id = ua.user_id
GROUP BY u.id, u.name, u.email, up.total_xp, up.level, up.streak, us.challenges_completed, us.projects_created
ORDER BY up.total_xp DESC;

-- Note: Triggers will be created separately to avoid syntax issues