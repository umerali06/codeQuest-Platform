/**
 * Enhanced Learn Page Manager
 * Handles authentication, database integration, progress tracking, and UI management
 */

class LearnManager {
  constructor() {
    this.modules = [];
    this.filteredModules = [];
    this.currentFilter = "all";
    this.userProgress = null;
    this.isAuthenticated = false;
    this.currentUser = null;
    this.searchTerm = "";

    this.init();
  }

  async init() {
    try {
      console.log("🚀 Initializing Learn Manager...");

      // Check authentication status
      await this.checkAuthentication();

      if (!this.isAuthenticated) {
        console.log("❌ User not authenticated, showing auth prompt");
        this.showAuthPrompt();
        this.setupEventListeners(); // Still setup listeners for auth state changes
        return;
      }

      console.log("✅ User authenticated, loading content");
      this.hideAuthPrompt();

      // Load user progress, modules, and learning paths
      await Promise.all([
        this.loadUserProgress(),
        this.loadModules(),
        this.loadLearningPaths(),
      ]);

      // Setup UI
      this.setupEventListeners();
      this.updateProgressOverview();

      // Start periodic auth check
      this.startPeriodicAuthCheck();

      console.log("✅ Learn Manager initialized successfully");
    } catch (error) {
      console.error("❌ Error initializing Learn Manager:", error);
      this.showError(
        "Failed to initialize learning platform. Please refresh and try again."
      );
    }
  }

  async checkAuthentication() {
    try {
      // Wait for AuthManager to be available
      if (typeof window.AuthManager === "undefined") {
        console.log("⏳ Waiting for AuthManager...");
        await this.waitForAuthManager();
      }

      // Give AuthManager time to initialize and check session
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Force AuthManager to check session again
      if (window.AuthManager && window.AuthManager.checkSession) {
        await window.AuthManager.checkSession();
      }

      this.isAuthenticated = window.AuthManager.isLoggedIn();
      this.currentUser = window.AuthManager.getCurrentUser();

      console.log(
        "🔐 Authentication status:",
        this.isAuthenticated ? "Logged in" : "Not logged in",
        this.currentUser
          ? `User: ${this.currentUser.name || this.currentUser.email}`
          : ""
      );

      // Double check with localStorage as fallback
      if (!this.isAuthenticated) {
        const storedUser = localStorage.getItem("codequest_user");
        if (storedUser) {
          try {
            const userData = JSON.parse(storedUser);
            if (
              userData &&
              userData.sessionExpiry &&
              new Date(userData.sessionExpiry) > new Date()
            ) {
              this.isAuthenticated = true;
              this.currentUser = userData;
              console.log("🔐 Found valid session in localStorage");
            }
          } catch (e) {
            console.log("Invalid stored session data");
          }
        }
      }
    } catch (error) {
      console.error("Authentication check failed:", error);
      this.isAuthenticated = false;
    }
  }

  waitForAuthManager() {
    return new Promise((resolve) => {
      let attempts = 0;
      const maxAttempts = 50; // 5 seconds max wait

      const checkAuthManager = () => {
        attempts++;
        if (
          typeof window.AuthManager !== "undefined" &&
          window.AuthManager.isLoggedIn
        ) {
          console.log(`✅ AuthManager found after ${attempts} attempts`);
          resolve();
        } else if (attempts >= maxAttempts) {
          console.warn(
            "⚠️ AuthManager not found after maximum attempts, proceeding anyway"
          );
          resolve();
        } else {
          setTimeout(checkAuthManager, 100);
        }
      };
      checkAuthManager();
    });
  }

  // Periodic authentication check
  startPeriodicAuthCheck() {
    setInterval(() => {
      if (window.AuthManager) {
        const currentAuthState = window.AuthManager.isLoggedIn();
        if (currentAuthState !== this.isAuthenticated) {
          console.log("🔄 Auth state mismatch detected, syncing...");
          this.isAuthenticated = currentAuthState;
          this.currentUser = window.AuthManager.getCurrentUser();

          if (this.isAuthenticated) {
            this.hideAuthPrompt();
            this.init();
          } else {
            this.showAuthPrompt();
          }
        }
      }
    }, 5000); // Check every 5 seconds
  }

  showAuthPrompt() {
    const authCheck = document.getElementById("authCheck");
    const learnHeader = document.getElementById("learnHeader");
    const progressOverview = document.getElementById("progressOverview");
    const modulesSection = document.getElementById("modulesSection");

    // Prevent scrolling when auth prompt is shown
    document.body.style.overflow = "hidden";
    document.body.classList.add("modal-open");

    if (authCheck) {
      authCheck.style.display = "flex";
      authCheck.style.position = "fixed";
      authCheck.style.top = "0";
      authCheck.style.left = "0";
      authCheck.style.width = "100%";
      authCheck.style.height = "100%";
      authCheck.style.backgroundColor = "rgba(0, 0, 0, 0.8)";
      authCheck.style.zIndex = "9999";
      authCheck.style.justifyContent = "center";
      authCheck.style.alignItems = "center";
    }
    if (learnHeader) learnHeader.style.display = "none";
    if (progressOverview) progressOverview.style.display = "none";
    if (modulesSection) modulesSection.style.display = "none";
  }

  hideAuthPrompt() {
    const authCheck = document.getElementById("authCheck");
    const learnHeader = document.getElementById("learnHeader");
    const progressOverview = document.getElementById("progressOverview");
    const modulesSection = document.getElementById("modulesSection");

    // Restore scrolling
    document.body.style.overflow = "";
    document.body.classList.remove("modal-open");

    if (authCheck) {
      authCheck.style.display = "none";
      authCheck.style.position = "";
      authCheck.style.top = "";
      authCheck.style.left = "";
      authCheck.style.width = "";
      authCheck.style.height = "";
      authCheck.style.backgroundColor = "";
      authCheck.style.zIndex = "";
    }
    if (learnHeader) learnHeader.style.display = "block";
    if (progressOverview) progressOverview.style.display = "block";
    if (modulesSection) modulesSection.style.display = "block";
  }

  async loadUserProgress() {
    try {
      if (!this.isAuthenticated) return;

      this.userProgress = window.AuthManager.getProgress();
      console.log("📊 User progress loaded:", this.userProgress);
    } catch (error) {
      console.error("Failed to load user progress:", error);
      this.userProgress = this.getDefaultProgress();
    }
  }

  getDefaultProgress() {
    return {
      totalXP: 0,
      level: 1,
      levelTitle: "Beginner",
      streak: 0,
      statistics: {
        html: { xp: 0, progress: 0, lessons: 0 },
        css: { xp: 0, progress: 0, lessons: 0 },
        javascript: { xp: 0, progress: 0, lessons: 0 },
      },
      completedLessons: [],
      achievements: [],
    };
  }

  async loadModules() {
    try {
      console.log("📚 Loading modules...");

      const response = await fetch("/api/modules");

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Failed to load modules");
      }

      this.modules = result.modules || [];
      this.filteredModules = [...this.modules];

      console.log(`✅ Loaded ${this.modules.length} modules`);

      this.renderModules();
      this.addLessonLaunchButtons(); // Add lesson launch functionality
      this.addQuickLessonLauncher(); // Add quick lesson launcher
    } catch (error) {
      console.error("❌ Error loading modules:", error);
      this.showModulesError(
        "Failed to load learning modules. Please check your connection and try again."
      );
    }
  }

  async loadLearningPaths() {
    try {
      console.log("🛤️ Loading learning paths...");

      // Try different API URLs to debug
      const apiUrls = [
        "/api/learning-paths",
        "./api/learning-paths",
        "api/learning-paths.php",
      ];

      let response = null;
      let lastError = null;

      for (const url of apiUrls) {
        try {
          console.log(`Trying API URL: ${url}`);
          response = await fetch(url);
          if (response.ok) {
            console.log(`✅ Success with URL: ${url}`);
            break;
          } else {
            console.log(
              `❌ Failed with URL: ${url} - Status: ${response.status}`
            );
            lastError = new Error(
              `HTTP ${response.status}: ${response.statusText}`
            );
          }
        } catch (err) {
          console.log(`❌ Network error with URL: ${url} - ${err.message}`);
          lastError = err;
        }
      }

      if (!response || !response.ok) {
        throw lastError || new Error("All API endpoints failed");
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Failed to load learning paths");
      }

      this.learningPaths = result.paths || [];

      console.log(`✅ Loaded ${this.learningPaths.length} learning paths`);

      this.renderLearningPaths();
    } catch (error) {
      console.error("❌ Error loading learning paths:", error);
      console.log("🔄 Falling back to static learning paths");
      // Fallback to static data if API fails
      this.renderStaticLearningPaths();
    }
  }

  renderLearningPaths() {
    const pathsContainer = document.querySelector(".paths-container");
    if (!pathsContainer) return;

    if (this.learningPaths.length === 0) {
      this.renderStaticLearningPaths();
      return;
    }

    pathsContainer.innerHTML = this.learningPaths
      .map((path) => this.renderLearningPathCard(path))
      .join("");
  }

  renderLearningPathCard(path) {
    const progressPercentage = path.user_progress || 0;
    const status = path.status || "not_started";

    let buttonText = "Start Path";
    let buttonClass = "btn-secondary";

    if (status === "completed") {
      buttonText = "Review Path";
      buttonClass = "btn-success";
    } else if (status === "in_progress") {
      buttonText = "Continue Path";
      buttonClass = "btn-primary";
    }

    return `
      <div class="path-card ${path.slug}" data-path-id="${path.id}">
        <div class="path-header">
          <div class="path-icon">
            <i class="${path.icon}"></i>
          </div>
          <h3>${this.escapeHtml(path.title)}</h3>
        </div>
        <p>${this.escapeHtml(path.description)}</p>
        <div class="path-stats">
          <span><i class="fas fa-clock"></i> ${
            path.estimated_hours
          } hours</span>
          <span><i class="fas fa-graduation-cap"></i> ${
            path.total_modules
          } modules</span>
        </div>
        ${
          progressPercentage > 0
            ? `
          <div class="path-progress">
            <div class="progress-bar">
              <div class="progress-fill" style="width: ${progressPercentage}%"></div>
            </div>
            <span>${progressPercentage}% complete</span>
          </div>
        `
            : ""
        }
        <button class="btn ${buttonClass}" onclick="learnManager.handlePathAction('${
      path.id
    }', '${status}')">
          ${buttonText}
        </button>
      </div>
    `;
  }

  renderStaticLearningPaths() {
    const pathsContainer = document.querySelector(".paths-container");
    if (!pathsContainer) return;

    // Fallback static data with dynamic progress from user data
    const staticPaths = [
      {
        id: "frontend-development",
        title: "Frontend Development",
        description:
          "Master HTML, CSS, JavaScript and modern frameworks to build beautiful, interactive websites.",
        icon: "fas fa-paint-brush",
        estimated_hours: 120,
        total_modules: 8,
        progress: this.calculateFrontendProgress(),
      },
      {
        id: "backend-development",
        title: "Backend Development",
        description:
          "Learn server-side programming, databases, APIs and authentication to power your applications.",
        icon: "fas fa-server",
        estimated_hours: 90,
        total_modules: 6,
        progress: this.calculateBackendProgress(),
      },
      {
        id: "fullstack-mastery",
        title: "Full Stack Mastery",
        description:
          "Combine frontend and backend skills to build complete, production-ready web applications.",
        icon: "fas fa-code",
        estimated_hours: 200,
        total_modules: 12,
        progress: 0,
      },
    ];

    pathsContainer.innerHTML = staticPaths
      .map((path) => this.renderStaticPathCard(path))
      .join("");
  }

  renderStaticPathCard(path) {
    const progressPercentage = path.progress;
    let buttonText = "Start Path";
    let buttonClass = "btn-secondary";

    if (progressPercentage >= 100) {
      buttonText = "Review Path";
      buttonClass = "btn-success";
    } else if (progressPercentage > 0) {
      buttonText = "Continue Path";
      buttonClass = "btn-primary";
    }

    return `
      <div class="path-card ${path.id}" data-path-id="${path.id}">
        <div class="path-header">
          <div class="path-icon">
            <i class="${path.icon}"></i>
          </div>
          <h3>${path.title}</h3>
        </div>
        <p>${path.description}</p>
        <div class="path-stats">
          <span><i class="fas fa-clock"></i> ${
            path.estimated_hours
          } hours</span>
          <span><i class="fas fa-graduation-cap"></i> ${
            path.total_modules
          } modules</span>
        </div>
        ${
          progressPercentage > 0
            ? `
          <div class="path-progress">
            <div class="progress-bar">
              <div class="progress-fill" style="width: ${progressPercentage}%"></div>
            </div>
            <span>${Math.round(progressPercentage)}% complete</span>
          </div>
        `
            : ""
        }
        <button class="btn ${buttonClass}" onclick="learnManager.handlePathAction('${
      path.id
    }', '${progressPercentage > 0 ? "in_progress" : "not_started"}')">
          ${buttonText}
        </button>
      </div>
    `;
  }

  calculateFrontendProgress() {
    if (!this.userProgress || !this.userProgress.statistics) return 0;

    const htmlProgress = this.userProgress.statistics.html?.progress || 0;
    const cssProgress = this.userProgress.statistics.css?.progress || 0;
    const jsProgress = this.userProgress.statistics.javascript?.progress || 0;

    return Math.round((htmlProgress + cssProgress + jsProgress) / 3);
  }

  calculateBackendProgress() {
    if (!this.userProgress || !this.userProgress.statistics) return 0;

    // Backend is primarily JavaScript for this platform
    return Math.round(this.userProgress.statistics.javascript?.progress || 0);
  }

  async handlePathAction(pathId, status) {
    try {
      if (status === "not_started") {
        // Enroll in path
        const response = await fetch("/api/learning-paths/enroll", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ path_id: pathId }),
        });

        if (response.ok) {
          this.showNotification(
            "Successfully enrolled in learning path!",
            "success"
          );
          // Reload paths to show updated progress
          await this.loadLearningPaths();
        }
      } else {
        // Navigate to path details or modules
        this.showNotification("Navigating to learning path...", "info");
        // You can implement path-specific navigation here
      }
    } catch (error) {
      console.error("Error handling path action:", error);
      this.showNotification("Failed to update learning path", "error");
    }
  }

  updateProgressOverview() {
    const progressCards = document.getElementById("progressCards");
    if (!progressCards || !this.userProgress) return;

    const completedModules = this.modules.filter(
      (module) => module.user_progress && module.user_progress.is_completed
    ).length;

    const totalXP = this.userProgress.totalXP || 0;
    const streak = this.userProgress.streak || 0;
    const achievements = this.userProgress.achievements
      ? this.userProgress.achievements.length
      : 0;

    progressCards.innerHTML = `
      <div class="progress-card">
        <div class="progress-icon">
          <i class="fas fa-book-open"></i>
        </div>
        <div class="progress-info">
          <h3>${completedModules}</h3>
          <p>Modules Completed</p>
        </div>
      </div>
      <div class="progress-card">
        <div class="progress-icon">
          <i class="fas fa-trophy"></i>
        </div>
        <div class="progress-info">
          <h3>${totalXP.toLocaleString()}</h3>
          <p>XP Earned</p>
        </div>
      </div>
      <div class="progress-card">
        <div class="progress-icon">
          <i class="fas fa-fire"></i>
        </div>
        <div class="progress-info">
          <h3>${streak}</h3>
          <p>Day Streak</p>
        </div>
      </div>
      <div class="progress-card">
        <div class="progress-icon">
          <i class="fas fa-medal"></i>
        </div>
        <div class="progress-info">
          <h3>${achievements}</h3>
          <p>Achievements</p>
        </div>
      </div>
    `;
  }

  renderModules() {
    const modulesGrid = document.getElementById("modulesGrid");
    if (!modulesGrid) return;

    if (this.filteredModules.length === 0) {
      modulesGrid.innerHTML = `
        <div class="error-message">
          <div class="error-icon">🔍</div>
          <h3>No modules found</h3>
          <p>Try adjusting your search or filter criteria.</p>
          <button class="btn btn-primary" onclick="learnManager.clearFilters()">
            Show All Modules
          </button>
        </div>
      `;
      return;
    }

    modulesGrid.innerHTML = this.filteredModules
      .map((module) => this.renderModuleCard(module))
      .join("");
  }

  renderModuleCard(module) {
    const progress = module.user_progress || {
      progress_percentage: 0,
      is_started: false,
      is_completed: false,
    };
    const progressPercentage = progress.progress_percentage || 0;

    let actionButton = "";
    let statusClass = "";

    if (progress.is_completed) {
      actionButton = `<button class="module-btn secondary" onclick="learnManager.viewModule('${module.slug}')">Review Module</button>`;
      statusClass = "completed";
    } else if (progress.is_started) {
      actionButton = `<button class="module-btn primary" onclick="learnManager.viewModule('${module.slug}')">Continue Learning</button>`;
      statusClass = "in-progress";
    } else {
      actionButton = `<button class="module-btn primary" onclick="learnManager.viewModule('${module.slug}')">Start Module</button>`;
      statusClass = "not-started";
    }

    return `
      <div class="module-card ${statusClass}" data-difficulty="${
      module.difficulty
    }" data-status="${statusClass}">
        <div class="module-header">
          <div class="module-icon" style="background: ${
            module.color ||
            "linear-gradient(135deg, var(--primary), var(--secondary))"
          }">
            ${module.icon || "📚"}
          </div>
          <div class="module-info">
            <h3>${this.escapeHtml(module.title)}</h3>
            <div class="module-difficulty ${module.difficulty}">
              ${
                module.difficulty.charAt(0).toUpperCase() +
                module.difficulty.slice(1)
              }
            </div>
          </div>
        </div>
        
        <div class="module-description">
          ${this.escapeHtml(module.description)}
        </div>
        
        <div class="module-stats">
          <div class="module-stat">
            <i class="fas fa-book"></i>
            <span>${module.lesson_count || 0} lessons</span>
          </div>
          <div class="module-stat">
            <i class="fas fa-clock"></i>
            <span>${module.estimated_hours || 0}h</span>
          </div>
          <div class="module-stat">
            <i class="fas fa-star"></i>
            <span>${module.total_xp || 0} XP</span>
          </div>
        </div>
        
        <div class="module-progress">
          <div class="progress-bar">
            <div class="progress-fill" style="width: ${progressPercentage}%"></div>
          </div>
          <div class="progress-text">
            <span>${progressPercentage}% complete</span>
            <span>${progress.completed_lessons || 0}/${
      module.lesson_count || 0
    } lessons</span>
          </div>
        </div>
        
        <div class="module-actions">
          ${actionButton}
          <button class="module-btn launch-btn" onclick="learnManager.launchModuleInEditor('${
            module.slug
          }', '${this.escapeHtml(module.title)}', '${this.escapeHtml(
      module.description
    )}')">
            ✏️ Practice in Editor
          </button>
        </div>
      </div>
    `;
  }

  async viewModule(moduleSlug) {
    try {
      console.log(`📖 Loading module: ${moduleSlug}`);

      const response = await fetch(`/api/modules/${moduleSlug}`);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Failed to load module");
      }

      this.showModuleDetail(result.module);
    } catch (error) {
      console.error("❌ Error loading module:", error);
      this.showNotification(
        "Failed to load module details. Please try again.",
        "error"
      );
    }
  }

  showModuleDetail(module) {
    const modulesSection = document.getElementById("modulesSection");
    if (!modulesSection) return;

    const lessons = module.lessons || [];
    const stats = module.stats || {};

    modulesSection.innerHTML = `
      <div class="container">
        <button class="btn btn-secondary" onclick="learnManager.showModulesList()" style="margin-bottom: 2rem;">
          <i class="fas fa-arrow-left"></i> Back to Modules
        </button>
        
        <div class="module-detail-header">
          <div class="module-detail-icon" style="background: ${
            module.color ||
            "linear-gradient(135deg, var(--primary), var(--secondary))"
          }">
            ${module.icon || "📚"}
          </div>
          <div class="module-detail-info">
            <h1>${this.escapeHtml(module.title)}</h1>
            <p>${this.escapeHtml(module.description)}</p>
            <div class="module-detail-stats">
              <div class="detail-stat">
                <i class="fas fa-book"></i>
                <span>${lessons.length} lessons</span>
              </div>
              <div class="detail-stat">
                <i class="fas fa-clock"></i>
                <span>${module.estimated_hours || 0} hours</span>
              </div>
              <div class="detail-stat">
                <i class="fas fa-star"></i>
                <span>${stats.total_xp || 0} XP available</span>
              </div>
              <div class="detail-stat">
                <i class="fas fa-chart-line"></i>
                <span>${stats.progress_percentage || 0}% complete</span>
              </div>
            </div>
          </div>
        </div>
        
        <div class="lessons-grid">
          ${lessons
            .map((lesson) => this.renderLessonCard(lesson, module.slug))
            .join("")}
        </div>
      </div>
    `;
  }

  renderLessonCard(lesson, moduleSlug) {
    const completedClass = lesson.is_completed ? "completed" : "";
    const xpText = lesson.is_completed
      ? `${lesson.earned_xp} XP earned`
      : `${lesson.xp_reward} XP available`;

    return `
      <div class="lesson-card ${completedClass}" onclick="learnManager.startLesson('${
      lesson.slug
    }', '${moduleSlug}')">
        <div class="lesson-header">
          <div>
            <div class="lesson-title">${this.escapeHtml(lesson.title)}</div>
            <div class="lesson-difficulty ${lesson.difficulty}">
              ${
                lesson.difficulty.charAt(0).toUpperCase() +
                lesson.difficulty.slice(1)
              }
            </div>
          </div>
          <div class="lesson-duration">${lesson.duration_minutes || 0} min</div>
        </div>
        
        <div class="lesson-description">
          ${this.escapeHtml(lesson.description || "")}
        </div>
        
        <div class="lesson-footer">
          <div class="lesson-xp">${xpText}</div>
          ${
            lesson.is_completed
              ? '<i class="fas fa-check-circle" style="color: #22c55e;"></i>'
              : ""
          }
        </div>
      </div>
    `;
  }

  async startLesson(lessonSlug, moduleSlug) {
    try {
      console.log(`🎯 Starting lesson: ${lessonSlug}`);

      let lessonData = null;

      // Try API first
      try {
        const response = await fetch(`/api/lessons/${lessonSlug}`);
        if (response.ok) {
          const result = await response.json();
          if (result.success && result.lesson) {
            lessonData = result.lesson;
            console.log("✅ Lesson loaded from API");
          }
        }
      } catch (apiError) {
        console.log("⚠️ API failed, using fallback lesson...");
      }

      // Create fallback lesson if API failed
      if (!lessonData) {
        lessonData = this.createFallbackLesson(lessonSlug, moduleSlug);
        console.log("📚 Created fallback lesson:", lessonData.title);
      }

      // Store lesson data for the editor using our new format
      const editorLessonData = {
        id: lessonData.id || `lesson-${lessonSlug}-${Date.now()}`,
        title: lessonData.title,
        description: lessonData.description,
        slug: lessonSlug,
        difficulty: lessonData.difficulty || "beginner",
        estimated_time: lessonData.estimated_time || 30,
        category: this.detectLessonCategory(lessonData.title),
        lesson_type: "interactive",
        learning_objectives:
          lessonData.learning_objectives ||
          this.generateLearningObjectives(lessonData.title),
        content:
          lessonData.content ||
          this.generateLessonContent(lessonData.title, lessonData.description),
        starter_code:
          lessonData.starter_code || this.generateStarterCode(lessonData.title),
        exercises:
          lessonData.exercises || this.generateExercises(lessonData.title),
      };

      // Store in both formats for compatibility
      sessionStorage.setItem(
        "current_lesson",
        JSON.stringify(editorLessonData)
      );
      localStorage.setItem(
        "codequest_lesson",
        JSON.stringify({
          id: editorLessonData.id,
          slug: lessonSlug,
          title: editorLessonData.title,
          description: editorLessonData.description,
          module_slug: moduleSlug,
          starter_code: editorLessonData.starter_code,
          xp_reward: lessonData.xp_reward || 100,
        })
      );

      // Show success message
      this.showNotification(
        `🚀 Launching lesson: ${lessonData.title}`,
        "success"
      );

      // Redirect to editor with lesson parameters
      const editorUrl = `editor.html?lesson=${lessonSlug}&lesson_id=${editorLessonData.id}`;
      window.location.href = editorUrl;
    } catch (error) {
      console.error("❌ Error starting lesson:", error);
      this.showNotification(
        "Failed to start lesson. Please try again.",
        "error"
      );
    }
  }

  // Create fallback lesson when API is unavailable
  createFallbackLesson(lessonSlug, moduleSlug) {
    const lessonTypes = {
      "html-introduction": {
        title: "HTML Introduction",
        description: "Learn the basics of HTML structure and elements",
        category: "html",
      },
      "html-basics": {
        title: "HTML Basics",
        description: "Master fundamental HTML concepts and structure",
        category: "html",
      },
      "css-fundamentals": {
        title: "CSS Fundamentals",
        description: "Learn CSS styling and layout techniques",
        category: "css",
      },
      "css-styling": {
        title: "CSS Styling",
        description: "Master CSS properties and selectors",
        category: "css",
      },
      "javascript-intro": {
        title: "JavaScript Introduction",
        description: "Get started with JavaScript programming",
        category: "javascript",
      },
      "javascript-basics": {
        title: "JavaScript Basics",
        description: "Learn JavaScript fundamentals and syntax",
        category: "javascript",
      },
      "responsive-design": {
        title: "Responsive Web Design",
        description: "Create websites that work on all devices",
        category: "css",
      },
      "flexbox-layout": {
        title: "Flexbox Layout",
        description: "Master CSS Flexbox for modern layouts",
        category: "css",
      },
      "dom-manipulation": {
        title: "DOM Manipulation",
        description: "Learn to interact with HTML elements using JavaScript",
        category: "javascript",
      },
      "web-forms": {
        title: "Web Forms",
        description: "Create and validate HTML forms",
        category: "html",
      },
    };

    const lessonConfig = lessonTypes[lessonSlug] || {
      title: lessonSlug
        .replace(/-/g, " ")
        .replace(/\b\w/g, (l) => l.toUpperCase()),
      description: `Learn about ${lessonSlug.replace(/-/g, " ")}`,
      category: "html",
    };

    return {
      id: `fallback-${lessonSlug}-${Date.now()}`,
      title: lessonConfig.title,
      description: lessonConfig.description,
      difficulty: "beginner",
      estimated_time: 30,
      category: lessonConfig.category,
      module_slug: moduleSlug,
      xp_reward: 100,
      learning_objectives: this.generateLearningObjectives(lessonConfig.title),
      content: this.generateLessonContent(
        lessonConfig.title,
        lessonConfig.description
      ),
      starter_code: this.generateStarterCode(lessonConfig.title),
      exercises: this.generateExercises(lessonConfig.title),
    };
  }

  showModulesList() {
    const modulesSection = document.getElementById("modulesSection");
    if (!modulesSection) return;

    modulesSection.innerHTML = `
      <div class="container">
        <div class="section-header">
          <h2>Learning Modules</h2>
          <p>Explore structured courses designed to build your skills progressively</p>
        </div>

        <div class="modules-filter" id="modulesFilter">
          <button class="filter-btn active" data-filter="all">All Modules</button>
          <button class="filter-btn" data-filter="beginner">Beginner</button>
          <button class="filter-btn" data-filter="intermediate">Intermediate</button>
          <button class="filter-btn" data-filter="advanced">Advanced</button>
          <button class="filter-btn" data-filter="in-progress">In Progress</button>
          <button class="filter-btn" data-filter="completed">Completed</button>
          <button class="filter-btn" data-filter="not-started">Not Started</button>
        </div>

        <div class="modules-grid" id="modulesGrid">
          <!-- Modules will be rendered here -->
        </div>
      </div>
    `;

    this.setupFilterListeners();
    this.renderModules();
  }

  setupEventListeners() {
    // Search functionality
    const searchInput = document.getElementById("moduleSearch");
    if (searchInput) {
      searchInput.addEventListener("input", (e) => {
        this.searchTerm = e.target.value.toLowerCase();
        this.applyFilters();
      });

      searchInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
          this.searchModules();
        }
      });
    }

    // Filter buttons
    this.setupFilterListeners();

    // Auth state changes
    if (window.AuthManager && window.AuthManager.onAuthStateChange) {
      window.AuthManager.onAuthStateChange((user) => {
        console.log(
          "🔄 Auth state changed:",
          user ? "Logged in" : "Logged out"
        );

        if (user && !this.isAuthenticated) {
          // User just logged in
          console.log("👤 User logged in, updating UI...");
          this.isAuthenticated = true;
          this.currentUser = user;
          this.hideAuthPrompt();
          // Reload the page to show authenticated content
          window.location.reload();
        } else if (!user && this.isAuthenticated) {
          // User just logged out
          console.log("👋 User logged out, showing auth prompt...");
          this.isAuthenticated = false;
          this.currentUser = null;
          this.userProgress = null;
          this.showAuthPrompt();
        }
      });
    }

    // Update activity on user interaction
    document.addEventListener("click", () => {
      if (window.AuthManager && this.isAuthenticated) {
        window.AuthManager.updateLastActivity();
      }
    });

    document.addEventListener("keypress", () => {
      if (window.AuthManager && this.isAuthenticated) {
        window.AuthManager.updateLastActivity();
      }
    });
  }

  setupFilterListeners() {
    const filterButtons = document.querySelectorAll(".filter-btn");
    filterButtons.forEach((button) => {
      button.addEventListener("click", () => {
        // Update active state
        filterButtons.forEach((btn) => btn.classList.remove("active"));
        button.classList.add("active");

        // Apply filter
        this.currentFilter = button.dataset.filter;
        this.applyFilters();
      });
    });
  }

  applyFilters() {
    let filtered = [...this.modules];

    // Apply search filter
    if (this.searchTerm) {
      filtered = filtered.filter(
        (module) =>
          module.title.toLowerCase().includes(this.searchTerm) ||
          module.description.toLowerCase().includes(this.searchTerm) ||
          module.category.toLowerCase().includes(this.searchTerm)
      );
    }

    // Apply category filter
    if (this.currentFilter !== "all") {
      filtered = filtered.filter((module) => {
        switch (this.currentFilter) {
          case "beginner":
          case "intermediate":
          case "advanced":
            return module.difficulty === this.currentFilter;
          case "in-progress":
            return (
              module.user_progress &&
              module.user_progress.is_started &&
              !module.user_progress.is_completed
            );
          case "completed":
            return module.user_progress && module.user_progress.is_completed;
          case "not-started":
            return !module.user_progress || !module.user_progress.is_started;
          default:
            return true;
        }
      });
    }

    this.filteredModules = filtered;
    this.renderModules();
  }

  searchModules() {
    this.applyFilters();
  }

  clearFilters() {
    this.currentFilter = "all";
    this.searchTerm = "";

    const searchInput = document.getElementById("moduleSearch");
    if (searchInput) searchInput.value = "";

    const filterButtons = document.querySelectorAll(".filter-btn");
    filterButtons.forEach((btn) => btn.classList.remove("active"));

    const allButton = document.querySelector('.filter-btn[data-filter="all"]');
    if (allButton) allButton.classList.add("active");

    this.applyFilters();
  }

  showModulesError(message) {
    const modulesGrid = document.getElementById("modulesGrid");
    if (!modulesGrid) return;

    modulesGrid.innerHTML = `
      <div class="error-message">
        <div class="error-icon">⚠️</div>
        <h3>Oops! Something went wrong</h3>
        <p>${message}</p>
        <button class="btn btn-primary" onclick="learnManager.loadModules()">
          Try Again
        </button>
      </div>
    `;
  }

  showError(message) {
    this.showNotification(message, "error");
  }

  showNotification(message, type = "info") {
    // Remove existing notifications
    const existingNotifications = document.querySelectorAll(".notification");
    existingNotifications.forEach((notification) => notification.remove());

    const notification = document.createElement("div");
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
      <div class="notification-content">
        <span class="notification-message">${message}</span>
        <button class="notification-close" onclick="this.parentElement.parentElement.remove()">
          <i class="fas fa-times"></i>
        </button>
      </div>
    `;

    // Add styles
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${
        type === "error"
          ? "#ef4444"
          : type === "success"
          ? "#22c55e"
          : "#3b82f6"
      };
      color: white;
      padding: 1rem 1.5rem;
      border-radius: 0.5rem;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
      z-index: 10000;
      transform: translateX(100%);
      transition: transform 0.3s ease;
      max-width: 400px;
    `;

    document.body.appendChild(notification);

    // Animate in
    setTimeout(() => {
      notification.style.transform = "translateX(0)";
    }, 100);

    // Auto-remove after 5 seconds
    setTimeout(() => {
      if (notification.parentElement) {
        notification.style.transform = "translateX(100%)";
        setTimeout(() => notification.remove(), 300);
      }
    }, 5000);
  }

  escapeHtml(text) {
    if (!text) return "";
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  async handlePathAction(pathId, status) {
    try {
      if (status === "not_started") {
        // Try to enroll in path
        await this.enrollInPath(pathId);
      } else {
        // Show notification for continuing users
        this.showNotification("Navigating to learning path...", "info");
        // You can implement path-specific navigation here
      }
    } catch (error) {
      console.error("Error handling path action:", error);
      this.showNotification("Action completed (offline mode)", "info");
    }
  }

  async enrollInPath(pathId) {
    try {
      // Try different API URLs
      const apiUrls = [
        "/api/learning-paths/enroll",
        "./api/learning-paths/enroll",
        "api/learning-paths.php",
      ];

      let response = null;
      let lastError = null;

      for (const url of apiUrls) {
        try {
          response = await fetch(url, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ path_id: pathId }),
          });

          if (response.ok) {
            break;
          } else {
            lastError = new Error(
              `HTTP ${response.status}: ${response.statusText}`
            );
          }
        } catch (err) {
          lastError = err;
        }
      }

      if (!response || !response.ok) {
        throw lastError || new Error("Failed to enroll in path");
      }

      const result = await response.json();

      if (result.success) {
        this.showNotification(
          "Successfully enrolled in learning path!",
          "success"
        );
        // Reload paths to show updated progress
        await this.loadLearningPaths();
      } else {
        throw new Error(result.error || "Enrollment failed");
      }
    } catch (error) {
      console.error("Error enrolling in path:", error);
      // Show success message anyway for demo purposes
      this.showNotification(
        "Enrolled in learning path (offline mode)",
        "success"
      );

      // Update the button to show enrolled state
      const pathCard = document.querySelector(`[data-path-id="${pathId}"]`);
      if (pathCard) {
        const button = pathCard.querySelector(".btn");
        if (button) {
          button.textContent = "Continue Path";
          button.className = "btn btn-primary";
        }
      }
    }
  }

  async handlePathAction(pathId, status) {
    try {
      if (status === "not_started") {
        // Enroll in path and show modules
        await this.enrollInPath(pathId);
      } else {
        // Show path modules for continuing users
        await this.showPathModules(pathId);
      }
    } catch (error) {
      console.error("Error handling path action:", error);
      this.showNotification("Failed to update learning path", "error");
    }
  }

  async enrollInPath(pathId) {
    try {
      const response = await fetch("/api/learning-paths/enroll", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ path_id: pathId }),
      });

      if (response.ok) {
        this.showNotification(
          "Successfully enrolled in learning path!",
          "success"
        );
        // Show modules for this path
        await this.showPathModules(pathId);
      } else {
        throw new Error("Failed to enroll in path");
      }
    } catch (error) {
      console.error("Error enrolling in path:", error);
      this.showNotification("Failed to enroll in learning path", "error");
    }
  }

  async showPathModules(pathId) {
    try {
      console.log(`📖 Loading modules for path: ${pathId}`);

      // Get path details and modules
      const response = await fetch(`/api/learning-paths/${pathId}`);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Failed to load path modules");
      }

      this.currentPath = result.path;
      this.showPathDetailView(result.path);
    } catch (error) {
      console.error("❌ Error loading path modules:", error);
      // Fallback to showing modules by category
      this.showModulesByCategory(pathId);
    }
  }

  showPathDetailView(path) {
    const modulesSection = document.getElementById("modulesSection");
    if (!modulesSection) return;

    const pathModules =
      path.modules || this.getModulesByPathCategory(path.slug);

    modulesSection.innerHTML = `
      <div class="container">
        <button class="btn btn-secondary path-back-btn" onclick="learnManager.showPathsList()" style="margin-bottom: 2rem;">
          <i class="fas fa-arrow-left"></i> Back to Learning Paths
        </button>
        
        <div class="path-detail-header">
          <div class="path-detail-icon" style="background: ${
            path.color ||
            "linear-gradient(135deg, var(--primary), var(--secondary))"
          }">
            <i class="${path.icon || "fas fa-code"}"></i>
          </div>
          <div class="path-detail-info">
            <h1>${this.escapeHtml(path.title)}</h1>
            <p>${this.escapeHtml(path.description)}</p>
            <div class="path-detail-stats">
              <div class="detail-stat">
                <i class="fas fa-graduation-cap"></i>
                <span>${pathModules.length} modules</span>
              </div>
              <div class="detail-stat">
                <i class="fas fa-clock"></i>
                <span>${path.estimated_hours || 0} hours</span>
              </div>
              <div class="detail-stat">
                <i class="fas fa-chart-line"></i>
                <span>${Math.round(
                  path.progress_percentage || 0
                )}% complete</span>
              </div>
              <div class="detail-stat">
                <i class="fas fa-star"></i>
                <span>${path.xp_earned || 0} XP earned</span>
              </div>
            </div>
            ${
              path.progress_percentage > 0
                ? `
              <div class="path-progress-detail">
                <div class="progress-bar">
                  <div class="progress-fill" style="width: ${
                    path.progress_percentage
                  }%"></div>
                </div>
                <span>${Math.round(path.progress_percentage)}% complete (${
                    path.completed_modules
                  }/${path.total_modules} modules)</span>
              </div>
            `
                : ""
            }
          </div>
        </div>
        
        <div class="path-modules-grid">
          ${pathModules
            .map((module, index) =>
              this.renderPathModuleCard(module, index + 1)
            )
            .join("")}
        </div>
      </div>
    `;

    // Hide learning paths section
    const pathsSection = document.querySelector(".learning-paths-section");
    if (pathsSection) pathsSection.style.display = "none";
  }

  renderPathModuleCard(module, order) {
    const progress = module.user_progress || {
      progress_percentage: 0,
      is_started: false,
      is_completed: false,
    };
    const progressPercentage = progress.progress_percentage || 0;

    let actionButton = "";
    let statusClass = "";
    let statusIcon = "";

    if (progress.is_completed) {
      actionButton = `<button class="module-btn completed" onclick="learnManager.viewModule('${module.slug}')">
        <i class="fas fa-check-circle"></i> Review Module
      </button>`;
      statusClass = "completed";
      statusIcon =
        '<i class="fas fa-check-circle module-status-icon completed"></i>';
    } else if (progress.is_started) {
      actionButton = `<button class="module-btn primary" onclick="learnManager.viewModule('${module.slug}')">
        <i class="fas fa-play"></i> Continue Learning
      </button>`;
      statusClass = "in-progress";
      statusIcon =
        '<i class="fas fa-play-circle module-status-icon in-progress"></i>';
    } else {
      actionButton = `<button class="module-btn primary" onclick="learnManager.viewModule('${module.slug}')">
        <i class="fas fa-rocket"></i> Start Module
      </button>`;
      statusClass = "not-started";
      statusIcon = '<i class="fas fa-lock module-status-icon locked"></i>';
    }

    return `
      <div class="path-module-card ${statusClass}" data-module-id="${
      module.id
    }">
        <div class="module-order">${order}</div>
        ${statusIcon}
        
        <div class="module-header">
          <div class="module-icon" style="background: ${
            module.color ||
            "linear-gradient(135deg, var(--primary), var(--secondary))"
          }">
            ${module.icon || "📚"}
          </div>
          <div class="module-info">
            <h3>${this.escapeHtml(module.title)}</h3>
            <div class="module-difficulty ${module.difficulty}">
              ${
                module.difficulty.charAt(0).toUpperCase() +
                module.difficulty.slice(1)
              }
            </div>
          </div>
        </div>
        
        <div class="module-description">
          ${this.escapeHtml(module.description)}
        </div>
        
        <div class="module-stats">
          <div class="module-stat">
            <i class="fas fa-book"></i>
            <span>${module.lesson_count || 0} lessons</span>
          </div>
          <div class="module-stat">
            <i class="fas fa-clock"></i>
            <span>${module.estimated_hours || 0}h</span>
          </div>
          <div class="module-stat">
            <i class="fas fa-star"></i>
            <span>${module.total_xp || 0} XP</span>
          </div>
        </div>
        
        ${
          progressPercentage > 0
            ? `
          <div class="module-progress">
            <div class="progress-bar">
              <div class="progress-fill" style="width: ${progressPercentage}%"></div>
            </div>
            <div class="progress-text">
              <span>${progressPercentage}% complete</span>
              <span>${progress.completed_lessons || 0}/${
                module.lesson_count || 0
              } lessons</span>
            </div>
          </div>
        `
            : ""
        }
        
        <div class="module-actions">
          ${actionButton}
        </div>
      </div>
    `;
  }

  getModulesByPathCategory(pathSlug) {
    // Fallback method to get modules by category when API fails
    let categoryFilter = [];

    switch (pathSlug) {
      case "frontend-development":
        categoryFilter = ["html", "css", "javascript"];
        break;
      case "backend-development":
        categoryFilter = ["javascript", "projects"];
        break;
      case "fullstack-mastery":
        categoryFilter = ["html", "css", "javascript", "projects"];
        break;
      default:
        categoryFilter = ["html"];
    }

    return this.modules
      .filter((module) => categoryFilter.includes(module.category))
      .slice(0, 8); // Limit to 8 modules for demo
  }

  showModulesByCategory(pathId) {
    // Fallback implementation using existing modules
    const pathModules = this.getModulesByPathCategory(pathId);

    const pathInfo = {
      id: pathId,
      title: this.getPathTitle(pathId),
      description: this.getPathDescription(pathId),
      icon: this.getPathIcon(pathId),
      estimated_hours: pathModules.reduce(
        (sum, m) => sum + (m.estimated_hours || 1),
        0
      ),
      progress_percentage: this.calculatePathProgressFromModules(pathModules),
      modules: pathModules,
    };

    this.showPathDetailView(pathInfo);
  }

  getPathTitle(pathId) {
    const titles = {
      "frontend-development": "Frontend Development",
      "backend-development": "Backend Development",
      "fullstack-mastery": "Full Stack Mastery",
    };
    return titles[pathId] || "Learning Path";
  }

  getPathDescription(pathId) {
    const descriptions = {
      "frontend-development":
        "Master HTML, CSS, JavaScript and modern frameworks to build beautiful, interactive websites.",
      "backend-development":
        "Learn server-side programming, databases, APIs and authentication to power your applications.",
      "fullstack-mastery":
        "Combine frontend and backend skills to build complete, production-ready web applications.",
    };
    return (
      descriptions[pathId] ||
      "Complete this learning path to master new skills."
    );
  }

  getPathIcon(pathId) {
    const icons = {
      "frontend-development": "fas fa-paint-brush",
      "backend-development": "fas fa-server",
      "fullstack-mastery": "fas fa-code",
    };
    return icons[pathId] || "fas fa-graduation-cap";
  }

  calculatePathProgressFromModules(modules) {
    if (!modules.length) return 0;

    const completedModules = modules.filter(
      (m) => m.user_progress && m.user_progress.is_completed
    ).length;

    return Math.round((completedModules / modules.length) * 100);
  }

  showPathsList() {
    // Show learning paths section again
    const pathsSection = document.querySelector(".learning-paths-section");
    if (pathsSection) pathsSection.style.display = "block";

    // Reset modules section to show all modules
    this.showModulesList();
  }

  async updateModuleProgress(moduleId, lessonId) {
    try {
      // Update lesson completion
      const response = await fetch("/api/lessons/complete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          lesson_id: lessonId,
          module_id: moduleId,
        }),
      });

      if (response.ok) {
        // Update path progress
        if (this.currentPath) {
          await this.updatePathProgress(this.currentPath.id);
        }

        // Refresh the current view
        if (this.currentPath) {
          await this.showPathModules(this.currentPath.id);
        }

        this.showNotification("Progress updated!", "success");
      }
    } catch (error) {
      console.error("Error updating progress:", error);
    }
  }

  async updatePathProgress(pathId) {
    try {
      const response = await fetch("/api/learning-paths/progress", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ path_id: pathId }),
      });

      if (response.ok) {
        const result = await response.json();
        console.log("Path progress updated:", result.progress);
      }
    } catch (error) {
      console.error("Error updating path progress:", error);
    }
  }

  // ===== LESSON LAUNCH FUNCTIONALITY =====

  // Add lesson launch buttons to module cards
  addLessonLaunchButtons() {
    console.log("🚀 Adding lesson launch buttons...");

    // Wait for DOM to be ready
    setTimeout(() => {
      const moduleCards = document.querySelectorAll(".module-card");

      moduleCards.forEach((card) => {
        // Skip if already has launch button
        if (card.querySelector(".launch-lesson-btn")) return;

        // Extract module info
        const title = card.querySelector("h3")?.textContent || "Unknown Module";
        const description =
          card.querySelector(".module-description")?.textContent ||
          "Learn something new";

        // Create module slug from title
        const slug = title
          .toLowerCase()
          .replace(/[^a-z0-9\s]/g, "")
          .replace(/\s+/g, "-")
          .substring(0, 50);

        // Add launch button
        const launchBtn = document.createElement("button");
        launchBtn.className = "launch-lesson-btn btn btn-outline";
        launchBtn.innerHTML = "✏️ Practice in Editor";
        launchBtn.style.marginTop = "10px";
        launchBtn.onclick = (e) => {
          e.stopPropagation();
          this.launchLessonInEditor(slug, title, description);
        };

        // Add to card actions
        const cardActions = card.querySelector(".module-actions") || card;
        cardActions.appendChild(launchBtn);
      });

      console.log("✅ Lesson launch buttons added");
    }, 500);
  }

  // Launch lesson in editor
  launchLessonInEditor(slug, title, description) {
    console.log("🚀 Launching lesson in editor:", title);

    // Create lesson data
    const lessonData = {
      id: `lesson-${slug}-${Date.now()}`,
      title: title,
      description: description,
      slug: slug,
      difficulty: "beginner",
      estimated_time: 30,
      category: this.detectLessonCategory(title),
      lesson_type: "interactive",
      learning_objectives: this.generateLearningObjectives(title),
      content: this.generateLessonContent(title, description),
      starter_code: this.generateStarterCode(title),
      exercises: this.generateExercises(title),
    };

    // Store lesson data
    sessionStorage.setItem("current_lesson", JSON.stringify(lessonData));

    // Navigate to editor with lesson parameter
    const editorUrl = `editor.html?lesson=${slug}&lesson_id=${lessonData.id}`;
    window.location.href = editorUrl;
  }

  // Detect lesson category from title
  detectLessonCategory(title) {
    const titleLower = title.toLowerCase();

    if (
      titleLower.includes("html") ||
      titleLower.includes("markup") ||
      titleLower.includes("structure")
    ) {
      return "html";
    } else if (
      titleLower.includes("css") ||
      titleLower.includes("style") ||
      titleLower.includes("design") ||
      titleLower.includes("layout")
    ) {
      return "css";
    } else if (
      titleLower.includes("javascript") ||
      titleLower.includes("js") ||
      titleLower.includes("script") ||
      titleLower.includes("interactive")
    ) {
      return "javascript";
    } else if (
      titleLower.includes("responsive") ||
      titleLower.includes("mobile") ||
      titleLower.includes("flexbox") ||
      titleLower.includes("grid")
    ) {
      return "css";
    } else {
      return "html"; // Default to HTML
    }
  }

  // Generate learning objectives based on title
  generateLearningObjectives(title) {
    const titleLower = title.toLowerCase();
    const objectives = [];

    if (titleLower.includes("html")) {
      objectives.push("Understand HTML structure and syntax");
      objectives.push("Learn to use semantic HTML elements");
      objectives.push("Create well-structured web pages");
    } else if (titleLower.includes("css")) {
      objectives.push("Master CSS selectors and properties");
      objectives.push("Create attractive visual designs");
      objectives.push("Implement responsive layouts");
    } else if (titleLower.includes("javascript")) {
      objectives.push("Understand JavaScript fundamentals");
      objectives.push("Learn to manipulate the DOM");
      objectives.push("Create interactive web features");
    } else if (titleLower.includes("responsive")) {
      objectives.push("Understand responsive design principles");
      objectives.push("Use media queries effectively");
      objectives.push("Create mobile-friendly layouts");
    } else if (titleLower.includes("flexbox")) {
      objectives.push("Master CSS Flexbox properties");
      objectives.push("Create flexible layouts");
      objectives.push("Solve common layout challenges");
    } else {
      objectives.push("Learn web development fundamentals");
      objectives.push("Practice coding best practices");
      objectives.push("Build practical projects");
    }

    return objectives;
  }

  // Generate lesson content
  generateLessonContent(title, description) {
    const category = this.detectLessonCategory(title);

    const contentTemplates = {
      html: `
        <h3>HTML Fundamentals</h3>
        <p>HTML (HyperText Markup Language) is the foundation of web development. In this lesson, you'll learn:</p>
        <ul>
          <li>Basic HTML structure and syntax</li>
          <li>Common HTML elements and their purposes</li>
          <li>How to create semantic, accessible markup</li>
          <li>Best practices for HTML development</li>
        </ul>
        <p>Let's start building with HTML!</p>
      `,
      css: `
        <h3>CSS Styling</h3>
        <p>CSS (Cascading Style Sheets) brings your HTML to life with styling and layout. You'll discover:</p>
        <ul>
          <li>CSS selectors and how to target elements</li>
          <li>Essential CSS properties for styling</li>
          <li>Layout techniques and positioning</li>
          <li>Responsive design principles</li>
        </ul>
        <p>Time to make your web pages beautiful!</p>
      `,
      javascript: `
        <h3>JavaScript Programming</h3>
        <p>JavaScript adds interactivity and dynamic behavior to web pages. In this lesson:</p>
        <ul>
          <li>JavaScript syntax and basic concepts</li>
          <li>Working with variables and functions</li>
          <li>DOM manipulation and event handling</li>
          <li>Creating interactive user experiences</li>
        </ul>
        <p>Let's bring your web pages to life!</p>
      `,
    };

    return contentTemplates[category] || contentTemplates.html;
  }

  // Generate starter code
  generateStarterCode(title) {
    const category = this.detectLessonCategory(title);
    const titleClean = title.replace(/[^a-zA-Z0-9\s]/g, "").trim();

    const starterCodes = {
      html: {
        html: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${titleClean}</title>
</head>
<body>
    <div class="container">
        <h1>Welcome to ${titleClean}</h1>
        <p>Start building your HTML structure here...</p>
        
        <!-- Add your HTML content below -->
        
    </div>
</body>
</html>`,
        css: `/* ${titleClean} - Styles */

.container {
    max-width: 800px;
    margin: 0 auto;
    padding: 20px;
    font-family: Arial, sans-serif;
}

h1 {
    color: #333;
    text-align: center;
    margin-bottom: 20px;
}

/* Add your CSS styles below */`,
        js: `// ${titleClean} - JavaScript

console.log('Starting ${titleClean}');

// Add your JavaScript code below`,
      },
      css: {
        html: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${titleClean}</title>
</head>
<body>
    <div class="demo-container">
        <h1>CSS ${titleClean}</h1>
        <div class="example-box">
            <p>Style this content with CSS!</p>
        </div>
        <div class="practice-area">
            <div class="item">Item 1</div>
            <div class="item">Item 2</div>
            <div class="item">Item 3</div>
        </div>
    </div>
</body>
</html>`,
        css: `/* ${titleClean} - CSS Practice */

.demo-container {
    max-width: 900px;
    margin: 0 auto;
    padding: 20px;
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

.example-box {
    background: #f0f0f0;
    padding: 20px;
    border-radius: 8px;
    margin: 20px 0;
}

.practice-area {
    margin-top: 30px;
}

.item {
    background: #e3f2fd;
    padding: 15px;
    margin: 10px 0;
    border-radius: 4px;
    border-left: 4px solid #2196f3;
}

/* Practice your CSS skills below */`,
        js: `// ${titleClean} - JavaScript for CSS

console.log('CSS ${titleClean} loaded');

// Add interactive JavaScript if needed`,
      },
      javascript: {
        html: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${titleClean}</title>
</head>
<body>
    <div class="app-container">
        <h1>JavaScript ${titleClean}</h1>
        
        <div class="interactive-demo">
            <button id="demoBtn">Click Me!</button>
            <p id="output">Output will appear here...</p>
        </div>
        
        <div class="practice-section">
            <h3>Practice Area</h3>
            <input type="text" id="userInput" placeholder="Enter something...">
            <button id="processBtn">Process</button>
            <div id="result"></div>
        </div>
    </div>
</body>
</html>`,
        css: `/* ${titleClean} - Styles */

.app-container {
    max-width: 800px;
    margin: 0 auto;
    padding: 20px;
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

.interactive-demo {
    background: #f8f9fa;
    padding: 20px;
    border-radius: 8px;
    margin: 20px 0;
    text-align: center;
}

.practice-section {
    background: #e8f5e8;
    padding: 20px;
    border-radius: 8px;
    margin-top: 20px;
}

button {
    background: #007bff;
    color: white;
    border: none;
    padding: 10px 20px;
    border-radius: 4px;
    cursor: pointer;
    margin: 5px;
}

button:hover {
    background: #0056b3;
}

input {
    padding: 8px 12px;
    border: 1px solid #ddd;
    border-radius: 4px;
    margin: 5px;
}

#output, #result {
    margin-top: 15px;
    padding: 10px;
    background: white;
    border-radius: 4px;
    min-height: 20px;
}`,
        js: `// ${titleClean} - JavaScript Practice

console.log('JavaScript ${titleClean} started');

// Demo button functionality
document.addEventListener('DOMContentLoaded', function() {
    const demoBtn = document.getElementById('demoBtn');
    const output = document.getElementById('output');
    const processBtn = document.getElementById('processBtn');
    const userInput = document.getElementById('userInput');
    const result = document.getElementById('result');
    
    // Demo button click handler
    demoBtn.addEventListener('click', function() {
        output.textContent = 'Button clicked! Time: ' + new Date().toLocaleTimeString();
    });
    
    // Process button click handler
    processBtn.addEventListener('click', function() {
        const inputValue = userInput.value;
        if (inputValue.trim()) {
            result.textContent = 'You entered: ' + inputValue;
        } else {
            result.textContent = 'Please enter something first!';
        }
    });
});

// Add your JavaScript practice code below`,
      },
    };

    return starterCodes[category] || starterCodes.html;
  }

  // Generate exercises
  generateExercises(title) {
    const category = this.detectLessonCategory(title);

    const exerciseTemplates = {
      html: [
        {
          title: "HTML Structure Practice",
          description:
            "Create a well-structured HTML document with proper semantic elements",
          requirements: [
            "Use proper HTML5 document structure",
            "Include semantic elements like header, main, section",
            "Add appropriate meta tags",
            "Use heading hierarchy correctly",
          ],
        },
      ],
      css: [
        {
          title: "CSS Styling Challenge",
          description: "Style the provided HTML elements with attractive CSS",
          requirements: [
            "Apply colors and typography",
            "Create responsive layouts",
            "Use CSS selectors effectively",
            "Add hover effects and transitions",
          ],
        },
      ],
      javascript: [
        {
          title: "JavaScript Interactivity",
          description: "Add interactive functionality using JavaScript",
          requirements: [
            "Handle user events (clicks, input)",
            "Manipulate DOM elements",
            "Validate user input",
            "Provide user feedback",
          ],
        },
      ],
    };

    return exerciseTemplates[category] || exerciseTemplates.html;
  }

  // Add quick lesson launcher
  addQuickLessonLauncher() {
    // Skip if already exists
    if (document.querySelector(".quick-lesson-fab")) return;

    console.log("⚡ Adding quick lesson launcher...");

    // Create floating action button
    const fab = document.createElement("div");
    fab.className = "quick-lesson-fab";
    fab.innerHTML = `
      <button class="fab-btn" onclick="learnManager.toggleQuickLessonMenu()">
        <span>📚</span>
      </button>
      <div class="fab-menu" id="quickLessonMenu" style="display: none;">
        <div class="fab-menu-item" onclick="learnManager.launchQuickLesson('html-basics')">
          📄 HTML Basics
        </div>
        <div class="fab-menu-item" onclick="learnManager.launchQuickLesson('css-fundamentals')">
          🎨 CSS Fundamentals
        </div>
        <div class="fab-menu-item" onclick="learnManager.launchQuickLesson('javascript-intro')">
          ⚡ JavaScript Intro
        </div>
        <div class="fab-menu-item" onclick="learnManager.launchQuickLesson('responsive-design')">
          📱 Responsive Design
        </div>
      </div>
    `;

    // Add styles
    const fabStyles = document.createElement("style");
    fabStyles.textContent = `
      .quick-lesson-fab {
        position: fixed;
        bottom: 20px;
        right: 20px;
        z-index: 1000;
      }
      
      .fab-btn {
        width: 56px;
        height: 56px;
        border-radius: 50%;
        background: #2196f3;
        border: none;
        color: white;
        font-size: 24px;
        cursor: pointer;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        transition: all 0.3s ease;
      }
      
      .fab-btn:hover {
        background: #1976d2;
        transform: scale(1.1);
      }
      
      .fab-menu {
        position: absolute;
        bottom: 70px;
        right: 0;
        background: white;
        border-radius: 8px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.2);
        min-width: 200px;
        overflow: hidden;
      }
      
      .fab-menu-item {
        padding: 12px 16px;
        cursor: pointer;
        border-bottom: 1px solid #eee;
        transition: background 0.2s;
      }
      
      .fab-menu-item:hover {
        background: #f5f5f5;
      }
      
      .fab-menu-item:last-child {
        border-bottom: none;
      }
      
      .launch-lesson-btn {
        background: #4caf50 !important;
        color: white !important;
        border: 1px solid #4caf50 !important;
        font-size: 0.9em;
      }
      
      .launch-lesson-btn:hover {
        background: #45a049 !important;
        border-color: #45a049 !important;
      }
    `;

    document.head.appendChild(fabStyles);
    document.body.appendChild(fab);

    console.log("✅ Quick lesson launcher added");
  }

  // Toggle quick lesson menu
  toggleQuickLessonMenu() {
    const menu = document.getElementById("quickLessonMenu");
    if (menu) {
      menu.style.display = menu.style.display === "none" ? "block" : "none";
    }
  }

  // Launch quick lesson
  launchQuickLesson(slug) {
    const lessons = {
      "html-basics": "HTML Basics",
      "css-fundamentals": "CSS Fundamentals",
      "javascript-intro": "JavaScript Introduction",
      "responsive-design": "Responsive Design",
    };

    this.launchLessonInEditor(
      slug,
      lessons[slug],
      `Learn ${lessons[slug]} with hands-on practice`
    );
  }
}

// Global instance
let learnManager;

// Initialize when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  // Wait a bit for AuthManager to initialize
  setTimeout(() => {
    learnManager = new LearnManager();
    window.learnManager = learnManager;
  }, 100);
});

// Global functions for onclick handlers
window.learnManager = null;

// Enhanced Modal Functions for Learn Page
function showLogin() {
  const modal = document.getElementById("loginModal");
  if (modal) {
    document.body.classList.add("modal-open");
    modal.classList.add("show");
    modal.style.display = "block";

    // Focus on first input
    setTimeout(() => {
      const firstInput = modal.querySelector("input");
      if (firstInput) firstInput.focus();
    }, 100);

    // Setup form handler
    setupLoginForm();
  }
}

function showSignup() {
  const modal = document.getElementById("signupModal");
  if (modal) {
    document.body.classList.add("modal-open");
    modal.classList.add("show");
    modal.style.display = "block";

    // Focus on first input
    setTimeout(() => {
      const firstInput = modal.querySelector("input");
      if (firstInput) firstInput.focus();
    }, 100);

    // Setup form handler
    setupSignupForm();
  }
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.add("hide");
    document.body.classList.remove("modal-open");
    setTimeout(() => {
      modal.style.display = "none";
      modal.classList.remove("show", "hide");
      clearFormErrors(modal);
    }, 300);
  }
}

function switchToSignup() {
  closeModal("loginModal");
  setTimeout(() => showSignup(), 350);
}

function switchToLogin() {
  closeModal("signupModal");
  setTimeout(() => showLogin(), 350);
}

function setupLoginForm() {
  const form = document.getElementById("loginForm");
  if (!form) return;

  // Remove existing listeners
  const newForm = form.cloneNode(true);
  form.parentNode.replaceChild(newForm, form);

  newForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("loginEmail").value;
    const password = document.getElementById("loginPassword").value;
    const submitBtn = newForm.querySelector('button[type="submit"]');

    if (!email || !password) {
      showFormError(newForm, "Please fill in all fields");
      return;
    }

    try {
      // Show loading state
      setButtonLoading(submitBtn, true);
      clearFormErrors(newForm);

      // Attempt login
      const result = await window.AuthManager.login(email, password);

      if (result.success) {
        showFormSuccess(newForm, "Login successful! Loading content...");
        closeModal("loginModal");

        // Update learn manager state
        if (window.learnManager) {
          window.learnManager.isAuthenticated = true;
          window.learnManager.currentUser = result.user;
          window.learnManager.hideAuthPrompt();
          await window.learnManager.init();
        } else {
          // Fallback: refresh page
          window.location.reload();
        }
      } else {
        showFormError(
          newForm,
          result.error || "Login failed. Please try again."
        );
      }
    } catch (error) {
      console.error("Login error:", error);
      showFormError(
        newForm,
        "Login failed. Please check your credentials and try again."
      );
    } finally {
      setButtonLoading(submitBtn, false);
    }
  });
}

function setupSignupForm() {
  const form = document.getElementById("signupForm");
  if (!form) return;

  // Remove existing listeners
  const newForm = form.cloneNode(true);
  form.parentNode.replaceChild(newForm, form);

  newForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const name = document.getElementById("signupName").value;
    const email = document.getElementById("signupEmail").value;
    const password = document.getElementById("signupPassword").value;
    const submitBtn = newForm.querySelector('button[type="submit"]');

    if (!name || !email || !password) {
      showFormError(newForm, "Please fill in all fields");
      return;
    }

    if (password.length < 6) {
      showFormError(newForm, "Password must be at least 6 characters long");
      return;
    }

    try {
      // Show loading state
      setButtonLoading(submitBtn, true);
      clearFormErrors(newForm);

      // Attempt signup
      const result = await window.AuthManager.register(name, email, password);

      if (result.success) {
        showFormSuccess(
          newForm,
          "Account created successfully! Loading content..."
        );
        closeModal("signupModal");

        // Update learn manager state
        if (window.learnManager) {
          window.learnManager.isAuthenticated = true;
          window.learnManager.currentUser = result.user;
          window.learnManager.hideAuthPrompt();
          await window.learnManager.init();
        } else {
          // Fallback: refresh page
          window.location.reload();
        }
      } else {
        showFormError(
          newForm,
          result.error || "Registration failed. Please try again."
        );
      }
    } catch (error) {
      console.error("Signup error:", error);
      showFormError(newForm, "Registration failed. Please try again.");
    } finally {
      setButtonLoading(submitBtn, false);
    }
  });
}

function showFormError(form, message) {
  clearFormErrors(form);
  const errorDiv = document.createElement("div");
  errorDiv.className = "form-error";
  errorDiv.textContent = message;
  form.insertBefore(errorDiv, form.firstChild);
}

function showFormSuccess(form, message) {
  clearFormErrors(form);
  const successDiv = document.createElement("div");
  successDiv.className = "form-success";
  successDiv.textContent = message;
  form.insertBefore(successDiv, form.firstChild);
}

function clearFormErrors(form) {
  const errors = form.querySelectorAll(".form-error, .form-success");
  errors.forEach((error) => error.remove());
}

function setButtonLoading(button, loading) {
  if (loading) {
    button.classList.add("loading");
    button.disabled = true;
  } else {
    button.classList.remove("loading");
    button.disabled = false;
  }
}

function googleLogin() {
  learnManager.showNotification(
    "Google login integration coming soon!",
    "info"
  );
}

function googleSignup() {
  learnManager.showNotification(
    "Google signup integration coming soon!",
    "info"
  );
}

// Close modal when clicking outside
document.addEventListener("click", (e) => {
  if (e.target.classList.contains("modal")) {
    const modalId = e.target.id;
    closeModal(modalId);
  }
});

// Close modal with Escape key
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    const openModals = document.querySelectorAll(".modal.show");
    openModals.forEach((modal) => closeModal(modal.id));
  }
});

// Make functions globally available
window.showLogin = showLogin;
window.showSignup = showSignup;
window.closeModal = closeModal;
window.switchToSignup = switchToSignup;
window.switchToLogin = switchToLogin;
window.googleLogin = googleLogin;
window.googleSignup = googleSignup;
