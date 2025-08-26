<?php

namespace CodeQuest\Controllers;

use CodeQuest\Core\Logger;
use Exception;

class AIController
{
    private $logger;
    private $deepseekApiKey;
    private $deepseekApiUrl = 'https://api.deepseek.com/v1/chat/completions';

    public function __construct()
    {
        $this->logger = new Logger();
        $this->deepseekApiKey = $_ENV['DEEPSEEK_API_KEY'] ?? '';
        
        if (empty($this->deepseekApiKey)) {
            throw new Exception('DeepSeek API key not configured');
        }
    }

    public function generate($params = [])
    {
        try {
            // Get request body
            $input = json_decode(file_get_contents('php://input'), true);
            
            if (!$input) {
                http_response_code(400);
                echo json_encode([
                    'error' => 'Bad Request',
                    'message' => 'Invalid JSON data'
                ]);
                return;
            }

            // Validate required fields
            if (empty($input['prompt'])) {
                http_response_code(400);
                echo json_encode([
                    'error' => 'Bad Request',
                    'message' => 'Prompt is required'
                ]);
                return;
            }

            // Build context-aware prompt
            $context = $input['context'] ?? [];
            $prompt = $this->buildContextualPrompt($input['prompt'], $context);

            // Call DeepSeek API
            $response = $this->callDeepSeekAPI($prompt);

            if (!$response) {
                throw new Exception('Failed to get response from DeepSeek API');
            }

            // Parse and format response
            $formattedResponse = $this->formatAIResponse($response, $context);

            $this->logger->info('AI generation successful', [
                'prompt_length' => strlen($input['prompt']),
                'context_present' => !empty($context)
            ]);

            echo json_encode([
                'success' => true,
                'data' => $formattedResponse
            ]);

        } catch (Exception $e) {
            $this->logger->error('AI generation failed: ' . $e->getMessage());
            
            http_response_code(500);
            echo json_encode([
                'error' => 'Internal Server Error',
                'message' => 'Failed to generate AI response'
            ]);
        }
    }

    private function buildContextualPrompt($userPrompt, $context)
    {
        $systemPrompt = "You are CodeQuest AI, a helpful coding assistant for learning HTML, CSS, and JavaScript. ";
        $systemPrompt .= "Provide clear, concise, and beginner-friendly explanations. Use examples when helpful. ";
        $systemPrompt .= "Keep responses focused on web development topics.";

        $contextualInfo = "";
        
        if (!empty($context)) {
            $contextualInfo = "\n\nContext Information:\n";
            
            if (isset($context['page'])) {
                $contextualInfo .= "- Current page: {$context['page']}\n";
            }
            
            if (isset($context['module'])) {
                $contextualInfo .= "- Module: {$context['module']}\n";
            }
            
            if (isset($context['lesson'])) {
                $contextualInfo .= "- Lesson: {$context['lesson']}\n";
            }
            
            if (isset($context['challenge'])) {
                $contextualInfo .= "- Challenge: {$context['challenge']}\n";
            }
            
            if (isset($context['code']) && !empty($context['code'])) {
                $contextualInfo .= "- Current code:\n```\n{$context['code']}\n```\n";
            }
            
            if (isset($context['lint']) && !empty($context['lint'])) {
                $contextualInfo .= "- Lint issues:\n{$context['lint']}\n";
            }
            
            if (isset($context['failingTests']) && !empty($context['failingTests'])) {
                $contextualInfo .= "- Failing tests: {$context['failingTests']}\n";
            }
        }

        $fullPrompt = $systemPrompt . $contextualInfo . "\n\nUser Question: " . $userPrompt;
        
        return [
            'role' => 'system',
            'content' => $systemPrompt
        ];
    }

    private function callDeepSeekAPI($prompt)
    {
        try {
            $headers = [
                'Content-Type: application/json',
                'Authorization: Bearer ' . $this->deepseekApiKey
            ];

            $data = [
                'model' => 'deepseek-chat',
                'messages' => [
                    [
                        'role' => 'system',
                        'content' => $prompt['content']
                    ],
                    [
                        'role' => 'user',
                        'content' => $prompt['content']
                    ]
                ],
                'temperature' => 0.7,
                'max_tokens' => 1000,
                'stream' => false
            ];

            $ch = curl_init();
            curl_setopt($ch, CURLOPT_URL, $this->deepseekApiUrl);
            curl_setopt($ch, CURLOPT_POST, true);
            curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
            curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_TIMEOUT, 30);
            curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, true);

            $response = curl_exec($ch);
            $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            $error = curl_error($ch);
            curl_close($ch);

            if ($error) {
                throw new Exception('cURL error: ' . $error);
            }

            if ($httpCode !== 200) {
                throw new Exception('DeepSeek API returned HTTP ' . $httpCode);
            }

            $responseData = json_decode($response, true);
            
            if (!$responseData || !isset($responseData['choices'][0]['message']['content'])) {
                throw new Exception('Invalid response from DeepSeek API');
            }

            return $responseData['choices'][0]['message']['content'];

        } catch (Exception $e) {
            $this->logger->error('DeepSeek API call failed: ' . $e->getMessage());
            return null;
        }
    }

    private function formatAIResponse($response, $context)
    {
        $formattedResponse = [
            'message' => $response,
            'code' => null,
            'suggestions' => []
        ];

        // Extract code blocks if present
        if (preg_match_all('/```(\w+)?\n([\s\S]*?)```/', $response, $matches)) {
            $formattedResponse['code'] = $matches[2][0] ?? null;
            
            // Extract language if specified
            if (!empty($matches[1][0])) {
                $formattedResponse['language'] = trim($matches[1][0]);
            }
        }

        // Generate suggestions based on context
        if (!empty($context)) {
            $formattedResponse['suggestions'] = $this->generateSuggestions($context);
        }

        return $formattedResponse;
    }

    private function generateSuggestions($context)
    {
        $suggestions = [];

        if (isset($context['lint']) && !empty($context['lint'])) {
            $suggestions[] = 'Fix linting issues in your code';
        }

        if (isset($context['failingTests']) && !empty($context['failingTests'])) {
            $suggestions[] = 'Review and fix failing test cases';
        }

        if (isset($context['code']) && !empty($context['code'])) {
            $suggestions[] = 'Try the suggested code in the editor';
            $suggestions[] = 'Test your code to ensure it works';
        }

        if (isset($context['lesson'])) {
            $suggestions[] = 'Review the lesson content for guidance';
        }

        return $suggestions;
    }

    public function explainError($params = [])
    {
        try {
            $input = json_decode(file_get_contents('php://input'), true);
            
            if (empty($input['error'])) {
                http_response_code(400);
                echo json_encode([
                    'error' => 'Bad Request',
                    'message' => 'Error message is required'
                ]);
                return;
            }

            $prompt = "Explain this error and how to fix it: " . $input['error'];
            
            if (!empty($input['code'])) {
                $prompt .= "\n\nCode context:\n```\n" . $input['code'] . "\n```";
            }

            $response = $this->callDeepSeekAPI([
                'role' => 'system',
                'content' => $prompt
            ]);

            if (!$response) {
                throw new Exception('Failed to get error explanation from AI');
            }

            echo json_encode([
                'success' => true,
                'data' => [
                    'explanation' => $response,
                    'suggestions' => ['Review the explanation', 'Apply the suggested fix', 'Test your code again']
                ]
            ]);

        } catch (Exception $e) {
            $this->logger->error('Error explanation failed: ' . $e->getMessage());
            
            http_response_code(500);
            echo json_encode([
                'error' => 'Internal Server Error',
                'message' => 'Failed to explain error'
            ]);
        }
    }
}
