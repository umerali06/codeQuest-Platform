// CodeQuest Games - Optimized JavaScript
// Performance-optimized games page with lazy loading and simplified functionality

class OptimizedGamesPage {
    constructor() {
        this.games = [];
        this.currentCategory = 'all';
        this.leaderboardData = [];
        this.userStats = null;
        this.isLoading = false;
        this.observer = null;
        
        this.init();
    }

    async init() {
        try {
            this.setupEventListeners();
            this.setupCategoryTabs();
            this.loadDataAsync();
            console.log('Optimized games page initialized');
        } catch (error) {
            console.error('Failed to initialize games page:', error);
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

    generateMockGames() {
        const categories = ['speed', 'bugfix', 'memory', 'puzzle', 'algorithm'];
        const games = [];
        for (let i = 1; i <= 12; i++) {
            games.push({
                id: i,
                title: `Coding Game ${i}`,
                description: 'A challenging coding game that tests your programming skills.',
                category: categories[i % categories.length],
                difficulty: ['Easy', 'Medium', 'Hard'][i % 3],
                players: Math.floor(Math.random() * 1000) + 100,
                rating: (Math.random() * 2 + 3).toFixed(1),
                icon: ['⚡', '🐛', '🧠', '🧩', '📊'][i % 5]
            });
        }
        return games;
    }

    switchCategory(category) {
        this.currentCategory = category;
        this.renderGames();
        const tabs = document.querySelectorAll('.category-tab');
        tabs.forEach(tab => tab.classList.toggle('active', tab.dataset.category === category));
    }

    createGameCard(game) {
        return `<div class="game-card">
            <div class="game-image">${game.icon}</div>
            <h3 class="game-title">${game.title}</h3>
            <p class="game-description">${game.description}</p>
            <div class="game-stats">
                <span class="game-stat">${game.difficulty}</span>
                <span class="game-stat">⭐ ${game.rating}</span>
            </div>
        </div>`;
    }

    async loadDataAsync() {
        await this.loadGames();
        Promise.all([this.loadLeaderboard(), this.loadUserStats()]);
    }

    async loadGames() {
        this.games = this.generateMockGames();
        this.renderGames();
    }

    renderGames() {
        const gamesGrid = document.getElementById('gamesGrid');
        if (!gamesGrid) return;
        
        const filteredGames = this.currentCategory === 'all' 
            ? this.games 
            : this.games.filter(g => g.category === this.currentCategory);
        
        if (filteredGames.length === 0) {
            gamesGrid.innerHTML = '<div class="no-games">No games in this category.</div>';
            return;
        }
        
        const gamesHTML = filteredGames.map(game => this.createGameCard(game)).join('');
        gamesGrid.innerHTML = gamesHTML;
    }

    async loadLeaderboard() {
        this.leaderboardData = [];
        this.renderLeaderboard();
    }

    async loadUserStats() {
        this.userStats = { gamesPlayed: 25, totalScore: 15000, averageScore: 600, rank: 150 };
        this.renderUserStats();
    }

    renderLeaderboard() {
        const content = document.getElementById('leaderboardContent');
        if (content) content.innerHTML = '<p>Leaderboard data will be loaded here.</p>';
    }

    renderUserStats() {
        const grid = document.getElementById('statsGrid');
        if (grid) grid.innerHTML = '<div class="stat-card"><div class="stat-number">25</div><div class="stat-label">Games Played</div></div>';
    }
}

// Global functions for HTML onclick handlers
function showLogin() {
    alert('Login functionality will be implemented here.');
}

function showSignup() {
    alert('Signup functionality will be implemented here.');
}

function logout() {
    alert('Logout functionality will be implemented here.');
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new OptimizedGamesPage();
});
