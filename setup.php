<?php
/**
 * Fixed CodeQuest Setup Script
 * Simplified database initialization without complex triggers
 */

require_once __DIR__ . '/vendor/autoload.php';

// Load environment variables
$dotenv = Dotenv\Dotenv::createImmutable(__DIR__);
$dotenv->load();

echo "🚀 CodeQuest Setup Script (Fixed)\n";
echo "==================================\n\n";

// Database configuration
$dbConfig = [
    'host' => $_ENV['DB_HOST'] ?? 'localhost',
    'dbname' => $_ENV['DB_NAME'] ?? 'codequest_db',
    'username' => $_ENV['DB_USER'] ?? 'root',
    'password' => $_ENV['DB_PASS'] ?? ''
];

try {
    // Connect to MySQL server (without database)
    $pdo = new PDO(
        "mysql:host={$dbConfig['host']};charset=utf8mb4",
        $dbConfig['username'],
        $dbConfig['password'],
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
        ]
    );
    
    echo "✅ Connected to MySQL server\n";
    
    // Create database if it doesn't exist
    $pdo->exec("CREATE DATABASE IF NOT EXISTS {$dbConfig['dbname']} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
    echo "✅ Database '{$dbConfig['dbname']}' created/verified\n";
    
    // Connect to the specific database
    $pdo->exec("USE {$dbConfig['dbname']}");
    
    // Create tables step by step
    createTables($pdo);
    
    // Create sample data
    createSampleData($pdo);
    
    echo "\n🎉 Setup completed successfully!\n";
    echo "\nNext steps:\n";
    echo "1. Start your web server: php -S localhost:8000 -t public\n";
    echo "2. Visit http://localhost:8000 to see the platform\n";
    echo "3. Test Appwrite: http://localhost:8000/test-appwrite.html\n";
    echo "4. Check API health: http://localhost:8000/api/health\n\n";
    
} catch (PDOException $e) {
    echo "❌ Database error: " . $e->getMessage() . "\n";
    exit(1);
} catch (Exception $e) {
    echo "❌ Setup error: " . $e->getMessage() . "\n";
    exit(1);
}

function createTables($pdo) {
    echo "📝 Creating database tables...\n";
    
    // Users table
    $pdo->exec("
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
        )
    ");
    
    // User progress table
    $pdo->exec("
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
        )
    ");
    
    // Modules table
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS modules (
            id VARCHAR(36) PRIMARY KEY,
            slug VARCHAR(100) UNIQUE NOT NULL,
            title VARCHAR(255) NOT NULL,
            description TEXT,
            category ENUM('html', 'css', 'javascript', 'projects') NOT NULL,
            order_index INT DEFAULT 0,
            is_active BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_category (category),
            INDEX idx_order_index (order_index)
        )
    ");
    
    // Lessons table
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS lessons (
            id VARCHAR(36) PRIMARY KEY,
            module_id VARCHAR(36) NOT NULL,
            slug VARCHAR(100) UNIQUE NOT NULL,
            title VARCHAR(255) NOT NULL,
            description TEXT,
            content LONGTEXT,
            xp_reward INT DEFAULT 10,
            order_index INT DEFAULT 0,
            prerequisites JSON,
            is_active BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (module_id) REFERENCES modules(id) ON DELETE CASCADE,
            INDEX idx_module_id (module_id),
            INDEX idx_order_index (order_index)
        )
    ");
    
    // Challenges table
    $pdo->exec("
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
        )
    ");
    
    // User lesson completions
    $pdo->exec("
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
        )
    ");
    
    // User challenge attempts
    $pdo->exec("
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
        )
    ");
    
    // User achievements
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS user_achievements (
            id VARCHAR(36) PRIMARY KEY,
            user_id VARCHAR(36) NOT NULL,
            achievement_id VARCHAR(100) NOT NULL,
            earned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            UNIQUE KEY unique_user_achievement (user_id, achievement_id),
            INDEX idx_user_id (user_id)
        )
    ");
    
    // User projects
    $pdo->exec("
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
        )
    ");
    
    // User statistics
    $pdo->exec("
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
        )
    ");
    
    echo "✅ Database tables created successfully\n";
}

function createSampleData($pdo) {
    echo "📝 Creating sample data...\n";
    
    // Create sample modules
    $modules = [
        [generateUuid(), 'html-basics', 'HTML Basics', 'Learn the fundamentals of HTML', 'html', 1],
        [generateUuid(), 'css-fundamentals', 'CSS Fundamentals', 'Master CSS styling and layout', 'css', 2],
        [generateUuid(), 'javascript-essentials', 'JavaScript Essentials', 'Programming with JavaScript', 'javascript', 3]
    ];
    
    $stmt = $pdo->prepare("
        INSERT IGNORE INTO modules (id, slug, title, description, category, order_index) 
        VALUES (?, ?, ?, ?, ?, ?)
    ");
    
    foreach ($modules as $module) {
        $stmt->execute($module);
    }
    
    // Get module IDs
    $htmlModuleId = $pdo->query("SELECT id FROM modules WHERE slug = 'html-basics'")->fetchColumn();
    $cssModuleId = $pdo->query("SELECT id FROM modules WHERE slug = 'css-fundamentals'")->fetchColumn();
    $jsModuleId = $pdo->query("SELECT id FROM modules WHERE slug = 'javascript-essentials'")->fetchColumn();
    
    // Create sample lessons
    $lessons = [
        [generateUuid(), $htmlModuleId, 'html-introduction', 'Introduction to HTML', 'Learn what HTML is and how it works', '<h1>Welcome to HTML</h1><p>HTML is the foundation of web development...</p>', 10, 1],
        [generateUuid(), $htmlModuleId, 'html-elements', 'HTML Elements and Tags', 'Understanding HTML elements and their structure', '<h1>HTML Elements</h1><p>Learn about different HTML elements...</p>', 15, 2],
        [generateUuid(), $cssModuleId, 'css-introduction', 'Introduction to CSS', 'Learn how to style HTML with CSS', '<h1>Welcome to CSS</h1><p>CSS controls the appearance of HTML...</p>', 10, 1],
        [generateUuid(), $cssModuleId, 'css-selectors', 'CSS Selectors', 'Master different types of CSS selectors', '<h1>CSS Selectors</h1><p>Learn how to target HTML elements...</p>', 15, 2],
        [generateUuid(), $jsModuleId, 'js-introduction', 'Introduction to JavaScript', 'Learn the basics of JavaScript programming', '<h1>Welcome to JavaScript</h1><p>JavaScript adds interactivity...</p>', 10, 1]
    ];
    
    $stmt = $pdo->prepare("
        INSERT IGNORE INTO lessons (id, module_id, slug, title, description, content, xp_reward, order_index) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ");
    
    foreach ($lessons as $lesson) {
        $stmt->execute($lesson);
    }
    
    // Create sample challenges
    $challenges = [
        [
            generateUuid(), 
            'contact-card', 
            'Contact Card Component', 
            'Create a responsive contact card', 
            'Build a contact card with HTML and CSS that displays contact information in an attractive format.',
            '{"html":"<div class=\\"card\\">\\n  <!-- Add your content here -->\\n</div>","css":".card {\\n  /* Add your styles here */\\n}","js":""}',
            '{"html":"<div class=\\"card\\">\\n  <h2>John Doe</h2>\\n  <p>Web Developer</p>\\n  <p>john@example.com</p>\\n</div>","css":".card {\\n  padding: 20px;\\n  border-radius: 8px;\\n  box-shadow: 0 2px 4px rgba(0,0,0,0.1);\\n  background: white;\\n}","js":""}',
            '[{"type":"element_exists","selector":"div","name":"Card container exists"},{"type":"css_property","property":"padding","name":"Card has padding"}]',
            'easy', 
            25, 
            'html'
        ],
        [
            generateUuid(), 
            'responsive-nav', 
            'Responsive Navigation', 
            'Build a mobile-friendly navigation menu', 
            'Create a navigation menu that works well on both desktop and mobile devices.',
            '{"html":"<nav>\\n  <!-- Add navigation here -->\\n</nav>","css":"nav {\\n  /* Add styles here */\\n}","js":""}',
            '{"html":"<nav>\\n  <ul>\\n    <li><a href=\\"#\\">Home</a></li>\\n    <li><a href=\\"#\\">About</a></li>\\n    <li><a href=\\"#\\">Contact</a></li>\\n  </ul>\\n</nav>","css":"nav ul {\\n  display: flex;\\n  list-style: none;\\n  margin: 0;\\n  padding: 0;\\n}\\nnav li {\\n  margin-right: 1rem;\\n}","js":""}',
            '[{"type":"element_exists","selector":"nav","name":"Navigation element exists"},{"type":"element_exists","selector":"ul","name":"List element exists"}]',
            'medium', 
            50, 
            'css'
        ]
    ];
    
    $stmt = $pdo->prepare("
        INSERT IGNORE INTO challenges (id, slug, title, description, instructions, starter_code, solution_code, tests, difficulty, xp_reward, category) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ");
    
    foreach ($challenges as $challenge) {
        $stmt->execute($challenge);
    }
    
    echo "✅ Sample data created successfully\n";
}

function generateUuid() {
    return sprintf(
        '%04x%04x-%04x-%04x-%04x-%04x%04x%04x',
        mt_rand(0, 0xffff), mt_rand(0, 0xffff),
        mt_rand(0, 0xffff),
        mt_rand(0, 0x0fff) | 0x4000,
        mt_rand(0, 0x3fff) | 0x8000,
        mt_rand(0, 0xffff), mt_rand(0, 0xffff), mt_rand(0, 0xffff)
    );
}
?>