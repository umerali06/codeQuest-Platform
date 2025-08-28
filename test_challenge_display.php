<?php
echo "Testing Challenge Display System...\n";

// Test 1: Check if challenges API returns test_statements
$challengeUrl = 'http://localhost:8000/api/challenges';
$response = file_get_contents($challengeUrl);

if ($response !== false) {
    echo "✅ Challenges API accessible\n";
    
    $data = json_decode($response, true);
    if (isset($data['data']) && is_array($data['data'])) {
        echo "✅ Found " . count($data['data']) . " challenges\n";
        
        // Check first challenge for test_statements
        $firstChallenge = $data['data'][0];
        if (isset($firstChallenge['test_statements'])) {
            echo "✅ Challenge has test_statements field\n";
            echo "✅ Number of test statements: " . count($firstChallenge['test_statements']) . "\n";
            echo "✅ First test statement: " . $firstChallenge['test_statements'][0] . "\n";
        } else {
            echo "❌ Challenge missing test_statements field\n";
        }
        
        // Check challenge description
        if (isset($firstChallenge['description'])) {
            echo "✅ Challenge has description: " . substr($firstChallenge['description'], 0, 50) . "...\n";
        } else {
            echo "❌ Challenge missing description\n";
        }
        
        // Check specific challenge endpoint
        $challengeTitle = urlencode($firstChallenge['title']);
        $specificUrl = "http://localhost:8000/api/challenges/$challengeTitle";
        
        $specificResponse = file_get_contents($specificUrl);
        if ($specificResponse !== false) {
            echo "✅ Specific challenge endpoint works\n";
            
            $specificData = json_decode($specificResponse, true);
            if (isset($specificData['data']['test_statements'])) {
                echo "✅ Specific challenge has test_statements\n";
            } else {
                echo "❌ Specific challenge missing test_statements\n";
            }
        } else {
            echo "❌ Specific challenge endpoint failed\n";
        }
        
    } else {
        echo "❌ No challenges data found\n";
    }
} else {
    echo "❌ Challenges API not accessible\n";
}

echo "\n🎉 Challenge display test completed!\n";
?>
