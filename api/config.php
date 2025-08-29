<?php
/**
 * Configuration API Endpoint
 * Handles configuration requests for the frontend
 */

// Enable error reporting for debugging
error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);

// Set JSON content type
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Get request path
$requestUri = $_SERVER['REQUEST_URI'];
$pathParts = explode('/', trim(parse_url($requestUri, PHP_URL_PATH), '/'));

// Remove 'api' from path parts if present
if ($pathParts[0] === 'api') {
    array_shift($pathParts);
}

// Handle different config endpoints
if ($pathParts[0] === 'config') {
    if (isset($pathParts[1]) && $pathParts[1] === 'appwrite') {
        handleAppwriteConfig();
    } else {
        handleGeneralConfig();
    }
} else {
    sendResponse(['error' => 'Invalid config endpoint'], 404);
}

function handleAppwriteConfig() {
    try {
        // Load environment variables if available
        if (file_exists(__DIR__ . '/../.env')) {
            $envContent = file_get_contents(__DIR__ . '/../.env');
            $envLines = explode("\n", $envContent);
            foreach ($envLines as $line) {
                if (strpos($line, '=') !== false && !str_starts_with($line, '#')) {
                    list($key, $value) = explode('=', $line, 2);
                    $_ENV[trim($key)] = trim($value);
                }
            }
        }

        $config = [
            'endpoint' => $_ENV['APPWRITE_ENDPOINT'] ?? 'https://fra.cloud.appwrite.io/v1',
            'projectId' => $_ENV['APPWRITE_PROJECT_ID'] ?? '68ad2f3400028ae2b8e5'
        ];

        sendResponse([
            'success' => true,
            'config' => $config
        ]);

    } catch (Exception $e) {
        error_log("Appwrite config error: " . $e->getMessage());
        
        // Fallback configuration
        sendResponse([
            'success' => true,
            'config' => [
                'endpoint' => 'https://fra.cloud.appwrite.io/v1',
                'projectId' => '68ad2f3400028ae2b8e5'
            ]
        ]);
    }
}

function handleGeneralConfig() {
    sendResponse([
        'success' => true,
        'config' => [
            'apiBase' => 'http://localhost:8000/api',
            'version' => '1.0.0',
            'features' => [
                'authentication' => true,
                'challenges' => true,
                'games' => true,
                'leaderboard' => true,
                'ai_assistant' => true
            ]
        ]
    ]);
}

function sendResponse($data, $statusCode = 200) {
    http_response_code($statusCode);
    echo json_encode($data, JSON_PRETTY_PRINT);
    exit;
}
?>