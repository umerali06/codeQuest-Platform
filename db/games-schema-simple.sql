-- Simple Games Database Schema (without triggers and views)
USE codequest_db;

-- Games table - stores all available games
CREATE TABLE IF NOT EXISTS games (
    id VARCHAR(36) PRIMARY KEY,
    slug VARCHAR(100) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    instructions LONGTEXT,
    category ENUM('speed', 'bugfix', 'memory', 'puzzle', 'algorithm', 'trivia', 'typing') NOT NULL,
    difficulty ENUM('easy', 'medium', 'hard', 'expert') DEFAULT 'medium',
    icon VARCHAR(10) DEFAULT '🎮',
    thumbnail_url VARCHAR(500),
    game_type ENUM('interactive', 'quiz', 'coding', 'visual') DEFAULT 'interactive',
    max_score INT DEFAULT 1000,
    time_limit INT DEFAULT 300,
    xp_reward INT DEFAULT 50,
    min_level INT DEFAULT 1,
    tags JSON,
    game_config JSON,
    is_active BOOLEAN DEFAULT TRUE,
    featured BOOLEAN DEFAULT FALSE,
    play_count INT DEFAULT 0,
    average_rating DECIMAL(3,2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_category (category),
    INDEX idx_difficulty (difficulty),
    INDEX idx_featured (featured),
    INDEX idx_active (is_active)
);

-- Game sessions - tracks individual game sessions
CREATE TABLE IF NOT EXISTS game_sessions (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    game_id VARCHAR(36) NOT NULL,
    session_token VARCHAR(100) UNIQUE NOT NULL,
    status ENUM('active', 'completed', 'abandoned') DEFAULT 'active',
    score INT DEFAULT 0,
    level_reached INT DEFAULT 1,
    time_spent INT DEFAULT 0,
    moves_made INT DEFAULT 0,
    hints_used INT DEFAULT 0,
    session_data JSON,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_game_id (game_id),
    INDEX idx_status (status),
    INDEX idx_session_token (session_token)
);

-- Game scores - stores high scores and achievements
CREATE TABLE IF NOT EXISTS game_scores (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    game_id VARCHAR(36) NOT NULL,
    session_id VARCHAR(36),
    score INT NOT NULL,
    time_spent INT DEFAULT 0,
    level_reached INT DEFAULT 1,
    perfect_score BOOLEAN DEFAULT FALSE,
    xp_earned INT DEFAULT 0,
    achievements JSON,
    score_data JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE,
    FOREIGN KEY (session_id) REFERENCES game_sessions(id) ON DELETE SET NULL,
    INDEX idx_user_game (user_id, game_id),
    INDEX idx_game_score (game_id, score DESC),
    INDEX idx_user_score (user_id, score DESC)
);

-- Game ratings - user ratings for games
CREATE TABLE IF NOT EXISTS game_ratings (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    game_id VARCHAR(36) NOT NULL,
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    review TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_game_rating (user_id, game_id),
    INDEX idx_game_rating (game_id, rating)
);

-- Game achievements - predefined achievements for games
CREATE TABLE IF NOT EXISTS game_achievements (
    id VARCHAR(36) PRIMARY KEY,
    game_id VARCHAR(36),
    achievement_key VARCHAR(100) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    icon VARCHAR(10) DEFAULT '🏆',
    xp_reward INT DEFAULT 10,
    requirement_type ENUM('score', 'time', 'level', 'streak', 'perfect', 'custom') NOT NULL,
    requirement_value JSON,
    is_hidden BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE,
    UNIQUE KEY unique_game_achievement (game_id, achievement_key),
    INDEX idx_game_id (game_id)
);

-- User game achievements - tracks earned achievements
CREATE TABLE IF NOT EXISTS user_game_achievements (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    achievement_id VARCHAR(36) NOT NULL,
    game_id VARCHAR(36) NOT NULL,
    session_id VARCHAR(36),
    earned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (achievement_id) REFERENCES game_achievements(id) ON DELETE CASCADE,
    FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE,
    FOREIGN KEY (session_id) REFERENCES game_sessions(id) ON DELETE SET NULL,
    UNIQUE KEY unique_user_achievement (user_id, achievement_id),
    INDEX idx_user_id (user_id),
    INDEX idx_game_id (game_id)
);

-- Game leaderboards - optimized leaderboard data
CREATE TABLE IF NOT EXISTS game_leaderboards (
    id VARCHAR(36) PRIMARY KEY,
    game_id VARCHAR(36) NOT NULL,
    user_id VARCHAR(36) NOT NULL,
    best_score INT NOT NULL,
    best_time INT,
    total_plays INT DEFAULT 1,
    average_score DECIMAL(8,2),
    rank_position INT,
    last_played TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_game_user (game_id, user_id),
    INDEX idx_game_score (game_id, best_score DESC),
    INDEX idx_rank (game_id, rank_position)
);

-- Game statistics - aggregated game statistics
CREATE TABLE IF NOT EXISTS game_statistics (
    game_id VARCHAR(36) PRIMARY KEY,
    total_plays INT DEFAULT 0,
    unique_players INT DEFAULT 0,
    average_score DECIMAL(8,2) DEFAULT 0.00,
    average_time DECIMAL(8,2) DEFAULT 0.00,
    completion_rate DECIMAL(5,2) DEFAULT 0.00,
    difficulty_rating DECIMAL(3,2) DEFAULT 0.00,
    last_played TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE
);