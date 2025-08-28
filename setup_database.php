<?php
/**
 * Database Setup Script for CodeQuest Platform
 * Run this script to set up your database and run migrations
 */

// Database configuration - UPDATE THESE VALUES
$config = [
    'host' => 'localhost',
    'dbname' => 'codequest_db',
    'username' => 'root',
    'password' => '' // Update with your MySQL password
];

echo "🚀 CodeQuest Database Setup\n";
echo "==========================\n\n";

try {
    // Create connection without database first
    $pdo = new PDO("mysql:host={$config['host']}", $config['username'], $config['password']);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    echo "✅ Connected to MySQL successfully\n";
    
    // Create database if it doesn't exist
    $pdo->exec("CREATE DATABASE IF NOT EXISTS `{$config['dbname']}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
    echo "✅ Database '{$config['dbname']}' created/verified\n";
    
    // Connect to the specific database
    $pdo = new PDO("mysql:host={$config['host']};dbname={$config['dbname']}", $config['username'], $config['password']);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    // Run migrations
    $migrations = [
        'db/migrations/001_create_tables.sql',
        'db/migrations/002_seed_data.sql'
    ];
    
    foreach ($migrations as $migration) {
        if (file_exists($migration)) {
            echo "📁 Running migration: {$migration}\n";
            $sql = file_get_contents($migration);
            
            // Split SQL by semicolon to execute multiple statements
            $statements = array_filter(array_map('trim', explode(';', $sql)));
            
            foreach ($statements as $statement) {
                if (!empty($statement)) {
                    $pdo->exec($statement);
                }
            }
            echo "✅ Migration completed: {$migration}\n";
        } else {
            echo "❌ Migration file not found: {$migration}\n";
        }
    }
    
    echo "\n🎉 Database setup completed successfully!\n";
    echo "You can now run your CodeQuest platform.\n";
    
} catch (PDOException $e) {
    echo "❌ Database setup failed: " . $e->getMessage() . "\n";
    echo "\n💡 Make sure:\n";
    echo "   - MySQL is running\n";
    echo "   - Database credentials are correct\n";
    echo "   - User has CREATE and INSERT privileges\n";
} catch (Exception $e) {
    echo "❌ Setup failed: " . $e->getMessage() . "\n";
}
