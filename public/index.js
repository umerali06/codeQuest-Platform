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
            if (result.success) {
                this.updateStatistics(result.data);
            } else {
                throw new Error(result.message || 'Failed to load statistics');
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

        if (activeLearners) activeLearners.textContent = this.formatNumber(stats.active_learners || 0);
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
        // Default statistics if API fails
        const defaultStats = {
            active_learners: 10000,
            total_lessons: 500,
            total_challenges: 100,
            html_lessons: 45,
            css_lessons: 52,
            js_lessons: 68
        };
        
        this.updateStatistics(defaultStats);
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
            hamburger.addEventListener('click', () => {
                navLinks.classList.toggle('active');
                hamburger.classList.toggle('active');
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
            <div class="ai-header">
                <span class="ai-title">🤖 AI Assistant</span>
                <div class="ai-controls">
                    <button class="ai-minimize" onclick="indexPage.toggleAI()">−</button>
                    <button class="ai-close" onclick="indexPage.closeAI()">×</button>
                </div>
            </div>
            <div class="ai-content" id="ai-content">
                <div class="ai-message">
                    <p>Hi! I'm your AI coding assistant. Ask me anything about web development!</p>
                </div>
                <div class="ai-input">
                    <textarea id="ai-input" placeholder="Ask me about HTML, CSS, JavaScript..."></textarea>
                    <button id="ai-send" onclick="indexPage.sendAIRequest()">Send</button>
                </div>
            </div>
        `;

        document.body.appendChild(aiWidget);

        // Add styles
        this.addAIStyles();
    }

    addAIStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .ai-assistant {
                position: fixed;
                bottom: 20px;
                right: 20px;
                width: 350px;
                background: #2d2d2d;
                border-radius: 12px;
                box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
                z-index: 1000;
                border: 1px solid #404040;
                color: #ffffff;
                font-family: inherit;
            }

            .ai-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 15px 20px;
                background: #4ecdc4;
                color: #000;
                border-radius: 12px 12px 0 0;
                font-weight: 600;
            }

            .ai-controls {
                display: flex;
                gap: 8px;
            }

            .ai-controls button {
                background: none;
                border: none;
                cursor: pointer;
                font-size: 18px;
                padding: 2px 6px;
                border-radius: 4px;
                transition: background 0.2s;
            }

            .ai-controls button:hover {
                background: rgba(0, 0, 0, 0.1);
            }

            .ai-content {
                padding: 20px;
            }

            .ai-message {
                margin-bottom: 15px;
                line-height: 1.5;
            }

            .ai-input {
                display: flex;
                gap: 10px;
            }

            .ai-input textarea {
                flex: 1;
                background: #404040;
                border: 1px solid #555;
                border-radius: 8px;
                padding: 10px;
                color: #ffffff;
                resize: none;
                height: 60px;
                font-family: inherit;
            }

            .ai-input textarea:focus {
                outline: none;
                border-color: #4ecdc4;
            }

            .ai-input button {
                background: #4ecdc4;
                color: #000;
                border: none;
                padding: 10px 15px;
                border-radius: 8px;
                cursor: pointer;
                font-weight: 600;
                transition: background 0.2s;
            }

            .ai-input button:hover {
                background: #45b7a8;
            }

            .ai-response {
                background: #404040;
                border-radius: 8px;
                padding: 15px;
                margin: 15px 0;
            }

            .ai-code {
                background: #1e1e1e;
                border-radius: 6px;
                padding: 12px;
                margin: 10px 0;
                border: 1px solid #555;
                overflow-x: auto;
            }

            .ai-code pre {
                margin: 0;
                color: #cccccc;
                font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
                font-size: 0.85rem;
                line-height: 1.4;
            }

            @media (max-width: 768px) {
                .ai-assistant {
                    width: calc(100vw - 40px);
                    right: 20px;
                    left: 20px;
                    bottom: 10px;
                }
            }
        `;

        document.head.appendChild(style);
    }

    toggleAI() {
        const aiContent = document.getElementById('ai-content');
        const toggleBtn = document.querySelector('.ai-minimize');
        
        if (aiContent.style.display === 'none') {
            aiContent.style.display = 'block';
            toggleBtn.textContent = '−';
        } else {
            aiContent.style.display = 'none';
            toggleBtn.textContent = '+';
        }
    }

    closeAI() {
        const aiAssistant = document.getElementById('ai-assistant');
        if (aiAssistant) {
            aiAssistant.remove();
        }
    }

    async sendAIRequest() {
        const input = document.getElementById('ai-input');
        const message = input.value.trim();
        
        if (!message) return;

        try {
            const context = {
                page: 'index',
                availableTopics: ['HTML', 'CSS', 'JavaScript', 'Web Development', 'Coding']
            };

            const response = await fetch(`${this.apiBase}/ai/generate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.getAuthToken()}`
                },
                body: JSON.stringify({
                    prompt: message,
                    context: context
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const result = await response.json();
            if (result.success) {
                this.displayAIResponse(result.data);
            } else {
                throw new Error(result.message || 'Failed to get AI response');
            }
        } catch (error) {
            console.error('Error getting AI response:', error);
            this.showAIError('Failed to get AI response. Please try again.');
        }

        input.value = '';
    }

    displayAIResponse(response) {
        const aiMessage = document.querySelector('.ai-message');
        
        aiMessage.innerHTML = `
            <div class="ai-response">
                <p>${response.message}</p>
                ${response.code ? `
                    <div class="ai-code">
                        <pre><code>${response.code}</code></pre>
                    </div>
                ` : ''}
            </div>
        `;
    }

    showAIError(message) {
        const aiMessage = document.querySelector('.ai-message');
        
        aiMessage.innerHTML = `
            <div class="ai-response" style="background: #3a1e1e; border-left: 4px solid #dc3545;">
                <p style="color: #ff6b6b;">⚠️ ${message}</p>
            </div>
        `;
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
