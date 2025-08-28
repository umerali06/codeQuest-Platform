<?php
/**
 * Seed Learning Data - Populates modules and lessons with comprehensive content
 */

// Load environment variables
if (file_exists('.env.local')) {
    $lines = file('.env.local', FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        if (strpos($line, '=') !== false && strpos($line, '#') !== 0) {
            list($key, $value) = explode('=', $line, 2);
            $_ENV[trim($key)] = trim($value);
        }
    }
}

// Database configuration
$host = $_ENV['DB_HOST'] ?? 'localhost';
$dbname = $_ENV['DB_NAME'] ?? 'codequest_db';
$username = $_ENV['DB_USER'] ?? 'root';
$password = $_ENV['DB_PASS'] ?? '';

$dsn = "mysql:host=$host;dbname=$dbname;charset=utf8mb4";
$options = [
    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES => false,
];

try {
    $pdo = new PDO($dsn, $username, $password, $options);
    echo "Connected to database successfully.\n";
    
    // Clear existing data
    echo "Clearing existing learning data...\n";
    $pdo->exec("DELETE FROM user_lesson_completions");
    $pdo->exec("DELETE FROM lessons");
    $pdo->exec("DELETE FROM modules");
    
    // Insert modules
    echo "Creating learning modules...\n";
    
    $modules = [
        [
            'id' => generateUuid(),
            'slug' => 'html-fundamentals',
            'title' => 'HTML Fundamentals',
            'description' => 'Master the building blocks of the web with HTML5. Learn semantic markup, forms, media elements, and accessibility best practices.',
            'category' => 'html',
            'icon' => '🌐',
            'color' => '#e34c26',
            'difficulty' => 'beginner',
            'estimated_hours' => 8,
            'order_index' => 1
        ],
        [
            'id' => generateUuid(),
            'slug' => 'css-styling',
            'title' => 'CSS Styling & Layout',
            'description' => 'Transform your HTML with beautiful CSS. Learn selectors, flexbox, grid, animations, and responsive design.',
            'category' => 'css',
            'icon' => '🎨',
            'color' => '#1572b6',
            'difficulty' => 'beginner',
            'estimated_hours' => 12,
            'order_index' => 2
        ],
        [
            'id' => generateUuid(),
            'slug' => 'javascript-basics',
            'title' => 'JavaScript Essentials',
            'description' => 'Bring your websites to life with JavaScript. Learn variables, functions, DOM manipulation, and event handling.',
            'category' => 'javascript',
            'icon' => '⚡',
            'color' => '#f7df1e',
            'difficulty' => 'intermediate',
            'estimated_hours' => 15,
            'order_index' => 3
        ],
        [
            'id' => generateUuid(),
            'slug' => 'advanced-javascript',
            'title' => 'Advanced JavaScript',
            'description' => 'Master advanced JavaScript concepts including async/await, closures, prototypes, and modern ES6+ features.',
            'category' => 'javascript',
            'icon' => '🚀',
            'color' => '#f39c12',
            'difficulty' => 'advanced',
            'estimated_hours' => 20,
            'order_index' => 4
        ],
        [
            'id' => generateUuid(),
            'slug' => 'web-projects',
            'title' => 'Real-World Projects',
            'description' => 'Apply your skills by building complete web applications. Portfolio projects that showcase your abilities.',
            'category' => 'projects',
            'icon' => '🏗️',
            'color' => '#9b59b6',
            'difficulty' => 'intermediate',
            'estimated_hours' => 25,
            'order_index' => 5
        ]
    ];
    
    $moduleStmt = $pdo->prepare("
        INSERT INTO modules (id, slug, title, description, category, icon, color, difficulty, estimated_hours, order_index) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ");
    
    $moduleIds = [];
    foreach ($modules as $module) {
        $moduleStmt->execute([
            $module['id'], $module['slug'], $module['title'], $module['description'],
            $module['category'], $module['icon'], $module['color'], $module['difficulty'],
            $module['estimated_hours'], $module['order_index']
        ]);
        $moduleIds[$module['slug']] = $module['id'];
        echo "Created module: {$module['title']}\n";
    }
    
    // Insert lessons
    echo "Creating lessons...\n";
    
    $lessons = [
        // HTML Fundamentals
        [
            'module_slug' => 'html-fundamentals',
            'slug' => 'html-introduction',
            'title' => 'Introduction to HTML',
            'description' => 'Learn what HTML is and how it structures web content.',
            'content_md' => '# Introduction to HTML

## What is HTML?

HTML (HyperText Markup Language) is the standard markup language for creating web pages. It describes the structure and content of a webpage using elements and tags.

## Key Concepts

### Elements and Tags
- HTML uses **tags** to define elements
- Tags are enclosed in angle brackets: `<tagname>`
- Most tags come in pairs: opening `<p>` and closing `</p>`

### Basic Structure
```html
<!DOCTYPE html>
<html>
<head>
    <title>Page Title</title>
</head>
<body>
    <h1>My First Heading</h1>
    <p>My first paragraph.</p>
</body>
</html>
```

## Learning Objectives
- Understand HTML\'s role in web development
- Learn basic HTML syntax and structure
- Create your first HTML document',
            'starter_code' => json_encode([
                'html' => '<!DOCTYPE html>
<html>
<head>
    <title>My First Page</title>
</head>
<body>
    <!-- Add your content here -->
    
</body>
</html>',
                'css' => '',
                'js' => ''
            ]),
            'test_spec_json' => json_encode([
                'tests' => [
                    ['type' => 'element_exists', 'selector' => 'h1', 'description' => 'Page should have an h1 heading'],
                    ['type' => 'element_exists', 'selector' => 'p', 'description' => 'Page should have a paragraph'],
                    ['type' => 'element_count', 'selector' => 'h1', 'count' => 1, 'description' => 'Should have exactly one h1']
                ]
            ]),
            'difficulty' => 'easy',
            'duration_minutes' => 20,
            'xp_reward' => 15,
            'order_index' => 1
        ],
        [
            'module_slug' => 'html-fundamentals',
            'slug' => 'html-headings-paragraphs',
            'title' => 'Headings and Paragraphs',
            'description' => 'Master HTML headings (h1-h6) and paragraph elements for content structure.',
            'content_md' => '# Headings and Paragraphs

## HTML Headings

HTML provides six levels of headings, from `<h1>` (most important) to `<h6>` (least important).

```html
<h1>Main Title</h1>
<h2>Section Title</h2>
<h3>Subsection Title</h3>
<h4>Sub-subsection Title</h4>
<h5>Minor Heading</h5>
<h6>Smallest Heading</h6>
```

## Paragraphs

The `<p>` element defines a paragraph of text:

```html
<p>This is a paragraph of text. It can contain multiple sentences and will be displayed as a block element.</p>
```

## Best Practices

- Use headings to create a logical document outline
- Don\'t skip heading levels (don\'t jump from h1 to h3)
- Use paragraphs for blocks of related text
- Keep paragraphs focused on one main idea',
            'starter_code' => json_encode([
                'html' => '<!DOCTYPE html>
<html>
<head>
    <title>Headings and Paragraphs</title>
</head>
<body>
    <!-- Create a page about your favorite hobby -->
    <!-- Use h1 for the main title -->
    <!-- Use h2 for section headings -->
    <!-- Use paragraphs to describe your hobby -->
    
</body>
</html>',
                'css' => '',
                'js' => ''
            ]),
            'test_spec_json' => json_encode([
                'tests' => [
                    ['type' => 'element_exists', 'selector' => 'h1', 'description' => 'Should have a main heading (h1)'],
                    ['type' => 'element_exists', 'selector' => 'h2', 'description' => 'Should have section headings (h2)'],
                    ['type' => 'element_count', 'selector' => 'p', 'min_count' => 2, 'description' => 'Should have at least 2 paragraphs']
                ]
            ]),
            'difficulty' => 'easy',
            'duration_minutes' => 25,
            'xp_reward' => 20,
            'order_index' => 2
        ],
        [
            'module_slug' => 'html-fundamentals',
            'slug' => 'html-links-images',
            'title' => 'Links and Images',
            'description' => 'Learn to create hyperlinks and embed images in your web pages.',
            'content_md' => '# Links and Images

## Creating Links

The `<a>` (anchor) element creates hyperlinks:

```html
<!-- Link to another website -->
<a href="https://www.example.com">Visit Example</a>

<!-- Link to another page on your site -->
<a href="about.html">About Us</a>

<!-- Link to an email address -->
<a href="mailto:contact@example.com">Send Email</a>

<!-- Link to a phone number -->
<a href="tel:+1234567890">Call Us</a>
```

## Adding Images

The `<img>` element embeds images:

```html
<img src="image.jpg" alt="Description of image">
```

### Important Attributes
- `src`: Path to the image file
- `alt`: Alternative text for accessibility
- `width` and `height`: Dimensions (optional)

## Best Practices

- Always include `alt` text for images
- Use descriptive link text (avoid "click here")
- Optimize images for web (appropriate size and format)
- Use relative paths for internal links',
            'starter_code' => json_encode([
                'html' => '<!DOCTYPE html>
<html>
<head>
    <title>Links and Images</title>
</head>
<body>
    <h1>My Portfolio</h1>
    
    <!-- Add a profile image -->
    <!-- Add links to your social media or projects -->
    <!-- Add a link to your email -->
    
</body>
</html>',
                'css' => '',
                'js' => ''
            ]),
            'test_spec_json' => json_encode([
                'tests' => [
                    ['type' => 'element_exists', 'selector' => 'img', 'description' => 'Should have at least one image'],
                    ['type' => 'element_exists', 'selector' => 'a', 'description' => 'Should have at least one link'],
                    ['type' => 'attribute_exists', 'selector' => 'img', 'attribute' => 'alt', 'description' => 'Images should have alt text']
                ]
            ]),
            'difficulty' => 'easy',
            'duration_minutes' => 30,
            'xp_reward' => 25,
            'order_index' => 3
        ],
        
        // CSS Styling
        [
            'module_slug' => 'css-styling',
            'slug' => 'css-introduction',
            'title' => 'Introduction to CSS',
            'description' => 'Learn how CSS styles HTML elements and controls the visual presentation of web pages.',
            'content_md' => '# Introduction to CSS

## What is CSS?

CSS (Cascading Style Sheets) is a language used to describe the presentation of HTML documents. It controls colors, fonts, layouts, and animations.

## CSS Syntax

CSS consists of rules with selectors and declarations:

```css
selector {
    property: value;
    property: value;
}
```

## Adding CSS to HTML

### Inline CSS
```html
<p style="color: blue; font-size: 16px;">Blue text</p>
```

### Internal CSS
```html
<head>
    <style>
        p {
            color: blue;
            font-size: 16px;
        }
    </style>
</head>
```

### External CSS
```html
<head>
    <link rel="stylesheet" href="styles.css">
</head>
```

## Basic Selectors

- **Element selector**: `p { }` - targets all `<p>` elements
- **Class selector**: `.highlight { }` - targets elements with `class="highlight"`
- **ID selector**: `#header { }` - targets element with `id="header"`',
            'starter_code' => json_encode([
                'html' => '<!DOCTYPE html>
<html>
<head>
    <title>CSS Introduction</title>
</head>
<body>
    <h1>Welcome to CSS</h1>
    <p class="intro">This is an introduction paragraph.</p>
    <p>This is a regular paragraph.</p>
    <div id="special">This is a special div.</div>
</body>
</html>',
                'css' => '/* Add your CSS styles here */
/* Style the h1 element */
/* Style the .intro class */
/* Style the #special id */',
                'js' => ''
            ]),
            'test_spec_json' => json_encode([
                'tests' => [
                    ['type' => 'css_property', 'selector' => 'h1', 'property' => 'color', 'description' => 'h1 should have a color'],
                    ['type' => 'css_property', 'selector' => '.intro', 'property' => 'font-size', 'description' => '.intro should have font-size'],
                    ['type' => 'css_property', 'selector' => '#special', 'property' => 'background-color', 'description' => '#special should have background-color']
                ]
            ]),
            'difficulty' => 'easy',
            'duration_minutes' => 25,
            'xp_reward' => 20,
            'order_index' => 1
        ],
        [
            'module_slug' => 'css-styling',
            'slug' => 'css-colors-fonts',
            'title' => 'Colors and Typography',
            'description' => 'Master CSS colors, fonts, and text styling to create visually appealing content.',
            'content_md' => '# Colors and Typography

## CSS Colors

### Color Values
```css
/* Named colors */
color: red;
color: blue;

/* Hex colors */
color: #ff0000;
color: #0066cc;

/* RGB colors */
color: rgb(255, 0, 0);
color: rgba(255, 0, 0, 0.5); /* with transparency */

/* HSL colors */
color: hsl(0, 100%, 50%);
color: hsla(0, 100%, 50%, 0.5); /* with transparency */
```

## Typography

### Font Properties
```css
font-family: Arial, sans-serif;
font-size: 16px;
font-weight: bold;
font-style: italic;
line-height: 1.5;
```

### Text Properties
```css
text-align: center;
text-decoration: underline;
text-transform: uppercase;
letter-spacing: 2px;
word-spacing: 4px;
```

## Web Fonts

```css
/* Google Fonts */
@import url(\'https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;700&display=swap\');

body {
    font-family: \'Roboto\', sans-serif;
}
```',
            'starter_code' => json_encode([
                'html' => '<!DOCTYPE html>
<html>
<head>
    <title>Colors and Typography</title>
</head>
<body>
    <h1>Typography Showcase</h1>
    <p class="intro">This is an introduction with special styling.</p>
    <p class="highlight">This paragraph should stand out.</p>
    <p class="subtle">This text should be more subtle.</p>
    <blockquote>
        "Design is not just what it looks like and feels like. Design is how it works."
        <cite>- Steve Jobs</cite>
    </blockquote>
</body>
</html>',
                'css' => '/* Import a Google Font */

/* Style the body with a nice font */

/* Make the h1 colorful and bold */

/* Style the .intro class */

/* Make .highlight stand out */

/* Make .subtle more subdued */

/* Style the blockquote */',
                'js' => ''
            ]),
            'test_spec_json' => json_encode([
                'tests' => [
                    ['type' => 'css_property', 'selector' => 'body', 'property' => 'font-family', 'description' => 'Body should have font-family'],
                    ['type' => 'css_property', 'selector' => 'h1', 'property' => 'color', 'description' => 'h1 should have color'],
                    ['type' => 'css_property', 'selector' => '.highlight', 'property' => 'background-color', 'description' => '.highlight should have background-color']
                ]
            ]),
            'difficulty' => 'easy',
            'duration_minutes' => 35,
            'xp_reward' => 30,
            'order_index' => 2
        ],
        
        // JavaScript Basics
        [
            'module_slug' => 'javascript-basics',
            'slug' => 'js-introduction',
            'title' => 'JavaScript Fundamentals',
            'description' => 'Learn JavaScript basics: variables, data types, and your first interactive code.',
            'content_md' => '# JavaScript Fundamentals

## What is JavaScript?

JavaScript is a programming language that makes web pages interactive. It can respond to user actions, manipulate HTML content, and create dynamic experiences.

## Variables and Data Types

### Declaring Variables
```javascript
// Modern way (ES6+)
let name = "John";
const age = 25;

// Older way (still valid)
var city = "New York";
```

### Data Types
```javascript
// String
let message = "Hello, World!";

// Number
let count = 42;
let price = 19.99;

// Boolean
let isActive = true;
let isComplete = false;

// Array
let colors = ["red", "green", "blue"];

// Object
let person = {
    name: "Alice",
    age: 30,
    city: "Boston"
};
```

## Basic Operations

### String Operations
```javascript
let firstName = "John";
let lastName = "Doe";
let fullName = firstName + " " + lastName;
console.log(fullName); // "John Doe"
```

### Math Operations
```javascript
let x = 10;
let y = 5;
console.log(x + y); // 15
console.log(x - y); // 5
console.log(x * y); // 50
console.log(x / y); // 2
```',
            'starter_code' => json_encode([
                'html' => '<!DOCTYPE html>
<html>
<head>
    <title>JavaScript Fundamentals</title>
</head>
<body>
    <h1>JavaScript Variables</h1>
    <div id="output"></div>
    
    <script>
        // Create variables for your information
        // Display them in the output div
        
    </script>
</body>
</html>',
                'css' => '#output {
    padding: 20px;
    background-color: #f0f0f0;
    border-radius: 5px;
    margin-top: 20px;
}',
                'js' => '// Create variables
let name = "Your Name";
let age = 25;
let hobbies = ["coding", "reading", "gaming"];

// Display information
let output = document.getElementById("output");
output.innerHTML = `
    <h2>About ${name}</h2>
    <p>Age: ${age}</p>
    <p>Hobbies: ${hobbies.join(", ")}</p>
`;'
            ]),
            'test_spec_json' => json_encode([
                'tests' => [
                    ['type' => 'js_variable_exists', 'variable' => 'name', 'description' => 'Should declare a name variable'],
                    ['type' => 'js_variable_exists', 'variable' => 'age', 'description' => 'Should declare an age variable'],
                    ['type' => 'element_content', 'selector' => '#output', 'description' => 'Output div should have content']
                ]
            ]),
            'difficulty' => 'medium',
            'duration_minutes' => 40,
            'xp_reward' => 35,
            'order_index' => 1
        ]
    ];
    
    $lessonStmt = $pdo->prepare("
        INSERT INTO lessons (id, module_id, slug, title, description, content_md, starter_code, test_spec_json, difficulty, duration_minutes, xp_reward, order_index, learning_objectives) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ");
    
    foreach ($lessons as $lesson) {
        $moduleId = $moduleIds[$lesson['module_slug']];
        $learningObjectives = json_encode([
            'Understand the lesson concepts',
            'Apply the knowledge in practice',
            'Complete the coding exercise'
        ]);
        
        $lessonStmt->execute([
            generateUuid(),
            $moduleId,
            $lesson['slug'],
            $lesson['title'],
            $lesson['description'],
            $lesson['content_md'],
            $lesson['starter_code'],
            $lesson['test_spec_json'],
            $lesson['difficulty'],
            $lesson['duration_minutes'],
            $lesson['xp_reward'],
            $lesson['order_index'],
            $learningObjectives
        ]);
        
        echo "Created lesson: {$lesson['title']}\n";
    }
    
    echo "\n✅ Learning data seeded successfully!\n";
    echo "Created " . count($modules) . " modules and " . count($lessons) . " lessons.\n";
    
} catch (PDOException $e) {
    echo "❌ Database error: " . $e->getMessage() . "\n";
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
}

function generateUuid() {
    return sprintf('%04x%04x-%04x-%04x-%04x-%04x%04x%04x',
        mt_rand(0, 0xffff), mt_rand(0, 0xffff),
        mt_rand(0, 0xffff),
        mt_rand(0, 0x0fff) | 0x4000,
        mt_rand(0, 0x3fff) | 0x8000,
        mt_rand(0, 0xffff), mt_rand(0, 0xffff), mt_rand(0, 0xffff)
    );
}
?>