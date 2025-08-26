// CodeQuest Games JavaScript
// Handles games display, leaderboards, and statistics

class GamesPage {
    constructor() {
        this.games = [];
        this.currentCategory = 'speed';
        this.leaderboardData = [];
        this.userStats = null;
        this.apiBase = '/api';
        
        this.init();
    }

    async init() {
        try {
            await this.loadGames();
            this.setupEventListeners();
            this.setupAI();
            this.loadLeaderboard();
            this.loadUserStats();
        } catch (error) {
            console.error('Failed to initialize games page:', error);
            this.showError('Failed to load games content. Please try again later.');
        }
    }

    async loadGames() {
        try {
            // Fetch games from backend API
            const response = await fetch(`${this.apiBase}/games`);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const result = await response.json();
            if (result.success) {
                this.games = result.data;
                this.renderGames();
            } else {
                throw new Error(result.message || 'Failed to load games');
            }
        } catch (error) {
            console.error('Error loading games:', error);
            this.showError('Failed to load games. Please check your connection and try again.');
            this.games = [];
            this.renderGames();
        }
    }



            {
                id: 1,
                title: 'Speed Typing Challenge',
                category: 'speed',
                description: 'Type code as fast as you can without errors!',
                difficulty: 'Beginner',
                xp_reward: 25,
                icon: '⚡',
                color: '#ff6b6b',
                rules: [
                    'Type the displayed code exactly as shown',
                    'No copy-paste allowed',
                    'Fastest time wins',
                    'Errors add penalty time'
                ]
            },
            {
                id: 2,
                title: 'Bug Hunt Master',
                category: 'bugfix',
                description: 'Find and fix bugs in the provided code!',
                difficulty: 'Intermediate',
                xp_reward: 50,
                icon: '🐛',
                color: '#4ecdc4',
                rules: [
                    'Identify all bugs in the code',
                    'Fix each bug correctly',
                    'Explain your fixes',
                    'Most bugs found wins'
                ]
            },
            {
                id: 3,
                title: 'Algorithm Race',
                category: 'algorithm',
                description: 'Solve algorithmic problems against the clock!',
                difficulty: 'Advanced',
                xp_reward: 75,
                icon: '🧮',
                color: '#45b7d1',
                rules: [
                    'Solve the given problem',
                    'Optimize for speed and efficiency',
                    'Test your solution',
                    'Best solution wins'
                ]
            },
            {
                id: 4,
                title: 'Code Puzzle Solver',
                category: 'puzzle',
                description: 'Unlock the secrets hidden in the code!',
                difficulty: 'Intermediate',
                xp_reward: 40,
                icon: '🧩',
                color: '#96ceb4',
                rules: [
                    'Analyze the code structure',
                    'Find the hidden pattern',
                    'Complete the missing pieces',
                    'First to solve wins'
                ]
            },
            {
                id: 5,
                title: 'Syntax Sprint',
                category: 'speed',
                description: 'Write syntactically correct code at lightning speed!',
                difficulty: 'Beginner',
                xp_reward: 30,
                icon: '🏃',
                color: '#feca57',
                rules: [
                    'Write code that compiles',
                    'Follow language syntax rules',
                    'Fastest completion wins',
                    'Syntax errors disqualify'
                ]
            },
            {
                id: 6,
                title: 'Memory Challenge',
                category: 'puzzle',
                description: 'Remember and reproduce code patterns!',
                difficulty: 'Beginner',
                xp_reward: 35,
                icon: '🧠',
                color: '#ff9ff3',
                rules: [
                    'Study the code pattern',
                    'Reproduce from memory',
                    'Most accurate wins',
                    'Time limit applies'
                ]


    renderGames() {
        const gamesGrid = document.getElementById('gamesGrid');
        if (!gamesGrid) return;

        const filteredGames = this.games.filter(game => 
            this.currentCategory === 'all' || game.category === this.currentCategory
        );

        if (filteredGames.length === 0) {
            gamesGrid.innerHTML = '<div class="no-games">No games available in this category.</div>';
            return;
        }

        const gamesHTML = filteredGames.map(game => this.createGameCard(game)).join('');
        gamesGrid.innerHTML = gamesHTML;
    }

    createGameCard(game) {
        return `
            <div class="game-card" data-game-id="${game.id}">
                <div class="game-header" style="background: linear-gradient(135deg, ${game.color}20, ${game.color}40)">
                    <div class="game-icon">${game.icon}</div>
                    <div class="game-info">
                        <h3>${game.title}</h3>
                        <p>${game.description}</p>
                    </div>
                </div>
                <div class="game-meta">
                    <span class="difficulty ${game.difficulty.toLowerCase()}">${game.difficulty}</span>
                    <span class="xp-reward">+${game.xp_reward} XP</span>
                </div>
                <div class="game-actions">
                    <button class="btn btn-primary" onclick="gamesPage.viewGame(${game.id})">
                        <i class="fas fa-play"></i> Play Now
                    </button>
                    <button class="btn btn-secondary" onclick="gamesPage.viewGameDetails(${game.id})">
                        <i class="fas fa-info-circle"></i> Details
                    </button>
                </div>
            </div>
        `;
    }

    viewGame(gameId) {
        const game = this.games.find(g => g.id === gameId);
        if (!game) return;

        // For now, redirect to editor with game context
        // In production, this would launch the actual game
        window.location.href = `editor.html?game=${gameId}`;
    }

    viewGameDetails(gameId) {
        const game = this.games.find(g => g.id === gameId);
        if (!game) return;

        this.showGameModal(game);
    }

    showGameModal(game) {
        const modal = document.getElementById('gameModal');
        const title = document.getElementById('gameModalTitle');
        const description = document.getElementById('gameDescription');
        const rules = document.getElementById('gameRules');

        title.textContent = game.title;
        description.innerHTML = `<p>${game.description}</p>`;
        
        const rulesHTML = game.rules.map(rule => `<li>${rule}</li>`).join('');
        rules.innerHTML = `<ul>${rulesHTML}</ul>`;

        modal.style.display = 'block';

        // Setup modal event listeners
        document.getElementById('gameModalClose').onclick = () => {
            modal.style.display = 'none';
        };

        document.getElementById('startGameBtn').onclick = () => {
            this.viewGame(game.id);
            modal.style.display = 'none';
        };

        document.getElementById('viewLeaderboardBtn').onclick = () => {
            this.showGameLeaderboard(game.id);
            modal.style.display = 'none';
        };

        // Close modal when clicking outside
        window.onclick = (event) => {
            if (event.target === modal) {
                modal.style.display = 'none';
            }
        };
    }

    async loadLeaderboard() {
        try {
            const filter = document.getElementById('leaderboardFilter').value;
            const response = await fetch(`${this.apiBase}/games/leaderboard?period=${filter}`);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const result = await response.json();
            if (result.success) {
                this.leaderboardData = result.data;
            } else {
                // Fallback to sample data if API fails
                this.leaderboardData = this.getSampleLeaderboard();
            }
            
            this.renderLeaderboard();
        } catch (error) {
            console.error('Error loading leaderboard:', error);
            // Use sample data as fallback
            this.leaderboardData = this.getSampleLeaderboard();
            this.renderLeaderboard();
        }
    }

    getSampleLeaderboard() {
        return [
            { rank: 1, username: 'CodeMaster', xp: 2840, games_played: 45, win_rate: 89 },
            { rank: 2, username: 'DevNinja', xp: 2675, games_played: 38, win_rate: 84 },
            { rank: 3, username: 'PixelWizard', xp: 2450, games_played: 42, win_rate: 79 },
            { rank: 4, username: 'SyntaxHero', xp: 2180, games_played: 35, win_rate: 76 },
            { rank: 5, username: 'BugHunter', xp: 1950, games_played: 28, win_rate: 82 },
            { rank: 6, username: 'AlgoMaster', xp: 1720, games_played: 31, win_rate: 71 },
            { rank: 7, username: 'CodeRunner', xp: 1580, games_played: 26, win_rate: 69 },
            { rank: 8, username: 'WebDevPro', xp: 1420, games_played: 22, win_rate: 73 },
            { rank: 9, username: 'ScriptKiddie', xp: 1280, games_played: 19, win_rate: 68 },
            { rank: 10, username: 'ByteMaster', xp: 1150, games_played: 17, win_rate: 65 }
        ];
    }

    renderLeaderboard() {
        const leaderboardContent = document.getElementById('leaderboardContent');
        if (!leaderboardContent) return;

        if (this.leaderboardData.length === 0) {
            leaderboardContent.innerHTML = '<div class="no-data">No leaderboard data available.</div>';
            return;
        }

        const leaderboardHTML = `
            <div class="leaderboard-table">
                <div class="leaderboard-header">
                    <div class="rank">Rank</div>
                    <div class="username">Player</div>
                    <div class="xp">XP</div>
                    <div class="games">Games</div>
                    <div class="win-rate">Win Rate</div>
                </div>
                ${this.leaderboardData.map(player => `
                    <div class="leaderboard-row ${player.rank <= 3 ? 'top-player' : ''}">
                        <div class="rank">
                            ${player.rank === 1 ? '🥇' : player.rank === 2 ? '🥈' : player.rank === 3 ? '🥉' : player.rank}
                        </div>
                        <div class="username">${player.username}</div>
                        <div class="xp">${player.xp.toLocaleString()}</div>
                        <div class="games">${player.games_played}</div>
                        <div class="win-rate">${player.win_rate}%</div>
                    </div>
                `).join('')}
            </div>
        `;

        leaderboardContent.innerHTML = leaderboardHTML;
    }

    async loadUserStats() {
        try {
            const response = await fetch(`${this.apiBase}/games/stats`, {
                headers: {
                    'Authorization': `Bearer ${this.getAuthToken()}`
                }
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const result = await response.json();
            if (result.success) {
                this.userStats = result.data;
            } else {
                // Fallback to sample data if API fails
                this.userStats = this.getSampleUserStats();
            }
            
            this.renderUserStats();
        } catch (error) {
            console.error('Error loading user stats:', error);
            // Use sample data as fallback
            this.userStats = this.getSampleUserStats();
            this.renderUserStats();
        }
    }

    getSampleUserStats() {
        return {
            total_xp: 1250,
            games_played: 18,
            games_won: 14,
            win_rate: 78,
            best_score: 95,
            average_score: 82,
            total_playtime: 360, // minutes
            favorite_category: 'Speed Coding',
            achievements: 8,
            current_streak: 5
        };
    }

    renderUserStats() {
        const statsGrid = document.getElementById('statsGrid');
        if (!statsGrid) return;

        if (!this.userStats) {
            statsGrid.innerHTML = '<div class="no-data">Please login to view your statistics.</div>';
            return;
        }

        const statsHTML = `
            <div class="stat-card primary">
                <div class="stat-icon">🏆</div>
                <div class="stat-content">
                    <h3>Total XP</h3>
                    <div class="stat-value">${this.userStats.total_xp.toLocaleString()}</div>
                </div>
            </div>
            <div class="stat-card success">
                <div class="stat-icon">🎮</div>
                <div class="stat-content">
                    <h3>Games Played</h3>
                    <div class="stat-value">${this.userStats.games_played}</div>
                </div>
            </div>
            <div class="stat-card info">
                <div class="stat-icon">📊</div>
                <div class="stat-content">
                    <h3>Win Rate</h3>
                    <div class="stat-value">${this.userStats.win_rate}%</div>
                </div>
            </div>
            <div class="stat-card warning">
                <div class="stat-icon">⭐</div>
                <div class="stat-content">
                    <h3>Best Score</h3>
                    <div class="stat-value">${this.userStats.best_score}</div>
                </div>
            </div>
            <div class="stat-card secondary">
                <div class="stat-icon">🔥</div>
                <div class="stat-content">
                    <h3>Current Streak</h3>
                    <div class="stat-value">${this.userStats.current_streak}</div>
                </div>
            </div>
            <div class="stat-card accent">
                <div class="stat-icon">🏅</div>
                <div class="stat-content">
                    <h3>Achievements</h3>
                    <div class="stat-value">${this.userStats.achievements}</div>
                </div>
            </div>
        `;

        statsGrid.innerHTML = statsHTML;
    }

    showGameLeaderboard(gameId) {
        // This would show a specific game's leaderboard
        // For now, just scroll to the main leaderboard
        document.querySelector('.leaderboard-section').scrollIntoView({ behavior: 'smooth' });
    }

    setupEventListeners() {
        // Category tabs
        document.querySelectorAll('.category-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                const category = e.target.dataset.category;
                this.switchCategory(category);
            });
        });

        // Leaderboard filter
        document.getElementById('leaderboardFilter').addEventListener('change', () => {
            this.loadLeaderboard();
        });

        // Mobile navigation toggle
        const navToggle = document.querySelector('.nav-toggle');
        const navMenu = document.querySelector('.nav-menu');
        
        if (navToggle && navMenu) {
            navToggle.addEventListener('click', () => {
                navMenu.classList.toggle('active');
            });
        }
    }

    switchCategory(category) {
        // Update active tab
        document.querySelectorAll('.category-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.category === category);
        });

        this.currentCategory = category;
        this.renderGames();
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
                page: 'games',
                category: this.currentCategory,
                availableGames: this.games.filter(g => g.category === this.currentCategory).map(g => g.title)
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
                ${response.suggestions ? `
                    <div class="ai-suggestions">
                        <h4>Suggestions:</h4>
                        <ul>
                            ${response.suggestions.map(suggestion => `<li>${suggestion}</li>`).join('')}
                        </ul>
                    </div>
                ` : ''}
            </div>
        `;
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

// Initialize games page when page loads
let gamesPage;
document.addEventListener('DOMContentLoaded', () => {
    gamesPage = new GamesPage();
});
