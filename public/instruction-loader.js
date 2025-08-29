// Simple Instruction Loader for Games and Challenges
// This script loads and displays instructions immediately when the page loads

(function () {
  "use strict";

  console.log("🔧 Instruction Loader starting...");

  // Wait for DOM to be ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initInstructions);
  } else {
    initInstructions();
  }

  function initInstructions() {
    console.log("📋 Initializing instructions...");

    // Check URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const gameSlug = urlParams.get("game");
    const challengeId = urlParams.get("challenge");

    console.log("URL params:", { gameSlug, challengeId });

    if (gameSlug) {
      loadGameInstructions(gameSlug);
    } else if (challengeId) {
      loadChallengeInstructions(challengeId);
    } else {
      // Check sessionStorage for game data
      const gameData = sessionStorage.getItem("current_game");
      const challengeData = localStorage.getItem("pendingChallenge");

      if (gameData) {
        try {
          const game = JSON.parse(gameData);
          displayGameInstructions(game);
        } catch (e) {
          console.error("Error parsing game data:", e);
        }
      } else if (challengeData) {
        try {
          const challenge = JSON.parse(challengeData);
          displayChallengeInstructions(challenge);
        } catch (e) {
          console.error("Error parsing challenge data:", e);
        }
      }
    }
  }

  async function loadGameInstructions(slug) {
    console.log("🎮 Loading game instructions for:", slug);

    try {
      // First try to get from API
      const response = await fetch(`/api/games?slug=${slug}`);
      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data && result.data.length > 0) {
          displayGameInstructions(result.data[0]);
          return;
        }
      }
    } catch (error) {
      console.error("Error loading game from API:", error);
    }

    // Fallback: create sample game based on slug
    const sampleGame = createSampleGame(slug);
    displayGameInstructions(sampleGame);
  }

  async function loadChallengeInstructions(challengeId) {
    console.log("📋 Loading challenge instructions for:", challengeId);

    try {
      // First try to get from API
      const response = await fetch(`/api/challenges/${challengeId}`);
      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          displayChallengeInstructions(result.data);
          return;
        }
      }
    } catch (error) {
      console.error("Error loading challenge from API:", error);
    }

    // Fallback: create sample challenge
    const sampleChallenge = createSampleChallenge(challengeId);
    displayChallengeInstructions(sampleChallenge);
  }

  function createSampleGame(slug) {
    const games = {
      "html-contact-card": {
        id: "game-001",
        title: "Contact Card Component",
        slug: "html-contact-card",
        description:
          "Create a responsive contact card that displays a person's information including name, title, email, and photo.",
        instructions:
          "Build a contact card with the following requirements: 1) Display a profile photo, 2) Show name and job title, 3) Include contact information, 4) Make it responsive for mobile devices, 5) Add hover effects for better user experience.",
        difficulty: "easy",
        category: "html",
        xp_reward: 100,
        time_limit: 1800,
        icon: "🎯",
      },
      "css-styling": {
        id: "game-002",
        title: "CSS Styling Game",
        slug: "css-styling",
        description:
          "Master CSS styling techniques by creating beautiful layouts.",
        instructions:
          "Style the contact card with modern CSS: 1) Use flexbox or grid for layout, 2) Add attractive colors and typography, 3) Include hover animations, 4) Make it mobile responsive, 5) Add subtle shadows and borders.",
        difficulty: "medium",
        category: "css",
        xp_reward: 150,
        time_limit: 2400,
        icon: "🎨",
      },
      "js-logic": {
        id: "game-003",
        title: "JavaScript Logic Puzzle",
        slug: "js-logic",
        description:
          "Solve JavaScript challenges and implement interactive features.",
        instructions:
          "Add interactivity to the contact card: 1) Toggle contact details on click, 2) Add form validation, 3) Implement smooth animations, 4) Handle user interactions, 5) Add dynamic content updates.",
        difficulty: "hard",
        category: "javascript",
        xp_reward: 200,
        time_limit: 3600,
        icon: "⚡",
      },
    };

    return (
      games[slug] || {
        id: "game-default",
        title: "Coding Game",
        slug: slug,
        description:
          "Complete this coding challenge to earn XP and improve your skills.",
        instructions:
          "Follow the requirements and build a working solution. Test your code and submit when ready.",
        difficulty: "medium",
        category: "html",
        xp_reward: 100,
        time_limit: 1800,
        icon: "🎮",
      }
    );
  }

  function createSampleChallenge(challengeId) {
    return {
      id: challengeId,
      title: "Contact Card Challenge",
      description:
        "Create a responsive contact card component that displays user information in an attractive layout.",
      instructions:
        "Build a contact card with the following requirements: 1) Display a profile photo, 2) Show name and job title, 3) Include contact information, 4) Make it responsive for mobile devices, 5) Add hover effects for better user experience.",
      difficulty: "intermediate",
      category: "html",
      xp_reward: 150,
    };
  }

  function displayGameInstructions(game) {
    console.log("🎮 Displaying game instructions:", game.title);

    // Remove existing instructions
    const existing = document.getElementById("gameInstructions");
    if (existing) existing.remove();

    // Create instructions container
    const container = document.createElement("div");
    container.id = "gameInstructions";
    container.className = "instructions-container game-instructions";

    container.innerHTML = `
            <div class="instructions-header">
                <div class="game-info">
                    <h2>${game.icon || "🎮"} ${game.title}</h2>
                    <div class="game-meta">
                        <span class="difficulty ${game.difficulty}">${
      game.difficulty
    }</span>
                        <span class="category">${game.category}</span>
                        <span class="xp">${game.xp_reward} XP</span>
                        <span class="time-limit">⏱️ ${Math.floor(
                          (game.time_limit || 1800) / 60
                        )}m</span>
                    </div>
                </div>
                <button class="collapse-btn" onclick="this.closest('.instructions-container').classList.toggle('collapsed')">
                    <span>−</span>
                </button>
            </div>
            <div class="instructions-content">
                <div class="description">
                    <h3>📝 Description</h3>
                    <p>${game.description}</p>
                </div>
                <div class="instructions">
                    <h3>📋 Instructions</h3>
                    <div class="instructions-text">
                        ${
                          game.instructions ||
                          "Follow the game requirements and implement your solution."
                        }
                    </div>
                </div>
                <div class="objectives">
                    <h3>🎯 Objectives</h3>
                    <ul>
                        <li>Follow the instructions carefully</li>
                        <li>Write clean, readable code</li>
                        <li>Test your solution thoroughly</li>
                        <li>Submit when ready</li>
                    </ul>
                </div>
            </div>
        `;

    // Insert at the top of the main content
    insertInstructions(container);

    // Add styles
    addInstructionStyles();

    // Update page title and UI
    document.title = `${game.title} - CodeQuest Editor`;
    updateGameUI(game);

    console.log("✅ Game instructions displayed successfully");
  }

  function displayChallengeInstructions(challenge) {
    console.log("📋 Displaying challenge instructions:", challenge.title);

    // Remove existing instructions
    const existing = document.getElementById("challengeInstructions");
    if (existing) existing.remove();

    // Create instructions container
    const container = document.createElement("div");
    container.id = "challengeInstructions";
    container.className = "instructions-container challenge-instructions";

    container.innerHTML = `
            <div class="instructions-header">
                <div class="challenge-info">
                    <h2>📋 ${challenge.title}</h2>
                    <div class="challenge-meta">
                        <span class="difficulty ${challenge.difficulty}">${
      challenge.difficulty
    }</span>
                        <span class="category">${challenge.category}</span>
                        <span class="xp">${challenge.xp_reward} XP</span>
                    </div>
                </div>
                <button class="collapse-btn" onclick="this.closest('.instructions-container').classList.toggle('collapsed')">
                    <span>−</span>
                </button>
            </div>
            <div class="instructions-content">
                <div class="description">
                    <h3>📝 Description</h3>
                    <p>${challenge.description}</p>
                </div>
                <div class="instructions">
                    <h3>📋 Instructions</h3>
                    <div class="instructions-text">
                        ${
                          challenge.instructions ||
                          "Follow the challenge requirements and implement your solution."
                        }
                    </div>
                </div>
                <div class="objectives">
                    <h3>🎯 Objectives</h3>
                    <ul>
                        <li>Follow the instructions carefully</li>
                        <li>Write clean, readable code</li>
                        <li>Pass all test cases</li>
                        <li>Submit your solution when ready</li>
                    </ul>
                </div>
            </div>
        `;

    // Insert at the top of the main content
    insertInstructions(container);

    // Add styles
    addInstructionStyles();

    // Update page title and UI
    document.title = `${challenge.title} - CodeQuest Editor`;
    updateChallengeUI(challenge);

    console.log("✅ Challenge instructions displayed successfully");
  }

  function insertInstructions(container) {
    // Find the best place to insert instructions
    const targets = [
      ".main-content",
      ".editor-container",
      ".container",
      "main",
      "body",
    ];

    let inserted = false;
    for (const selector of targets) {
      const target = document.querySelector(selector);
      if (target) {
        target.insertBefore(container, target.firstChild);
        inserted = true;
        console.log(`📍 Instructions inserted into: ${selector}`);
        break;
      }
    }

    if (!inserted) {
      document.body.insertBefore(container, document.body.firstChild);
      console.log("📍 Instructions inserted into body");
    }
  }

  function updateGameUI(game) {
    // Update challenge info display elements if they exist
    const challengeTitle = document.getElementById("challengeTitle");
    const challengeDifficulty = document.getElementById("challengeDifficulty");
    const challengeXP = document.getElementById("challengeXP");

    if (challengeTitle) challengeTitle.textContent = game.title;
    if (challengeDifficulty) challengeDifficulty.textContent = game.difficulty;
    if (challengeXP) challengeXP.textContent = `${game.xp_reward} XP`;

    // Enable buttons
    enableEditorButtons();
  }

  function updateChallengeUI(challenge) {
    // Update challenge info display elements if they exist
    const challengeTitle = document.getElementById("challengeTitle");
    const challengeDifficulty = document.getElementById("challengeDifficulty");
    const challengeXP = document.getElementById("challengeXP");

    if (challengeTitle) challengeTitle.textContent = challenge.title;
    if (challengeDifficulty)
      challengeDifficulty.textContent = challenge.difficulty;
    if (challengeXP) challengeXP.textContent = `${challenge.xp_reward} XP`;

    // Enable buttons
    enableEditorButtons();
  }

  function enableEditorButtons() {
    // Enable Execute Code button
    const executeBtn = document.getElementById("executeCodeBtn");
    if (executeBtn) {
      executeBtn.disabled = false;
      executeBtn.textContent = "▶️ Execute Code";
    }

    // Enable Run Tests button
    const runTestsBtn = document.getElementById("runTestsBtn");
    if (runTestsBtn) {
      runTestsBtn.disabled = false;
      runTestsBtn.textContent = "🧪 Run Tests";
    }

    console.log("✅ Editor buttons enabled");
  }

  function addInstructionStyles() {
    // Check if styles already exist
    if (document.getElementById("instructionStyles")) return;

    const style = document.createElement("style");
    style.id = "instructionStyles";
    style.textContent = `
            .instructions-container {
                background: #1e293b;
                border: 1px solid #334155;
                border-radius: 12px;
                margin: 20px 0;
                overflow: hidden;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                transition: all 0.3s ease;
            }
            
            .instructions-container.collapsed .instructions-content {
                display: none;
            }
            
            .instructions-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 20px;
                background: #334155;
                border-bottom: 1px solid #475569;
            }
            
            .game-info h2,
            .challenge-info h2 {
                margin: 0 0 10px 0;
                color: #f1f5f9;
                font-size: 1.5em;
                font-weight: 700;
            }
            
            .game-meta,
            .challenge-meta {
                display: flex;
                gap: 12px;
                flex-wrap: wrap;
            }
            
            .game-meta span,
            .challenge-meta span {
                padding: 6px 12px;
                border-radius: 20px;
                font-size: 0.85em;
                font-weight: 600;
                color: white;
            }
            
            .difficulty.easy { background: #10b981; }
            .difficulty.medium { background: #f59e0b; }
            .difficulty.hard { background: #ef4444; }
            .difficulty.intermediate { background: #f59e0b; }
            
            .category { background: #3b82f6; }
            .xp { background: #8b5cf6; }
            .time-limit { background: #64748b; }
            
            .collapse-btn {
                background: #475569;
                border: none;
                color: #f1f5f9;
                width: 32px;
                height: 32px;
                border-radius: 50%;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 18px;
                font-weight: bold;
                transition: all 0.2s;
            }
            
            .collapse-btn:hover {
                background: #64748b;
                transform: scale(1.1);
            }
            
            .instructions-content {
                padding: 24px;
                color: #e2e8f0;
                line-height: 1.6;
            }
            
            .instructions-content h3 {
                color: #f1f5f9;
                margin: 0 0 12px 0;
                font-size: 1.1em;
                font-weight: 600;
                display: flex;
                align-items: center;
                gap: 8px;
            }
            
            .instructions-content > div {
                margin-bottom: 24px;
            }
            
            .instructions-content > div:last-child {
                margin-bottom: 0;
            }
            
            .instructions-content p {
                margin: 0 0 12px 0;
                color: #cbd5e1;
            }
            
            .instructions-text {
                background: #0f172a;
                border: 1px solid #334155;
                border-radius: 8px;
                padding: 16px;
                color: #e2e8f0;
            }
            
            .instructions-content ul {
                margin: 0;
                padding-left: 24px;
                color: #cbd5e1;
            }
            
            .instructions-content li {
                margin-bottom: 8px;
                line-height: 1.5;
            }
            
            .instructions-content li:last-child {
                margin-bottom: 0;
            }
            
            /* Responsive design */
            @media (max-width: 768px) {
                .instructions-header {
                    flex-direction: column;
                    align-items: flex-start;
                    gap: 16px;
                }
                
                .collapse-btn {
                    align-self: flex-end;
                }
                
                .game-meta,
                .challenge-meta {
                    gap: 8px;
                }
                
                .game-meta span,
                .challenge-meta span {
                    font-size: 0.8em;
                    padding: 4px 8px;
                }
                
                .instructions-content {
                    padding: 16px;
                }
            }
        `;

    document.head.appendChild(style);
    console.log("✅ Instruction styles added");
  }
})();
