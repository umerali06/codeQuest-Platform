<?php
/**
 * Seed Games Data
 * Populates the database with comprehensive game data
 */

// Load environment variables
$envFile = __DIR__ . '/.env';
if (file_exists($envFile)) {
    $lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        if (strpos($line, '=') !== false && !str_starts_with($line, '#')) {
            list($key, $value) = explode('=', $line, 2);
            $_ENV[trim($key)] = trim($value);
        }
    }
}

// Database configuration
$dbConfig = [
    'host' => $_ENV['DB_HOST'] ?? 'localhost',
    'dbname' => $_ENV['DB_NAME'] ?? 'codequest',
    'username' => $_ENV['DB_USER'] ?? 'root',
    'password' => $_ENV['DB_PASS'] ?? ''
];

$dsn = "mysql:host={$dbConfig['host']};dbname={$dbConfig['dbname']};charset=utf8mb4";
$username = $dbConfig['username'];
$password = $dbConfig['password'];
$options = [
    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES => false
];

function generateUUID() {
    return sprintf(
        '%04x%04x-%04x-%04x-%04x-%04x%04x%04x',
        mt_rand(0, 0xffff), mt_rand(0, 0xffff),
        mt_rand(0, 0xffff),
        mt_rand(0, 0x0fff) | 0x4000,
        mt_rand(0, 0x3fff) | 0x8000,
        mt_rand(0, 0xffff), mt_rand(0, 0xffff), mt_rand(0, 0xffff)
    );
}

try {
    $pdo = new PDO($dsn, $username, $password, $options);
    echo "Connected to database successfully.\n";

    // Create games schema if not exists
    $schemaFile = __DIR__ . '/db/games-schema-simple.sql';
    if (file_exists($schemaFile)) {
        $schema = file_get_contents($schemaFile);
        
        // Split by semicolons and execute each statement separately
        $statements = array_filter(array_map('trim', explode(';', $schema)));
        
        foreach ($statements as $statement) {
            if (empty($statement)) {
                continue;
            }
            
            try {
                $pdo->exec($statement);
            } catch (Exception $e) {
                echo "Warning: " . $e->getMessage() . "\n";
            }
        }
        echo "Games schema created/updated.\n";
    }

    // Sample games data
    $games = [
        [
            'id' => generateUUID(),
            'slug' => 'css-selector-master',
            'title' => 'CSS Selector Master',
            'description' => 'Master CSS selectors by selecting the correct elements on the page. Test your knowledge of basic to advanced CSS selectors.',
            'instructions' => 'Look at the highlighted elements and write the CSS selector that would select them. Start with simple selectors and progress to complex ones.',
            'category' => 'puzzle',
            'difficulty' => 'medium',
            'icon' => '🎯',
            'game_type' => 'interactive',
            'max_score' => 1000,
            'time_limit' => 300,
            'xp_reward' => 75,
            'min_level' => 1,
            'tags' => json_encode(['css', 'selectors', 'web-development']),
            'game_config' => json_encode([
                'levels' => 10,
                'hints_allowed' => 3,
                'scoring' => [
                    'correct_first_try' => 100,
                    'correct_with_hint' => 50,
                    'time_bonus' => true
                ]
            ]),
            'featured' => true
        ],
        [
            'id' => generateUUID(),
            'slug' => 'javascript-debug-hunt',
            'title' => 'JavaScript Debug Hunt',
            'description' => 'Find and fix bugs in JavaScript code. Sharpen your debugging skills with real-world scenarios.',
            'instructions' => 'Each level presents buggy JavaScript code. Find the bugs, understand why they occur, and fix them to make the code work correctly.',
            'category' => 'bugfix',
            'difficulty' => 'hard',
            'icon' => '🐛',
            'game_type' => 'coding',
            'max_score' => 1500,
            'time_limit' => 600,
            'xp_reward' => 100,
            'min_level' => 3,
            'tags' => json_encode(['javascript', 'debugging', 'problem-solving']),
            'game_config' => json_encode([
                'levels' => 8,
                'hints_allowed' => 2,
                'code_editor' => true,
                'test_cases' => true
            ]),
            'featured' => true
        ],
        [
            'id' => generateUUID(),
            'slug' => 'html-speed-builder',
            'title' => 'HTML Speed Builder',
            'description' => 'Build HTML structures as fast as possible. Race against time to create semantic, valid HTML.',
            'instructions' => 'You will be given a design or description. Write the HTML code as quickly and accurately as possible.',
            'category' => 'speed',
            'difficulty' => 'easy',
            'icon' => '⚡',
            'game_type' => 'coding',
            'max_score' => 800,
            'time_limit' => 180,
            'xp_reward' => 50,
            'min_level' => 1,
            'tags' => json_encode(['html', 'speed', 'semantic-markup']),
            'game_config' => json_encode([
                'levels' => 6,
                'auto_complete' => false,
                'syntax_highlighting' => true,
                'live_preview' => true
            ]),
            'featured' => false
        ],
        [
            'id' => generateUUID(),
            'slug' => 'code-memory-challenge',
            'title' => 'Code Memory Challenge',
            'description' => 'Test your memory by remembering code patterns, function names, and syntax structures.',
            'instructions' => 'Study the code snippet for a few seconds, then reproduce it from memory. Accuracy and speed both matter.',
            'category' => 'memory',
            'difficulty' => 'medium',
            'icon' => '🧠',
            'game_type' => 'interactive',
            'max_score' => 1200,
            'time_limit' => 240,
            'xp_reward' => 60,
            'min_level' => 2,
            'tags' => json_encode(['memory', 'patterns', 'syntax']),
            'game_config' => json_encode([
                'levels' => 12,
                'study_time' => [3, 5, 8, 10], // seconds per level
                'languages' => ['html', 'css', 'javascript']
            ]),
            'featured' => false
        ],
        [
            'id' => generateUUID(),
            'slug' => 'algorithm-optimizer',
            'title' => 'Algorithm Optimizer',
            'description' => 'Optimize algorithms for better performance. Learn Big O notation through practical challenges.',
            'instructions' => 'Analyze the given algorithm and optimize it for better time or space complexity. Understand trade-offs and performance implications.',
            'category' => 'algorithm',
            'difficulty' => 'expert',
            'icon' => '📊',
            'game_type' => 'coding',
            'max_score' => 2000,
            'time_limit' => 900,
            'xp_reward' => 150,
            'min_level' => 5,
            'tags' => json_encode(['algorithms', 'optimization', 'big-o', 'performance']),
            'game_config' => json_encode([
                'levels' => 5,
                'complexity_analysis' => true,
                'performance_testing' => true,
                'hints_allowed' => 1
            ]),
            'featured' => true
        ],
        [
            'id' => generateUUID(),
            'slug' => 'web-dev-trivia',
            'title' => 'Web Dev Trivia',
            'description' => 'Test your web development knowledge with rapid-fire trivia questions covering HTML, CSS, and JavaScript.',
            'instructions' => 'Answer as many questions correctly as possible within the time limit. Questions range from basic concepts to advanced topics.',
            'category' => 'trivia',
            'difficulty' => 'easy',
            'icon' => '❓',
            'game_type' => 'quiz',
            'max_score' => 500,
            'time_limit' => 120,
            'xp_reward' => 30,
            'min_level' => 1,
            'tags' => json_encode(['trivia', 'knowledge', 'quick-thinking']),
            'game_config' => json_encode([
                'questions_per_game' => 20,
                'categories' => ['html', 'css', 'javascript', 'general'],
                'difficulty_progression' => true
            ]),
            'featured' => false
        ],
        [
            'id' => generateUUID(),
            'slug' => 'typing-code-racer',
            'title' => 'Code Typing Racer',
            'description' => 'Improve your coding speed by typing code snippets as fast and accurately as possible.',
            'instructions' => 'Type the displayed code exactly as shown. Focus on accuracy first, then speed. Learn common coding patterns.',
            'category' => 'typing',
            'difficulty' => 'easy',
            'icon' => '⌨️',
            'game_type' => 'interactive',
            'max_score' => 600,
            'time_limit' => 300,
            'xp_reward' => 40,
            'min_level' => 1,
            'tags' => json_encode(['typing', 'speed', 'muscle-memory']),
            'game_config' => json_encode([
                'wpm_tracking' => true,
                'accuracy_tracking' => true,
                'code_snippets' => ['functions', 'loops', 'conditionals', 'objects']
            ]),
            'featured' => false
        ],
        [
            'id' => generateUUID(),
            'slug' => 'responsive-design-puzzle',
            'title' => 'Responsive Design Puzzle',
            'description' => 'Create responsive layouts using CSS Grid and Flexbox. Master modern layout techniques.',
            'instructions' => 'Use CSS Grid, Flexbox, and media queries to create responsive layouts that work on all screen sizes.',
            'category' => 'puzzle',
            'difficulty' => 'hard',
            'icon' => '📱',
            'game_type' => 'visual',
            'max_score' => 1300,
            'time_limit' => 450,
            'xp_reward' => 90,
            'min_level' => 4,
            'tags' => json_encode(['css', 'responsive', 'grid', 'flexbox']),
            'game_config' => json_encode([
                'levels' => 6,
                'breakpoints' => ['mobile', 'tablet', 'desktop'],
                'live_preview' => true,
                'device_simulation' => true
            ]),
            'featured' => true
        ]
    ];

    // Insert games
    $stmt = $pdo->prepare("
        INSERT INTO games (
            id, slug, title, description, instructions, category, difficulty, 
            icon, game_type, max_score, time_limit, xp_reward, min_level, 
            tags, game_config, featured
        ) VALUES (
            ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
        ) ON DUPLICATE KEY UPDATE
            title = VALUES(title),
            description = VALUES(description),
            instructions = VALUES(instructions),
            updated_at = CURRENT_TIMESTAMP
    ");

    foreach ($games as $game) {
        $stmt->execute([
            $game['id'], $game['slug'], $game['title'], $game['description'],
            $game['instructions'], $game['category'], $game['difficulty'],
            $game['icon'], $game['game_type'], $game['max_score'],
            $game['time_limit'], $game['xp_reward'], $game['min_level'],
            $game['tags'], $game['game_config'], $game['featured']
        ]);
    }

    echo "Inserted " . count($games) . " games.\n";

    // Create sample achievements for games
    $achievements = [
        [
            'id' => generateUUID(),
            'game_id' => null, // Global achievements
            'achievement_key' => 'first_game',
            'title' => 'First Steps',
            'description' => 'Complete your first game',
            'icon' => '🎮',
            'xp_reward' => 25,
            'requirement_type' => 'custom',
            'requirement_value' => json_encode(['games_completed' => 1])
        ],
        [
            'id' => generateUUID(),
            'game_id' => null,
            'achievement_key' => 'speed_demon',
            'title' => 'Speed Demon',
            'description' => 'Complete any game in under 60 seconds',
            'icon' => '⚡',
            'xp_reward' => 50,
            'requirement_type' => 'time',
            'requirement_value' => json_encode(['max_time' => 60])
        ],
        [
            'id' => generateUUID(),
            'game_id' => null,
            'achievement_key' => 'perfectionist',
            'title' => 'Perfectionist',
            'description' => 'Get a perfect score on any game',
            'icon' => '💯',
            'xp_reward' => 75,
            'requirement_type' => 'perfect',
            'requirement_value' => json_encode(['perfect_score' => true])
        ]
    ];

    $stmt = $pdo->prepare("
        INSERT INTO game_achievements (
            id, game_id, achievement_key, title, description, icon, 
            xp_reward, requirement_type, requirement_value
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
            title = VALUES(title),
            description = VALUES(description)
    ");

    foreach ($achievements as $achievement) {
        $stmt->execute([
            $achievement['id'], $achievement['game_id'], $achievement['achievement_key'],
            $achievement['title'], $achievement['description'], $achievement['icon'],
            $achievement['xp_reward'], $achievement['requirement_type'], 
            $achievement['requirement_value']
        ]);
    }

    echo "Inserted " . count($achievements) . " achievements.\n";

    // Initialize game statistics
    $gameIds = array_column($games, 'id');
    $stmt = $pdo->prepare("
        INSERT INTO game_statistics (game_id) 
        VALUES (?) 
        ON DUPLICATE KEY UPDATE game_id = game_id
    ");

    foreach ($gameIds as $gameId) {
        $stmt->execute([$gameId]);
    }

    echo "Initialized game statistics.\n";
    echo "Games data seeded successfully!\n";

} catch (PDOException $e) {
    echo "Database error: " . $e->getMessage() . "\n";
    exit(1);
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
    exit(1);
}
?>