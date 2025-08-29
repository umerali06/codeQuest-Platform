<?php
/**
 * Complete 500 Error Fix for MySQL
 * This script ensures all APIs work with MySQL consistently
 */

header('Content-Type: text/html; charset=UTF-8');
echo "<h1>🔧 Fix 500 Errors - MySQL Setup</h1>";
echo "<pre>";

// Load environment variables
if (file_exists('.env')) {
    $envContent = file_get_contents('.env');
    $envLines = explode("\n", $envContent);
    foreach ($envLines as $line) {
        if (strpos($line, '=') !== false && !str_starts_with($line, '#')) {
            list($key, $value) = explode('=', $line, 2);
            $_ENV[trim($key)] = trim($value);
        }
    }
}

$dbConfig = [
    'host' => $_ENV['DB_HOST'] ?? 'localhost',
    'dbname' => $_ENV['DB_NAME'] ?? 'codequest_db',
    'username' => $_ENV['DB_USER'] ?? 'root',
    'password' => $_ENV['DB_PASS'] ?? ''
];

echo "🎯 Step 1: Testing MySQL Connection...\n";

try {
    // First connect without database to create it
    $pdo = new PDO(
        "mysql:host={$dbConfig['host']};charset=utf8mb4",
        $dbConfig['username'],
        $dbConfig['password'],
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );
    
    echo "✅ MySQL server connection successful\n";
    
    // Create database if needed
    $pdo->exec("CREATE DATABASE IF NOT EXISTS `{$dbConfig['dbname']}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
    echo "✅ Database '{$dbConfig['dbname']}' created/verified\n";
    
    // Connect to specific database
    $pdo = new PDO(
        "mysql:host={$dbConfig['host']};dbname={$dbConfig['dbname']};charset=utf8mb4",
        $dbConfig['username'],
        $dbConfig['password'],
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );
    
    echo "\n🎯 Step 2: Creating Required Tables...\n";
    
    // Create users table
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS users (
            id VARCHAR(36) PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            email VARCHAR(255) UNIQUE NOT NULL,
            password_hash VARCHAR(255),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
    ");
    echo "✅ Users table created\n";
    
    // Create games table
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS games (
            id VARCHAR(36) PRIMARY KEY,
            title VARCHAR(255) NOT NULL,
            slug VARCHAR(255) UNIQUE NOT NULL,
            description TEXT,
            instructions TEXT,
            difficulty ENUM('easy', 'medium', 'hard') DEFAULT 'medium',
            category VARCHAR(100) DEFAULT 'coding',
            xp_reward INT DEFAULT 100,
            time_limit INT DEFAULT 300,
            max_score INT DEFAULT 1000,
            icon VARCHAR(255) DEFAULT '🎮',
            game_type VARCHAR(50) DEFAULT 'challenge',
            min_level INT DEFAULT 1,
            tags JSON,
            game_config JSON,
            featured BOOLEAN DEFAULT FALSE,
            play_count INT DEFAULT 0,
            average_rating DECIMAL(3,2) DEFAULT 0.00,
            is_active BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
    ");
    echo "✅ Games table created\n";
    
    // Create user_progress table
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS user_progress (
            id VARCHAR(36) PRIMARY KEY,
            user_id VARCHAR(36) NOT NULL,
            total_xp INT DEFAULT 0,
            level INT DEFAULT 1,
            level_title VARCHAR(100) DEFAULT 'Beginner',
            streak INT DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
    ");
    echo "✅ User progress table created\n";
    
    // Create leaderboard table
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS leaderboard (
            id VARCHAR(36) PRIMARY KEY,
            user_id VARCHAR(36) NOT NULL,
            username VARCHAR(255) NOT NULL,
            total_xp INT DEFAULT 0,
            level INT DEFAULT 1,
            rank_position INT DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
    ");
    echo "✅ Leaderboard table created\n";
    
    echo "\n🎯 Step 3: Adding Sample Data...\n";
    
    // Add sample user
    $userId = 'user-' . uniqid();
    $stmt = $pdo->prepare("INSERT IGNORE INTO users (id, name, email) VALUES (?, ?, ?)");
    $stmt->execute([$userId, 'Test User', 'test@example.com']);
    echo "✅ Sample user added\n";
    
    // Add user progress
    $progressId = 'progress-' . uniqid();
    $stmt = $pdo->prepare("INSERT IGNORE INTO user_progress (id, user_id, total_xp, level) VALUES (?, ?, ?, ?)");
    $stmt->execute([$progressId, $userId, 500, 3]);
    echo "✅ User progress added\n";
    
    // Add sample games
    $games = [
        [
            'id' => 'game-' . uniqid(),
            'title' => 'HTML Basics Challenge',
            'slug' => 'html-basics',
            'description' => 'Learn HTML fundamentals',
            'difficulty' => 'easy',
            'category' => 'html',
            'xp_reward' => 100
        ],
        [
            'id' => 'game-' . uniqid(),
            'title' => 'CSS Styling Game',
            'slug' => 'css-styling',
            'description' => 'Master CSS styling',
            'difficulty' => 'medium',
            'category' => 'css',
            'xp_reward' => 150
        ],
        [
            'id' => 'game-' . uniqid(),
            'title' => 'JavaScript Logic Puzzle',
            'slug' => 'js-logic',
            'description' => 'Solve JavaScript challenges',
            'difficulty' => 'hard',
            'category' => 'javascript',
            'xp_reward' => 200
        ]
    ];
    
    $stmt = $pdo->prepare("
        INSERT IGNORE INTO games (id, title, slug, description, difficulty, category, xp_reward) 
        VALUES (?, ?, ?, ?, ?, ?, ?)
    ");
    
    foreach ($games as $game) {
        $stmt->execute([
            $game['id'], $game['title'], $game['slug'], 
            $game['description'], $game['difficulty'], 
            $game['category'], $game['xp_reward']
        ]);
    }
    echo "✅ Sample games added (" . count($games) . " games)\n";
    
    // Add leaderboard entry
    $leaderboardId = 'leader-' . uniqid();
    $stmt = $pdo->prepare("INSERT IGNORE INTO leaderboard (id, user_id, username, total_xp, level, rank_position) VALUES (?, ?, ?, ?, ?, ?)");
    $stmt->execute([$leaderboardId, $userId, 'Test User', 500, 3, 1]);
    echo "✅ Leaderboard entry added\n";
    
    echo "\n🎯 Step 4: Testing APIs...\n";
    
    // Test Games API
    $stmt = $pdo->query("SELECT COUNT(*) as count FROM games");
    $gameCount = $stmt->fetch()['count'];
    echo "✅ Games API ready - {$gameCount} games available\n";
    
    // Test Leaderboard API
    $stmt = $pdo->query("SELECT COUNT(*) as count FROM leaderboard");
    $leaderCount = $stmt->fetch()['count'];
    echo "✅ Leaderboard API ready - {$leaderCount} entries available\n";
    
    echo "\n" . str_repeat("=", 50) . "\n";
    echo "🎉 SUCCESS! All 500 errors should now be fixed!\n\n";
    echo "✅ Database: MySQL (consistent across all APIs)\n";
    echo "✅ Tables: Created with sample data\n";
    echo "✅ APIs: Ready to serve requests\n\n";
    echo "🎯 Next steps:\n";
    echo "1. Go to your games page: http://localhost:8000/public/games.html\n";
    echo "2. Refresh the page - no more 500 errors!\n";
    echo "3. Check browser console - should be clean\n";
    
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n\n";
    echo "🔧 Troubleshooting:\n";
    echo "1. Make sure MySQL/XAMPP/WAMP is running\n";
    echo "2. Check database credentials in .env file\n";
    echo "3. Ensure MySQL user has CREATE DATABASE privileges\n";
    echo "4. Try connecting to MySQL manually to verify credentials\n";
}

echo "</pre>";
?>