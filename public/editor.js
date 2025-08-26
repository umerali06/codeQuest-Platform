// CodeQuest Editor JavaScript
// Handles Monaco Editor, code testing, and AI assistance

class CodeEditor {
    constructor() {
        this.editors = {};
        this.currentChallenge = null;
        this.currentTab = 'html';
        this.testResults = [];
        this.apiBase = '/api';
        
        this.init();
    }

    async init() {
        try {
            await this.initializeMonaco();
            this.setupEventListeners();
            this.setupAI();
            this.checkForChallenge();
        } catch (error) {
            console.error('Failed to initialize editor:', error);
            this.showError('Failed to initialize code editor. Please refresh the page.');
        }
    }

    async initializeMonaco() {
        return new Promise((resolve, reject) => {
            require.config({ paths: { vs: 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.44.0/min/vs' } });
            
            require(['vs/editor/editor.main'], () => {
                try {
                    this.createEditors();
                    resolve();
                } catch (error) {
                    reject(error);
                }
            });
        });
    }

    createEditors() {
        // HTML Editor
        this.editors.html = monaco.editor.create(document.getElementById('html-monaco'), {
            value: '<!-- Your HTML code here -->\n<!DOCTYPE html>\n<html>\n<head>\n  <title>CodeQuest Challenge</title>\n</head>\n<body>\n  <!-- Start coding here -->\n</body>\n</html>',
            language: 'html',
            theme: 'vs-dark',
            automaticLayout: true,
            minimap: { enabled: false },
            fontSize: 14,
            lineNumbers: 'on',
            scrollBeyondLastLine: false,
            wordWrap: 'on'
        });

        // CSS Editor
        this.editors.css = monaco.editor.create(document.getElementById('css-monaco'), {
            value: '/* Your CSS styles here */\nbody {\n  /* Add your styles */\n}',
            language: 'css',
            theme: 'vs-dark',
            automaticLayout: true,
            minimap: { enabled: false },
            fontSize: 14,
            lineNumbers: 'on',
            scrollBeyondLastLine: false,
            wordWrap: 'on'
        });

        // JavaScript Editor
        this.editors.js = monaco.editor.create(document.getElementById('js-monaco'), {
            value: '// Your JavaScript code here\n// Add your functionality below',
            language: 'javascript',
            theme: 'vs-dark',
            automaticLayout: true,
            minimap: { enabled: false },
            fontSize: 14,
            lineNumbers: 'on',
            scrollBeyondLastLine: false,
            wordWrap: 'on'
        });

        // Set initial editor sizes
        this.resizeEditors();
    }

    setupEventListeners() {
        // Tab switching
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tab = e.target.dataset.tab;
                this.switchTab(tab);
            });
        });

        // Editor actions
        document.getElementById('formatHtmlBtn').addEventListener('click', () => this.formatCode('html'));
        document.getElementById('formatCssBtn').addEventListener('click', () => this.formatCode('css'));
        document.getElementById('formatJsBtn').addEventListener('click', () => this.formatCode('js'));

        // Challenge actions
        document.getElementById('runTestsBtn').addEventListener('click', () => this.runTests());
        document.getElementById('resetCodeBtn').addEventListener('click', () => this.resetCode());
        document.getElementById('submitBtn').addEventListener('click', () => this.submitChallenge());

        // Preview actions
        document.getElementById('refreshPreviewBtn').addEventListener('click', () => this.refreshPreview());
        document.getElementById('fullscreenPreviewBtn').addEventListener('click', () => this.toggleFullscreen());

        // Window resize
        window.addEventListener('resize', () => this.resizeEditors());

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                switch (e.key) {
                    case 's':
                        e.preventDefault();
                        this.saveCode();
                        break;
                    case 'Enter':
                        e.preventDefault();
                        this.runTests();
                        break;
                }
            }
        });
    }

    switchTab(tabName) {
        // Update tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabName);
        });

        // Update editor panes
        document.querySelectorAll('.editor-pane').forEach(pane => {
            pane.classList.toggle('active', pane.id === `${tabName}-editor`);
        });

        this.currentTab = tabName;

        // Resize the active editor
        if (this.editors[tabName]) {
            this.editors[tabName].layout();
        }

        // Update preview if switching to preview tab
        if (tabName === 'preview') {
            this.refreshPreview();
        }
    }

    formatCode(language) {
        if (this.editors[language]) {
            this.editors[language].getAction('editor.action.formatDocument').run();
        }
    }

    async checkForChallenge() {
        // Check URL parameters for challenge ID
        const urlParams = new URLSearchParams(window.location.search);
        const challengeId = urlParams.get('challenge');
        
        if (challengeId) {
            await this.loadChallenge(challengeId);
        } else {
            // No challenge loaded, show default state
            this.showDefaultState();
        }
    }

    showDefaultState() {
        // Show default editor state when no challenge is loaded
        document.getElementById('challengeTitle').textContent = 'Code Editor';
        document.getElementById('challengeDifficulty').textContent = 'Free Play';
        document.getElementById('challengeXP').textContent = 'Practice Mode';
        document.getElementById('challengeDescription').innerHTML = 
            '<p>Welcome to the CodeQuest Editor! Use this space to practice coding, experiment with ideas, or work on your own projects.</p>' +
            '<p>You can switch between HTML, CSS, and JavaScript tabs to build complete web pages.</p>' +
            '<div class="challenge-actions">' +
            '<button class="btn btn-primary" onclick="editor.loadChallengeList()">Browse Challenges</button>' +
            '<button class="btn btn-secondary" onclick="editor.loadRandomChallenge()">Random Challenge</button>' +
            '</div>';
        
        // Enable basic actions
        document.getElementById('runTestsBtn').disabled = true;
        document.getElementById('resetCodeBtn').disabled = false;
        document.getElementById('submitBtn').disabled = true;
        
        // Show info about loading a challenge
        this.showInfo('No challenge loaded. You can practice coding here or load a challenge from the Learn page.');
    }

    async loadChallengeList() {
        try {
            const response = await fetch(`${this.apiBase}/challenges`);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const result = await response.json();
            if (result.success) {
                this.showChallengeSelector(result.data);
            } else {
                throw new Error(result.message || 'Failed to load challenges');
            }
        } catch (error) {
            console.error('Error loading challenges:', error);
            this.showError('Failed to load challenges. Please try again.');
        }
    }

    showChallengeSelector(challenges) {
        const description = document.getElementById('challengeDescription');
        const challengesHTML = `
            <div class="challenge-list">
                <h4>Available Challenges:</h4>
                <div class="challenge-grid">
                    ${challenges.map(challenge => `
                        <div class="challenge-item" onclick="editor.loadChallenge(${challenge.id})">
                            <h5>${challenge.title}</h5>
                            <p>${challenge.description}</p>
                            <span class="difficulty ${challenge.difficulty}">${challenge.difficulty}</span>
                            <span class="xp">+${challenge.points} XP</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
        
        description.innerHTML = challengesHTML;
    }

    async loadRandomChallenge() {
        try {
            const response = await fetch(`${this.apiBase}/challenges/random`);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const result = await response.json();
            if (result.success) {
                await this.loadChallenge(result.data.id);
            } else {
                throw new Error(result.message || 'Failed to load random challenge');
            }
        } catch (error) {
            console.error('Error loading random challenge:', error);
            this.showError('Failed to load random challenge. Please try again.');
        }
    }

    async loadChallenge(challengeId) {
        try {
            const response = await fetch(`${this.apiBase}/challenges/${challengeId}`);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const result = await response.json();
            if (result.success) {
                this.currentChallenge = result.data;
                this.displayChallenge();
                this.loadStarterCode();
                this.enableActions();
            } else {
                throw new Error(result.message || 'Failed to load challenge');
            }
        } catch (error) {
            console.error('Error loading challenge:', error);
            this.showError('Failed to load challenge. Please try again.');
        }
    }

    displayChallenge() {
        if (!this.currentChallenge) return;

        document.getElementById('challengeTitle').textContent = this.currentChallenge.title;
        document.getElementById('challengeDifficulty').textContent = this.currentChallenge.difficulty;
        document.getElementById('challengeXP').textContent = `+${this.currentChallenge.xp_reward} XP`;
        document.getElementById('challengeDescription').innerHTML = this.currentChallenge.description;
    }

    loadStarterCode() {
        if (!this.currentChallenge) return;

        // Handle both old JSON format and new separate fields
        let starterCode = {};
        
        if (this.currentChallenge.starter_code_json) {
            // Legacy format - parse JSON
            try {
                starterCode = JSON.parse(this.currentChallenge.starter_code_json);
            } catch (e) {
                console.warn('Failed to parse starter_code_json:', e);
            }
        } else if (this.currentChallenge.starter_code) {
            // New format - separate fields
            starterCode = {
                html: this.currentChallenge.starter_code_html || '',
                css: this.currentChallenge.starter_code_css || '',
                js: this.currentChallenge.starter_code_js || ''
            };
        }
        
        if (starterCode.html && this.editors.html) {
            this.editors.html.setValue(starterCode.html);
        }
        if (starterCode.css && this.editors.css) {
            this.editors.css.setValue(starterCode.css);
        }
        if (starterCode.js && this.editors.js) {
            this.editors.js.setValue(starterCode.js);
        }
    }

    enableActions() {
        document.getElementById('runTestsBtn').disabled = false;
        document.getElementById('resetCodeBtn').disabled = false;
        document.getElementById('submitBtn').disabled = false;
    }

    async runTests() {
        if (!this.currentChallenge) {
            this.showError('No challenge loaded. Please select a challenge first.');
            return;
        }

        try {
            this.updateTestStatus('Running...', 'running');
            
            // Get current code
            const code = {
                html: this.editors.html.getValue(),
                css: this.editors.css.getValue(),
                js: this.editors.js.getValue()
            };

            // Run tests in sandboxed iframe
            const testResults = await this.executeTests(code, this.currentChallenge.test_spec_json);
            
            this.testResults = testResults;
            this.displayTestResults(testResults);
            
            const allPassed = testResults.every(test => test.passed);
            this.updateTestStatus(allPassed ? 'All Tests Passed!' : 'Some Tests Failed', allPassed ? 'success' : 'error');
            
            if (allPassed) {
                this.showSuccess('Congratulations! All tests passed.');
            }
            
        } catch (error) {
            console.error('Error running tests:', error);
            this.updateTestStatus('Test Error', 'error');
            this.showError('Failed to run tests. Please check your code and try again.');
        }
    }

    async executeTests(code, testSpec) {
        return new Promise((resolve) => {
            const iframe = document.getElementById('preview-frame');
            const testResults = [];
            
            // Create test environment
            const testHTML = `
                <!DOCTYPE html>
                <html>
                <head>
                    <style>${code.css}</style>
                </head>
                <body>
                    ${code.html}
                    <script>
                        ${code.js}
                        
                        // Test environment setup
                        window.expect = chai.expect;
                        window.assert = chai.assert;
                        
                                    // Run tests
            const tests = ${JSON.stringify(testSpec)};
            const results = [];
            
            if (tests && Array.isArray(tests)) {
                tests.forEach((test, index) => {
                    try {
                        if (test.code) {
                            eval(test.code);
                            results.push({
                                name: test.name || `Test ${index + 1}`,
                                passed: true,
                                message: 'Test passed'
                            });
                        } else {
                            results.push({
                                name: test.name || `Test ${index + 1}`,
                                passed: false,
                                message: 'No test code provided'
                            });
                        }
                    } catch (error) {
                        results.push({
                            name: test.name || `Test ${index + 1}`,
                            passed: false,
                            message: error.message,
                            line: error.lineNumber || 'Unknown'
                        });
                    }
                });
            } else {
                results.push({
                    name: 'Test Setup',
                    passed: false,
                    message: 'No test specifications found'
                });
            }
                        
                        // Send results back to parent
                        window.parent.postMessage({
                            type: 'testResults',
                            results: results
                        }, '*');
                    </script>
                    <script src="https://cdnjs.cloudflare.com/ajax/libs/chai/4.3.7/chai.min.js"></script>
                </body>
                </html>
            `;
            
            // Listen for test results
            const messageHandler = (event) => {
                if (event.data.type === 'testResults') {
                    window.removeEventListener('message', messageHandler);
                    resolve(event.data.results);
                }
            };
            
            window.addEventListener('message', messageHandler);
            
            // Load test HTML
            iframe.srcdoc = testHTML;
        });
    }

    displayTestResults(results) {
        const testContent = document.getElementById('testResults');
        
        if (results.length === 0) {
            testContent.innerHTML = '<div class="test-placeholder"><p>No tests to run</p></div>';
            return;
        }

        const resultsHTML = results.map(test => `
            <div class="test-result ${test.passed ? 'passed' : 'failed'}">
                <div class="test-header">
                    <span class="test-name">${test.name}</span>
                    <span class="test-status ${test.passed ? 'passed' : 'failed'}">
                        ${test.passed ? '✓' : '✗'}
                    </span>
                </div>
                <div class="test-message">
                    ${test.passed ? test.message : `Error: ${test.message}`}
                    ${!test.passed && test.line ? `<br><small>Line: ${test.line}</small>` : ''}
                </div>
            </div>
        `).join('');

        testContent.innerHTML = resultsHTML;
    }

    updateTestStatus(status, type) {
        const statusElement = document.getElementById('testStatus');
        statusElement.textContent = status;
        statusElement.className = `status-indicator ${type}`;
    }

    resetCode() {
        if (this.currentChallenge) {
            this.loadStarterCode();
            this.showInfo('Code reset to starter code');
        }
    }

    async submitChallenge() {
        if (!this.currentChallenge) {
            this.showError('No challenge loaded. Please select a challenge first.');
            return;
        }

        // Check if all tests pass first
        if (this.testResults.length > 0 && !this.testResults.every(test => test.passed)) {
            this.showError('Please fix all test failures before submitting.');
            return;
        }

        try {
            const code = {
                html: this.editors.html.getValue(),
                css: this.editors.css.getValue(),
                js: this.editors.js.getValue()
            };

            const response = await fetch(`${this.apiBase}/attempts`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.getAuthToken()}`
                },
                body: JSON.stringify({
                    challenge_id: this.currentChallenge.id,
                    code: JSON.stringify(code),
                    test_results: this.testResults,
                    passed: this.testResults.every(test => test.passed)
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const result = await response.json();
            if (result.success) {
                this.showSuccess('Challenge submitted successfully! You earned XP!');
                // Update UI to show completion
                document.getElementById('submitBtn').disabled = true;
                document.getElementById('submitBtn').innerHTML = '<i class="fas fa-check-circle"></i> Completed';
            } else {
                throw new Error(result.message || 'Failed to submit challenge');
            }
        } catch (error) {
            console.error('Error submitting challenge:', error);
            this.showError('Failed to submit challenge. Please try again.');
        }
    }

    refreshPreview() {
        const iframe = document.getElementById('preview-frame');
        const code = {
            html: this.editors.html.getValue(),
            css: this.editors.css.getValue(),
            js: this.editors.js.getValue()
        };

        const previewHTML = `
            <!DOCTYPE html>
            <html>
            <head>
                <style>${code.css}</style>
            </head>
            <body>
                ${code.html}
                <script>${code.js}</script>
            </body>
            </html>
        `;

        iframe.srcdoc = previewHTML;
    }

    toggleFullscreen() {
        const iframe = document.getElementById('preview-frame');
        if (iframe.requestFullscreen) {
            iframe.requestFullscreen();
        } else if (iframe.webkitRequestFullscreen) {
            iframe.webkitRequestFullscreen();
        } else if (iframe.msRequestFullscreen) {
            iframe.msRequestFullscreen();
        }
    }

    saveCode() {
        const code = {
            html: this.editors.html.getValue(),
            css: this.editors.css.getValue(),
            js: this.editors.js.getValue()
        };
        
        localStorage.setItem('codequest_autosave', JSON.stringify(code));
        this.showInfo('Code saved locally');
    }

    loadSavedCode() {
        const saved = localStorage.getItem('codequest_autosave');
        if (saved) {
            try {
                const code = JSON.parse(saved);
                if (this.editors.html) this.editors.html.setValue(code.html || '');
                if (this.editors.css) this.editors.css.setValue(code.css || '');
                if (this.editors.js) this.editors.js.setValue(code.js || '');
                this.showInfo('Saved code restored');
            } catch (error) {
                console.error('Error loading saved code:', error);
            }
        }
    }

    resizeEditors() {
        Object.values(this.editors).forEach(editor => {
            if (editor) {
                editor.layout();
            }
        });
    }

    setupAI() {
        const aiWidget = document.getElementById('aiWidget');
        const minimizeBtn = document.getElementById('minimizeAiBtn');
        const closeBtn = document.getElementById('closeAiBtn');
        const aiSendBtn = document.getElementById('aiSendBtn');
        const aiInput = document.getElementById('aiInput');

        // AI Widget controls
        minimizeBtn.addEventListener('click', () => {
            aiWidget.classList.toggle('minimized');
        });

        closeBtn.addEventListener('click', () => {
            aiWidget.style.display = 'none';
        });

        // AI Input handling
        aiSendBtn.addEventListener('click', () => this.sendAIRequest());
        aiInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendAIRequest();
            }
        });
    }

    async sendAIRequest() {
        const aiInput = document.getElementById('aiInput');
        const message = aiInput.value.trim();
        
        if (!message) return;

        try {
            const context = {
                page: 'editor',
                challenge: this.currentChallenge ? this.currentChallenge.title : null,
                code: {
                    html: this.editors.html.getValue(),
                    css: this.editors.css.getValue(),
                    js: this.editors.js.getValue()
                },
                failingTests: this.testResults.filter(t => !t.passed)
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
            this.showError('Failed to get AI response. Please try again.');
        }

        aiInput.value = '';
    }

    displayAIResponse(response) {
        const aiContent = document.getElementById('aiContent');
        const aiMessage = aiContent.querySelector('.ai-message');
        
        aiMessage.innerHTML = `
            <div class="ai-response">
                <p>${response.message}</p>
                ${response.code ? `
                    <div class="ai-code">
                        <pre><code>${response.code}</code></pre>
                        <div class="ai-actions">
                            <button class="btn btn-sm btn-primary" onclick="editor.tryInEditor('${response.code}')">
                                Try in Editor
                            </button>
                            <button class="btn btn-sm btn-secondary" onclick="editor.insertToEditor('${response.code}')">
                                Insert to Editor
                            </button>
                        </div>
                    </div>
                ` : ''}
            </div>
        `;
    }

    tryInEditor(code) {
        // Switch to appropriate tab and insert code
        if (code.includes('<') && code.includes('>')) {
            this.switchTab('html');
            this.editors.html.setValue(code);
        } else if (code.includes('{') && code.includes('}')) {
            this.switchTab('css');
            this.editors.css.setValue(code);
        } else {
            this.switchTab('js');
            this.editors.js.setValue(code);
        }
        
        this.refreshPreview();
    }

    insertToEditor(code) {
        // Insert code at cursor position in current editor
        const currentEditor = this.editors[this.currentTab];
        if (currentEditor) {
            const selection = currentEditor.getSelection();
            currentEditor.executeEdits('', [{
                range: selection,
                text: code
            }]);
        }
    }

    getAuthToken() {
        // Get JWT token from localStorage or memory
        return localStorage.getItem('codequest_jwt') || '';
    }

    showError(message) {
        this.showNotification(message, 'error');
    }

    showSuccess(message) {
        this.showNotification(message, 'success');
    }

    showInfo(message) {
        this.showNotification(message, 'info');
    }

    showNotification(message, type) {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <span>${message}</span>
            <button onclick="this.parentElement.remove()">&times;</button>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 5000);
    }
}

// Initialize editor when page loads
let editor;
document.addEventListener('DOMContentLoaded', () => {
    editor = new CodeEditor();
});

// Global functions for AI actions
window.tryInEditor = (code) => editor.tryInEditor(code);
window.insertToEditor = (code) => editor.insertToEditor(code);
