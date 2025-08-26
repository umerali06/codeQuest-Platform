<?php
/**
 * CodeQuest Server Router
 * Handles both static files and API requests
 */

$requestUri = $_SERVER['REQUEST_URI'];
$requestMethod = $_SERVER['REQUEST_METHOD'];

// Handle API requests
if (strpos($requestUri, '/api/') === 0) {
    // Include the API router
    require_once __DIR__ . '/api/index.php';
    exit();
}

// Handle static files
$filePath = __DIR__ . '/public' . $requestUri;

// Default to index.html for root requests
if ($requestUri === '/' || $requestUri === '') {
    $filePath = __DIR__ . '/public/index.html';
}

// Check if file exists
if (file_exists($filePath) && is_file($filePath)) {
    $extension = pathinfo($filePath, PATHINFO_EXTENSION);
    
    // Set appropriate content type
    $contentTypes = [
        'html' => 'text/html',
        'css' => 'text/css',
        'js' => 'application/javascript',
        'png' => 'image/png',
        'jpg' => 'image/jpeg',
        'jpeg' => 'image/jpeg',
        'gif' => 'image/gif',
        'svg' => 'image/svg+xml',
        'ico' => 'image/x-icon'
    ];
    
    if (isset($contentTypes[$extension])) {
        header('Content-Type: ' . $contentTypes[$extension]);
    }
    
    // Serve the file
    readfile($filePath);
    exit();
}

// File not found
http_response_code(404);
echo '<h1>404 Not Found</h1>';
echo '<p>The requested resource was not found.</p>';
