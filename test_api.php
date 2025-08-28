<?php
echo "Testing API connection...\n";

$url = 'http://localhost:8000/api/health';
$response = file_get_contents($url);

if ($response !== false) {
    echo "✅ API is accessible\n";
    echo "Response: $response\n";
} else {
    echo "❌ API not accessible\n";
    echo "Error: " . (error_get_last()['message'] ?? 'Unknown error') . "\n";
}
?>
