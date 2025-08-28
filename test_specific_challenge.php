<?php
echo "Testing Specific Challenge API...\n";

$challengeTitle = urlencode('Create Your First HTML Page');
$url = "http://localhost:8000/api/challenges/$challengeTitle";
$response = file_get_contents($url);

if ($response !== false) {
    echo "✅ Specific challenge endpoint accessible\n";
    echo "Response: $response\n";
    
    // Try to decode JSON
    $data = json_decode($response, true);
    if (json_last_error() === JSON_ERROR_NONE) {
        echo "✅ Valid JSON response\n";
        if (isset($data['success']) && $data['success']) {
            echo "✅ API returned success\n";
            if (isset($data['data']['title'])) {
                echo "✅ Challenge found: {$data['data']['title']}\n";
                echo "  Description: {$data['data']['description']}\n";
                echo "  Difficulty: {$data['data']['difficulty']}\n";
                echo "  Category: {$data['data']['category']}\n";
            }
        } else {
            echo "⚠️ API returned error: " . ($data['message'] ?? 'Unknown error') . "\n";
        }
    } else {
        echo "❌ Invalid JSON: " . json_last_error_msg() . "\n";
    }
} else {
    echo "❌ Specific challenge endpoint not accessible\n";
    echo "Error: " . (error_get_last()['message'] ?? 'Unknown error') . "\n";
}
?>
