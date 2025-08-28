<?php
/**
 * Migration script to update the database schema for enhanced learn system
 */

require_once 'api/config.php';

try {
    $pdo = new PDO($dsn, $username, $password, $options);
    echo "Connected to database successfully.\n";
    
    echo "Updating database schema for enhanced learn system...\n";
    
    // Check if columns already exist before adding them
    $checkColumns = [
        'modules' => ['icon', 'color', 'difficulty', 'estimated_hours'],
        'lessons' => ['content_md', 'starter_code', 'test_spec_json', 'solution_code', 'difficulty', 'duration_minutes', 'learning_objectives']
    ];
    
    foreach ($checkColumns as $table => $columns) {
        foreach ($columns as $column) {
            // Check if column exists
            $stmt = $pdo->prepare("
                SELECT COUNT(*) 
                FROM INFORMATION_SCHEMA.COLUMNS 
                WHERE TABLE_SCHEMA = DATABASE() 
                AND TABLE_NAME = ? 
                AND COLUMN_NAME = ?
            ");
            $stmt->execute([$table, $column]);
            $exists = $stmt->fetchColumn() > 0;
            
            if (!$exists) {
                switch ($table) {
                    case 'modules':
                        switch ($column) {
                            case 'icon':
                                $pdo->exec("ALTER TABLE modules ADD COLUMN icon VARCHAR(10) DEFAULT '📚' AFTER category");
                                echo "Added icon column to modules table\n";
                                break;
                            case 'color':
                                $pdo->exec("ALTER TABLE modules ADD COLUMN color VARCHAR(7) DEFAULT '#6366f1' AFTER icon");
                                echo "Added color column to modules table\n";
                                break;
                            case 'difficulty':
                                $pdo->exec("ALTER TABLE modules ADD COLUMN difficulty ENUM('beginner', 'intermediate', 'advanced') DEFAULT 'beginner' AFTER color");
                                echo "Added difficulty column to modules table\n";
                                break;
                            case 'estimated_hours':
                                $pdo->exec("ALTER TABLE modules ADD COLUMN estimated_hours INT DEFAULT 1 AFTER difficulty");
                                echo "Added estimated_hours column to modules table\n";
                                break;
                        }
                        break;
                        
                    case 'lessons':
                        switch ($column) {
                            case 'content_md':
                                $pdo->exec("ALTER TABLE lessons ADD COLUMN content_md LONGTEXT AFTER description");
                                echo "Added content_md column to lessons table\n";
                                break;
                            case 'starter_code':
                                $pdo->exec("ALTER TABLE lessons ADD COLUMN starter_code JSON AFTER content_md");
                                echo "Added starter_code column to lessons table\n";
                                break;
                            case 'test_spec_json':
                                $pdo->exec("ALTER TABLE lessons ADD COLUMN test_spec_json JSON AFTER starter_code");
                                echo "Added test_spec_json column to lessons table\n";
                                break;
                            case 'solution_code':
                                $pdo->exec("ALTER TABLE lessons ADD COLUMN solution_code JSON AFTER test_spec_json");
                                echo "Added solution_code column to lessons table\n";
                                break;
                            case 'difficulty':
                                $pdo->exec("ALTER TABLE lessons ADD COLUMN difficulty ENUM('easy', 'medium', 'hard') DEFAULT 'easy' AFTER solution_code");
                                echo "Added difficulty column to lessons table\n";
                                break;
                            case 'duration_minutes':
                                $pdo->exec("ALTER TABLE lessons ADD COLUMN duration_minutes INT DEFAULT 15 AFTER difficulty");
                                echo "Added duration_minutes column to lessons table\n";
                                break;
                            case 'learning_objectives':
                                $pdo->exec("ALTER TABLE lessons ADD COLUMN learning_objectives JSON AFTER prerequisites");
                                echo "Added learning_objectives column to lessons table\n";
                                break;
                        }
                        break;
                }
            } else {
                echo "Column {$column} already exists in {$table} table\n";
            }
        }
    }
    
    // Update existing content column to content_md if needed
    $stmt = $pdo->prepare("
        SELECT COUNT(*) 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'lessons' 
        AND COLUMN_NAME = 'content'
    ");
    $stmt->execute();
    $hasContentColumn = $stmt->fetchColumn() > 0;
    
    if ($hasContentColumn) {
        // Copy content to content_md if content_md is empty
        $pdo->exec("
            UPDATE lessons 
            SET content_md = content 
            WHERE content_md IS NULL AND content IS NOT NULL
        ");
        echo "Migrated content to content_md column\n";
    }
    
    echo "\n✅ Database schema migration completed successfully!\n";
    echo "You can now run the seed-learn-data.php script to populate with sample data.\n";
    
} catch (PDOException $e) {
    echo "❌ Database error: " . $e->getMessage() . "\n";
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
}
?>