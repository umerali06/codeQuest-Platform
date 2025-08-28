// Enhanced Learn Page JavaScript with Full Database Integration
// Handles modules, lessons, progress tracking, and interactive features

class EnhancedLearnPage {
  constructor() {
    this.modules = [];
    this.currentModule = null;
    this.currentLesson = null;
    this.userProgress = {};
    this.isAuthenticated = false;
    this.init();
  }

  async init() {
    try {
      this.showLoadingState();
      await this.loadModules();
      this.setupEventListeners();
      this.setupAI();
      this.hideLoadingState();
    } catch (error) {
      console.error("Error initializing learn page:", error);
      this.showError(
        "Failed to initialize learn page. Please refresh and try again."
      );
    }
  }

  showLoadingState() {
    const modulesGrid = document.getElementById("modulesGrid");
    if (modulesGrid) {
      modulesGrid.innerHTML = `
                <div class="loading-container">
                    <div class="loading-spinner"></div>
                    <p>Loading your learning journey...</p>
                </div>
            `;
    }
  }

  hideLoadingState() {
    const loadingContainer = document.querySelector(".loading-container");
    if (loadingContainer) {
      loadingContainer.remove();
    }
  }

  async loadModules() {
    try {
      const response = await fetch("/api/modules");
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Failed to load modules");
      }

      this.modules = result.modules || [];
      this.isAuthenticated = result.user_authenticated || false;

      if (this.modules.length === 0) {
        this.showEmptyState();
        return;
      }

      this.renderModules();
      this.updateProgressSummary();
    } catch (error) {
      console.error("Error loading modules:", error);
      this.showError(
        "Failed to load learning modules. Please check your connection and try again."
      );
    }
  }

  renderModules() {
    const modulesGrid = document.getElementById("modulesGrid");
    if (!modulesGrid) return;

    modulesGrid.innerHTML = this.modules
      .map((module) => {
        const progress = module.user_progress;
        const progressPercentage = progress.progress_percentage || 0;
        const isStarted = progress.is_started;
        const isCompleted = progress.is_completed;

        return `
                <div class="module-card ${isCompleted ? "completed" : ""} ${
          isStarted ? "started" : ""
        }" 
                     onclick="learnPage.viewModule('${module.slug}')"
                     data-module="${module.slug}">
                    <div class="module-header">
                        <div class="module-icon" style="background-color: ${
                          module.color
                        }">
                            ${module.icon}
                        </div>
                        <div class="module-status">
                            ${
                              isCompleted
                                ? '<span class="status-badge completed">✓ Completed</span>'
                                : isStarted
                                ? '<span class="status-badge in-progress">In Progress</span>'
                                : '<span class="status-badge not-started">Not Started</span>'
                            }
                        </div>
                    </div>
                    
                    <div class="module-content">
                        <h3 class="module-title">${this.escapeHtml(
                          module.title
                        )}</h3>
                        <p class="module-description">${this.escapeHtml(
                          module.description
                        )}</p>
                        
                        <div class="module-stats">
                            <div class="stat-item">
                                <span class="stat-icon">📚</span>
                                <span class="stat-text">${
                                  module.lesson_count
                                } lessons</span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-icon">⏱️</span>
                                <span class="stat-text">${
                                  module.estimated_hours
                                }h</span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-icon">⭐</span>
                                <span class="stat-text">${
                                  module.total_xp
                                } XP</span>
                            </div>
                        </div>
                        
                        <div class="module-difficulty">
                            <span class="difficulty-badge ${module.difficulty}">
                                ${
                                  module.difficulty.charAt(0).toUpperCase() +
                                  module.difficulty.slice(1)
                                }
                            </span>
                        </div>
                        
                        ${
                          this.isAuthenticated
                            ? `
                            <div class="progress-section">
                                <div class="progress-info">
                                    <span class="progress-text">
                                        ${progress.completed_lessons}/${
                                module.lesson_count
                              } lessons
                                    </span>
                                    <span class="progress-percentage">${progressPercentage.toFixed(
                                      0
                                    )}%</span>
                                </div>
                                <div class="progress-bar">
                                    <div class="progress-fill" style="width: ${progressPercentage}%"></div>
                                </div>
                                ${
                                  progress.earned_xp > 0
                                    ? `
                                    <div class="xp-earned">
                                        <span class="xp-icon">💎</span>
                                        <span>${progress.earned_xp} XP earned</span>
                                    </div>
                                `
                                    : ""
                                }
                            </div>
                        `
                            : `
                            <div class="auth-prompt">
                                <p>Sign in to track your progress</p>
                                <button class="btn btn-primary btn-sm" onclick="showLogin()">Sign In</button>
                            </div>
                        `
                        }
                    </div>
                    
                    <div class="module-footer">
                        <button class="btn btn-primary btn-block">
                            ${isStarted ? "Continue Learning" : "Start Module"}
                        </button>
                    </div>
                </div>
            `;
      })
      .join("");

    // Add animation to cards
    this.animateModuleCards();
  }

  animateModuleCards() {
    const cards = document.querySelectorAll(".module-card");
    cards.forEach((card, index) => {
      card.style.opacity = "0";
      card.style.transform = "translateY(20px)";

      setTimeout(() => {
        card.style.transition = "all 0.5s ease";
        card.style.opacity = "1";
        card.style.transform = "translateY(0)";
      }, index * 100);
    });
  }

  async viewModule(moduleSlug) {
    try {
      this.showLoadingState();

      const response = await fetch(`/api/modules/${moduleSlug}`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Failed to load module");
      }

      this.currentModule = result.module;
      this.showModuleView();
    } catch (error) {
      console.error("Error viewing module:", error);
      this.showError("Failed to load module details");
    }
  }

  showModuleView() {
    const modulesSection = document.querySelector(".modules-section");
    if (!modulesSection) return;

    const module = this.currentModule;
    const stats = module.stats;

    modulesSection.innerHTML = `
            <div class="container">
                <div class="module-detail-header">
                    <button class="btn btn-secondary back-btn" onclick="learnPage.showModulesList()">
                        ← Back to Modules
                    </button>
                    
                    <div class="module-hero">
                        <div class="module-hero-content">
                            <div class="module-hero-icon" style="background-color: ${
                              module.color
                            }">
                                ${module.icon}
                            </div>
                            <div class="module-hero-info">
                                <h1 class="module-hero-title">${this.escapeHtml(
                                  module.title
                                )}</h1>
                                <p class="module-hero-description">${this.escapeHtml(
                                  module.description
                                )}</p>
                                
                                <div class="module-hero-stats">
                                    <div class="hero-stat">
                                        <span class="hero-stat-number">${
                                          module.lessons.length
                                        }</span>
                                        <span class="hero-stat-label">Lessons</span>
                                    </div>
                                    <div class="hero-stat">
                                        <span class="hero-stat-number">${
                                          module.estimated_hours
                                        }h</span>
                                        <span class="hero-stat-label">Duration</span>
                                    </div>
                                    <div class="hero-stat">
                                        <span class="hero-stat-number">${
                                          stats.total_xp
                                        }</span>
                                        <span class="hero-stat-label">Total XP</span>
                                    </div>
                                    <div class="hero-stat">
                                        <span class="hero-stat-number">${
                                          module.difficulty
                                        }</span>
                                        <span class="hero-stat-label">Level</span>
                                    </div>
                                </div>
                                
                                ${
                                  this.isAuthenticated && stats.is_started
                                    ? `
                                    <div class="module-progress-summary">
                                        <div class="progress-summary-text">
                                            <span class="progress-completed">${
                                              stats.completed_lessons
                                            }</span>
                                            <span class="progress-separator">/</span>
                                            <span class="progress-total">${
                                              stats.total_lessons
                                            }</span>
                                            <span class="progress-label">lessons completed</span>
                                        </div>
                                        <div class="progress-bar large">
                                            <div class="progress-fill" style="width: ${
                                              stats.progress_percentage
                                            }%"></div>
                                        </div>
                                        <div class="progress-xp">
                                            <span class="xp-earned">${
                                              stats.earned_xp
                                            } XP earned</span>
                                            <span class="xp-remaining">${
                                              stats.total_xp - stats.earned_xp
                                            } XP remaining</span>
                                        </div>
                                    </div>
                                `
                                    : ""
                                }
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="lessons-section">
                    <div class="lessons-header">
                        <h2>Lessons</h2>
                        <p>Master each concept step by step</p>
                    </div>
                    
                    <div class="lessons-grid">
                        ${this.renderLessons()}
                    </div>
                </div>
            </div>
        `;

    this.animateLessonCards();
  }

  renderLessons() {
    if (
      !this.currentModule.lessons ||
      this.currentModule.lessons.length === 0
    ) {
      return `
                <div class="no-lessons">
                    <div class="no-lessons-icon">📚</div>
                    <h3>No lessons available</h3>
                    <p>This module is still being prepared. Check back soon!</p>
                </div>
            `;
    }

    return this.currentModule.lessons
      .map((lesson, index) => {
        const isCompleted = lesson.is_completed;
        const isLocked = lesson.is_locked;
        const canStart = !isLocked;

        return `
                <div class="lesson-card ${isCompleted ? "completed" : ""} ${
          isLocked ? "locked" : ""
        }" 
                     onclick="${
                       canStart ? `learnPage.startLesson('${lesson.slug}')` : ""
                     }"
                     data-lesson="${lesson.slug}">
                    
                    <div class="lesson-number">
                        ${isCompleted ? "✓" : index + 1}
                    </div>
                    
                    <div class="lesson-content">
                        <div class="lesson-header">
                            <h3 class="lesson-title">${this.escapeHtml(
                              lesson.title
                            )}</h3>
                            <div class="lesson-meta">
                                <span class="lesson-duration">
                                    <span class="meta-icon">⏱️</span>
                                    ${lesson.duration_minutes} min
                                </span>
                                <span class="lesson-xp">
                                    <span class="meta-icon">⭐</span>
                                    ${lesson.xp_reward} XP
                                </span>
                            </div>
                        </div>
                        
                        <p class="lesson-description">${this.escapeHtml(
                          lesson.description
                        )}</p>
                        
                        <div class="lesson-objectives">
                            <h4>You'll learn:</h4>
                            <ul>
                                ${lesson.learning_objectives
                                  .map(
                                    (obj) => `<li>${this.escapeHtml(obj)}</li>`
                                  )
                                  .join("")}
                            </ul>
                        </div>
                        
                        <div class="lesson-footer">
                            <div class="lesson-difficulty">
                                <span class="difficulty-badge ${
                                  lesson.difficulty
                                }">
                                    ${
                                      lesson.difficulty
                                        .charAt(0)
                                        .toUpperCase() +
                                      lesson.difficulty.slice(1)
                                    }
                                </span>
                            </div>
                            
                            ${
                              isCompleted
                                ? `
                                <div class="lesson-completed">
                                    <span class="completed-icon">✓</span>
                                    <span class="completed-text">Completed</span>
                                    <span class="completed-xp">+${lesson.earned_xp} XP</span>
                                </div>
                            `
                                : isLocked
                                ? `
                                <div class="lesson-locked">
                                    <span class="locked-icon">🔒</span>
                                    <span class="locked-text">Complete previous lessons</span>
                                </div>
                            `
                                : `
                                <button class="btn btn-primary btn-sm">
                                    Start Lesson
                                </button>
                            `
                            }
                        </div>
                    </div>
                </div>
            `;
      })
      .join("");
  }

  animateLessonCards() {
    const cards = document.querySelectorAll(".lesson-card");
    cards.forEach((card, index) => {
      card.style.opacity = "0";
      card.style.transform = "translateX(-20px)";

      setTimeout(() => {
        card.style.transition = "all 0.4s ease";
        card.style.opacity = "1";
        card.style.transform = "translateX(0)";
      }, index * 50);
    });
  }

  async startLesson(lessonSlug) {
    try {
      this.showLoadingState();

      const response = await fetch(`/api/lessons/${lessonSlug}`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Failed to load lesson");
      }

      this.currentLesson = result.lesson;
      this.showLessonView();
    } catch (error) {
      console.error("Error starting lesson:", error);
      this.showError("Failed to load lesson");
    }
  }

  showLessonView() {
    const modulesSection = document.querySelector(".modules-section");
    if (!modulesSection) return;

    const lesson = this.currentLesson;

    modulesSection.innerHTML = `
            <div class="container">
                <div class="lesson-detail-header">
                    <button class="btn btn-secondary back-btn" onclick="learnPage.viewModule('${
                      this.currentModule.slug
                    }')">
                        ← Back to ${this.currentModule.title}
                    </button>
                    
                    <div class="lesson-hero">
                        <div class="lesson-hero-content">
                            <div class="lesson-breadcrumb">
                                <span class="breadcrumb-item">${this.escapeHtml(
                                  lesson.module.title
                                )}</span>
                                <span class="breadcrumb-separator">›</span>
                                <span class="breadcrumb-item current">${this.escapeHtml(
                                  lesson.title
                                )}</span>
                            </div>
                            
                            <h1 class="lesson-hero-title">${this.escapeHtml(
                              lesson.title
                            )}</h1>
                            <p class="lesson-hero-description">${this.escapeHtml(
                              lesson.description
                            )}</p>
                            
                            <div class="lesson-hero-meta">
                                <div class="meta-item">
                                    <span class="meta-icon">⏱️</span>
                                    <span>${
                                      lesson.duration_minutes
                                    } minutes</span>
                                </div>
                                <div class="meta-item">
                                    <span class="meta-icon">⭐</span>
                                    <span>${lesson.xp_reward} XP</span>
                                </div>
                                <div class="meta-item">
                                    <span class="meta-icon">📊</span>
                                    <span class="difficulty-badge ${
                                      lesson.difficulty
                                    }">
                                        ${
                                          lesson.difficulty
                                            .charAt(0)
                                            .toUpperCase() +
                                          lesson.difficulty.slice(1)
                                        }
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="lesson-content-section">
                    <div class="lesson-sidebar">
                        <div class="lesson-objectives-card">
                            <h3>Learning Objectives</h3>
                            <ul class="objectives-list">
                                ${lesson.learning_objectives
                                  .map(
                                    (obj) => `<li>${this.escapeHtml(obj)}</li>`
                                  )
                                  .join("")}
                            </ul>
                        </div>
                        
                        ${
                          lesson.challenges && lesson.challenges.length > 0
                            ? `
                            <div class="related-challenges-card">
                                <h3>Practice Challenges</h3>
                                <div class="challenges-list">
                                    ${lesson.challenges
                                      .map(
                                        (challenge) => `
                                        <div class="challenge-item ${
                                          challenge.is_completed
                                            ? "completed"
                                            : ""
                                        }">
                                            <div class="challenge-info">
                                                <h4>${this.escapeHtml(
                                                  challenge.title
                                                )}</h4>
                                                <p>${this.escapeHtml(
                                                  challenge.description
                                                )}</p>
                                                <div class="challenge-meta">
                                                    <span class="difficulty-badge ${
                                                      challenge.difficulty
                                                    }">
                                                        ${challenge.difficulty}
                                                    </span>
                                                    <span class="xp-reward">${
                                                      challenge.xp_reward
                                                    } XP</span>
                                                </div>
                                            </div>
                                            <button class="btn btn-sm ${
                                              challenge.is_completed
                                                ? "btn-success"
                                                : "btn-primary"
                                            }" 
                                                    onclick="learnPage.startChallenge('${
                                                      challenge.slug
                                                    }')">
                                                ${
                                                  challenge.is_completed
                                                    ? "Completed ✓"
                                                    : "Try Challenge"
                                                }
                                            </button>
                                        </div>
                                    `
                                      )
                                      .join("")}
                                </div>
                            </div>
                        `
                            : ""
                        }
                    </div>
                    
                    <div class="lesson-main-content">
                        <div class="lesson-content-card">
                            <div class="content-header">
                                <h2>Lesson Content</h2>
                                ${
                                  lesson.is_completed
                                    ? `
                                    <div class="completion-badge">
                                        <span class="completion-icon">✓</span>
                                        <span>Completed</span>
                                    </div>
                                `
                                    : ""
                                }
                            </div>
                            
                            <div class="markdown-content">
                                ${this.renderMarkdown(lesson.content_md)}
                            </div>
                        </div>
                        
                        <div class="lesson-actions">
                            <div class="action-buttons">
                                <button class="btn btn-primary btn-large" onclick="learnPage.startPractice()">
                                    <span class="btn-icon">💻</span>
                                    Start Coding Practice
                                </button>
                                
                                ${
                                  !lesson.is_completed
                                    ? `
                                    <button class="btn btn-success btn-large" onclick="learnPage.completeLesson()">
                                        <span class="btn-icon">✓</span>
                                        Mark as Complete
                                    </button>
                                `
                                    : `
                                    <button class="btn btn-secondary btn-large" onclick="learnPage.reviewLesson()">
                                        <span class="btn-icon">📖</span>
                                        Review Lesson
                                    </button>
                                `
                                }
                            </div>
                            
                            <div class="lesson-navigation">
                                <button class="btn btn-outline" onclick="learnPage.previousLesson()">
                                    ← Previous Lesson
                                </button>
                                <button class="btn btn-outline" onclick="learnPage.nextLesson()">
                                    Next Lesson →
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
  }

  startPractice() {
    if (!this.currentLesson) return;

    // Store lesson data for the code editor
    const practiceData = {
      type: "lesson",
      id: this.currentLesson.id,
      slug: this.currentLesson.slug,
      title: this.currentLesson.title,
      description: this.currentLesson.description,
      starter_code: this.currentLesson.starter_code,
      test_spec: this.currentLesson.test_spec_json,
      solution_code: this.currentLesson.solution_code,
    };

    localStorage.setItem("codequest_practice", JSON.stringify(practiceData));

    // Redirect to editor
    window.location.href = "editor.html";
  }

  startChallenge(challengeSlug) {
    // Store challenge data and redirect to challenges page
    localStorage.setItem("codequest_challenge_slug", challengeSlug);
    window.location.href = "challenges.html";
  }

  async completeLesson() {
    if (!this.currentLesson || !this.isAuthenticated) {
      this.showNotification("Please sign in to track your progress", "warning");
      return;
    }

    try {
      const response = await fetch("/api/lessons/complete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          lessonSlug: this.currentLesson.slug,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to complete lesson");
      }

      // Show success notification
      this.showNotification(
        `Lesson completed! +${result.xp_earned} XP`,
        "success"
      );

      // Show achievements if any
      if (result.new_achievements && result.new_achievements.length > 0) {
        this.showAchievements(result.new_achievements);
      }

      // Show level up if applicable
      if (result.level_up) {
        this.showLevelUp(result.current_level);
      }

      // Update lesson state
      this.currentLesson.is_completed = true;
      this.currentLesson.earned_xp = result.xp_earned;

      // Refresh the view
      setTimeout(() => {
        this.showLessonView();
      }, 2000);
    } catch (error) {
      console.error("Error completing lesson:", error);
      this.showNotification(error.message, "error");
    }
  }

  showModulesList() {
    const modulesSection = document.querySelector(".modules-section");
    if (!modulesSection) return;

    modulesSection.innerHTML = `
            <div class="container">
                <div class="learn-header">
                    <h1>Choose Your Learning Path</h1>
                    <p>Master web development with our structured courses designed for your success</p>
                </div>
                <div id="modulesGrid" class="modules-grid">
                    <!-- Modules will be loaded here -->
                </div>
            </div>
        `;

    this.renderModules();
  }

  updateProgressSummary() {
    if (!this.isAuthenticated) return;

    const totalModules = this.modules.length;
    const completedModules = this.modules.filter(
      (m) => m.user_progress.is_completed
    ).length;
    const totalLessons = this.modules.reduce(
      (sum, m) => sum + m.lesson_count,
      0
    );
    const completedLessons = this.modules.reduce(
      (sum, m) => sum + m.user_progress.completed_lessons,
      0
    );
    const totalXP = this.modules.reduce(
      (sum, m) => sum + m.user_progress.earned_xp,
      0
    );

    // Update header if exists
    const progressSummary = document.querySelector(".progress-summary");
    if (progressSummary) {
      progressSummary.innerHTML = `
                <div class="summary-stat">
                    <span class="stat-number">${completedModules}</span>
                    <span class="stat-label">Modules Completed</span>
                </div>
                <div class="summary-stat">
                    <span class="stat-number">${completedLessons}</span>
                    <span class="stat-label">Lessons Completed</span>
                </div>
                <div class="summary-stat">
                    <span class="stat-number">${totalXP}</span>
                    <span class="stat-label">XP Earned</span>
                </div>
            `;
    }
  }

  showEmptyState() {
    const modulesGrid = document.getElementById("modulesGrid");
    if (modulesGrid) {
      modulesGrid.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">📚</div>
                    <h3>No Learning Modules Available</h3>
                    <p>We're preparing amazing content for you. Check back soon!</p>
                    <button class="btn btn-primary" onclick="location.reload()">
                        Refresh Page
                    </button>
                </div>
            `;
    }
  }

  showError(message) {
    const modulesGrid = document.getElementById("modulesGrid");
    if (modulesGrid) {
      modulesGrid.innerHTML = `
                <div class="error-state">
                    <div class="error-icon">⚠️</div>
                    <h3>Oops! Something went wrong</h3>
                    <p>${message}</p>
                    <div class="error-actions">
                        <button class="btn btn-primary" onclick="location.reload()">
                            Try Again
                        </button>
                        <button class="btn btn-secondary" onclick="learnPage.loadModules()">
                            Reload Content
                        </button>
                    </div>
                </div>
            `;
    }
  }

  showNotification(message, type = "info") {
    const notification = document.createElement("div");
    notification.className = `notification ${type}`;
    notification.innerHTML = `
            <div class="notification-content">
                <span class="notification-icon">
                    ${
                      type === "success"
                        ? "✅"
                        : type === "error"
                        ? "❌"
                        : type === "warning"
                        ? "⚠️"
                        : "ℹ️"
                    }
                </span>
                <span class="notification-message">${message}</span>
            </div>
            <button class="notification-close" onclick="this.parentElement.remove()">&times;</button>
        `;

    document.body.appendChild(notification);

    // Animate in
    setTimeout(() => notification.classList.add("show"), 100);

    // Auto-remove after 5 seconds
    setTimeout(() => {
      if (notification.parentElement) {
        notification.classList.remove("show");
        setTimeout(() => notification.remove(), 300);
      }
    }, 5000);
  }

  showAchievements(achievements) {
    achievements.forEach((achievement, index) => {
      setTimeout(() => {
        const achievementEl = document.createElement("div");
        achievementEl.className = "achievement-popup";
        achievementEl.innerHTML = `
                    <div class="achievement-content">
                        <div class="achievement-icon">🏆</div>
                        <div class="achievement-info">
                            <h3>Achievement Unlocked!</h3>
                            <h4>${achievement.name}</h4>
                            <p>${achievement.description}</p>
                        </div>
                    </div>
                `;

        document.body.appendChild(achievementEl);

        setTimeout(() => achievementEl.classList.add("show"), 100);
        setTimeout(() => {
          achievementEl.classList.remove("show");
          setTimeout(() => achievementEl.remove(), 500);
        }, 4000);
      }, index * 1000);
    });
  }

  showLevelUp(newLevel) {
    const levelUpEl = document.createElement("div");
    levelUpEl.className = "level-up-popup";
    levelUpEl.innerHTML = `
            <div class="level-up-content">
                <div class="level-up-icon">🎉</div>
                <div class="level-up-info">
                    <h3>Level Up!</h3>
                    <h4>You reached Level ${newLevel}</h4>
                    <p>Keep up the great work!</p>
                </div>
            </div>
        `;

    document.body.appendChild(levelUpEl);

    setTimeout(() => levelUpEl.classList.add("show"), 100);
    setTimeout(() => {
      levelUpEl.classList.remove("show");
      setTimeout(() => levelUpEl.remove(), 500);
    }, 5000);
  }

  renderMarkdown(markdown) {
    if (!markdown) return "";

    // Enhanced markdown to HTML conversion
    return markdown
      .replace(/^### (.*$)/gim, "<h3>$1</h3>")
      .replace(/^## (.*$)/gim, "<h2>$1</h2>")
      .replace(/^# (.*$)/gim, "<h1>$1</h1>")
      .replace(/\*\*(.*?)\*\*/gim, "<strong>$1</strong>")
      .replace(/\*(.*?)\*/gim, "<em>$1</em>")
      .replace(/`(.*?)`/gim, "<code>$1</code>")
      .replace(/```([\s\S]*?)```/gim, "<pre><code>$1</code></pre>")
      .replace(/\n\n/gim, "</p><p>")
      .replace(/\n/gim, "<br>")
      .replace(/^- (.*$)/gim, "<li>$1</li>")
      .replace(/(<li>.*<\/li>)/gim, "<ul>$1</ul>")
      .replace(/<\/ul>\s*<ul>/gim, "")
      .replace(/^(.*)$/gim, "<p>$1</p>")
      .replace(/<p><\/p>/gim, "")
      .replace(/<p>(<h[1-6]>.*<\/h[1-6]>)<\/p>/gim, "$1")
      .replace(/<p>(<ul>.*<\/ul>)<\/p>/gim, "$1")
      .replace(/<p>(<pre>.*<\/pre>)<\/p>/gim, "$1");
  }

  escapeHtml(text) {
    if (!text) return "";
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  setupEventListeners() {
    // Handle authentication state changes
    document.addEventListener("authStateChanged", (event) => {
      this.isAuthenticated = event.detail.isAuthenticated;
      this.loadModules(); // Reload to show progress
    });

    // Handle keyboard shortcuts
    document.addEventListener("keydown", (event) => {
      if (event.ctrlKey || event.metaKey) {
        switch (event.key) {
          case "h":
            event.preventDefault();
            this.showModulesList();
            break;
          case "n":
            event.preventDefault();
            this.nextLesson();
            break;
          case "p":
            event.preventDefault();
            this.previousLesson();
            break;
        }
      }
    });
  }

  setupAI() {
    // AI Assistant functionality (reuse from existing code)
    const aiButton = document.getElementById("ai-assistant-button");
    const aiChat = document.getElementById("ai-chat-window");
    const closeAiChat = document.getElementById("close-ai-chat");
    const aiSend = document.getElementById("ai-send");
    const aiInput = document.getElementById("ai-input");
    const quickActions = document.querySelectorAll(".quick-action");

    if (aiButton && aiChat) {
      aiButton.addEventListener("click", () => {
        aiChat.classList.toggle("active");
      });

      if (closeAiChat) {
        closeAiChat.addEventListener("click", () => {
          aiChat.classList.remove("active");
        });
      }
    }

    if (aiSend && aiInput) {
      aiSend.addEventListener("click", () => this.sendAIMessage());
      aiInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
          this.sendAIMessage();
        }
      });
    }

    quickActions.forEach((button) => {
      button.addEventListener("click", () => {
        const prompt = button.dataset.prompt;
        if (prompt) {
          this.sendAIMessage(prompt);
        }
      });
    });
  }

  async sendAIMessage(customPrompt = null) {
    const aiInput = document.getElementById("ai-input");
    const aiMessages = document.getElementById("ai-messages");

    if (!aiInput || !aiMessages) return;

    const prompt = customPrompt || aiInput.value.trim();
    if (!prompt) return;

    // Add user message
    const userMessage = document.createElement("div");
    userMessage.className = "ai-message user-message";
    userMessage.innerHTML = `<p>${this.escapeHtml(prompt)}</p>`;
    aiMessages.appendChild(userMessage);

    // Clear input
    if (!customPrompt) {
      aiInput.value = "";
    }

    // Add loading messagec
    const loadingMessage = document.createElement("div");
    loadingMessage.className = "ai-message ai-response loading";
    loadingMessage.innerHTML = "<p>🤔 Thinking...</p>";
    aiMessages.appendChild(loadingMessage);

    // Scroll to bottom
    aiMessages.scrollTop = aiMessages.scrollHeight;

    try {
      const response = await fetch("/api/ai", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: prompt,
          context: {
            page: "learn",
            module: this.currentModule?.slug,
            lesson: this.currentLesson?.slug,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();

      // Remove loading message
      loadingMessage.remove();

      if (result.response) {
        const aiMessage = document.createElement("div");
        aiMessage.className = "ai-message ai-response";
        aiMessage.innerHTML = `<div class="ai-content">${this.renderMarkdown(
          result.response
        )}</div>`;
        aiMessages.appendChild(aiMessage);
      } else {
        throw new Error("Invalid response format from AI");
      }
    } catch (error) {
      console.error("AI request failed:", error);

      // Remove loading message
      loadingMessage.remove();

      // Add error message
      const errorMessage = document.createElement("div");
      errorMessage.className = "ai-message ai-response error";
      errorMessage.innerHTML =
        "<p>❌ Sorry, I encountered an error. Please try again later.</p>";
      aiMessages.appendChild(errorMessage);
    }

    // Scroll to bottom
    aiMessages.scrollTop = aiMessages.scrollHeight;
  }

  // Navigation methods
  nextLesson() {
    // TODO: Implement lesson navigation
    console.log("Next lesson navigation");
  }

  previousLesson() {
    // TODO: Implement lesson navigation
    console.log("Previous lesson navigation");
  }

  reviewLesson() {
    // TODO: Implement lesson review
    console.log("Review lesson");
  }
}

// Global functions for onclick handlers
function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.style.display = "none";
  }
}

function switchToSignup() {
  closeModal("loginModal");
  document.getElementById("signupModal").style.display = "block";
}

function switchToLogin() {
  closeModal("signupModal");
  document.getElementById("loginModal").style.display = "block";
}

function showLogin() {
  document.getElementById("loginModal").style.display = "block";
}

function showSignup() {
  document.getElementById("signupModal").style.display = "block";
}

// Initialize the enhanced learn page when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  window.learnPage = new EnhancedLearnPage();
});
