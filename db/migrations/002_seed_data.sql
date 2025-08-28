-- Seed data for CodeQuest platform
-- Fixed to match actual table structure

-- Insert sample modules
INSERT INTO modules (id, slug, title, description, icon, color, difficulty, estimated_hours, is_active, sort_order, created_at, updated_at) VALUES
('mod-html-basics', 'html-basics', 'HTML Basics', 'Learn the fundamentals of HTML markup language', '🌐', '#FF6B6B', 'beginner', 2, TRUE, 1, NOW(), NOW()),
('mod-css-styling', 'css-styling', 'CSS Styling', 'Master CSS styling and layout techniques', '🎨', '#4ECDC4', 'beginner', 3, TRUE, 2, NOW(), NOW()),
('mod-js-fundamentals', 'javascript-fundamentals', 'JavaScript Fundamentals', 'Learn JavaScript programming basics', '⚡', '#45B7D1', 'beginner', 4, TRUE, 3, NOW(), NOW());

-- Insert sample lessons
INSERT INTO lessons (id, module_id, slug, title, description, content_md, duration_minutes, difficulty, is_active, sort_order, created_at, updated_at) VALUES
('les-html-intro', 'mod-html-basics', 'introduction-to-html', 'Introduction to HTML', 'Learn the basics of HTML markup', '# Introduction to HTML\n\nHTML is the standard markup language for creating web pages.\n\n## What you will learn:\n- Basic HTML structure\n- Common HTML tags\n- Document structure', 30, 'beginner', TRUE, 1, NOW(), NOW()),
('les-css-intro', 'mod-css-styling', 'introduction-to-css', 'Introduction to CSS', 'Learn how to style HTML elements', '# Introduction to CSS\n\nCSS describes how HTML elements should be displayed.\n\n## What you will learn:\n- CSS selectors\n- Basic properties\n- Color and typography', 45, 'beginner', TRUE, 1, NOW(), NOW()),
('les-js-intro', 'mod-js-fundamentals', 'introduction-to-javascript', 'Introduction to JavaScript', 'Learn JavaScript programming basics', '# Introduction to JavaScript\n\nJavaScript adds interactivity to web pages.\n\n## What you will learn:\n- Variables and data types\n- Functions\n- DOM manipulation', 60, 'beginner', TRUE, 1, NOW(), NOW());

-- Insert sample challenges
INSERT INTO challenges (id, lesson_id, title, description, difficulty, category, xp_reward, starter_code_html, starter_code_css, starter_code_js, is_active, created_at, updated_at) VALUES
('challenge-1', 'les-html-intro', 'Create Your First HTML Page', 'Create a simple HTML page with a heading and paragraph.', 'beginner', 'html', 10, '<!DOCTYPE html>\n<html>\n<head>\n    <title>My First Page</title>\n</head>\n<body>\n    <!-- Your code here -->\n</body>\n</html>', '', '', TRUE, NOW(), NOW()),
('challenge-2', 'les-css-intro', 'Style Your HTML', 'Add CSS styling to make your HTML page look beautiful.', 'beginner', 'css', 15, '<!DOCTYPE html>\n<html>\n<head>\n    <title>Styled Page</title>\n</head>\n<body>\n    <h1>Welcome</h1>\n    <p>This is a paragraph.</p>\n</body>\n</html>', '/* Add your CSS here */', '', TRUE, NOW(), NOW()),
('challenge-3', 'les-js-intro', 'Add Interactivity', 'Use JavaScript to add a button that changes text when clicked.', 'beginner', 'javascript', 20, '<!DOCTYPE html>\n<html>\n<head>\n    <title>Interactive Page</title>\n</head>\n<body>\n    <h1 id="title">Hello World</h1>\n    <button id="changeBtn">Change Text</button>\n</body>\n</html>', '', '// Add your JavaScript here', TRUE, NOW(), NOW());

-- Insert sample games
INSERT INTO games (id, title, description, category, difficulty, xp_reward, icon, color, is_active, created_at, updated_at) VALUES
('game-1', 'Code Typing Speed', 'Test your coding speed and accuracy by typing code snippets', 'speed', 'beginner', 25, '⌨️', '#FF9F43', TRUE, NOW(), NOW()),
('game-2', 'Bug Hunter', 'Find and fix bugs in code snippets to improve your debugging skills', 'bugfix', 'intermediate', 35, '🐛', '#6C5CE7', TRUE, NOW(), NOW()),
('game-3', 'Memory Match', 'Match code concepts with their descriptions to test your knowledge', 'memory', 'beginner', 20, '🧠', '#00B894', TRUE, NOW(), NOW()),
('game-4', 'Code Puzzle', 'Solve coding puzzles and logic problems to enhance your problem-solving skills', 'puzzle', 'intermediate', 30, '🧩', '#E17055', TRUE, NOW(), NOW()),
('game-5', 'Algorithm Master', 'Master algorithms through interactive challenges and sorting games', 'algorithm', 'advanced', 40, '⚡', '#74B9FF', TRUE, NOW(), NOW()),
('game-6', 'Syntax Sprint', 'Race against time to write correct code syntax', 'speed', 'intermediate', 30, '🏃', '#FD79A8', TRUE, NOW(), NOW()),
('game-7', 'Debug Challenge', 'Advanced debugging challenges for experienced developers', 'bugfix', 'advanced', 45, '🔍', '#A29BFE', TRUE, NOW(), NOW()),
('game-8', 'Logic Ladder', 'Climb the logic ladder with increasingly complex coding puzzles', 'puzzle', 'advanced', 35, '🪜', '#FDCB6E', TRUE, NOW(), NOW());

-- Insert sample users for leaderboard
INSERT INTO users (id, appwrite_id, username, email, full_name, created_at, updated_at) VALUES
('user-1', 'appwrite-user-1', 'CodeMaster', 'codemaster@example.com', 'Code Master', NOW(), NOW()),
('user-2', 'appwrite-user-2', 'DevNinja', 'devninja@example.com', 'Dev Ninja', NOW(), NOW()),
('user-3', 'appwrite-user-3', 'PixelWizard', 'pixelwizard@example.com', 'Pixel Wizard', NOW(), NOW()),
('user-4', 'appwrite-user-4', 'SyntaxHero', 'syntaxhero@example.com', 'Syntax Hero', NOW(), NOW()),
('user-5', 'appwrite-user-5', 'BugHunter', 'bughunter@example.com', 'Bug Hunter', NOW(), NOW());

-- Insert sample game results for leaderboard
INSERT INTO game_results (id, user_id, game_id, score, time_taken_seconds, accuracy, xp_earned, created_at) VALUES
('gr-1', 'user-1', 'game-1', 95, 120, 95.5, 25, NOW()),
('gr-2', 'user-1', 'game-2', 88, 180, 88.0, 35, NOW()),
('gr-3', 'user-2', 'game-1', 92, 135, 92.0, 25, NOW()),
('gr-4', 'user-2', 'game-3', 78, 90, 78.0, 20, NOW()),
('gr-5', 'user-3', 'game-2', 85, 200, 85.0, 35, NOW()),
('gr-6', 'user-3', 'game-1', 89, 140, 89.0, 25, NOW()),
('gr-7', 'user-4', 'game-3', 82, 95, 82.0, 20, NOW()),
('gr-8', 'user-4', 'game-1', 87, 150, 87.0, 25, NOW()),
('gr-9', 'user-5', 'game-2', 80, 220, 80.0, 35, NOW()),
('gr-10', 'user-5', 'game-3', 75, 100, 75.0, 20, NOW());
