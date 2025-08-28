<?php
/**
 * Test if API is working with new router
 */

echo "🧪 Testing API with New Router\n";
echo "==============================\n\n";

// Test challenges endpoint
echo "📋 Testing /api/challenges endpoint...\n";
$challengesUrl = 'http://localhost:8000/api/challenges';
$challengesResponse = file_get_contents($challengesUrl);

if ($challengesResponse !== false) {
    echo "✅ Challenges endpoint working!\n";
    $challengesData = json_decode($challengesResponse, true);
    
    if (isset($challengesData['success']) && $challengesData['success']) {
        echo "✅ API returned success response\n";
        if (isset($challengesData['data']) && is_array($challengesData['data'])) {
            echo "✅ Found " . count($challengesData['data']) . " challenges\n";
            foreach ($challengesData['data'] as $challenge) {
                echo "  • {$challenge['title']} ({$challenge['difficulty']} - {$challenge['category']})\n";
            }
        } else {
            echo "⚠️  No challenges data in response\n";
        }
    } else {
        echo "⚠️  API returned error: " . ($challengesData['message'] ?? 'Unknown error') . "\n";
    }
} else {
    echo "❌ Failed to connect to challenges endpoint\n";
}

echo "\n🎉 API test completed!\n";
?>
