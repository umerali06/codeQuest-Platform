<?php
/**
 * AI Assistant API Endpoint
 * Proxies requests to DeepSeek API with server-side key management
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Only allow POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit();
}

// Load environment variables
require_once __DIR__ . '/../vendor/autoload.php';
$dotenv = Dotenv\Dotenv::createImmutable(__DIR__ . '/..');
$dotenv->load();

// Validate API key exists
if (!isset($_ENV['DEEPSEEK_API_KEY']) || empty($_ENV['DEEPSEEK_API_KEY'])) {
    http_response_code(500);
    echo json_encode(['error' => 'AI service not configured']);
    exit();
}

// Get request data
$input = json_decode(file_get_contents('php://input'), true);

if (!$input || !isset($input['message'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Message is required']);
    exit();
}

// Prepare request to DeepSeek API
$apiUrl = $_ENV['DEEPSEEK_API_URL'] ?? 'https://api.deepseek.com/v1/chat/completions';
$apiKey = $_ENV['DEEPSEEK_API_KEY'];

$requestData = [
    'model' => 'deepseek-chat',
    'messages' => [
        [
            'role' => 'system',
            'content' => 'You are a helpful coding assistant for CodeQuest, an interactive learning platform. Help users with HTML, CSS, and JavaScript questions. Provide clear, educational explanations and code examples.'
        ],
        [
            'role' => 'user',
            'content' => $input['message']
        ]
    ],
    'max_tokens' => 1000,
    'temperature' => 0.7
];

// Add context if provided
if (isset($input['context'])) {
    $contextMessage = "Context: " . $input['context'];
    $requestData['messages'][1]['content'] = $contextMessage . "\n\nQuestion: " . $input['message'];
}

// Make request to DeepSeek API
$ch = curl_init();
curl_setopt_array($ch, [
    CURLOPT_URL => $apiUrl,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_POST => true,
    CURLOPT_POSTFIELDS => json_encode($requestData),
    CURLOPT_HTTPHEADER => [
        'Content-Type: application/json',
        'Authorization: Bearer ' . $apiKey
    ],
    CURLOPT_TIMEOUT => 30
]);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$error = curl_error($ch);
curl_close($ch);

// Handle cURL errors
if ($error) {
    http_response_code(500);
    echo json_encode(['error' => 'AI service unavailable']);
    exit();
}

// Handle API errors
if ($httpCode !== 200) {
    http_response_code(500);
    echo json_encode(['error' => 'AI service error']);
    exit();
}

$responseData = json_decode($response, true);

// Validate response format
if (!$responseData || !isset($responseData['choices'][0]['message']['content'])) {
    http_response_code(500);
    echo json_encode(['error' => 'Invalid AI response']);
    exit();
}

// Return successful response
echo json_encode([
    'success' => true,
    'response' => $responseData['choices'][0]['message']['content'],
    'usage' => $responseData['usage'] ?? null
]);
?>