<?php
/**
 * Simple test to verify games API is working without function conflicts
 */

// Test direct inclusion of games.php
echo "Testing games.php inclusion...\n";

try {
    // Simulate the API request environment
    $_SERVER['REQUEST_METHOD'] = 'GET';
    $_SERVER['REQUEST_URI'] = '/api/games';
    $_GET = [];
    
    // Capture output
    ob_start();
    
    // Include the games API
    include 'api/games.php';
    
    $output = ob_get_clean();
    
    echo "✅ Success! No function redeclaration errors.\n";
    echo "Output length: " . strlen($output) . " characters\n";
    
    // Check if output is valid JSON
    $decoded = json_decode($output, true);
    if ($decoded !== null) {
        echo "✅ Valid JSON response\n";
        if (isset($decoded['success'])) {
            echo "✅ API response structure is correct\n";
        }
    } else {
        echo "❌ Invalid JSON response\n";
        echo "First 200 chars: " . substr($output, 0, 200) . "\n";
    }
    
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
} catch (Error $e) {
    echo "❌ Fatal Error: " . $e->getMessage() . "\n";
}

echo "\nTest completed.\n";
?>