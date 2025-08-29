<?php
/**
 * Populate learning paths with module associations
 */

try {
    $pdo = new PDO('mysql:host=localhost;dbname=codequest_db', 'root', '');
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    echo "Populating learning path modules...\n";
    
    // Get path IDs
    $pathsStmt = $pdo->query("SELECT id, slug FROM learning_paths");
    $paths = [];
    while ($row = $pathsStmt->fetch(PDO::FETCH_ASSOC)) {
        $paths[$row['slug']] = $row['id'];
    }
    
    // Get module IDs
    $modulesStmt = $pdo->query("SELECT id, slug, category FROM modules");
    $modules = [];
    while ($row = $modulesStmt->fetch(PDO::FETCH_ASSOC)) {
        $modules[$row['slug']] = $row;
    }
    
    // Clear existing associations
    $pdo->exec("DELETE FROM learning_path_modules");
    
    // Define path-module associations
    $associations = [
        'frontend-development' => [
            'html-fundamentals' => 1,
            'css-styling' => 2,
            'javascript-basics' => 3,
            'web-projects' => 4
        ],
        'backend-development' => [
            'javascript-basics' => 1,
            'advanced-javascript' => 2,
            'web-projects' => 3
        ],
        'fullstack-mastery' => [
            'html-fundamentals' => 1,
            'css-styling' => 2,
            'javascript-basics' => 3,
            'advanced-javascript' => 4,
            'web-projects' => 5
        ]
    ];
    
    // Insert associations
    $insertStmt = $pdo->prepare("
        INSERT INTO learning_path_modules (id, path_id, module_id, order_index, is_required) 
        VALUES (?, ?, ?, ?, TRUE)
    ");
    
    foreach ($associations as $pathSlug => $pathModules) {
        if (!isset($paths[$pathSlug])) {
            echo "Warning: Path '$pathSlug' not found\n";
            continue;
        }
        
        $pathId = $paths[$pathSlug];
        
        foreach ($pathModules as $moduleSlug => $order) {
            if (!isset($modules[$moduleSlug])) {
                echo "Warning: Module '$moduleSlug' not found\n";
                continue;
            }
            
            $moduleId = $modules[$moduleSlug]['id'];
            $uuid = sprintf(
                '%04x%04x-%04x-%04x-%04x-%04x%04x%04x',
                mt_rand(0, 0xffff), mt_rand(0, 0xffff),
                mt_rand(0, 0xffff),
                mt_rand(0, 0x0fff) | 0x4000,
                mt_rand(0, 0x3fff) | 0x8000,
                mt_rand(0, 0xffff), mt_rand(0, 0xffff), mt_rand(0, 0xffff)
            );
            
            $insertStmt->execute([$uuid, $pathId, $moduleId, $order]);
            echo "Associated '$moduleSlug' with '$pathSlug' (order: $order)\n";
        }
    }
    
    // Update learning paths with calculated totals
    echo "\nUpdating path statistics...\n";
    
    $updateStmt = $pdo->prepare("
        UPDATE learning_paths lp SET 
            total_modules = (
                SELECT COUNT(*) 
                FROM learning_path_modules lpm 
                WHERE lpm.path_id = lp.id
            ),
            estimated_hours = (
                SELECT COALESCE(CEIL(SUM(l.duration_minutes) / 60), 1)
                FROM learning_path_modules lpm
                JOIN lessons l ON l.module_id = lpm.module_id
                WHERE lpm.path_id = lp.id AND l.is_active = TRUE
            )
        WHERE lp.id = ?
    ");
    
    foreach ($paths as $slug => $id) {
        $updateStmt->execute([$id]);
        echo "Updated statistics for '$slug'\n";
    }
    
    // Show final results
    echo "\nFinal learning path statistics:\n";
    $resultStmt = $pdo->query("
        SELECT slug, title, total_modules, estimated_hours 
        FROM learning_paths 
        ORDER BY order_index
    ");
    
    while ($row = $resultStmt->fetch(PDO::FETCH_ASSOC)) {
        echo "- {$row['title']}: {$row['total_modules']} modules, {$row['estimated_hours']} hours\n";
    }
    
    echo "\nLearning paths populated successfully!\n";
    
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
?>