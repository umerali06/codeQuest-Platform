<?php
echo "Testing Challenges API...\n";

$url = 'http://localhost:8000/api/challenges';
$response = file_get_contents($url);

if ($response !== false) {
    echo "✅ Challenges endpoint accessible\n";
    echo "Response: $response\n";
    
    // Try to decode JSON
    $data = json_decode($response, true);
    if (json_last_error() === JSON_ERROR_NONE) {
        echo "✅ Valid JSON response\n";
        if (isset($data['success']) && $data['success']) {
            echo "✅ API returned success\n";
            if (isset($data['data']) && is_array($data['data'])) {
                echo "✅ Found " . count($data['data']) . " challenges\n";
                foreach ($data['data'] as $challenge) {
                    echo "  • {$challenge['title']} ({$challenge['difficulty']})\n";
                }
            }
        } else {
            echo "⚠️ API returned error: " . ($data['message'] ?? 'Unknown error') . "\n";
        }
    } else {
        echo "❌ Invalid JSON: " . json_last_error_msg() . "\n";
    }
} else {
    echo "❌ Challenges endpoint not accessible\n";
    echo "Error: " . (error_get_last()['message'] ?? 'Unknown error') . "\n";
}
?>
