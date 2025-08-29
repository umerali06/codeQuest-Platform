<?php
/**
 * Debug API Response
 * Test what the API is actually returning
 */

// Capture the actual API response
$url = 'http://localhost:8000/api/learning-paths';

echo "Testing API URL: $url\n\n";

// Method 1: Using file_get_contents
echo "=== Method 1: file_get_contents ===\n";
$context = stream_context_create([
    'http' => [
        'method' => 'GET',
        'header' => 'Content-Type: application/json'
    ]
]);

$response1 = @file_get_contents($url, false, $context);
if ($response1 === false) {
    echo "Failed to get response\n";
    $error = error_get_last();
    echo "Error: " . ($error['message'] ?? 'Unknown error') . "\n";
} else {
    echo "Response length: " . strlen($response1) . " bytes\n";
    echo "First 500 characters:\n";
    echo substr($response1, 0, 500) . "\n";
    echo "Last 100 characters:\n";
    echo substr($response1, -100) . "\n";
}

echo "\n=== Method 2: cURL ===\n";
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HEADER, true);
curl_setopt($ch, CURLOPT_TIMEOUT, 10);

$response2 = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$error = curl_error($ch);
curl_close($ch);

if ($response2 === false) {
    echo "cURL failed: $error\n";
} else {
    echo "HTTP Code: $httpCode\n";
    echo "Response length: " . strlen($response2) . " bytes\n";
    
    // Split headers and body
    $headerSize = curl_getinfo($ch, CURLINFO_HEADER_SIZE);
    $headers = substr($response2, 0, $headerSize);
    $body = substr($response2, $headerSize);
    
    echo "Headers:\n$headers\n";
    echo "Body (first 500 chars):\n" . substr($body, 0, 500) . "\n";
}

echo "\n=== Method 3: Direct PHP include test ===\n";
// Test if the issue is with the router
try {
    $_SERVER['REQUEST_METHOD'] = 'GET';
    $_SERVER['REQUEST_URI'] = '/api/learning-paths';
    
    // Include the router
    ob_start();
    include 'router.php';
    $routerOutput = ob_get_clean();
    
    echo "Router output length: " . strlen($routerOutput) . " bytes\n";
    echo "Router output (first 500 chars):\n" . substr($routerOutput, 0, 500) . "\n";
    
} catch (Exception $e) {
    echo "Router test failed: " . $e->getMessage() . "\n";
}
?>