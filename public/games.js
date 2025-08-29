// Enhanced CodeQuest Games - Full Database Integration
// Professional games system with sessions, leaderboards, and achievements

class GamesPage {
  constructor() {
    this.games = [];
    this.currentCategory = "all";
    this.isLoading = false;
    this.apiBase = window.location.origin.includes("localhost")
      ? "http://localhost:8000/api"
      : "/api";
    this.user = null;
    this.leaderboardData = {};
    this.userStats = null;

    this.init();
  }

  async init() {
    try {
      this.setupEventListeners();
      this.setupCategoryTabs();
      this.setupAuthStateListener();
      await this.checkAuthentication();
      await this.loadGamesFromAPI();
      await this.loadLeaderboard();
      await this.loadUserStatistics();
      console.log("Games page initialized successfully");
    } catch (error) {
      console.error("Failed to initialize games page:", error);
      this.showError("Failed to load games. Please refresh the page.");
    }
  }

  async checkAuthentication() {
    try {
      // First, check if AuthManager is available and has a current user
      if (window.AuthManager && window.AuthManager.currentUser) {
        console.log(
          "✅ Found user via AuthManager:",
          window.AuthManager.currentUser.name ||
            window.AuthManager.currentUser.email
        );
        this.user = window.AuthManager.currentUser;
        this.updateAuthUI();
        return;
      }

      // Second, check the main app's user storage (same as main.js)
      const storedUser =
        JSON.parse(localStorage.getItem("codequest_user")) || null;

      if (storedUser) {
        console.log(
          "✅ Found user in main app storage:",
          storedUser.name || storedUser.email
        );
        this.user = storedUser;
        this.updateAuthUI();
        return;
      }

      // Third, check global currentUser variable (from main.js)
      if (window.currentUser) {
        console.log(
          "✅ Found user in global variable:",
          window.currentUser.username || window.currentUser.email
        );
        this.user = window.currentUser;
        this.updateAuthUI();
        return;
      }

      console.log("❌ No user found in any storage location");
      this.user = null;
      this.updateAuthUI();
    } catch (error) {
      console.error("❌ Authentication check failed:", error);
      this.user = null;
      this.updateAuthUI();
    }
  }

  // Setup auth state listener to sync with main auth system
  setupAuthStateListener() {
    // Listen for AuthManager auth state changes
    if (
      window.AuthManager &&
      typeof window.AuthManager.onAuthStateChange === "function"
    ) {
      window.AuthManager.onAuthStateChange((user) => {
        console.log(
          "🔄 Auth state changed in games page:",
          user ? user.name || user.email : "null"
        );
        this.user = user;
        this.updateAuthUI();
      });
    }

    // Listen for localStorage changes (cross-tab sync)
    window.addEventListener("storage", (e) => {
      if (e.key === "codequest_user") {
        if (e.newValue) {
          const user = JSON.parse(e.newValue);
          console.log(
            "🔄 User updated via storage event:",
            user.name || user.email
          );
          this.user = user;
        } else {
          console.log("🔄 User cleared via storage event");
          this.user = null;
        }
        this.updateAuthUI();
      }
    });

    // Listen for global currentUser changes
    let lastCurrentUser = window.currentUser;
    setInterval(() => {
      if (window.currentUser !== lastCurrentUser) {
        console.log(
          "🔄 Global currentUser changed:",
          window.currentUser
            ? window.currentUser.username || window.currentUser.email
            : "null"
        );
        lastCurrentUser = window.currentUser;
        this.user = window.currentUser;
        this.updateAuthUI();
      }
    }, 1000);
  }

  setupEventListeners() {
    // Category tabs
    const categoryTabs = document.querySelectorAll(".category-tab");
    categoryTabs.forEach((tab) => {
      tab.addEventListener("click", () => {
        this.switchCategory(tab.dataset.category);
      });
    });

    // Leaderboard filter
    const leaderboardFilter = document.getElementById("leaderboardFilter");
    if (leaderboardFilter) {
      leaderboardFilter.addEventListener("change", () => {
        this.loadLeaderboard(leaderboardFilter.value);
      });
    }

    // Search functionality (if you want to add it)
    this.setupSearch();
  }

  setupSearch() {
    // Add search input to the page if needed
    const searchInput = document.createElement("input");
    searchInput.type = "text";
    searchInput.placeholder = "Search games...";
    searchInput.className = "game-search";
    searchInput.addEventListener("input", (e) => {
      this.filterGames(e.target.value);
    });

    // Insert search input before games grid
    const gamesGrid = document.getElementById("gamesGrid");
    if (gamesGrid && gamesGrid.parentNode) {
      gamesGrid.parentNode.insertBefore(searchInput, gamesGrid);
    }
  }

  setupCategoryTabs() {
    const categoryTabs = document.querySelectorAll(".category-tab");
    categoryTabs.forEach((tab) => {
      tab.addEventListener("click", () => {
        // Remove active class from all tabs
        categoryTabs.forEach((t) => t.classList.remove("active"));
        // Add active class to clicked tab
        tab.classList.add("active");
      });
    });
  }

  async loadGamesFromAPI() {
    try {
      this.setLoading(true);

      let url = `${this.apiBase}/games`;
      if (this.currentCategory !== "all") {
        url += `?category=${this.currentCategory}`;
      }

      const headers = {};
      if (this.user) {
        const token =
          localStorage.getItem("auth_token") ||
          sessionStorage.getItem("auth_token");
        headers["Authorization"] = `Bearer ${token}`;
      }

      const response = await fetch(url, { headers });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      // Read response as text first to avoid "body stream already read" error
      const responseText = await response.text();

      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        console.error("Non-JSON response:", responseText.substring(0, 500));
        throw new Error(
          "Server returned HTML instead of JSON. Check API routing."
        );
      }

      let result;
      try {
        result = JSON.parse(responseText);
      } catch (jsonError) {
        console.error("JSON parse error:", jsonError);
        console.error("Response text:", responseText.substring(0, 500));
        throw new Error("Invalid JSON response from server");
      }
      if (result.success) {
        this.games = result.data;
        this.renderGames();
        console.log("Games loaded from API:", this.games.length, "games");
      } else {
        throw new Error(result.error || "Failed to load games");
      }
    } catch (error) {
      console.error("Error loading games from API:", error);

      // Fallback to sample data if API fails
      console.log("Loading fallback sample games...");
      this.games = this.getSampleGames();
      this.renderGames();

      this.showError(
        "Using sample games data. API connection failed: " + error.message
      );
    } finally {
      this.setLoading(false);
    }
  }

  async switchCategory(category) {
    this.currentCategory = category;
    await this.loadGamesFromAPI();

    // Update active tab
    const tabs = document.querySelectorAll(".category-tab");
    tabs.forEach((tab) => {
      tab.classList.toggle("active", tab.dataset.category === category);
    });
  }

  filterGames(searchTerm) {
    const filteredGames = this.games.filter(
      (game) =>
        game.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        game.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        game.tags.some((tag) =>
          tag.toLowerCase().includes(searchTerm.toLowerCase())
        )
    );
    this.renderFilteredGames(filteredGames);
  }

  renderGames() {
    this.renderFilteredGames(this.games);
  }

  renderFilteredGames(gamesToShow) {
    const gamesGrid = document.getElementById("gamesGrid");
    const noGames = document.getElementById("noGames");

    if (!gamesGrid) return;

    if (gamesToShow.length === 0) {
      gamesGrid.style.display = "none";
      if (noGames) noGames.style.display = "block";
      return;
    }

    // Show games grid, hide no games message
    gamesGrid.style.display = "grid";
    if (noGames) noGames.style.display = "none";

    const gamesHTML = gamesToShow
      .map((game) => this.createGameCard(game))
      .join("");
    gamesGrid.innerHTML = gamesHTML;

    // Add click handlers to game cards
    this.addGameCardEventListeners();
  }

  createGameCard(game) {
    const userProgress = game.user_progress || {};
    const hasPlayed = userProgress.total_plays > 0;

    return `
            <div class="game-card ${
              game.featured ? "featured" : ""
            }" data-game-id="${game.id}" data-category="${game.category}">
                ${
                  game.featured
                    ? '<div class="featured-badge">Featured</div>'
                    : ""
                }
                <div class="game-image">${game.icon}</div>
                <div class="game-content">
                    <h3 class="game-title">${game.title}</h3>
                    <p class="game-description">${game.description}</p>
                    <div class="game-stats">
                        <span class="game-stat difficulty ${game.difficulty.toLowerCase()}">${
      game.difficulty
    }</span>
                        <span class="game-stat rating">⭐ ${game.average_rating.toFixed(
                          1
                        )}</span>
                        <span class="game-stat players">👥 ${this.formatNumber(
                          game.statistics.unique_players
                        )}</span>
                        <span class="game-stat time">⏱️ ${Math.floor(
                          game.time_limit / 60
                        )}m</span>
                    </div>
                    ${
                      hasPlayed
                        ? `
                        <div class="user-progress">
                            <div class="progress-item">
                                <span class="progress-label">Best Score:</span>
                                <span class="progress-value">${userProgress.best_score}</span>
                            </div>
                            <div class="progress-item">
                                <span class="progress-label">Rank:</span>
                                <span class="progress-value">#${userProgress.rank}</span>
                            </div>
                            <div class="progress-item">
                                <span class="progress-label">Plays:</span>
                                <span class="progress-value">${userProgress.total_plays}</span>
                            </div>
                        </div>
                    `
                        : ""
                    }
                    <div class="game-actions">
                        <button class="btn btn-primary btn-small" onclick="gamesPage.playGame('${
                          game.id
                        }')">
                            ${hasPlayed ? "Play Again" : "Play Now"}
                        </button>
                        <button class="btn btn-secondary btn-small" onclick="gamesPage.showGameDetails('${
                          game.id
                        }')">
                            Details
                        </button>
                        <button class="btn btn-outline btn-small" onclick="gamesPage.showLeaderboard('${
                          game.id
                        }')">
                            Leaderboard
                        </button>
                    </div>
                </div>
            </div>
        `;
  }

  addGameCardEventListeners() {
    const gameCards = document.querySelectorAll(".game-card");
    gameCards.forEach((card) => {
      card.addEventListener("click", (e) => {
        // Don't trigger if clicking on buttons
        if (e.target.tagName === "BUTTON") return;

        const gameId = card.dataset.gameId;
        this.showGameDetails(gameId);
      });
    });
  }

  async playGame(gameId) {
    if (!this.user) {
      alert("Please log in to play games!");
      return;
    }

    const game = this.games.find((g) => g.id === gameId);
    if (!game) {
      alert("Game not found!");
      return;
    }

    try {
      // Start a new game session
      const token =
        localStorage.getItem("auth_token") ||
        sessionStorage.getItem("auth_token");
      const response = await fetch(`${this.apiBase}/games/start`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ game_id: gameId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to start game");
      }

      const result = await response.json();

      // Store session info and game data
      localStorage.setItem(
        "codequest_game_session",
        JSON.stringify(result.session)
      );
      localStorage.setItem("codequest_current_game", JSON.stringify(game));

      // Launch the game based on its type
      this.launchGame(game);
    } catch (error) {
      console.error("Error starting game:", error);
      alert("Failed to start game: " + error.message);
    }
  }

  launchGame(game) {
    // Save game data to sessionStorage for the editor
    sessionStorage.setItem("current_game", JSON.stringify(game));

    // All games now redirect to the editor with game mode
    window.location.href = `editor.html?game=${game.slug}`;
  }

  showGameDetails(gameId) {
    const game = this.games.find((g) => g.id === gameId);
    if (!game) return;

    const userProgress = game.user_progress || {};
    const hasPlayed = userProgress.total_plays > 0;

    const modal = document.createElement("div");
    modal.className = "game-details-modal";
    modal.innerHTML = `
            <div class="modal-overlay" onclick="this.parentElement.remove()"></div>
            <div class="modal-content">
                <div class="modal-header">
                    <h2>${game.icon} ${game.title}</h2>
                    <button class="modal-close" onclick="this.closest('.game-details-modal').remove()">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="game-info">
                        <p class="game-description">${game.description}</p>
                        <div class="game-meta">
                            <div class="meta-item">
                                <strong>Category:</strong> ${game.category}
                            </div>
                            <div class="meta-item">
                                <strong>Difficulty:</strong> ${game.difficulty}
                            </div>
                            <div class="meta-item">
                                <strong>Time Limit:</strong> ${Math.floor(
                                  game.time_limit / 60
                                )} minutes
                            </div>
                            <div class="meta-item">
                                <strong>Max Score:</strong> ${game.max_score}
                            </div>
                            <div class="meta-item">
                                <strong>XP Reward:</strong> ${game.xp_reward}
                            </div>
                            <div class="meta-item">
                                <strong>Rating:</strong> ⭐ ${game.average_rating.toFixed(
                                  1
                                )} (${game.statistics.unique_players} players)
                            </div>
                        </div>
                        ${
                          hasPlayed
                            ? `
                            <div class="user-stats">
                                <h3>Your Progress</h3>
                                <div class="stats-grid">
                                    <div class="stat-item">
                                        <span class="stat-value">${userProgress.best_score}</span>
                                        <span class="stat-label">Best Score</span>
                                    </div>
                                    <div class="stat-item">
                                        <span class="stat-value">#${userProgress.rank}</span>
                                        <span class="stat-label">Rank</span>
                                    </div>
                                    <div class="stat-item">
                                        <span class="stat-value">${userProgress.total_plays}</span>
                                        <span class="stat-label">Times Played</span>
                                    </div>
                                    <div class="stat-item">
                                        <span class="stat-value">${userProgress.achievements_earned}</span>
                                        <span class="stat-label">Achievements</span>
                                    </div>
                                </div>
                            </div>
                        `
                            : ""
                        }
                        <div class="game-instructions">
                            <h3>How to Play</h3>
                            <p>${game.instructions}</p>
                        </div>
                        <div class="game-tags">
                            ${game.tags
                              .map((tag) => `<span class="tag">${tag}</span>`)
                              .join("")}
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-primary" onclick="gamesPage.playGame('${
                      game.id
                    }'); this.closest('.game-details-modal').remove();">
                        ${hasPlayed ? "Play Again" : "Start Playing"}
                    </button>
                    <button class="btn btn-secondary" onclick="gamesPage.showLeaderboard('${
                      game.id
                    }')">
                        View Leaderboard
                    </button>
                </div>
            </div>
        `;

    document.body.appendChild(modal);
  }

  async showLeaderboard(gameId) {
    try {
      const response = await fetch(
        `${this.apiBase}/games/leaderboard?game_id=${gameId}&limit=20`
      );
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Failed to load leaderboard");
      }

      const game = this.games.find((g) => g.id === gameId);
      const modal = document.createElement("div");
      modal.className = "leaderboard-modal";
      modal.innerHTML = `
                <div class="modal-overlay" onclick="this.parentElement.remove()"></div>
                <div class="modal-content">
                    <div class="modal-header">
                        <h2>🏆 ${game ? game.title : "Game"} Leaderboard</h2>
                        <button class="modal-close" onclick="this.closest('.leaderboard-modal').remove()">&times;</button>
                    </div>
                    <div class="modal-body">
                        <div class="leaderboard-list">
                            ${
                              result.leaderboard.length > 0
                                ? result.leaderboard
                                    .map(
                                      (entry, index) => `
                                <div class="leaderboard-entry ${
                                  index < 3 ? "top-three" : ""
                                }">
                                    <div class="rank">${this.getRankIcon(
                                      entry.rank
                                    )}${entry.rank}</div>
                                    <div class="username">${
                                      entry.username
                                    }</div>
                                    <div class="score">${entry.score}</div>
                                    <div class="time">${this.formatTime(
                                      entry.time
                                    )}</div>
                                    <div class="achievements">${
                                      entry.achievements
                                    } 🏆</div>
                                </div>
                            `
                                    )
                                    .join("")
                                : '<p class="no-scores">No scores yet. Be the first to play!</p>'
                            }
                        </div>
                    </div>
                </div>
            `;

      document.body.appendChild(modal);
    } catch (error) {
      console.error("Error loading leaderboard:", error);
      alert("Failed to load leaderboard: " + error.message);
    }
  }

  async loadLeaderboard(timeframe = "all") {
    try {
      const leaderboardContent = document.getElementById("leaderboardContent");
      if (!leaderboardContent) return;

      leaderboardContent.innerHTML =
        '<div class="loading">Loading leaderboard...</div>';

      // Load global leaderboard (you might want to implement this endpoint)
      const response = await fetch(
        `${this.apiBase}/leaderboard?timeframe=${timeframe}&limit=10`
      );

      if (response.ok) {
        const result = await response.json();
        this.renderLeaderboard(result.leaderboard || []);
      } else {
        leaderboardContent.innerHTML =
          '<div class="error">Failed to load leaderboard</div>';
      }
    } catch (error) {
      console.error("Error loading leaderboard:", error);
      const leaderboardContent = document.getElementById("leaderboardContent");
      if (leaderboardContent) {
        leaderboardContent.innerHTML =
          '<div class="error">Failed to load leaderboard</div>';
      }
    }
  }

  renderLeaderboard(leaderboard) {
    const leaderboardContent = document.getElementById("leaderboardContent");
    if (!leaderboardContent) return;

    if (leaderboard.length === 0) {
      leaderboardContent.innerHTML =
        '<div class="no-data">No leaderboard data available</div>';
      return;
    }

    const leaderboardHTML = leaderboard
      .map(
        (entry, index) => `
            <div class="leaderboard-entry ${index < 3 ? "top-three" : ""}">
                <div class="rank">${this.getRankIcon(index + 1)}${
          index + 1
        }</div>
                <div class="username">${entry.username}</div>
                <div class="total-xp">${entry.total_xp} XP</div>
                <div class="games-played">${entry.games_played} games</div>
            </div>
        `
      )
      .join("");

    leaderboardContent.innerHTML = leaderboardHTML;
  }

  async loadUserStatistics() {
    if (!this.user) return;

    try {
      const statsGrid = document.getElementById("statsGrid");
      if (!statsGrid) return;

      const token =
        localStorage.getItem("auth_token") ||
        sessionStorage.getItem("auth_token");
      const response = await fetch(`${this.apiBase}/games/statistics`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const result = await response.json();
        this.userStats = result.statistics;
        this.renderUserStatistics();
      } else {
        statsGrid.innerHTML =
          '<div class="error">Failed to load statistics</div>';
      }
    } catch (error) {
      console.error("Error loading user statistics:", error);
    }
  }

  renderUserStatistics() {
    const statsGrid = document.getElementById("statsGrid");
    if (!statsGrid || !this.userStats) return;

    const stats = this.userStats.overview;
    const statsHTML = `
            <div class="stat-card">
                <div class="stat-icon">🎮</div>
                <div class="stat-content">
                    <div class="stat-value">${stats.games_played}</div>
                    <div class="stat-label">Games Played</div>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon">🎯</div>
                <div class="stat-content">
                    <div class="stat-value">${stats.best_score}</div>
                    <div class="stat-label">Best Score</div>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon">⭐</div>
                <div class="stat-content">
                    <div class="stat-value">${stats.total_xp}</div>
                    <div class="stat-label">Total XP</div>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon">🏆</div>
                <div class="stat-content">
                    <div class="stat-value">${stats.achievements}</div>
                    <div class="stat-label">Achievements</div>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon">💯</div>
                <div class="stat-content">
                    <div class="stat-value">${stats.perfect_scores}</div>
                    <div class="stat-label">Perfect Scores</div>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon">⏱️</div>
                <div class="stat-content">
                    <div class="stat-value">${this.formatTime(
                      stats.average_time
                    )}</div>
                    <div class="stat-label">Avg. Time</div>
                </div>
            </div>
        `;

    statsGrid.innerHTML = statsHTML;
  }

  // Utility functions
  getRankIcon(rank) {
    switch (rank) {
      case 1:
        return "🥇 ";
      case 2:
        return "🥈 ";
      case 3:
        return "🥉 ";
      default:
        return "";
    }
  }

  formatTime(seconds) {
    if (!seconds) return "0s";
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return minutes > 0
      ? `${minutes}m ${remainingSeconds}s`
      : `${remainingSeconds}s`;
  }

  formatNumber(num) {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + "M";
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + "K";
    }
    return num.toString();
  }

  resetFilters() {
    this.currentCategory = "all";
    this.loadGamesFromAPI();

    // Reset active tab
    const tabs = document.querySelectorAll(".category-tab");
    tabs.forEach((tab) => {
      tab.classList.toggle("active", tab.dataset.category === "all");
    });
  }

  setLoading(loading) {
    this.isLoading = loading;
    const gamesGrid = document.getElementById("gamesGrid");

    if (loading && gamesGrid) {
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
    const gamesGrid = document.getElementById("gamesGrid");
    if (gamesGrid) {
      gamesGrid.innerHTML = `
                <div class="error-message">
                    <div class="error-icon">❌</div>
                    <h3>Oops! Something went wrong</h3>
                    <p>${message}</p>
                    <button class="btn btn-primary" onclick="gamesPage.loadGamesFromAPI()">Try Again</button>
                </div>
            `;
    }
  }

  // Fallback sample games that match the database structure
  getSampleGames() {
    return [
      {
        id: "css-selector-master",
        slug: "css-selector-master",
        title: "CSS Selector Master",
        description:
          "Master CSS selectors by selecting the correct elements on the page. Test your knowledge of basic to advanced CSS selectors.",
        instructions:
          "Look at the highlighted elements and write the CSS selector that would select them.",
        category: "puzzle",
        difficulty: "medium",
        icon: "🎯",
        game_type: "interactive",
        max_score: 1000,
        time_limit: 300,
        xp_reward: 75,
        min_level: 1,
        tags: ["css", "selectors", "web-development"],
        featured: true,
        play_count: 1250,
        average_rating: 4.5,
        statistics: {
          total_plays: 1250,
          unique_players: 890,
          average_score: 750,
          completion_rate: 85,
        },
        user_progress: {
          best_score: 0,
          total_plays: 0,
          rank: 0,
          achievements_earned: 0,
        },
      },
      {
        id: "javascript-debug-hunt",
        slug: "javascript-debug-hunt",
        title: "JavaScript Debug Hunt",
        description:
          "Find and fix bugs in JavaScript code. Sharpen your debugging skills with real-world scenarios.",
        instructions:
          "Each level presents buggy JavaScript code. Find the bugs and fix them.",
        category: "bugfix",
        difficulty: "hard",
        icon: "🐛",
        game_type: "coding",
        max_score: 1500,
        time_limit: 600,
        xp_reward: 100,
        min_level: 3,
        tags: ["javascript", "debugging", "problem-solving"],
        featured: true,
        play_count: 890,
        average_rating: 4.7,
        statistics: {
          total_plays: 890,
          unique_players: 650,
          average_score: 900,
          completion_rate: 70,
        },
        user_progress: {
          best_score: 0,
          total_plays: 0,
          rank: 0,
          achievements_earned: 0,
        },
      },
      {
        id: "html-speed-builder",
        slug: "html-speed-builder",
        title: "HTML Speed Builder",
        description:
          "Build HTML structures as fast as possible. Race against time to create semantic, valid HTML.",
        instructions: "Write HTML code as quickly and accurately as possible.",
        category: "speed",
        difficulty: "easy",
        icon: "⚡",
        game_type: "coding",
        max_score: 800,
        time_limit: 180,
        xp_reward: 50,
        min_level: 1,
        tags: ["html", "speed", "semantic-markup"],
        featured: false,
        play_count: 1800,
        average_rating: 4.2,
        statistics: {
          total_plays: 1800,
          unique_players: 1200,
          average_score: 600,
          completion_rate: 90,
        },
        user_progress: {
          best_score: 0,
          total_plays: 0,
          rank: 0,
          achievements_earned: 0,
        },
      },
      {
        id: "code-memory-challenge",
        slug: "code-memory-challenge",
        title: "Code Memory Challenge",
        description:
          "Test your memory by remembering code patterns, function names, and syntax structures.",
        instructions: "Study the code snippet, then reproduce it from memory.",
        category: "memory",
        difficulty: "medium",
        icon: "🧠",
        game_type: "interactive",
        max_score: 1200,
        time_limit: 240,
        xp_reward: 60,
        min_level: 2,
        tags: ["memory", "patterns", "syntax"],
        featured: false,
        play_count: 750,
        average_rating: 4.0,
        statistics: {
          total_plays: 750,
          unique_players: 500,
          average_score: 800,
          completion_rate: 75,
        },
        user_progress: {
          best_score: 0,
          total_plays: 0,
          rank: 0,
          achievements_earned: 0,
        },
      },
      {
        id: "algorithm-optimizer",
        slug: "algorithm-optimizer",
        title: "Algorithm Optimizer",
        description:
          "Optimize algorithms for better performance. Learn Big O notation through practical challenges.",
        instructions:
          "Analyze and optimize the given algorithm for better performance.",
        category: "algorithm",
        difficulty: "expert",
        icon: "📊",
        game_type: "coding",
        max_score: 2000,
        time_limit: 900,
        xp_reward: 150,
        min_level: 5,
        tags: ["algorithms", "optimization", "big-o", "performance"],
        featured: true,
        play_count: 450,
        average_rating: 4.8,
        statistics: {
          total_plays: 450,
          unique_players: 300,
          average_score: 1200,
          completion_rate: 60,
        },
        user_progress: {
          best_score: 0,
          total_plays: 0,
          rank: 0,
          achievements_earned: 0,
        },
      },
      {
        id: "web-dev-trivia",
        slug: "web-dev-trivia",
        title: "Web Dev Trivia",
        description:
          "Test your web development knowledge with rapid-fire trivia questions.",
        instructions:
          "Answer as many questions correctly as possible within the time limit.",
        category: "trivia",
        difficulty: "easy",
        icon: "❓",
        game_type: "quiz",
        max_score: 500,
        time_limit: 120,
        xp_reward: 30,
        min_level: 1,
        tags: ["trivia", "knowledge", "quick-thinking"],
        featured: false,
        play_count: 2100,
        average_rating: 4.1,
        statistics: {
          total_plays: 2100,
          unique_players: 1500,
          average_score: 350,
          completion_rate: 95,
        },
        user_progress: {
          best_score: 0,
          total_plays: 0,
          rank: 0,
          achievements_earned: 0,
        },
      },
    ];
  }

  // Play game method - handles authentication and redirects to game
  playGame(gameId) {
    console.log("🎮 playGame called with gameId:", gameId);
    console.log("🔍 Current user state:", this.user);

    // Check if user is authenticated
    if (!this.user) {
      console.log("❌ User not authenticated, showing login toast");
      this.showToast("Please log in to play games", "warning");
      return;
    }

    console.log(
      "✅ User is authenticated:",
      this.user.username || this.user.email || this.user.id
    );

    // Find the game
    const game = this.games.find((g) => g.id === gameId);
    if (!game) {
      console.log("❌ Game not found:", gameId);
      this.showToast("Game not found", "error");
      return;
    }

    console.log("🎯 Game found:", game.title, "Type:", game.game_type);
    this.showToast(`Launching ${game.title}...`, "success");

    // Redirect to the appropriate game page or editor
    if (game.game_type === "challenge") {
      // Redirect to challenges page with specific game
      console.log("🚀 Redirecting to challenges page");
      window.location.href = `challenges.html?game=${gameId}`;
    } else {
      // Redirect to editor with game context
      console.log("🚀 Redirecting to editor");
      window.location.href = `editor.html?game=${gameId}`;
    }
  }

  // Toast notification system
  showToast(message, type = "info") {
    // Remove existing toasts
    const existingToasts = document.querySelectorAll(".toast-notification");
    existingToasts.forEach((toast) => toast.remove());

    // Create toast element
    const toast = document.createElement("div");
    toast.className = `toast-notification toast-${type}`;
    toast.innerHTML = `
      <div class="toast-content">
        <div class="toast-icon">
          ${
            type === "success"
              ? "✅"
              : type === "warning"
              ? "⚠️"
              : type === "error"
              ? "❌"
              : "ℹ️"
          }
        </div>
        <div class="toast-message">${message}</div>
        <button class="toast-close" onclick="this.parentElement.parentElement.remove()">×</button>
      </div>
    `;

    // Add toast styles if not already present
    if (!document.getElementById("toast-styles")) {
      const styles = document.createElement("style");
      styles.id = "toast-styles";
      styles.textContent = `
        .toast-notification {
          position: fixed;
          top: 20px;
          right: 20px;
          z-index: 10000;
          min-width: 300px;
          max-width: 500px;
          background: rgba(15, 23, 42, 0.95);
          border-radius: 12px;
          border: 1px solid rgba(99, 102, 241, 0.3);
          backdrop-filter: blur(10px);
          animation: slideInRight 0.3s ease-out;
        }

        .toast-content {
          display: flex;
          align-items: center;
          padding: 16px;
          gap: 12px;
        }

        .toast-icon {
          font-size: 1.2em;
          flex-shrink: 0;
        }

        .toast-message {
          flex: 1;
          color: #f8fafc;
          font-weight: 500;
        }

        .toast-close {
          background: none;
          border: none;
          color: #94a3b8;
          font-size: 1.2em;
          cursor: pointer;
          padding: 0;
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 4px;
          transition: all 0.2s ease;
        }

        .toast-close:hover {
          background: rgba(255, 255, 255, 0.1);
          color: #f8fafc;
        }

        .toast-success {
          border-color: rgba(16, 185, 129, 0.5);
          background: rgba(16, 185, 129, 0.1);
        }

        .toast-warning {
          border-color: rgba(245, 158, 11, 0.5);
          background: rgba(245, 158, 11, 0.1);
        }

        .toast-error {
          border-color: rgba(239, 68, 68, 0.5);
          background: rgba(239, 68, 68, 0.1);
        }

        .toast-info {
          border-color: rgba(59, 130, 246, 0.5);
          background: rgba(59, 130, 246, 0.1);
        }

        @keyframes slideInRight {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `;
      document.head.appendChild(styles);
    }

    // Add toast to page
    document.body.appendChild(toast);

    // Auto-remove after 5 seconds
    setTimeout(() => {
      if (toast.parentElement) {
        toast.style.animation = "slideInRight 0.3s ease-out reverse";
        setTimeout(() => toast.remove(), 300);
      }
    }, 5000);
  }

  // Enhanced authentication check
  async checkAuthentication() {
    try {
      const token =
        localStorage.getItem("auth_token") ||
        sessionStorage.getItem("auth_token");

      if (!token) {
        console.log("No auth token found");
        this.user = null;
        this.updateAuthUI();
        return;
      }

      // Validate token with API
      const response = await fetch(`${this.apiBase}/user`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.user) {
          this.user = result.user;
          console.log(
            "User authenticated:",
            this.user.username || this.user.email
          );
        } else {
          this.user = null;
        }
      } else {
        console.log("Token validation failed");
        this.user = null;
        // Clear invalid token
        localStorage.removeItem("auth_token");
        sessionStorage.removeItem("auth_token");
      }
    } catch (error) {
      console.log("Authentication check failed:", error);
      this.user = null;
    }

    this.updateAuthUI();
  }

  // Update UI based on authentication status
  updateAuthUI() {
    const authElements = document.querySelectorAll("[data-auth-required]");
    const guestElements = document.querySelectorAll("[data-guest-only]");

    authElements.forEach((element) => {
      if (this.user) {
        element.style.display = "";
      } else {
        element.style.display = "none";
      }
    });

    guestElements.forEach((element) => {
      if (this.user) {
        element.style.display = "none";
      } else {
        element.style.display = "";
      }
    });

    // Update user info display
    const userInfo = document.getElementById("userInfo");
    if (userInfo) {
      if (this.user) {
        userInfo.innerHTML = `
          <div class="user-welcome">
            <span>Welcome, ${this.user.username || this.user.email}!</span>
            <button class="btn btn-sm btn-outline" onclick="gamesPage.logout()">Logout</button>
          </div>
        `;
      } else {
        userInfo.innerHTML = `
          <div class="auth-buttons">
            <button class="btn btn-sm btn-primary" onclick="window.location.href='index.html#login'">Login</button>
            <button class="btn btn-sm btn-outline" onclick="window.location.href='index.html#register'">Sign Up</button>
          </div>
        `;
      }
    }
  }

  // Logout method
  logout() {
    // Clear all possible auth storage
    localStorage.removeItem("auth_token");
    sessionStorage.removeItem("auth_token");
    localStorage.removeItem("codequest_user"); // Main app user storage

    this.user = null;
    this.updateAuthUI();
    this.showToast("Logged out successfully", "success");

    // Reload games to remove user-specific data
    this.loadGamesFromAPI();
  }
}

// Initialize games page when DOM is loaded
document.addEventListener("DOMContentLoaded", function () {
  window.gamesPage = new GamesPage();
});
