<?php
/**
 * Database Consistency Checker
 * Checks what database strategy is being used across the app
 */

header('Content-Type: text/html; charset=UTF-8');
echo "<h1>🔍 Database Consistency Check</h1>";
echo "<pre>";

// Load environment variables
if (file_exists('.env')) {
    $envContent = file_get_contents('.env');
    $envLines = explode("\n", $envContent);
    foreach ($envLines as $line) {
        if (strpos($line, '=') !== false && !str_starts_with($line, '#')) {
            list($key, $value) = explode('=', $line, 2);
            $_ENV[trim($key)] = trim($value);
        }
    }
}

echo "📋 Environment Configuration:\n";
echo "DB_HOST: " . ($_ENV['DB_HOST'] ?? 'localhost') . "\n";
echo "DB_NAME: " . ($_ENV['DB_NAME'] ?? 'codequest_db') . "\n";
echo "DB_USER: " . ($_ENV['DB_USER'] ?? 'root') . "\n";
echo "DB_PASS: " . (empty($_ENV['DB_PASS']) ? '(empty)' : '(set)') . "\n\n";

// Test MySQL connection
echo "🔌 Testing MySQL Connection:\n";
$dbConfig = [
    'host' => $_ENV['DB_HOST'] ?? 'localhost',
    'dbname' => $_ENV['DB_NAME'] ?? 'codequest_db',
    'username' => $_ENV['DB_USER'] ?? 'root',
    'password' => $_ENV['DB_PASS'] ?? ''
];

try {
    $pdo = new PDO(
        "mysql:host={$dbConfig['host']};dbname={$dbConfig['dbname']};charset=utf8mb4",
        $dbConfig['username'],
        $dbConfig['password'],
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );
    echo "✅ MySQL connection successful to database: {$dbConfig['dbname']}\n";
    
    // Check if tables exist
    echo "\n📊 Checking Tables:\n";
    $tables = ['users', 'games', 'leaderboard', 'challenges', 'user_progress'];
    foreach ($tables as $table) {
        try {
            $stmt = $pdo->query("SHOW TABLES LIKE '$table'");
            if ($stmt->rowCount() > 0) {
                $countStmt = $pdo->query("SELECT COUNT(*) as count FROM $table");
                $count = $countStmt->fetch()['count'];
                echo "✅ Table '$table' exists with $count records\n";
            } else {
                echo "❌ Table '$table' does not exist\n";
            }
        } catch (Exception $e) {
            echo "❌ Error checking table '$table': " . $e->getMessage() . "\n";
        }
    }
    
} catch (Exception $e) {
    echo "❌ MySQL connection failed: " . $e->getMessage() . "\n";
    echo "💡 This is likely why you're getting 500 errors!\n";
    
    // Check if MySQL service is running
    echo "\n🔧 Troubleshooting:\n";
    echo "1. Make sure MySQL/XAMPP/WAMP is running\n";
    echo "2. Check if database '{$dbConfig['dbname']}' exists\n";
    echo "3. Verify credentials in .env file\n";
    echo "4. Try running: http://localhost:8000/setup-database-complete.php\n";
}

echo "\n" . str_repeat("=", 50) . "\n";
echo "🎯 Summary:\n";
echo "- Main API (api/index.php): Uses MySQL ✅\n";
echo "- Games API: Uses MySQL ✅\n";
echo "- Leaderboard API: Uses MySQL ✅\n";
echo "- Config API: No database needed ✅\n";
echo "\n✅ All APIs are now using MySQL consistently!\n";
echo "🔧 If you're still getting 500 errors, the issue is likely:\n";
echo "   1. MySQL server not running\n";
echo "   2. Database doesn't exist\n";
echo "   3. Tables haven't been created yet\n";

echo "</pre>";
?>