<?php
/**
 * AI Assistant API Endpoint
 * Provides AI assistance with fallback to local responses when external API is not configured
 */

// Ensure we always return JSON, even on errors
function sendJsonResponse($data, $statusCode = 200) {
    http_response_code($statusCode);
    header('Content-Type: application/json');
    echo json_encode($data);
    exit();
}

// Set up error handling to return JSON
set_error_handler(function($severity, $message, $file, $line) {
    $isDevelopment = ($_ENV['APP_ENV'] ?? 'development') === 'development';
    $errorDetails = $isDevelopment ? [
        'error' => 'Server error occurred',
        'details' => $message,
        'file' => basename($file),
        'line' => $line
    ] : ['error' => 'Server error occurred'];
    
    sendJsonResponse($errorDetails, 500);
});

register_shutdown_function(function() {
    $error = error_get_last();
    if ($error && in_array($error['type'], [E_ERROR, E_PARSE, E_CORE_ERROR, E_COMPILE_ERROR])) {
        $isDevelopment = ($_ENV['APP_ENV'] ?? 'development') === 'development';
        $errorDetails = $isDevelopment ? [
            'error' => 'Server error occurred',
            'details' => $error['message'],
            'file' => basename($error['file']),
            'line' => $error['line']
        ] : ['error' => 'Server error occurred'];
        
        sendJsonResponse($errorDetails, 500);
    }
});

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    sendJsonResponse(['success' => true]);
}

// Only allow POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendJsonResponse(['error' => 'Method not allowed'], 405);
}

// Load environment variables if available
$envFile = __DIR__ . '/../.env';
if (file_exists($envFile)) {
    $lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        if (strpos($line, '=') !== false && strpos($line, '#') !== 0) {
            list($key, $value) = explode('=', $line, 2);
            $_ENV[trim($key)] = trim($value);
        }
    }
}

// Check if external AI API is configured
$useExternalAPI = isset($_ENV['DEEPSEEK_API_KEY']) && 
                  !empty($_ENV['DEEPSEEK_API_KEY']) && 
                  $_ENV['DEEPSEEK_API_KEY'] !== 'your_deepseek_api_key_here';

// Get request data
$input = json_decode(file_get_contents('php://input'), true);

if (!$input || !isset($input['message'])) {
    sendJsonResponse(['error' => 'Message is required'], 400);
}

$userMessage = $input['message'];
$context = $input['context'] ?? '';

// Handle context properly - convert array to string if needed
if (is_array($context)) {
    $context = implode("\n", array_filter($context, 'is_string'));
} elseif (!is_string($context)) {
    $context = '';
}

if ($useExternalAPI) {
    // Use external DeepSeek API
    $apiUrl = $_ENV['DEEPSEEK_API_URL'] ?? 'https://api.deepseek.com/v1/chat/completions';
    $apiKey = $_ENV['DEEPSEEK_API_KEY'];

    $requestData = [
        'model' => 'deepseek-chat',
        'messages' => [
            [
                'role' => 'system',
                'content' => 'You are a helpful coding assistant for CodeQuest, an interactive learning platform. Help users with HTML, CSS, and JavaScript questions. Provide clear, educational explanations and code examples.'
            ],
            [
                'role' => 'user',
                'content' => $context && is_string($context) ? "Context: $context\n\nQuestion: $userMessage" : $userMessage
            ]
        ],
        'max_tokens' => 1000,
        'temperature' => 0.7
    ];

    // Make request to DeepSeek API
    $ch = curl_init();
    curl_setopt_array($ch, [
        CURLOPT_URL => $apiUrl,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => json_encode($requestData),
        CURLOPT_HTTPHEADER => [
            'Content-Type: application/json',
            'Authorization: Bearer ' . $apiKey
        ],
        CURLOPT_TIMEOUT => 30
    ]);

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $error = curl_error($ch);
    curl_close($ch);

    // Handle cURL errors
    if ($error) {
        $useExternalAPI = false; // Fallback to local responses
    } else if ($httpCode !== 200) {
        $useExternalAPI = false; // Fallback to local responses
    } else {
        $responseData = json_decode($response, true);
        if ($responseData && isset($responseData['choices'][0]['message']['content'])) {
            sendJsonResponse([
                'success' => true,
                'response' => $responseData['choices'][0]['message']['content'],
                'usage' => $responseData['usage'] ?? null,
                'source' => 'external_api'
            ]);
        } else {
            $useExternalAPI = false; // Fallback to local responses
        }
    }
}

// Fallback to local AI responses
$response = generateLocalAIResponse($userMessage, $context);

sendJsonResponse([
    'success' => true,
    'response' => $response,
    'source' => 'local_fallback'
]);

/**
 * Generate helpful local AI responses for common coding questions
 */
function generateLocalAIResponse($message, $context = '') {
    $message = strtolower($message);
    
    // HTML-related questions
    if (strpos($message, 'html') !== false) {
        if (strpos($message, 'semantic') !== false) {
            return "🌐 **HTML Semantic Elements**\n\nSemantic HTML uses meaningful tags that describe content:\n\n```html\n<header>Page header</header>\n<nav>Navigation menu</nav>\n<main>Main content</main>\n<article>Article content</article>\n<section>Content section</section>\n<aside>Sidebar content</aside>\n<footer>Page footer</footer>\n```\n\n**Benefits:**\n- Better accessibility\n- Improved SEO\n- Cleaner code structure\n- Screen reader friendly";
        }
        if (strpos($message, 'form') !== false) {
            return "📝 **HTML Forms**\n\nCreate interactive forms with proper structure:\n\n```html\n<form action=\"/submit\" method=\"POST\">\n  <div class=\"form-group\">\n    <label for=\"name\">Name:</label>\n    <input type=\"text\" id=\"name\" name=\"name\" required>\n  </div>\n  \n  <div class=\"form-group\">\n    <label for=\"email\">Email:</label>\n    <input type=\"email\" id=\"email\" name=\"email\" required>\n  </div>\n  \n  <button type=\"submit\">Submit</button>\n</form>\n```\n\n**Key points:**\n- Always use labels for accessibility\n- Include proper input types\n- Add validation attributes";
        }
        return "🌐 **HTML Help**\n\nHTML (HyperText Markup Language) is the foundation of web pages. Here are some key concepts:\n\n- **Structure**: Use semantic elements like `<header>`, `<main>`, `<footer>`\n- **Content**: Organize with headings (`<h1>-<h6>`), paragraphs (`<p>`), lists (`<ul>`, `<ol>`)\n- **Links**: Create navigation with `<a href=\"url\">Link text</a>`\n- **Images**: Add visuals with `<img src=\"image.jpg\" alt=\"description\">`\n\nNeed help with a specific HTML element or concept?";
    }
    
    // CSS-related questions
    if (strpos($message, 'css') !== false || strpos($message, 'center') !== false || strpos($message, 'div') !== false) {
        if (strpos($message, 'center') !== false && strpos($message, 'div') !== false) {
            return "🎨 **How to Center a Div**\n\nThere are several ways to center a div:\n\n**1. Flexbox (Recommended)**\n```css\n.parent {\n  display: flex;\n  justify-content: center; /* horizontal */\n  align-items: center;     /* vertical */\n  height: 100vh; /* full height */\n}\n\n.child {\n  /* This div will be centered */\n}\n```\n\n**2. CSS Grid**\n```css\n.parent {\n  display: grid;\n  place-items: center;\n  height: 100vh;\n}\n```\n\n**3. Margin Auto (horizontal only)**\n```css\n.centered {\n  width: 300px;\n  margin: 0 auto;\n}\n```\n\n**4. Absolute Positioning**\n```css\n.centered {\n  position: absolute;\n  top: 50%;\n  left: 50%;\n  transform: translate(-50%, -50%);\n}\n```\n\nFlexbox is usually the best choice for modern layouts!";
        }
        if (strpos($message, 'flexbox') !== false || strpos($message, 'flex') !== false) {
            return "🎨 **CSS Flexbox**\n\nFlexbox is perfect for creating flexible layouts:\n\n```css\n.container {\n  display: flex;\n  justify-content: center; /* horizontal alignment */\n  align-items: center;     /* vertical alignment */\n  gap: 1rem;              /* space between items */\n}\n\n.item {\n  flex: 1; /* grow to fill space */\n}\n```\n\n**Common properties:**\n- `flex-direction`: row, column\n- `justify-content`: center, space-between, space-around\n- `align-items`: center, flex-start, flex-end\n- `flex-wrap`: wrap, nowrap";
        }
        if (strpos($message, 'grid') !== false) {
            return "🎨 **CSS Grid**\n\nCSS Grid is ideal for 2D layouts:\n\n```css\n.grid-container {\n  display: grid;\n  grid-template-columns: repeat(3, 1fr);\n  grid-template-rows: auto;\n  gap: 1rem;\n}\n\n.grid-item {\n  grid-column: span 2; /* span 2 columns */\n}\n```\n\n**Key concepts:**\n- `grid-template-columns/rows`: Define grid structure\n- `gap`: Space between grid items\n- `grid-column/row`: Position items\n- `fr` unit: Fractional unit for flexible sizing";
        }
        if (strpos($message, 'responsive') !== false) {
            return "📱 **Responsive CSS**\n\nMake your site work on all devices:\n\n```css\n/* Mobile-first approach */\n.container {\n  width: 100%;\n  padding: 1rem;\n}\n\n/* Tablet */\n@media (min-width: 768px) {\n  .container {\n    max-width: 750px;\n    margin: 0 auto;\n  }\n}\n\n/* Desktop */\n@media (min-width: 1024px) {\n  .container {\n    max-width: 1200px;\n  }\n}\n```\n\n**Best practices:**\n- Start with mobile design\n- Use relative units (rem, %, vw/vh)\n- Test on multiple screen sizes";
        }
        return "🎨 **CSS Help**\n\nCSS (Cascading Style Sheets) controls the visual presentation of HTML. Key concepts:\n\n- **Selectors**: Target elements (`.class`, `#id`, `element`)\n- **Properties**: Style attributes (`color`, `font-size`, `margin`)\n- **Layout**: Flexbox, Grid, positioning\n- **Responsive**: Media queries for different screen sizes\n\nWhat specific CSS topic would you like help with?";
    }
    
    // JavaScript-related questions
    if (strpos($message, 'javascript') !== false || strpos($message, 'js') !== false) {
        if (strpos($message, 'function') !== false) {
            return "⚡ **JavaScript Functions**\n\nFunctions are reusable blocks of code:\n\n```javascript\n// Function declaration\nfunction greetUser(name) {\n  return `Hello, ${name}!`;\n}\n\n// Arrow function\nconst addNumbers = (a, b) => a + b;\n\n// Function with default parameters\nfunction createUser(name, role = 'user') {\n  return { name, role };\n}\n\n// Usage\nconst greeting = greetUser('Alice');\nconst sum = addNumbers(5, 3);\nconst user = createUser('Bob');\n```\n\n**Key concepts:**\n- Parameters and arguments\n- Return values\n- Scope and closures\n- Arrow functions vs regular functions";
        }
        if (strpos($message, 'event') !== false) {
            return "⚡ **JavaScript Events**\n\nHandle user interactions with event listeners:\n\n```javascript\n// Button click event\nconst button = document.getElementById('myButton');\nbutton.addEventListener('click', function() {\n  console.log('Button clicked!');\n});\n\n// Form submission\nconst form = document.querySelector('form');\nform.addEventListener('submit', (event) => {\n  event.preventDefault(); // Prevent default form submission\n  const formData = new FormData(form);\n  // Handle form data\n});\n\n// Keyboard events\ndocument.addEventListener('keydown', (event) => {\n  if (event.key === 'Enter') {\n    // Handle Enter key\n  }\n});\n```\n\n**Common events:**\n- `click`, `mouseover`, `mouseout`\n- `keydown`, `keyup`, `input`\n- `load`, `resize`, `scroll`";
        }
        if (strpos($message, 'dom') !== false) {
            return "⚡ **DOM Manipulation**\n\nInteract with HTML elements using JavaScript:\n\n```javascript\n// Select elements\nconst element = document.getElementById('myId');\nconst elements = document.querySelectorAll('.myClass');\n\n// Modify content\nelement.textContent = 'New text';\nelement.innerHTML = '<strong>Bold text</strong>';\n\n// Change attributes\nelement.setAttribute('class', 'newClass');\nelement.style.color = 'blue';\n\n// Create new elements\nconst newDiv = document.createElement('div');\nnewDiv.textContent = 'Hello World';\ndocument.body.appendChild(newDiv);\n\n// Remove elements\nelement.remove();\n```\n\n**Key methods:**\n- `getElementById()`, `querySelector()`\n- `textContent`, `innerHTML`\n- `createElement()`, `appendChild()`\n- `addEventListener()`";
        }
        return "⚡ **JavaScript Help**\n\nJavaScript adds interactivity to web pages. Core concepts:\n\n- **Variables**: `let`, `const`, `var`\n- **Functions**: Reusable code blocks\n- **Objects**: Data structures with properties and methods\n- **DOM**: Interact with HTML elements\n- **Events**: Respond to user actions\n- **Async**: Promises, async/await for handling asynchronous operations\n\nWhat JavaScript concept would you like to explore?";
    }
    
    // Challenge-related questions
    if (strpos($message, 'challenge') !== false || strpos($message, 'test') !== false) {
        return "🏆 **Challenge Help**\n\nHaving trouble with a coding challenge? Here are some tips:\n\n**General approach:**\n1. **Read carefully**: Understand all requirements\n2. **Plan first**: Sketch out your solution\n3. **Start simple**: Build basic structure first\n4. **Test often**: Check your code frequently\n5. **Debug systematically**: Use console.log() to trace issues\n\n**Common challenge types:**\n- **HTML Structure**: Focus on semantic elements and proper nesting\n- **CSS Styling**: Pay attention to layout, colors, and responsiveness\n- **JavaScript Logic**: Break complex problems into smaller functions\n\n**Debugging tips:**\n- Check browser console for errors\n- Validate HTML and CSS syntax\n- Test with different screen sizes\n\nWhat specific challenge are you working on?";
    }
    
    // Learning-related questions
    if (strpos($message, 'learn') !== false || strpos($message, 'study') !== false) {
        return "📚 **Learning Web Development**\n\nHere's a structured approach to learning:\n\n**1. HTML Foundation**\n- Semantic elements and structure\n- Forms and input validation\n- Accessibility best practices\n\n**2. CSS Styling**\n- Selectors and specificity\n- Flexbox and Grid layouts\n- Responsive design principles\n\n**3. JavaScript Fundamentals**\n- Variables, functions, and objects\n- DOM manipulation\n- Event handling\n- Async programming\n\n**Learning tips:**\n- Practice with real projects\n- Build something every day\n- Join coding communities\n- Read other people's code\n- Don't rush - understanding is key\n\nWhat area would you like to focus on next?";
    }
    
    // Error-related questions
    if (strpos($message, 'error') !== false || strpos($message, 'bug') !== false || strpos($message, 'not working') !== false) {
        return "🐛 **Debugging Help**\n\nDebugging is a crucial skill! Here's how to approach it:\n\n**Step-by-step debugging:**\n1. **Identify the problem**: What exactly isn't working?\n2. **Check the console**: Look for error messages in browser dev tools\n3. **Isolate the issue**: Comment out code to find the problematic section\n4. **Use console.log()**: Add logging to trace code execution\n5. **Validate syntax**: Check for typos, missing brackets, semicolons\n\n**Common issues:**\n- **HTML**: Unclosed tags, missing attributes\n- **CSS**: Typos in property names, missing semicolons\n- **JavaScript**: Undefined variables, incorrect function calls\n\n**Tools to help:**\n- Browser Developer Tools (F12)\n- HTML/CSS validators\n- Console for JavaScript errors\n\nWhat specific error are you encountering?";
    }
    
    // Default helpful response
    return "🤖 **CodeQuest AI Assistant**\n\nI'm here to help you with web development! I can assist with:\n\n**HTML** 🌐\n- Semantic elements and structure\n- Forms and accessibility\n- Best practices\n\n**CSS** 🎨\n- Layout (Flexbox, Grid)\n- Responsive design\n- Styling techniques\n\n**JavaScript** ⚡\n- Functions and variables\n- DOM manipulation\n- Event handling\n- Debugging\n\n**General Help** 📚\n- Challenge solutions\n- Learning paths\n- Best practices\n- Debugging tips\n\nFeel free to ask me anything about web development, or describe what you're trying to build!";
}
?>