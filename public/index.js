// CodeQuest Index JavaScript
// Handles dynamic content loading and statistics

class IndexPage {
    constructor() {
        this.apiBase = '/api';
        this.init();
    }

    async init() {
        try {
            await this.loadStatistics();
            this.setupEventListeners();
            this.setupAI();
        } catch (error) {
            console.error('Failed to initialize index page:', error);
            // Fallback to default statistics if API fails
            this.showDefaultStatistics();
        }
    }

    async loadStatistics() {
        try {
            // Load platform statistics from backend
            const response = await fetch(`${this.apiBase}/statistics`);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const result = await response.json();
            // API returns statistics directly, not wrapped in success/data
            if (result && typeof result === 'object') {
                this.updateStatistics(result);
            } else {
                throw new Error('Invalid statistics data received');
            }
        } catch (error) {
            console.error('Error loading statistics:', error);
            // Use default statistics as fallback
            this.showDefaultStatistics();
        }
    }

    updateStatistics(stats) {
        // Update hero section statistics
        const activeLearners = document.getElementById('activeLearners');
        const lessons = document.getElementById('totalLessons');
        const challenges = document.getElementById('totalChallenges');

        // Map API fields to frontend elements
        if (activeLearners) activeLearners.textContent = this.formatNumber(stats.total_users || 0);
        if (lessons) lessons.textContent = this.formatNumber(stats.total_lessons || 0);
        if (challenges) challenges.textContent = this.formatNumber(stats.total_challenges || 0);

        // Update learning path statistics if they exist
        this.updateLearningPathStats(stats);
    }

    updateLearningPathStats(stats) {
        // Update HTML path stats
        const htmlLessons = document.getElementById('htmlLessons');
        const htmlHours = document.getElementById('htmlHours');
        if (htmlLessons && htmlHours && stats.html_lessons) {
            htmlLessons.textContent = stats.html_lessons;
            htmlHours.textContent = stats.html_hours || Math.ceil(stats.html_lessons * 0.2);
        }

        // Update CSS path stats
        const cssLessons = document.getElementById('cssLessons');
        const cssHours = document.getElementById('cssHours');
        if (cssLessons && cssHours && stats.css_lessons) {
            cssLessons.textContent = stats.css_lessons;
            cssHours.textContent = stats.css_hours || Math.ceil(stats.css_lessons * 0.2);
        }

        // Update JavaScript path stats
        const jsLessons = document.getElementById('jsLessons');
        const jsHours = document.getElementById('jsHours');
        if (jsLessons && jsHours && stats.js_lessons) {
            jsLessons.textContent = stats.js_lessons;
            jsHours.textContent = stats.js_hours || Math.ceil(stats.js_lessons * 0.2);
        }
    }

    showDefaultStatistics() {
        // Show loading state instead of hardcoded data
        const activeLearners = document.getElementById('activeLearners');
        const lessons = document.getElementById('totalLessons');
        const challenges = document.getElementById('totalChallenges');

        if (activeLearners) activeLearners.textContent = 'Loading...';
        if (lessons) lessons.textContent = 'Loading...';
        if (challenges) challenges.textContent = 'Loading...';
        
        console.warn('Statistics API failed - showing loading state instead of hardcoded data');
    }

    formatNumber(num) {
        if (num >= 1000000) {
            return (num / 1000000).toFixed(1) + 'M+';
        } else if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'K+';
        }
        return num.toString();
    }

    setupEventListeners() {
        // Navigation toggle for mobile
        const hamburger = document.getElementById('hamburger');
        const navLinks = document.getElementById('navLinks');
        
        if (hamburger && navLinks) {
            // Toggle mobile menu
            hamburger.addEventListener('click', (e) => {
                e.stopPropagation();
                navLinks.classList.toggle('active');
                hamburger.classList.toggle('active');
                document.body.classList.toggle('nav-open');
            });

            // Close menu when clicking on a nav link
            navLinks.querySelectorAll('.nav-link').forEach(link => {
                link.addEventListener('click', () => {
                    navLinks.classList.remove('active');
                    hamburger.classList.remove('active');
                    document.body.classList.remove('nav-open');
                });
            });

            // Close menu when clicking outside
            document.addEventListener('click', (e) => {
                if (!hamburger.contains(e.target) && !navLinks.contains(e.target)) {
                    navLinks.classList.remove('active');
                    hamburger.classList.remove('active');
                    document.body.classList.remove('nav-open');
                }
            });

            // Close menu on escape key
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') {
                    navLinks.classList.remove('active');
                    hamburger.classList.remove('active');
                    document.body.classList.remove('nav-open');
                }
            });

            // Close menu on window resize (if switching to desktop)
            window.addEventListener('resize', () => {
                if (window.innerWidth > 1000) {
                    navLinks.classList.remove('active');
                    hamburger.classList.remove('active');
                    document.body.classList.remove('nav-open');
                }
            });
        }

        // Smooth scrolling for anchor links
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                e.preventDefault();
                const target = document.querySelector(this.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            });
        });
    }

    setupAI() {
        // Create AI assistant widget
        this.createAIAssistant();
        this.enhanceWithAI();
    }

    createAIAssistant() {
        // Check if AI widget already exists
        if (document.getElementById('ai-assistant')) return;

        const aiWidget = document.createElement('div');
        aiWidget.id = 'ai-assistant';
        aiWidget.className = 'ai-assistant';
        aiWidget.innerHTML = `
            <div class="ai-toggle-btn" id="ai-toggle-btn" onclick="indexPage.toggleAI()">
                <span class="ai-icon">🤖</span>
                <span class="ai-label">AI Assistant</span>
            </div>
            
            <div class="ai-panel" id="ai-panel">
            <div class="ai-header">
                    <div class="ai-header-content">
                        <span class="ai-title">🤖 AI Coding Assistant</span>
                        <span class="ai-subtitle">Ask me anything about web development!</span>
                    </div>
                <div class="ai-controls">
                        <button class="ai-minimize" onclick="indexPage.toggleAI()" title="Minimize">−</button>
                        <button class="ai-close" onclick="indexPage.closeAI()" title="Close">×</button>
                </div>
            </div>
                
            <div class="ai-content" id="ai-content">
                    <div class="ai-messages" id="ai-messages">
                        <div class="ai-message ai-bot-message">
                            <div class="ai-avatar">🤖</div>
                            <div class="ai-text">
                                <p>Hello! I'm your AI coding assistant. I can help you with:</p>
                                <ul>
                                    <li>HTML, CSS & JavaScript questions</li>
                                    <li>Code debugging and optimization</li>
                                    <li>Web development best practices</li>
                                    <li>Project structure advice</li>
                                </ul>
                                <p>What would you like to learn today?</p>
                            </div>
                        </div>
                    </div>
                    
                    <div class="ai-input-container">
                        <div class="ai-input-wrapper">
                            <textarea id="ai-input" placeholder="Ask me about HTML, CSS, JavaScript..." rows="3"></textarea>
                            <button id="ai-send" onclick="indexPage.sendAIRequest()" title="Send message">
                                <span class="send-icon">📤</span>
                            </button>
                        </div>
                </div>
                </div>
            </div>
        `;

        document.body.appendChild(aiWidget);

        // Add styles
        this.addAIStyles();
        
        // Setup input handling
        this.setupAIInput();
    }

    addAIStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .ai-assistant {
                position: fixed;
                bottom: 20px;
                right: 20px;
                z-index: 1000;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            }

            /* Floating Toggle Button */
            .ai-toggle-btn {
                display: flex;
                align-items: center;
                gap: 12px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 16px 20px;
                border-radius: 50px;
                cursor: pointer;
                box-shadow: 0 8px 25px rgba(102, 126, 234, 0.4);
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                border: none;
                font-weight: 600;
                font-size: 14px;
                backdrop-filter: blur(10px);
            }

            .ai-toggle-btn:hover {
                transform: translateY(-2px);
                box-shadow: 0 12px 35px rgba(102, 126, 234, 0.5);
            }

            .ai-toggle-btn-active {
                background: linear-gradient(135deg, #764ba2 0%, #667eea 100%);
                transform: scale(1.05);
            }

            .ai-icon {
                font-size: 20px;
                filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
            }

            .ai-label {
                white-space: nowrap;
            }

            /* AI Panel */
            .ai-panel {
                position: absolute;
                bottom: 80px;
                right: 0;
                width: 380px;
                background: linear-gradient(145deg, #1a1a2e 0%, #16213e 100%);
                border-radius: 20px;
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4);
                border: 1px solid rgba(255, 255, 255, 0.1);
                backdrop-filter: blur(20px);
                opacity: 0;
                visibility: hidden;
                transform: translateY(20px) scale(0.95);
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                overflow: hidden;
            }

            .ai-panel-open {
                opacity: 1;
                visibility: visible;
                transform: translateY(0) scale(1);
            }

            /* Panel Header */
            .ai-header {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                padding: 20px;
                color: white;
                position: relative;
            }

            .ai-header::before {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: linear-gradient(45deg, transparent 30%, rgba(255, 255, 255, 0.1) 50%, transparent 70%);
                animation: shimmer 3s infinite;
            }

            @keyframes shimmer {
                0% { transform: translateX(-100%); }
                100% { transform: translateX(100%); }
            }

            .ai-header-content {
                position: relative;
                z-index: 1;
            }

            .ai-title {
                font-size: 18px;
                font-weight: 700;
                margin-bottom: 4px;
                display: block;
            }

            .ai-subtitle {
                font-size: 13px;
                opacity: 0.9;
                font-weight: 400;
            }

            .ai-controls {
                position: absolute;
                top: 20px;
                right: 20px;
                display: flex;
                gap: 8px;
                z-index: 2;
            }

            .ai-controls button {
                background: rgba(255, 255, 255, 0.2);
                border: none;
                color: white;
                width: 32px;
                height: 32px;
                border-radius: 50%;
                cursor: pointer;
                font-size: 16px;
                font-weight: bold;
                transition: all 0.2s;
                display: flex;
                align-items: center;
                justify-content: center;
            }

            .ai-controls button:hover {
                background: rgba(255, 255, 255, 0.3);
                transform: scale(1.1);
            }

            /* Messages Container */
            .ai-content {
                padding: 0;
                height: 400px;
                display: flex;
                flex-direction: column;
            }

            .ai-messages {
                flex: 1;
                padding: 20px;
                overflow-y: auto;
                scrollbar-width: thin;
                scrollbar-color: rgba(255, 255, 255, 0.2) transparent;
            }

            .ai-messages::-webkit-scrollbar {
                width: 6px;
            }

            .ai-messages::-webkit-scrollbar-track {
                background: transparent;
            }

            .ai-messages::-webkit-scrollbar-thumb {
                background: rgba(255, 255, 255, 0.2);
                border-radius: 3px;
            }

            /* Message Styles */
            .ai-message {
                display: flex;
                gap: 12px;
                margin-bottom: 20px;
                animation: messageSlideIn 0.3s ease-out;
            }

            @keyframes messageSlideIn {
                from {
                    opacity: 0;
                    transform: translateY(10px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }

            .ai-avatar {
                width: 36px;
                height: 36px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 18px;
                flex-shrink: 0;
            }

            .ai-bot-message .ai-avatar {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
            }

            .ai-user-message .ai-avatar {
                background: linear-gradient(135deg, #4ecdc4 0%, #44a08d 100%);
                color: white;
            }

            .ai-error-message .ai-avatar {
                background: linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%);
                color: white;
            }

            .ai-text {
                flex: 1;
                background: rgba(255, 255, 255, 0.05);
                padding: 16px;
                border-radius: 16px;
                border: 1px solid rgba(255, 255, 255, 0.1);
                backdrop-filter: blur(10px);
            }

            .ai-text p {
                margin: 0 0 12px 0;
                line-height: 1.6;
                color: rgba(255, 255, 255, 0.9);
            }

            .ai-text p:last-child {
                margin-bottom: 0;
            }

            .ai-text ul {
                margin: 8px 0;
                padding-left: 20px;
            }

            .ai-text li {
                margin-bottom: 6px;
                color: rgba(255, 255, 255, 0.8);
            }

            /* Markdown formatting styles */
            .ai-text strong {
                font-weight: 700;
                color: rgba(255, 255, 255, 1);
            }

            .ai-text em {
                font-style: italic;
                color: rgba(255, 255, 255, 0.95);
            }

            .ai-text code {
                background: rgba(255, 255, 255, 0.1);
                padding: 2px 6px;
                border-radius: 4px;
                font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', 'Consolas', monospace;
                font-size: 0.9em;
                color: #4ecdc4;
                border: 1px solid rgba(255, 255, 255, 0.2);
            }

            .ai-text pre {
                background: rgba(0, 0, 0, 0.3);
                border-radius: 8px;
                padding: 12px;
                margin: 8px 0;
                border: 1px solid rgba(255, 255, 255, 0.1);
                overflow-x: auto;
            }

            .ai-text pre code {
                background: none;
                padding: 0;
                border: none;
                color: #e6e6e6;
                font-size: 0.85em;
            }

            /* Code Blocks */
            .ai-code {
                background: rgba(0, 0, 0, 0.3);
                border-radius: 12px;
                padding: 16px;
                margin: 12px 0;
                border: 1px solid rgba(255, 255, 255, 0.1);
                overflow-x: auto;
            }

            .ai-code pre {
                margin: 0;
                color: #e6e6e6;
                font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', 'Consolas', monospace;
                font-size: 13px;
                line-height: 1.5;
                white-space: pre-wrap;
            }

            /* Input Container */
            .ai-input-container {
                padding: 20px;
                border-top: 1px solid rgba(255, 255, 255, 0.1);
                background: rgba(0, 0, 0, 0.1);
            }

            .ai-input-wrapper {
                display: flex;
                gap: 12px;
                align-items: flex-end;
            }

            .ai-input-wrapper textarea {
                flex: 1;
                background: rgba(255, 255, 255, 0.08);
                border: 1px solid rgba(255, 255, 255, 0.2);
                border-radius: 16px;
                padding: 14px 16px;
                color: white;
                resize: none;
                min-height: 48px;
                max-height: 120px;
                font-family: inherit;
                font-size: 14px;
                line-height: 1.4;
                transition: all 0.2s;
            }

            .ai-input-wrapper textarea:focus {
                outline: none;
                border-color: #667eea;
                background: rgba(255, 255, 255, 0.12);
                box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.2);
            }

            .ai-input-wrapper textarea::placeholder {
                color: rgba(255, 255, 255, 0.5);
            }

            #ai-send {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                border: none;
                color: white;
                width: 48px;
                height: 48px;
                border-radius: 50%;
                cursor: pointer;
                transition: all 0.2s;
                display: flex;
                align-items: center;
                justify-content: center;
                flex-shrink: 0;
            }

            #ai-send:hover {
                transform: scale(1.05);
                box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
            }

            .send-icon {
                font-size: 18px;
            }

            /* Typing Indicator */
            .ai-typing-indicator {
                display: flex;
                gap: 12px;
                margin-bottom: 20px;
                animation: messageSlideIn 0.3s ease-out;
            }

            .typing-dots {
                display: flex;
                gap: 6px;
                align-items: center;
                padding: 16px;
                justify-content: center;
            }

            .typing-dot {
                width: 8px;
                height: 8px;
                border-radius: 50%;
                background: #667eea;
                animation: typing 1.4s infinite ease-in-out;
            }

            .typing-dot:nth-child(1) { animation-delay: -0.32s; }
            .typing-dot:nth-child(2) { animation-delay: -0.16s; }

            @keyframes typing {
                0%, 80%, 100% {
                    transform: scale(0.8);
                    opacity: 0.5;
                }
                40% {
                    transform: scale(1);
                    opacity: 1;
                }
            }

            /* Responsive Design */
            @media (max-width: 768px) {
                .ai-assistant {
                    bottom: 10px;
                    right: 10px;
                    left: 10px;
                }

                .ai-toggle-btn {
                    width: 100%;
                    justify-content: center;
                    border-radius: 25px;
                }

                .ai-panel {
                    width: 100%;
                    right: 0;
                    bottom: 70px;
                    border-radius: 20px 20px 0 0;
                }

                .ai-content {
                    height: 350px;
                }
            }

            /* Dark mode adjustments */
            @media (prefers-color-scheme: dark) {
                .ai-panel {
                    background: linear-gradient(145deg, #0f0f23 0%, #1a1a2e 100%);
                }
            }
        `;

        document.head.appendChild(style);
    }

    toggleAI() {
        const aiPanel = document.getElementById('ai-panel');
        const toggleBtn = document.getElementById('ai-toggle-btn');
        const minimizeBtn = document.querySelector('.ai-minimize');
        
        if (aiPanel.classList.contains('ai-panel-open')) {
            // Close panel
            aiPanel.classList.remove('ai-panel-open');
            toggleBtn.classList.remove('ai-toggle-btn-active');
            minimizeBtn.textContent = '+';
            minimizeBtn.title = 'Maximize';
        } else {
            // Open panel
            aiPanel.classList.add('ai-panel-open');
            toggleBtn.classList.add('ai-toggle-btn-active');
            minimizeBtn.textContent = '−';
            minimizeBtn.title = 'Minimize';
            
            // Focus on input
            setTimeout(() => {
                const input = document.getElementById('ai-input');
                if (input) input.focus();
            }, 300);
        }
    }

    closeAI() {
        const aiPanel = document.getElementById('ai-panel');
        const toggleBtn = document.getElementById('ai-toggle-btn');
        
        if (aiPanel) {
            aiPanel.classList.remove('ai-panel-open');
            toggleBtn.classList.remove('ai-toggle-btn-active');
        }
    }

    async sendAIRequest() {
        const input = document.getElementById('ai-input');
        const message = input.value.trim();
        
        if (!message) return;

        // Add user message to chat
        this.addUserMessage(message);
        input.value = '';

        // Show typing indicator
        this.showTypingIndicator();

        try {
            console.log('Sending AI request for:', message);
            console.log('API endpoint:', `${this.apiBase}/ai`);
            
            const context = {
                page: 'index',
                availableTopics: ['HTML', 'CSS', 'JavaScript', 'Web Development', 'Coding']
            };

            const response = await fetch(`${this.apiBase}/ai`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    prompt: message
                })
            });

            console.log('Response status:', response.status);
            console.log('Response headers:', response.headers);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const result = await response.json();
            console.log('Parsed response:', result);
            
            if (result.response) {
                console.log('Displaying AI response:', result.response);
                this.displayAIResponse({ message: result.response });
            } else {
                console.error('No response field in result:', result);
                throw new Error('Invalid AI response format');
            }
        } catch (error) {
            console.error('Error getting AI response:', error);
            this.showAIError('Failed to get AI response. Please try again.');
        } finally {
            this.hideTypingIndicator();
        }
    }



    addUserMessage(message) {
        const messagesContainer = document.getElementById('ai-messages');
        const userMessage = document.createElement('div');
        userMessage.className = 'ai-message ai-user-message';
        userMessage.innerHTML = `
            <div class="ai-avatar">👤</div>
            <div class="ai-text">
                <p>${this.escapeHtml(message)}</p>
            </div>
        `;
        messagesContainer.appendChild(userMessage);
        this.scrollToBottom();
    }

    displayAIResponse(response) {
        const messagesContainer = document.getElementById('ai-messages');
        const aiMessage = document.createElement('div');
        aiMessage.className = 'ai-message ai-bot-message';
        
        let content = '';
        if (response.message) {
            console.log('Raw message before escapeHtml:', response.message);
            // The escapeHtml function now returns formatted HTML, so we don't wrap it in <p> tags
            const formattedContent = this.escapeHtml(response.message);
            console.log('Formatted content after escapeHtml:', formattedContent);
            content += formattedContent;
        }
        if (response.code) {
            content += `
                    <div class="ai-code">
                    <pre><code>${this.escapeHtml(response.code)}</code></pre>
            </div>
        `;
        }
        
        aiMessage.innerHTML = `
            <div class="ai-avatar">🤖</div>
            <div class="ai-text">
                ${content}
            </div>
        `;
        
        messagesContainer.appendChild(aiMessage);
        this.scrollToBottom();
    }

    showAIError(message) {
        const messagesContainer = document.getElementById('ai-messages');
        const errorMessage = document.createElement('div');
        errorMessage.className = 'ai-message ai-error-message';
        errorMessage.innerHTML = `
            <div class="ai-avatar">⚠️</div>
            <div class="ai-text">
                <p>${this.escapeHtml(message)}</p>
            </div>
        `;
        messagesContainer.appendChild(errorMessage);
        this.scrollToBottom();
    }

    showTypingIndicator() {
        const messagesContainer = document.getElementById('ai-messages');
        if (!messagesContainer) return;
        
        // Remove any existing typing indicator
        const existingTyping = document.getElementById('ai-typing');
        if (existingTyping) {
            existingTyping.remove();
        }
        
        // Create new typing indicator
        const typingIndicator = document.createElement('div');
        typingIndicator.id = 'ai-typing';
        typingIndicator.className = 'ai-typing-indicator';
        typingIndicator.innerHTML = `
            <div class="ai-avatar">🤖</div>
            <div class="ai-text">
                <div class="typing-dots">
                    <span class="typing-dot"></span>
                    <span class="typing-dot"></span>
                    <span class="typing-dot"></span>
                </div>
            </div>
        `;
        
        // Insert after the last message but before the input container
        const lastMessage = messagesContainer.lastElementChild;
        if (lastMessage) {
            lastMessage.after(typingIndicator);
        } else {
            messagesContainer.appendChild(typingIndicator);
        }
        
        this.scrollToBottom();
    }

    hideTypingIndicator() {
        const typingIndicator = document.getElementById('ai-typing');
        if (typingIndicator) {
            typingIndicator.remove();
        }
    }

    scrollToBottom() {
        const messagesContainer = document.getElementById('ai-messages');
        if (messagesContainer) {
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }
    }

    escapeHtml(text) {
        if (!text) return '';
        
        // Convert markdown to HTML while escaping dangerous HTML
        let html = text
            // Escape dangerous HTML first
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;')
            
            // Convert markdown to HTML
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')  // **bold**
            .replace(/\*(.*?)\*/g, '<em>$1</em>')              // *italic*
            .replace(/`(.*?)`/g, '<code>$1</code>')            // `code`
            .replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')  // ```code blocks```
            .replace(/\n\n/g, '</p><p>')                       // Double newlines become paragraphs
            .replace(/\n/g, '<br>');                           // Single newlines become line breaks
        
        // Wrap in paragraph tags if not already wrapped
        if (!html.startsWith('<p>') && !html.startsWith('<pre>')) {
            html = '<p>' + html + '</p>';
        }
        
        return html;
    }

    setupAIInput() {
        const input = document.getElementById('ai-input');
        if (input) {
            // Handle Enter key (Shift+Enter for new line)
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.sendAIRequest();
                }
            });

            // Auto-resize textarea
            input.addEventListener('input', () => {
                input.style.height = 'auto';
                input.style.height = Math.min(input.scrollHeight, 120) + 'px';
            });
        }
    }

    enhanceWithAI() {
        // Add AI hint buttons to learning path cards
        const pathCards = document.querySelectorAll('.path-card');
        pathCards.forEach(card => {
            if (!card.querySelector('.ai-hint-btn')) {
                const hintBtn = document.createElement('button');
                hintBtn.className = 'ai-hint-btn';
                hintBtn.innerHTML = '💡 Get AI Hint';
                hintBtn.style.cssText = `
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    border: none;
                    padding: 8px 15px;
                    border-radius: 20px;
                    cursor: pointer;
                    font-size: 12px;
                    margin-top: 10px;
                    transition: transform 0.2s;
                `;
                
                hintBtn.onclick = (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const topic = card.querySelector('h3')?.textContent || 'this topic';
                    const aiInput = document.getElementById('ai-input');
                    if (aiInput) {
                        aiInput.value = `Give me a hint about ${topic}`;
                        this.sendAIRequest();
                    }
                };
                
                card.appendChild(hintBtn);
            }
        });
    }

    getAuthToken() {
        // Get JWT token from localStorage or memory
        return localStorage.getItem('codequest_jwt') || '';
    }
}

// Initialize index page when DOM is ready
let indexPage;
document.addEventListener('DOMContentLoaded', () => {
    indexPage = new IndexPage();
});

// Global functions for AI actions
window.toggleAI = () => indexPage.toggleAI();
window.closeAI = () => indexPage.closeAI();
window.sendAIRequest = () => indexPage.sendAIRequest();


























