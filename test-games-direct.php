<?php
/**
 * Direct test of games API without routing
 */

// Set up environment to simulate web request
$_SERVER['REQUEST_METHOD'] = 'GET';
$_SERVER['REQUEST_URI'] = '/api/games';
$_SERVER['HTTP_HOST'] = 'localhost';
$_GET = [];

// Load environment variables
$envFile = __DIR__ . '/.env';
if (file_exists($envFile)) {
    $lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        if (strpos($line, '=') !== false && !str_starts_with($line, '#')) {
            list($key, $value) = explode('=', $line, 2);
            $_ENV[trim($key)] = trim($value, '"\'');
        }
    }
}

// Capture output
ob_start();

try {
    include 'api/games.php';
    $output = ob_get_clean();
    
    // Check for PHP errors
    if (strpos($output, 'Fatal error') !== false || strpos($output, 'Cannot redeclare') !== false) {
        echo "❌ PHP Error found:\n";
        echo $output . "\n";
        exit(1);
    }
    
    // Try to parse as JSON
    $data = json_decode($output, true);
    if ($data === null) {
        echo "❌ Invalid JSON output:\n";
        echo substr($output, 0, 500) . "\n";
        exit(1);
    }
    
    echo "✅ Games API test successful!\n";
    echo "Response structure: " . (isset($data['success']) ? 'Valid' : 'Invalid') . "\n";
    echo "Games count: " . (isset($data['data']) ? count($data['data']) : 0) . "\n";
    echo "Success status: " . ($data['success'] ? 'true' : 'false') . "\n";
    
} catch (Exception $e) {
    ob_end_clean();
    echo "❌ Exception: " . $e->getMessage() . "\n";
    exit(1);
} catch (Error $e) {
    ob_end_clean();
    echo "❌ Fatal Error: " . $e->getMessage() . "\n";
    exit(1);
}
?>