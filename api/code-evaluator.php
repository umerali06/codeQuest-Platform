<?php
/**
 * Code Evaluator - Tests user code against expected solutions
 * Provides detailed scoring and feedback
 */

class CodeEvaluator {
    
    /**
     * Evaluate user code against test cases
     */
    public static function evaluateCode($userCode, $testCases, $solutionCode = null) {
        $results = [];
        $totalPoints = 0;
        $earnedPoints = 0;
        
        foreach ($testCases as $testCase) {
            $totalPoints += $testCase['points'] ?? 0;
            $result = self::runTestCase($userCode, $testCase, $solutionCode);
            $results[] = $result;
            
            if ($result['passed']) {
                $earnedPoints += $testCase['points'] ?? 0;
            }
        }
        
        $score = $totalPoints > 0 ? round(($earnedPoints / $totalPoints) * 100) : 0;
        
        return [
            'score' => $score,
            'totalPoints' => $totalPoints,
            'earnedPoints' => $earnedPoints,
            'testResults' => $results,
            'feedback' => self::generateFeedback($results, $score),
            'codeAnalysis' => self::analyzeCode($userCode, $solutionCode)
        ];
    }
    
    /**
     * Run individual test case
     */
    private static function runTestCase($userCode, $testCase, $solutionCode) {
        $result = [
            'test' => $testCase['description'] ?? 'Test',
            'type' => $testCase['type'] ?? 'unknown',
            'passed' => false,
            'message' => '',
            'points' => $testCase['points'] ?? 0,
            'details' => []
        ];
        
        try {
            switch ($testCase['type']) {
                case 'element_exists':
                    $result = self::testElementExists($userCode, $testCase, $result);
                    break;
                    
                case 'element_text':
                    $result = self::testElementText($userCode, $testCase, $result);
                    break;
                    
                case 'element_text_contains':
                    $result = self::testElementTextContains($userCode, $testCase, $result);
                    break;
                    
                case 'css_property':
                    $result = self::testCSSProperty($userCode, $testCase, $result);
                    break;
                    
                case 'javascript_function':
                    $result = self::testJavaScriptFunction($userCode, $testCase, $result);
                    break;
                    
                case 'code_contains':
                    $result = self::testCodeContains($userCode, $testCase, $result);
                    break;
                    
                case 'similarity_check':
                    $result = self::testSimilarity($userCode, $solutionCode, $testCase, $result);
                    break;
                    
                default:
                    $result['message'] = 'Unknown test type: ' . $testCase['type'];
            }
        } catch (Exception $e) {
            $result['message'] = 'Test error: ' . $e->getMessage();
        }
        
        return $result;
    }
    
    /**
     * Test if HTML element exists
     */
    private static function testElementExists($userCode, $testCase, $result) {
        $html = $userCode['html'] ?? '';
        $selector = $testCase['selector'] ?? '';
        
        // Simple HTML parsing for basic elements
        if (preg_match('/<' . preg_quote(str_replace(['#', '.'], '', $selector), '/') . '[^>]*>/i', $html)) {
            $result['passed'] = true;
            $result['message'] = "✅ Element '$selector' found";
        } else {
            $result['passed'] = false;
            $result['message'] = "❌ Element '$selector' not found";
        }
        
        return $result;
    }
    
    /**
     * Test element text content
     */
    private static function testElementText($userCode, $testCase, $result) {
        $html = $userCode['html'] ?? '';
        $selector = $testCase['selector'] ?? '';
        $expected = $testCase['expected'] ?? '';
        
        // Extract text from element (basic implementation)
        $pattern = '/<' . preg_quote($selector, '/') . '[^>]*>(.*?)<\/' . preg_quote($selector, '/') . '>/is';
        
        if (preg_match($pattern, $html, $matches)) {
            $actualText = strip_tags($matches[1]);
            $actualText = trim($actualText);
            
            if (strcasecmp($actualText, $expected) === 0) {
                $result['passed'] = true;
                $result['message'] = "✅ Text matches: '$actualText'";
            } else {
                $result['passed'] = false;
                $result['message'] = "❌ Expected '$expected', got '$actualText'";
            }
        } else {
            $result['passed'] = false;
            $result['message'] = "❌ Element '$selector' not found";
        }
        
        return $result;
    }
    
    /**
     * Test if element text contains expected string
     */
    private static function testElementTextContains($userCode, $testCase, $result) {
        $html = $userCode['html'] ?? '';
        $selector = $testCase['selector'] ?? '';
        $expected = $testCase['expected'] ?? '';
        
        $pattern = '/<' . preg_quote($selector, '/') . '[^>]*>(.*?)<\/' . preg_quote($selector, '/') . '>/is';
        
        if (preg_match($pattern, $html, $matches)) {
            $actualText = strip_tags($matches[1]);
            
            if (stripos($actualText, $expected) !== false) {
                $result['passed'] = true;
                $result['message'] = "✅ Text contains '$expected'";
            } else {
                $result['passed'] = false;
                $result['message'] = "❌ Text should contain '$expected'";
            }
        } else {
            $result['passed'] = false;
            $result['message'] = "❌ Element '$selector' not found";
        }
        
        return $result;
    }
    
    /**
     * Test CSS property values
     */
    private static function testCSSProperty($userCode, $testCase, $result) {
        $css = $userCode['css'] ?? '';
        $selector = $testCase['selector'] ?? '';
        $property = $testCase['property'] ?? '';
        $expected = $testCase['expected'] ?? '';
        
        // Simple CSS parsing
        $pattern = '/' . preg_quote($selector, '/') . '\s*\{([^}]*)\}/is';
        
        if (preg_match($pattern, $css, $matches)) {
            $cssRules = $matches[1];
            $propertyPattern = '/' . preg_quote($property, '/') . '\s*:\s*([^;]+)/i';
            
            if (preg_match($propertyPattern, $cssRules, $propMatches)) {
                $actualValue = trim($propMatches[1]);
                
                if (strcasecmp($actualValue, $expected) === 0) {
                    $result['passed'] = true;
                    $result['message'] = "✅ CSS property correct: $property: $actualValue";
                } else {
                    $result['passed'] = false;
                    $result['message'] = "❌ Expected $property: $expected, got: $actualValue";
                }
            } else {
                $result['passed'] = false;
                $result['message'] = "❌ CSS property '$property' not found";
            }
        } else {
            $result['passed'] = false;
            $result['message'] = "❌ CSS selector '$selector' not found";
        }
        
        return $result;
    }
    
    /**
     * Test JavaScript function
     */
    private static function testJavaScriptFunction($userCode, $testCase, $result) {
        $js = $userCode['js'] ?? '';
        $functionName = $testCase['function'] ?? '';
        
        if (strpos($js, "function $functionName") !== false || 
            strpos($js, "$functionName = function") !== false ||
            strpos($js, "const $functionName") !== false ||
            strpos($js, "let $functionName") !== false) {
            $result['passed'] = true;
            $result['message'] = "✅ Function '$functionName' found";
        } else {
            $result['passed'] = false;
            $result['message'] = "❌ Function '$functionName' not found";
        }
        
        return $result;
    }
    
    /**
     * Test if code contains specific patterns
     */
    private static function testCodeContains($userCode, $testCase, $result) {
        $codeType = $testCase['codeType'] ?? 'html';
        $pattern = $testCase['pattern'] ?? '';
        $code = $userCode[$codeType] ?? '';
        
        if (stripos($code, $pattern) !== false) {
            $result['passed'] = true;
            $result['message'] = "✅ Code contains required pattern";
        } else {
            $result['passed'] = false;
            $result['message'] = "❌ Code should contain: $pattern";
        }
        
        return $result;
    }
    
    /**
     * Test similarity to solution
     */
    private static function testSimilarity($userCode, $solutionCode, $testCase, $result) {
        if (!$solutionCode) {
            $result['message'] = "No solution code available for comparison";
            return $result;
        }
        
        $codeType = $testCase['codeType'] ?? 'html';
        $threshold = $testCase['threshold'] ?? 70;
        
        $userCodeStr = $userCode[$codeType] ?? '';
        $solutionCodeStr = $solutionCode[$codeType] ?? '';
        
        $similarity = self::calculateSimilarity($userCodeStr, $solutionCodeStr);
        
        if ($similarity >= $threshold) {
            $result['passed'] = true;
            $result['message'] = "✅ Code similarity: {$similarity}% (threshold: {$threshold}%)";
        } else {
            $result['passed'] = false;
            $result['message'] = "❌ Code similarity: {$similarity}% (needs: {$threshold}%)";
        }
        
        $result['details']['similarity'] = $similarity;
        
        return $result;
    }
    
    /**
     * Calculate code similarity percentage
     */
    private static function calculateSimilarity($code1, $code2) {
        // Normalize code (remove whitespace, convert to lowercase)
        $normalized1 = preg_replace('/\s+/', '', strtolower($code1));
        $normalized2 = preg_replace('/\s+/', '', strtolower($code2));
        
        if (empty($normalized1) && empty($normalized2)) {
            return 100;
        }
        
        if (empty($normalized1) || empty($normalized2)) {
            return 0;
        }
        
        // Calculate Levenshtein distance
        $distance = levenshtein($normalized1, $normalized2);
        $maxLength = max(strlen($normalized1), strlen($normalized2));
        
        $similarity = (1 - ($distance / $maxLength)) * 100;
        
        return max(0, round($similarity));
    }
    
    /**
     * Generate feedback based on test results
     */
    private static function generateFeedback($results, $score) {
        $feedback = [];
        
        if ($score >= 90) {
            $feedback[] = "🎉 Excellent work! Your code is nearly perfect.";
        } elseif ($score >= 70) {
            $feedback[] = "👍 Good job! Your code works well with minor issues.";
        } elseif ($score >= 50) {
            $feedback[] = "📝 You're on the right track, but there are some issues to fix.";
        } else {
            $feedback[] = "🔧 Keep trying! Review the requirements and try again.";
        }
        
        // Add specific feedback for failed tests
        $failedTests = array_filter($results, function($r) { return !$r['passed']; });
        
        if (count($failedTests) > 0) {
            $feedback[] = "Areas to improve:";
            foreach ($failedTests as $test) {
                $feedback[] = "• " . $test['message'];
            }
        }
        
        return $feedback;
    }
    
    /**
     * Analyze code quality and structure
     */
    private static function analyzeCode($userCode, $solutionCode) {
        $analysis = [
            'codeQuality' => [],
            'suggestions' => [],
            'strengths' => []
        ];
        
        // Analyze HTML
        $html = $userCode['html'] ?? '';
        if (!empty($html)) {
            if (strpos($html, '<!DOCTYPE html>') !== false) {
                $analysis['strengths'][] = "Good use of DOCTYPE declaration";
            }
            
            if (preg_match_all('/<(\w+)/', $html, $matches)) {
                $elementCount = count($matches[1]);
                $analysis['codeQuality'][] = "Uses $elementCount HTML elements";
            }
        }
        
        // Analyze CSS
        $css = $userCode['css'] ?? '';
        if (!empty($css)) {
            $ruleCount = preg_match_all('/\{[^}]*\}/', $css);
            if ($ruleCount > 0) {
                $analysis['codeQuality'][] = "Contains $ruleCount CSS rules";
            }
        }
        
        // Analyze JavaScript
        $js = $userCode['js'] ?? '';
        if (!empty($js)) {
            if (strpos($js, 'function') !== false) {
                $analysis['strengths'][] = "Uses JavaScript functions";
            }
        }
        
        return $analysis;
    }
}
?>