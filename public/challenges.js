// Challenges JavaScript Functionality

// Challenge State
const challengeState = {
  currentChallenge: null,
  currentFilter: "all",
  currentSort: "newest",
  completedChallenges: [],
  activeTimer: null,
  startTime: null,
};

// Challenge Data - Will be loaded from backend
let challengesData = {};

// Initialize Challenges Page
document.addEventListener("DOMContentLoaded", function () {
  initializeChallenges();
  loadChallenges();
  setupChallengeEventListeners();
  updateProgressStats();
  startWeeklyCountdown();
});

// Initialize Challenges
async function initializeChallenges() {
  // Load completed challenges from localStorage
  const saved = localStorage.getItem("codequest_completed_challenges");
  if (saved) {
    challengeState.completedChallenges = JSON.parse(saved);
  }

  // Load challenges from backend
  await loadChallengesFromBackend();

  // Set up filters
  setupFilters();
}

// Load challenges from backend
async function loadChallengesFromBackend() {
  try {
    const response = await fetch("/api/challenges");
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    if (result.success) {
      challengesData = result.data;
      updateProgressStats();
      displayChallengesFromAPI();
    } else {
      throw new Error(result.message || "Failed to load challenges");
    }
  } catch (error) {
    console.error("Error loading challenges:", error);
    // Fallback to mock data for development
    loadMockChallenges();
  }
}

// Load mock challenges for development
function loadMockChallenges() {
  challengesData = [
    {
      id: "1",
      slug: "contact-card",
      title: "Contact Card Component",
      description: "Create a responsive contact card with HTML and CSS",
      difficulty: "easy",
      category: "html",
      xp_reward: 25,
      tags: ["html", "css", "responsive"],
    },
    {
      id: "2",
      slug: "responsive-nav",
      title: "Responsive Navigation",
      description: "Build a mobile-friendly navigation menu",
      difficulty: "medium",
      category: "css",
      xp_reward: 50,
      tags: ["css", "responsive", "navigation"],
    },
  ];

  displayChallengesFromAPI();
  updateProgressStats();
}

// Setup Filters
function setupFilters() {
  // Difficulty filter
  const difficultyFilter = document.getElementById("difficultyFilter");
  if (difficultyFilter) {
    difficultyFilter.addEventListener("change", function () {
      filterChallenges("difficulty", this.value);
      smoothScrollToChallenges();
    });
  }

  // Topic filter
  const topicFilter = document.getElementById("topicFilter");
  if (topicFilter) {
    topicFilter.addEventListener("change", function () {
      filterChallenges("topic", this.value);
      smoothScrollToChallenges();
    });
  }

  // Sort filter
  const sortFilter = document.getElementById("sortFilter");
  if (sortFilter) {
    sortFilter.addEventListener("change", function () {
      sortChallenges(this.value);
    });
  }
}

// Setup Event Listeners
function setupChallengeEventListeners() {
  // Challenge cards click handlers are added inline
  // Additional event listeners can be added here
}

// Start Challenge Function
function startChallenge(challengeId) {
  console.log("Starting challenge:", challengeId);

  // Store the challenge ID in localStorage so the editor can load it
  localStorage.setItem("codequest_current_challenge", challengeId);

  // Add a small delay for smooth transition effect
  setTimeout(() => {
    // Redirect to the editor page with challenge parameter
    window.location.href = `editor.html?challenge=${encodeURIComponent(
      challengeId
    )}`;
  }, 300);
}

// Load Challenges
function loadChallenges() {
  const grid = document.getElementById("challengesGrid");
  if (!grid) return;

  // Show loading state
  grid.innerHTML = `
    <div class="loading-challenges">
      <div class="spinner"></div>
      <p>Loading challenges...</p>
    </div>
  `;
}

// Display challenges from API data
function displayChallengesFromAPI() {
  const grid = document.getElementById("challengesGrid");
  if (!grid || !challengesData || challengesData.length === 0) {
    grid.innerHTML =
      '<div class="no-challenges">No challenges available.</div>';
    return;
  }

  const challengesHTML = challengesData
    .map(
      (challenge, index) => `
    <div class="challenge-card" data-difficulty="${
      challenge.difficulty || "beginner"
    }" data-topic="${challenge.category || "html"}">
      <div class="challenge-header">
        <span class="challenge-number">#${String(index + 1).padStart(
          3,
          "0"
        )}</span>
        <span class="difficulty ${challenge.difficulty || "beginner"}">${
        challenge.difficulty || "Beginner"
      }</span>
      </div>
      <h3>${challenge.title}</h3>
      <p>${challenge.description}</p>
      <div class="challenge-tags">
        <span class="tag">${(challenge.category || "HTML").toUpperCase()}</span>
        <span class="tag">${challenge.difficulty || "Beginner"}</span>
      </div>
      <div class="challenge-stats">
        <span>⏱️ ${challenge.time_limit_minutes || 30} min</span>
        <span>🏆 ${challenge.xp_reward || challenge.points || 50} XP</span>
        <span>✅ New</span>
      </div>
      <button class="btn btn-primary" onclick="startChallenge('${
        challenge.slug || challenge.id || challenge.title
      }')">Start</button>
    </div>
  `
    )
    .join("");

  grid.innerHTML = challengesHTML;

  // Update progress stats
  updateProgressStats();
}

// Update Challenge Cards
function updateChallengeCards() {
  const cards = document.querySelectorAll(".challenge-card");

  cards.forEach((card) => {
    const challengeId = card
      .querySelector("button")
      .getAttribute("onclick")
      .match(/'([^']+)'/)[1];

    if (challengeState.completedChallenges.includes(challengeId)) {
      card.classList.add("completed");
      const button = card.querySelector("button");
      button.textContent = "Review";
      button.classList.remove("btn-primary");
      button.classList.add("btn-success");
    }
  });
}

// Remove duplicate startChallenge function - using the one above

// Open Challenge Editor
function openChallengeEditor(challengeId, challengeData) {
  // Save challenge data to sessionStorage
  if (challengeData) {
    sessionStorage.setItem("current_challenge", JSON.stringify(challengeData));
  }

  // Redirect to editor with challenge mode
  window.location.href = `editor.html?challenge=${challengeId}`;
}

// Filter Challenges
function filterChallenges(filterType, value) {
  if (!challengesData || challengesData.length === 0) return;

  let filteredChallenges = [...challengesData];

  // Apply difficulty filter
  const difficultyFilter = document.getElementById("difficultyFilter");
  if (difficultyFilter && difficultyFilter.value !== "all") {
    filteredChallenges = filteredChallenges.filter(
      (challenge) => challenge.difficulty === difficultyFilter.value
    );
  }

  // Apply topic filter
  const topicFilter = document.getElementById("topicFilter");
  if (topicFilter && topicFilter.value !== "all") {
    filteredChallenges = filteredChallenges.filter(
      (challenge) => challenge.category === topicFilter.value
    );
  }

  // Display filtered challenges
  displayFilteredChallenges(filteredChallenges);
}

// Display filtered challenges
function displayFilteredChallenges(filteredChallenges) {
  const grid = document.getElementById("challengesGrid");
  if (!grid) return;

  if (filteredChallenges.length === 0) {
    grid.innerHTML = `
      <div class="no-challenges">
        <p>No challenges found matching your criteria.</p>
        <button class="btn btn-primary" onclick="resetFilters()">Show All Challenges</button>
      </div>
    `;
    return;
  }

  const challengesHTML = filteredChallenges
    .map(
      (challenge, index) => `
    <div class="challenge-card" data-difficulty="${
      challenge.difficulty || "beginner"
    }" data-topic="${challenge.category || "html"}">
      <div class="challenge-header">
        <span class="challenge-number">#${String(index + 1).padStart(
          3,
          "0"
        )}</span>
        <span class="difficulty ${challenge.difficulty || "beginner"}">${
        challenge.difficulty || "Beginner"
      }</span>
      </div>
      <h3>${challenge.title}</h3>
      <p>${challenge.description}</p>
      <div class="challenge-tags">
        <span class="tag">${(challenge.category || "HTML").toUpperCase()}</span>
        <span class="tag">${challenge.difficulty || "Beginner"}</span>
      </div>
      <div class="challenge-stats">
        <span>⏱️ ${challenge.time_limit_minutes || 30} min</span>
        <span>🏆 ${challenge.xp_reward || challenge.points || 50} XP</span>
        <span>✅ New</span>
      </div>
      <button class="btn btn-primary" onclick="startChallenge('${
        challenge.slug || challenge.id || challenge.title
      }')">Start</button>
    </div>
  `
    )
    .join("");

  grid.innerHTML = challengesHTML;
}

// Filter by Category
function filterByCategory(category) {
  console.log("Filtering by category:", category);

  if (!challengesData || challengesData.length === 0) return;

  // Set the topic filter dropdown
  const topicFilter = document.getElementById("topicFilter");
  if (topicFilter) {
    topicFilter.value = category;
  }

  // Highlight the selected category card
  highlightSelectedCategory(category);

  // Apply filters
  filterChallenges();

  // Smooth scroll to challenges section
  console.log("Attempting to scroll to challenges section...");
  smoothScrollToChallenges();
}

// Filter by Difficulty
function filterByDifficulty(difficulty) {
  document.getElementById("difficultyFilter").value = difficulty;
  filterChallenges("difficulty", difficulty);
}

// Sort Challenges
function sortChallenges(sortBy) {
  if (!challengesData || challengesData.length === 0) return;

  let sortedChallenges = [...challengesData];

  switch (sortBy) {
    case "easiest":
      sortedChallenges.sort(
        (a, b) =>
          getDifficultyValue(a.difficulty || "beginner") -
          getDifficultyValue(b.difficulty || "beginner")
      );
      break;
    case "hardest":
      sortedChallenges.sort(
        (a, b) =>
          getDifficultyValue(b.difficulty || "beginner") -
          getDifficultyValue(a.difficulty || "beginner")
      );
      break;
    case "popular":
      // For now, sort by XP (higher XP = more popular)
      sortedChallenges.sort(
        (a, b) =>
          (b.xp_reward || b.points || 0) - (a.xp_reward || a.points || 0)
      );
      break;
    case "newest":
    default:
      // Already sorted by ID (newest first)
      break;
  }

  // Display sorted challenges
  displayFilteredChallenges(sortedChallenges);
}

// Reset filters to show all challenges
function resetFilters() {
  const difficultyFilter = document.getElementById("difficultyFilter");
  const topicFilter = document.getElementById("topicFilter");
  const sortFilter = document.getElementById("sortFilter");

  if (difficultyFilter) difficultyFilter.value = "all";
  if (topicFilter) topicFilter.value = "all";
  if (sortFilter) sortFilter.value = "newest";

  // Display all challenges
  displayChallengesFromAPI();
}

// Smooth scroll to challenges section
function smoothScrollToChallenges() {
  console.log("smoothScrollToChallenges called");

  // Use the ID to find the challenges section
  const challengesSection = document.getElementById("challengesSection");
  console.log("Found challenges section:", challengesSection);

  if (challengesSection) {
    console.log("Attempting to scroll to challenges section...");

    // Try the native scrollIntoView method first with better options
    try {
      challengesSection.scrollIntoView({
        behavior: "smooth",
        block: "start",
        inline: "nearest",
      });
      console.log("scrollIntoView completed successfully");

      // Add visual feedback to the section title
      const sectionTitle = challengesSection.querySelector(".section-title");
      if (sectionTitle) {
        setTimeout(() => {
          sectionTitle.style.color = "var(--primary)";
          sectionTitle.style.transform = "scale(1.05)";
          setTimeout(() => {
            sectionTitle.style.color = "";
            sectionTitle.style.transform = "";
          }, 800);
        }, 300);
      }
    } catch (error) {
      // Fallback to manual scrolling if scrollIntoView fails
      console.log("Using fallback scrolling method due to error:", error);
      const sectionRect = challengesSection.getBoundingClientRect();
      const scrollTop =
        window.pageYOffset || document.documentElement.scrollTop;
      const targetPosition = scrollTop + sectionRect.top - 100;

      window.scrollTo({
        top: targetPosition,
        behavior: "smooth",
      });
    }
  } else {
    console.log("Challenges section not found!");
  }
}

// Highlight the selected category card
function highlightSelectedCategory(category) {
  // Remove active class from all category cards
  const allCategoryCards = document.querySelectorAll(".category-card");
  allCategoryCards.forEach((card) => card.classList.remove("active"));

  // Add active class to the selected category card
  const selectedCard = document.querySelector(`.${category}-category`);
  if (selectedCard) {
    selectedCard.classList.add("active");

    // Remove active class after animation completes
    setTimeout(() => {
      selectedCard.classList.remove("active");
    }, 2000);
  }
}

// Get Difficulty Value
function getDifficultyValue(difficulty) {
  const values = {
    beginner: 1,
    intermediate: 2,
    advanced: 3,
    expert: 4,
  };
  return values[difficulty] || 0;
}

// Update Progress Stats
function updateProgressStats() {
  const stats = document.querySelectorAll(".progress-stat .stat-value");

  if (stats[0])
    stats[0].textContent = challengeState.completedChallenges.length;
  if (stats[1])
    stats[1].textContent = Array.isArray(challengesData)
      ? challengesData.length
      : 0; // Total available
  if (stats[2]) stats[2].textContent = calculateTotalXP();
  if (stats[3]) stats[3].textContent = getCurrentStreak();
}

// Calculate Total XP
function calculateTotalXP() {
  let totalXP = 0;

  if (!Array.isArray(challengesData)) {
    return totalXP;
  }

  challengeState.completedChallenges.forEach((challengeId) => {
    const challenge = challengesData.find(
      (c) =>
        c.id === challengeId ||
        c.slug === challengeId ||
        c.title === challengeId
    );
    if (challenge) {
      totalXP += challenge.xpReward || challenge.xp_reward || 0;
    }
  });

  return totalXP;
}

// Get Current Streak
function getCurrentStreak() {
  const user = window.AuthManager?.currentUser;
  if (user && window.AuthManager.userProgress) {
    return window.AuthManager.userProgress.streak || 0;
  }
  return 0;
}

// Complete Challenge
function completeChallenge(challengeId, xp) {
  if (!challengeState.completedChallenges.includes(challengeId)) {
    challengeState.completedChallenges.push(challengeId);

    // Save to localStorage
    localStorage.setItem(
      "codequest_completed_challenges",
      JSON.stringify(challengeState.completedChallenges)
    );

    // Add XP if user is logged in
    if (window.AuthManager && window.AuthManager.currentUser) {
      window.AuthManager.completeChallenge(challengeId, xp);
    }

    // Calculate time taken
    const timeTaken = challengeState.startTime
      ? Math.floor((Date.now() - challengeState.startTime) / 1000)
      : 0;

    // Show completion message
    showChallengeComplete(xp, timeTaken);
  }
}

// Show Challenge Complete
function showChallengeComplete(xp, timeTaken) {
  const minutes = Math.floor(timeTaken / 60);
  const seconds = timeTaken % 60;

  const modal = document.createElement("div");
  modal.className = "challenge-complete-modal";
  modal.innerHTML = `
        <div class="modal-content">
            <h2>🎉 Challenge Complete!</h2>
            <div class="completion-stats">
                <div class="stat">
                    <span class="stat-value">+${xp} XP</span>
                    <span class="stat-label">Earned</span>
                </div>
                <div class="stat">
                    <span class="stat-value">${minutes}:${seconds
    .toString()
    .padStart(2, "0")}</span>
                    <span class="stat-label">Time</span>
                </div>
            </div>
            <div class="modal-actions">
                <button class="btn btn-secondary" onclick="reviewSolution()">Review Solution</button>
                <button class="btn btn-primary" onclick="nextChallenge()">Next Challenge</button>
            </div>
        </div>
    `;

  document.body.appendChild(modal);

  setTimeout(() => {
    modal.classList.add("show");
  }, 100);
}

// Review Solution
function reviewSolution() {
  const challenge = challengesData[challengeState.currentChallenge];
  if (challenge && challenge.solution) {
    // Show solution in a modal or redirect to solution page
    console.log("Solution:", challenge.solution);
  }
  closeCompletionModal();
}

// Next Challenge
function nextChallenge() {
  closeCompletionModal();

  // Find next uncompleted challenge
  const cards = document.querySelectorAll(".challenge-card:not(.completed)");
  if (cards.length > 0) {
    const nextButton = cards[0].querySelector("button");
    if (nextButton) {
      nextButton.click();
    }
  }
}

// Close Completion Modal
function closeCompletionModal() {
  const modal = document.querySelector(".challenge-complete-modal");
  if (modal) {
    modal.classList.remove("show");
    setTimeout(() => {
      modal.remove();
    }, 300);
  }
}

// Load More Challenges
function loadMoreChallenges() {
  // In a real app, this would load more challenges from the server
  showNotification("Loading more challenges...", "info");

  // Simulate loading
  setTimeout(() => {
    showNotification("More challenges coming soon!", "success");
  }, 1000);

  // Smooth scroll to show the new content
  const loadMoreButton = document.querySelector(".load-more-container");
  if (loadMoreButton) {
    loadMoreButton.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  }
}

// Weekly Challenge Countdown
function startWeeklyCountdown() {
  updateWeeklyCountdown();
  setInterval(updateWeeklyCountdown, 1000);
}

function updateWeeklyCountdown() {
  const countdown = document.getElementById("weekly-countdown");
  if (!countdown) return;

  const now = new Date();
  const endOfWeek = new Date();
  endOfWeek.setDate(endOfWeek.getDate() + (7 - endOfWeek.getDay()));
  endOfWeek.setHours(23, 59, 59, 999);

  const diff = endOfWeek - now;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  countdown.textContent = `${days}d ${hours}h ${minutes}m`;
}

// Pagination
function changePage(direction) {
  const currentPage = document.querySelector(".page-number.active");
  const pageNumbers = document.querySelectorAll(".page-number");

  let currentIndex = Array.from(pageNumbers).indexOf(currentPage);

  if (direction === "next" && currentIndex < pageNumbers.length - 1) {
    currentIndex++;
  } else if (direction === "prev" && currentIndex > 0) {
    currentIndex--;
  }

  pageNumbers.forEach((page) => page.classList.remove("active"));
  pageNumbers[currentIndex].classList.add("active");

  // Load challenges for the new page
  loadChallengesForPage(currentIndex + 1);
}

function loadChallengesForPage(pageNumber) {
  // In a real app, this would fetch challenges for the specific page
  console.log("Loading page", pageNumber);
}

// Show Notification
function showNotification(message, type = "info") {
  if (window.CodeQuest && window.CodeQuest.showNotification) {
    window.CodeQuest.showNotification(message, type);
  }
}

// Export functions for global use
window.challengeFunctions = {
  startChallenge,
  completeChallenge,
  filterByCategory,
  filterByDifficulty,
  loadMoreChallenges,
  changePage,
};
