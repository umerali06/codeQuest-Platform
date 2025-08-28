// CodeQuest Games - API-Driven JavaScript
// Loads games data from the Appwrite database

class GamesPage {
    constructor() {
        this.games = [];
        this.currentCategory = 'all';
        this.isLoading = false;
        this.apiBase = 'http://localhost:8000/api';
        
        this.init();
    }

    async init() {
        try {
            this.setupEventListeners();
            this.setupCategoryTabs();
            await this.loadGamesFromAPI();
            console.log('Games page initialized with API data');
        } catch (error) {
            console.error('Failed to initialize games page:', error);
            this.showError('Failed to load games. Please check your connection.');
        }
    }

    setupEventListeners() {
        const categoryTabs = document.querySelectorAll('.category-tab');
        categoryTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                this.switchCategory(tab.dataset.category);
            });
        });
    }

    setupCategoryTabs() {
        const categoryTabs = document.querySelectorAll('.category-tab');
        categoryTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                // Remove active class from all tabs
                categoryTabs.forEach(t => t.classList.remove('active'));
                // Add active class to clicked tab
                tab.classList.add('active');
                // Switch category
                this.switchCategory(tab.dataset.category);
            });
        });
    }

    async loadGamesFromAPI() {
        try {
            this.setLoading(true);
            
            const response = await fetch(`${this.apiBase}/games`);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const result = await response.json();
            if (result.success) {
                this.games = result.data;
                this.renderGames();
                console.log('Games loaded from API:', this.games);
            } else {
                throw new Error(result.message || 'Failed to load games');
            }
        } catch (error) {
            console.error('Error loading games from API:', error);
            this.showError('Failed to load games from the server. Using sample data instead.');
            // Fallback to sample data
            this.games = this.getSampleGames();
            this.renderGames();
        } finally {
            this.setLoading(false);
        }
    }

    async loadGamesByCategory(category) {
        try {
            this.setLoading(true);
            
            const response = await fetch(`${this.apiBase}/games?category=${category}`);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const result = await response.json();
            if (result.success) {
                return result.data;
            } else {
                throw new Error(result.message || 'Failed to load games by category');
            }
        } catch (error) {
            console.error('Error loading games by category:', error);
            // Fallback to filtering local games
            return this.games.filter(game => game.category === category);
        } finally {
            this.setLoading(false);
        }
        return [];
    }

    switchCategory(category) {
        this.currentCategory = category;
        this.renderGames();
        
        // Update active tab
        const tabs = document.querySelectorAll('.category-tab');
        tabs.forEach(tab => {
            tab.classList.toggle('active', tab.dataset.category === category);
        });
    }

    renderGames() {
        const gamesGrid = document.getElementById('gamesGrid');
        const noGames = document.getElementById('noGames');
        
        if (!gamesGrid) return;
        
        let gamesToShow = this.games;
        
        // Filter by category if not 'all'
        if (this.currentCategory !== 'all') {
            gamesToShow = this.games.filter(game => game.category === this.currentCategory);
        }
        
        if (gamesToShow.length === 0) {
            gamesGrid.style.display = 'none';
            if (noGames) noGames.style.display = 'block';
            return;
        }
        
        // Show games grid, hide no games message
        gamesGrid.style.display = 'grid';
        if (noGames) noGames.style.display = 'none';
        
        const gamesHTML = gamesToShow.map(game => this.createGameCard(game)).join('');
        gamesGrid.innerHTML = gamesHTML;
        
        // Add click handlers to game cards
        this.addGameCardEventListeners();
    }

    createGameCard(game) {
        return `
            <div class="game-card" data-game-id="${game.id}" data-category="${game.category}">
                <div class="game-image">${game.icon}</div>
                <div class="game-content">
                    <h3 class="game-title">${game.title}</h3>
                    <p class="game-description">${game.description}</p>
                    <div class="game-stats">
                        <span class="game-stat difficulty ${game.difficulty.toLowerCase()}">${game.difficulty}</span>
                        <span class="game-stat rating">⭐ ${game.rating}</span>
                        <span class="game-stat players">👥 ${this.formatNumber(game.players)}</span>
                    </div>
                    <div class="game-actions">
                        <button class="btn btn-primary btn-small" onclick="gamesPage.playGame('${game.id}')">
                            Play Now
                        </button>
                        <button class="btn btn-secondary btn-small" onclick="gamesPage.showGameDetails('${game.id}')">
                            Details
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    addGameCardEventListeners() {
        const gameCards = document.querySelectorAll('.game-card');
        gameCards.forEach(card => {
            card.addEventListener('click', (e) => {
                // Don't trigger if clicking on buttons
                if (e.target.tagName === 'BUTTON') return;
                
                const gameId = card.dataset.gameId;
                this.showGameDetails(gameId);
            });
        });
    }

    playGame(gameId) {
        const game = this.games.find(g => g.id === gameId);
        if (game) {
            console.log('Starting game:', game.title);
            // Store game info in localStorage for the game page
            localStorage.setItem('codequest_current_game', JSON.stringify(game));
            
            // Launch the actual game
            window.location.href = 'game-player.html';
        }
    }

    showGameDetails(gameId) {
        const game = this.games.find(g => g.id === gameId);
        if (game) {
            const details = `
Game: ${game.title}
Category: ${game.category}
Difficulty: ${game.difficulty}
Rating: ⭐ ${game.rating}
Players: ${this.formatNumber(game.players)}
Time Limit: ${Math.floor(game.time_limit / 60)} minutes
Max Score: ${game.max_score}

Description: ${game.description}

Instructions: ${game.instructions}
            `;
            
            alert(details);
        }
    }

    resetFilters() {
        this.currentCategory = 'all';
        this.renderGames();
        
        // Reset active tab
        const tabs = document.querySelectorAll('.category-tab');
        tabs.forEach(tab => {
            tab.classList.toggle('active', tab.dataset.category === 'all');
        });
    }

    setLoading(loading) {
        this.isLoading = loading;
        const gamesGrid = document.getElementById('gamesGrid');
        
        if (loading) {
            gamesGrid.innerHTML = `
                <div class="game-card loading-placeholder">
                    <div class="game-image-placeholder"></div>
                    <div class="game-content">
                        <div class="game-title-placeholder"></div>
                        <div class="game-description-placeholder"></div>
                        <div class="game-stats-placeholder"></div>
                    </div>
                </div>
                <div class="game-card loading-placeholder">
                    <div class="game-image-placeholder"></div>
                    <div class="game-content">
                        <div class="game-title-placeholder"></div>
                        <div class="game-description-placeholder"></div>
                        <div class="game-stats-placeholder"></div>
                    </div>
                </div>
                <div class="game-card loading-placeholder">
                    <div class="game-image-placeholder"></div>
                    <div class="game-content">
                        <div class="game-title-placeholder"></div>
                        <div class="game-description-placeholder"></div>
                        <div class="game-stats-placeholder"></div>
                    </div>
                </div>
            `;
        }
    }

    showError(message) {
        const gamesGrid = document.getElementById('gamesGrid');
        if (gamesGrid) {
            gamesGrid.innerHTML = `
                <div class="error-message">
                    <p>❌ ${message}</p>
                    <button class="btn btn-primary" onclick="gamesPage.loadGamesFromAPI()">Retry</button>
                </div>
            `;
        }
    }

    formatNumber(num) {
        if (num >= 1000000) {
            return (num / 1000000).toFixed(1) + 'M';
        } else if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'K';
        }
        return num.toString();
    }

    // Fallback sample games (used if API fails)
    getSampleGames() {
        return [
            {
                'id': 'speed-coding-1',
                'title': 'Speed Coding Challenge',
                'description': 'Complete coding challenges as fast as possible. Race against the clock and other players!',
                'category': 'speed',
                'difficulty': 'Medium',
                'players': 1250,
                'rating': 4.2,
                'icon': '⚡',
                'game_url': '#',
                'instructions': 'Write code quickly to solve the given problem within the time limit.',
                'max_score': 1000,
                'time_limit': 300
            },
            {
                'id': 'bug-hunt-1',
                'title': 'Bug Hunter',
                'description': 'Find and fix bugs in the provided code. Test your debugging skills!',
                'category': 'bugfix',
                'difficulty': 'Hard',
                'players': 890,
                'rating': 4.5,
                'icon': '🐛',
                'game_url': '#',
                'instructions': 'Identify and fix all bugs in the code to make it work correctly.',
                'max_score': 1000,
                'time_limit': 600
            },
            {
                'id': 'memory-game-1',
                'title': 'Code Memory',
                'description': 'Test your memory by remembering code patterns and sequences.',
                'category': 'memory',
                'difficulty': 'Easy',
                'players': 2100,
                'rating': 4.0,
                'icon': '🧠',
                'game_url': '#',
                'instructions': 'Memorize the code pattern and reproduce it correctly.',
                'max_score': 1000,
                'time_limit': 180
            },
            {
                'id': 'code-puzzle-1',
                'title': 'Code Puzzle',
                'description': 'Solve complex coding puzzles that require creative thinking.',
                'category': 'puzzle',
                'difficulty': 'Hard',
                'players': 750,
                'rating': 4.7,
                'icon': '🧩',
                'game_url': '#',
                'instructions': 'Think outside the box to solve these challenging coding puzzles.',
                'max_score': 1000,
                'time_limit': 900
            },
            {
                'id': 'algorithm-race-1',
                'title': 'Algorithm Race',
                'description': 'Optimize algorithms for speed and efficiency. Compete for the best solution!',
                'category': 'algorithm',
                'difficulty': 'Expert',
                'players': 450,
                'rating': 4.8,
                'icon': '📊',
                'game_url': '#',
                'instructions': 'Write the most efficient algorithm to solve the given problem.',
                'max_score': 1000,
                'time_limit': 1200
            },
            {
                'id': 'speed-coding-2',
                'title': 'Quick HTML Builder',
                'description': 'Build HTML structures quickly under time pressure.',
                'category': 'speed',
                'difficulty': 'Easy',
                'players': 1800,
                'rating': 4.1,
                'icon': '⚡',
                'game_url': '#',
                'instructions': 'Create HTML markup as fast as possible while maintaining quality.',
                'max_score': 1000,
                'time_limit': 240
            }
        ];
    }
}

// Initialize games page when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    window.gamesPage = new GamesPage();
});
