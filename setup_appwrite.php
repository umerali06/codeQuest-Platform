<?php
/**
 * Appwrite Setup Script for CodeQuest Platform
 * Run this script to set up Appwrite collections and seed them with initial data
 */

require_once __DIR__ . '/vendor/autoload.php';

use CodeQuest\Core\AppwriteCollections;
use CodeQuest\Core\AppwriteSeeder;

echo "🚀 CodeQuest Appwrite Setup\n";
echo "==========================\n\n";

try {
    echo "📋 Step 1: Initializing Appwrite collections...\n";
    $collections = new AppwriteCollections();
    
    if ($collections->initializeCollections()) {
        echo "✅ Collections initialized successfully!\n\n";
    } else {
        echo "❌ Failed to initialize collections\n";
        exit(1);
    }
    
    echo "📋 Step 2: Seeding collections with initial data...\n";
    $seeder = new AppwriteSeeder();
    
    if ($seeder->seedAll()) {
        echo "✅ Data seeded successfully!\n\n";
    } else {
        echo "❌ Failed to seed data\n";
        exit(1);
    }
    
    echo "🎉 Appwrite setup completed successfully!\n";
    echo "\nYour CodeQuest platform is now ready with:\n";
    echo "• Games collection (5 games)\n";
    echo "• Modules collection (4 learning modules)\n";
    echo "• Lessons collection (2 lessons)\n";
    echo "• Challenges collection (2 challenges)\n";
    echo "• User progress tracking\n";
    echo "• Game results storage\n";
    echo "• User statistics\n";
    echo "• AI interactions logging\n";
    
} catch (Exception $e) {
    echo "❌ Setup failed: " . $e->getMessage() . "\n";
    echo "Stack trace:\n" . $e->getTraceAsString() . "\n";
    exit(1);
}
