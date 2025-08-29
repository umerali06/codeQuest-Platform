<?php
/**
 * Router for PHP built-in development server
 */

$uri = $_SERVER['REQUEST_URI'];
$path = parse_url($uri, PHP_URL_PATH);

// Handle API requests
if (strpos($path, '/api/') === 0) {
    // Set the PATH_INFO for the API
    $_SERVER['PATH_INFO'] = substr($path, 4); // Remove '/api' prefix
    require_once __DIR__ . '/api/index.php';
    return true;
}

// Handle static files in public directory
$publicFile = __DIR__ . '/public' . $path;
if (file_exists($publicFile) && is_file($publicFile)) {
    return false; // Let PHP serve the file
}

// Handle root request
if ($path === '/') {
    require_once __DIR__ . '/public/index.html';
    return true;
}

// Try to serve from public directory
$publicPath = __DIR__ . '/public' . $path;
if (file_exists($publicPath)) {
    if (is_dir($publicPath)) {
        // Try index.html in directory
        $indexFile = $publicPath . '/index.html';
        if (file_exists($indexFile)) {
            require_once $indexFile;
            return true;
        }
    } else {
        return false; // Let PHP serve the file
    }
}

// Default to 404
http_response_code(404);
echo "404 Not Found";
return true;
?>