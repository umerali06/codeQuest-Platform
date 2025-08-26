// Leaderboard JavaScript Functionality

// Leaderboard State
const leaderboardState = {
  currentFilter: "global",
  currentCategory: "overall",
  currentPage: 1,
  itemsPerPage: 10,
  leaderboardData: [],
};

// Leaderboard Data - Will be loaded from backend
let leaderboardData = {};
      streak: 34,
      badges: 15,
      country: "UK",
    },
    {
      rank: 10,
      username: "Sophia Martinez",
      avatar: "SM",
      level: 30,
      xp: 29300,
      streak: 56,
      badges: 14,
      country: "Mexico",
    },
  ],
  weekly: [
    {
      rank: 1,
      username: "Fast Learner",
      avatar: "FL",
      level: 15,
      xp: 5200,
      streak: 7,
      badges: 5,
      country: "USA",
    },
    {
      rank: 2,
      username: "Code Sprint",
      avatar: "CS",
      level: 12,
      xp: 4800,
      streak: 7,
      badges: 4,
      country: "India",
    },


// Initialize Leaderboard
document.addEventListener("DOMContentLoaded", function () {
  initializeLeaderboard();
  loadLeaderboardData("global");
  checkUserPosition();
  setupLeaderboardListeners();
});

// Initialize Leaderboard
function initializeLeaderboard() {
  // Set initial state
  leaderboardState.currentFilter = "global";
  leaderboardState.currentCategory = "overall";
}

// Setup Event Listeners
function setupLeaderboardListeners() {
  // Filter buttons
  const filterButtons = document.querySelectorAll(".filter-btn");
  filterButtons.forEach((btn) => {
    btn.addEventListener("click", function () {
      filterButtons.forEach((b) => b.classList.remove("active"));
      this.classList.add("active");
    });
  });

  // Category tabs
  const categoryTabs = document.querySelectorAll(".category-tab");
  categoryTabs.forEach((tab) => {
    tab.addEventListener("click", function () {
      categoryTabs.forEach((t) => t.classList.remove("active"));
      this.classList.add("active");
    });
  });
}

// Filter Leaderboard
function filterLeaderboard(filter) {
  leaderboardState.currentFilter = filter;
  loadLeaderboardData(filter);
}

// Load Leaderboard Data
async function loadLeaderboardData(filter) {
  try {
    const response = await fetch(`/api/games/leaderboard?filter=${filter}`);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const result = await response.json();
    if (result.success) {
      leaderboardState.leaderboardData = result.data;
      
      // Update display
      updateLeaderboardDisplay(result.data);
      
      // Update top 3 if on global
      if (filter === "global") {
        updateTopWinners(result.data.slice(0, 3));
      }
    } else {
      throw new Error(result.message || 'Failed to load leaderboard data');
    }
  } catch (error) {
    console.error('Error loading leaderboard data:', error);
    // Show error message
    const leaderboardRows = document.getElementById('leaderboardRows');
    if (leaderboardRows) {
      leaderboardRows.innerHTML = '<div class="error-message">Failed to load leaderboard data. Please check your connection and try again.</div>';
    }
  }
}

// Update Leaderboard Display
function updateLeaderboardDisplay(data) {
  const table = document.getElementById("leaderboardTable");
  if (!table) return;

  // Keep header
  const header = table.querySelector(".table-header");
  const userPosition = table.querySelector(".user-position");

  // Clear existing rows
  const existingRows = table.querySelectorAll(".leaderboard-row");
  existingRows.forEach((row) => row.remove());

  // Create new rows
  const rowsHTML = data.map((player) => createLeaderboardRow(player)).join("");

  // Insert rows after header and user position
  if (userPosition) {
    userPosition.insertAdjacentHTML("afterend", rowsHTML);
  } else if (header) {
    header.insertAdjacentHTML("afterend", rowsHTML);
  }
}

// Create Leaderboard Row
function createLeaderboardRow(player) {
  return `
        <div class="leaderboard-row">
            <span class="rank">${player.rank}</span>
            <span class="player">
                <span class="player-avatar">${player.avatar}</span>
                <span class="player-name">${player.username}</span>
            </span>
            <span class="level">Level ${player.level}</span>
            <span class="xp">${player.xp.toLocaleString()} XP</span>
            <span class="streak">🔥 ${player.streak}</span>
            <span class="badges">${player.badges}</span>
        </div>
    `;
}

// Update Top Winners
function updateTopWinners(topThree) {
  if (topThree.length < 3) return;

  // Update second place
  const secondPlace = document.querySelector(".second-place");
  if (secondPlace) {
    updateWinnerCard(secondPlace, topThree[1]);
  }

  // Update first place
  const firstPlace = document.querySelector(".first-place");
  if (firstPlace) {
    updateWinnerCard(firstPlace, topThree[0]);
  }

  // Update third place
  const thirdPlace = document.querySelector(".third-place");
  if (thirdPlace) {
    updateWinnerCard(thirdPlace, topThree[2]);
  }
}

// Update Winner Card
function updateWinnerCard(card, player) {
  const avatar = card.querySelector(".winner-avatar");
  const name = card.querySelector("h3");
  const level = card.querySelector(".winner-level");
  const xp = card.querySelector(".winner-xp");

  if (avatar) avatar.textContent = player.avatar;
  if (name) name.textContent = player.username;
  if (level) level.textContent = `Level ${player.level}`;
  if (xp) xp.textContent = `${player.xp.toLocaleString()} XP`;
}

// Check User Position
function checkUserPosition() {
  const user = window.AuthManager?.currentUser;
  if (!user) {
    // Hide user position if not logged in
    const userPosition = document.querySelector(".user-position");
    if (userPosition) {
      userPosition.style.display = "none";
    }
    return;
  }

  // Calculate user's position
  const userXP = window.AuthManager.userProgress.totalXP;
  const userLevel = window.AuthManager.userProgress.level;
  const userStreak = window.AuthManager.userProgress.streak;
  const userBadges = window.AuthManager.userProgress.badges.length;

  // Find user's rank (simplified - in real app would query backend)
  let userRank = 247; // Default rank
  const allPlayers = mockLeaderboardData.global;

  for (let i = 0; i < allPlayers.length; i++) {
    if (userXP > allPlayers[i].xp) {
      userRank = i + 1;
      break;
    }
  }

  // Update user position display
  updateUserPosition(
    userRank,
    user.username,
    userLevel,
    userXP,
    userStreak,
    userBadges
  );
}

// Update User Position
function updateUserPosition(rank, username, level, xp, streak, badges) {
  const userPosition = document.querySelector(".user-position");
  if (!userPosition) return;

  // Only show if user is not in top 10
  if (rank <= 10) {
    userPosition.style.display = "none";
    return;
  }

  userPosition.style.display = "grid";
  userPosition.innerHTML = `
        <span class="rank">${rank}</span>
        <span class="player">
            <span class="player-avatar">YOU</span>
            <span class="player-name">${username}</span>
        </span>
        <span class="level">Level ${level}</span>
        <span class="xp">${xp.toLocaleString()} XP</span>
        <span class="streak">🔥 ${streak}</span>
        <span class="badges">${badges}</span>
    `;
}

// Show Leaderboard Category
function showLeaderboardCategory(category) {
  leaderboardState.currentCategory = category;

  // Filter data based on category
  let filteredData = [...leaderboardState.leaderboardData];

  switch (category) {
    case "html":
      // Sort by HTML-specific metrics
      filteredData = filteredData.map((p) => ({
        ...p,
        xp: Math.floor(p.xp * 0.3), // Simulate HTML-only XP
      }));
      break;
    case "css":
      // Sort by CSS-specific metrics
      filteredData = filteredData.map((p) => ({
        ...p,
        xp: Math.floor(p.xp * 0.3),
      }));
      break;
    case "javascript":
      // Sort by JS-specific metrics
      filteredData = filteredData.map((p) => ({
        ...p,
        xp: Math.floor(p.xp * 0.4),
      }));
      break;
    case "challenges":
      // Sort by challenges completed
      filteredData = filteredData.map((p) => ({
        ...p,
        xp: p.badges * 100, // Use badges as proxy for challenges
      }));
      break;
    case "games":
      // Sort by game scores
      filteredData = filteredData.map((p) => ({
        ...p,
        xp: Math.floor(p.xp * 0.2),
      }));
      break;
  }

  // Re-sort and update ranks
  filteredData.sort((a, b) => b.xp - a.xp);
  filteredData = filteredData.map((p, i) => ({ ...p, rank: i + 1 }));

  updateLeaderboardDisplay(filteredData);
}

// Pagination
function changePage(direction) {
  const totalPages = Math.ceil(
    leaderboardState.leaderboardData.length / leaderboardState.itemsPerPage
  );

  if (direction === "next" && leaderboardState.currentPage < totalPages) {
    leaderboardState.currentPage++;
  } else if (direction === "prev" && leaderboardState.currentPage > 1) {
    leaderboardState.currentPage--;
  }

  // Update page display
  updatePageDisplay();

  // Load data for current page
  const start =
    (leaderboardState.currentPage - 1) * leaderboardState.itemsPerPage;
  const end = start + leaderboardState.itemsPerPage;
  const pageData = leaderboardState.leaderboardData.slice(start, end);

  updateLeaderboardDisplay(pageData);
}

// Update Page Display
function updatePageDisplay() {
  const pageNumbers = document.querySelectorAll(".page-number");
  pageNumbers.forEach((page) => {
    page.classList.remove("active");
    if (parseInt(page.textContent) === leaderboardState.currentPage) {
      page.classList.add("active");
    }
  });
}

// Achievement Leaders Functions
function loadAchievementLeaders() {
  // This would normally fetch from backend
  const leaders = {
    streak: { name: "Tom Hardy", avatar: "TH", value: "365 days" },
    fastest: {
      name: "Anna Nelson",
      avatar: "AN",
      value: "Level 50 in 30 days",
    },
    challenges: { name: "Jack Wilson", avatar: "JW", value: "500 challenges" },
    games: { name: "Lisa Brown", avatar: "LB", value: "10,000 points" },
  };

  // Update display (implementation depends on HTML structure)
}

// Hall of Fame Functions
function loadHallOfFame() {
  // Load all-time greatest achievers
  // This would fetch from backend in real app
}

// Refresh Leaderboard
function refreshLeaderboard() {
  // Reload current filter
  loadLeaderboardData(leaderboardState.currentFilter);

  // Show notification
  if (window.CodeQuest && window.CodeQuest.showNotification) {
    window.CodeQuest.showNotification("Leaderboard updated!", "success");
  }
}

// Auto-refresh every 30 seconds
setInterval(refreshLeaderboard, 30000);

// Export functions for global use
window.leaderboardFunctions = {
  filterLeaderboard,
  showLeaderboardCategory,
  changePage,
  refreshLeaderboard,
};
