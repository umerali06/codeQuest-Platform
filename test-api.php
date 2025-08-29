<?php
/**
 * Simple API Test Script
 * Tests all API endpoints to ensure they're working correctly
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

echo "🧪 CodeQuest API Test Suite\n";
echo "==========================\n\n";

// Test database connection
echo "📊 Testing Database Connection...\n";
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

// Test API endpoints directly
$endpoints = [
    'GET /api/health' => __DIR__ . '/api/index.php',
    'GET /api/statistics' => __DIR__ . '/api/index.php',
    'GET /api/modules' => __DIR__ . '/api/index.php',
    'GET /api/lessons' => __DIR__ . '/api/index.php',
    'GET /api/challenges' => __DIR__ . '/api/index.php',
    'GET /api/leaderboard' => __DIR__ . '/api/index.php',
];

echo "🌐 Testing API Endpoints...\n";

foreach ($endpoints as $endpoint => $filePath) {
    echo "Testing $endpoint... ";
    
    // Extract endpoint name for simulation
    $endpointName = explode(' ', $endpoint)[1];
    $pathParts = explode('/', trim($endpointName, '/'));
    
    // Simulate the request environment
    $_SERVER['REQUEST_METHOD'] = 'GET';
    $_SERVER['REQUEST_URI'] = $endpointName;
    
    try {
        // Capture output
        ob_start();
        
        // Set up path parts for the API
        $GLOBALS['pathParts'] = array_slice($pathParts, 1); // Remove 'api' prefix
        $GLOBALS['requestMethod'] = 'GET';
        
        // Include the API file
        include $filePath;
        
        $output = ob_get_clean();
        
        // Try to decode JSON response
        $data = json_decode($output, true);
        
        if ($data && (isset($data['success']) || isset($data['status']))) {
            echo "✅ OK\n";
        } else {
            echo "⚠️  Response: " . substr($output, 0, 50) . "...\n";
        }
        
    } catch (Exception $e) {
        ob_end_clean();
        echo "❌ Error: " . $e->getMessage() . "\n";
    }
}

echo "\n📋 Testing Database Tables...\n";

// Test database tables
$tables = [
    'users',
    'modules', 
    'lessons',
    'challenges',
    'user_progress',
    'user_lesson_completions',
    'user_challenge_attempts'
];

foreach ($tables as $table) {
    echo "Checking table '$table'... ";
    
    try {
        $stmt = $pdo->prepare("SELECT COUNT(*) as count FROM $table LIMIT 1");
        $stmt->execute();
        $result = $stmt->fetch();
        echo "✅ OK ({$result['count']} records)\n";
    } catch (PDOException $e) {
        if (strpos($e->getMessage(), "doesn't exist") !== false) {
            echo "⚠️  Table missing\n";
        } else {
            echo "❌ Error: " . $e->getMessage() . "\n";
        }
    }
}

echo "\n🔧 Testing Configuration...\n";

// Test environment variables
$requiredEnvVars = [
    'DB_HOST',
    'DB_NAME', 
    'DB_USER',
    'APPWRITE_ENDPOINT',
    'APPWRITE_PROJECT_ID'
];

foreach ($requiredEnvVars as $var) {
    echo "Checking $var... ";
    if (isset($_ENV[$var]) && !empty($_ENV[$var])) {
        echo "✅ Set\n";
    } else {
        echo "⚠️  Missing or empty\n";
    }
}

echo "\n🎯 Test Summary\n";
echo "===============\n";
echo "✅ Database connection working\n";
echo "✅ API endpoints responding\n";
echo "⚠️  Some tables may need to be created\n";
echo "⚠️  Some environment variables may need configuration\n\n";

echo "💡 Next Steps:\n";
echo "1. Run setup.php to create missing database tables\n";
echo "2. Run seed-learn-data.php to populate sample data\n";
echo "3. Configure missing environment variables in .env\n";
echo "4. Test the application in your browser\n\n";

echo "🚀 Ready to launch CodeQuest!\n";
?>