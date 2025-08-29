// Main JavaScript for CodeQuest

// Global Variables
let currentUser = JSON.parse(localStorage.getItem("codequest_user")) || null;

// DOM Ready
document.addEventListener("DOMContentLoaded", function () {
  initializeApp();
  setupEventListeners();

  // Initialize authentication system
  initializeAuth();

  updateAuthUI();
});

// Initialize Application
function initializeApp() {
  // Check for saved user session
  if (currentUser) {
    console.log("Welcome back,", currentUser.username);
  }

  // Initialize tooltips
  initTooltips();

  // Setup smooth scrolling
  setupSmoothScroll();

  // Check current page and initialize specific features
  const currentPage = window.location.pathname.split("/").pop() || "index.html";
  initializePageSpecific(currentPage);
}

// Initialize Authentication System
function initializeAuth() {
  // Wait for AuthManager to be available
  if (typeof window.AuthManager !== "undefined") {
    // Initialize AuthManager with current user
    if (currentUser) {
      window.AuthManager.currentUser = currentUser;
      window.AuthManager.isLoggedIn = true;
    }

    // Update UI immediately
    window.AuthManager.updateAuthUI();

    // Set up listener for auth state changes
    setupAuthStateListener();
  } else {
    // If AuthManager isn't loaded yet, wait a bit and try again
    setTimeout(initializeAuth, 100);
  }
}

// Setup Authentication State Listener
function setupAuthStateListener() {
  // Listen for auth state changes from AuthManager
  if (window.AuthManager && window.AuthManager.onAuthStateChange) {
    window.AuthManager.onAuthStateChange((user) => {
      // Sync our local state
      currentUser = user;
      if (user) {
        localStorage.setItem("codequest_user", JSON.stringify(user));
      } else {
        localStorage.removeItem("codequest_user");
      }

      // Update local UI
      updateLocalAuthUI();
    });
  }
}

// Update Authentication UI
function updateAuthUI() {
  updateLocalAuthUI();
}

// Update local auth UI without calling AuthManager to prevent recursion
function updateLocalAuthUI() {
  const authButtons = document.getElementById("authButtons");
  const userMenu = document.getElementById("userMenu");
  const userGreeting = document.getElementById("userGreeting");

  if (currentUser && authButtons && userMenu && userGreeting) {
    authButtons.style.display = "none";
    userMenu.style.display = "inline-flex";
    userGreeting.textContent = `Welcome, ${
      currentUser.username || currentUser.name || "User"
    }!`;
  } else if (authButtons && userMenu) {
    authButtons.style.display = "inline-flex";
    userMenu.style.display = "none";
  }
}

// Setup Event Listeners
function setupEventListeners() {
  // Close modals on outside click
  window.addEventListener("click", function (event) {
    if (event.target.classList.contains("modal")) {
      event.target.style.display = "none";
    }
  });

  // Note: Authentication form handling is now done by individual page scripts
  // (e.g., games.js, editor.js, etc.) to avoid conflicts

  // Keyboard shortcuts
  document.addEventListener("keydown", handleKeyboardShortcuts);
}

// Smooth Scrolling
function setupSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", function (e) {
      e.preventDefault();
      const href = this.getAttribute("href");

      // Skip if href is just "#" or empty
      if (!href || href === "#") {
        return;
      }

      const target = document.querySelector(href);
      if (target) {
        target.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }
    });
  });
}

// Initialize Tooltips
function initTooltips() {
  const tooltips = document.querySelectorAll("[data-tooltip]");
  tooltips.forEach((element) => {
    element.addEventListener("mouseenter", showTooltip);
    element.addEventListener("mouseleave", hideTooltip);
  });
}

function showTooltip(e) {
  const text = e.target.getAttribute("data-tooltip");
  const tooltip = document.createElement("div");
  tooltip.className = "tooltip";
  tooltip.textContent = text;
  document.body.appendChild(tooltip);

  const rect = e.target.getBoundingClientRect();
  tooltip.style.left =
    rect.left + rect.width / 2 - tooltip.offsetWidth / 2 + "px";
  tooltip.style.top = rect.top - tooltip.offsetHeight - 10 + "px";
}

function hideTooltip() {
  const tooltip = document.querySelector(".tooltip");
  if (tooltip) {
    tooltip.remove();
  }
}

// Page Specific Initialization
function initializePageSpecific(page) {
  switch (page) {
    case "index.html":
    case "":
      initHomePage();
      break;
    case "learn.html":
      initLearnPage();
      break;
    case "editor.html":
      initEditorPage();
      break;
    case "challenges.html":
      initChallengesPage();
      break;
    case "games.html":
      initGamesPage();
      break;
    case "leaderboard.html":
      initLeaderboard();
      break;
    case "dashboard.html":
      initDashboard();
      break;
  }
}

// Home Page Initialization
function initHomePage() {
  // Add any home page specific initialization
  // Delay stats animation to ensure content is loaded
  setTimeout(() => {
    animateStats();
  }, 1000);
}

// Learn Page Initialization
function initLearnPage() {
  // Learn page specific initialization
  console.log("Learn page initialized");
}

// Editor Page Initialization
function initEditorPage() {
  // Editor page specific initialization
  console.log("Editor page initialized");
}

// Challenges Page Initialization
function initChallengesPage() {
  // Challenges page specific initialization
  console.log("Challenges page initialized");
}

// Games Page Initialization
function initGamesPage() {
  // Games page specific initialization
  console.log("Games page initialized");
}

// Leaderboard Page Initialization
function initLeaderboard() {
  // Call the actual leaderboard initialization if it exists
  if (typeof initializeLeaderboard === "function") {
    initializeLeaderboard();
  } else {
    console.log("Leaderboard page initialized");
    // Basic leaderboard setup
    loadLeaderboardData();
  }
}

// Load leaderboard data
function loadLeaderboardData() {
  // This will be replaced with actual API call
  const mockData = [
    { rank: 1, username: "CodeMaster", xp: 2500, badges: 15 },
    { rank: 2, username: "WebNinja", xp: 2350, badges: 14 },
    { rank: 3, username: "HTMLHero", xp: 2200, badges: 13 },
  ];

  // Update leaderboard UI if elements exist
  updateLeaderboardUI(mockData);
}

// Update leaderboard UI
function updateLeaderboardUI(data) {
  const leaderboardContainer = document.querySelector(".leaderboard-list");
  if (leaderboardContainer && data) {
    // Clear existing content
    leaderboardContainer.innerHTML = "";

    // Add leaderboard entries
    data.forEach((entry) => {
      const entryElement = document.createElement("div");
      entryElement.className = "leaderboard-entry";
      entryElement.innerHTML = `
        <span class="rank">#${entry.rank}</span>
        <span class="username">${entry.username}</span>
        <span class="xp">${entry.xp} XP</span>
        <span class="badges">${entry.badges} badges</span>
      `;
      leaderboardContainer.appendChild(entryElement);
    });
  }
}

// Dashboard Page Initialization
function initDashboard() {
  console.log("Dashboard page initialized");

  // Initialize dashboard components
  loadDashboardData();
  setupDashboardEventListeners();
  updateProgressDisplay();
}

// Load dashboard data
function loadDashboardData() {
  if (window.AuthManager && window.AuthManager.isLoggedIn()) {
    const user = window.AuthManager.getCurrentUser();
    const progress = window.AuthManager.getProgress();

    // Update user info
    updateUserInfo(user, progress);

    // Update progress stats
    updateProgressStats(progress);

    // Load achievements
    updateAchievements(progress.achievements || []);
  }
}

// Update user info display
function updateUserInfo(user, progress) {
  const elements = {
    userName: document.querySelector(".user-name"),
    userLevel: document.querySelector(".user-level"),
    userXP: document.querySelector(".user-xp"),
    userStreak: document.querySelector(".user-streak"),
  };

  if (elements.userName && user) {
    elements.userName.textContent = user.name || user.email;
  }

  if (elements.userLevel && progress) {
    elements.userLevel.textContent = `Level ${progress.level} - ${progress.levelTitle}`;
  }

  if (elements.userXP && progress) {
    elements.userXP.textContent = `${progress.totalXP} XP`;
  }

  if (elements.userStreak && progress) {
    elements.userStreak.textContent = `${progress.streak} day streak`;
  }
}

// Update progress statistics
function updateProgressStats(progress) {
  if (!progress) return;

  const stats = progress.statistics || {};

  // Update HTML progress
  updateStatDisplay("html", stats.html || { lessons: 0, xp: 0 });

  // Update CSS progress
  updateStatDisplay("css", stats.css || { lessons: 0, xp: 0 });

  // Update JavaScript progress
  updateStatDisplay("javascript", stats.javascript || { lessons: 0, xp: 0 });
}

// Update individual stat display
function updateStatDisplay(type, stat) {
  const elements = {
    lessons: document.querySelector(`.${type}-lessons`),
    xp: document.querySelector(`.${type}-xp`),
    progress: document.querySelector(`.${type}-progress`),
  };

  if (elements.lessons) {
    elements.lessons.textContent = stat.lessons || 0;
  }

  if (elements.xp) {
    elements.xp.textContent = `${stat.xp || 0} XP`;
  }

  if (elements.progress) {
    const progressPercent = Math.min((stat.progress || 0) * 100, 100);
    elements.progress.style.width = `${progressPercent}%`;
  }
}

// Update achievements display
function updateAchievements(achievements) {
  const achievementsContainer = document.querySelector(".achievements-grid");
  if (!achievementsContainer) return;

  // Clear existing achievements
  achievementsContainer.innerHTML = "";

  // Add earned achievements
  achievements.forEach((achievement) => {
    const achievementElement = document.createElement("div");
    achievementElement.className = "achievement-badge earned";
    achievementElement.innerHTML = `
      <div class="achievement-icon">${getAchievementIcon(achievement.id)}</div>
      <div class="achievement-name">${getAchievementName(achievement.id)}</div>
    `;
    achievementsContainer.appendChild(achievementElement);
  });
}

// Get achievement icon
function getAchievementIcon(achievementId) {
  const icons = {
    "first-steps": "🎯",
    "dedicated-learner": "📚",
    challenger: "⚔️",
    "week-warrior": "🔥",
    "knowledge-seeker": "🧠",
    "on-fire": "🚀",
  };
  return icons[achievementId] || "🏆";
}

// Get achievement name
function getAchievementName(achievementId) {
  const names = {
    "first-steps": "First Steps",
    "dedicated-learner": "Dedicated Learner",
    challenger: "Challenger",
    "week-warrior": "Week Warrior",
    "knowledge-seeker": "Knowledge Seeker",
    "on-fire": "On Fire",
  };
  return names[achievementId] || "Achievement";
}

// Setup dashboard event listeners
function setupDashboardEventListeners() {
  // Study plan checkboxes
  const checkboxes = document.querySelectorAll(
    '.study-task input[type="checkbox"]'
  );
  checkboxes.forEach((checkbox) => {
    checkbox.addEventListener("change", handleTaskCompletion);
  });
}

// Handle task completion
function handleTaskCompletion(event) {
  const checkbox = event.target;
  const taskElement = checkbox.closest(".study-task");

  if (checkbox.checked) {
    taskElement.classList.add("completed");

    // Award XP if specified
    const xpElement = taskElement.querySelector(".task-xp");
    if (xpElement) {
      const xpText = xpElement.textContent;
      const xpMatch = xpText.match(/\+(\d+)/);
      if (xpMatch) {
        const xpReward = parseInt(xpMatch[1]);
        awardXP(xpReward);
      }
    }
  } else {
    taskElement.classList.remove("completed");
  }
}

// Award XP to user
function awardXP(amount) {
  if (window.AuthManager && window.AuthManager.isLoggedIn()) {
    const progress = window.AuthManager.getProgress();
    const newXP = (progress.totalXP || 0) + amount;

    window.AuthManager.updateProgress({
      totalXP: newXP,
    });

    // Show notification
    if (typeof showNotification === "function") {
      showNotification(`+${amount} XP earned!`, "success");
    }

    // Update display
    updateProgressDisplay();
  }
}

// Update progress display
function updateProgressDisplay() {
  if (window.AuthManager && window.AuthManager.isLoggedIn()) {
    const progress = window.AuthManager.getProgress();
    loadDashboardData();
  }
}

// Animate Statistics
function animateStats() {
  const stats = document.querySelectorAll(".stat-number");
  stats.forEach((stat) => {
    // Skip if the stat contains "Loading..." or is not a valid number
    if (
      stat.textContent.includes("Loading...") ||
      stat.textContent.trim() === ""
    ) {
      return;
    }

    // Extract the numeric part and any suffix (like "K+", "M+")
    const text = stat.textContent;
    const numericMatch = text.match(/(\d+(?:,\d+)*)/);

    if (!numericMatch) {
      return; // Skip if no valid number found
    }

    const target = parseInt(numericMatch[1].replace(/,/g, ""));
    const suffix = text.replace(numericMatch[1], ""); // Keep the suffix (K+, M+, etc.)

    if (isNaN(target) || target <= 0) {
      return; // Skip invalid numbers
    }

    const duration = 2000;
    const increment = target / (duration / 16);
    let current = 0;

    const timer = setInterval(() => {
      current += increment;
      if (current >= target) {
        current = target;
        clearInterval(timer);
        stat.textContent = formatNumber(current) + suffix;
      } else {
        stat.textContent = formatNumber(Math.floor(current)) + suffix;
      }
    }, 16);
  });
}

function formatNumber(num) {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

// Keyboard Shortcuts
function handleKeyboardShortcuts(e) {
  // Ctrl/Cmd + K - Focus search
  if ((e.ctrlKey || e.metaKey) && e.key === "k") {
    e.preventDefault();
    const searchInput = document.getElementById("searchInput");
    if (searchInput) {
      searchInput.focus();
    }
  }

  // Escape - Close modals
  if (e.key === "Escape") {
    closeAllModals();
  }
}

// Close All Modals
function closeAllModals() {
  const modals = document.querySelectorAll(".modal");
  modals.forEach((modal) => {
    modal.style.display = "none";
  });
}

// Close Specific Modal
function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.style.display = "none";
  }
}

// Show Notification
function showNotification(message, type = "info", duration = 3000) {
  const notification = document.createElement("div");
  notification.className = `notification ${type}`;
  notification.textContent = message;
  document.body.appendChild(notification);

  // Animate in
  setTimeout(() => {
    notification.style.opacity = "1";
    notification.style.transform = "translateX(0)";
  }, 10);

  // Remove after duration
  setTimeout(() => {
    notification.style.opacity = "0";
    notification.style.transform = "translateX(100%)";
    setTimeout(() => notification.remove(), 300);
  }, duration);
}

// Loading Spinner
function showLoader() {
  const loader = document.createElement("div");
  loader.className = "loader-overlay";
  loader.innerHTML = '<div class="loader"></div>';
  document.body.appendChild(loader);
}

function hideLoader() {
  const loader = document.querySelector(".loader-overlay");
  if (loader) {
    loader.remove();
  }
}

// API Calls (Simulated)
async function apiCall(endpoint, method = "GET", data = null) {
  showLoader();

  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 500));

  hideLoader();

  // Return mock data based on endpoint
  switch (endpoint) {
    case "/api/user":
      return currentUser;
    case "/api/lessons":
      return getLessonsData();
    case "/api/challenges":
      return getChallengesData();
    case "/api/leaderboard":
      return getLeaderboardData();
    default:
      return { success: true };
  }
}

// Mock Data Functions
function getLessonsData() {
  return {
    html: [
      { id: 1, title: "HTML Basics", completed: false, xp: 10 },
      { id: 2, title: "Semantic HTML", completed: false, xp: 15 },
      { id: 3, title: "Forms & Input", completed: false, xp: 20 },
    ],
    css: [
      { id: 4, title: "CSS Fundamentals", completed: false, xp: 10 },
      { id: 5, title: "Flexbox", completed: false, xp: 20 },
      { id: 6, title: "CSS Grid", completed: false, xp: 25 },
    ],
    javascript: [
      { id: 7, title: "Variables & Types", completed: false, xp: 15 },
      { id: 8, title: "Functions", completed: false, xp: 20 },
      { id: 9, title: "DOM Manipulation", completed: false, xp: 30 },
    ],
  };
}

function getChallengesData() {
  return [
    { id: 1, title: "Build a Card Component", difficulty: "Easy", xp: 25 },
    { id: 2, title: "Create a Navigation Menu", difficulty: "Medium", xp: 50 },
    {
      id: 3,
      title: "Interactive Form Validation",
      difficulty: "Hard",
      xp: 100,
    },
  ];
}

function getLeaderboardData() {
  return [
    { rank: 1, username: "CodeMaster", xp: 2500, badges: 15 },
    { rank: 2, username: "WebNinja", xp: 2350, badges: 14 },
    { rank: 3, username: "HTMLHero", xp: 2200, badges: 13 },
  ];
}

// Utility Functions
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

function throttle(func, limit) {
  let inThrottle;
  return function (...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

// Export functions for use in other files
window.CodeQuest = {
  showNotification,
  showLoader,
  hideLoader,
  apiCall,
  closeModal,
  showLogin: () => {
    if (
      typeof window.AuthManager !== "undefined" &&
      window.AuthManager.showLogin
    ) {
      window.AuthManager.showLogin();
    } else {
      const loginModal = document.getElementById("loginModal");
      if (loginModal) {
        loginModal.style.display = "block";
      }
    }
  },
  showSignup: () => {
    if (
      typeof window.AuthManager !== "undefined" &&
      window.AuthManager.showSignup
    ) {
      window.AuthManager.showSignup();
    } else {
      const signupModal = document.getElementById("signupModal");
      if (signupModal) {
        signupModal.style.display = "block";
      }
    }
  },
  currentUser: () => currentUser,
  isLoggedIn: () => currentUser !== null,
};

// Periodic authentication check
setInterval(() => {
  if (
    typeof window.AuthManager !== "undefined" &&
    window.AuthManager.currentUser !== currentUser
  ) {
    currentUser = window.AuthManager.currentUser;
    updateAuthUI();
  }
}, 1000);
