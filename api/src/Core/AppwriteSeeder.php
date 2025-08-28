<?php

namespace CodeQuest\Core;

use Exception;

/**
 * Appwrite Data Seeder
 * Populates collections with initial data for the CodeQuest platform
 */
class AppwriteSeeder
{
    private $auth;
    private $databaseId = 'codequest';
    
    public function __construct()
    {
        $this->auth = new Auth();
    }
    
    /**
     * Seed all collections with initial data
     */
    public function seedAll()
    {
        try {
            echo "🌱 Starting Appwrite data seeding...\n";
            
            $this->seedGames();
            $this->seedModules();
            $this->seedLessons();
            $this->seedChallenges();
            
            echo "✅ All collections seeded successfully!\n";
            return true;
            
        } catch (Exception $e) {
            echo "❌ Seeding failed: " . $e->getMessage() . "\n";
            return false;
        }
    }
    
    /**
     * Seed games collection
     */
    private function seedGames()
    {
        try {
            echo "🎮 Seeding games collection...\n";
            
            $databases = $this->auth->getDatabasesService();
            $collectionId = 'games';
            
            $games = [
                [
                    'title' => 'Code Typing Speed',
                    'description' => 'Test your coding speed and accuracy by typing code snippets',
                    'category' => 'speed',
                    'difficulty' => 'beginner',
                    'xp_reward' => 25,
                    'icon' => '⌨️',
                    'color' => '#FF9F43',
                    'is_active' => true
                ],
                [
                    'title' => 'Bug Hunter',
                    'description' => 'Find and fix bugs in code snippets to improve your debugging skills',
                    'category' => 'bugfix',
                    'difficulty' => 'intermediate',
                    'xp_reward' => 35,
                    'icon' => '🐛',
                    'color' => '#6C5CE7',
                    'is_active' => true
                ],
                [
                    'title' => 'Memory Match',
                    'description' => 'Match code concepts with their descriptions to test your knowledge',
                    'category' => 'memory',
                    'difficulty' => 'beginner',
                    'xp_reward' => 20,
                    'icon' => '🧠',
                    'color' => '#00B894',
                    'is_active' => true
                ],
                [
                    'title' => 'Code Puzzle',
                    'description' => 'Solve coding puzzles and logic problems to enhance your problem-solving skills',
                    'category' => 'puzzle',
                    'difficulty' => 'intermediate',
                    'xp_reward' => 30,
                    'icon' => '🧩',
                    'color' => '#E17055',
                    'is_active' => true
                ],
                [
                    'title' => 'Algorithm Challenge',
                    'description' => 'Implement algorithms and data structures to solve complex problems',
                    'category' => 'algorithm',
                    'difficulty' => 'advanced',
                    'xp_reward' => 50,
                    'icon' => '⚡',
                    'color' => '#FDCB6E',
                    'is_active' => true
                ]
            ];
            
            foreach ($games as $game) {
                try {
                    $databases->createDocument(
                        $this->databaseId,
                        $collectionId,
                        'unique()',
                        $game
                    );
                } catch (Exception $e) {
                    // Game might already exist
                    echo "⚠️  Game '{$game['title']}' might already exist\n";
                }
            }
            
            echo "✅ Games seeded successfully!\n";
            
        } catch (Exception $e) {
            echo "❌ Failed to seed games: " . $e->getMessage() . "\n";
        }
    }
    
    /**
     * Seed modules collection
     */
    private function seedModules()
    {
        try {
            echo "📚 Seeding modules collection...\n";
            
            $databases = $this->auth->getDatabasesService();
            $collectionId = 'modules';
            
            $modules = [
                [
                    'slug' => 'html-basics',
                    'title' => 'HTML Basics',
                    'description' => 'Learn the fundamentals of HTML markup language',
                    'icon' => '🌐',
                    'color' => '#E74C3C',
                    'difficulty' => 'beginner',
                    'estimated_hours' => 4,
                    'is_active' => true,
                    'sort_order' => 1
                ],
                [
                    'slug' => 'css-styling',
                    'title' => 'CSS Styling',
                    'description' => 'Master CSS for beautiful and responsive web design',
                    'icon' => '🎨',
                    'color' => '#3498DB',
                    'difficulty' => 'beginner',
                    'estimated_hours' => 6,
                    'is_active' => true,
                    'sort_order' => 2
                ],
                [
                    'slug' => 'javascript-fundamentals',
                    'title' => 'JavaScript Fundamentals',
                    'description' => 'Learn JavaScript programming from basics to advanced concepts',
                    'icon' => '⚡',
                    'color' => '#F1C40F',
                    'difficulty' => 'intermediate',
                    'estimated_hours' => 8,
                    'is_active' => true,
                    'sort_order' => 3
                ],
                [
                    'slug' => 'responsive-design',
                    'title' => 'Responsive Design',
                    'description' => 'Create websites that work perfectly on all devices',
                    'icon' => '📱',
                    'color' => '#9B59B6',
                    'difficulty' => 'intermediate',
                    'estimated_hours' => 5,
                    'is_active' => true,
                    'sort_order' => 4
                ]
            ];
            
            foreach ($modules as $module) {
                try {
                    $databases->createDocument(
                        $this->databaseId,
                        $collectionId,
                        'unique()',
                        $module
                    );
                } catch (Exception $e) {
                    echo "⚠️  Module '{$module['title']}' might already exist\n";
                }
            }
            
            echo "✅ Modules seeded successfully!\n";
            
        } catch (Exception $e) {
            echo "❌ Failed to seed modules: " . $e->getMessage() . "\n";
        }
    }
    
    /**
     * Seed lessons collection
     */
    private function seedLessons()
    {
        try {
            echo "📖 Seeding lessons collection...\n";
            
            $databases = $this->auth->getDatabasesService();
            $collectionId = 'lessons';
            
            $lessons = [
                [
                    'module_id' => 'html-basics',
                    'slug' => 'html-introduction',
                    'title' => 'Introduction to HTML',
                    'description' => 'Learn what HTML is and how to create your first web page',
                    'content_md' => "# Introduction to HTML\n\nHTML (HyperText Markup Language) is the standard markup language for creating web pages.\n\n## What you'll learn:\n- Basic HTML structure\n- Common HTML tags\n- Creating your first page\n\n## Example:\n```html\n<!DOCTYPE html>\n<html>\n<head>\n    <title>My First Page</title>\n</head>\n<body>\n    <h1>Hello World!</h1>\n    <p>This is my first HTML page.</p>\n</body>\n</html>\n```",
                    'duration_minutes' => 30,
                    'difficulty' => 'beginner',
                    'is_active' => true,
                    'sort_order' => 1
                ],
                [
                    'module_id' => 'css-styling',
                    'slug' => 'css-basics',
                    'title' => 'CSS Fundamentals',
                    'description' => 'Learn how to style your HTML pages with CSS',
                    'content_md' => "# CSS Fundamentals\n\nCSS (Cascading Style Sheets) is used to style and layout web pages.\n\n## What you'll learn:\n- CSS selectors\n- Colors and typography\n- Layout properties\n\n## Example:\n```css\nbody {\n    font-family: Arial, sans-serif;\n    background-color: #f0f0f0;\n    margin: 0;\n    padding: 20px;\n}\n\nh1 {\n    color: #333;\n    text-align: center;\n}\n```",
                    'duration_minutes' => 45,
                    'difficulty' => 'beginner',
                    'is_active' => true,
                    'sort_order' => 1
                ]
            ];
            
            foreach ($lessons as $lesson) {
                try {
                    $databases->createDocument(
                        $this->databaseId,
                        $collectionId,
                        'unique()',
                        $lesson
                    );
                } catch (Exception $e) {
                    echo "⚠️  Lesson '{$lesson['title']}' might already exist\n";
                }
            }
            
            echo "✅ Lessons seeded successfully!\n";
            
        } catch (Exception $e) {
            echo "❌ Failed to seed lessons: " . $e->getMessage() . "\n";
        }
    }
    
    /**
     * Seed challenges collection
     */
    private function seedChallenges()
    {
        try {
            echo "🎯 Seeding challenges collection...\n";
            
            $databases = $this->auth->getDatabasesService();
            $collectionId = 'challenges';
            
            $challenges = [
                [
                    'lesson_id' => 'html-introduction',
                    'title' => 'Create Your First HTML Page',
                    'description' => 'Create a simple HTML page with a heading and paragraph',
                    'difficulty' => 'beginner',
                    'category' => 'html',
                    'xp_reward' => 10,
                    'time_limit_minutes' => 15,
                    'starter_code_html' => '<!DOCTYPE html>\n<html>\n<head>\n    <title>My First Page</title>\n</head>\n<body>\n    <!-- Your code here -->\n</body>\n</html>',
                    'starter_code_css' => '',
                    'starter_code_js' => '',
                    'solution_code_html' => '<!DOCTYPE html>\n<html>\n<head>\n    <title>My First Page</title>\n</head>\n<body>\n    <h1>Hello World!</h1>\n    <p>This is my first HTML page.</p>\n</body>\n</html>',
                    'solution_code_css' => '',
                    'solution_code_js' => '',
                    'is_active' => true
                ],
                [
                    'lesson_id' => 'css-basics',
                    'title' => 'Style Your HTML',
                    'description' => 'Add CSS styling to make your HTML page look beautiful',
                    'difficulty' => 'beginner',
                    'category' => 'css',
                    'xp_reward' => 15,
                    'time_limit_minutes' => 20,
                    'starter_code_html' => '<!DOCTYPE html>\n<html>\n<head>\n    <title>Styled Page</title>\n</head>\n<body>\n    <h1>Welcome</h1>\n    <p>This is a paragraph.</p>\n</body>\n</html>',
                    'starter_code_css' => '/* Add your CSS here */',
                    'starter_code_js' => '',
                    'solution_code_html' => '<!DOCTYPE html>\n<html>\n<head>\n    <title>Styled Page</title>\n</head>\n<body>\n    <h1>Welcome</h1>\n    <p>This is a paragraph.</p>\n</body>\n</html>',
                    'solution_code_css' => 'body {\n    font-family: Arial, sans-serif;\n    background-color: #f0f0f0;\n    margin: 0;\n    padding: 20px;\n}\n\nh1 {\n    color: #333;\n    text-align: center;\n}\n\np {\n    color: #666;\n    line-height: 1.6;\n}',
                    'solution_code_js' => '',
                    'is_active' => true
                ]
            ];
            
            foreach ($challenges as $challenge) {
                try {
                    $databases->createDocument(
                        $this->databaseId,
                        $collectionId,
                        'unique()',
                        $challenge
                    );
                } catch (Exception $e) {
                    echo "⚠️  Challenge '{$challenge['title']}' might already exist\n";
                }
            }
            
            echo "✅ Challenges seeded successfully!\n";
            
        } catch (Exception $e) {
            echo "❌ Failed to seed challenges: " . $e->getMessage() . "\n";
        }
    }
}
