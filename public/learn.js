// CodeQuest Learn Page JavaScript
// Handles module/lesson display, API integration, and AI assistant

class LearnPage {
    constructor() {
        this.modules = [];
        this.currentModule = null;
        this.currentLesson = null;
        this.init();
    }

    async init() {
        try {
            await this.loadModules();
            this.setupAI();
        } catch (error) {
            console.error('Error initializing learn page:', error);
            this.showError('Failed to initialize learn page');
        }
    }

    async loadModules() {
        try {
            const response = await fetch('/api/modules');
            if (!response.ok) {
                throw new Error('Failed to load modules');
            }
            
            const result = await response.json();
            this.modules = result.modules || [];
            
            if (this.modules.length === 0) {
                this.showError('No learning modules available');
                return;
            }
            
            this.renderModules();
        } catch (error) {
            console.error('Error loading modules:', error);
            this.showError('Failed to load learning modules. Please check your connection and try again.');
        }
    }

    renderModules() {
        const modulesGrid = document.getElementById('modulesGrid');
        if (!modulesGrid) return;

        modulesGrid.innerHTML = this.modules.map(module => `
            <div class="module-card" onclick="learnPage.viewModule('${module.id}')">
                <div class="module-icon" style="background-color: ${module.color}">
                    ${module.icon}
                </div>
                <div class="module-info">
                    <h3>${this.escapeHtml(module.title)}</h3>
                    <p>${this.escapeHtml(module.description)}</p>
                    <div class="module-stats">
                        <span class="stat">
                            <i class="icon">📚</i>
                            ${module.lesson_count || 0} lessons
                        </span>
                        <span class="stat">
                            <i class="icon">🎯</i>
                            ${module.challenge_count || 0} challenges
                        </span>
                        <span class="stat">
                            <i class="icon">⏱️</i>
                            ${module.estimated_hours || 0}h
                        </span>
                    </div>
                    <div class="module-difficulty ${module.difficulty}">
                        ${module.difficulty.charAt(0).toUpperCase() + module.difficulty.slice(1)}
                    </div>
                </div>
            </div>
        `).join('');
    }

    async viewModule(moduleId) {
        try {
            const module = this.modules.find(m => m.id === moduleId);
            if (!module) {
                throw new Error('Module not found');
            }

            this.currentModule = module;
            await this.loadLessons(moduleId);
            this.showModuleView();
        } catch (error) {
            console.error('Error viewing module:', error);
            this.showError('Failed to load module details');
        }
    }

    async loadLessons(moduleId) {
        try {
            const response = await fetch(`/api/lessons?module_id=${moduleId}`);
            if (!response.ok) {
                throw new Error('Failed to load lessons');
            }
            
            const result = await response.json();
            this.currentModule.lessons = result.lessons || [];
        } catch (error) {
            console.error('Error loading lessons:', error);
            this.currentModule.lessons = [];
        }
    }

    showModuleView() {
        const modulesSection = document.querySelector('.modules-section');
        if (!modulesSection) return;

        modulesSection.innerHTML = `
            <div class="container">
                <div class="module-header">
                    <button class="btn btn-secondary back-btn" onclick="learnPage.showModulesList()">
                        ← Back to Modules
                    </button>
                    <div class="course-header">
                        <div class="course-icon" style="background-color: ${this.currentModule.color}">
                            ${this.currentModule.icon}
                        </div>
                        <div class="course-info">
                            <h1>${this.escapeHtml(this.currentModule.title)}</h1>
                            <p>${this.escapeHtml(this.currentModule.description)}</p>
                            <div class="course-stats">
                                <span class="stat">
                                    <i class="icon">📚</i>
                                    ${this.currentModule.lessons?.length || 0} lessons
                                </span>
                                <span class="stat">
                                    <i class="icon">🎯</i>
                                    ${this.currentModule.challenge_count || 0} challenges
                                </span>
                                <span class="stat">
                                    <i class="icon">⏱️</i>
                                    ${this.currentModule.estimated_hours || 0} hours
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="lessons-grid">
                    ${this.renderLessons()}
                </div>
            </div>
        `;
    }

    renderLessons() {
        if (!this.currentModule.lessons || this.currentModule.lessons.length === 0) {
            return `
                <div class="no-lessons">
                    <p>No lessons available for this module yet.</p>
                </div>
            `;
        }

        return this.currentModule.lessons.map(lesson => `
            <div class="lesson-card" onclick="learnPage.startLesson('${lesson.id}')">
                <div class="lesson-header">
                    <h3>${this.escapeHtml(lesson.title)}</h3>
                    <span class="lesson-duration">${lesson.duration_minutes || 0} min</span>
                </div>
                <p>${this.escapeHtml(lesson.description || '')}</p>
                <div class="lesson-difficulty ${lesson.difficulty}">
                    ${lesson.difficulty.charAt(0).toUpperCase() + lesson.difficulty.slice(1)}
                </div>
            </div>
        `).join('');
    }

    showModulesList() {
        const modulesSection = document.querySelector('.modules-section');
        if (!modulesSection) return;

        modulesSection.innerHTML = `
            <div class="container">
                <div class="learn-header">
                    <h1>Choose Your Learning Path</h1>
                    <p>Master web development with our structured courses designed for your success.</p>
                </div>
                <div id="modulesGrid" class="modules-grid">
                    <!-- Modules will be loaded here -->
                </div>
            </div>
        `;
        
        this.renderModules();
    }

    async startLesson(lessonId) {
        try {
            const response = await fetch(`/api/lessons/${lessonId}`);
            if (!response.ok) {
                throw new Error('Failed to load lesson');
            }
            
            const result = await response.json();
            this.currentLesson = result;
            this.showLessonView();
        } catch (error) {
            console.error('Error starting lesson:', error);
            this.showError('Failed to load lesson');
        }
    }

    showLessonView() {
        const modulesSection = document.querySelector('.modules-section');
        if (!modulesSection) return;

        modulesSection.innerHTML = `
            <div class="container">
                <div class="lesson-header">
                    <button class="btn btn-secondary back-btn" onclick="learnPage.viewModule('${this.currentModule.id}')">
                        ← Back to ${this.currentModule.title}
                    </button>
                    <h1>${this.escapeHtml(this.currentLesson.title)}</h1>
                    <p>${this.escapeHtml(this.currentLesson.description || '')}</p>
                </div>
                
                <div class="lesson-content">
                    <div class="content-section">
                        <h2>Lesson Content</h2>
                        <div class="markdown-content">
                            ${this.renderMarkdown(this.currentLesson.content_md)}
                        </div>
                    </div>
                    
                    ${this.renderChallenges()}
                    
                    <div class="lesson-actions">
                        <button class="btn btn-primary" onclick="learnPage.startChallenge('practice')">
                            Practice Exercise
                        </button>
                        <button class="btn btn-secondary" onclick="learnPage.completeLesson()">
                            Mark Complete
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    renderChallenges() {
        if (!this.currentLesson.challenges || this.currentLesson.challenges.length === 0) {
            return '';
        }

        return `
            <div class="content-section">
                <h2>Challenges</h2>
                <div class="challenges-grid">
                    ${this.currentLesson.challenges.map(challenge => `
                        <div class="challenge-card">
                            <h3>${this.escapeHtml(challenge.title)}</h3>
                            <p>${this.escapeHtml(challenge.description)}</p>
                            <div class="challenge-stats">
                                <span class="difficulty ${challenge.difficulty}">
                                    ${challenge.difficulty.charAt(0).toUpperCase() + challenge.difficulty.slice(1)}
                                </span>
                                <span class="xp">${challenge.xp_reward || 0} XP</span>
                            </div>
                            <button class="btn btn-primary" onclick="learnPage.startChallenge('${challenge.id}')">
                                Start Challenge
                            </button>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    startChallenge(challengeId) {
        if (challengeId === 'practice') {
            // Store lesson data for practice
            localStorage.setItem('codequest_lesson', JSON.stringify({
                id: this.currentLesson.id,
                slug: this.currentLesson.slug,
                title: this.currentLesson.title,
                starter_code: this.currentLesson.starter_code,
                test_spec: this.currentLesson.test_spec_json
            }));
        } else {
            // Store challenge data
            const challenge = this.currentLesson.challenges.find(c => c.id == challengeId);
            if (challenge) {
                localStorage.setItem('codequest_challenge', JSON.stringify({
                    id: challengeId,
                    title: challenge.title,
                    description: challenge.description,
                    starter_code: challenge.starter_code,
                    test_spec: challenge.test_spec_json
                }));
            }
        }
        
        // Redirect to editor
        window.location.href = '../editor.html';
    }

    completeLesson() {
        // Mark lesson as complete
        this.showNotification('Lesson completed! Great job!', 'success');
        
        // In a real app, you'd save progress to the database
        setTimeout(() => {
            this.viewModule(this.currentModule.id);
        }, 2000);
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
            const response = await fetch('/api/ai', {
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

            if (result.response) {
                const aiMessage = document.createElement('div');
                aiMessage.className = 'ai-message ai-message';
                aiMessage.innerHTML = `<p>${this.renderMarkdown(result.response)}</p>`;
                aiMessages.appendChild(aiMessage);
            } else {
                throw new Error('Invalid response format from API');
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

