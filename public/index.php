<?php
/**
 * Public Router for CodeQuest Platform
 * This handles API routing when running from public directory
 */

// Get the request URI
$uri = $_SERVER['REQUEST_URI'];
$path = parse_url($uri, PHP_URL_PATH);

// Remove leading slash
$path = ltrim($path, '/');

// Check if it's an API request
if (strpos($path, 'api/') === 0) {
    // API request - route to api/index.php
    $apiPath = __DIR__ . '/../api/index.php';
    if (file_exists($apiPath)) {
        // Set the path info for the API
        $_SERVER['PATH_INFO'] = '/' . substr($path, 4); // Remove 'api' prefix
        include $apiPath;
        exit;
    } else {
        http_response_code(404);
        echo json_encode(['error' => 'API not found']);
        exit;
    }
}

// If not an API request, serve the requested file or index.html
$requestedFile = __DIR__ . '/' . $path;

if (file_exists($requestedFile) && is_file($requestedFile)) {
    // Serve the file directly
    $extension = pathinfo($requestedFile, PATHINFO_EXTENSION);
    
    // Set appropriate content type
    switch ($extension) {
        case 'html':
            header('Content-Type: text/html');
            break;
        case 'css':
            header('Content-Type: text/css');
            break;
        case 'js':
            header('Content-Type: application/javascript');
            break;
        case 'png':
            header('Content-Type: image/png');
            break;
        case 'jpg':
        case 'jpeg':
            header('Content-Type: image/jpeg');
            break;
        case 'svg':
            header('Content-Type: image/svg+xml');
            break;
        case 'ico':
            header('Content-Type: image/x-icon');
            break;
        default:
            header('Content-Type: text/plain');
    }
    
    readfile($requestedFile);
    exit;
}

// If no file found, serve index.html for SPA routing
if (file_exists(__DIR__ . '/index.html')) {
    header('Content-Type: text/html');
    readfile(__DIR__ . '/index.html');
    exit;
}

// 404 - File not found
http_response_code(404);
echo "File not found: $path";
?>
