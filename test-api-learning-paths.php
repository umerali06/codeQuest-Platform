<?php
/**
 * Test script for learning paths API
 */

// Simulate the API request
$_SERVER['REQUEST_METHOD'] = 'GET';
$_SERVER['REQUEST_URI'] = '/api/learning-paths';

// Set up the environment
$pathParts = ['learning-paths'];
$requestMethod = 'GET';

// Mock database connection
try {
    $pdo = new PDO('mysql:host=localhost;dbname=codequest_db;charset=utf8mb4', 'root', '', [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false
    ]);
    
    echo "Database connection successful\n";
    
    // Test if learning_paths table exists
    $stmt = $pdo->query("SHOW TABLES LIKE 'learning_paths'");
    if ($stmt->rowCount() > 0) {
        echo "learning_paths table exists\n";
        
        // Check if there are any paths
        $stmt = $pdo->query("SELECT COUNT(*) as count FROM learning_paths");
        $count = $stmt->fetch()['count'];
        echo "Found {$count} learning paths in database\n";
        
        if ($count == 0) {
            echo "No learning paths found. Let's insert some test data...\n";
            
            // Insert test data
            $insertSql = "
                INSERT INTO learning_paths (id, slug, title, description, icon, color, estimated_hours, total_modules, difficulty, order_index) VALUES
                (UUID(), 'frontend-development', 'Frontend Development', 'Master HTML, CSS, JavaScript and modern frameworks to build beautiful, interactive websites.', 'fas fa-paint-brush', '#f59e0b', 120, 8, 'beginner', 1),
                (UUID(), 'backend-development', 'Backend Development', 'Learn server-side programming, databases, APIs and authentication to power your applications.', 'fas fa-server', '#10b981', 90, 6, 'intermediate', 2),
                (UUID(), 'fullstack-mastery', 'Full Stack Mastery', 'Combine frontend and backend skills to build complete, production-ready web applications.', 'fas fa-code', '#8b5cf6', 200, 12, 'advanced', 3)
            ";
            
            $pdo->exec($insertSql);
            echo "Test data inserted successfully\n";
        }
        
    } else {
        echo "learning_paths table does not exist. Running migration...\n";
        
        // Run the migration
        $migrationSql = file_get_contents('migrate-learning-paths.sql');
        $pdo->exec($migrationSql);
        echo "Migration completed\n";
    }
    
    // Now test the API functions
    echo "\nTesting API functions...\n";
    
    // Include utility functions
    function sendResponse($data, $statusCode = 200) {
        echo "Response (HTTP {$statusCode}): " . json_encode($data, JSON_PRETTY_PRINT) . "\n";
    }
    
    function getRequestBody() {
        return [];
    }
    
    // Include the API file
    include 'api/learning-paths.php';
    
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
?>