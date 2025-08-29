/**
 * Enhanced Lesson Management System
 * Handles lesson display, interaction, and progress tracking
 */

class LessonManager {
  constructor() {
    this.currentLesson = null;
    this.lessons = [];
    this.userProgress = {};
    this.codeEditor = null;

    this.init();
  }

  async init() {
    console.log("🎓 Initializing Lesson Manager...");

    // Load lessons data
    await this.loadLessons();

    // Setup event listeners
    this.setupEventListeners();

    // Render lessons
    this.renderLessons();
  }

  async loadLessons() {
    try {
      console.log("📚 Loading lessons...");

      const response = await fetch("/api/lessons");

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Failed to load lessons");
      }

      // Convert grouped lessons to flat array
      this.lessons = [];
      const groupedLessons = result.lessons || {};

      Object.values(groupedLessons).forEach((moduleData) => {
        if (moduleData.lessons) {
          moduleData.lessons.forEach((lesson) => {
            // Add module info to each lesson
            lesson.module_title = moduleData.module_info.title;
            lesson.module_category = moduleData.module_info.category;
            lesson.module_color = moduleData.module_info.color;
            lesson.module_icon = moduleData.module_info.icon;
            lesson.module_slug = moduleData.module_info.slug;

            // Map status from is_completed
            lesson.status = lesson.is_completed ? "completed" : "not-started";

            this.lessons.push(lesson);
          });
        }
      });

      console.log(`✅ Loaded ${this.lessons.length} lessons`);
    } catch (error) {
      console.error("❌ Error loading lessons:", error);
      this.showError("Failed to load lessons. Please try again.");
    }
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
      searchInput.addEventListener("input", (e) => {
        this.searchLessons(e.target.value);
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

  renderLessons() {
    const container = document.getElementById("lessonsGrid");
    if (!container) return;

    if (this.lessons.length === 0) {
      container.innerHTML = `
                <div class="lessons-empty">
                    <div class="empty-icon">📚</div>
                    <h3>No Lessons Available</h3>
                    <p>Check back later for new learning content!</p>
                </div>
            `;
      return;
    }

    // Group lessons by module
    const groupedLessons = this.groupLessonsByModule();

    container.innerHTML = Object.entries(groupedLessons)
      .map(([moduleId, moduleData]) => {
        return this.renderModuleSection(moduleData);
      })
      .join("");

    // Add click handlers to lesson cards
    this.attachLessonHandlers();
  }

  groupLessonsByModule() {
    const grouped = {};

    this.lessons.forEach((lesson) => {
      const moduleId = lesson.module_id;

      if (!grouped[moduleId]) {
        grouped[moduleId] = {
          module: {
            id: moduleId,
            title: lesson.module_title,
            category: lesson.module_category,
            color: lesson.module_color,
            icon: lesson.module_icon,
          },
          lessons: [],
        };
      }

      grouped[moduleId].lessons.push(lesson);
    });

    return grouped;
  }

  renderModuleSection(moduleData) {
    const { module, lessons } = moduleData;

    return `
            <div class="module-section" data-module-id="${module.id}">
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
    }</p>
                    </div>
                    <div class="module-progress">
                        ${this.renderModuleProgress(lessons)}
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

  renderModuleProgress(lessons) {
    const completed = lessons.filter((l) => l.status === "completed").length;
    const total = lessons.length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

    return `
            <div class="module-progress-info">
                <span class="progress-text">${completed}/${total} completed</span>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${percentage}%"></div>
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
    }">
                <div class="lesson-header">
                    <div class="lesson-icon" style="background: ${
                      lesson.module_color
                    }">
                        ${this.getLessonIcon(lesson)}
                    </div>
                    <div class="lesson-status ${statusClass}">
                        ${this.getStatusText(lesson.status)}
                    </div>
                </div>
                
                <div class="lesson-info">
                    <h3>${lesson.title}</h3>
                    <p class="lesson-description">${
                      lesson.description ||
                      "Learn essential concepts and practice coding skills."
                    }</p>
                </div>
                
                <div class="lesson-meta">
                    <span><i class="fas fa-clock"></i> ${
                      lesson.duration_minutes
                    } min</span>
                    <span><i class="fas fa-chart-line"></i> ${
                      lesson.difficulty
                    }</span>
                    <span><i class="fas fa-star"></i> ${
                      lesson.xp_reward
                    } XP</span>
                </div>
                
                ${
                  progressPercentage > 0 && progressPercentage < 100
                    ? `
                    <div class="lesson-progress">
                        <div class="lesson-progress-bar">
                            <div class="lesson-progress-fill" style="width: ${progressPercentage}%"></div>
                        </div>
                        <div class="lesson-progress-text">${progressPercentage}% complete</div>
                    </div>
                `
                    : ""
                }
                
                <div class="lesson-actions">
                    <button class="lesson-btn lesson-btn-primary" onclick="lessonManager.openLesson('${
                      lesson.id
                    }')">
                        ${this.getActionButtonText(lesson.status)}
                    </button>
                    ${
                      lesson.status === "completed"
                        ? `
                        <button class="lesson-btn lesson-btn-secondary" onclick="lessonManager.reviewLesson('${lesson.id}')">
                            <i class="fas fa-eye"></i> Review
                        </button>
                    `
                        : ""
                    }
                </div>
            </div>
        `;
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

  getStatusText(status) {
    const statusMap = {
      "not-started": "Not Started",
      "in-progress": "In Progress",
      completed: "Completed",
    };
    return statusMap[status] || "Not Started";
  }

  getActionButtonText(status) {
    const buttonMap = {
      "not-started": '<i class="fas fa-play"></i> Start Lesson',
      "in-progress": '<i class="fas fa-arrow-right"></i> Continue',
      completed: '<i class="fas fa-redo"></i> Retake',
    };
    return buttonMap[status] || '<i class="fas fa-play"></i> Start Lesson';
  }

  attachLessonHandlers() {
    document.querySelectorAll(".lesson-card").forEach((card) => {
      card.addEventListener("click", (e) => {
        // Don't trigger if clicking on buttons
        if (e.target.closest(".lesson-btn")) return;

        const lessonId = card.dataset.lessonId;
        this.openLesson(lessonId);
      });
    });
  }

  async openLesson(lessonId) {
    try {
      console.log(`📖 Opening lesson: ${lessonId}`);

      // Find lesson data
      const lesson = this.lessons.find((l) => l.id === lessonId);
      if (!lesson) {
        throw new Error("Lesson not found");
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
      this.showError("Failed to open lesson. Please try again.");
    }
  }

  async loadLessonDetails(lessonId) {
    try {
      const response = await fetch(`/api/lessons/${lessonId}`);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Failed to load lesson details");
      }

      // Merge detailed data with current lesson
      Object.assign(this.currentLesson, result.lesson);
    } catch (error) {
      console.error("❌ Error loading lesson details:", error);
      // Continue with basic lesson data
    }
  }

  showLessonModal() {
    const modal = document.getElementById("lessonModal");
    const content = document.getElementById("lessonContent");

    if (!modal || !content || !this.currentLesson) return;

    content.innerHTML = this.renderLessonContent();
    modal.style.display = "flex";
    document.body.style.overflow = "hidden";

    // Initialize code editor if needed
    this.initializeLessonEditor();

    // Setup lesson navigation
    this.setupLessonNavigation();
  }

  renderLessonContent() {
    const lesson = this.currentLesson;

    return `
            <div class="lesson-modal-header">
                <button class="lesson-modal-close" onclick="lessonManager.closeLessonModal()">
                    <i class="fas fa-times"></i>
                </button>
                <h2 class="lesson-modal-title">${lesson.title}</h2>
                <div class="lesson-modal-meta">
                    <span><i class="fas fa-clock"></i> ${
                      lesson.duration_minutes
                    } minutes</span>
                    <span><i class="fas fa-chart-line"></i> ${
                      lesson.difficulty
                    }</span>
                    <span><i class="fas fa-star"></i> ${
                      lesson.xp_reward
                    } XP</span>
                    <span><i class="fas fa-tag"></i> ${
                      lesson.module_title
                    }</span>
                </div>
            </div>
            
            <div class="lesson-modal-body">
                ${this.renderLessonObjectives()}
                ${this.renderLessonDescription()}
                ${this.renderLessonContent()}
                ${this.renderLessonEditor()}
                ${this.renderLessonTests()}
            </div>
            
            <div class="lesson-navigation">
                <button class="lesson-nav-btn lesson-nav-prev" onclick="lessonManager.previousLesson()">
                    <i class="fas fa-arrow-left"></i> Previous
                </button>
                <div class="lesson-nav-center">
                    <button class="lesson-btn lesson-btn-primary" onclick="lessonManager.runTests()">
                        <i class="fas fa-play"></i> Run Tests
                    </button>
                    <button class="lesson-btn lesson-btn-secondary" onclick="lessonManager.resetCode()">
                        <i class="fas fa-undo"></i> Reset
                    </button>
                </div>
                <button class="lesson-nav-btn lesson-nav-next" onclick="lessonManager.nextLesson()">
                    Next <i class="fas fa-arrow-right"></i>
                </button>
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
                    <ul>
                        ${objectives.map((obj) => `<li>${obj}</li>`).join("")}
                    </ul>
                </div>
            </div>
        `;
  }

  renderLessonDescription() {
    const content =
      this.currentLesson.content_md || this.currentLesson.description || "";

    return `
            <div class="lesson-section">
                <div class="lesson-content">
                    ${this.parseMarkdown(content)}
                </div>
            </div>
        `;
  }

  renderLessonContent() {
    // This would render the main lesson content
    return `
            <div class="lesson-section">
                <h3><i class="fas fa-book"></i> Lesson Content</h3>
                <div class="lesson-text">
                    <p>This lesson will teach you the fundamentals and provide hands-on practice.</p>
                    <p>Follow along with the examples and complete the coding exercises to master the concepts.</p>
                </div>
            </div>
        `;
  }

  renderLessonEditor() {
    const starterCode = this.currentLesson.starter_code || {};

    return `
            <div class="lesson-section">
                <div class="lesson-code-section">
                    <div class="lesson-code-header">
                        <div class="lesson-code-tabs">
                            <button class="lesson-code-tab active" data-tab="html">HTML</button>
                            <button class="lesson-code-tab" data-tab="css">CSS</button>
                            <button class="lesson-code-tab" data-tab="js">JavaScript</button>
                        </div>
                        <div class="lesson-code-actions">
                            <button class="lesson-btn lesson-btn-secondary" onclick="lessonManager.runCode()">
                                <i class="fas fa-play"></i> Run Code
                            </button>
                        </div>
                    </div>
                    <div class="lesson-code-content">
                        <div class="lesson-code-editor" id="lessonCodeEditor">
                            <textarea id="codeInput" placeholder="Write your code here...">${
                              starterCode.html || ""
                            }</textarea>
                        </div>
                        <div class="lesson-code-preview" id="lessonCodePreview">
                            <iframe id="previewFrame" sandbox="allow-scripts"></iframe>
                        </div>
                    </div>
                </div>
            </div>
        `;
  }

  renderLessonTests() {
    return `
            <div class="lesson-section">
                <div class="lesson-test-results" id="lessonTestResults">
                    <h4><i class="fas fa-flask"></i> Test Results</h4>
                    <p class="text-muted">Run your code to see test results here.</p>
                </div>
            </div>
        `;
  }

  closeLessonModal() {
    const modal = document.getElementById("lessonModal");
    if (modal) {
      modal.style.display = "none";
      document.body.style.overflow = "auto";
    }
    this.currentLesson = null;
  }

  async trackLessonStart(lessonId) {
    try {
      await fetch("/api/lessons/progress", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          lesson_id: lessonId,
          action: "start",
        }),
      });
    } catch (error) {
      console.error("Error tracking lesson start:", error);
    }
  }

  async completeLesson(lessonId) {
    try {
      const response = await fetch("/api/lessons/complete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          lesson_id: lessonId,
        }),
      });

      const result = await response.json();

      if (result.success) {
        this.showLessonCompletion(result);
        await this.loadLessons(); // Refresh lesson data
        this.renderLessons(); // Re-render with updated progress
      }
    } catch (error) {
      console.error("Error completing lesson:", error);
    }
  }

  showLessonCompletion(result) {
    const celebration = `
            <div class="lesson-completion-celebration">
                <h3>🎉 Lesson Completed!</h3>
                <p>Great job! You've successfully completed this lesson.</p>
                <div class="xp-earned">+${result.xp_earned || 0} XP</div>
            </div>
        `;

    // Insert celebration into modal
    const modalBody = document.querySelector(".lesson-modal-body");
    if (modalBody) {
      modalBody.insertAdjacentHTML("afterbegin", celebration);
    }
  }

  filterLessons(filter) {
    // Update active filter button
    document.querySelectorAll(".lesson-filter-btn").forEach((btn) => {
      btn.classList.remove("active");
    });
    document.querySelector(`[data-filter="${filter}"]`).classList.add("active");

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
      const title = card.querySelector("h3").textContent.toLowerCase();
      const description = card
        .querySelector(".lesson-description")
        .textContent.toLowerCase();
      const matches =
        title.includes(searchTerm) || description.includes(searchTerm);

      card.style.display = matches ? "block" : "none";
    });
  }

  parseMarkdown(text) {
    // Simple markdown parser for basic formatting
    return text
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.*?)\*/g, "<em>$1</em>")
      .replace(/`(.*?)`/g, "<code>$1</code>")
      .replace(/\n/g, "<br>");
  }

  showError(message) {
    // Show error notification
    console.error(message);

    // You could implement a toast notification system here
    alert(message);
  }

  // Additional methods for lesson navigation, code execution, etc.
  previousLesson() {
    console.log("Navigate to previous lesson");
  }

  nextLesson() {
    console.log("Navigate to next lesson");
  }

  runTests() {
    console.log("Running lesson tests...");
  }

  resetCode() {
    console.log("Resetting code to starter template");
  }

  runCode() {
    console.log("Running user code...");
  }
}

// Initialize lesson manager when DOM is loaded
let lessonManager;

document.addEventListener("DOMContentLoaded", function () {
  lessonManager = new LessonManager();
});

// Export for global access
window.lessonManager = lessonManager;
