<?php
/**
 * Appwrite Configuration API
 * Returns Appwrite configuration for frontend
 */

// Handle the config/appwrite endpoint
if ($pathParts[0] === 'config' && ($pathParts[1] ?? '') === 'appwrite') {
    switch ($requestMethod) {
        case 'GET':
            handleGetAppwriteConfig();
            break;
            
        default:
            sendResponse(['error' => 'Method not allowed'], 405);
    }
} else {
    sendResponse(['error' => 'Invalid config endpoint'], 404);
}

function handleGetAppwriteConfig() {
    try {
        // Load Appwrite configuration from environment
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
?>