<?php
/**
 * Seed Lesson Data
 * Populates the database with sample lessons for testing
 */

try {
    $pdo = new PDO('mysql:host=localhost;dbname=codequest_db', 'root', '', [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
    ]);
    
    echo "🌱 Seeding lesson data...\n";
    
    // Get existing modules
    $stmt = $pdo->query("SELECT id, slug, title FROM modules ORDER BY order_index");
    $modules = $stmt->fetchAll();
    
    if (empty($modules)) {
        echo "❌ No modules found. Please run populate-learning-paths.php first.\n";
        exit(1);
    }
    
    // Sample lessons for each module
    $lessonsData = [
        'html-fundamentals' => [
            [
                'slug' => 'html-basics',
                'title' => 'HTML Document Structure',
                'description' => 'Learn the basic structure of an HTML document including DOCTYPE, html, head, and body elements.',
                'content_md' => '# HTML Document Structure\n\nEvery HTML document follows a standard structure...',
                'starter_code' => json_encode([
                    'html' => '<!DOCTYPE html>\n<html>\n<head>\n  <title>My First Page</title>\n</head>\n<body>\n  <!-- Your content here -->\n</body>\n</html>',
                    'css' => '',
                    'js' => ''
                ]),
                'test_spec_json' => json_encode([
                    'tests' => [
                        ['name' => 'Has DOCTYPE declaration', 'test' => 'document.doctype !== null'],
                        ['name' => 'Has title element', 'test' => 'document.querySelector("title") !== null'],
                        ['name' => 'Has body element', 'test' => 'document.querySelector("body") !== null']
                    ]
                ]),
                'solution_code' => json_encode([
                    'html' => '<!DOCTYPE html>\n<html>\n<head>\n  <title>My First Page</title>\n</head>\n<body>\n  <h1>Welcome to HTML!</h1>\n  <p>This is my first HTML page.</p>\n</body>\n</html>'
                ]),
                'difficulty' => 'easy',
                'duration_minutes' => 15,
                'xp_reward' => 10,
                'order_index' => 1,
                'learning_objectives' => json_encode([
                    'Understand HTML document structure',
                    'Create a basic HTML page',
                    'Use DOCTYPE declaration',
                    'Structure content with head and body'
                ])
            ],
            [
                'slug' => 'html-headings-paragraphs',
                'title' => 'Headings and Paragraphs',
                'description' => 'Master HTML headings (h1-h6) and paragraph elements to structure your content effectively.',
                'content_md' => '# Headings and Paragraphs\n\nHTML provides six levels of headings and paragraph elements...',
                'starter_code' => json_encode([
                    'html' => '<h1>Main Title</h1>\n<p>Write your paragraph here...</p>',
                    'css' => '',
                    'js' => ''
                ]),
                'test_spec_json' => json_encode([
                    'tests' => [
                        ['name' => 'Has h1 element', 'test' => 'document.querySelector("h1") !== null'],
                        ['name' => 'Has paragraph element', 'test' => 'document.querySelector("p") !== null'],
                        ['name' => 'Has multiple heading levels', 'test' => 'document.querySelectorAll("h1, h2, h3").length >= 2']
                    ]
                ]),
                'difficulty' => 'easy',
                'duration_minutes' => 20,
                'xp_reward' => 15,
                'order_index' => 2,
                'learning_objectives' => json_encode([
                    'Use heading elements h1-h6',
                    'Create paragraphs with p element',
                    'Understand heading hierarchy',
                    'Structure content semantically'
                ])
            ],
            [
                'slug' => 'html-links-images',
                'title' => 'Links and Images',
                'description' => 'Learn to create hyperlinks and embed images in your HTML pages.',
                'content_md' => '# Links and Images\n\nLinks and images are essential elements of web pages...',
                'starter_code' => json_encode([
                    'html' => '<a href="#">Click me</a>\n<img src="" alt="Description">',
                    'css' => '',
                    'js' => ''
                ]),
                'difficulty' => 'easy',
                'duration_minutes' => 25,
                'xp_reward' => 20,
                'order_index' => 3,
                'learning_objectives' => json_encode([
                    'Create hyperlinks with anchor tags',
                    'Embed images with img element',
                    'Use alt attributes for accessibility',
                    'Understand relative vs absolute URLs'
                ])
            ]
        ],
        'css-styling' => [
            [
                'slug' => 'css-selectors',
                'title' => 'CSS Selectors',
                'description' => 'Master CSS selectors to target and style HTML elements effectively.',
                'content_md' => '# CSS Selectors\n\nCSS selectors are patterns used to select elements...',
                'starter_code' => json_encode([
                    'html' => '<div class="container">\n  <h1 id="title">Hello World</h1>\n  <p class="text">Paragraph text</p>\n</div>',
                    'css' => '/* Add your CSS here */\n.container {\n  \n}\n\n#title {\n  \n}\n\n.text {\n  \n}',
                    'js' => ''
                ]),
                'difficulty' => 'easy',
                'duration_minutes' => 30,
                'xp_reward' => 25,
                'order_index' => 1,
                'learning_objectives' => json_encode([
                    'Understand element, class, and ID selectors',
                    'Use descendant and child selectors',
                    'Apply pseudo-classes and pseudo-elements',
                    'Combine multiple selectors'
                ])
            ],
            [
                'slug' => 'css-colors-fonts',
                'title' => 'Colors and Typography',
                'description' => 'Learn to style text with colors, fonts, and typography properties.',
                'content_md' => '# Colors and Typography\n\nStyling text is fundamental to web design...',
                'starter_code' => json_encode([
                    'html' => '<h1>Styled Heading</h1>\n<p>This paragraph needs styling.</p>',
                    'css' => 'h1 {\n  /* Add color and font styles */\n}\n\np {\n  /* Add typography styles */\n}',
                    'js' => ''
                ]),
                'difficulty' => 'easy',
                'duration_minutes' => 25,
                'xp_reward' => 20,
                'order_index' => 2,
                'learning_objectives' => json_encode([
                    'Apply colors using different formats',
                    'Set font families and sizes',
                    'Control text alignment and spacing',
                    'Use font weights and styles'
                ])
            ]
        ],
        'javascript-basics' => [
            [
                'slug' => 'js-variables',
                'title' => 'Variables and Data Types',
                'description' => 'Learn JavaScript variables, data types, and how to store and manipulate data.',
                'content_md' => '# Variables and Data Types\n\nVariables are containers for storing data...',
                'starter_code' => json_encode([
                    'html' => '<div id="output"></div>',
                    'css' => '#output { padding: 20px; font-family: monospace; }',
                    'js' => '// Declare variables here\nlet name = "CodeQuest";\nlet age = 25;\nlet isActive = true;\n\n// Display the values\ndocument.getElementById("output").innerHTML = `Name: ${name}<br>Age: ${age}<br>Active: ${isActive}`;'
                ]),
                'difficulty' => 'easy',
                'duration_minutes' => 20,
                'xp_reward' => 15,
                'order_index' => 1,
                'learning_objectives' => json_encode([
                    'Declare variables with let, const, and var',
                    'Understand different data types',
                    'Use template literals',
                    'Manipulate variables'
                ])
            ],
            [
                'slug' => 'js-functions',
                'title' => 'Functions',
                'description' => 'Master JavaScript functions including declarations, expressions, and arrow functions.',
                'content_md' => '# JavaScript Functions\n\nFunctions are reusable blocks of code...',
                'starter_code' => json_encode([
                    'html' => '<button onclick="greetUser()">Click Me</button>\n<div id="result"></div>',
                    'css' => 'button { padding: 10px 20px; font-size: 16px; }\n#result { margin-top: 10px; padding: 10px; }',
                    'js' => 'function greetUser() {\n  // Write your function here\n  const name = "Developer";\n  const message = `Hello, ${name}!`;\n  document.getElementById("result").textContent = message;\n}'
                ]),
                'difficulty' => 'medium',
                'duration_minutes' => 30,
                'xp_reward' => 25,
                'order_index' => 2,
                'learning_objectives' => json_encode([
                    'Create function declarations',
                    'Use function expressions and arrow functions',
                    'Understand parameters and return values',
                    'Apply function scope concepts'
                ])
            ]
        ]
    ];
    
    $totalLessons = 0;
    
    foreach ($modules as $module) {
        $moduleSlug = $module['slug'];
        
        if (!isset($lessonsData[$moduleSlug])) {
            echo "⚠️  No lesson data for module: {$module['title']}\n";
            continue;
        }
        
        echo "📚 Adding lessons for: {$module['title']}\n";
        
        foreach ($lessonsData[$moduleSlug] as $lessonData) {
            // Generate UUID for lesson
            $lessonId = sprintf(
                '%04x%04x-%04x-%04x-%04x-%04x%04x%04x',
                mt_rand(0, 0xffff), mt_rand(0, 0xffff),
                mt_rand(0, 0xffff),
                mt_rand(0, 0x0fff) | 0x4000,
                mt_rand(0, 0x3fff) | 0x8000,
                mt_rand(0, 0xffff), mt_rand(0, 0xffff), mt_rand(0, 0xffff)
            );
            
            // Check if lesson already exists
            $checkStmt = $pdo->prepare("SELECT id FROM lessons WHERE slug = ?");
            $checkStmt->execute([$lessonData['slug']]);
            
            if ($checkStmt->fetch()) {
                echo "  ⏭️  Lesson '{$lessonData['title']}' already exists\n";
                continue;
            }
            
            // Insert lesson
            $insertStmt = $pdo->prepare("
                INSERT INTO lessons (
                    id, module_id, slug, title, description, content_md,
                    starter_code, test_spec_json, solution_code, difficulty,
                    duration_minutes, xp_reward, order_index, learning_objectives,
                    is_active, created_at, updated_at
                ) VALUES (
                    ?, ?, ?, ?, ?, ?,
                    ?, ?, ?, ?,
                    ?, ?, ?, ?,
                    TRUE, NOW(), NOW()
                )
            ");
            
            $insertStmt->execute([
                $lessonId,
                $module['id'],
                $lessonData['slug'],
                $lessonData['title'],
                $lessonData['description'],
                $lessonData['content_md'] ?? '',
                $lessonData['starter_code'],
                $lessonData['test_spec_json'] ?? '{}',
                $lessonData['solution_code'] ?? '{}',
                $lessonData['difficulty'],
                $lessonData['duration_minutes'],
                $lessonData['xp_reward'],
                $lessonData['order_index'],
                $lessonData['learning_objectives'] ?? '[]'
            ]);
            
            echo "  ✅ Added: {$lessonData['title']}\n";
            $totalLessons++;
        }
    }
    
    echo "\n🎉 Successfully seeded {$totalLessons} lessons!\n";
    echo "📊 Database now contains:\n";
    
    // Show summary
    $stmt = $pdo->query("
        SELECT 
            m.title as module_title,
            COUNT(l.id) as lesson_count
        FROM modules m
        LEFT JOIN lessons l ON m.id = l.module_id
        GROUP BY m.id, m.title
        ORDER BY m.order_index
    ");
    
    $summary = $stmt->fetchAll();
    foreach ($summary as $row) {
        echo "  📚 {$row['module_title']}: {$row['lesson_count']} lessons\n";
    }
    
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
    exit(1);
}
?>