<?php
/**
 * Debug API Response
 * This script shows the exact API response and error details
 */

echo "🔍 Debugging API Response\n";
echo "=========================\n\n";

// Test challenges endpoint with detailed error reporting
echo "📋 Testing /api/challenges endpoint...\n";
$challengesUrl = 'http://localhost:8000/api/challenges';

// Enable error reporting
error_reporting(E_ALL);
ini_set('display_errors', 1);

$challengesResponse = file_get_contents($challengesUrl);

if ($challengesResponse !== false) {
    echo "✅ Challenges endpoint working!\n";
    echo "Raw response length: " . strlen($challengesResponse) . " characters\n";
    echo "Raw response (first 500 chars):\n";
    echo substr($challengesResponse, 0, 500) . "\n\n";
    
    $challengesData = json_decode($challengesResponse, true);
    
    if (json_last_error() !== JSON_ERROR_NONE) {
        echo "❌ JSON decode error: " . json_last_error_msg() . "\n";
    } else {
        echo "✅ JSON decoded successfully\n";
        echo "Response structure:\n";
        print_r($challengesData);
    }
} else {
    echo "❌ Failed to connect to challenges endpoint\n";
    echo "Error info: " . (error_get_last()['message'] ?? 'Unknown error') . "\n";
}

echo "\n🎉 Debug completed!\n";
?>
