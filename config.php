<?php
/**
 * Configuration file for CodeQuest Platform
 * Copy this to .env and update the values
 */

return [
    'database' => [
        'host' => 'localhost',
        'name' => 'codequest_db',
        'user' => 'root',
        'pass' => '', // Update with your MySQL password
        'charset' => 'utf8mb4'
    ],
    'app' => [
        'env' => 'development',
        'debug' => true,
        'url' => 'http://localhost:8000'
    ]
];
