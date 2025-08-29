<?php
// Diagnostic script to identify 500 error causes
header('Content-Type: text/html; charset=UTF-8');
error_reporting(E_ALL);
ini_set('display_errors', 1);

echo "<h1>🔍 API 500 Error Diagnosis</h1>";
echo "<pre>";

// Check database connection
echo "1. Testing database connection...\n";
try {
    $pdo = new PDO('sqlite:codequest.db');
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    echo "✅ Database connection successful\n";
    
    // Check if tables exist
    echo "\n2. Checking database tables...\n";
    $tables = ['games', 'leaderboard', 'challenges', 'users'];
    foreach ($tables as $table) {
        try {
            $stmt = $pdo->query("SELECT COUNT(*) FROM $table");
            $count = $stmt->fetchColumn();
            echo "✅ Table '$table' exists with $count records\n";
        } catch (Exception $e) {
            echo "❌ Table '$table' missing or error: " . $e->getMessage() . "\n";
        }
    }
    
} catch (Exception $e) {
    echo "❌ Database connection failed: " . $e->getMessage() . "\n";
}

echo "\n3. Testing API endpoints directly...\n";

// Test Games API directly
echo "\n🎮 Testing Games API (api/games.php):\n";
try {
    ob_start();
    $_SERVER['REQUEST_METHOD'] = 'GET';
    $_SERVER['REQUEST_URI'] = '/api/games';
    include 'api/games.php';
    $output = ob_get_clean();
    
    if (strpos($output, '"success":true') !== false) {
        echo "✅ Games API working\n";
    } else {
        echo "❌ Games API output: " . substr($output, 0, 300) . "\n";
    }
} catch (Exception $e) {
    echo "❌ Games API error: " . $e->getMessage() . "\n";
}

// Test Config API directly
echo "\n⚙️ Testing Config API (api/config.php):\n";
try {
    ob_start();
    $_SERVER['REQUEST_METHOD'] = 'GET';
    $_SERVER['REQUEST_URI'] = '/api/config/appwrite';
    include 'api/config.php';
    $output = ob_get_clean();
    
    if (strpos($output, '"success":true') !== false) {
        echo "✅ Config API working\n";
    } else {
        echo "❌ Config API output: " . substr($output, 0, 300) . "\n";
    }
} catch (Exception $e) {
    echo "❌ Config API error: " . $e->getMessage() . "\n";
}

echo "\n" . str_repeat("=", 50) . "\n";
echo "🎯 If tables are missing, run: http://localhost:8000/run-database-setup.php\n";
echo "🔧 If APIs still fail, check the error messages above for specific issues.\n";

echo "</pre>";
?>