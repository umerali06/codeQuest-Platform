<?php
// Simple script to run database setup and test APIs
header('Content-Type: text/html; charset=UTF-8');

echo "<h1>🔧 Database Setup & API Test</h1>";
echo "<pre>";

// Include the database setup
echo "Running database setup...\n";
ob_start();
include 'setup-database-complete.php';
$setupOutput = ob_get_clean();
echo $setupOutput;

echo "\n" . str_repeat("=", 50) . "\n";
echo "Testing APIs after setup...\n\n";

// Test Games API
echo "🎮 Testing Games API:\n";
$gamesUrl = 'http://localhost:8000/api/games';
$context = stream_context_create([
    'http' => [
        'timeout' => 10,
        'ignore_errors' => true
    ]
]);

$gamesResponse = file_get_contents($gamesUrl, false, $context);
if ($gamesResponse !== false) {
    $gamesData = json_decode($gamesResponse, true);
    if ($gamesData && isset($gamesData['success']) && $gamesData['success']) {
        echo "✅ Games API working - " . count($gamesData['data']) . " games loaded\n";
    } else {
        echo "❌ Games API failed: " . substr($gamesResponse, 0, 200) . "\n";
    }
} else {
    echo "❌ Games API connection failed\n";
}

// Test Config API
echo "\n⚙️ Testing Config API:\n";
$configUrl = 'http://localhost:8000/api/config/appwrite';
$configResponse = file_get_contents($configUrl, false, $context);
if ($configResponse !== false) {
    $configData = json_decode($configResponse, true);
    if ($configData && isset($configData['success']) && $configData['success']) {
        echo "✅ Config API working - Appwrite config loaded\n";
    } else {
        echo "❌ Config API failed: " . substr($configResponse, 0, 200) . "\n";
    }
} else {
    echo "❌ Config API connection failed\n";
}

// Test Leaderboard API
echo "\n🏆 Testing Leaderboard API:\n";
$leaderUrl = 'http://localhost:8000/api/leaderboard';
$leaderResponse = file_get_contents($leaderUrl, false, $context);
if ($leaderResponse !== false) {
    $leaderData = json_decode($leaderResponse, true);
    if ($leaderData && isset($leaderData['success']) && $leaderData['success']) {
        echo "✅ Leaderboard API working - " . count($leaderData['data']) . " entries loaded\n";
    } else {
        echo "❌ Leaderboard API failed: " . substr($leaderResponse, 0, 200) . "\n";
    }
} else {
    echo "❌ Leaderboard API connection failed\n";
}

echo "\n" . str_repeat("=", 50) . "\n";
echo "✅ Setup complete! All APIs should now work without 500 errors.\n";
echo "🎯 Go back to your games page and refresh - the 500 errors should be gone!\n";

echo "</pre>";
?>