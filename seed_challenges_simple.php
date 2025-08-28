<?php
/**
 * Seed Challenges with Current Collection Structure
 * This script seeds challenges using the simplified attributes
 */

require_once __DIR__ . '/vendor/autoload.php';

use CodeQuest\Core\Auth;

echo "🌱 Seeding Challenges with Current Structure\n";
echo "===========================================\n\n";

try {
    // Initialize Appwrite client
    $auth = new Auth();
    $databases = $auth->getDatabasesService();
    
    $databaseId = 'codequest';
    $collectionId = 'challenges';
    
    echo "✅ Appwrite client initialized\n\n";
    
    // Define challenges with simplified structure
    $challenges = [
        [
            'title' => 'Create Your First HTML Page',
            'description' => 'Create a simple HTML page with a heading and paragraph using semantic HTML elements.',
            'difficulty' => 'beginner',
            'category' => 'html',
            'xp_reward' => 10,
            'time_limit_minutes' => 15,
            'starter_code' => '<!DOCTYPE html>\n<html>\n<head>\n    <title>My First Page</title>\n</head>\n<body>\n    <!-- Your code here -->\n</body>\n</html>',
            'solution_code' => '<!DOCTYPE html>\n<html>\n<head>\n    <title>My First Page</title>\n</head>\n<body>\n    <h1>Hello World!</h1>\n    <p>This is my first HTML page.</p>\n</body>\n</html>',
            'is_active' => true
        ],
        [
            'title' => 'Style Your HTML',
            'description' => 'Add CSS styling to make your HTML page look beautiful and professional.',
            'difficulty' => 'beginner',
            'category' => 'css',
            'xp_reward' => 15,
            'time_limit_minutes' => 20,
            'starter_code' => '<!DOCTYPE html>\n<html>\n<head>\n    <title>Styled Page</title>\n</head>\n<body>\n    <h1>Welcome</h1>\n    <p>This is a paragraph.</p>\n</body>\n</html>\n\n<style>\n/* Add your CSS here */\n</style>',
            'solution_code' => '<!DOCTYPE html>\n<html>\n<head>\n    <title>Styled Page</title>\n</head>\n<body>\n    <h1>Welcome</h1>\n    <p>This is a paragraph.</p>\n</body>\n</html>\n\n<style>\nbody {\n    font-family: Arial, sans-serif;\n    background-color: #f0f0f0;\n    margin: 0;\n    padding: 20px;\n}\n\nh1 {\n    color: #333;\n    text-align: center;\n}\n\np {\n    color: #666;\n    line-height: 1.6;\n}\n</style>',
            'is_active' => true
        ],
        [
            'title' => 'Add Interactivity',
            'description' => 'Use JavaScript to add a button that changes text when clicked.',
            'difficulty' => 'beginner',
            'category' => 'javascript',
            'xp_reward' => 20,
            'time_limit_minutes' => 30,
            'starter_code' => '<!DOCTYPE html>\n<html>\n<head>\n    <title>Interactive Page</title>\n</head>\n<body>\n    <h1 id="title">Hello World</h1>\n    <button id="changeBtn">Change Text</button>\n    <script>\n        // Your JavaScript here\n    </script>\n</body>\n</html>',
            'solution_code' => '<!DOCTYPE html>\n<html>\n<head>\n    <title>Interactive Page</title>\n</head>\n<body>\n    <h1 id="title">Hello World</h1>\n    <button id="changeBtn">Change Text</button>\n    <script>\n        document.getElementById("changeBtn").addEventListener("click", function() {\n            document.getElementById("title").textContent = "Text Changed!";\n        });\n    </script>\n</body>\n</html>',
            'is_active' => true
        ],
        [
            'title' => 'Form Validation',
            'description' => 'Implement client-side form validation with JavaScript.',
            'difficulty' => 'intermediate',
            'category' => 'javascript',
            'xp_reward' => 60,
            'time_limit_minutes' => 35,
            'starter_code' => '<!DOCTYPE html>\n<html>\n<head>\n    <title>Form Validation</title>\n</head>\n<body>\n    <form id="myForm">\n        <input type="text" id="username" placeholder="Username" required>\n        <input type="email" id="email" placeholder="Email" required>\n        <input type="password" id="password" placeholder="Password" required>\n        <button type="submit">Submit</button>\n    </form>\n    <div id="errors"></div>\n    <script>\n        // Add form validation here\n    </script>\n</body>\n</html>',
            'solution_code' => '<!DOCTYPE html>\n<html>\n<head>\n    <title>Form Validation</title>\n</head>\n<body>\n    <form id="myForm">\n        <input type="text" id="username" placeholder="Username" required>\n        <input type="email" id="email" placeholder="Email" required>\n        <input type="password" id="password" placeholder="Password" required>\n        <button type="submit">Submit</button>\n    </form>\n    <div id="errors"></div>\n    <script>\n        document.getElementById("myForm").addEventListener("submit", function(e) {\n            e.preventDefault();\n            validateForm();\n        });\n        \n        function validateForm() {\n            const username = document.getElementById("username").value;\n            const email = document.getElementById("email").value;\n            const password = document.getElementById("password").value;\n            const errors = [];\n            \n            if (username.length < 3) errors.push("Username must be at least 3 characters");\n            if (!email.includes("@")) errors.push("Please enter a valid email");\n            if (password.length < 6) errors.push("Password must be at least 6 characters");\n            \n            if (errors.length === 0) {\n                alert("Form is valid!");\n            } else {\n                document.getElementById("errors").innerHTML = errors.map(err => `<div style="color: red;">${err}</div>`).join("");\n            }\n        }\n    </script>\n</body>\n</html>',
            'is_active' => true
        ],
        [
            'title' => 'CSS Grid Dashboard',
            'description' => 'Design a dashboard layout using CSS Grid.',
            'difficulty' => 'intermediate',
            'category' => 'css',
            'xp_reward' => 70,
            'time_limit_minutes' => 40,
            'starter_code' => '<!DOCTYPE html>\n<html>\n<head>\n    <title>Dashboard Layout</title>\n</head>\n<body>\n    <div class="dashboard">\n        <header class="header">Header</header>\n        <nav class="sidebar">Sidebar</nav>\n        <main class="main">Main Content</main>\n        <aside class="widget">Widget</aside>\n        <footer class="footer">Footer</footer>\n    </div>\n    <style>\n        /* Use CSS Grid to create a dashboard layout */\n        /* Header should span full width */\n        /* Sidebar should be on the left */\n        /* Main content should be in the center */\n        /* Widget should be on the right */\n        /* Footer should span full width */\n    </style>\n</body>\n</html>',
            'solution_code' => '<!DOCTYPE html>\n<html>\n<head>\n    <title>Dashboard Layout</title>\n</head>\n<body>\n    <div class="dashboard">\n        <header class="header">Header</header>\n        <nav class="sidebar">Sidebar</nav>\n        <main class="main">Main Content</main>\n        <aside class="widget">Widget</aside>\n        <footer class="footer">Footer</footer>\n    </div>\n    <style>\n        .dashboard {\n            display: grid;\n            grid-template-areas:\n                "header header header"\n                "sidebar main widget"\n                "footer footer footer";\n            grid-template-columns: 200px 1fr 200px;\n            grid-template-rows: 60px 1fr 60px;\n            height: 100vh;\n            gap: 10px;\n            padding: 10px;\n        }\n        \n        .header { grid-area: header; background: #333; color: white; padding: 20px; }\n        .sidebar { grid-area: sidebar; background: #f0f0f0; padding: 20px; }\n        .main { grid-area: main; background: white; padding: 20px; }\n        .widget { grid-area: widget; background: #f0f0f0; padding: 20px; }\n        .footer { grid-area: footer; background: #333; color: white; padding: 20px; }\n    </style>\n</body>\n</html>',
            'is_active' => true
        ]
    ];
    
    echo "📝 Found " . count($challenges) . " challenges to seed\n\n";
    
    // Clear existing challenges first
    try {
        echo "🧹 Clearing existing challenges...\n";
        $existingChallenges = $databases->listDocuments($databaseId, $collectionId);
        
        foreach ($existingChallenges['documents'] as $challenge) {
            $databases->deleteDocument($databaseId, $collectionId, $challenge['$id']);
            echo "  - Deleted: {$challenge['title']}\n";
        }
        echo "✅ Existing challenges cleared\n\n";
    } catch (Exception $e) {
        echo "ℹ️  No existing challenges to clear\n\n";
    }
    
    // Seed new challenges
    echo "🌱 Seeding new challenges...\n";
    $successCount = 0;
    
    foreach ($challenges as $challenge) {
        try {
            $databases->createDocument(
                $databaseId,
                $collectionId,
                'unique()',
                $challenge
            );
            echo "  ✅ {$challenge['title']} - {$challenge['difficulty']} ({$challenge['category']})\n";
            $successCount++;
        } catch (Exception $e) {
            echo "  ❌ Failed to create '{$challenge['title']}': " . $e->getMessage() . "\n";
        }
    }
    
    echo "\n🎉 Seeding completed!\n";
    echo "📊 Successfully seeded: {$successCount}/" . count($challenges) . " challenges\n";
    
    if ($successCount === count($challenges)) {
        echo "✅ All challenges seeded successfully!\n";
        echo "\nThe challenges collection now contains:\n";
        foreach ($challenges as $challenge) {
            echo "  • {$challenge['title']} ({$challenge['difficulty']} - {$challenge['category']})\n";
        }
    } else {
        echo "⚠️  Some challenges failed to seed. Check the errors above.\n";
    }
    
} catch (Exception $e) {
    echo "❌ Seeding failed: " . $e->getMessage() . "\n";
    echo "Stack trace:\n" . $e->getTraceAsString() . "\n";
    exit(1);
}
?>
