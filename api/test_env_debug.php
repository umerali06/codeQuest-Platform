<?php
// Debug environment variable loading
echo "=== Environment Variable Debug ===\n";

// Check if .env file exists
$envFile = __DIR__ . '/.env';
echo "Env file exists: " . (file_exists($envFile) ? 'YES' : 'NO') . "\n";
echo "Env file path: " . $envFile . "\n\n";

// Try to load .env file
if (file_exists($envFile)) {
    try {
        require_once 'vendor/autoload.php';
        $dotenv = Dotenv\Dotenv::createImmutable(__DIR__);
        $dotenv->load();
        echo "✓ .env file loaded successfully\n";
    } catch (Exception $e) {
        echo "✗ Failed to load .env: " . $e->getMessage() . "\n";
    }
} else {
    echo "✗ .env file not found\n";
}

echo "\n=== Environment Variables ===\n";
echo "DEEPSEEK_API_KEY in \$_ENV: " . ($_ENV['DEEPSEEK_API_KEY'] ?? 'NOT_SET') . "\n";
echo "DEEPSEEK_API_KEY in \$_SERVER: " . ($_SERVER['DEEPSEEK_API_KEY'] ?? 'NOT_SET') . "\n";
echo "DEEPSEEK_API_KEY in getenv(): " . (getenv('DEEPSEEK_API_KEY') ? 'SET' : 'NOT_SET') . "\n";

if (isset($_ENV['DEEPSEEK_API_KEY'])) {
    echo "API Key length: " . strlen($_ENV['DEEPSEEK_API_KEY']) . "\n";
    echo "API Key (first 10 chars): " . substr($_ENV['DEEPSEEK_API_KEY'], 0, 10) . "...\n";
}

echo "\n=== Current Working Directory ===\n";
echo "Current dir: " . __DIR__ . "\n";
echo "Parent dir: " . dirname(__DIR__) . "\n";

// Check if we're in the right context
if (strpos(__DIR__, 'api') !== false) {
    echo "✓ Running from api directory context\n";
} else {
    echo "✗ NOT running from api directory context\n";
}
?>
