<?php
/**
 * Complete Database Setup Script
 * This script creates all necessary tables and sample data
 */

// Enable error reporting
error_reporting(E_ALL);
ini_set('display_errors', 1);

echo "<h1>🔧 Complete Database Setup</h1>\n";
echo "<p>Setting up all required tables and sample data...</p>\n";

// Database configuration
$dbHost = 'localhost';
$dbName = 'codequest';
$dbUser = 'root';
$dbPass = '';

try {
    // Connect to MySQL server (without database)
    $pdo = new PDO("mysql:host=$dbHost;charset=utf8mb4", $dbUser, $dbPass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
    ]);

    // Create database if it doesn't exist
    $pdo->exec("CREATE DATABASE IF NOT EXISTS `$dbName`");
    echo "✅ Database '$dbName' created/verified<br>\n";

    // Connect to the specific database
    $pdo = new PDO("mysql:host=$dbHost;dbname=$dbName;charset=utf8mb4", $dbUser, $dbPass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
    ]);

    echo "<h2>📊 Creating Tables</h2>\n";

    // Create games table
    $gamesTableSQL = "
        CREATE TABLE IF NOT EXISTS games (
            id INT AUTO_INCREMENT PRIMARY KEY,
            title VARCHAR(255) NOT NULL,
            slug VARCHAR(255) UNIQUE NOT NULL,
            description TEXT,
            instructions TEXT,
            difficulty ENUM('easy', 'medium', 'hard') DEFAULT 'medium',
            category VARCHAR(100),
            xp_reward INT DEFAULT 0,
            time_limit INT DEFAULT 0,
            max_score INT DEFAULT 100,
            game_type VARCHAR(50) DEFAULT 'interactive',
            game_config JSON,
            tags JSON,
            is_active BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
    ";
    $pdo->exec($gamesTableSQL);
    echo "✅ Games table created<br>\n";

    // Create leaderboard table
    $leaderboardTableSQL = "
        CREATE TABLE IF NOT EXISTS leaderboard (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT,
            username VARCHAR(255),
            total_xp INT DEFAULT 0,
            challenges_completed INT DEFAULT 0,
            games_played INT DEFAULT 0,
            total_score INT DEFAULT 0,
            rank_position INT DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
    ";
    $pdo->exec($leaderboardTableSQL);
    echo "✅ Leaderboard table created<br>\n";

    // Create challenges table
    $challengesTableSQL = "
        CREATE TABLE IF NOT EXISTS challenges (
            id INT AUTO_INCREMENT PRIMARY KEY,
            title VARCHAR(255) NOT NULL,
            slug VARCHAR(255) UNIQUE NOT NULL,
            description TEXT,
            instructions TEXT,
            difficulty ENUM('easy', 'medium', 'hard') DEFAULT 'medium',
            category VARCHAR(100),
            xp_reward INT DEFAULT 0,
            starter_code JSON,
            test_cases JSON,
            tags JSON,
            is_active BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
    ";
    $pdo->exec($challengesTableSQL);
    echo "✅ Challenges table created<br>\n";

    // Create users table
    $usersTableSQL = "
        CREATE TABLE IF NOT EXISTS users (
            id INT AUTO_INCREMENT PRIMARY KEY,
            username VARCHAR(255) UNIQUE NOT NULL,
            email VARCHAR(255) UNIQUE NOT NULL,
            password_hash VARCHAR(255),
            total_xp INT DEFAULT 0,
            level INT DEFAULT 1,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
    ";
    $pdo->exec($usersTableSQL);
    echo "✅ Users table created<br>\n";

    // Create learning_paths table
    $learningPathsTableSQL = "
        CREATE TABLE IF NOT EXISTS learning_paths (
            id INT AUTO_INCREMENT PRIMARY KEY,
            title VARCHAR(255) NOT NULL,
            slug VARCHAR(255) UNIQUE NOT NULL,
            description TEXT,
            difficulty ENUM('beginner', 'intermediate', 'advanced') DEFAULT 'beginner',
            estimated_hours INT DEFAULT 0,
            category VARCHAR(100),
            tags JSON,
            is_active BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
    ";
    $pdo->exec($learningPathsTableSQL);
    echo "✅ Learning paths table created<br>\n";

    // Create lessons table
    $lessonsTableSQL = "
        CREATE TABLE IF NOT EXISTS lessons (
            id INT AUTO_INCREMENT PRIMARY KEY,
            title VARCHAR(255) NOT NULL,
            slug VARCHAR(255) UNIQUE NOT NULL,
            content TEXT,
            learning_path_id INT,
            order_index INT DEFAULT 0,
            duration_minutes INT DEFAULT 0,
            difficulty ENUM('beginner', 'intermediate', 'advanced') DEFAULT 'beginner',
            is_active BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (learning_path_id) REFERENCES learning_paths(id) ON DELETE CASCADE
        )
    ";
    $pdo->exec($lessonsTableSQL);
    echo "✅ Lessons table created<br>\n";

    echo "<h2>📝 Inserting Sample Data</h2>\n";

    // Insert sample games
    $stmt = $pdo->prepare("SELECT COUNT(*) FROM games");
    $stmt->execute();
    if ($stmt->fetchColumn() == 0) {
        $gamesData = [
            [
                'title' => 'Speed Coding Challenge',
                'slug' => 'speed-coding',
                'description' => 'Test your coding speed and accuracy in this fast-paced challenge',
                'instructions' => 'Write clean, functional code as quickly as possible. You have 5 minutes to complete each task.',
                'difficulty' => 'medium',
                'category' => 'JavaScript',
                'xp_reward' => 100,
                'time_limit' => 300,
                'max_score' => 100,
                'game_type' => 'timed',
                'tags' => '["speed", "coding", "javascript"]'
            ],
            [
                'title' => 'Bug Hunt Adventure',
                'slug' => 'bug-hunt',
                'description' => 'Find and fix bugs in various code snippets',
                'instructions' => 'Identify syntax errors, logic bugs, and performance issues in the provided code.',
                'difficulty' => 'hard',
                'category' => 'Debugging',
                'xp_reward' => 150,
                'time_limit' => 600,
                'max_score' => 100,
                'game_type' => 'puzzle',
                'tags' => '["debugging", "problem-solving"]'
            ],
            [
                'title' => 'Algorithm Race',
                'slug' => 'algorithm-race',
                'description' => 'Solve algorithmic problems efficiently',
                'instructions' => 'Implement optimal algorithms for sorting, searching, and data manipulation.',
                'difficulty' => 'hard',
                'category' => 'Algorithms',
                'xp_reward' => 200,
                'time_limit' => 900,
                'max_score' => 100,
                'game_type' => 'competitive',
                'tags' => '["algorithms", "optimization", "data-structures"]'
            ]
        ];

        $insertGameSQL = "INSERT INTO games (title, slug, description, instructions, difficulty, category, xp_reward, time_limit, max_score, game_type, tags) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
        $stmt = $pdo->prepare($insertGameSQL);

        foreach ($gamesData as $game) {
            $stmt->execute([
                $game['title'], $game['slug'], $game['description'], $game['instructions'],
                $game['difficulty'], $game['category'], $game['xp_reward'], $game['time_limit'],
                $game['max_score'], $game['game_type'], $game['tags']
            ]);
        }
        echo "✅ Sample games inserted<br>\n";
    } else {
        echo "ℹ️ Games data already exists<br>\n";
    }

    // Insert sample leaderboard data
    $stmt = $pdo->prepare("SELECT COUNT(*) FROM leaderboard");
    $stmt->execute();
    if ($stmt->fetchColumn() == 0) {
        $leaderboardData = [
            ['CodeMaster', 2500, 15, 8, 950, 1],
            ['DevNinja', 2200, 12, 10, 880, 2],
            ['ScriptWizard', 1800, 10, 6, 720, 3],
            ['ByteHunter', 1500, 8, 5, 600, 4],
            ['LogicLord', 1200, 6, 4, 480, 5],
            ['CodeCrusher', 1000, 5, 3, 400, 6],
            ['DebugDemon', 800, 4, 2, 320, 7],
            ['AlgoAce', 600, 3, 2, 240, 8]
        ];

        $insertLeaderboardSQL = "INSERT INTO leaderboard (username, total_xp, challenges_completed, games_played, total_score, rank_position) VALUES (?, ?, ?, ?, ?, ?)";
        $stmt = $pdo->prepare($insertLeaderboardSQL);

        foreach ($leaderboardData as $entry) {
            $stmt->execute($entry);
        }
        echo "✅ Sample leaderboard data inserted<br>\n";
    } else {
        echo "ℹ️ Leaderboard data already exists<br>\n";
    }

    // Insert sample challenges
    $stmt = $pdo->prepare("SELECT COUNT(*) FROM challenges");
    $stmt->execute();
    if ($stmt->fetchColumn() == 0) {
        $challengesData = [
            [
                'title' => 'Contact Card Creator',
                'slug' => 'contact-card',
                'description' => 'Create a responsive contact card using HTML and CSS',
                'instructions' => 'Build a contact card that displays a person\'s name, email, phone, and photo. Make it responsive and visually appealing.',
                'difficulty' => 'easy',
                'category' => 'HTML/CSS',
                'xp_reward' => 50,
                'starter_code' => '{"html": "<!-- Create your contact card here -->\\n<div class=\\"contact-card\\">\\n  \\n</div>", "css": "/* Style your contact card */\\n.contact-card {\\n  /* Add your styles here */\\n}", "js": "// Add any JavaScript if needed"}',
                'tags' => '["html", "css", "responsive"]'
            ],
            [
                'title' => 'Todo List App',
                'slug' => 'todo-list',
                'description' => 'Build a functional todo list with JavaScript',
                'instructions' => 'Create a todo list where users can add, remove, and mark tasks as complete. Include local storage to persist data.',
                'difficulty' => 'medium',
                'category' => 'JavaScript',
                'xp_reward' => 100,
                'starter_code' => '{"html": "<!-- Todo List HTML -->\\n<div class=\\"todo-app\\">\\n  <input type=\\"text\\" id=\\"todoInput\\" placeholder=\\"Add a task...\\">\\n  <button onclick=\\"addTodo()\\">Add</button>\\n  <ul id=\\"todoList\\"></ul>\\n</div>", "css": "/* Todo List Styles */\\n.todo-app {\\n  max-width: 400px;\\n  margin: 0 auto;\\n}", "js": "// Todo List JavaScript\\nfunction addTodo() {\\n  // Implement add functionality\\n}"}',
                'tags' => '["javascript", "dom", "local-storage"]'
            ]
        ];

        $insertChallengeSQL = "INSERT INTO challenges (title, slug, description, instructions, difficulty, category, xp_reward, starter_code, tags) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)";
        $stmt = $pdo->prepare($insertChallengeSQL);

        foreach ($challengesData as $challenge) {
            $stmt->execute([
                $challenge['title'], $challenge['slug'], $challenge['description'], $challenge['instructions'],
                $challenge['difficulty'], $challenge['category'], $challenge['xp_reward'], 
                $challenge['starter_code'], $challenge['tags']
            ]);
        }
        echo "✅ Sample challenges inserted<br>\n";
    } else {
        echo "ℹ️ Challenges data already exists<br>\n";
    }

    // Insert sample learning paths
    $stmt = $pdo->prepare("SELECT COUNT(*) FROM learning_paths");
    $stmt->execute();
    if ($stmt->fetchColumn() == 0) {
        $pathsData = [
            [
                'title' => 'Web Development Fundamentals',
                'slug' => 'web-fundamentals',
                'description' => 'Learn the basics of HTML, CSS, and JavaScript',
                'difficulty' => 'beginner',
                'estimated_hours' => 20,
                'category' => 'Web Development',
                'tags' => '["html", "css", "javascript", "beginner"]'
            ],
            [
                'title' => 'JavaScript Mastery',
                'slug' => 'javascript-mastery',
                'description' => 'Advanced JavaScript concepts and patterns',
                'difficulty' => 'intermediate',
                'estimated_hours' => 30,
                'category' => 'JavaScript',
                'tags' => '["javascript", "advanced", "es6", "async"]'
            ]
        ];

        $insertPathSQL = "INSERT INTO learning_paths (title, slug, description, difficulty, estimated_hours, category, tags) VALUES (?, ?, ?, ?, ?, ?, ?)";
        $stmt = $pdo->prepare($insertPathSQL);

        foreach ($pathsData as $path) {
            $stmt->execute([
                $path['title'], $path['slug'], $path['description'], $path['difficulty'],
                $path['estimated_hours'], $path['category'], $path['tags']
            ]);
        }
        echo "✅ Sample learning paths inserted<br>\n";
    } else {
        echo "ℹ️ Learning paths data already exists<br>\n";
    }

    echo "<h2>🧪 Testing API Endpoints</h2>\n";

    // Test games API
    $gamesCount = $pdo->query("SELECT COUNT(*) FROM games")->fetchColumn();
    echo "📊 Games in database: $gamesCount<br>\n";

    // Test leaderboard API
    $leaderboardCount = $pdo->query("SELECT COUNT(*) FROM leaderboard")->fetchColumn();
    echo "🏆 Leaderboard entries: $leaderboardCount<br>\n";

    // Test challenges API
    $challengesCount = $pdo->query("SELECT COUNT(*) FROM challenges")->fetchColumn();
    echo "🎯 Challenges in database: $challengesCount<br>\n";

    echo "<h2>✅ Setup Complete!</h2>\n";
    echo "<p><strong>All tables created and sample data inserted successfully!</strong></p>\n";
    echo "<p>You can now:</p>\n";
    echo "<ul>\n";
    echo "<li>✅ Load games from the API</li>\n";
    echo "<li>✅ View leaderboard data</li>\n";
    echo "<li>✅ Access challenges</li>\n";
    echo "<li>✅ Use learning paths</li>\n";
    echo "</ul>\n";

    echo "<h3>🔗 Test Links</h3>\n";
    echo "<p><a href='api/games' target='_blank'>Test Games API</a></p>\n";
    echo "<p><a href='api/leaderboard' target='_blank'>Test Leaderboard API</a></p>\n";
    echo "<p><a href='api/challenges' target='_blank'>Test Challenges API</a></p>\n";
    echo "<p><a href='api/config/appwrite' target='_blank'>Test Config API</a></p>\n";

} catch (PDOException $e) {
    echo "<h2>❌ Database Error</h2>\n";
    echo "<p>Error: " . $e->getMessage() . "</p>\n";
    echo "<p>Please make sure:</p>\n";
    echo "<ul>\n";
    echo "<li>MySQL server is running</li>\n";
    echo "<li>Database credentials are correct</li>\n";
    echo "<li>User has permission to create databases and tables</li>\n";
    echo "</ul>\n";
} catch (Exception $e) {
    echo "<h2>❌ General Error</h2>\n";
    echo "<p>Error: " . $e->getMessage() . "</p>\n";
}
?>