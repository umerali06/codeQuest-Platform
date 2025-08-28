<?php
// Front controller for CodeQuest Platform
// Routes API requests to api/index.php and serves static files

$requestUri = $_SERVER['REQUEST_URI'];
$requestMethod = $_SERVER['REQUEST_METHOD'];

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
    http_response_code(200);
    exit();
}

// Route API requests to api/index.php
if (strpos($requestUri, '/api/') === 0) {
    // Remove /api prefix and forward to api/index.php
    $apiPath = substr($requestUri, 4); // Remove '/api'
    $_SERVER['REQUEST_URI'] = $apiPath;
    
    // Include the API handler
    require_once __DIR__ . '/../api/index.php';
    exit();
}

// For all other requests, serve static files
$filePath = __DIR__ . $requestUri;

// If the file exists and is within the public directory, serve it
if (file_exists($filePath) && is_file($filePath) && strpos(realpath($filePath), realpath(__DIR__)) === 0) {
    // Determine content type based on file extension
    $extension = pathinfo($filePath, PATHINFO_EXTENSION);
    $contentTypes = [
        'html' => 'text/html',
        'css' => 'text/css',
        'js' => 'application/javascript',
        'json' => 'application/json',
        'png' => 'image/png',
        'jpg' => 'image/jpeg',
        'jpeg' => 'image/jpeg',
        'gif' => 'image/gif',
        'svg' => 'image/svg+xml',
        'ico' => 'image/x-icon',
        'woff' => 'font/woff',
        'woff2' => 'font/woff2',
        'ttf' => 'font/ttf',
        'eot' => 'application/vnd.ms-fontobject'
    ];
    
    if (isset($contentTypes[$extension])) {
        header('Content-Type: ' . $contentTypes[$extension]);
    }
    
    // Serve the file
    readfile($filePath);
    exit();
}

// If file doesn't exist, serve index.html for SPA routing
if (file_exists(__DIR__ . '/index.html')) {
    header('Content-Type: text/html');
    readfile(__DIR__ . '/index.html');
    exit();
}

// 404 if nothing matches
http_response_code(404);
echo 'File not found';
?>
