<?php
/**
 * Seed Challenge Data
 * Populates the challenges table with sample challenges for testing
 */

// Database configuration
$host = 'localhost';
$dbname = 'codequest_db';
$username = 'root';
$password = '';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $username, $password, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ]);
} catch (PDOException $e) {
    die("Database connection failed: " . $e->getMessage());
}

try {
    // Sample challenges data
    $challenges = [
        [
            'id' => 'contact-card-001',
            'slug' => 'contact-card',
            'title' => 'Contact Card Component',
            'description' => 'Create a responsive contact card that displays a person\'s information including name, title, email, and photo. The card should be visually appealing and work on both desktop and mobile devices.',
            'instructions' => 'Build a contact card with the following requirements: 1) Display a profile photo, 2) Show name and job title, 3) Include contact information, 4) Make it responsive for mobile devices, 5) Add hover effects for better user experience.',
            'difficulty' => 'easy',
            'category' => 'html',
            'xp_reward' => 50,
            'starter_code' => json_encode([
                'html' => '<!-- Create your contact card here -->\n<div class="contact-card">\n  <!-- Add your HTML structure -->\n</div>',
                'css' => '/* Style your contact card here */\n.contact-card {\n  /* Add your styles */\n}',
                'js' => '// Add any JavaScript functionality here\n'
            ]),
            'tests' => json_encode([
                [
                    'name' => 'Contact card container exists',
                    'type' => 'element_exists',
                    'selector' => '.contact-card',
                    'description' => 'Create a div with class "contact-card"'
                ],
                [
                    'name' => 'Profile image is present',
                    'type' => 'element_exists',
                    'selector' => 'img',
                    'description' => 'Add a profile image to the card'
                ],
                [
                    'name' => 'Name heading exists',
                    'type' => 'element_exists',
                    'selector' => 'h2',
                    'description' => 'Include a heading for the person\'s name'
                ],
                [
                    'name' => 'Contact information is displayed',
                    'type' => 'text_content',
                    'text' => '@',
                    'description' => 'Include email or contact information'
                ],
                [
                    'name' => 'Card has proper styling',
                    'type' => 'css_property',
                    'property' => 'border-radius',
                    'description' => 'Add rounded corners to the card'
                ]
            ]),
            'tags' => json_encode(['html', 'css', 'responsive', 'card']),
            'is_active' => true
        ],
        [
            'id' => 'responsive-nav-002',
            'slug' => 'responsive-nav',
            'title' => 'Responsive Navigation Menu',
            'description' => 'Build a responsive navigation menu that works on both desktop and mobile devices. Include a hamburger menu for mobile screens and smooth transitions.',
            'instructions' => 'Create a navigation menu with: 1) Logo on the left, 2) Menu items on the right, 3) Hamburger menu for mobile, 4) Smooth animations, 5) Active state styling.',
            'difficulty' => 'medium',
            'category' => 'css',
            'xp_reward' => 75,
            'starter_code' => json_encode([
                'html' => '<!-- Create your navigation here -->\n<nav class="navbar">\n  <!-- Add your navigation structure -->\n</nav>',
                'css' => '/* Style your navigation here */\n.navbar {\n  /* Add your styles */\n}',
                'js' => '// Add navigation functionality here\n'
            ]),
            'tests' => json_encode([
                [
                    'name' => 'Navigation container exists',
                    'type' => 'element_exists',
                    'selector' => '.navbar',
                    'description' => 'Create a nav element with class "navbar"'
                ],
                [
                    'name' => 'Logo is present',
                    'type' => 'element_exists',
                    'selector' => '.logo',
                    'description' => 'Add a logo element to the navigation'
                ],
                [
                    'name' => 'Menu items exist',
                    'type' => 'element_exists',
                    'selector' => 'ul',
                    'description' => 'Create a list of navigation items'
                ],
                [
                    'name' => 'Responsive design implemented',
                    'type' => 'css_property',
                    'property' => '@media',
                    'description' => 'Add media queries for responsive design'
                ]
            ]),
            'tags' => json_encode(['css', 'responsive', 'navigation', 'mobile']),
            'is_active' => true
        ],
        [
            'id' => 'todo-app-003',
            'slug' => 'todo-app',
            'title' => 'Interactive Todo List',
            'description' => 'Create an interactive todo list application where users can add, complete, and delete tasks. Include local storage to persist data.',
            'instructions' => 'Build a todo app with: 1) Add new tasks, 2) Mark tasks as complete, 3) Delete tasks, 4) Filter by status, 5) Save to local storage.',
            'difficulty' => 'hard',
            'category' => 'javascript',
            'xp_reward' => 100,
            'starter_code' => json_encode([
                'html' => '<!-- Create your todo app here -->\n<div class="todo-app">\n  <!-- Add your HTML structure -->\n</div>',
                'css' => '/* Style your todo app here */\n.todo-app {\n  /* Add your styles */\n}',
                'js' => '// Add todo app functionality here\nclass TodoApp {\n  // Implement your todo logic\n}'
            ]),
            'tests' => json_encode([
                [
                    'name' => 'Todo app container exists',
                    'type' => 'element_exists',
                    'selector' => '.todo-app',
                    'description' => 'Create a div with class "todo-app"'
                ],
                [
                    'name' => 'Input field for new tasks',
                    'type' => 'element_exists',
                    'selector' => 'input',
                    'description' => 'Add an input field for new tasks'
                ],
                [
                    'name' => 'Add button exists',
                    'type' => 'element_exists',
                    'selector' => 'button',
                    'description' => 'Include a button to add new tasks'
                ],
                [
                    'name' => 'JavaScript functionality',
                    'type' => 'text_content',
                    'text' => 'function',
                    'description' => 'Implement JavaScript functions for todo operations'
                ]
            ]),
            'tags' => json_encode(['javascript', 'interactive', 'localStorage', 'app']),
            'is_active' => true
        ]
    ];

    // Insert challenges
    $stmt = $pdo->prepare("
        INSERT INTO challenges (
            id, slug, title, description, instructions, difficulty, category, 
            xp_reward, starter_code, tests, tags, is_active, 
            created_at, updated_at
        ) VALUES (
            ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 
            CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
        ) ON DUPLICATE KEY UPDATE
            title = VALUES(title),
            description = VALUES(description),
            instructions = VALUES(instructions),
            difficulty = VALUES(difficulty),
            category = VALUES(category),
            xp_reward = VALUES(xp_reward),
            starter_code = VALUES(starter_code),
            tests = VALUES(tests),
            tags = VALUES(tags),
            is_active = VALUES(is_active),
            updated_at = CURRENT_TIMESTAMP
    ");

    $insertedCount = 0;
    foreach ($challenges as $challenge) {
        $stmt->execute([
            $challenge['id'],
            $challenge['slug'],
            $challenge['title'],
            $challenge['description'],
            $challenge['instructions'],
            $challenge['difficulty'],
            $challenge['category'],
            $challenge['xp_reward'],
            $challenge['starter_code'],
            $challenge['tests'],
            $challenge['tags'],
            $challenge['is_active']
        ]);
        $insertedCount++;
    }

    echo "✅ Successfully seeded {$insertedCount} challenges!\n";
    echo "Challenges added:\n";
    foreach ($challenges as $challenge) {
        echo "- {$challenge['title']} ({$challenge['slug']})\n";
    }

} catch (Exception $e) {
    echo "❌ Error seeding challenges: " . $e->getMessage() . "\n";
    exit(1);
}
?>