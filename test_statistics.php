<?php
// Test script to verify the statistics API endpoint
echo "Testing Statistics API...\n";

// Test the health endpoint first
$healthUrl = 'http://localhost:8000/api/health';
echo "Testing health endpoint: $healthUrl\n";

$healthResponse = file_get_contents($healthUrl);
if ($healthResponse !== false) {
    echo "✓ Health endpoint working\n";
    echo "Response: " . $healthResponse . "\n\n";
} else {
    echo "✗ Health endpoint failed\n\n";
}

// Test the statistics endpoint
$statsUrl = 'http://localhost:8000/api/statistics';
echo "Testing statistics endpoint: $statsUrl\n";

$statsResponse = file_get_contents($statsUrl);
if ($statsResponse !== false) {
    echo "✓ Statistics endpoint working\n";
    echo "Response: " . $statsResponse . "\n\n";
    
    // Try to decode JSON
    $statsData = json_decode($statsResponse, true);
    if (json_last_error() === JSON_ERROR_NONE) {
        echo "✓ JSON response is valid\n";
        echo "Statistics data:\n";
        foreach ($statsData as $key => $value) {
            echo "  $key: $value\n";
        }
    } else {
        echo "✗ JSON response is invalid: " . json_last_error_msg() . "\n";
    }
} else {
    echo "✗ Statistics endpoint failed\n";
    echo "Error: " . error_get_last()['message'] . "\n";
}
?>
