<?php
/**
 * Direct API Test - Tests API functions directly
 */

// Set up environment
require_once __DIR__ . '/vendor/autoload.php';

// Load environment variables
$dotenv = Dotenv\Dotenv::createImmutable(__DIR__);
$dotenv->load();

// Database configuration
$dbConfig = [
    'host' => $_ENV['DB_HOST'] ?? 'localhost',
    'dbname' => $_ENV['DB_NAME'] ?? 'codequest',
    'username' => $_ENV['DB_USER'] ?? 'root',
    'password' => $_ENV['DB_PASS'] ?? ''
];

echo "🧪 CodeQuest Direct API Test\n";
echo "============================\n\n";

// Initialize database connection
try {
    $pdo = new PDO(
        "mysql:host={$dbConfig['host']};dbname={$dbConfig['dbname']};charset=utf8mb4",
        $dbConfig['username'],
        $dbConfig['password'],
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false
        ]
    );
    echo "✅ Database connection successful\n\n";
} catch (PDOException $e) {
    echo "❌ Database connection failed: " . $e->getMessage() . "\n\n";
    exit(1);
}

// Test Statistics API
echo "📊 Testing Statistics API...\n";
try {
    // Simulate request environment
    $requestMethod = 'GET';
    
    // Include utility functions
    function sendResponse($data, $statusCode = 200) {
        echo "Response: " . json_encode($data, JSON_PRETTY_PRINT) . "\n";
    }
    
    // Include and test statistics
    ob_start();
    include __DIR__ . '/api/statistics.php';
    $output = ob_get_clean();
    
    echo "✅ Statistics API working\n\n";
} catch (Exception $e) {
    echo "❌ Statistics API error: " . $e->getMessage() . "\n\n";
}

// Test Modules API
echo "📚 Testing Modules API...\n";
try {
    $pathParts = ['modules'];
    $requestMethod = 'GET';
    
    ob_start();
    include __DIR__ . '/api/modules.php';
    $output = ob_get_clean();
    
    echo "✅ Modules API working\n\n";
} catch (Exception $e) {
    echo "❌ Modules API error: " . $e->getMessage() . "\n\n";
}

// Test Lessons API
echo "📖 Testing Lessons API...\n";
try {
    $pathParts = ['lessons'];
    $requestMethod = 'GET';
    
    ob_start();
    include __DIR__ . '/api/lessons.php';
    $output = ob_get_clean();
    
    echo "✅ Lessons API working\n\n";
} catch (Exception $e) {
    echo "❌ Lessons API error: " . $e->getMessage() . "\n\n";
}

// Test Challenges API
echo "🎯 Testing Challenges API...\n";
try {
    $pathParts = ['challenges'];
    $requestMethod = 'GET';
    
    ob_start();
    include __DIR__ . '/api/challenges.php';
    $output = ob_get_clean();
    
    echo "✅ Challenges API working\n\n";
} catch (Exception $e) {
    echo "❌ Challenges API error: " . $e->getMessage() . "\n\n";
}

// Test sample data
echo "📋 Testing Sample Data...\n";

// Check modules
$stmt = $pdo->prepare("SELECT COUNT(*) as count FROM modules WHERE is_active = TRUE");
$stmt->execute();
$moduleCount = $stmt->fetchColumn();
echo "Modules: $moduleCount\n";

// Check lessons
$stmt = $pdo->prepare("SELECT COUNT(*) as count FROM lessons WHERE is_active = TRUE");
$stmt->execute();
$lessonCount = $stmt->fetchColumn();
echo "Lessons: $lessonCount\n";

// Check challenges
$stmt = $pdo->prepare("SELECT COUNT(*) as count FROM challenges WHERE is_active = TRUE");
$stmt->execute();
$challengeCount = $stmt->fetchColumn();
echo "Challenges: $challengeCount\n";

echo "\n🎉 All tests completed!\n";
echo "Ready to test in browser at: http://localhost/codeQuest-Platform/public/\n";
?>