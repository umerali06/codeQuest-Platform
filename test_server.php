<?php
echo "Testing server connection...\n";

$url = 'http://localhost:8000/';
$response = file_get_contents($url);

if ($response !== false) {
    echo "✅ Server is accessible\n";
    echo "Response length: " . strlen($response) . " characters\n";
} else {
    echo "❌ Server not accessible\n";
    echo "Error: " . (error_get_last()['message'] ?? 'Unknown error') . "\n";
}
?>
