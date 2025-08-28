<?php
echo "Testing Editor Challenge Loading...\n";

// Test if the editor page can access the challenges API
$challengeUrl = 'http://localhost:8000/api/challenges';
$response = file_get_contents($challengeUrl);

if ($response !== false) {
    echo "✅ Challenges API accessible from editor\n";
    
    $data = json_decode($response, true);
    if (isset($data['data']) && is_array($data['data'])) {
        echo "✅ Found " . count($data['data']) . " challenges\n";
        
        // Test loading a specific challenge
        $firstChallenge = $data['data'][0];
        $challengeTitle = urlencode($firstChallenge['title']);
        $specificUrl = "http://localhost:8000/api/challenges/$challengeTitle";
        
        $specificResponse = file_get_contents($specificUrl);
        if ($specificResponse !== false) {
            echo "✅ Specific challenge loading works\n";
            echo "✅ Challenge: {$firstChallenge['title']}\n";
            echo "✅ Difficulty: {$firstChallenge['difficulty']}\n";
            echo "✅ XP Reward: {$firstChallenge['xp_reward']}\n";
        } else {
            echo "❌ Specific challenge loading failed\n";
        }
    }
} else {
    echo "❌ Challenges API not accessible from editor\n";
}

echo "\n🎉 Editor challenge loading test completed!\n";
?>
