<?php
// Test DeepSeek API key directly
require_once 'vendor/autoload.php';

// Load environment variables
$dotenv = Dotenv\Dotenv::createImmutable(__DIR__);
$dotenv->load();

$apiKey = $_ENV['DEEPSEEK_API_KEY'] ?? '';

if (empty($apiKey)) {
    echo "ERROR: DEEPSEEK_API_KEY not found in .env file\n";
    exit(1);
}

echo "API Key found, length: " . strlen($apiKey) . "\n";
echo "API Key (first 10 chars): " . substr($apiKey, 0, 10) . "...\n\n";

// Test the API call
$url = 'https://api.deepseek.com/v1/chat/completions';

$data = [
    'model' => 'deepseek-chat',
    'messages' => [
        [
            'role' => 'user',
            'content' => 'Hello, this is a test message.'
        ]
    ],
    'max_tokens' => 100,
    'temperature' => 0.7
];

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $url);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Content-Type: application/json',
    'Authorization: Bearer ' . $apiKey
]);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_TIMEOUT, 30);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, true);

echo "Testing API call...\n";
$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$curlError = curl_error($ch);
curl_close($ch);

echo "HTTP Status Code: " . $httpCode . "\n";

if ($response === false) {
    echo "cURL Error: " . $curlError . "\n";
} else {
    echo "Response: " . $response . "\n";
    
    if ($httpCode === 200) {
        $result = json_decode($response, true);
        if (isset($result['choices'][0]['message']['content'])) {
            echo "\nSUCCESS! API is working.\n";
            echo "Response: " . $result['choices'][0]['message']['content'] . "\n";
        }
    } elseif ($httpCode === 401) {
        echo "\nERROR: Authentication failed. Check your API key.\n";
    } elseif ($httpCode === 429) {
        echo "\nERROR: Rate limit exceeded.\n";
    } else {
        echo "\nERROR: API request failed with status " . $httpCode . "\n";
    }
}
?>
