<?php

// Front controller for CodeQuest platform
// Routes API requests to api/index.php and serves static files from public/

$requestUri = $_SERVER['REQUEST_URI'];
$requestMethod = $_SERVER['REQUEST_METHOD'];

// Remove query string
$path = parse_url($requestUri, PHP_URL_PATH);

// Route API requests
if (strpos($path, '/api/') === 0) {
    // Include the API handler
    require_once __DIR__ . '/api/index.php';
    exit();
}

// Route static files from public directory
$publicPath = __DIR__ . '/public' . $path;

// Default to index.html for root requests
if ($path === '/' || $path === '') {
    $publicPath = __DIR__ . '/public/index.html';
}

// Check if file exists
if (file_exists($publicPath) && is_file($publicPath)) {
    // Get file extension for proper MIME type
    $extension = pathinfo($publicPath, PATHINFO_EXTENSION);
    
    // Set appropriate MIME types
    $mimeTypes = [
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
    
    $mimeType = $mimeTypes[$extension] ?? 'application/octet-stream';
    
    // Set headers
    header('Content-Type: ' . $mimeType . '; charset=utf-8');
    header('Cache-Control: public, max-age=3600'); // Cache for 1 hour
    
    // Serve the file
    readfile($publicPath);
    exit();
}

// Handle 404 for non-existent files
http_response_code(404);
header('Content-Type: text/html; charset=utf-8');

echo '<!DOCTYPE html>
<html>
<head>
    <title>404 - Page Not Found</title>
    <style>
        body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
        h1 { color: #333; }
        p { color: #666; }
        a { color: #007bff; text-decoration: none; }
        a:hover { text-decoration: underline; }
    </style>
</head>
<body>
    <h1>404 - Page Not Found</h1>
    <p>The page you are looking for does not exist.</p>
    <p><a href="/">Return to Home</a></p>
</body>
</html>';
