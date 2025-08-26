// CodeQuest Learn Page JavaScript
// Handles module/lesson display, API integration, and AI assistant

class LearnPage {
    constructor() {
        this.modules = [];
        this.currentModule = null;
        this.currentLesson = null;
        this.apiBase = '/api';
        
        this.init();
    }

    async init() {
        try {
            await this.loadModules();
            this.setupEventListeners();
            this.setupAI();
        } catch (error) {
            console.error('Failed to initialize learn page:', error);
            this.showError('Failed to load learning content. Please try again later.');
        }
    }

    async loadModules() {
        try {
            const response = await fetch(`${this.apiBase}/modules`);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const result = await response.json();
            if (result.success) {
                this.modules = result.data;
                this.renderModules();
            } else {
                throw new Error(result.message || 'Failed to load modules');
            }
        } catch (error) {
            console.error('Error loading modules:', error);
            this.showError('Failed to load learning modules. Please check your connection and try again.');
        }
    }

    renderModules() {
        const modulesGrid = document.getElementById('modulesGrid');
        if (!modulesGrid) return;

        if (this.modules.length === 0) {
            modulesGrid.innerHTML = '<div class="no-modules">No learning modules available at the moment.</div>';
            return;
        }

        const modulesHTML = this.modules.map(module => this.createModuleCard(module)).join('');
        modulesGrid.innerHTML = modulesHTML;
    }

    createModuleCard(module) {
        const totalLessons = module.lesson_count || 0;
        const estimatedHours = Math.ceil((module.estimated_duration || 0) / 60);
        
        return `
            <div class="module-card" data-module-slug="${module.slug}">
                <div class="module-header" style="background: linear-gradient(135deg, ${module.color}20, ${module.color}40)">
                    <div class="module-icon">${module.icon}</div>
                    <div class="module-info">
                        <h3>${module.title}</h3>
                        <p>${module.description}</p>
                    </div>
                </div>
                <div class="module-stats">
                    <div class="stat">
                        <span class="stat-number">${totalLessons}</span>
                        <span class="stat-label">Lessons</span>
                    </div>
                    <div class="stat">
                        <span class="stat-number">${estimatedHours}h</span>
                        <span class="stat-label">Duration</span>
                    </div>
                    <div class="stat">
                        <span class="stat-number">${module.beginner_lessons || 0}</span>
                        <span class="stat-label">Beginner</span>
                    </div>
                </div>
                <div class="module-actions">
                    <button class="btn btn-primary" onclick="learnPage.viewModule('${module.slug}')">
                        Start Learning
                    </button>
                    <button class="btn btn-secondary" onclick="learnPage.viewModuleDetails('${module.slug}')">
                        View Details
                    </button>
                </div>
            </div>
        `;
    }

    async viewModule(moduleSlug) {
        try {
            const response = await fetch(`${this.apiBase}/modules/${moduleSlug}`);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const result = await response.json();
            if (result.success) {
                this.currentModule = result.data;
                this.showModuleModal();
            } else {
                throw new Error(result.message || 'Failed to load module');
            }
        } catch (error) {
            console.error('Error loading module:', error);
            this.showError('Failed to load module details. Please try again.');
        }
    }

    async viewModuleDetails(moduleSlug) {
        await this.viewModule(moduleSlug);
    }

    showModuleModal() {
        if (!this.currentModule) return;

        const modal = document.getElementById('moduleModal');
        const content = document.getElementById('moduleContent');
        
        if (!modal || !content) return;

        const lessonsHTML = this.currentModule.lessons.map(lesson => this.createLessonCard(lesson)).join('');
        
        content.innerHTML = `
            <div class="module-detail-header">
                <h2>${this.currentModule.title}</h2>
                <p>${this.currentModule.description}</p>
                <div class="module-meta">
                    <span class="meta-item">
                        <strong>${this.currentModule.lesson_count || 0}</strong> Lessons
                    </span>
                    <span class="meta-item">
                        <strong>${Math.ceil((this.currentModule.estimated_duration || 0) / 60)}h</strong> Duration
                    </span>
                    <span class="meta-item">
                        <strong>${this.currentModule.difficulty || 'Mixed'}</strong> Level
                    </span>
                </div>
            </div>
            <div class="lessons-list">
                <h3>Lessons in this Module</h3>
                ${lessonsHTML}
            </div>
        `;

        modal.style.display = 'block';
    }

    createLessonCard(lesson) {
        const difficultyClass = `difficulty-${lesson.difficulty}`;
        const duration = lesson.estimated_duration || 15;
        
        return `
            <div class="lesson-card ${difficultyClass}" data-lesson-slug="${lesson.slug}">
                <div class="lesson-header">
                    <div class="lesson-number">${lesson.order_index}</div>
                    <div class="lesson-info">
                        <h4>${lesson.title}</h4>
                        <p>${lesson.description}</p>
                    </div>
                    <div class="lesson-meta">
                        <span class="difficulty-badge ${difficultyClass}">${lesson.difficulty}</span>
                        <span class="duration">${duration} min</span>
                    </div>
                </div>
                <div class="lesson-actions">
                    <button class="btn btn-primary" onclick="learnPage.startLesson('${lesson.slug}')">
                        Start Lesson
                    </button>
                    <button class="btn btn-secondary" onclick="learnPage.viewLesson('${lesson.slug}')">
                        Preview
                    </button>
                </div>
            </div>
        `;
    }

    async startLesson(lessonSlug) {
        try {
            const response = await fetch(`${this.apiBase}/lessons/${lessonSlug}`);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const result = await response.json();
            if (result.success) {
                this.currentLesson = result.data;
                this.showLessonModal();
            } else {
                throw new Error(result.message || 'Failed to load lesson');
            }
        } catch (error) {
            console.error('Error loading lesson:', error);
            this.showError('Failed to load lesson. Please try again.');
        }
    }

    async viewLesson(lessonSlug) {
        await this.startLesson(lessonSlug);
    }

    showLessonModal() {
        if (!this.currentLesson) return;

        const modal = document.getElementById('lessonModal');
        const content = document.getElementById('lessonContent');
        
        if (!modal || !content) return;

        const challengesHTML = this.currentLesson.challenges.map(challenge => this.createChallengeCard(challenge)).join('');
        const navigationHTML = this.createNavigationHTML();
        
        content.innerHTML = `
            <div class="lesson-detail-header">
                <div class="breadcrumb">
                    <a href="#" onclick="learnPage.showModuleModal()">${this.currentLesson.module.title}</a>
                    <span class="separator">/</span>
                    <span>${this.currentLesson.title}</span>
                </div>
                <h2>${this.currentLesson.title}</h2>
                <p>${this.currentLesson.description}</p>
                <div class="lesson-meta">
                    <span class="meta-item">
                        <strong>${this.currentLesson.difficulty}</strong> Level
                    </span>
                    <span class="meta-item">
                        <strong>${this.currentLesson.estimated_duration}</strong> min
                    </span>
                    <span class="meta-item">
                        <strong>${this.currentLesson.challenges.length}</strong> Challenges
                    </span>
                </div>
            </div>
            
            <div class="lesson-content">
                <div class="content-section">
                    <h3>What You'll Learn</h3>
                    <div class="markdown-content">
                        ${this.renderMarkdown(this.currentLesson.content_md)}
                    </div>
                </div>
                
                <div class="content-section">
                    <h3>Starter Code</h3>
                    <div class="code-preview">
                        <pre><code class="language-html">${this.escapeHtml(this.currentLesson.starter_code)}</code></pre>
                        <button class="btn btn-primary" onclick="learnPage.openInEditor('${this.currentLesson.slug}')">
                            Open in Code Editor
                        </button>
                    </div>
                </div>
                
                <div class="content-section">
                    <h3>Practice Challenges</h3>
                    <div class="challenges-grid">
                        ${challengesHTML}
                    </div>
                </div>
            </div>
            
            ${navigationHTML}
        `;

        modal.style.display = 'block';
    }

    createChallengeCard(challenge) {
        return `
            <div class="challenge-card">
                <div class="challenge-header">
                    <h4>${challenge.title}</h4>
                    <span class="points">${challenge.points} pts</span>
                </div>
                <p>${challenge.description}</p>
                <div class="challenge-actions">
                    <button class="btn btn-primary" onclick="learnPage.startChallenge(${challenge.id})">
                        Start Challenge
                    </button>
                    <button class="btn btn-secondary" onclick="learnPage.previewChallenge(${challenge.id})">
                        Preview
                    </button>
                </div>
            </div>
        `;
    }

    createNavigationHTML() {
        const nav = this.currentLesson.navigation;
        if (!nav.previous && !nav.next) return '';

        return `
            <div class="lesson-navigation">
                ${nav.previous ? `
                    <a href="#" class="nav-link prev" onclick="learnPage.viewLesson('${nav.previous.slug}')">
                        <span class="nav-arrow">←</span>
                        <span class="nav-text">
                            <span class="nav-label">Previous</span>
                            <span class="nav-title">${nav.previous.title}</span>
                        </span>
                    </a>
                ` : '<div class="nav-placeholder"></div>'}
                
                ${nav.next ? `
                    <a href="#" class="nav-link next" onclick="learnPage.viewLesson('${nav.next.slug}')">
                        <span class="nav-text">
                            <span class="nav-label">Next</span>
                            <span class="nav-title">${nav.next.title}</span>
                        </span>
                        <span class="nav-arrow">→</span>
                    </a>
                ` : '<div class="nav-placeholder"></div>'}
            </div>
        `;
    }

    openInEditor(lessonSlug) {
        // Store lesson data in localStorage for editor
        if (this.currentLesson) {
            localStorage.setItem('codequest_lesson', JSON.stringify({
                slug: lessonSlug,
                title: this.currentLesson.title,
                starter_code: this.currentLesson.starter_code,
                test_spec: this.currentLesson.test_spec_json
            }));
        }
        
        // Redirect to editor
        window.location.href = '../editor.html';
    }

    startChallenge(challengeId) {
        // Store challenge data and redirect to editor
        const challenge = this.currentLesson.challenges.find(c => c.id == challengeId);
        if (challenge) {
            localStorage.setItem('codequest_challenge', JSON.stringify({
                id: challengeId,
                title: challenge.title,
                description: challenge.description,
                starter_code: challenge.starter_code,
                test_spec: challenge.test_spec_json
            }));
            window.location.href = '../editor.html';
        }
    }

    previewChallenge(challengeId) {
        // Show challenge preview modal
        const challenge = this.currentLesson.challenges.find(c => c.id == challengeId);
        if (challenge) {
            this.showChallengePreview(challenge);
        }
    }

    showChallengePreview(challenge) {
        // Create and show challenge preview modal
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content challenge-preview-modal">
                <button class="close" onclick="this.closest('.modal').remove()">&times;</button>
                <h2>${challenge.title}</h2>
                <p>${challenge.description}</p>
                <div class="challenge-stats">
                    <span class="stat">Difficulty: <strong>${challenge.difficulty}</strong></span>
                    <span class="stat">Points: <strong>${challenge.points}</strong></span>
                    <span class="stat">Time Limit: <strong>${Math.floor(challenge.time_limit / 60)}m ${challenge.time_limit % 60}s</strong></span>
                </div>
                <div class="challenge-actions">
                    <button class="btn btn-primary" onclick="learnPage.startChallenge(${challenge.id})">
                        Start Challenge
                    </button>
                    <button class="btn btn-secondary" onclick="this.closest('.modal').remove()">
                        Close
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        modal.style.display = 'block';
    }

    renderMarkdown(markdown) {
        if (!markdown) return '';
        
        // Simple markdown to HTML conversion
        return markdown
            .replace(/^### (.*$)/gim, '<h3>$1</h3>')
            .replace(/^## (.*$)/gim, '<h2>$1</h2>')
            .replace(/^# (.*$)/gim, '<h1>$1</h1>')
            .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
            .replace(/\*(.*)\*/gim, '<em>$1</em>')
            .replace(/\n/gim, '<br>')
            .replace(/^- (.*$)/gim, '<li>$1</li>')
            .replace(/(<li>.*<\/li>)/gim, '<ul>$1</ul>');
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    showError(message) {
        const modulesGrid = document.getElementById('modulesGrid');
        if (modulesGrid) {
            modulesGrid.innerHTML = `
                <div class="error-message">
                    <div class="error-icon">⚠️</div>
                    <h3>Oops! Something went wrong</h3>
                    <p>${message}</p>
                    <button class="btn btn-primary" onclick="location.reload()">
                        Try Again
                    </button>
                </div>
            `;
        }
    }

    setupEventListeners() {
        // Close modals when clicking outside
        window.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                e.target.style.display = 'none';
            }
        });

        // Close modals with escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                const modals = document.querySelectorAll('.modal');
                modals.forEach(modal => {
                    if (modal.style.display === 'block') {
                        modal.style.display = 'none';
                    }
                });
            }
        });
    }

    setupAI() {
        // AI Assistant functionality
        const aiButton = document.getElementById('ai-assistant-button');
        const aiChat = document.getElementById('ai-chat-window');
        const closeAiChat = document.getElementById('close-ai-chat');
        const aiSend = document.getElementById('ai-send');
        const aiInput = document.getElementById('ai-input');
        const quickActions = document.querySelectorAll('.quick-action');

        if (aiButton && aiChat) {
            aiButton.addEventListener('click', () => {
                aiChat.classList.toggle('active');
            });

            if (closeAiChat) {
                closeAiChat.addEventListener('click', () => {
                    aiChat.classList.remove('active');
                });
            }
        }

        if (aiSend && aiInput) {
            aiSend.addEventListener('click', () => this.sendAIMessage());
            aiInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.sendAIMessage();
                }
            });
        }

        quickActions.forEach(button => {
            button.addEventListener('click', () => {
                const prompt = button.dataset.prompt;
                if (prompt) {
                    this.sendAIMessage(prompt);
                }
            });
        });
    }

    async sendAIMessage(customPrompt = null) {
        const aiInput = document.getElementById('ai-input');
        const aiMessages = document.getElementById('ai-messages');
        
        if (!aiInput || !aiMessages) return;

        const prompt = customPrompt || aiInput.value.trim();
        if (!prompt) return;

        // Add user message
        const userMessage = document.createElement('div');
        userMessage.className = 'ai-message user-message';
        userMessage.innerHTML = `<p>${this.escapeHtml(prompt)}</p>`;
        aiMessages.appendChild(userMessage);

        // Clear input
        if (!customPrompt) {
            aiInput.value = '';
        }

        // Add loading message
        const loadingMessage = document.createElement('div');
        loadingMessage.className = 'ai-message ai-message';
        loadingMessage.innerHTML = '<p>🤔 Thinking...</p>';
        aiMessages.appendChild(loadingMessage);

        // Scroll to bottom
        aiMessages.scrollTop = aiMessages.scrollHeight;

        try {
            const response = await fetch('/api/ai/generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    prompt: prompt,
                    context: {
                        page: 'learn',
                        module: this.currentModule?.slug,
                        lesson: this.currentLesson?.slug
                    }
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const result = await response.json();
            
            // Remove loading message
            loadingMessage.remove();

            if (result.success) {
                const aiMessage = document.createElement('div');
                aiMessage.className = 'ai-message ai-message';
                
                let messageContent = `<p>${this.renderMarkdown(result.data.message)}</p>`;
                
                if (result.data.code) {
                    messageContent += `
                        <div class="ai-code-block">
                            <pre><code class="language-${result.data.language || 'html'}">${this.escapeHtml(result.data.code)}</code></pre>
                            <button class="btn btn-sm btn-primary" onclick="learnPage.insertAICode('${this.escapeHtml(result.data.code)}')">
                                Insert into Editor
                            </button>
                        </div>
                    `;
                }

                if (result.data.suggestions && result.data.suggestions.length > 0) {
                    messageContent += `
                        <div class="ai-suggestions">
                            <h4>Suggestions:</h4>
                            <ul>
                                ${result.data.suggestions.map(suggestion => `<li>${suggestion}</li>`).join('')}
                            </ul>
                        </div>
                    `;
                }

                aiMessage.innerHTML = messageContent;
                aiMessages.appendChild(aiMessage);
            } else {
                throw new Error(result.message || 'Failed to get AI response');
            }

        } catch (error) {
            console.error('AI request failed:', error);
            
            // Remove loading message
            loadingMessage.remove();
            
            // Add error message
            const errorMessage = document.createElement('div');
            errorMessage.className = 'ai-message ai-message error';
            errorMessage.innerHTML = '<p>❌ Sorry, I encountered an error. Please try again later.</p>';
            aiMessages.appendChild(errorMessage);
        }

        // Scroll to bottom
        aiMessages.scrollTop = aiMessages.scrollHeight;
    }

    insertAICode(code) {
        // Store code in localStorage for editor
        localStorage.setItem('codequest_ai_code', code);
        
        // Show notification
        this.showNotification('Code copied! Open the editor to use it.', 'success');
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <span class="notification-message">${message}</span>
            <button class="notification-close" onclick="this.parentElement.remove()">&times;</button>
        `;
        
        document.body.appendChild(notification);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 5000);
    }
}

// Global functions for onclick handlers
function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
    }
}

function switchToSignup() {
    closeModal('loginModal');
    document.getElementById('signupModal').style.display = 'block';
}

function switchToLogin() {
    closeModal('signupModal');
    document.getElementById('loginModal').style.display = 'block';
}

function showLogin() {
    document.getElementById('loginModal').style.display = 'block';
}

function showSignup() {
    document.getElementById('signupModal').style.display = 'block';
}

// Initialize the learn page when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.learnPage = new LearnPage();
});
