<?php
/**
 * Authentication API endpoints
 */

$action = $pathParts[1] ?? '';

switch ($requestMethod) {
    case 'POST':
        switch ($action) {
            case 'register':
                handleRegister($pdo);
                break;
                
            case 'login':
                handleLogin($pdo);
                break;
                
            case 'logout':
                handleLogout($pdo);
                break;
                
            default:
                sendResponse(['error' => 'Invalid auth action'], 400);
        }
        break;
        
    default:
        sendResponse(['error' => 'Method not allowed'], 405);
}

function handleRegister($pdo) {
    $data = getRequestBody();
    validateRequired($data, ['username', 'email', 'password']);
    
    $username = trim($data['username']);
    $email = trim($data['email']);
    $password = $data['password'];
    
    // Validate email format
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        sendResponse(['error' => 'Invalid email format'], 400);
    }
    
    // Check if user already exists
    $stmt = $pdo->prepare("SELECT id FROM users WHERE email = ?");
    $stmt->execute([$email]);
    if ($stmt->fetch()) {
        sendResponse(['error' => 'User already exists'], 409);
    }
    
    // Hash password
    $passwordHash = password_hash($password, PASSWORD_DEFAULT);
    
    // Create user
    $userId = generateUuid();
    
    try {
        $pdo->beginTransaction();
        
        // Insert user
        $stmt = $pdo->prepare("
            INSERT INTO users (id, email, name, password_hash) 
            VALUES (?, ?, ?, ?)
        ");
        $stmt->execute([$userId, $email, $username, $passwordHash]);
        
        // Create initial progress
        $stmt = $pdo->prepare("
            INSERT INTO user_progress (id, user_id) 
            VALUES (?, ?)
        ");
        $stmt->execute([generateUuid(), $userId]);
        
        // Create initial statistics
        $stmt = $pdo->prepare("
            INSERT INTO user_statistics (user_id) 
            VALUES (?)
        ");
        $stmt->execute([$userId]);
        
        $pdo->commit();
        
        // Return user data (excluding password)
        $user = [
            'id' => $userId,
            'name' => $username,
            'email' => $email,
            'created_at' => date('c')
        ];
        
        sendResponse([
            'success' => true,
            'message' => 'User registered successfully',
            'data' => $user,
            'token' => $userId // Simple token for development
        ], 201);
        
    } catch (Exception $e) {
        $pdo->rollBack();
        sendResponse(['error' => 'Registration failed'], 500);
    }
}

function handleLogin($pdo) {
    $data = getRequestBody();
    validateRequired($data, ['email', 'password']);
    
    $email = trim($data['email']);
    $password = $data['password'];
    
    // Find user
    $stmt = $pdo->prepare("SELECT * FROM users WHERE email = ?");
    $stmt->execute([$email]);
    $user = $stmt->fetch();
    
    if (!$user || !password_verify($password, $user['password_hash'])) {
        sendResponse(['error' => 'Invalid credentials'], 401);
    }
    
    // Update last login
    $stmt = $pdo->prepare("
        UPDATE user_progress 
        SET last_login = CURRENT_TIMESTAMP 
        WHERE user_id = ?
    ");
    $stmt->execute([$user['id']]);
    
    // Return user data (excluding password)
    unset($user['password_hash']);
    
    sendResponse([
        'success' => true,
        'message' => 'Login successful',
        'data' => $user,
        'token' => $user['id'] // Simple token for development
    ]);
}

function handleLogout($pdo) {
    // For development, logout is just a client-side action
    // In production, this would invalidate JWT tokens
    
    sendResponse([
        'success' => true,
        'message' => 'Logout successful'
    ]);
}
?>