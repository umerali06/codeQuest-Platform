<?php
// Minimal test server
echo "Starting minimal server test...\n";

// Test basic functionality
$test = "Hello World";
echo "Test variable: $test\n";

// Test file operations
$currentDir = __DIR__;
echo "Current directory: $currentDir\n";

// Test if we can read files
if (file_exists('router.php')) {
    echo "✅ router.php exists\n";
} else {
    echo "❌ router.php not found\n";
}

if (file_exists('api/index.php')) {
    echo "✅ api/index.php exists\n";
} else {
    echo "❌ api/index.php not found\n";
}

echo "Minimal server test completed.\n";
?>
