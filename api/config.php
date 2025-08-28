<?php
/**
 * Configuration API endpoints
 */

$configType = $pathParts[1] ?? '';

switch ($requestMethod) {
    case 'GET':
        handleGetConfig($configType);
        break;
        
    default:
        sendResponse(['error' => 'Method not allowed'], 405);
}

function handleGetConfig($configType) {
    switch ($configType) {
        case 'appwrite':
            handleAppwriteConfig();
            break;
            
        default:
            sendResponse(['error' => 'Configuration type not found'], 404);
    }
}

function handleAppwriteConfig() {
    try {
        // Load environment variables
        $envFile = __DIR__ . '/../.env.local';
        if (!file_exists($envFile)) {
            $envFile = __DIR__ . '/../.env';
        }
        
        $config = [];
        
        if (file_exists($envFile)) {
            $lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
            foreach ($lines as $line) {
                if (strpos($line, '=') !== false && !str_starts_with(trim($line), '#')) {
                    list($key, $value) = explode('=', $line, 2);
                    $config[trim($key)] = trim($value, '"\'');
                }
            }
        }
        
        // Return Appwrite configuration
        $appwriteConfig = [
            'endpoint' => $config['APPWRITE_ENDPOINT'] ?? 'https://fra.cloud.appwrite.io/v1',
            'projectId' => $config['APPWRITE_PROJECT_ID'] ?? '68ad2f3400028ae2b8e5'
        ];
        
        // Validate configuration
        if (empty($appwriteConfig['endpoint']) || empty($appwriteConfig['projectId'])) {
            throw new Exception('Appwrite configuration is incomplete');
        }
        
        sendResponse($appwriteConfig);
        
    } catch (Exception $e) {
        sendResponse([
            'error' => 'Configuration error',
            'message' => $e->getMessage()
        ], 500);
    }
}
?>