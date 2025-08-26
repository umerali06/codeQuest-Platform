-- Seed data for CodeQuest platform
INSERT INTO modules (id, title, description, icon, order_index, created_at, updated_at) VALUES
('html-basics', 'HTML Basics', 'Learn the fundamentals of HTML markup language', '🌐', 1, NOW(), NOW()),
('css-styling', 'CSS Styling', 'Master CSS styling and layout techniques', '🎨', 2, NOW(), NOW()),
('javascript-fundamentals', 'JavaScript Fundamentals', 'Learn JavaScript programming basics', '⚡', 3, NOW(), NOW());

-- Insert sample lessons
INSERT INTO lessons (id, module_id, title, slug, content, order_index, created_at, updated_at) VALUES
('html-intro', 'html-basics', 'Introduction to HTML', 'introduction-to-html', '# Introduction to HTML\n\nHTML is the standard markup language for creating web pages.', 1, NOW(), NOW()),
('css-intro', 'css-styling', 'Introduction to CSS', 'introduction-to-css', '# Introduction to CSS\n\nCSS describes how HTML elements should be displayed.', 1, NOW(), NOW()),
('js-intro', 'javascript-fundamentals', 'Introduction to JavaScript', 'introduction-to-javascript', '# Introduction to JavaScript\n\nJavaScript adds interactivity to web pages.', 1, NOW(), NOW());

-- Insert sample challenges
INSERT INTO challenges (id, lesson_id, title, description, starter_code, test_cases, difficulty, points, created_at, updated_at) VALUES
('challenge-1', 'html-intro', 'Create Your First HTML Page', 'Create a simple HTML page with a heading and paragraph.', '<!DOCTYPE html>\n<html>\n<head>\n    <title>My First Page</title>\n</head>\n<body>\n    <!-- Your code here -->\n</body>\n</html>', '[]', 'easy', 10, NOW(), NOW());

-- Insert sample games
INSERT INTO games (id, title, description, type, difficulty, rules, created_at, updated_at) VALUES
('game-1', 'Code Typing Speed', 'Test your coding speed and accuracy', 'typing', 'medium', '{}', NOW(), NOW()),
('game-2', 'Bug Hunter', 'Find and fix bugs in code snippets', 'debugging', 'hard', '{}', NOW(), NOW());
