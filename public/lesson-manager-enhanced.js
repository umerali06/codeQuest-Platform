/**
 * Enhanced Lesson Management System
 * Handles lesson display, interaction, and progress tracking with improved design
 */

class EnhancedLessonManager {
  constructor() {
    this.currentLesson = null;
    this.lessons = [];
    this.modules = {};
    this.userProgress = {};
    this.isLoading = false;

    this.init();
  }

  async init() {
    console.log("🎓 Initializing Enhanced Lesson Manager...");

    try {
      // Load lessons data
      await this.loadLessons();

      // Setup event listeners
      this.setupEventListeners();

      // Render lessons
      this.renderLessons();

      console.log("✅ Lesson Manager initialized successfully");
    } catch (error) {
      console.error("❌ Failed to initialize Lesson Manager:", error);
      this.showError(
        "Failed to initialize lesson system. Please refresh the page."
      );
    }
  }

  async loadLessons() {
    if (this.isLoading) return;

    this.isLoading = true;
    this.showLoadingState();

    try {
      console.log("📚 Loading lessons from API...");

      const response = await fetch("/api/lessons");

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Failed to load lessons");
      }

      // Process the grouped lesson data
      this.processLessonData(result.lessons || {});

      console.log(
        `✅ Loaded ${this.lessons.length} lessons from ${
          Object.keys(this.modules).length
        } modules`
      );
    } catch (error) {
      console.error("❌ Error loading lessons:", error);
      this.showError(
        "Failed to load lessons. Please check your connection and try again."
      );
      throw error;
    } finally {
      this.isLoading = false;
    }
  }

  processLessonData(groupedLessons) {
    this.lessons = [];
    this.modules = {};

    Object.entries(groupedLessons).forEach(([moduleSlug, moduleData]) => {
      // Store module info
      this.modules[moduleSlug] = {
        ...moduleData.module_info,
        lessons: [],
      };

      // Process lessons
      if (moduleData.lessons && Array.isArray(moduleData.lessons)) {
        moduleData.lessons.forEach((lesson) => {
          // Enhance lesson with module info
          const enhancedLesson = {
            ...lesson,
            module_title: moduleData.module_info.title,
            module_category: moduleData.module_info.category,
            module_color: moduleData.module_info.color,
            module_icon: moduleData.module_info.icon,
            module_slug: moduleData.module_info.slug,

            // Normalize status
            status: this.normalizeStatus(lesson),

            // Ensure required fields
            progress_percentage: lesson.progress_percentage || 0,
            learning_objectives: lesson.learning_objectives || [],
            prerequisites: lesson.prerequisites || [],
          };

          this.lessons.push(enhancedLesson);
          this.modules[moduleSlug].lessons.push(enhancedLesson);
        });
      }
    });

    // Sort lessons by module order and lesson order
    this.lessons.sort((a, b) => {
      if (a.module_slug !== b.module_slug) {
        return a.module_slug.localeCompare(b.module_slug);
      }
      return (a.order_index || 0) - (b.order_index || 0);
    });
  }

  normalizeStatus(lesson) {
    if (lesson.is_completed) return "completed";
    if (lesson.progress_percentage > 0) return "in-progress";
    return "not-started";
  }

  setupEventListeners() {
    // Lesson filter buttons
    document.querySelectorAll(".lesson-filter-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        this.filterLessons(e.target.dataset.filter);
      });
    });

    // Search functionality
    const searchInput = document.getElementById("lessonSearch");
    if (searchInput) {
      let searchTimeout;
      searchInput.addEventListener("input", (e) => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
          this.searchLessons(e.target.value);
        }, 300);
      });
    }

    // Modal close handlers
    document.addEventListener("click", (e) => {
      if (e.target.classList.contains("modal")) {
        this.closeLessonModal();
      }
    });

    // Keyboard shortcuts
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        this.closeLessonModal();
      }
    });
  }

  showLoadingState() {
    const container = document.getElementById("lessonsGrid");
    if (!container) return;

    container.innerHTML = `
            <div class="lessons-loading">
                <div class="lessons-loading-spinner"></div>
                <p>Loading interactive lessons...</p>
            </div>
        `;
  }

  renderLessons() {
    const container = document.getElementById("lessonsGrid");
    if (!container) return;

    if (this.lessons.length === 0) {
      container.innerHTML = this.renderEmptyState();
      return;
    }

    // Group lessons by module for display
    const moduleGroups = {};
    this.lessons.forEach((lesson) => {
      const moduleSlug = lesson.module_slug;
      if (!moduleGroups[moduleSlug]) {
        moduleGroups[moduleSlug] = {
          module: this.modules[moduleSlug],
          lessons: [],
        };
      }
      moduleGroups[moduleSlug].lessons.push(lesson);
    });

    container.innerHTML = Object.entries(moduleGroups)
      .map(([moduleSlug, moduleData]) => this.renderModuleSection(moduleData))
      .join("");

    // Add click handlers
    this.attachLessonHandlers();

    // Add animations
    this.animateLessonCards();
  }

  renderEmptyState() {
    return `
            <div class="lessons-empty">
                <div class="empty-icon">📚</div>
                <h3>No Lessons Available</h3>
                <p>Lessons are being prepared. Check back soon for new content!</p>
                <button class="btn btn-primary" onclick="lessonManager.loadLessons()">
                    <i class="fas fa-refresh"></i> Refresh
                </button>
            </div>
        `;
  }

  renderModuleSection(moduleData) {
    const { module, lessons } = moduleData;
    const completedCount = lessons.filter(
      (l) => l.status === "completed"
    ).length;
    const progressPercentage =
      lessons.length > 0
        ? Math.round((completedCount / lessons.length) * 100)
        : 0;

    return `
            <div class="module-section" data-module-slug="${module.slug}">
                <div class="module-header">
                    <div class="module-icon" style="background: ${
                      module.color
                    }">
                        ${module.icon}
                    </div>
                    <div class="module-info">
                        <h3>${module.title}</h3>
                        <p>${lessons.length} lesson${
      lessons.length !== 1 ? "s" : ""
    } • ${completedCount} completed</p>
                    </div>
                    <div class="module-progress">
                        <div class="progress-circle" data-progress="${progressPercentage}">
                            <span>${progressPercentage}%</span>
                        </div>
                    </div>
                </div>
                <div class="lessons-grid">
                    ${lessons
                      .map((lesson) => this.renderLessonCard(lesson))
                      .join("")}
                </div>
            </div>
        `;
  }

  renderLessonCard(lesson) {
    const statusClass = lesson.status || "not-started";
    const progressPercentage = lesson.progress_percentage || 0;

    return `
            <div class="lesson-card ${statusClass}" data-lesson-id="${
      lesson.id
    }" data-lesson-slug="${lesson.slug}">
                <div class="lesson-card-header">
                    <div class="lesson-status-badge ${statusClass}">
                        ${this.getStatusIcon(lesson.status)}
                    </div>
                    <div class="lesson-difficulty ${lesson.difficulty}">
                        ${lesson.difficulty}
                    </div>
                </div>
                
                <div class="lesson-content">
                    <div class="lesson-icon" style="background: ${
                      lesson.module_color
                    }">
                        ${this.getLessonIcon(lesson)}
                    </div>
                    
                    <h3 class="lesson-title">${lesson.title}</h3>
                    <p class="lesson-description">${
                      lesson.description ||
                      "Learn essential concepts and practice coding skills."
                    }</p>
                    
                    <div class="lesson-meta">
                        <span class="meta-item">
                            <i class="fas fa-clock"></i>
                            ${lesson.duration_minutes} min
                        </span>
                        <span class="meta-item">
                            <i class="fas fa-star"></i>
                            ${lesson.xp_reward} XP
                        </span>
                        <span class="meta-item">
                            <i class="fas fa-layer-group"></i>
                            ${lesson.module_title}
                        </span>
                    </div>
                    
                    ${
                      progressPercentage > 0 && progressPercentage < 100
                        ? `
                        <div class="lesson-progress">
                            <div class="progress-bar">
                                <div class="progress-fill" style="width: ${progressPercentage}%"></div>
                            </div>
                            <span class="progress-text">${progressPercentage}% complete</span>
                        </div>
                    `
                        : ""
                    }
                </div>
                
                <div class="lesson-actions">
                    <button class="lesson-btn lesson-btn-primary" onclick="lessonManager.openLesson('${
                      lesson.id
                    }')">
                        ${this.getActionButtonContent(lesson.status)}
                    </button>
                    ${
                      lesson.status === "completed"
                        ? `
                        <button class="lesson-btn lesson-btn-secondary" onclick="lessonManager.reviewLesson('${lesson.id}')">
                            <i class="fas fa-eye"></i>
                        </button>
                    `
                        : ""
                    }
                </div>
            </div>
        `;
  }

  getStatusIcon(status) {
    const icons = {
      "not-started": '<i class="fas fa-play"></i>',
      "in-progress": '<i class="fas fa-clock"></i>',
      completed: '<i class="fas fa-check"></i>',
    };
    return icons[status] || icons["not-started"];
  }

  getLessonIcon(lesson) {
    const icons = {
      html: "🌐",
      css: "🎨",
      javascript: "⚡",
      projects: "🏗️",
    };
    return icons[lesson.module_category] || "📚";
  }

  getActionButtonContent(status) {
    const buttons = {
      "not-started": '<i class="fas fa-play"></i> Start Lesson',
      "in-progress": '<i class="fas fa-arrow-right"></i> Continue',
      completed: '<i class="fas fa-redo"></i> Retake',
    };
    return buttons[status] || buttons["not-started"];
  }

  attachLessonHandlers() {
    document.querySelectorAll(".lesson-card").forEach((card) => {
      card.addEventListener("click", (e) => {
        // Don't trigger if clicking on buttons
        if (e.target.closest(".lesson-btn")) return;

        const lessonId = card.dataset.lessonId;
        this.openLesson(lessonId);
      });

      // Add hover effects
      card.addEventListener("mouseenter", () => {
        card.style.transform = "translateY(-5px)";
      });

      card.addEventListener("mouseleave", () => {
        card.style.transform = "translateY(0)";
      });
    });
  }

  animateLessonCards() {
    const cards = document.querySelectorAll(".lesson-card");
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

  async openLesson(lessonId) {
    try {
      console.log(`📖 Opening lesson: ${lessonId}`);

      // Find lesson data
      const lesson = this.lessons.find((l) => l.id === lessonId);
      if (!lesson) {
        console.error(
          "Available lessons:",
          this.lessons.map((l) => ({ id: l.id, title: l.title }))
        );
        throw new Error(`Lesson with ID "${lessonId}" not found`);
      }

      this.currentLesson = lesson;

      // Load detailed lesson content
      await this.loadLessonDetails(lessonId);

      // Show lesson modal
      this.showLessonModal();

      // Track lesson start
      await this.trackLessonStart(lessonId);
    } catch (error) {
      console.error("❌ Error opening lesson:", error);
      this.showNotification(`Failed to open lesson: ${error.message}`, "error");
    }
  }

  async openFeaturedLesson() {
    // Find the first JavaScript lesson or any available lesson
    const jsLesson = this.lessons.find(
      (l) => l.module_category === "javascript"
    );
    const firstLesson = jsLesson || this.lessons[0];

    if (firstLesson) {
      await this.openLesson(firstLesson.id);
    } else {
      this.showNotification(
        "No lessons available yet. Please check back later!",
        "info"
      );
    }
  }

  async loadLessonDetails(lessonId) {
    try {
      const response = await fetch(`/api/lessons/${lessonId}`);

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.lesson) {
          // Merge detailed data with current lesson
          Object.assign(this.currentLesson, result.lesson);
        }
      }
      // Continue even if detailed loading fails
    } catch (error) {
      console.warn("Could not load detailed lesson content:", error);
      // Continue with basic lesson data
    }
  }

  showLessonModal() {
    const modal = document.getElementById("lessonModal");
    const content = document.getElementById("lessonContent");

    if (!modal || !content || !this.currentLesson) return;

    content.innerHTML = this.renderLessonModalContent();
    modal.style.display = "flex";
    document.body.style.overflow = "hidden";

    // Add modal animation
    modal.style.opacity = "0";
    setTimeout(() => {
      modal.style.transition = "opacity 0.3s ease";
      modal.style.opacity = "1";
    }, 10);

    // Initialize lesson components
    this.initializeLessonComponents();
  }

  renderLessonModalContent() {
    const lesson = this.currentLesson;

    return `
            <div class="lesson-modal-header">
                <button class="lesson-modal-close" onclick="lessonManager.closeLessonModal()">
                    <i class="fas fa-times"></i>
                </button>
                <div class="lesson-header-content">
                    <div class="lesson-header-icon" style="background: ${
                      lesson.module_color
                    }">
                        ${this.getLessonIcon(lesson)}
                    </div>
                    <div class="lesson-header-info">
                        <h2 class="lesson-modal-title">${lesson.title}</h2>
                        <div class="lesson-modal-meta">
                            <span class="meta-badge">
                                <i class="fas fa-clock"></i> ${
                                  lesson.duration_minutes
                                } min
                            </span>
                            <span class="meta-badge">
                                <i class="fas fa-chart-line"></i> ${
                                  lesson.difficulty
                                }
                            </span>
                            <span class="meta-badge">
                                <i class="fas fa-star"></i> ${
                                  lesson.xp_reward
                                } XP
                            </span>
                            <span class="meta-badge">
                                <i class="fas fa-layer-group"></i> ${
                                  lesson.module_title
                                }
                            </span>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="lesson-modal-body">
                ${this.renderLessonObjectives()}
                ${this.renderLessonDescription()}
                ${this.renderLessonEditor()}
                ${this.renderLessonInstructions()}
            </div>
            
            <div class="lesson-modal-footer">
                <div class="lesson-nav-left">
                    <button class="lesson-nav-btn lesson-nav-secondary" onclick="lessonManager.previousLesson()">
                        <i class="fas fa-arrow-left"></i> Previous
                    </button>
                </div>
                <div class="lesson-nav-center">
                    <button class="lesson-btn lesson-btn-success" onclick="lessonManager.runTests()">
                        <i class="fas fa-play"></i> Run Code
                    </button>
                    <button class="lesson-btn lesson-btn-secondary" onclick="lessonManager.resetCode()">
                        <i class="fas fa-undo"></i> Reset
                    </button>
                    <button class="lesson-btn lesson-btn-primary" onclick="lessonManager.completeLesson()">
                        <i class="fas fa-check"></i> Complete
                    </button>
                </div>
                <div class="lesson-nav-right">
                    <button class="lesson-nav-btn lesson-nav-primary" onclick="lessonManager.nextLesson()">
                        Next <i class="fas fa-arrow-right"></i>
                    </button>
                </div>
            </div>
        `;
  }

  renderLessonObjectives() {
    const objectives = this.currentLesson.learning_objectives || [];

    if (objectives.length === 0) return "";

    return `
            <div class="lesson-section">
                <div class="lesson-objectives">
                    <h3><i class="fas fa-bullseye"></i> Learning Objectives</h3>
                    <ul class="objectives-list">
                        ${objectives.map((obj) => `<li>${obj}</li>`).join("")}
                    </ul>
                </div>
            </div>
        `;
  }

  renderLessonDescription() {
    const description = this.currentLesson.description || "";

    return `
            <div class="lesson-section">
                <div class="lesson-description-content">
                    <h3><i class="fas fa-info-circle"></i> About This Lesson</h3>
                    <p>${description}</p>
                </div>
            </div>
        `;
  }

  renderLessonEditor() {
    const starterCode = this.currentLesson.starter_code || {};

    return `
            <div class="lesson-section">
                <div class="lesson-editor-section">
                    <div class="editor-header">
                        <h3><i class="fas fa-code"></i> Code Editor</h3>
                        <div class="editor-tabs">
                            <button class="editor-tab active" data-tab="html">HTML</button>
                            <button class="editor-tab" data-tab="css">CSS</button>
                            <button class="editor-tab" data-tab="js">JavaScript</button>
                        </div>
                    </div>
                    <div class="editor-content">
                        <div class="editor-pane">
                            <textarea 
                                id="codeEditor" 
                                class="code-textarea"
                                placeholder="Write your code here..."
                            >${starterCode.html || ""}</textarea>
                        </div>
                        <div class="preview-pane">
                            <div class="preview-header">
                                <span><i class="fas fa-eye"></i> Live Preview</span>
                            </div>
                            <iframe id="previewFrame" class="preview-frame" sandbox="allow-scripts"></iframe>
                        </div>
                    </div>
                </div>
            </div>
        `;
  }

  renderLessonInstructions() {
    return `
            <div class="lesson-section">
                <div class="lesson-instructions">
                    <h3><i class="fas fa-tasks"></i> Instructions</h3>
                    <div class="instructions-content">
                        <p>Follow these steps to complete the lesson:</p>
                        <ol>
                            <li>Read the learning objectives and description</li>
                            <li>Write your code in the editor above</li>
                            <li>Click "Run Code" to test your solution</li>
                            <li>Make adjustments as needed</li>
                            <li>Click "Complete" when you're satisfied with your work</li>
                        </ol>
                    </div>
                </div>
            </div>
        `;
  }

  initializeLessonComponents() {
    // Initialize code editor tabs
    this.setupEditorTabs();

    // Initialize code preview
    this.setupCodePreview();
  }

  setupEditorTabs() {
    const tabs = document.querySelectorAll(".editor-tab");
    const editor = document.getElementById("codeEditor");

    if (!editor) return;

    const starterCode = this.currentLesson.starter_code || {};

    tabs.forEach((tab) => {
      tab.addEventListener("click", () => {
        // Update active tab
        tabs.forEach((t) => t.classList.remove("active"));
        tab.classList.add("active");

        // Update editor content
        const tabType = tab.dataset.tab;
        const codeMap = {
          html: starterCode.html || "",
          css: starterCode.css || "",
          js: starterCode.js || "",
        };

        editor.value = codeMap[tabType] || "";
      });
    });
  }

  setupCodePreview() {
    const editor = document.getElementById("codeEditor");
    const preview = document.getElementById("previewFrame");

    if (!editor || !preview) return;

    // Update preview when code changes (with debounce)
    let updateTimeout;
    editor.addEventListener("input", () => {
      clearTimeout(updateTimeout);
      updateTimeout = setTimeout(() => {
        this.updatePreview();
      }, 500);
    });

    // Initial preview
    this.updatePreview();
  }

  updatePreview() {
    const editor = document.getElementById("codeEditor");
    const preview = document.getElementById("previewFrame");

    if (!editor || !preview) return;

    try {
      const code = editor.value;

      // Create a safe blob URL for the preview
      const blob = new Blob([code], { type: "text/html" });
      const url = URL.createObjectURL(blob);

      // Set the iframe source to the blob URL
      preview.src = url;

      // Clean up the previous URL after a delay
      setTimeout(() => {
        URL.revokeObjectURL(url);
      }, 1000);
    } catch (error) {
      console.warn("Could not update preview:", error);
      // Fallback: show a simple message
      const fallbackHTML = `
        <html>
          <body style="font-family: Arial, sans-serif; padding: 20px; color: #666; background: #f5f5f5;">
            <div style="text-align: center; margin-top: 50px;">
              <h3 style="color: #333;">Code Preview</h3>
              <p>Your HTML code will appear here when you start typing.</p>
              <p><small>Write some HTML in the editor to see the live preview!</small></p>
            </div>
          </body>
        </html>
      `;
      const blob = new Blob([fallbackHTML], { type: "text/html" });
      preview.src = URL.createObjectURL(blob);
    }
  }

  closeLessonModal() {
    const modal = document.getElementById("lessonModal");
    if (modal) {
      modal.style.opacity = "0";
      setTimeout(() => {
        modal.style.display = "none";
        document.body.style.overflow = "auto";
      }, 300);
    }
    this.currentLesson = null;
  }

  // Lesson navigation and actions
  async completeLesson() {
    if (!this.currentLesson) return;

    try {
      const response = await fetch("/api/lessons/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lesson_id: this.currentLesson.id }),
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          this.showNotification(
            `Lesson completed! +${
              result.xp_earned || this.currentLesson.xp_reward
            } XP`,
            "success"
          );
          this.closeLessonModal();
          await this.loadLessons(); // Refresh data
          this.renderLessons();
        }
      }
    } catch (error) {
      console.error("Error completing lesson:", error);
    }
  }

  runTests() {
    this.showNotification("Running tests... (Feature coming soon!)", "info");
  }

  resetCode() {
    const editor = document.getElementById("codeEditor");
    if (editor && this.currentLesson) {
      const starterCode = this.currentLesson.starter_code || {};
      editor.value = starterCode.html || "";
      this.updatePreview();
      this.showNotification("Code reset to starter template", "info");
    }
  }

  previousLesson() {
    const currentIndex = this.lessons.findIndex(
      (l) => l.id === this.currentLesson?.id
    );
    if (currentIndex > 0) {
      this.openLesson(this.lessons[currentIndex - 1].id);
    }
  }

  nextLesson() {
    const currentIndex = this.lessons.findIndex(
      (l) => l.id === this.currentLesson?.id
    );
    if (currentIndex < this.lessons.length - 1) {
      this.openLesson(this.lessons[currentIndex + 1].id);
    }
  }

  // Utility methods
  filterLessons(filter) {
    // Update active filter button
    document.querySelectorAll(".lesson-filter-btn").forEach((btn) => {
      btn.classList.remove("active");
    });
    document
      .querySelector(`[data-filter="${filter}"]`)
      ?.classList.add("active");

    // Filter lesson cards
    const cards = document.querySelectorAll(".lesson-card");
    cards.forEach((card) => {
      const shouldShow = filter === "all" || card.classList.contains(filter);
      card.style.display = shouldShow ? "block" : "none";
    });
  }

  searchLessons(query) {
    const cards = document.querySelectorAll(".lesson-card");
    const searchTerm = query.toLowerCase();

    cards.forEach((card) => {
      const title =
        card.querySelector(".lesson-title")?.textContent.toLowerCase() || "";
      const description =
        card.querySelector(".lesson-description")?.textContent.toLowerCase() ||
        "";
      const matches =
        title.includes(searchTerm) || description.includes(searchTerm);

      card.style.display = matches ? "block" : "none";
    });
  }

  async trackLessonStart(lessonId) {
    try {
      await fetch("/api/lessons/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lesson_id: lessonId,
          action: "start",
        }),
      });
    } catch (error) {
      console.warn("Could not track lesson start:", error);
    }
  }

  showNotification(message, type = "info") {
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

    document.body.appendChild(notification);

    // Auto remove after 5 seconds
    setTimeout(() => {
      if (notification.parentElement) {
        notification.remove();
      }
    }, 5000);
  }

  showError(message) {
    this.showNotification(message, "error");
  }
}

// Initialize the enhanced lesson manager
let lessonManager;

document.addEventListener("DOMContentLoaded", function () {
  lessonManager = new EnhancedLessonManager();
});

// Export for global access
window.lessonManager = lessonManager;
