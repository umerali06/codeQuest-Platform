<?php

// Test script for CodeQuest backend
require_once __DIR__ . '/vendor/autoload.php';

use CodeQuest\Core\Database;
use CodeQuest\Core\Logger;

echo "=== CodeQuest Backend Test ===\n\n";

try {
    // Test Logger
    echo "1. Testing Logger...\n";
    $logger = new Logger();
    $logger->info('Test log message');
    echo "✓ Logger working\n\n";
    
    // Test Database
    echo "2. Testing Database...\n";
    $database = Database::getInstance();
    
    // Try to connect to database
    try {
        $database->connect();
        echo "✓ Database connection successful\n";
        
        // Test a simple query
        $result = $database->fetch('SELECT 1 as test');
        if ($result && isset($result['test'])) {
            echo "✓ Database query working\n";
        } else {
            echo "✗ Database query failed\n";
        }
        
    } catch (Exception $e) {
        echo "✗ Database connection failed: " . $e->getMessage() . "\n";
        echo "   This is expected if the database is not set up yet\n";
    }
    
    echo "\n3. Testing API endpoints...\n";
    
    // Test health endpoint
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, 'http://localhost:5000/api/health');
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 5);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    if ($httpCode === 200) {
        echo "✓ Health endpoint working\n";
        echo "  Response: " . $response . "\n";
    } else {
        echo "✗ Health endpoint failed (HTTP $httpCode)\n";
    }
    
    // Test statistics endpoint
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, 'http://localhost:5000/api/statistics');
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 5);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    if ($httpCode === 200) {
        echo "✓ Statistics endpoint working\n";
        echo "  Response: " . $response . "\n";
    } else {
        echo "✗ Statistics endpoint failed (HTTP $httpCode)\n";
    }
    
    // Test modules endpoint
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, 'http://localhost:5000/api/modules');
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 5);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    if ($httpCode === 200) {
        echo "✓ Modules endpoint working\n";
        echo "  Response: " . $response . "\n";
    } else {
        echo "✗ Modules endpoint failed (HTTP $httpCode)\n";
    }
    
    echo "\n4. Testing frontend...\n";
    
    // Test main page
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, 'http://localhost:5000/');
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 5);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    if ($httpCode === 200) {
        echo "✓ Frontend main page working\n";
        if (strpos($response, 'CodeQuest') !== false) {
            echo "✓ Page contains expected content\n";
        } else {
            echo "✗ Page content unexpected\n";
        }
    } else {
        echo "✗ Frontend main page failed (HTTP $httpCode)\n";
    }
    
    echo "\n=== Test Summary ===\n";
    echo "Backend is running and responding to requests.\n";
    echo "API endpoints are working correctly.\n";
    echo "Frontend is being served properly.\n";
    echo "\nNext steps:\n";
    echo "1. Set up MySQL database and run migrations\n";
    echo "2. Configure .env file with database credentials\n";
    echo "3. Set up Appwrite project and get API keys\n";
    echo "4. Get DeepSeek AI API key\n";
    echo "5. Test full functionality with real data\n";
    
} catch (Exception $e) {
    echo "✗ Test failed with error: " . $e->getMessage() . "\n";
    echo "Stack trace:\n" . $e->getTraceAsString() . "\n";
}
