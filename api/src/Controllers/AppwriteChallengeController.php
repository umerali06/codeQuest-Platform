<?php

namespace CodeQuest\Controllers;

use CodeQuest\Core\Auth;
use Exception;
use Appwrite\Query;

class AppwriteChallengeController
{
    private $auth;
    private $databaseId = 'codequest';
    private $collectionId = 'challenges';

    public function __construct()
    {
        try {
            $this->auth = new Auth();
        } catch (Exception $e) {
            error_log('Failed to initialize Auth in AppwriteChallengeController: ' . $e->getMessage());
            $this->auth = null;
        }
    }

    public function getChallenges($params = [])
    {
        try {
            // Set a timeout for Appwrite operations
            set_time_limit(10); // 10 seconds max
            
            // If auth failed to initialize, return sample challenges
            if (!$this->auth) {
                error_log('Auth not initialized, returning sample challenges');
                return [
                    'success' => true,
                    'data' => $this->getSampleChallenges()
                ];
            }
            
            $databases = $this->auth->getDatabasesService();
            
            // Get all challenges from Appwrite
            $challenges = $databases->listDocuments(
                $this->databaseId,
                $this->collectionId,
                [
                    'queries' => [
                        Query::equal('is_active', true)
                    ]
                ]
            );

            // Transform Appwrite documents to match expected format
            $formattedChallenges = [];
            foreach ($challenges['documents'] as $challenge) {
                $formattedChallenges[] = [
                    'id' => $challenge['$id'],
                    'title' => $challenge['title'],
                    'description' => $challenge['description'],
                    'difficulty' => $challenge['difficulty'],
                    'category' => $challenge['category'],
                    'xp_reward' => $challenge['xp_reward'],
                    'time_limit_minutes' => 30, // Default time limit
                    'starter_code_html' => $this->getDefaultStarterCode($challenge['category']),
                    'starter_code_css' => $this->getDefaultStarterCSS($challenge['category']),
                    'starter_code_js' => $this->getDefaultStarterJS($challenge['category']),
                    'lesson_title' => 'Web Development', // Default lesson title
                    'points' => $challenge['xp_reward'] // Use XP as points
                ];
            }

            return [
                'success' => true,
                'data' => $formattedChallenges
            ];

        } catch (Exception $e) {
            error_log('Failed to get challenges from Appwrite: ' . $e->getMessage());
            
            // Return sample challenges as fallback
            return [
                'success' => true,
                'data' => $this->getSampleChallenges()
            ];
        }
    }

    public function getChallenge($params = [])
    {
        try {
            // Set a timeout for Appwrite operations
            set_time_limit(10); // 10 seconds max
            
            $challengeTitle = $params['id'] ?? null;
            
            if (!$challengeTitle) {
                return [
                    'success' => false,
                    'message' => 'Challenge title is required'
                ];
            }
            
            $databases = $this->auth->getDatabasesService();
            
            // Get specific challenge from Appwrite by title
            $challenges = $databases->listDocuments(
                $this->databaseId,
                $this->collectionId,
                [
                    'queries' => [
                        Query::equal('title', $challengeTitle),
                        Query::equal('is_active', true)
                    ]
                ]
            );
            
            if (empty($challenges['documents'])) {
                return [
                    'success' => false,
                    'message' => 'Challenge not found'
                ];
            }
            
            $challenge = $challenges['documents'][0];
            
            // Transform to expected format
            $formattedChallenge = [
                'id' => $challenge['$id'],
                'title' => $challenge['title'],
                'description' => $challenge['description'],
                'difficulty' => $challenge['difficulty'],
                'category' => $challenge['category'],
                'xp_reward' => $challenge['xp_reward'],
                'time_limit_minutes' => 30, // Default time limit
                'starter_code_html' => $this->getDefaultStarterCode($challenge['category']),
                'starter_code_css' => $this->getDefaultStarterCSS($challenge['category']),
                'starter_code_js' => $this->getDefaultStarterJS($challenge['category']),
                'lesson_title' => 'Web Development', // Default lesson title
                'points' => $challenge['xp_reward'], // Use XP as points
                'test_statements' => $challenge['test_statements'] ?? $this->getDefaultTestStatements($challenge['category'])
            ];
            
            return [
                'success' => true,
                'data' => $formattedChallenge
            ];
            
        } catch (Exception $e) {
            error_log('Failed to get challenge from Appwrite: ' . $e->getMessage());
            
            // Return sample challenge as fallback
            return [
                'success' => true,
                'data' => $this->getSampleChallenge($challengeTitle)
            ];
        }
    }

    public function getRandomChallenge()
    {
        try {
            // Set a timeout for Appwrite operations
            set_time_limit(10); // 10 seconds max
            
            $databases = $this->auth->getDatabasesService();
            
            // Get a random active challenge from Appwrite
            $challenges = $databases->listDocuments(
                $this->databaseId,
                $this->collectionId,
                [
                    'queries' => [
                        \Appwrite\Query::equal('is_active', true)
                    ],
                    'limit' => 1
                ]
            );
            
            if (empty($challenges['documents'])) {
                return [
                    'success' => false,
                    'message' => 'No challenges available'
                ];
            }
            
            $challenge = $challenges['documents'][0];
            
            // Transform to expected format
            $formattedChallenge = [
                'id' => $challenge['$id'],
                'title' => $challenge['title'],
                'description' => $challenge['description'],
                'difficulty' => $challenge['difficulty'],
                'category' => $challenge['category'],
                'xp_reward' => $challenge['xp_reward'],
                'time_limit_minutes' => 30, // Default time limit
                'starter_code_html' => $this->getDefaultStarterCode($challenge['category']),
                'starter_code_css' => $this->getDefaultStarterCSS($challenge['category']),
                'starter_code_js' => $this->getDefaultStarterJS($challenge['category']),
                'lesson_title' => 'Web Development', // Default lesson title
                'points' => $challenge['xp_reward'], // Use XP as points
                'test_statements' => $challenge['test_statements'] ?? $this->getDefaultTestStatements($challenge['category'])
            ];
            
            return [
                'success' => true,
                'data' => $formattedChallenge
            ];
            
        } catch (Exception $e) {
            error_log('Failed to get random challenge from Appwrite: ' . $e->getMessage());
            
            // Return sample challenge as fallback
            return [
                'success' => true,
                'data' => $this->getSampleChallenges()[0]
            ];
        }
    }

    // Helper methods to generate default starter code based on category
    private function getDefaultStarterCode($category)
    {
        switch ($category) {
            case 'html':
                return '<!DOCTYPE html>\n<html>\n<head>\n    <title>My Page</title>\n</head>\n<body>\n    <!-- Your HTML code here -->\n</body>\n</html>';
            case 'css':
                return '<!DOCTYPE html>\n<html>\n<head>\n    <title>Styled Page</title>\n</head>\n<body>\n    <h1>Welcome</h1>\n    <p>This is a paragraph.</p>\n</body>\n</html>';
            case 'javascript':
                return '<!DOCTYPE html>\n<html>\n<head>\n    <title>Interactive Page</title>\n</head>\n<body>\n    <h1 id="title">Hello World</h1>\n    <button id="changeBtn">Change Text</button>\n    <script>\n        // Your JavaScript here\n    </script>\n</body>\n</html>';
            default:
                return '<!DOCTYPE html>\n<html>\n<head>\n    <title>Challenge</title>\n</head>\n<body>\n    <!-- Your code here -->\n</body>\n</html>';
        }
    }

    private function getDefaultStarterCSS($category)
    {
        switch ($category) {
            case 'css':
                return '/* Add your CSS here */\nbody {\n    font-family: Arial, sans-serif;\n    margin: 0;\n    padding: 20px;\n}';
            case 'javascript':
                return 'body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }\nbutton { padding: 10px 20px; font-size: 16px; cursor: pointer; }';
            default:
                return '';
        }
    }

    private function getDefaultStarterJS($category)
    {
        switch ($category) {
            case 'javascript':
                return '// Add your JavaScript here\n// Example: Add click event listener to button';
            default:
                return '';
        }
    }

    private function getDefaultTestStatements($category)
    {
        switch ($category) {
            case 'html':
                return [
                    'Your page should have a proper HTML structure with <!DOCTYPE html>',
                    'Include a <head> section with a <title> element',
                    'Add a <body> section with at least one <h1> heading',
                    'Include at least one <p> paragraph element',
                    'Use semantic HTML elements properly'
                ];
            case 'css':
                return [
                    'Apply CSS styling to the <h1> element',
                    'Style the <p> element with proper spacing',
                    'Use at least 3 different CSS properties',
                    'Ensure the page looks visually appealing',
                    'Test that styles are applied correctly'
                ];
            case 'javascript':
                return [
                    'Add JavaScript functionality to make the page interactive',
                    'Include at least one event listener',
                    'Modify the DOM elements dynamically',
                    'Ensure the JavaScript runs without errors',
                    'Test the interactive features'
                ];
            default:
                return [
                    'Complete the challenge requirements',
                    'Ensure your code is valid and functional',
                    'Test all functionality thoroughly',
                    'Follow best practices for the technology used'
                ];
        }
    }

    // Fallback sample challenges
    private function getSampleChallenges()
    {
        return [
            [
                'id' => 'sample-1',
                'title' => 'Create Your First HTML Page',
                'description' => 'Create a simple HTML page with a heading and paragraph using semantic HTML elements.',
                'difficulty' => 'beginner',
                'category' => 'html',
                'xp_reward' => 10,
                'time_limit_minutes' => 15,
                'starter_code_html' => '<!DOCTYPE html>\n<html>\n<head>\n    <title>My First Page</title>\n</head>\n<body>\n    <!-- Your code here -->\n</body>\n</html>',
                'starter_code_css' => '',
                'starter_code_js' => '',
                'lesson_title' => 'Web Development',
                'points' => 10,
                'test_statements' => [
                    'Your page should have a proper HTML structure with <!DOCTYPE html>',
                    'Include a <head> section with a <title> element',
                    'Add a <body> section with at least one <h1> heading',
                    'Include at least one <p> paragraph element',
                    'Use semantic HTML elements properly'
                ]
            ],
            [
                'id' => 'sample-2',
                'title' => 'Style Your HTML',
                'description' => 'Add CSS styling to make your HTML page look beautiful and professional.',
                'difficulty' => 'beginner',
                'category' => 'css',
                'xp_reward' => 15,
                'time_limit_minutes' => 20,
                'starter_code_html' => '<!DOCTYPE html>\n<html>\n<head>\n    <title>Styled Page</title>\n</head>\n<body>\n    <h1>Welcome</h1>\n    <p>This is a paragraph.</p>\n</body>\n</html>',
                'starter_code_css' => '/* Add your CSS here */',
                'starter_code_js' => '',
                'lesson_title' => 'Web Development',
                'points' => 15,
                'test_statements' => [
                    'Apply CSS styling to the <h1> element',
                    'Style the <p> element with proper spacing',
                    'Use at least 3 different CSS properties',
                    'Ensure the page looks visually appealing',
                    'Test that styles are applied correctly'
                ]
            ]
        ];
    }

    private function getSampleChallenge($challengeTitle)
    {
        $sampleChallenges = $this->getSampleChallenges();
        foreach ($sampleChallenges as $challenge) {
            if ($challenge['title'] === $challengeTitle) {
                return $challenge;
            }
        }
        return $sampleChallenges[0]; // Return first if not found
    }
}
