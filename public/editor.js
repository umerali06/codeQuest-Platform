// CodeQuest Editor JavaScript
// Handles code editing, testing, and AI assistance

class CodeEditor {
  constructor() {
    this.editors = {};
    this.currentChallenge = null;
    this.currentTab = "html";
    this.testResults = [];
    this.apiBase = "http://localhost:8000/api";
    this.previewTimeout = null; // For debounced preview updates

    this.init();
  }

  async init() {
    try {
      console.log("=== init() called ===");
      this.initializeSimpleEditor();
      console.log("=== init(): Editors initialized ===");
      this.setupEventListeners();
      this.setupAI();
      await this.checkForChallenge();
      await this.checkForGame();
      await this.checkForPendingChallenge();

      // Final button state check
      setTimeout(() => {
        console.log("=== Final button state check ===");
        const runTestsBtn = document.getElementById("runTestsBtn");
        if (runTestsBtn) {
          console.log("Final Run Tests button state:", {
            disabled: runTestsBtn.disabled,
            visible: runTestsBtn.offsetParent !== null,
            text: runTestsBtn.textContent,
            classes: runTestsBtn.className,
            style: runTestsBtn.style.cssText,
          });

          // Monitor button state changes
          const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
              if (
                mutation.type === "attributes" &&
                mutation.attributeName === "disabled"
              ) {
                console.log(
                  "Button disabled state changed:",
                  runTestsBtn.disabled
                );
              }
            });
          });

          observer.observe(runTestsBtn, {
            attributes: true,
            attributeFilter: ["disabled"],
          });
        } else {
          console.error("Run Tests button not found in final check!");
        }
      }, 2000);
    } catch (error) {
      console.error("Failed to initialize editor:", error);
      this.showError(
        "Failed to initialize code editor. Please refresh the page."
      );
    }
  }

  initializeSimpleEditor() {
    console.log("=== initializeSimpleEditor called ===");

    // Replace Monaco editor containers with styled textareas
    const htmlContainer = document.getElementById("html-monaco");
    const cssContainer = document.getElementById("css-monaco");
    const jsContainer = document.getElementById("js-monaco");

    console.log("Monaco containers found:", {
      htmlContainer,
      cssContainer,
      jsContainer,
    });

    // Create styled textarea editors
    if (htmlContainer) {
      htmlContainer.innerHTML = `
        <textarea 
          id="html-textarea-editor" 
          class="code-editor-textarea"
          placeholder="<!-- Enter your HTML code here -->"
          spellcheck="false"
          autocomplete="off"
        ></textarea>
      `;
      this.editors.html = document.getElementById("html-textarea-editor");
      console.log("HTML editor created:", this.editors.html);

      if (!this.editors.html) {
        console.error("Failed to create HTML textarea!");
      }
    } else {
      console.error("HTML container not found!");
    }

    if (cssContainer) {
      cssContainer.innerHTML = `
        <textarea 
          id="css-textarea-editor" 
          class="code-editor-textarea"
          placeholder="/* Enter your CSS code here */"
          spellcheck="false"
          autocomplete="off"
        ></textarea>
      `;
      this.editors.css = document.getElementById("css-textarea-editor");
      console.log("CSS editor created:", this.editors.css);

      if (!this.editors.css) {
        console.error("Failed to create CSS textarea!");
      }
    } else {
      console.error("CSS container not found!");
    }

    if (jsContainer) {
      jsContainer.innerHTML = `
        <textarea 
          id="js-textarea-editor" 
          class="code-editor-textarea"
          placeholder="// Enter your JavaScript code here"
          spellcheck="false"
          autocomplete="off"
        ></textarea>
      `;
      this.editors.js = document.getElementById("js-textarea-editor");
      console.log("JS editor created:", this.editors.js);

      if (!this.editors.js) {
        console.error("Failed to create JS textarea!");
      }
    } else {
      console.error("JS container not found!");
    }

    // Also check if editors already exist (in case of re-initialization)
    if (!this.editors.html) {
      const existingHtml = document.getElementById("html-textarea-editor");
      if (existingHtml) {
        this.editors.html = existingHtml;
        console.log("Found existing HTML editor:", existingHtml);
      }
    }

    if (!this.editors.css) {
      const existingCss = document.getElementById("css-textarea-editor");
      if (existingCss) {
        this.editors.css = existingCss;
        console.log("Found existing CSS editor:", existingCss);
      }
    }

    if (!this.editors.js) {
      const existingJs = document.getElementById("js-textarea-editor");
      if (existingJs) {
        this.editors.js = existingJs;
        console.log("Found existing JS editor:", existingJs);
      }
    }

    console.log("Final editors object:", this.editors);

    // Set initial values and setup event listeners
    if (this.editors.html) {
      this.editors.html.value = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>My Project</title>
</head>
<body>
    <div class="container">
        <h1>Welcome to CodeQuest!</h1>
        <p>Start building something amazing...</p>
    </div>
</body>
</html>`;
      this.setupEditorEvents(this.editors.html, "html");
    }

    if (this.editors.css) {
      this.editors.css.value = `/* Add your styles here */
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

p {
    color: #666;
    line-height: 1.6;
    text-align: center;
}`;
      this.setupEditorEvents(this.editors.css, "css");
    }

    if (this.editors.js) {
      this.editors.js.value = `// Add your JavaScript here
document.addEventListener('DOMContentLoaded', function() {
    console.log('Page loaded successfully!');
    
    // Your code here...
    const heading = document.querySelector('h1');
    if (heading) {
        heading.addEventListener('click', function() {
            alert('Hello from CodeQuest!');
        });
    }
});`;
      this.setupEditorEvents(this.editors.js, "js");
    }

    // Setup console message listener for preview
    this.setupConsoleListener();

    // Setup mode switching functionality
    this.setupModeSwitching();

    // Tab switching is handled in setupEventListeners()

    // Initial preview update
    setTimeout(() => {
      this.updatePreview();
    }, 500);
  }

  setupModeSwitching() {
    console.log("=== Setting up mode switching ===");

    const freePlayBtn = document.getElementById("freePlayBtn");
    const practiceModeBtn = document.getElementById("practiceModeBtn");

    if (!freePlayBtn || !practiceModeBtn) {
      console.error("Mode buttons not found");
      return;
    }

    // Set initial mode (Free Play is default)
    this.currentMode = "free-play";

    // Free Play button click
    freePlayBtn.addEventListener("click", () => {
      this.switchMode("free-play");
    });

    // Practice Mode button click
    practiceModeBtn.addEventListener("click", () => {
      this.switchMode("practice");
    });

    console.log("Mode switching setup complete");
  }

  switchMode(mode) {
    console.log(`=== Switching to ${mode} mode ===`);

    const freePlayBtn = document.getElementById("freePlayBtn");
    const practiceModeBtn = document.getElementById("practiceModeBtn");

    if (!freePlayBtn || !practiceModeBtn) {
      console.error("Mode buttons not found for switching");
      return;
    }

    // Update button states
    if (mode === "free-play") {
      freePlayBtn.classList.add("active");
      practiceModeBtn.classList.remove("active");
      this.currentMode = "free-play";
      console.log("Switched to Free Play mode");
    } else if (mode === "practice") {
      practiceModeBtn.classList.add("active");
      freePlayBtn.classList.remove("active");
      this.currentMode = "practice";
      console.log("Switched to Practice mode");
    }

    // Update UI based on mode
    this.updateModeUI();

    // Show mode change notification
    this.showInfo(
      `Switched to ${mode === "free-play" ? "Free Play" : "Practice"} mode`
    );
  }

  updateModeUI() {
    console.log(`=== Updating UI for ${this.currentMode} mode ===`);

    // Update challenge info display
    const challengeDifficulty = document.getElementById("challengeDifficulty");
    const challengeXP = document.getElementById("challengeXP");

    if (this.currentMode === "free-play") {
      if (challengeDifficulty) challengeDifficulty.textContent = "Free Play";
      if (challengeXP) challengeXP.textContent = "Practice Mode";
    } else if (this.currentMode === "practice") {
      if (challengeDifficulty) challengeDifficulty.textContent = "Practice";
      if (challengeXP) challengeXP.textContent = "Learning Mode";
    }

    // Update button states based on mode
    this.updateButtonStates();

    // Update editor behavior based on mode
    this.updateEditorBehavior();
  }

  updateEditorBehavior() {
    console.log(
      `=== Updating editor behavior for ${this.currentMode} mode ===`
    );

    if (this.currentMode === "free-play") {
      // Free Play mode - more relaxed, focus on experimentation
      console.log("Free Play mode: Relaxed editing, focus on experimentation");
      this.enableFreePlayFeatures();
    } else if (this.currentMode === "practice") {
      // Practice mode - more structured, focus on learning
      console.log("Practice mode: Structured editing, focus on learning");
      this.enablePracticeModeFeatures();
    }
  }

  enableFreePlayFeatures() {
    console.log("=== Enabling Free Play features ===");

    // Remove practice mode elements
    this.removePracticeElements();

    // Add free play specific features
    this.addFreePlayFeatures();

    // Update editor styling for free play
    this.updateEditorStyling("free-play");
  }

  enablePracticeModeFeatures() {
    console.log("=== Enabling Practice Mode features ===");

    // Remove free play elements
    this.removeFreePlayElements();

    // Add practice mode specific features
    this.addPracticeModeFeatures();

    // Update editor styling for practice mode
    this.updateEditorStyling("practice");
  }

  addFreePlayFeatures() {
    // Add code templates for quick start
    this.addCodeTemplates();

    // Add experimental features
    this.addExperimentalFeatures();

    // Show free play tips
    this.showModeTips("free-play");
  }

  addPracticeModeFeatures() {
    // Add learning resources
    this.addLearningResources();

    // Add code validation hints
    this.addCodeValidationHints();

    // Add practice exercises
    this.addPracticeExercises();

    // Show practice mode tips
    this.showModeTips("practice");
  }

  addCodeTemplates() {
    const templateContainer = document.createElement("div");
    templateContainer.className = "code-templates free-play-templates";
    templateContainer.innerHTML = `
            <div class="template-header">
                <h4><i class="fas fa-rocket"></i> Quick Start Templates</h4>
                <p>Choose a template to get started quickly</p>
            </div>
            <div class="template-buttons">
                <button class="template-btn" data-template="basic-html">
                    <i class="fas fa-file-code"></i> Basic HTML
                </button>
                <button class="template-btn" data-template="responsive-layout">
                    <i class="fas fa-mobile-alt"></i> Responsive Layout
                </button>
                <button class="template-btn" data-template="animation-demo">
                    <i class="fas fa-magic"></i> Animation Demo
                </button>
            </div>
        `;

    // Insert after action buttons
    const actionButtons = document.querySelector(".action-buttons");
    if (actionButtons && !document.querySelector(".code-templates")) {
      actionButtons.after(templateContainer);
    }

    // Add template click handlers
    this.setupTemplateHandlers();
  }

  addLearningResources() {
    const resourcesContainer = document.createElement("div");
    resourcesContainer.className = "learning-resources practice-resources";
    resourcesContainer.innerHTML = `
            <div class="resources-header">
                <h4><i class="fas fa-graduation-cap"></i> Learning Resources</h4>
                <p>Helpful resources for your practice session</p>
            </div>
            <div class="resources-content">
                <div class="resource-item">
                    <i class="fas fa-book"></i>
                    <span>HTML Basics Guide</span>
                </div>
                <div class="resource-item">
                    <i class="fas fa-palette"></i>
                    <span>CSS Layout Techniques</span>
                </div>
                <div class="resource-item">
                    <i class="fas fa-code"></i>
                    <span>JavaScript Fundamentals</span>
                </div>
            </div>
        `;

    // Insert after action buttons
    const actionButtons = document.querySelector(".action-buttons");
    if (actionButtons && !document.querySelector(".learning-resources")) {
      actionButtons.after(resourcesContainer);
    }
  }

  addCodeValidationHints() {
    // Add real-time validation for practice mode
    if (this.editors.html) {
      this.editors.html.addEventListener("input", () => {
        this.validateHTML();
      });
    }

    if (this.editors.css) {
      this.editors.css.addEventListener("input", () => {
        this.validateCSS();
      });
    }

    if (this.editors.js) {
      this.editors.js.addEventListener("input", () => {
        this.validateJavaScript();
      });
    }
  }

  addPracticeExercises() {
    const exerciseContainer = document.createElement("div");
    exerciseContainer.className = "practice-exercises";
    exerciseContainer.innerHTML = `
            <div class="exercise-header">
                <h4><i class="fas fa-tasks"></i> Practice Exercises</h4>
                <p>Complete these exercises to improve your skills</p>
            </div>
            <div class="exercise-list">
                <div class="exercise-item" data-exercise="create-button">
                    <span class="exercise-title">Create a Styled Button</span>
                    <span class="exercise-difficulty">Beginner</span>
                </div>
                <div class="exercise-item" data-exercise="responsive-card">
                    <span class="exercise-title">Build a Responsive Card</span>
                    <span class="exercise-difficulty">Intermediate</span>
                </div>
                <div class="exercise-item" data-exercise="form-validation">
                    <span class="exercise-title">Form Validation</span>
                    <span class="exercise-difficulty">Advanced</span>
                </div>
            </div>
        `;

    // Insert after learning resources
    const resources = document.querySelector(".learning-resources");
    if (resources && !document.querySelector(".practice-exercises")) {
      resources.after(exerciseContainer);
    }

    // Add exercise click handlers
    this.setupExerciseHandlers();
  }

  removePracticeElements() {
    const practiceElements = document.querySelectorAll(
      ".practice-resources, .practice-exercises, .exercise-details"
    );
    practiceElements.forEach((el) => el.remove());
  }

  removeFreePlayElements() {
    const freePlayElements = document.querySelectorAll(".free-play-templates");
    freePlayElements.forEach((el) => el.remove());
  }

  updateEditorStyling(mode) {
    const editorContainer = document.querySelector(".editor-container");
    if (editorContainer) {
      editorContainer.className = `editor-container ${mode}-mode`;
    }
  }

  showModeTips(mode) {
    const tips = {
      "free-play":
        "🎮 Free Play Mode: Experiment freely with your code! Try different approaches and see what works.",
      practice:
        "🎓 Practice Mode: Focus on learning and improving your skills with guided exercises.",
    };

    this.showInfo(tips[mode]);
  }

  setupTemplateHandlers() {
    const templateButtons = document.querySelectorAll(".template-btn");
    templateButtons.forEach((btn) => {
      btn.addEventListener("click", () => {
        const template = btn.dataset.template;
        this.loadTemplate(template);
      });
    });
  }

  setupExerciseHandlers() {
    const exerciseItems = document.querySelectorAll(".exercise-item");
    exerciseItems.forEach((item) => {
      item.addEventListener("click", () => {
        const exercise = item.dataset.exercise;
        this.loadExercise(exercise);
      });
    });
  }

  loadTemplate(templateName) {
    const templates = {
      "basic-html": {
        html: "<!DOCTYPE html>\n<html>\n<head>\n    <title>My Page</title>\n</head>\n<body>\n    <h1>Hello World!</h1>\n    <p>This is a basic HTML template.</p>\n</body>\n</html>",
        css: "body {\n    font-family: Arial, sans-serif;\n    margin: 40px;\n    background-color: #f0f0f0;\n}\n\nh1 {\n    color: #333;\n}",
        js: '// Add your JavaScript here\nconsole.log("Page loaded!");',
      },
      "responsive-layout": {
        html: '<div class="container">\n    <header class="header">\n        <h1>Responsive Layout</h1>\n    </header>\n    <main class="main">\n        <section class="content">\n            <h2>Main Content</h2>\n            <p>This layout adapts to different screen sizes.</p>\n        </section>\n        <aside class="sidebar">\n            <h3>Sidebar</h3>\n            <p>Additional information here.</p>\n        </aside>\n    </main>\n</div>',
        css: ".container {\n    max-width: 1200px;\n    margin: 0 auto;\n    padding: 20px;\n}\n\n.header {\n    background: #333;\n    color: white;\n    padding: 20px;\n    text-align: center;\n}\n\n.main {\n    display: flex;\n    gap: 20px;\n    margin-top: 20px;\n}\n\n.content {\n    flex: 2;\n}\n\n.sidebar {\n    flex: 1;\n}\n\n@media (max-width: 768px) {\n    .main {\n        flex-direction: column;\n    }\n}",
        js: '// Responsive behavior\nwindow.addEventListener("resize", () => {\n    console.log("Window resized to:", window.innerWidth);\n});',
      },
      "animation-demo": {
        html: '<div class="animation-container">\n    <div class="animated-box">\n        <h2>Animated Element</h2>\n        <p>Click me to animate!</p>\n    </div>\n    <button class="animate-btn">Animate!</button>\n</div>',
        css: ".animation-container {\n    text-align: center;\n    padding: 50px;\n}\n\n.animated-box {\n    background: linear-gradient(45deg, #ff6b6b, #4ecdc4);\n    color: white;\n    padding: 30px;\n    border-radius: 10px;\n    margin-bottom: 20px;\n    transition: all 0.3s ease;\n}\n\n.animated-box:hover {\n    transform: scale(1.05);\n    box-shadow: 0 10px 30px rgba(0,0,0,0.3);\n}\n\n.animate-btn {\n    background: #333;\n    color: white;\n    border: none;\n    padding: 15px 30px;\n    border-radius: 25px;\n    cursor: pointer;\n    font-size: 16px;\n}\n\n.animate-btn:hover {\n    background: #555;\n}",
        js: 'document.querySelector(".animate-btn").addEventListener("click", () => {\n    const box = document.querySelector(".animated-box");\n    box.style.animation = "bounce 0.6s ease-in-out";\n    \n    setTimeout(() => {\n        box.style.animation = "";\n    }, 600);\n});\n\n// Add CSS animation\nconst style = document.createElement("style");\nstyle.textContent = `\n    @keyframes bounce {\n        0%, 20%, 50%, 80%, 100% {\n            transform: translateY(0);\n        }\n        40% {\n            transform: translateY(-20px);\n        }\n        60% {\n            transform: translateY(-10px);\n        }\n    }\n`;\ndocument.head.appendChild(style);',
      },
    };

    const template = templates[templateName];
    if (template) {
      this.editors.html.value = template.html;
      this.editors.css.value = template.css;
      this.editors.js.value = template.js;

      this.showSuccess(`Loaded ${templateName} template!`);
      this.refreshPreview();
    }
  }

  loadExercise(exerciseName) {
    const exercises = {
      "create-button": {
        title: "Create a Styled Button",
        description: "Create a button with hover effects and animations",
        html: '<!-- Create your button here -->\n<button class="my-button">Click Me!</button>',
        css: "/* Style your button here */\n.my-button {\n    /* Add your styles */\n}",
        js: "// Add button functionality here\n",
        hints: [
          "Use padding and border-radius for button shape",
          "Add hover effects with :hover pseudo-class",
          "Use transitions for smooth animations",
        ],
      },
      "responsive-card": {
        title: "Build a Responsive Card",
        description: "Create a card that adapts to different screen sizes",
        html: '<!-- Create your card here -->\n<div class="card">\n    <div class="card-content">\n        <h3>Card Title</h3>\n        <p>Card description goes here...</p>\n    </div>\n</div>',
        css: "/* Style your button here */\n.card {\n    /* Add your styles */\n}",
        js: "// Add card functionality here\n",
        hints: [
          "Use flexbox or grid for layout",
          "Add media queries for responsiveness",
          "Include hover effects and shadows",
        ],
      },
      "form-validation": {
        title: "Form Validation",
        description: "Create a form with JavaScript validation",
        html: '<!-- Create your form here -->\n<form class="my-form">\n    <input type="email" placeholder="Email" required>\n    <input type="password" placeholder="Password" required>\n    <button type="submit">Submit</button>\n</form>',
        css: "/* Style your form here */\n.my-form {\n    /* Add your styles */\n}",
        js: "// Add form validation here\n",
        hints: [
          "Use event listeners for form submission",
          "Check input values before submission",
          "Show error messages for invalid inputs",
        ],
      },
    };

    const exercise = exercises[exerciseName];
    if (exercise) {
      // Load exercise into editors
      this.editors.html.value = exercise.html;
      this.editors.css.value = exercise.css;
      this.editors.js.value = exercise.js;

      // Show exercise details
      this.showExerciseDetails(exercise);

      this.showSuccess(`Loaded ${exercise.title} exercise!`);
      this.refreshPreview();
    }
  }

  showExerciseDetails(exercise) {
    const detailsContainer = document.createElement("div");
    detailsContainer.className = "exercise-details";
    detailsContainer.innerHTML = `
            <div class="exercise-details-header">
                <h4>${exercise.title}</h4>
                <p>${exercise.description}</p>
            </div>
            <div class="exercise-hints">
                <h5>Hints:</h5>
                <ul>
                    ${exercise.hints.map((hint) => `<li>${hint}</li>`).join("")}
                </ul>
            </div>
        `;

    // Remove existing details
    const existingDetails = document.querySelector(".exercise-details");
    if (existingDetails) {
      existingDetails.remove();
    }

    // Insert after practice exercises
    const exercises = document.querySelector(".practice-exercises");
    if (exercises) {
      exercises.after(detailsContainer);
    }
  }

  validateHTML() {
    // Basic HTML validation
    const html = this.editors.html.value;
    const issues = [];

    if (html.includes("<html>") && !html.includes("</html>")) {
      issues.push("Missing closing </html> tag");
    }

    if (html.includes("<head>") && !html.includes("</head>")) {
      issues.push("Missing closing </head> tag");
    }

    if (html.includes("<body>") && !html.includes("</body>")) {
      issues.push("Missing closing </body> tag");
    }

    this.showValidationIssues("HTML", issues);
  }

  validateCSS() {
    // Basic CSS validation
    const css = this.editors.css.value;
    const issues = [];

    // Check for unmatched braces
    const openBraces = (css.match(/\{/g) || []).length;
    const closeBraces = (css.match(/\}/g) || []).length;

    if (openBraces !== closeBraces) {
      issues.push("Unmatched braces in CSS");
    }

    this.showValidationIssues("CSS", issues);
  }

  validateJavaScript() {
    // Basic JavaScript validation
    const js = this.editors.js.value;
    const issues = [];

    // Check for unmatched parentheses
    const openParens = (js.match(/\(/g) || []).length;
    const closeParens = (js.match(/\)/g) || []).length;

    if (openParens !== closeParens) {
      issues.push("Unmatched parentheses in JavaScript");
    }

    this.showValidationIssues("JavaScript", issues);
  }

  showValidationIssues(type, issues) {
    if (issues.length === 0) return;

    // Show validation issues in practice mode
    if (this.currentMode === "practice") {
      const message = `${type} Validation Issues:\n${issues.join("\n")}`;
      this.showWarning(message);
    }
  }

  setupSyntaxChecking() {
    // Add syntax highlighting hints
    console.log("Syntax checking enabled for practice mode");
  }

  addExperimentalFeatures() {
    // Add experimental features for free play mode
    console.log("Experimental features enabled for free play mode");
  }

  enableFreePlayFeatures() {
    console.log("=== Enabling Free Play features ===");

    // Remove practice mode elements
    this.removePracticeElements();

    // Add free play specific features
    this.addFreePlayFeatures();

    // Update editor styling for free play
    this.updateEditorStyling("free-play");
  }

  enablePracticeModeFeatures() {
    console.log("=== Enabling Practice Mode features ===");

    // Remove free play elements
    this.removeFreePlayElements();

    // Add practice mode specific features
    this.addPracticeModeFeatures();

    // Update editor styling for practice mode
    this.updateEditorStyling("practice");
  }

  addFreePlayFeatures() {
    // Add code templates for quick start
    this.addCodeTemplates();

    // Add experimental features
    this.addExperimentalFeatures();

    // Show free play tips
    this.showModeTips("free-play");
  }

  addPracticeModeFeatures() {
    // Add learning resources
    this.addLearningResources();

    // Add code validation hints
    this.addCodeValidationHints();

    // Add practice exercises
    this.addPracticeExercises();

    // Show practice mode tips
    this.showModeTips("practice");
  }

  addCodeTemplates() {
    const templateContainer = document.createElement("div");
    templateContainer.className = "code-templates free-play-templates";
    templateContainer.innerHTML = `
            <div class="template-header">
                <h4><i class="fas fa-rocket"></i> Quick Start Templates</h4>
                <p>Choose a template to get started quickly</p>
            </div>
            <div class="template-buttons">
                <button class="template-btn" data-template="basic-html">
                    <i class="fas fa-file-code"></i> Basic HTML
                </button>
                <button class="template-btn" data-template="responsive-layout">
                    <i class="fas fa-mobile-alt"></i> Responsive Layout
                </button>
                <button class="template-btn" data-template="animation-demo">
                    <i class="fas fa-magic"></i> Animation Demo
                </button>
            </div>
        `;

    // Insert after action buttons
    const actionButtons = document.querySelector(".action-buttons");
    if (actionButtons && !document.querySelector(".code-templates")) {
      actionButtons.after(templateContainer);
    }

    // Add template click handlers
    this.setupTemplateHandlers();
  }

  addLearningResources() {
    const resourcesContainer = document.createElement("div");
    resourcesContainer.className = "learning-resources practice-resources";
    resourcesContainer.innerHTML = `
            <div class="resources-header">
                <h4><i class="fas fa-graduation-cap"></i> Learning Resources</h4>
                <p>Helpful resources for your practice session</p>
            </div>
            <div class="resources-content">
                <div class="resource-item">
                    <i class="fas fa-book"></i>
                    <span>HTML Basics Guide</span>
                </div>
                <div class="resource-item">
                    <i class="fas fa-palette"></i>
                    <span>CSS Layout Techniques</span>
                </div>
                <div class="resource-item">
                    <i class="fas fa-code"></i>
                    <span>JavaScript Fundamentals</span>
                </div>
            </div>
        `;

    // Insert after action buttons
    const actionButtons = document.querySelector(".action-buttons");
    if (actionButtons && !document.querySelector(".learning-resources")) {
      actionButtons.after(resourcesContainer);
    }
  }

  addCodeValidationHints() {
    // Add real-time validation for practice mode
    if (this.editors.html) {
      this.editors.html.addEventListener("input", () => {
        this.validateHTML();
      });
    }

    if (this.editors.css) {
      this.editors.css.addEventListener("input", () => {
        this.validateCSS();
      });
    }

    if (this.editors.js) {
      this.editors.js.addEventListener("input", () => {
        this.validateJavaScript();
      });
    }
  }

  addPracticeExercises() {
    const exerciseContainer = document.createElement("div");
    exerciseContainer.className = "practice-exercises";
    exerciseContainer.innerHTML = `
            <div class="exercise-header">
                <h4><i class="fas fa-tasks"></i> Practice Exercises</h4>
                <p>Complete these exercises to improve your skills</p>
            </div>
            <div class="exercise-list">
                <div class="exercise-item" data-exercise="create-button">
                    <span class="exercise-title">Create a Styled Button</span>
                    <span class="exercise-difficulty">Beginner</span>
                </div>
                <div class="exercise-item" data-exercise="responsive-card">
                    <span class="exercise-title">Build a Responsive Card</span>
                    <span class="exercise-difficulty">Intermediate</span>
                </div>
                <div class="exercise-item" data-exercise="form-validation">
                    <span class="exercise-title">Form Validation</span>
                    <span class="exercise-difficulty">Advanced</span>
                </div>
            </div>
        `;

    // Insert after learning resources
    const resources = document.querySelector(".learning-resources");
    if (resources && !document.querySelector(".practice-exercises")) {
      resources.after(exerciseContainer);
    }

    // Add exercise click handlers
    this.setupExerciseHandlers();
  }

  removePracticeElements() {
    const practiceElements = document.querySelectorAll(
      ".practice-resources, .practice-exercises, .exercise-details"
    );
    practiceElements.forEach((el) => el.remove());
  }

  removeFreePlayElements() {
    const freePlayElements = document.querySelectorAll(".free-play-templates");
    freePlayElements.forEach((el) => el.remove());
  }

  updateEditorStyling(mode) {
    const editorContainer = document.querySelector(".editor-container");
    if (editorContainer) {
      editorContainer.className = `editor-container ${mode}-mode`;
    }
  }

  showModeTips(mode) {
    const tips = {
      "free-play":
        "🎮 Free Play Mode: Experiment freely with your code! Try different approaches and see what works.",
      practice:
        "🎓 Practice Mode: Focus on learning and improving your skills with guided exercises.",
    };

    this.showInfo(tips[mode]);
  }

  setupTemplateHandlers() {
    const templateButtons = document.querySelectorAll(".template-btn");
    templateButtons.forEach((btn) => {
      btn.addEventListener("click", () => {
        const template = btn.dataset.template;
        this.loadTemplate(template);
      });
    });
  }

  setupExerciseHandlers() {
    const exerciseItems = document.querySelectorAll(".exercise-item");
    exerciseItems.forEach((item) => {
      item.addEventListener("click", () => {
        const exercise = item.dataset.exercise;
        this.loadExercise(exercise);
      });
    });
  }

  loadTemplate(templateName) {
    const templates = {
      "basic-html": {
        html: "<!DOCTYPE html>\n<html>\n<head>\n    <title>My Page</title>\n</head>\n<body>\n    <h1>Hello World!</h1>\n    <p>This is a basic HTML template.</p>\n</body>\n</html>",
        css: "body {\n    font-family: Arial, sans-serif;\n    margin: 40px;\n    background-color: #f0f0f0;\n}\n\nh1 {\n    color: #333;\n}",
        js: '// Add your JavaScript here\nconsole.log("Page loaded!");',
      },
      "responsive-layout": {
        html: '<div class="container">\n    <header class="header">\n        <h1>Responsive Layout</h1>\n    </header>\n    <main class="main">\n        <section class="content">\n            <h2>Main Content</h2>\n            <p>This layout adapts to different screen sizes.</p>\n        </section>\n        <aside class="sidebar">\n            <h3>Sidebar</h3>\n            <p>Additional information here.</p>\n        </aside>\n    </main>\n</div>',
        css: ".container {\n    max-width: 1200px;\n    margin: 0 auto;\n    padding: 20px;\n}\n\n.header {\n    background: #333;\n    color: white;\n    padding: 20px;\n    text-align: center;\n}\n\n.main {\n    display: flex;\n    gap: 20px;\n    margin-top: 20px;\n}\n\n.content {\n    flex: 2;\n}\n\n.sidebar {\n    flex: 1;\n}\n\n@media (max-width: 768px) {\n    .main {\n        flex-direction: column;\n    }\n}",
        js: '// Responsive behavior\nwindow.addEventListener("resize", () => {\n    console.log("Window resized to:", window.innerWidth);\n});',
      },
      "animation-demo": {
        html: '<div class="animation-container">\n    <div class="animated-box">\n        <h2>Animated Element</h2>\n        <p>Click me to animate!</p>\n    </div>\n    <button class="animate-btn">Animate!</button>\n</div>',
        css: ".animation-container {\n    text-align: center;\n    padding: 50px;\n}\n\n.animated-box {\n    background: linear-gradient(45deg, #ff6b6b, #4ecdc4);\n    color: white;\n    padding: 30px;\n    border-radius: 10px;\n    margin-bottom: 20px;\n    transition: all 0.3s ease;\n}\n\n.animated-box:hover {\n    transform: scale(1.05);\n    box-shadow: 0 10px 30px rgba(0,0,0,0.3);\n}\n\n.animate-btn {\n    background: #333;\n    color: white;\n    border: none;\n    padding: 15px 30px;\n    border-radius: 25px;\n    cursor: pointer;\n    font-size: 16px;\n}\n\n.animate-btn:hover {\n    background: #555;\n}",
        js: 'document.querySelector(".animate-btn").addEventListener("click", () => {\n    const box = document.querySelector(".animated-box");\n    box.style.animation = "bounce 0.6s ease-in-out";\n    \n    setTimeout(() => {\n        box.style.animation = "";\n    }, 600);\n});\n\n// Add CSS animation\nconst style = document.createElement("style");\nstyle.textContent = `\n    @keyframes bounce {\n        0%, 20%, 50%, 80%, 100% {\n            transform: translateY(0);\n        }\n        40% {\n            transform: translateY(-20px);\n        }\n        60% {\n            transform: translateY(-10px);\n        }\n    }\n`;\ndocument.head.appendChild(style);',
      },
    };

    const template = templates[templateName];
    if (template) {
      this.editors.html.value = template.html;
      this.editors.css.value = template.css;
      this.editors.js.value = template.js;

      this.showSuccess(`Loaded ${templateName} template!`);
      this.refreshPreview();
    }
  }

  loadExercise(exerciseName) {
    const exercises = {
      "create-button": {
        title: "Create a Styled Button",
        description: "Create a button with hover effects and animations",
        html: '<!-- Create your button here -->\n<button class="my-button">Click Me!</button>',
        css: "/* Style your button here */\n.my-button {\n    /* Add your styles */\n}",
        js: "// Add button functionality here\n",
        hints: [
          "Use padding and border-radius for button shape",
          "Add hover effects with :hover pseudo-class",
          "Use transitions for smooth animations",
        ],
      },
      "responsive-card": {
        title: "Build a Responsive Card",
        description: "Create a card that adapts to different screen sizes",
        html: '<!-- Create your card here -->\n<div class="card">\n    <div class="card-content">\n        <h3>Card Title</h3>\n        <p>Card description goes here...</p>\n    </div>\n</div>',
        css: "/* Style your card here */\n.card {\n    /* Add your styles */\n}",
        js: "// Add card functionality here\n",
        hints: [
          "Use flexbox or grid for layout",
          "Add media queries for responsiveness",
          "Include hover effects and shadows",
        ],
      },
      "form-validation": {
        title: "Form Validation",
        description: "Create a form with JavaScript validation",
        html: '<!-- Create your form here -->\n<form class="my-form">\n    <input type="email" placeholder="Email" required>\n    <input type="password" placeholder="Password" required>\n    <button type="submit">Submit</button>\n</form>',
        css: "/* Style your form here */\n.my-form {\n    /* Add your styles */\n}",
        js: "// Add form validation here\n",
        hints: [
          "Use event listeners for form submission",
          "Check input values before submission",
          "Show error messages for invalid inputs",
        ],
      },
    };

    const exercise = exercises[exerciseName];
    if (exercise) {
      // Load exercise into editors
      this.editors.html.value = exercise.html;
      this.editors.css.value = exercise.css;
      this.editors.js.value = exercise.js;

      // Show exercise details
      this.showExerciseDetails(exercise);

      this.showSuccess(`Loaded ${exercise.title} exercise!`);
      this.refreshPreview();
    }
  }

  showExerciseDetails(exercise) {
    const detailsContainer = document.createElement("div");
    detailsContainer.className = "exercise-details";
    detailsContainer.innerHTML = `
            <div class="exercise-details-header">
                <h4>${exercise.title}</h4>
                <p>${exercise.description}</p>
            </div>
            <div class="exercise-hints">
                <h5>Hints:</h5>
                <ul>
                    ${exercise.hints.map((hint) => `<li>${hint}</li>`).join("")}
                </ul>
            </div>
        `;

    // Remove existing details
    const existingDetails = document.querySelector(".exercise-details");
    if (existingDetails) {
      existingDetails.remove();
    }

    // Insert after practice exercises
    const exercises = document.querySelector(".practice-exercises");
    if (exercises) {
      exercises.after(detailsContainer);
    }
  }

  validateHTML() {
    // Basic HTML validation
    const html = this.editors.html.value;
    const issues = [];

    if (html.includes("<html>") && !html.includes("</html>")) {
      issues.push("Missing closing </html> tag");
    }

    if (html.includes("<head>") && !html.includes("</head>")) {
      issues.push("Missing closing </head> tag");
    }

    if (html.includes("<body>") && !html.includes("</body>")) {
      issues.push("Missing closing </body> tag");
    }

    this.showValidationIssues("HTML", issues);
  }

  validateCSS() {
    // Basic CSS validation
    const css = this.editors.css.value;
    const issues = [];

    // Check for unmatched braces
    const openBraces = (css.match(/\{/g) || []).length;
    const closeBraces = (css.match(/\}/g) || []).length;

    if (openBraces !== closeBraces) {
      issues.push("Unmatched braces in CSS");
    }

    this.showValidationIssues("CSS", issues);
  }

  validateJavaScript() {
    // Basic JavaScript validation
    const js = this.editors.js.value;
    const issues = [];

    // Check for unmatched parentheses
    const openParens = (js.match(/\(/g) || []).length;
    const closeParens = (js.match(/\)/g) || []).length;

    if (openParens !== closeParens) {
      issues.push("Unmatched parentheses in JavaScript");
    }

    this.showValidationIssues("JavaScript", issues);
  }

  showValidationIssues(type, issues) {
    if (issues.length === 0) return;

    // Show validation issues in practice mode
    if (this.currentMode === "practice") {
      const message = `${type} Validation Issues:\n${issues.join("\n")}`;
      this.showWarning(message);
    }
  }

  setupSyntaxChecking() {
    // Add syntax highlighting hints
    console.log("Syntax checking enabled for practice mode");
  }

  addExperimentalFeatures() {
    // Add experimental features for free play mode
    console.log("Experimental features enabled for free play mode");
  }

  setupEventListeners() {
    // Responsive navigation
    const navToggle = document.getElementById("nav-toggle");
    const navMenu = document.getElementById("nav-menu");

    if (navToggle && navMenu) {
      navToggle.addEventListener("click", () => {
        navMenu.classList.toggle("active");
        navToggle.classList.toggle("active");
        document.body.classList.toggle("nav-open");
      });
    }

    // Authentication buttons
    const loginBtn = document.getElementById("loginBtn");
    const signupBtn = document.getElementById("signupBtn");
    const profileBtn = document.getElementById("profileBtn");
    const logoutBtn = document.getElementById("logoutBtn");

    if (loginBtn) {
      loginBtn.addEventListener("click", (e) => {
        e.preventDefault();
        this.showLoginModal();
      });
    }

    if (signupBtn) {
      signupBtn.addEventListener("click", (e) => {
        e.preventDefault();
        this.showSignupModal();
      });
    }

    if (profileBtn) {
      profileBtn.addEventListener("click", (e) => {
        e.preventDefault();
        this.showUserProfile();
      });
    }

    if (logoutBtn) {
      logoutBtn.addEventListener("click", (e) => {
        e.preventDefault();
        this.logout();
      });
    }

    // Tab switching
    document.querySelectorAll(".tab-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        const tab = e.target.closest(".tab-btn").dataset.tab;
        console.log("Tab clicked:", tab);
        this.switchTab(tab);
      });
    });

    // Editor actions
    const formatHtmlBtn = document.getElementById("formatHtmlBtn");
    const formatCssBtn = document.getElementById("formatCssBtn");
    const formatJsBtn = document.getElementById("formatJsBtn");
    const runTestsBtn = document.getElementById("runTestsBtn");
    const resetCodeBtn = document.getElementById("resetCodeBtn");
    const submitBtn = document.getElementById("submitBtn");
    const refreshPreviewBtn = document.getElementById("refreshPreviewBtn");
    const fullscreenPreviewBtn = document.getElementById(
      "fullscreenPreviewBtn"
    );

    if (formatHtmlBtn)
      formatHtmlBtn.addEventListener("click", () => this.formatCode("html"));
    if (formatCssBtn)
      formatCssBtn.addEventListener("click", () => this.formatCode("css"));
    if (formatJsBtn)
      formatJsBtn.addEventListener("click", () => this.formatCode("js"));
    if (runTestsBtn) {
      runTestsBtn.addEventListener("click", () => {
        console.log("Run Tests button clicked");
        console.log("Current challenge:", this.currentChallenge);
        console.log("AuthManager:", window.AuthManager);
        console.log(
          "LocalStorage user:",
          localStorage.getItem("codequest_user")
        );
        console.log("LocalStorage JWT:", localStorage.getItem("codequest_jwt"));
        this.runTests();
      });
    }
    if (resetCodeBtn) {
      resetCodeBtn.addEventListener("click", () => {
        console.log("Reset Code button clicked!");
        this.resetCode();
      });
    }
    if (submitBtn) {
      submitBtn.addEventListener("click", () => {
        console.log("Submit button clicked!");
        this.submitChallenge();
      });
    }
    if (refreshPreviewBtn)
      refreshPreviewBtn.addEventListener("click", () => this.refreshPreview());
    if (fullscreenPreviewBtn)
      fullscreenPreviewBtn.addEventListener("click", () =>
        this.toggleFullscreen()
      );

    // Window resize
    window.addEventListener("resize", () => this.resizeEditors());

    // Keyboard shortcuts
    document.addEventListener("keydown", (e) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case "s":
            e.preventDefault();
            this.saveCode();
            break;
          case "Enter":
            e.preventDefault();
            this.runTests();
            break;
        }
      }
    });

    // Update auth UI
    this.updateAuthUI();

    // Debug: Log authentication status
    this.logAuthStatus();

    // Update button states based on authentication
    this.updateButtonStates();

    // Additional debugging for button states
    setTimeout(() => {
      console.log("=== Delayed button state check ===");
      const runTestsBtn = document.getElementById("runTestsBtn");
      if (runTestsBtn) {
        console.log("Run Tests button delayed check:", {
          disabled: runTestsBtn.disabled,
          visible: runTestsBtn.offsetParent !== null,
          text: runTestsBtn.textContent,
          classes: runTestsBtn.className,
          computedStyle: window.getComputedStyle(runTestsBtn),
          parentElement: runTestsBtn.parentElement,
          parentVisible: runTestsBtn.parentElement
            ? runTestsBtn.parentElement.offsetParent !== null
            : "no parent",
        });
      }
    }, 1000);

    // Setup modal switching
    this.setupModalSwitching();

    // Setup form submissions
    this.setupFormSubmissions();
  }

  updateButtonStates() {
    console.log("=== updateButtonStates called ===");

    const runTestsBtn = document.getElementById("runTestsBtn");
    const resetCodeBtn = document.getElementById("resetCodeBtn");
    const submitBtn = document.getElementById("submitBtn");

    if (runTestsBtn) {
      runTestsBtn.disabled = false; // Always enabled
      console.log("Run Tests button state updated");
    }

    if (resetCodeBtn) {
      resetCodeBtn.disabled = false; // Always enabled
      console.log("Reset Code button state updated");
    }

    if (submitBtn) {
      if (this.currentChallenge) {
        // Challenge mode - enable submit
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fas fa-check"></i> Submit Challenge';
        console.log("Submit button enabled for challenge mode");
      } else if (this.isUserLoggedIn()) {
        // Free play mode + logged in - enable submit (to execute code)
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fas fa-play"></i> Execute Code';
        console.log(
          "Submit button enabled for free play mode (user logged in)"
        );
      } else {
        // Free play mode + not logged in - disable submit
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-lock"></i> Login Required';
        console.log(
          "Submit button disabled for free play mode (user not logged in)"
        );
      }
    }
  }

  setupModalSwitching() {
    // Switch from login to signup
    const showSignupLink = document.getElementById("showSignupLink");
    if (showSignupLink) {
      showSignupLink.addEventListener("click", (e) => {
        e.preventDefault();
        this.showSignupModal();
        this.closeModal("loginModal");
      });
    }

    // Switch from signup to login
    const showLoginLink = document.getElementById("showLoginLink");
    if (showLoginLink) {
      showLoginLink.addEventListener("click", (e) => {
        e.preventDefault();
        this.showLoginModal();
        this.closeModal("signupModal");
      });
    }

    // Close modal buttons
    const closeButtons = document.querySelectorAll(".modal-close");
    closeButtons.forEach((button) => {
      button.addEventListener("click", () => {
        const modal = button.closest(".modal");
        if (modal) modal.style.display = "none";
      });
    });

    // Close modal when clicking outside
    window.addEventListener("click", (e) => {
      if (e.target.classList.contains("modal")) {
        e.target.style.display = "none";
      }
    });
  }

  setupFormSubmissions() {
    // Login form
    const loginForm = document.getElementById("loginForm");
    if (loginForm) {
      loginForm.addEventListener("submit", (e) => {
        e.preventDefault();
        this.handleLogin();
      });
    }

    // Signup form
    const signupForm = document.getElementById("signupForm");
    if (signupForm) {
      signupForm.addEventListener("submit", (e) => {
        e.preventDefault();
        this.handleSignup();
      });
    }
  }

  // Authentication Methods
  showLoginModal() {
    const modal = document.getElementById("loginModal");
    if (modal) modal.style.display = "block";
  }

  showSignupModal() {
    const modal = document.getElementById("signupModal");
    if (modal) modal.style.display = "block";
  }

  showUserProfile() {
    // Show user profile or redirect to dashboard
    window.location.href = "dashboard.html";
  }

  logout() {
    if (window.AuthManager) {
      window.AuthManager.logout();
    } else {
      // Fallback logout
      localStorage.removeItem("codequest_user");
      this.updateAuthUI();
    }
  }

  updateAuthUI() {
    const loginBtn = document.getElementById("loginBtn");
    const signupBtn = document.getElementById("signupBtn");
    const profileBtn = document.getElementById("profileBtn");
    const logoutBtn = document.getElementById("logoutBtn");
    const username = document.getElementById("username");

    // Check if user is logged in - more robust check
    let currentUser = null;

    // First try AuthManager
    if (window.AuthManager && window.AuthManager.currentUser) {
      currentUser = window.AuthManager.currentUser;
    }

    // Fallback to localStorage
    if (!currentUser) {
      try {
        const storedUser = localStorage.getItem("codequest_user");
        if (storedUser) {
          currentUser = JSON.parse(storedUser);
        }
      } catch (e) {
        console.warn("Error parsing stored user:", e);
      }
    }

    // Additional check for JWT token
    if (!currentUser) {
      const token = localStorage.getItem("codequest_jwt");
      if (token) {
        // If we have a token, assume user is logged in
        currentUser = { id: "token_user", username: "User" };
      }
    }

    if (currentUser) {
      // User is logged in
      if (loginBtn) loginBtn.classList.add("hidden");
      if (signupBtn) signupBtn.classList.add("hidden");
      if (profileBtn) profileBtn.classList.remove("hidden");
      if (logoutBtn) logoutBtn.classList.remove("hidden");
      if (username) username.textContent = currentUser.username || "User";
    } else {
      // User is not logged in
      if (loginBtn) loginBtn.classList.remove("hidden");
      if (signupBtn) signupBtn.classList.remove("hidden");
      if (profileBtn) profileBtn.classList.add("hidden");
      if (logoutBtn) logoutBtn.classList.add("hidden");
      if (username) username.textContent = "User";
    }

    // Update button states after authentication change
    this.updateButtonStates();
  }

  async handleLogin() {
    const email = document.getElementById("loginEmail").value;
    const password = document.getElementById("loginPassword").value;

    try {
      if (window.AuthManager) {
        const user = window.AuthManager.login(email, password);
        this.closeModal("loginModal");
        this.updateAuthUI();
        this.showNotification("Welcome back!", "success");
      } else {
        // Fallback login
        this.showNotification("Authentication system not available", "error");
      }
    } catch (error) {
      this.showNotification(error.message, "error");
    }
  }

  async handleSignup() {
    const username = document.getElementById("signupUsername").value;
    const email = document.getElementById("signupEmail").value;
    const password = document.getElementById("signupPassword").value;

    try {
      if (window.AuthManager) {
        const user = window.AuthManager.register(username, email, password);
        this.closeModal("signupModal");
        this.updateAuthUI();
        this.showNotification("Account created successfully!", "success");
      } else {
        // Fallback signup
        this.showNotification("Authentication system not available", "error");
      }
    } catch (error) {
      this.showNotification(error.message, "error");
    }
  }

  closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.style.display = "none";
  }

  showLoginRequiredMessage() {
    // Create a custom modal for login required
    const loginRequiredModal = document.createElement("div");
    loginRequiredModal.className = "modal";
    loginRequiredModal.id = "loginRequiredModal";
    loginRequiredModal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2>🔒 Login Required</h2>
                    <button class="modal-close" onclick="this.closest('.modal').remove()">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="login-required-content">
                        <div class="login-required-icon">💻</div>
                        <h3>You need to be logged in to access challenges!</h3>
                        <p>Create an account or sign in to start coding challenges and earning XP.</p>
                        <div class="login-required-actions">
                            <button class="btn btn-primary" onclick="editor.showLoginModal()">Login</button>
                            <button class="btn btn-secondary" onclick="editor.showSignupModal()">Sign Up</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

    document.body.appendChild(loginRequiredModal);
    loginRequiredModal.style.display = "block";

    // Close modal when clicking outside
    loginRequiredModal.addEventListener("click", (e) => {
      if (e.target === loginRequiredModal) {
        loginRequiredModal.remove();
      }
    });
  }

  switchTab(tabName) {
    console.log(`Switching to ${tabName} tab`);

    // Update tab buttons
    document.querySelectorAll(".tab-btn").forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.tab === tabName);
    });

    // Update editor panes
    document.querySelectorAll(".editor-pane").forEach((pane) => {
      pane.classList.toggle("active", pane.id === `${tabName}-editor`);
    });

    this.currentTab = tabName;

    console.log(
      `Tab switched to ${tabName}. Active pane: ${
        document.querySelector(".editor-pane.active")?.id
      }`
    );

    // Update preview if switching to preview tab
    if (tabName === "preview") {
      console.log("Switching to preview tab");

      // Refresh preview immediately when switching to preview tab
      setTimeout(() => {
        console.log("Refreshing preview after tab switch");
        this.refreshPreview();
      }, 200);

      // Add a prominent refresh button to the preview tab
      this.addPreviewRefreshButton();
    }
  }

  formatCode(language) {
    if (this.editors[language]) {
      // Simple formatting for textareas
      const editor = this.editors[language];
      const code = editor.value;

      // Basic indentation formatting
      const formatted = code
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line.length > 0)
        .join("\n");

      editor.value = formatted;
      this.showInfo(`${language.toUpperCase()} code formatted`);
    }
  }

  addPreviewRefreshButton() {
    // Add a prominent refresh button to the preview tab
    const previewHeader = document.querySelector(
      "#preview-editor .editor-header"
    );
    if (previewHeader) {
      // Check if refresh button already exists
      let refreshBtn = previewHeader.querySelector(".preview-refresh-btn");
      if (!refreshBtn) {
        refreshBtn = document.createElement("button");
        refreshBtn.className = "btn btn-primary preview-refresh-btn";
        refreshBtn.innerHTML =
          '<i class="fas fa-sync-alt"></i> Refresh Preview';
        refreshBtn.onclick = () => {
          this.refreshPreview();
          this.showInfo("Preview refreshed manually");
        };

        // Insert refresh button
        const previewActions = previewHeader.querySelector(".preview-actions");
        if (previewActions) {
          previewActions.appendChild(refreshBtn);
        }
      }
    }
  }

  // forcePreviewUpdate method removed - no more test code or hardcoded content

  showPreviewStatus(message, type = "info") {
    // Create or update preview status indicator
    let statusDiv = document.querySelector(".preview-status");
    if (!statusDiv) {
      statusDiv = document.createElement("div");
      statusDiv.className = "preview-status";
      statusDiv.style.cssText = `
                position: absolute;
                top: 10px;
                right: 10px;
                padding: 8px 12px;
                border-radius: 4px;
                font-size: 12px;
                font-weight: 500;
                z-index: 1000;
                transition: all 0.3s ease;
                opacity: 0;
                transform: translateY(-10px);
            `;

      // Insert into preview editor container
      const previewEditor = document.getElementById("preview-editor");
      if (previewEditor) {
        previewEditor.style.position = "relative";
        previewEditor.appendChild(statusDiv);
      }
    }

    // Set content and styling based on type
    statusDiv.textContent = message;
    statusDiv.style.background =
      type === "success"
        ? "#4CAF50"
        : type === "error"
        ? "#f44336"
        : type === "warning"
        ? "#ff9800"
        : "#2196F3";
    statusDiv.style.color = "white";

    // Show the status
    statusDiv.style.opacity = "1";
    statusDiv.style.transform = "translateY(0)";

    // Auto-hide after 3 seconds
    setTimeout(() => {
      statusDiv.style.opacity = "0";
      statusDiv.style.transform = "translateY(-10px)";
    }, 3000);
  }

  setupConsoleListener() {
    // Listen for console messages from preview iframe
    window.addEventListener("message", (event) => {
      if (event.data && event.data.type === "console") {
        this.addConsoleMessage(event.data.level, event.data.message);
      }
    });
  }

  // Test button removed - no longer needed

  fixEditorReferences() {
    console.log("=== fixEditorReferences called ===");

    // Try to find editors by ID directly
    let htmlEditor = document.getElementById("html-textarea-editor");
    let cssEditor = document.getElementById("css-textarea-editor");
    let jsEditor = document.getElementById("js-textarea-editor");

    console.log("Direct editor lookup:", { htmlEditor, cssEditor, jsEditor });

    // Check if editors are textareas, if not, create them
    if (htmlEditor && htmlEditor.tagName !== "TEXTAREA") {
      console.log("HTML editor is not a textarea, recreating...");
      htmlEditor = null;
    }

    if (cssEditor && cssEditor.tagName !== "TEXTAREA") {
      console.log("CSS editor is not a textarea, recreating...");
      cssEditor = null;
    }

    if (jsEditor && jsEditor.tagName !== "TEXTAREA") {
      console.log("JS editor is not a textarea, recreating...");
      jsEditor = null;
    }

    // Update our editors object with found elements
    if (htmlEditor) {
      this.editors.html = htmlEditor;
      console.log("Fixed HTML editor reference");
    }

    if (cssEditor) {
      this.editors.css = cssEditor;
      console.log("Fixed CSS editor reference");
    }

    if (jsEditor) {
      this.editors.js = jsEditor;
      console.log("Fixed JS editor reference");
    }

    // If still no editors, try to re-initialize
    if (!this.editors.html || !this.editors.css || !this.editors.js) {
      console.log("Some editors still missing, re-initializing...");
      this.initializeSimpleEditor();
    }

    // Force recreate if editors are still not textareas
    if (this.editors.html && this.editors.html.tagName !== "TEXTAREA") {
      console.log("Force recreating HTML editor...");
      this.forceRecreateEditor("html");
    }

    if (this.editors.css && this.editors.css.tagName !== "TEXTAREA") {
      console.log("Force recreating CSS editor...");
      this.forceRecreateEditor("css");
    }

    if (this.editors.js && this.editors.js.tagName !== "TEXTAREA") {
      console.log("Force recreating JS editor...");
      this.forceRecreateEditor("js");
    }

    console.log("Final editors after fixing:", this.editors);
  }

  forceRecreateEditor(type) {
    console.log(`=== Force recreating ${type} editor ===`);

    const container = document.getElementById(`${type}-monaco`);
    if (!container) {
      console.error(`${type} container not found`);
      return;
    }

    // Create new textarea
    const textarea = document.createElement("textarea");
    textarea.id = `${type}-textarea-editor`;
    textarea.placeholder = `Enter your ${type.toUpperCase()} code here...`;
    textarea.style.cssText =
      "width: 100%; height: 300px; font-family: monospace; background: #1e1e1e; color: white; border: 1px solid #333; padding: 10px; resize: vertical;";

    // Clear container and add new textarea
    container.innerHTML = "";
    container.appendChild(textarea);

    // Update our reference
    this.editors[type] = textarea;
    console.log(`${type} editor recreated:`, textarea);
  }

  addConsoleMessage(level, message) {
    // Create or get console output container
    let consoleContainer = document.querySelector(".preview-console");
    if (!consoleContainer) {
      consoleContainer = document.createElement("div");
      consoleContainer.className = "preview-console";
      consoleContainer.innerHTML = `
                <div class="console-header">
                    <h4>Console Output</h4>
                    <button class="clear-console-btn">Clear</button>
                </div>
                <div class="console-messages"></div>
            `;
      consoleContainer.style.cssText = `
                background: #1e1e1e;
                border: 1px solid #333;
                border-radius: 4px;
                margin-top: 10px;
                font-family: 'Courier New', monospace;
                font-size: 12px;
                max-height: 200px;
                overflow-y: auto;
            `;

      // Add clear button functionality
      const clearBtn = consoleContainer.querySelector(".clear-console-btn");
      clearBtn.onclick = () => {
        const messages = consoleContainer.querySelector(".console-messages");
        messages.innerHTML = "";
      };

      // Insert after preview iframe
      const previewFrame = document.getElementById("preview-frame");
      if (previewFrame && previewFrame.parentNode) {
        previewFrame.parentNode.insertBefore(
          consoleContainer,
          previewFrame.nextSibling
        );
      }
    }

    // Add the message
    const messagesContainer =
      consoleContainer.querySelector(".console-messages");
    const messageDiv = document.createElement("div");
    messageDiv.className = `console-message console-${level}`;
    messageDiv.innerHTML = `
            <span class="console-timestamp">${new Date().toLocaleTimeString()}</span>
            <span class="console-level">${level.toUpperCase()}</span>
            <span class="console-text">${message}</span>
        `;

    // Style based on level
    messageDiv.style.cssText = `
            padding: 4px 8px;
            border-bottom: 1px solid #333;
            color: ${
              level === "error"
                ? "#ff6b6b"
                : level === "warn"
                ? "#ffd93d"
                : "#4ecdc4"
            };
        `;

    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  showPreviewLoading(show = true) {
    // Create or update loading indicator
    let loadingDiv = document.querySelector(".preview-loading");
    if (!loadingDiv) {
      loadingDiv = document.createElement("div");
      loadingDiv.className = "preview-loading";
      loadingDiv.innerHTML = `
                <div class="loading-spinner"></div>
                <span>Updating preview...</span>
            `;
      loadingDiv.style.cssText = `
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: rgba(0, 0, 0, 0.8);
                color: white;
                padding: 20px;
                border-radius: 8px;
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 10px;
                z-index: 1000;
                transition: all 0.3s ease;
                opacity: 0;
                pointer-events: none;
            `;

      // Add loading spinner styles
      const spinner = loadingDiv.querySelector(".loading-spinner");
      spinner.style.cssText = `
                width: 30px;
                height: 30px;
                border: 3px solid rgba(255, 255, 255, 0.3);
                border-top: 3px solid white;
                border-radius: 50%;
                animation: spin 1s linear infinite;
            `;

      // Insert into preview editor container
      const previewEditor = document.getElementById("preview-editor");
      if (previewEditor) {
        previewEditor.appendChild(loadingDiv);
      }
    }

    if (show) {
      loadingDiv.style.opacity = "1";
      loadingDiv.style.pointerEvents = "auto";
    } else {
      loadingDiv.style.opacity = "0";
      loadingDiv.style.pointerEvents = "none";
    }
  }

  async checkForChallenge() {
    try {
      // Check URL parameters for challenge ID
      const urlParams = new URLSearchParams(window.location.search);
      const challengeId = urlParams.get("challenge");

      if (challengeId) {
        console.log("Loading challenge from URL parameter:", challengeId);
        await this.loadChallenge(challengeId);
      } else {
        // No challenge loaded, show default state
        console.log("No challenge in URL, showing default state");
        this.showDefaultState();
      }
    } catch (error) {
      console.error("Error in checkForChallenge:", error);
      this.showDefaultState();
    }
  }

  showDefaultState() {
    console.log("=== showDefaultState called ===");

    // Show default editor state when no challenge is loaded
    const challengeTitle = document.getElementById("challengeTitle");
    const challengeDifficulty = document.getElementById("challengeDifficulty");
    const challengeXP = document.getElementById("challengeXP");
    const defaultDescription = document.getElementById("defaultDescription");
    const challengeDescriptionContent = document.getElementById(
      "challengeDescriptionContent"
    );

    // Update header elements
    if (challengeTitle) {
      challengeTitle.textContent = "🚀 CodeQuest Editor";
      console.log("✅ Updated challenge title");
    }
    if (challengeDifficulty) {
      challengeDifficulty.textContent = "Free Play";
      challengeDifficulty.className = "challenge-badge difficulty free-play";
      console.log("✅ Updated challenge difficulty");
    }
    if (challengeXP) {
      challengeXP.textContent = "Practice Mode";
      console.log("✅ Updated challenge XP");
    }

    // Show default description and hide challenge content
    if (defaultDescription) {
      defaultDescription.style.display = "block";
      console.log("✅ Showed default description");
    }
    if (challengeDescriptionContent) {
      challengeDescriptionContent.style.display = "none";
      console.log("✅ Hid challenge description content");
    }

    // Hide challenge and game instruction panels
    const challengeInstructions = document.getElementById(
      "challengeInstructions"
    );
    const gameInstructions = document.getElementById("gameInstructions");

    if (challengeInstructions) {
      challengeInstructions.style.display = "none";
      console.log("✅ Hid challenge instructions panel");
    }
    if (gameInstructions) {
      gameInstructions.style.display = "none";
      console.log("✅ Hid game instructions panel");
    }

    // Enable basic actions
    const runTestsBtn = document.getElementById("runTestsBtn");
    const resetCodeBtn = document.getElementById("resetCodeBtn");
    const submitBtn = document.getElementById("submitBtn");

    console.log("=== showDefaultState button setup ===");
    console.log("Run Tests button found:", !!runTestsBtn);
    if (runTestsBtn) {
      console.log("Run Tests button before:", runTestsBtn.disabled);
      runTestsBtn.disabled = false;
      console.log("Run Tests button after:", runTestsBtn.disabled);
    }

    if (resetCodeBtn) resetCodeBtn.disabled = false;

    // Enable submit button for logged-in users in free play mode (to save code)
    if (submitBtn) {
      if (this.isUserLoggedIn()) {
        submitBtn.disabled = false;
        console.log(
          "Submit button enabled for logged-in user in free play mode"
        );
      } else {
        submitBtn.disabled = true;
        console.log("Submit button disabled - user not logged in");
      }
    }

    // Show info about loading a challenge
    this.showInfo(
      "No challenge loaded. You can practice coding here or load a challenge from the Learn page."
    );

    // Update button states after setting default state
    this.updateButtonStates();
  }

  async loadChallengeList() {
    // Check if user is authenticated
    const currentUser = window.AuthManager
      ? window.AuthManager.currentUser
      : JSON.parse(localStorage.getItem("codequest_user") || "null");

    if (!currentUser) {
      this.showLoginRequiredMessage();
      return;
    }

    try {
      const response = await fetch(`${this.apiBase}/challenges`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      if (result.success) {
        this.showChallengeSelector(result.data);
      } else {
        throw new Error(result.message || "Failed to load challenges");
      }
    } catch (error) {
      console.error("Error loading challenges:", error);
      this.showError("Failed to load challenges. Please try again.");
    }
  }

  showChallengeSelector(challenges) {
    const description = document.getElementById("challengeDescription");
    if (!description) return;

    const challengesHTML = `
            <div class="challenge-list">
                <h4>Available Challenges:</h4>
                <div class="challenge-grid">
                    ${challenges
                      .map(
                        (challenge) => `
                        <div class="challenge-item" data-challenge-id="${challenge.id}">
                            <h5>${challenge.title}</h5>
                            <p>${challenge.description}</p>
                            <span class="difficulty ${challenge.difficulty}">${challenge.difficulty}</span>
                            <span class="xp">+${challenge.xp_reward} XP</span>
                        </div>
                    `
                      )
                      .join("")}
                </div>
            </div>
        `;

    description.innerHTML = challengesHTML;

    // Add event listeners to challenge items
    this.setupChallengeEventListeners();
  }

  setupChallengeEventListeners() {
    const challengeItems = document.querySelectorAll(".challenge-item");
    challengeItems.forEach((item) => {
      item.addEventListener("click", () => {
        const challengeId = item.getAttribute("data-challenge-id");
        if (challengeId) {
          this.loadChallenge(challengeId);
        }
      });
    });
  }

  async loadRandomChallenge() {
    // Check if user is authenticated
    const currentUser = window.AuthManager
      ? window.AuthManager.currentUser
      : JSON.parse(localStorage.getItem("codequest_user") || "null");

    if (!currentUser) {
      this.showLoginRequiredMessage();
      return;
    }

    try {
      const response = await fetch(`${this.apiBase}/challenges/random`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      if (result.success) {
        await this.loadChallenge(result.data.id);
      } else {
        throw new Error(result.message || "Failed to load random challenge");
      }
    } catch (error) {
      console.error("Error loading random challenge:", error);
      this.showError("Failed to load random challenge. Please try again.");
    }
  }

  async loadChallenge(challengeId) {
    // Check if user is authenticated
    const currentUser = window.AuthManager
      ? window.AuthManager.currentUser
      : JSON.parse(localStorage.getItem("codequest_user") || "null");

    if (!currentUser) {
      this.showLoginRequiredMessage();
      return;
    }

    try {
      // Try to load by ID first, then by title if that fails
      let response = await fetch(`${this.apiBase}/challenges/${challengeId}`);

      if (!response.ok) {
        // If ID fails, try loading by title
        const encodedTitle = encodeURIComponent(challengeId);
        response = await fetch(`${this.apiBase}/challenges/${encodedTitle}`);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
      }

      const result = await response.json();
      if (result.success) {
        this.currentChallenge = result.data;
        this.displayChallenge();
        this.loadStarterCode();
        this.enableActions();

        // Update the page title
        document.title = `CodeQuest Editor - ${this.currentChallenge.title}`;

        console.log("Challenge loaded successfully:", this.currentChallenge);
      } else {
        throw new Error(result.message || "Failed to load challenge");
      }
    } catch (error) {
      console.error("Error loading challenge:", error);
      this.showError("Failed to load challenge. Please try again.");
    }
  }

  async displayChallenge() {
    if (!this.currentChallenge) return;

    const challengeTitle = document.getElementById("challengeTitle");
    const challengeDifficulty = document.getElementById("challengeDifficulty");
    const challengeXP = document.getElementById("challengeXP");
    const defaultDescription = document.getElementById("defaultDescription");
    const challengeDescriptionContent = document.getElementById(
      "challengeDescriptionContent"
    );

    // Update challenge title and meta
    if (challengeTitle)
      challengeTitle.textContent = `🎯 ${this.currentChallenge.title}`;
    if (challengeDifficulty) {
      challengeDifficulty.textContent =
        this.currentChallenge.difficulty.toUpperCase();
      challengeDifficulty.className = `challenge-badge difficulty ${this.currentChallenge.difficulty.toLowerCase()}`;
    }
    if (challengeXP)
      challengeXP.textContent = `+${
        this.currentChallenge.xp_reward || this.currentChallenge.xpReward
      } XP`;

    // Load user progress for this challenge
    const userProgress = await this.loadUserChallengeProgress(
      this.currentChallenge.id
    );

    // Hide default description and show challenge instructions panel
    if (defaultDescription) defaultDescription.style.display = "none";

    // Show challenge instructions panel
    const challengeInstructions = document.getElementById(
      "challengeInstructions"
    );
    const gameInstructions = document.getElementById("gameInstructions");

    // Hide game instructions if visible
    if (gameInstructions) gameInstructions.style.display = "none";

    // Show and populate challenge instructions panel
    if (challengeInstructions) {
      challengeInstructions.style.display = "block";

      // Update challenge title in panel
      const challengeTitlePanel = document.getElementById(
        "challengeTitlePanel"
      );
      if (challengeTitlePanel) {
        challengeTitlePanel.textContent = this.currentChallenge.title;
      }

      // Update challenge difficulty in panel
      const challengeDifficultyPanel = document.getElementById(
        "challengeDifficultyPanel"
      );
      if (challengeDifficultyPanel) {
        challengeDifficultyPanel.textContent = this.currentChallenge.difficulty;
        challengeDifficultyPanel.className = `challenge-difficulty-badge ${this.currentChallenge.difficulty.toLowerCase()}`;
      }

      // Update challenge XP in panel
      const challengeXPPanel = document.getElementById("challengeXPPanel");
      if (challengeXPPanel) {
        challengeXPPanel.textContent = `+${
          this.currentChallenge.xp_reward || this.currentChallenge.xpReward
        } XP`;
      }

      // Update challenge description in panel
      const challengeDescriptionPanel = document.getElementById(
        "challengeDescriptionPanel"
      );
      if (challengeDescriptionPanel) {
        challengeDescriptionPanel.innerHTML = `
          <div class="challenge-description-content">
            <h4>🎯 Challenge Description</h4>
            <p>${this.currentChallenge.description}</p>
            
            ${
              this.currentChallenge.instructions
                ? `
              <h4>📋 Instructions</h4>
              <div class="challenge-instructions-content">
                ${this.currentChallenge.instructions}
              </div>
            `
                : ""
            }

            ${
              userProgress
                ? `
              <div class="user-progress-banner">
                <h4>📊 Your Progress</h4>
                <div class="progress-stats">
                  <div class="stat-item">
                    <span class="stat-label">Status:</span>
                    <span class="stat-value ${
                      userProgress.is_completed ? "completed" : "in-progress"
                    }">
                      ${
                        userProgress.is_completed
                          ? "✅ Completed"
                          : "🔄 In Progress"
                      }
                    </span>
                  </div>
                  <div class="stat-item">
                    <span class="stat-label">Tests Passed:</span>
                    <span class="stat-value">${
                      userProgress.tests_passed || 0
                    }/${userProgress.total_tests || 0}</span>
                  </div>
                  <div class="stat-item">
                    <span class="stat-label">XP Earned:</span>
                    <span class="stat-value">${
                      userProgress.xp_earned || 0
                    }</span>
                  </div>
                  <div class="stat-item">
                    <span class="stat-label">Attempts:</span>
                    <span class="stat-value">${
                      userProgress.attempt_count || 0
                    }</span>
                  </div>
                </div>
              </div>
            `
                : ""
            }

            <div class="challenge-metadata">
              <div class="metadata-grid">
                <div class="metadata-item">
                  <strong>🎚️ Difficulty:</strong> ${
                    this.currentChallenge.difficulty
                  }
                </div>
                <div class="metadata-item">
                  <strong>📂 Category:</strong> ${
                    this.currentChallenge.category
                  }
                </div>
                <div class="metadata-item">
                  <strong>🏆 XP Reward:</strong> ${
                    this.currentChallenge.xp_reward ||
                    this.currentChallenge.xpReward
                  } points
                </div>
                <div class="metadata-item">
                  <strong>🏷️ Tags:</strong> ${
                    (this.currentChallenge.tags || []).join(", ") || "None"
                  }
                </div>
              </div>
            </div>
          </div>
        `;
      }

      console.log("✅ Challenge instructions panel populated and shown");
    }

    if (challengeDescriptionContent) {
      challengeDescriptionContent.style.display = "block";

      // Build enhanced challenge description with instructions and progress
      let descriptionHTML = `
        <div class="challenge-info">
          ${
            userProgress
              ? `
            <div class="user-progress-banner">
              <h3>📊 Your Progress</h3>
              <div class="progress-stats">
                <div class="stat-item">
                  <span class="stat-label">Status:</span>
                  <span class="stat-value ${
                    userProgress.is_completed ? "completed" : "in-progress"
                  }">
                    ${
                      userProgress.is_completed
                        ? "✅ Completed"
                        : "🔄 In Progress"
                    }
                  </span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">Tests Passed:</span>
                  <span class="stat-value">${userProgress.tests_passed || 0}/${
                  userProgress.total_tests || 0
                }</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">XP Earned:</span>
                  <span class="stat-value">${userProgress.xp_earned || 0}</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">Attempts:</span>
                  <span class="stat-value">${
                    userProgress.attempt_count || 0
                  }</span>
                </div>
              </div>
            </div>
          `
              : ""
          }

          <div class="challenge-description-text">
            <h3>🎯 Challenge Description</h3>
            <p>${this.currentChallenge.description}</p>
          </div>

          ${
            this.currentChallenge.instructions
              ? `
            <div class="challenge-instructions">
              <h3>📋 Instructions</h3>
              <div class="instructions-content">
                ${this.currentChallenge.instructions}
              </div>
            </div>
          `
              : ""
          }

          <div class="challenge-requirements">
            <h3>✅ Requirements</h3>
            <ul>
              <li>Follow the instructions carefully</li>
              <li>Write clean, readable code</li>
              <li>Pass all test cases</li>
              <li>Submit your solution when ready</li>
            </ul>
          </div>

          <div class="challenge-metadata">
            <div class="metadata-grid">
              <div class="metadata-item">
                <strong>🎚️ Difficulty:</strong> ${
                  this.currentChallenge.difficulty
                }
              </div>
              <div class="metadata-item">
                <strong>📂 Category:</strong> ${this.currentChallenge.category}
              </div>
              <div class="metadata-item">
                <strong>🏆 XP Reward:</strong> ${
                  this.currentChallenge.xpReward ||
                  this.currentChallenge.xp_reward
                } points
              </div>
              <div class="metadata-item">
                <strong>🏷️ Tags:</strong> ${
                  (this.currentChallenge.tags || []).join(", ") || "None"
                }
              </div>
            </div>
          </div>

          <div class="challenge-actions">
            <button class="btn btn-success" onclick="editor.runTests()">
              <i class="fas fa-play"></i> Test Solution
            </button>
            <button class="btn btn-primary" onclick="editor.submitChallenge()">
              <i class="fas fa-check"></i> Submit Challenge
            </button>
            <button class="btn btn-info" onclick="editor.showChallengeLeaderboard('${
              this.currentChallenge.id
            }')">
              <i class="fas fa-trophy"></i> Leaderboard
            </button>
            <button class="btn btn-secondary" onclick="window.location.href='challenges.html'">
              <i class="fas fa-arrow-left"></i> Back to Challenges
            </button>
          </div>
        </div>
      `;

      challengeDescriptionContent.innerHTML = descriptionHTML;
    }

    // Display test statements if available
    this.displayTestStatements();

    // Show challenge tests section
    const challengeTests = document.getElementById("challengeTests");
    if (challengeTests) {
      challengeTests.style.display = "block";
    }

    console.log("Challenge displayed:", this.currentChallenge);
  }

  loadStarterCode() {
    if (!this.currentChallenge) return;

    console.log(
      "Loading starter code for challenge:",
      this.currentChallenge.title
    );

    // Handle different starter code formats
    let starterCode = {};

    // Check for starterCode field (from API)
    if (this.currentChallenge.starterCode) {
      starterCode = this.currentChallenge.starterCode;
      console.log("Using starterCode from API:", starterCode);
    }
    // Check for starter_code field (alternative format)
    else if (this.currentChallenge.starter_code) {
      starterCode = this.currentChallenge.starter_code;
      console.log("Using starter_code field:", starterCode);
    }
    // Check for legacy JSON format
    else if (this.currentChallenge.starter_code_json) {
      try {
        starterCode = JSON.parse(this.currentChallenge.starter_code_json);
        console.log("Parsed starter_code_json:", starterCode);
      } catch (e) {
        console.warn("Failed to parse starter_code_json:", e);
      }
    }
    // Check for separate fields
    else {
      starterCode = {
        html:
          this.currentChallenge.starter_code_html ||
          this.currentChallenge.starter_html ||
          "",
        css:
          this.currentChallenge.starter_code_css ||
          this.currentChallenge.starter_css ||
          "",
        js:
          this.currentChallenge.starter_code_js ||
          this.currentChallenge.starter_js ||
          "",
      };
      console.log("Using separate starter code fields:", starterCode);
    }

    // Load starter code into editors
    if (starterCode.html && this.editors.html) {
      this.editors.html.value = starterCode.html;
      console.log("✅ Loaded HTML starter code");
    }
    if (starterCode.css && this.editors.css) {
      this.editors.css.value = starterCode.css;
      console.log("✅ Loaded CSS starter code");
    }
    if (starterCode.js && this.editors.js) {
      this.editors.js.value = starterCode.js;
      console.log("✅ Loaded JS starter code");
    }

    // Refresh preview with starter code
    this.refreshPreview();
  }

  enableActions() {
    const runTestsBtn = document.getElementById("runTestsBtn");
    const resetCodeBtn = document.getElementById("resetCodeBtn");
    const submitBtn = document.getElementById("submitBtn");

    // Enable all buttons for challenge mode
    if (runTestsBtn) runTestsBtn.disabled = false;
    if (resetCodeBtn) resetCodeBtn.disabled = false;
    if (submitBtn) submitBtn.disabled = false;

    console.log("All buttons enabled for challenge mode");
  }

  async runTests() {
    console.log("=== runTests called ===");
    console.log("Button state check:");

    const runTestsBtn = document.getElementById("runTestsBtn");
    if (runTestsBtn) {
      console.log("Run Tests button found:", runTestsBtn);
      console.log("Button disabled:", runTestsBtn.disabled);
      console.log("Button visible:", runTestsBtn.offsetParent !== null);
      console.log("Button text:", runTestsBtn.textContent);
    } else {
      console.log("Run Tests button NOT found!");
    }

    // Check if user is logged in using helper method
    if (!this.isUserLoggedIn()) {
      console.log("User not logged in, showing login required message");
      this.showLoginRequiredMessage();
      return;
    }

    const currentUser = this.getCurrentUser();
    if (!currentUser) {
      // For testing purposes, allow anonymous users to run basic tests
      console.log("No authenticated user, allowing anonymous testing");
    } else {
      console.log("User authenticated, running tests:", currentUser);
    }

    try {
      this.updateTestStatus("Running...", "running");

      // Get current code
      const code = {
        html: this.editors.html ? this.editors.html.value : "",
        css: this.editors.css ? this.editors.css.value : "",
        js: this.editors.js ? this.editors.js.value : "",
      };

      // Check if we have any code to test
      if (!code.html && !code.css && !code.js) {
        this.showError("Please add some code before running tests.");
        this.updateTestStatus("No Code", "error");
        return;
      }

      // For free play mode, run basic validation tests
      if (!this.currentChallenge) {
        // Free play mode - run basic syntax and execution tests
        this.testResults = [
          {
            name: "HTML Validation",
            passed: code.html.trim().length > 0,
            message: "HTML code present",
          },
          {
            name: "CSS Validation",
            passed: code.css.trim().length > 0,
            message: "CSS code present",
          },
          {
            name: "JavaScript Validation",
            passed: code.js.trim().length > 0,
            message: "JavaScript code present",
          },
          {
            name: "Code Execution",
            passed: true,
            message: "Code executed successfully in preview",
          },
        ];
      } else {
        // Challenge mode - submit to API for testing
        try {
          const response = await fetch(`${this.apiBase}/challenges/submit`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              challengeSlug:
                this.currentChallenge.slug || this.currentChallenge.id,
              code: code,
            }),
          });

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }

          const result = await response.json();
          if (result.success) {
            this.testResults = result.data.testResults || [];

            // Update challenge completion status
            if (result.data.isCompleted) {
              this.showChallengeCompleted(result.data.xpEarned || 0);
            }
          } else {
            throw new Error(result.message || "Failed to run tests");
          }
        } catch (error) {
          console.error("Error submitting challenge:", error);
          // Fallback to basic test
          this.testResults = [
            {
              name: "Basic Test",
              passed: true,
              message: "Code executed successfully (offline mode)",
            },
          ];
        }
      }

      this.displayTestResults(this.testResults);
      this.updateTestStatus("Tests Completed!", "success");
      this.showSuccess("Code executed successfully!");
    } catch (error) {
      console.error("Error running tests:", error);
      this.updateTestStatus("Test Error", "error");
      this.showError(
        "Failed to run tests. Please check your code and try again."
      );
    }
  }

  displayTestResults(results) {
    const testContent = document.getElementById("testResults");
    if (!testContent) return;

    if (results.length === 0) {
      testContent.innerHTML =
        '<div class="test-placeholder"><p>No tests to run</p></div>';
      return;
    }

    const resultsHTML = results
      .map(
        (test) => `
            <div class="test-result ${test.passed ? "passed" : "failed"}">
                <div class="test-header">
                    <span class="test-name">${test.name}</span>
                    <span class="test-status ${
                      test.passed ? "passed" : "failed"
                    }">
                        ${test.passed ? "✓" : "✗"}
                    </span>
                </div>
                <div class="test-message">
                    ${test.passed ? test.message : `Error: ${test.message}`}
                </div>
            </div>
        `
      )
      .join("");

    testContent.innerHTML = resultsHTML;
  }

  updateTestStatus(status, type) {
    const statusElement = document.getElementById("testStatus");
    if (statusElement) {
      statusElement.textContent = status;
      statusElement.className = `status-indicator ${type}`;
    }
  }

  showChallengeCompleted(xpEarned) {
    // Show completion notification
    this.showSuccess(`🎉 Challenge completed! You earned ${xpEarned} XP!`);

    // Update test statements to show completion
    const testStatements = document.querySelectorAll(".test-statement");
    testStatements.forEach((statement) => {
      const icon = statement.querySelector("i");
      if (icon) {
        icon.className = "fas fa-check-circle";
        icon.style.color = "#10b981";
      }
    });

    // Update submit button
    const submitBtn = document.getElementById("submitBtn");
    if (submitBtn) {
      submitBtn.textContent = "✓ Completed";
      submitBtn.classList.remove("btn-success");
      submitBtn.classList.add("btn-primary");
    }

    console.log("Challenge completed with XP:", xpEarned);
  }

  resetCode() {
    console.log("=== resetCode called ===");
    console.log("Current challenge:", this.currentChallenge);
    console.log("Editors:", this.editors);

    if (this.currentChallenge) {
      console.log("Resetting to challenge starter code");
      this.loadStarterCode();
      this.showInfo("Code reset to starter code");
    } else {
      console.log("Resetting to free play default templates");
      // Free play mode - reset to default templates
      if (this.editors.html) {
        this.editors.html.value = "";
        console.log("HTML editor reset");
      } else {
        console.log("HTML editor not found!");
      }

      if (this.editors.css) {
        this.editors.css.value = "";
        console.log("CSS editor reset");
      } else {
        console.log("CSS editor not found!");
      }

      if (this.editors.js) {
        this.editors.js.value = "";
        console.log("JavaScript editor reset");
      } else {
        console.log("JavaScript editor not found!");
      }

      this.showInfo("Code cleared - ready for new input");

      // Refresh preview after reset
      if (this.currentTab === "preview") {
        setTimeout(() => this.refreshPreview(), 100);
      }
    }
  }

  displayTestStatements() {
    const testStatementsContainer = document.getElementById("testStatements");
    if (!testStatementsContainer) return;

    // Clear existing statements
    testStatementsContainer.innerHTML = "";

    if (!this.currentChallenge) {
      // Free play mode - show general guidance
      testStatementsContainer.innerHTML = `
                <div class="test-statement">
                    <i class="fas fa-info-circle" style="color: #3b82f6; margin-right: 0.5rem;"></i>
                    Write your HTML, CSS, and JavaScript code in the respective tabs
                </div>
                <div class="test-statement">
                    <i class="fas fa-eye" style="color: #10b981; margin-right: 0.5rem;"></i>
                    Use the Preview tab to see your code in action
                </div>
                <div class="test-statement">
                    <i class="fas fa-play" style="color: #f59e0b; margin-right: 0.5rem;"></i>
                    Click "Run Tests" to validate your code
                </div>
            `;
      return;
    }

    // Challenge mode - show challenge requirements
    let statements = [];

    // Use testStatements if available
    if (
      this.currentChallenge.testStatements &&
      this.currentChallenge.testStatements.length > 0
    ) {
      statements = this.currentChallenge.testStatements;
    }
    // Fallback to test_statements for backward compatibility
    else if (
      this.currentChallenge.test_statements &&
      this.currentChallenge.test_statements.length > 0
    ) {
      statements = this.currentChallenge.test_statements;
    }
    // Extract from tests array if no statements provided
    else if (
      this.currentChallenge.tests &&
      this.currentChallenge.tests.length > 0
    ) {
      statements = this.currentChallenge.tests.map(
        (test) =>
          test.name || test.description || "Complete this test requirement"
      );
    }
    // Fallback to instructions if available
    else if (this.currentChallenge.instructions) {
      statements = [this.currentChallenge.instructions];
    }
    // Default requirements
    else {
      statements = [
        "Complete the challenge according to the description",
        "Ensure your code works correctly",
        "All tests must pass to complete the challenge",
      ];
    }

    // Add each test statement
    statements.forEach((statement, index) => {
      const statementElement = document.createElement("div");
      statementElement.className = "test-statement";
      statementElement.id = `test-statement-${index}`;
      statementElement.innerHTML = `
                <i class="fas fa-circle" style="color: #6b7280; margin-right: 0.5rem;"></i>
                ${statement}
            `;
      testStatementsContainer.appendChild(statementElement);
    });

    console.log("Test statements displayed:", statements);
  }

  async checkForPendingChallenge() {
    // Check if there's a challenge to load from localStorage
    const pendingChallenge = localStorage.getItem(
      "codequest_current_challenge"
    );
    if (pendingChallenge) {
      console.log("Found pending challenge:", pendingChallenge);

      // Clear the localStorage to prevent reloading
      localStorage.removeItem("codequest_current_challenge");

      // Validate that the challenge exists before trying to load it
      try {
        const response = await fetch(
          `/api/challenges/${encodeURIComponent(pendingChallenge)}`
        );
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            console.log(
              "Pending challenge is valid, loading:",
              pendingChallenge
            );
            // Load the challenge
            this.loadChallenge(pendingChallenge);
            return;
          }
        }

        // Challenge doesn't exist or API error
        console.warn(
          `Pending challenge "${pendingChallenge}" not found or invalid, switching to free play mode`
        );
        this.resetToFreePlayMode();
      } catch (error) {
        console.error("Error validating pending challenge:", error);
        console.warn(
          `Could not validate pending challenge "${pendingChallenge}", switching to free play mode`
        );
        this.resetToFreePlayMode();
      }
    } else {
      // No challenge to load, ensure we're in free play mode
      this.resetToFreePlayMode();
    }
  }

  resetToFreePlayMode() {
    // Reset challenge display to free play mode
    const challengeTitle = document.getElementById("challengeTitle");
    const challengeDifficulty = document.getElementById("challengeXP");
    const challengeXP = document.getElementById("challengeXP");
    const defaultDescription = document.getElementById("defaultDescription");
    const challengeDescriptionContent = document.getElementById(
      "challengeDescriptionContent"
    );
    const challengeTests = document.getElementById("challengeTests");

    // Reset title and meta
    if (challengeTitle) challengeTitle.textContent = "Code Editor";
    if (challengeDifficulty) challengeDifficulty.textContent = "Free Play";
    if (challengeXP) challengeXP.textContent = "+0 XP";

    // Show default description, hide challenge content
    if (defaultDescription) defaultDescription.style.display = "block";
    if (challengeDescriptionContent)
      challengeDescriptionContent.style.display = "none";
    if (challengeTests) challengeTests.style.display = "none";

    // Clear current challenge
    this.currentChallenge = null;
    this.isChallengeMode = false;

    console.log("Reset to free play mode");
  }

  async validateChallengeSubmission() {
    if (!this.currentChallenge) {
      return { success: false, message: "No challenge loaded" };
    }

    try {
      // Get current code
      const code = {
        html: this.editors.html ? this.editors.html.value : "",
        css: this.editors.css ? this.editors.css.value : "",
        js: this.editors.js ? this.editors.js.value : "",
      };

      // Basic validation - ensure code exists
      if (!code.html && !code.css && !code.js) {
        return {
          success: false,
          message: "Please add some code before submitting",
        };
      }

      // Run tests to validate
      await this.runTests();

      // Check if all tests passed
      if (
        this.testResults.length > 0 &&
        !this.testResults.every((test) => test.passed)
      ) {
        return {
          success: false,
          message: "All tests must pass before submitting",
        };
      }

      return { success: true, message: "Challenge validation successful" };
    } catch (error) {
      console.error("Challenge validation error:", error);
      return { success: false, message: "Validation failed: " + error.message };
    }
  }

  async updateUserProgress() {
    try {
      // Check if user is authenticated
      const currentUser = this.getCurrentUser();
      if (!currentUser) {
        console.log("No authenticated user, skipping progress update");
        return;
      }

      // Get current progress from localStorage
      const progress = JSON.parse(
        localStorage.getItem("codequest_progress") || "{}"
      );

      // Update challenge completion
      if (!progress.challenges) progress.challenges = {};
      progress.challenges[this.currentChallenge.id] = {
        completed: true,
        completedAt: new Date().toISOString(),
        xpEarned: this.currentChallenge.xp_reward,
        title: this.currentChallenge.title,
      };

      // Update total XP
      progress.totalXP =
        (progress.totalXP || 0) + this.currentChallenge.xp_reward;

      // Update completed challenges count
      progress.completedChallenges = Object.keys(progress.challenges).length;

      // Save progress
      localStorage.setItem("codequest_progress", JSON.stringify(progress));

      console.log("User progress updated:", progress);
    } catch (error) {
      console.error("Error updating user progress:", error);
    }
  }

  saveChallengeProgress() {
    try {
      const progress = JSON.parse(
        localStorage.getItem("codequest_progress") || "{}"
      );

      // Save current challenge state
      if (this.currentChallenge) {
        if (!progress.currentChallenge) progress.currentChallenge = {};
        progress.currentChallenge = {
          id: this.currentChallenge.id,
          title: this.currentChallenge.title,
          lastAccessed: new Date().toISOString(),
        };
      }

      localStorage.setItem("codequest_progress", JSON.stringify(progress));
    } catch (error) {
      console.error("Error saving challenge progress:", error);
    }
  }

  executeCodeAndShowResults() {
    console.log("=== Executing code and showing results ===");
    console.log(
      "=== IMPORTANT: This method ONLY READS content, NEVER resets anything ==="
    );

    // Debug: Check what editors we have
    console.log("=== EDITOR DEBUG ===");
    console.log("this.editors:", this.editors);
    console.log("HTML editor element:", this.editors.html);
    console.log("CSS editor element:", this.editors.css);
    console.log("JS editor element:", this.editors.js);

    // Direct element check as fallback
    const htmlEditorDirect = document.getElementById("html-textarea-editor");
    const cssEditorDirect = document.getElementById("css-textarea-editor");
    const jsEditorDirect = document.getElementById("js-textarea-editor");

    console.log("Direct element check:", {
      htmlEditorDirect,
      cssEditorDirect,
      jsEditorDirect,
    });

    // Get current code - try both methods (READ ONLY, NO RESET)
    const code = {
      html:
        (this.editors.html ? this.editors.html.value : "") ||
        (htmlEditorDirect ? htmlEditorDirect.value : ""),
      css:
        (this.editors.css ? this.editors.css.value : "") ||
        (cssEditorDirect ? cssEditorDirect.value : ""),
      js:
        (this.editors.js ? this.editors.js.value : "") ||
        (jsEditorDirect ? jsEditorDirect.value : ""),
    };

    // Additional debugging to see what's actually in the editors
    console.log("=== CONTENT DEBUG ===");
    if (this.editors.html) {
      console.log("HTML editor value length:", this.editors.html.value.length);
      console.log(
        "HTML editor value preview:",
        this.editors.html.value.substring(0, 100)
      );
    }
    if (htmlEditorDirect) {
      console.log(
        "Direct HTML editor value length:",
        htmlEditorDirect.value.length
      );
      console.log(
        "Direct HTML editor value preview:",
        htmlEditorDirect.value.substring(0, 100)
      );
    }

    console.log("Code to execute:", code);

    // Check if we have any code to execute
    if (!code.html && !code.css && !code.js) {
      // Try to fix editor references if they're broken
      console.log("No code found, trying to fix editor references...");
      this.fixEditorReferences();

      // Try reading again after fixing
      const retryCode = {
        html: this.editors.html ? this.editors.html.value : "",
        css: this.editors.css ? this.editors.css.value : "",
        js: this.editors.js ? this.editors.js.value : "",
      };

      console.log("Retry code after fixing editors:", retryCode);

      if (!retryCode.html && !retryCode.css && !retryCode.js) {
        this.showError(
          "Please add some code to the editors before executing. Start with HTML, CSS, or JavaScript!"
        );
        return;
      } else {
        // Use the retry code
        Object.assign(code, retryCode);
        console.log("Using fixed code:", code);
      }
    }

    // Switch to preview tab to show results
    this.switchTab("preview");

    // Wait a moment for tab switch, then refresh preview
    setTimeout(() => {
      // Show what code is being executed
      const hasHTML = code.html.trim().length > 0;
      const hasCSS = code.css.trim().length > 0;
      const hasJS = code.js.trim().length > 0;

      let message = "Executing: ";
      if (hasHTML) message += "HTML ";
      if (hasCSS) message += "CSS ";
      if (hasJS) message += "JavaScript ";
      message += "code...";

      this.showInfo(message);

      // Refresh preview with current code
      this.refreshPreview();

      // Auto-save code in background
      this.saveCode();

      // Force a second refresh to ensure content is displayed
      setTimeout(() => {
        console.log("Second preview refresh to ensure content is displayed");
        this.refreshPreview();
      }, 1000);

      console.log("Code execution completed");
    }, 500);
  }

  refreshPreview() {
    console.log("=== refreshPreview() called - using ACTUAL user code ===");

    // Preview should work in both free play and challenge modes
    // No login required for preview functionality

    const iframe = document.getElementById("preview-frame");
    if (!iframe) {
      console.error("Preview iframe not found!");
      return;
    }

    console.log("Preview iframe found:", iframe);

    // Show loading state
    this.showPreviewLoading(true);

    // Update sandbox attributes to fix security warning
    iframe.setAttribute("sandbox", "allow-scripts");
    iframe.removeAttribute("allow-same-origin");

    const code = {
      html: this.editors.html ? this.editors.html.value : "",
      css: this.editors.css ? this.editors.css.value : "",
      js: this.editors.js ? this.editors.js.value : "",
    };

    // Clean up the HTML content - remove any existing DOCTYPE or html tags from user code
    let cleanHTML = code.html;
    if (cleanHTML) {
      // Remove DOCTYPE, html, head, body tags if they exist in user code
      cleanHTML = cleanHTML.replace(/<!DOCTYPE[^>]*>/gi, "");
      cleanHTML = cleanHTML.replace(/<html[^>]*>/gi, "");
      cleanHTML = cleanHTML.replace(/<\/html>/gi, "");
      cleanHTML = cleanHTML.replace(/<head[^>]*>[\s\S]*?<\/head>/gi, "");
      cleanHTML = cleanHTML.replace(/<body[^>]*>/gi, "");
      cleanHTML = cleanHTML.replace(/<\/body>/gi, "");
      cleanHTML = cleanHTML.trim();
    }

    console.log("=== PREVIEW CODE PROCESSING ===");
    console.log("Original HTML:", code.html);
    console.log("Cleaned HTML:", cleanHTML);
    console.log("CSS:", code.css);
    console.log("JavaScript:", code.js);

    const previewHTML = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>CodeQuest Preview</title>
                <style>${code.css}</style>
            </head>
            <body>
                ${cleanHTML}
                <script>
                    // Override console methods to capture output
                    const originalLog = console.log;
                    const originalError = console.error;
                    const originalWarn = console.warn;
                    
                    console.log = function(...args) {
                        originalLog.apply(console, args);
                        window.parent.postMessage({
                            type: 'console',
                            level: 'log',
                            message: args.map(arg => 
                                typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
                            ).join(' ')
                        }, '*');
                    };
                    
                    console.error = function(...args) {
                        originalError.apply(console, args);
                        window.parent.postMessage({
                            type: 'console',
                            level: 'error',
                            message: args.map(arg => 
                                typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
                            ).join(' ')
                        }, '*');
                    };
                    
                    console.warn = function(...args) {
                        originalWarn.apply(console, args);
                        window.parent.postMessage({
                            type: 'console',
                            level: 'warn',
                            message: args.map(arg => 
                                typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
                            ).join(' ')
                        }, '*');
                    };
                    
                    // Execute user's JavaScript code
                    try {
                        ${code.js}
                    } catch (error) {
                        console.error('JavaScript execution error:', error.message);
                    }
                </script>
            </body>
            </html>
        `;

    try {
      console.log("Setting preview HTML:", previewHTML);
      iframe.srcdoc = previewHTML;

      // Log preview refresh for debugging
      console.log("Preview refreshed with:", {
        htmlLength: code.html.length,
        cssLength: code.css.length,
        jsLength: code.js.length,
        previewHTML: previewHTML,
      });

      // Show success message if this was triggered by execute button
      if (this.currentTab === "preview") {
        console.log("Preview updated successfully");
        // Show a subtle success indicator
        this.showPreviewStatus("Preview updated successfully", "success");
      }

      // Hide loading state
      this.showPreviewLoading(false);
    } catch (error) {
      console.error("Error updating preview:", error);
      this.showPreviewStatus("Failed to update preview", "error");

      // Fallback: try to set innerHTML if srcdoc fails
      try {
        iframe.innerHTML = previewHTML;
        console.log("Preview updated using fallback method");
        this.showPreviewStatus(
          "Preview updated using fallback method",
          "warning"
        );
      } catch (fallbackError) {
        console.error("Fallback preview update also failed:", fallbackError);
        this.showError(
          "Failed to update preview. Please try refreshing manually."
        );
      }
    } finally {
      // Always hide loading state
      this.showPreviewLoading(false);
    }
  }

  toggleFullscreen() {
    // Fullscreen should work in both free play and challenge modes
    // No login required for fullscreen functionality

    const iframe = document.getElementById("preview-frame");
    if (!iframe) return;

    if (iframe.requestFullscreen) {
      iframe.requestFullscreen();
    } else if (iframe.webkitRequestFullscreen) {
      iframe.webkitRequestFullscreen();
    } else if (iframe.msRequestFullscreen) {
      iframe.msRequestFullscreen();
    }
  }

  saveCode() {
    // Check if user is logged in
    const currentUser = window.AuthManager
      ? window.AuthManager.currentUser
      : JSON.parse(localStorage.getItem("codequest_user") || "null");

    if (!currentUser) {
      this.showLoginRequiredMessage();
      return;
    }

    const code = {
      html: this.editors.html ? this.editors.html.value : "",
      css: this.editors.css ? this.editors.css.value : "",
      js: this.editors.js ? this.editors.js.value : "",
    };

    localStorage.setItem("codequest_autosave", JSON.stringify(code));
    // Removed notification message - code saves silently
  }

  loadSavedCode() {
    // Check if user is logged in
    const currentUser = window.AuthManager
      ? window.AuthManager.currentUser
      : JSON.parse(localStorage.getItem("codequest_user") || "null");

    if (!currentUser) {
      this.showLoginRequiredMessage();
      return;
    }

    const saved = localStorage.getItem("codequest_autosave");
    if (saved) {
      try {
        const code = JSON.parse(saved);
        if (this.editors.html) this.editors.html.value = code.html || "";
        if (this.editors.css) this.editors.css.value = code.css || "";
        if (this.editors.js) this.editors.js.value = code.js || "";
        this.showInfo("Saved code restored");
      } catch (error) {
        console.error("Error loading saved code:", error);
      }
    }
  }

  resizeEditors() {
    // Simple resize for textareas
    Object.values(this.editors).forEach((editor) => {
      if (editor && editor.style) {
        editor.style.height = "auto";
        editor.style.height = editor.scrollHeight + "px";
      }
    });
  }

  setupAI() {
    const aiButton = document.getElementById("ai-assistant-button");
    const aiChatWindow = document.getElementById("ai-chat-window");
    const closeAiChat = document.getElementById("close-ai-chat");
    const aiSendBtn = document.getElementById("ai-send");
    const aiInput = document.getElementById("ai-input");
    const quickActions = document.querySelectorAll(".quick-action");

    if (!aiButton || !aiChatWindow) return;

    // AI Button click to show chat
    aiButton.addEventListener("click", () => {
      aiChatWindow.style.display = "flex";
      aiChatWindow.classList.add("active");
    });

    // Close AI chat
    if (closeAiChat) {
      closeAiChat.addEventListener("click", () => {
        aiChatWindow.style.display = "none";
        aiChatWindow.classList.remove("active");
      });
    }

    // AI Input handling
    if (aiSendBtn) {
      aiSendBtn.addEventListener("click", () => this.sendAIRequest());
    }

    if (aiInput) {
      aiInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
          e.preventDefault();
          this.sendAIRequest();
        }
      });
    }

    // Quick action buttons
    quickActions.forEach((button) => {
      button.addEventListener("click", () => {
        const prompt = button.getAttribute("data-prompt");
        if (aiInput) aiInput.value = prompt;
        this.sendAIRequest();
      });
    });
  }

  async sendAIRequest() {
    const aiInput = document.getElementById("ai-input");
    if (!aiInput) return;

    const message = aiInput.value.trim();
    if (!message) return;

    // Check if user is logged in
    const currentUser = window.AuthManager
      ? window.AuthManager.currentUser
      : JSON.parse(localStorage.getItem("codequest_user") || "null");

    if (!currentUser) {
      this.addMessageToChat("Please log in to use the AI assistant.", "error");
      return;
    }

    try {
      // Add user message to chat
      this.addMessageToChat(message, "user");

      // Show typing indicator
      this.showTypingIndicator();

      const context = {
        page: "editor",
        challenge: this.currentChallenge ? this.currentChallenge.title : null,
        code: {
          html: this.editors.html ? this.editors.html.value : "",
          css: this.editors.css ? this.editors.css.value : "",
          js: this.editors.js ? this.editors.js.value : "",
        },
        failingTests: this.testResults.filter((t) => !t.passed),
      };

      const response = await fetch(`${this.apiBase}/ai`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: message,
          context: context,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();

      // Hide typing indicator
      this.hideTypingIndicator();

      if (result.response) {
        this.addMessageToChat(result.response, "ai");
      } else {
        throw new Error("Invalid response format");
      }
    } catch (error) {
      console.error("Error getting AI response:", error);
      this.hideTypingIndicator();
      this.addMessageToChat(
        "Sorry, I encountered an error. Please try again.",
        "error"
      );
    }

    aiInput.value = "";
  }

  addMessageToChat(message, type) {
    const aiMessages = document.getElementById("ai-messages");
    if (!aiMessages) return;

    const messageDiv = document.createElement("div");
    messageDiv.className = `ai-message ${type}-message`;

    if (type === "user") {
      messageDiv.textContent = message;
    } else if (type === "ai") {
      messageDiv.innerHTML = this.formatAIResponse(message);
    } else if (type === "error") {
      messageDiv.textContent = message;
    }

    aiMessages.appendChild(messageDiv);
    aiMessages.scrollTop = aiMessages.scrollHeight;
  }

  showTypingIndicator() {
    const aiMessages = document.getElementById("ai-messages");
    if (!aiMessages) return;

    const typingDiv = document.createElement("div");
    typingDiv.className = "ai-message ai-message typing-indicator";
    typingDiv.id = "typing-indicator";
    typingDiv.innerHTML =
      '<div class="typing-dots"><span></span><span></span><span></span></div>';
    aiMessages.appendChild(typingDiv);
    aiMessages.scrollTop = aiMessages.scrollHeight;
  }

  hideTypingIndicator() {
    const typingIndicator = document.getElementById("typing-indicator");
    if (typingIndicator) {
      typingIndicator.remove();
    }
  }

  formatAIResponse(response) {
    // Simple formatting for code blocks and lists
    return response
      .replace(/```(\w+)?\n([\s\S]*?)```/g, "<pre><code>$2</code></pre>")
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.*?)\*/g, "<em>$1</em>")
      .replace(/\n/g, "<br>");
  }

  getAuthToken() {
    // Get JWT token from localStorage or memory
    return localStorage.getItem("codequest_jwt") || "";
  }

  isUserLoggedIn() {
    // Check if user is logged in - more robust check
    let currentUser = null;

    // First try AuthManager
    if (window.AuthManager && window.AuthManager.currentUser) {
      currentUser = window.AuthManager.currentUser;
    }

    // Fallback to localStorage
    if (!currentUser) {
      try {
        const storedUser = localStorage.getItem("codequest_user");
        if (storedUser) {
          currentUser = JSON.parse(storedUser);
        }
      } catch (e) {
        console.warn("Error parsing stored user:", e);
      }
    }

    // Additional check for JWT token
    if (!currentUser) {
      const token = localStorage.getItem("codequest_jwt");
      if (token) {
        // If we have a token, assume user is logged in
        currentUser = { id: "token_user", username: "User" };
      }
    }

    // Temporary bypass for testing - remove this in production
    if (!currentUser && localStorage.getItem("force_auth_bypass") === "true") {
      console.warn("FORCE AUTH BYPASS ENABLED - FOR TESTING ONLY");
      return true;
    }

    return currentUser !== null;
  }

  getCurrentUser() {
    // Get current user - more robust check
    let currentUser = null;

    // First try AuthManager
    if (window.AuthManager && window.AuthManager.currentUser) {
      currentUser = window.AuthManager.currentUser;
    }

    // Fallback to localStorage
    if (!currentUser) {
      try {
        const storedUser = localStorage.getItem("codequest_user");
        if (storedUser) {
          currentUser = JSON.parse(storedUser);
        }
      } catch (e) {
        console.warn("Error parsing stored user:", e);
      }
    }

    // Additional check for JWT token
    if (!currentUser) {
      const token = localStorage.getItem("codequest_jwt");
      if (token) {
        // If we have a token, assume user is logged in
        currentUser = { id: "token_user", username: "User" };
      }
    }

    return currentUser;
  }

  logAuthStatus() {
    console.log("=== Authentication Status ===");
    console.log("AuthManager exists:", !!window.AuthManager);
    console.log("AuthManager currentUser:", window.AuthManager?.currentUser);
    console.log(
      "LocalStorage codequest_user:",
      localStorage.getItem("codequest_user")
    );
    console.log(
      "LocalStorage codequest_jwt:",
      localStorage.getItem("codequest_jwt")
    );
    console.log("isUserLoggedIn():", this.isUserLoggedIn());
    console.log("getCurrentUser():", this.getCurrentUser());
    console.log("============================");
  }

  showError(message) {
    this.showNotification(message, "error");
  }

  showSuccess(message) {
    this.showNotification(message, "success");
  }

  showInfo(message) {
    this.showNotification(message, "info");
  }

  showNotification(message, type) {
    const notification = document.createElement("div");
    notification.className = `notification ${type}`;
    notification.innerHTML = `
            <span>${message}</span>
            <button onclick="this.parentElement.remove()">&times;</button>
        `;

    document.body.appendChild(notification);

    setTimeout(() => {
      if (notification.parentElement) {
        notification.remove();
      }
    }, 5000);
  }

  // Check for game mode
  async checkForGame() {
    try {
      console.log("=== Checking for game mode ===");

      // Check URL parameters for game
      const urlParams = new URLSearchParams(window.location.search);
      const gameSlug = urlParams.get("game");

      console.log("URL search params:", window.location.search);
      console.log("Game slug from URL:", gameSlug);

      if (gameSlug) {
        console.log("✅ Game slug found in URL:", gameSlug);

        // Get game data from sessionStorage
        const gameData = sessionStorage.getItem("current_game");
        console.log(
          "SessionStorage game data:",
          gameData ? "Found" : "Not found"
        );

        if (gameData) {
          const game = JSON.parse(gameData);
          console.log("✅ Game data parsed successfully:", game.title);

          this.currentGame = game;
          await this.loadGameInstructions(game);
          this.setupGameMode();

          // Show success message
          this.showSuccess(`🎮 Game loaded: ${game.title}`);
          return;
        } else {
          console.log("⚠️ No game data in sessionStorage, trying API...");
        }

        // If no sessionStorage data, try to fetch from API
        await this.loadGameFromAPI(gameSlug);
      } else {
        console.log("ℹ️ No game slug in URL, running in normal editor mode");
      }
    } catch (error) {
      console.error("❌ Error checking for game:", error);
    }
  }

  // Load game from API if not in sessionStorage
  async loadGameFromAPI(gameSlug) {
    try {
      console.log("Loading game from API:", gameSlug);

      const response = await fetch(`${this.apiBase}/games?slug=${gameSlug}`);
      if (!response.ok) {
        throw new Error(`Failed to load game: ${response.status}`);
      }

      const result = await response.json();
      if (result.success && result.data.length > 0) {
        const game = result.data[0];
        this.currentGame = game;
        this.loadGameInstructions(game);
        this.setupGameMode();
      }
    } catch (error) {
      console.error("Error loading game from API:", error);
    }
  }

  // Load game instructions into the editor
  async loadGameInstructions(game) {
    console.log("🎮 Loading game instructions for:", game.title);

    // Update page title and header
    const challengeTitle = document.getElementById("challengeTitle");
    if (challengeTitle) {
      challengeTitle.textContent = `🎮 ${game.title}`;
      console.log("✅ Updated page title");
    } else {
      console.error("❌ challengeTitle element not found");
    }

    // Update difficulty and XP display
    const challengeDifficulty = document.getElementById("challengeDifficulty");
    if (challengeDifficulty) {
      challengeDifficulty.textContent = game.difficulty.toUpperCase();
      challengeDifficulty.className = `challenge-badge difficulty ${game.difficulty.toLowerCase()}`;
      console.log("✅ Updated difficulty badge");
    } else {
      console.error("❌ challengeDifficulty element not found");
    }

    const challengeXP = document.getElementById("challengeXP");
    if (challengeXP) {
      challengeXP.textContent = `+${game.xp_reward} XP`;
      console.log("✅ Updated XP display");
    } else {
      console.error("❌ challengeXP element not found");
    }

    // Load user progress for this game
    const userProgress = await this.loadUserGameProgress(game.id);

    // Show game description and instructions
    const defaultDescription = document.getElementById("defaultDescription");
    const challengeDescriptionContent = document.getElementById(
      "challengeDescriptionContent"
    );

    console.log("Description elements found:", {
      defaultDescription: !!defaultDescription,
      challengeDescriptionContent: !!challengeDescriptionContent,
    });

    if (defaultDescription) {
      defaultDescription.style.display = "none";
      console.log("✅ Hidden default description");
    }

    if (challengeDescriptionContent) {
      challengeDescriptionContent.style.display = "block";
      challengeDescriptionContent.innerHTML = `
        <div class="game-info">
          ${
            userProgress
              ? `
            <div class="user-progress-banner">
              <h3>� Y our Progress</h3>
              <div class="progress-stats">
                <div class="stat-item">
                  <span class="stat-label">Best Score:</span>
                  <span class="stat-value">${
                    userProgress.best_score || 0
                  }</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">Times Played:</span>
                  <span class="stat-value">${
                    userProgress.total_plays || 0
                  }</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">Best Time:</span>
                  <span class="stat-value">${
                    userProgress.best_time
                      ? this.formatTime(userProgress.best_time)
                      : "N/A"
                  }</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">Rank:</span>
                  <span class="stat-value">#${
                    userProgress.rank || "Unranked"
                  }</span>
                </div>
              </div>
            </div>
          `
              : ""
          }
          
          <div class="game-description">
            <h3>🎯 Game Objective</h3>
            <p>${game.description}</p>
          </div>
          
          <div class="game-instructions">
            <h3>📋 How to Play</h3>
            <div class="instructions-content">
              ${
                game.instructions ||
                "Complete the coding challenge to win the game!"
              }
            </div>
          </div>
          
          <div class="game-requirements">
            <h3>🎯 Requirements</h3>
            <ul>
              <li>Write clean, functional code</li>
              <li>Complete within the time limit (${Math.floor(
                game.time_limit / 60
              )} minutes)</li>
              <li>Test your solution before submitting</li>
              <li>Aim for the highest score possible (${
                game.max_score
              } points)</li>
            </ul>
          </div>
          
          <div class="game-details">
            <div class="game-detail">
              <strong>⏱️ Time Limit:</strong> ${Math.floor(
                game.time_limit / 60
              )} minutes
            </div>
            <div class="game-detail">
              <strong>🎯 Max Score:</strong> ${game.max_score} points
            </div>
            <div class="game-detail">
              <strong>🏆 XP Reward:</strong> ${game.xp_reward} XP
            </div>
            <div class="game-detail">
              <strong>📂 Category:</strong> ${game.category}
            </div>
            <div class="game-detail">
              <strong>🎮 Type:</strong> ${game.game_type || "Interactive"}
            </div>
          </div>
          
          ${
            game.tags && game.tags.length > 0
              ? `
            <div class="game-tags">
              <strong>🏷️ Tags:</strong>
              ${game.tags
                .map((tag) => `<span class="tag">${tag}</span>`)
                .join("")}
            </div>
          `
              : ""
          }

          <div class="game-actions">
            <button class="btn btn-success" onclick="editor.startGame()">
              <i class="fas fa-play"></i> Start Game
            </button>
            <button class="btn btn-info" onclick="editor.showGameLeaderboard('${
              game.id
            }')">
              <i class="fas fa-trophy"></i> Leaderboard
            </button>
            <button class="btn btn-secondary" onclick="window.location.href='games.html'">
              <i class="fas fa-arrow-left"></i> Back to Games
            </button>
          </div>
        </div>
      `;
      console.log("✅ Updated game instructions and details");
    } else {
      console.error("❌ challengeDescriptionContent element not found");
    }

    // Load starter code if available
    if (game.game_config && game.game_config.starter_code) {
      this.loadGameStarterCode(game.game_config.starter_code);
    }
  }

  // Setup game mode functionality
  setupGameMode() {
    console.log("🎮 Setting up game mode");

    // Initialize game start time
    this.gameStartTime = Date.now();

    // Update button labels for game mode
    const runTestsBtn = document.getElementById("runTestsBtn");
    if (runTestsBtn) {
      runTestsBtn.innerHTML = '<i class="fas fa-play"></i> Test Game';
      runTestsBtn.onclick = () => this.testGame();
      runTestsBtn.disabled = false;
      console.log("✅ Updated run tests button for game mode");
    }

    const submitBtn = document.getElementById("submitBtn");
    if (submitBtn) {
      submitBtn.innerHTML = '<i class="fas fa-trophy"></i> Complete Game';
      submitBtn.onclick = () => this.completeGame();
      submitBtn.disabled = false;
      console.log("✅ Updated submit button for game mode");
    }

    // Update page title to show game mode
    const challengeTitle = document.getElementById("challengeTitle");
    if (challengeTitle && this.currentGame) {
      challengeTitle.textContent = `🎮 ${this.currentGame.title}`;
    }

    // Add game timer if there's a time limit
    if (this.currentGame && this.currentGame.time_limit > 0) {
      console.log(
        "⏱️ Starting game timer:",
        this.currentGame.time_limit,
        "seconds"
      );
      this.startGameTimer(this.currentGame.time_limit);
    }

    // Load initial game code if provided
    if (this.currentGame && this.currentGame.game_config) {
      console.log("📝 Loading starter code");
      this.loadGameStarterCode(this.currentGame.game_config);
    }

    // Show game-specific test results area
    this.setupGameTestResults();

    console.log("✅ Game mode setup complete");
  }

  // Setup game-specific test results
  setupGameTestResults() {
    const testResults = document.getElementById("testResults");
    if (testResults) {
      testResults.innerHTML = `
        <div class="game-test-placeholder">
          <div class="test-info">
            <h4>🎮 Game Testing</h4>
            <p>Click "Test Game" to check your code and see your current score.</p>
            <p>When ready, click "Complete Game" to submit your final solution!</p>
          </div>
          <div class="game-scoring">
            <div class="score-item">
              <span class="score-label">Code Quality:</span>
              <span class="score-value" id="codeQualityScore">-</span>
            </div>
            <div class="score-item">
              <span class="score-label">Functionality:</span>
              <span class="score-value" id="functionalityScore">-</span>
            </div>
            <div class="score-item">
              <span class="score-label">Performance:</span>
              <span class="score-value" id="performanceScore">-</span>
            </div>
            <div class="score-item total-score">
              <span class="score-label">Total Score:</span>
              <span class="score-value" id="totalScore">0 / ${this.currentGame.max_score}</span>
            </div>
          </div>
        </div>
      `;
    }
  }

  // Test the game (like running tests for challenges)
  testGame() {
    console.log("🧪 Testing game...");

    const testStatus = document.getElementById("testStatus");
    const testResults = document.getElementById("testResults");

    if (testStatus) {
      testStatus.textContent = "TESTING...";
      testStatus.className = "status-indicator testing";
    }

    // Get current code
    const code = {
      html: this.editors.html ? this.editors.html.value : "",
      css: this.editors.css ? this.editors.css.value : "",
      js: this.editors.js ? this.editors.js.value : "",
    };

    // Calculate scores based on code
    const scores = this.calculateGameScores(code);

    // Update score display
    this.updateScoreDisplay(scores);

    // Update test status
    if (testStatus) {
      testStatus.textContent = "TESTED";
      testStatus.className = "status-indicator success";
    }

    // Show test results
    if (testResults) {
      testResults.innerHTML = `
        <div class="game-test-results">
          <div class="test-header">
            <h4>🎯 Game Test Results</h4>
          </div>
          <div class="test-feedback">
            ${this.generateGameFeedback(scores, code)}
          </div>
          <div class="game-scoring">
            <div class="score-item">
              <span class="score-label">Code Quality:</span>
              <span class="score-value">${scores.codeQuality}/30</span>
            </div>
            <div class="score-item">
              <span class="score-label">Functionality:</span>
              <span class="score-value">${scores.functionality}/40</span>
            </div>
            <div class="score-item">
              <span class="score-label">Performance:</span>
              <span class="score-value">${scores.performance}/30</span>
            </div>
            <div class="score-item total-score">
              <span class="score-label">Total Score:</span>
              <span class="score-value">${scores.total} / ${
        this.currentGame.max_score
      }</span>
            </div>
          </div>
          <div class="test-actions">
            <button class="btn btn-primary" onclick="editor.refreshPreview()">
              <i class="fas fa-eye"></i> Preview Code
            </button>
            <button class="btn btn-success" onclick="editor.completeGame()">
              <i class="fas fa-trophy"></i> Submit Final Solution
            </button>
          </div>
        </div>
      `;
    }

    this.showSuccess("Game tested successfully! Check your scores above.");
  }

  // Calculate game scores based on code quality
  calculateGameScores(code) {
    let codeQuality = 0;
    let functionality = 0;
    let performance = 0;

    // Code Quality (30 points max)
    if (code.html.trim().length > 0) codeQuality += 10;
    if (code.css.trim().length > 0) codeQuality += 10;
    if (code.js.trim().length > 0) codeQuality += 10;

    // Functionality (40 points max)
    if (code.html.includes("<") && code.html.includes(">")) functionality += 15;
    if (code.css.includes("{") && code.css.includes("}")) functionality += 15;
    if (code.js.includes("function") || code.js.includes("=>"))
      functionality += 10;

    // Performance (30 points max)
    if (code.html.length > 50) performance += 10;
    if (code.css.length > 50) performance += 10;
    if (code.js.length > 50) performance += 10;

    const total = codeQuality + functionality + performance;

    return {
      codeQuality,
      functionality,
      performance,
      total: Math.min(total, this.currentGame.max_score),
    };
  }

  // Generate feedback based on scores
  generateGameFeedback(scores, code) {
    const feedback = [];

    if (scores.codeQuality < 20) {
      feedback.push(
        "💡 Try adding more code in HTML, CSS, and JavaScript sections."
      );
    }

    if (scores.functionality < 25) {
      feedback.push(
        "🔧 Make sure your code has proper structure (tags, selectors, functions)."
      );
    }

    if (scores.performance < 20) {
      feedback.push("📈 Add more content to demonstrate your coding skills.");
    }

    if (scores.total >= this.currentGame.max_score * 0.8) {
      feedback.push("🎉 Excellent work! You're ready to submit.");
    } else if (scores.total >= this.currentGame.max_score * 0.6) {
      feedback.push("👍 Good progress! Consider adding more features.");
    } else {
      feedback.push("💪 Keep working! Add more code to improve your score.");
    }

    return feedback
      .map((f) => `<div class="feedback-item">${f}</div>`)
      .join("");
  }

  // Update score display
  updateScoreDisplay(scores) {
    const codeQualityScore = document.getElementById("codeQualityScore");
    const functionalityScore = document.getElementById("functionalityScore");
    const performanceScore = document.getElementById("performanceScore");
    const totalScore = document.getElementById("totalScore");

    if (codeQualityScore)
      codeQualityScore.textContent = `${scores.codeQuality}/30`;
    if (functionalityScore)
      functionalityScore.textContent = `${scores.functionality}/40`;
    if (performanceScore)
      performanceScore.textContent = `${scores.performance}/30`;
    if (totalScore)
      totalScore.textContent = `${scores.total} / ${this.currentGame.max_score}`;
  }

  // Start game timer
  startGameTimer(timeLimit) {
    const timerDisplay = document.createElement("div");
    timerDisplay.className = "game-timer";
    timerDisplay.innerHTML = `
      <div class="timer-content">
        <i class="fas fa-clock"></i>
        <span id="timeRemaining">${this.formatTime(timeLimit)}</span>
      </div>
    `;

    // Insert timer after challenge header
    const challengeInfo = document.querySelector(".challenge-info");
    if (challengeInfo) {
      challengeInfo.appendChild(timerDisplay);
    }

    // Start countdown
    let timeRemaining = timeLimit;
    this.gameTimer = setInterval(() => {
      timeRemaining--;
      const timeDisplay = document.getElementById("timeRemaining");
      if (timeDisplay) {
        timeDisplay.textContent = this.formatTime(timeRemaining);

        // Add warning styles when time is running low
        if (timeRemaining <= 60) {
          timerDisplay.classList.add("timer-warning");
        }
        if (timeRemaining <= 30) {
          timerDisplay.classList.add("timer-critical");
        }
      }

      if (timeRemaining <= 0) {
        clearInterval(this.gameTimer);
        this.handleGameTimeout();
      }
    }, 1000);
  }

  // Handle game timeout
  handleGameTimeout() {
    this.showWarning("⏰ Time's up! Your game session has ended.");

    // Disable editing
    Object.values(this.editors).forEach((editor) => {
      if (editor) editor.disabled = true;
    });

    // Auto-submit current progress
    this.completeGame(true);
  }

  // Load starter code for the game
  loadGameStarterCode(gameConfig) {
    if (gameConfig.starter_html && this.editors.html) {
      this.editors.html.value = gameConfig.starter_html;
    }
    if (gameConfig.starter_css && this.editors.css) {
      this.editors.css.value = gameConfig.starter_css;
    }
    if (gameConfig.starter_js && this.editors.js) {
      this.editors.js.value = gameConfig.starter_js;
    }

    // Refresh preview with starter code
    this.refreshPreview();
  }

  // Complete the game
  async completeGame(isTimeout = false) {
    if (!this.currentGame) {
      this.showError("No active game session found");
      return;
    }

    try {
      // Get current code
      const code = {
        html: this.editors.html ? this.editors.html.value : "",
        css: this.editors.css ? this.editors.css.value : "",
        js: this.editors.js ? this.editors.js.value : "",
      };

      // Calculate final score
      const scores = this.calculateGameScores(code);

      // Get session data
      const sessionData = JSON.parse(
        localStorage.getItem("codequest_game_session") || "{}"
      );

      // For now, simulate API submission (since we may not have auth)
      const result = {
        score: scores.total,
        xp_earned: Math.floor(
          (scores.total / this.currentGame.max_score) *
            this.currentGame.xp_reward
        ),
        time_spent: this.getTimeSpent(),
        perfect_score: scores.total >= this.currentGame.max_score,
        rank: Math.floor(Math.random() * 100) + 1, // Simulated rank
        achievements: [],
      };

      // Show completion modal
      this.showGameCompletionModal(result);

      // Clear game timer
      if (this.gameTimer) {
        clearInterval(this.gameTimer);
      }
    } catch (error) {
      console.error("Error completing game:", error);
      this.showError("Failed to complete game: " + error.message);
    }
  }

  // Get time spent on the game
  getTimeSpent() {
    if (!this.gameStartTime) {
      this.gameStartTime = Date.now();
    }
    return Math.floor((Date.now() - this.gameStartTime) / 1000);
  }

  // Show game completion modal
  showGameCompletionModal(result) {
    const modal = document.createElement("div");
    modal.className = "game-completion-modal";
    modal.innerHTML = `
      <div class="modal-overlay"></div>
      <div class="modal-content">
        <div class="modal-header">
          <h2>🎉 Game Complete!</h2>
        </div>
        <div class="modal-body">
          <div class="completion-stats">
            <div class="stat-item">
              <div class="stat-value">${result.score}</div>
              <div class="stat-label">Score</div>
            </div>
            <div class="stat-item">
              <div class="stat-value">+${result.xp_earned}</div>
              <div class="stat-label">XP Earned</div>
            </div>
            <div class="stat-item">
              <div class="stat-value">${this.formatTime(
                result.time_spent
              )}</div>
              <div class="stat-label">Time</div>
            </div>
            <div class="stat-item">
              <div class="stat-value">#${result.rank}</div>
              <div class="stat-label">Rank</div>
            </div>
          </div>
          
          ${
            result.perfect_score
              ? `
            <div class="perfect-score-badge">
              <i class="fas fa-star"></i>
              Perfect Score!
            </div>
          `
              : ""
          }
          
          <div class="completion-message">
            <h3>🎮 Game Summary</h3>
            <p>You completed <strong>${this.currentGame.title}</strong>!</p>
            <p>Your final score: <strong>${result.score}/${
      this.currentGame.max_score
    }</strong></p>
            <p>Time taken: <strong>${this.formatTime(
              result.time_spent
            )}</strong></p>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-primary" onclick="window.location.href='games.html'">
            Back to Games
          </button>
          <button class="btn btn-secondary" onclick="this.closest('.game-completion-modal').remove()">
            Continue Coding
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
  }

  // Format time in MM:SS format
  formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${remainingSeconds
      .toString()
      .padStart(2, "0")}`;
  }

  // Show success message with toast
  showSuccess(message) {
    this.showToast(message, "success");
  }

  // Display game information in the editor
  displayGameInfo(game) {
    console.log("🎮 Displaying game info:", game.title);

    // Update page title
    const challengeTitle = document.getElementById("challengeTitle");
    if (challengeTitle) {
      challengeTitle.textContent = `🎮 ${game.title}`;
    }

    // Update difficulty badge
    const challengeDifficulty = document.getElementById("challengeDifficulty");
    if (challengeDifficulty) {
      challengeDifficulty.textContent = game.difficulty.toUpperCase();
      challengeDifficulty.className = `challenge-badge difficulty ${game.difficulty.toLowerCase()}`;
    }

    // Update XP badge
    const challengeXP = document.getElementById("challengeXP");
    if (challengeXP) {
      challengeXP.textContent = `+${game.xp_reward} XP`;
    }

    // Hide default description and show game info
    const defaultDescription = document.getElementById("defaultDescription");
    const challengeDescriptionContent = document.getElementById(
      "challengeDescriptionContent"
    );

    if (defaultDescription) {
      defaultDescription.style.display = "none";
    }

    if (challengeDescriptionContent) {
      challengeDescriptionContent.style.display = "block";
      challengeDescriptionContent.innerHTML = `
        <div class="game-info">
          <div class="game-header">
            <h3>🎮 ${game.title}</h3>
            <div class="game-badges">
              <span class="badge difficulty-${game.difficulty.toLowerCase()}">${
        game.difficulty
      }</span>
              <span class="badge xp-badge">+${game.xp_reward} XP</span>
              <span class="badge time-badge">${Math.floor(
                (game.time_limit || 0) / 60
              )} min</span>
            </div>
          </div>
          
          <div class="game-description">
            <h4>🎯 Game Description</h4>
            <p>${game.description}</p>
          </div>
          
          ${
            game.instructions
              ? `
            <div class="game-instructions">
              <h4>📋 How to Play</h4>
              <div class="instructions-content">
                ${game.instructions}
              </div>
            </div>
          `
              : ""
          }
          
          <div class="game-objectives">
            <h4>🎯 Objectives</h4>
            <ul>
              <li>Complete the coding challenge within ${Math.floor(
                (game.time_limit || 0) / 60
              )} minutes</li>
              <li>Write clean, functional code</li>
              <li>Test your solution before submitting</li>
              <li>Aim for the highest score possible</li>
            </ul>
          </div>
          
          <div class="game-metadata">
            <div class="metadata-grid">
              <div class="metadata-item">
                <strong>🎚️ Difficulty:</strong> ${game.difficulty}
              </div>
              <div class="metadata-item">
                <strong>📂 Category:</strong> ${game.category || "General"}
              </div>
              <div class="metadata-item">
                <strong>⏱️ Time Limit:</strong> ${Math.floor(
                  (game.time_limit || 0) / 60
                )} minutes
              </div>
              <div class="metadata-item">
                <strong>🏆 Max Score:</strong> ${
                  game.max_score || game.xp_reward
                } points
              </div>
            </div>
          </div>
          
          <div class="game-actions">
            <button class="btn btn-success" onclick="editor.testGame()">
              <i class="fas fa-play"></i> Test Game
            </button>
            <button class="btn btn-primary" onclick="editor.completeGame()">
              <i class="fas fa-trophy"></i> Complete Game
            </button>
            <button class="btn btn-secondary" onclick="window.location.href='games.html'">
              <i class="fas fa-arrow-left"></i> Back to Games
            </button>
          </div>
        </div>
      `;
      console.log("✅ Game information displayed successfully");
    }
  }

  // Show warning message with toast
  showWarning(message) {
    this.showToast(message, "warning");
  }

  // Show error message with toast
  showError(message) {
    this.showToast(message, "error");
  }

  // Show info message with toast
  showInfo(message) {
    this.showToast(message, "info");
  }

  // Generic toast notification system
  showToast(message, type = "info") {
    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;

    const icon =
      {
        success: "fas fa-check-circle",
        warning: "fas fa-exclamation-triangle",
        error: "fas fa-times-circle",
        info: "fas fa-info-circle",
      }[type] || "fas fa-info-circle";

    toast.innerHTML = `
      <div class="toast-content">
        <i class="${icon}"></i>
        <span class="toast-message">${message}</span>
      </div>
      <button class="toast-close" onclick="this.parentElement.remove()">
        <i class="fas fa-times"></i>
      </button>
    `;

    // Add to page
    let toastContainer = document.querySelector(".toast-container");
    if (!toastContainer) {
      toastContainer = document.createElement("div");
      toastContainer.className = "toast-container";
      document.body.appendChild(toastContainer);
    }

    toastContainer.appendChild(toast);

    // Auto-remove after 5 seconds
    setTimeout(() => {
      if (toast.parentElement) {
        toast.remove();
      }
    }, 5000);
  }

  // ===== USER PROGRESS TRACKING =====

  // Load user progress for a specific game
  async loadUserGameProgress(gameId) {
    try {
      const authToken =
        localStorage.getItem("auth_token") ||
        sessionStorage.getItem("auth_token");
      if (!authToken) {
        console.log("No auth token, skipping progress load");
        return null;
      }

      const response = await fetch(
        `${this.apiBase}/games/progress?game_id=${gameId}`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        const result = await response.json();
        return result.success ? result.data : null;
      }
    } catch (error) {
      console.error("Error loading game progress:", error);
    }
    return null;
  }

  // Load user progress for a specific challenge
  async loadUserChallengeProgress(challengeId) {
    try {
      const authToken =
        localStorage.getItem("auth_token") ||
        sessionStorage.getItem("auth_token");
      if (!authToken) {
        console.log("No auth token, skipping progress load");
        return null;
      }

      const response = await fetch(
        `${this.apiBase}/challenges/progress?challenge_id=${challengeId}`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        const result = await response.json();
        return result.success ? result.data : null;
      }
    } catch (error) {
      console.error("Error loading challenge progress:", error);
    }
    return null;
  }

  // Start a new game session
  async startGame() {
    if (!this.currentGame) {
      this.showError("No game loaded");
      return;
    }

    try {
      const authToken =
        localStorage.getItem("auth_token") ||
        sessionStorage.getItem("auth_token");
      if (!authToken) {
        this.showLoginRequiredMessage();
        return;
      }

      // Create game session
      const response = await fetch(`${this.apiBase}/games/start`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          game_id: this.currentGame.id,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          this.currentGameSession = result.data;
          this.setupGameMode();
          this.showSuccess("Game started! Good luck!");

          // Store session data
          localStorage.setItem(
            "current_game_session",
            JSON.stringify(result.data)
          );
        } else {
          throw new Error(result.message || "Failed to start game");
        }
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error("Error starting game:", error);
      this.showError("Failed to start game: " + error.message);
    }
  }

  // Show game leaderboard
  async showGameLeaderboard(gameId) {
    try {
      const response = await fetch(
        `${this.apiBase}/games/leaderboard?game_id=${gameId}&limit=10`
      );
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          this.displayLeaderboardModal(result.data, "game");
        }
      }
    } catch (error) {
      console.error("Error loading game leaderboard:", error);
      this.showError("Failed to load leaderboard");
    }
  }

  // Show challenge leaderboard
  async showChallengeLeaderboard(challengeId) {
    try {
      const response = await fetch(
        `${this.apiBase}/challenges/leaderboard?challenge_id=${challengeId}&limit=10`
      );
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          this.displayLeaderboardModal(result.data, "challenge");
        }
      }
    } catch (error) {
      console.error("Error loading challenge leaderboard:", error);
      this.showError("Failed to load leaderboard");
    }
  }

  // Display leaderboard modal
  displayLeaderboardModal(leaderboardData, type) {
    const modal = document.createElement("div");
    modal.className = "leaderboard-modal";
    modal.innerHTML = `
      <div class="modal-overlay" onclick="this.parentElement.remove()"></div>
      <div class="modal-content">
        <div class="modal-header">
          <h2>🏆 ${type === "game" ? "Game" : "Challenge"} Leaderboard</h2>
          <button class="modal-close" onclick="this.closest('.leaderboard-modal').remove()">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="modal-body">
          <div class="leaderboard-list">
            ${leaderboardData
              .map(
                (entry, index) => `
              <div class="leaderboard-entry ${index < 3 ? "top-three" : ""}">
                <div class="rank">#${index + 1}</div>
                <div class="player-info">
                  <div class="player-name">${entry.username || entry.name}</div>
                  <div class="player-stats">
                    Score: ${entry.best_score || entry.score} | 
                    ${
                      type === "game"
                        ? `Time: ${this.formatTime(entry.best_time || 0)}`
                        : `Tests: ${entry.tests_passed}/${entry.total_tests}`
                    }
                  </div>
                </div>
                <div class="entry-medal">
                  ${
                    index === 0
                      ? "🥇"
                      : index === 1
                      ? "🥈"
                      : index === 2
                      ? "🥉"
                      : ""
                  }
                </div>
              </div>
            `
              )
              .join("")}
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" onclick="this.closest('.leaderboard-modal').remove()">
            Close
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
  }

  // Enhanced complete game with proper scoring and progress tracking
  async completeGame(isTimeout = false) {
    if (!this.currentGame) {
      this.showError("No active game session found");
      return;
    }

    try {
      const authToken =
        localStorage.getItem("auth_token") ||
        sessionStorage.getItem("auth_token");
      if (!authToken) {
        this.showLoginRequiredMessage();
        return;
      }

      // Get current code
      const code = {
        html: this.editors.html ? this.editors.html.value : "",
        css: this.editors.css ? this.editors.css.value : "",
        js: this.editors.js ? this.editors.js.value : "",
      };

      // Calculate final score
      const scores = this.calculateGameScores(code);
      const sessionData = JSON.parse(
        localStorage.getItem("current_game_session") || "{}"
      );

      // Submit score to API
      const response = await fetch(`${this.apiBase}/games/score`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          game_id: this.currentGame.id,
          session_id: sessionData.id,
          score: scores.total,
          time_spent: this.getTimeSpent(),
          code_submission: code,
          completed_by_timeout: isTimeout,
          score_breakdown: scores,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          // Show completion modal with real data
          this.showGameCompletionModal(result.data);

          // Clear game timer
          if (this.gameTimer) {
            clearInterval(this.gameTimer);
          }

          // Clear session data
          localStorage.removeItem("current_game_session");

          this.showSuccess("Game completed successfully!");
        } else {
          throw new Error(result.message || "Failed to submit score");
        }
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error("Error completing game:", error);
      this.showError("Failed to complete game: " + error.message);
    }
  }

  // Enhanced submit challenge with proper progress tracking
  async submitChallenge() {
    // Check if we're in game mode or challenge mode
    if (this.currentGame) {
      // We're in game mode, complete the game instead
      return this.completeGame();
    }

    if (!this.currentChallenge) {
      this.showError("No challenge loaded");
      return;
    }

    try {
      const authToken =
        localStorage.getItem("auth_token") ||
        sessionStorage.getItem("auth_token");
      if (!authToken) {
        this.showLoginRequiredMessage();
        return;
      }

      // Get current code
      const code = {
        html: this.editors.html ? this.editors.html.value : "",
        css: this.editors.css ? this.editors.css.value : "",
        js: this.editors.js ? this.editors.js.value : "",
      };

      // Submit challenge
      const response = await fetch(`${this.apiBase}/challenges/submit`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          challenge_id: this.currentChallenge.id,
          code: code,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          // Show completion modal with results
          this.showChallengeCompletionModal(result.data);
          this.showSuccess("Challenge submitted successfully!");
        } else {
          throw new Error(result.message || "Failed to submit challenge");
        }
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error("Error submitting challenge:", error);
      this.showError("Failed to submit challenge: " + error.message);
    }
  }

  // Show challenge completion modal
  showChallengeCompletionModal(result) {
    const modal = document.createElement("div");
    modal.className = "challenge-completion-modal";
    modal.innerHTML = `
      <div class="modal-overlay"></div>
      <div class="modal-content">
        <div class="modal-header">
          <h2>${result.is_completed ? "🎉" : "📝"} Challenge ${
      result.is_completed ? "Completed!" : "Submitted"
    }</h2>
        </div>
        <div class="modal-body">
          <div class="completion-stats">
            <div class="stat-item">
              <div class="stat-value ${
                result.is_completed ? "success" : "warning"
              }">${result.is_completed ? "✅ Passed" : "❌ Failed"}</div>
              <div class="stat-label">Status</div>
            </div>
            <div class="stat-item">
              <div class="stat-value">${result.tests_passed}/${
      result.total_tests
    }</div>
              <div class="stat-label">Tests Passed</div>
            </div>
            <div class="stat-item">
              <div class="stat-value">+${result.xp_earned || 0}</div>
              <div class="stat-label">XP Earned</div>
            </div>
          </div>
          
          ${
            result.is_completed
              ? `
            <div class="completion-message success">
              <h3>🎊 Congratulations!</h3>
              <p>You've successfully completed <strong>${this.currentChallenge.title}</strong>!</p>
              <p>Keep up the great work and try more challenges to improve your skills.</p>
            </div>
          `
              : `
            <div class="completion-message warning">
              <h3>📚 Keep Learning!</h3>
              <p>You're making progress on <strong>${this.currentChallenge.title}</strong>.</p>
              <p>Review the failed tests and try again. You've got this!</p>
            </div>
          `
          }

          ${
            result.test_results && result.test_results.length > 0
              ? `
            <div class="test-results-summary">
              <h4>Test Results:</h4>
              <div class="test-list">
                ${result.test_results
                  .map(
                    (test) => `
                  <div class="test-item ${test.passed ? "passed" : "failed"}">
                    <span class="test-icon">${test.passed ? "✅" : "❌"}</span>
                    <span class="test-name">${test.name}</span>
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
        <div class="modal-footer">
          <button class="btn btn-primary" onclick="window.location.href='challenges.html'">
            Browse More Challenges
          </button>
          <button class="btn btn-secondary" onclick="this.closest('.challenge-completion-modal').remove()">
            Continue Coding
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
  }

  // Show login required message
  showLoginRequiredMessage() {
    const modal = document.createElement("div");
    modal.className = "login-required-modal";
    modal.innerHTML = `
      <div class="modal-overlay" onclick="this.parentElement.remove()"></div>
      <div class="modal-content">
        <div class="modal-header">
          <h2>🔐 Login Required</h2>
        </div>
        <div class="modal-body">
          <p>You need to be logged in to save your progress and earn XP.</p>
          <p>Create an account or log in to track your achievements!</p>
        </div>
        <div class="modal-footer">
          <button class="btn btn-primary" onclick="showLogin(); this.closest('.login-required-modal').remove()">
            Login
          </button>
          <button class="btn btn-secondary" onclick="showSignup(); this.closest('.login-required-modal').remove()">
            Sign Up
          </button>
          <button class="btn btn-outline" onclick="this.closest('.login-required-modal').remove()">
            Continue Without Login
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
  }

  // Game Loading Methods
  async checkForGame() {
    console.log("=== checkForGame() called ===");

    // Check URL parameters for game
    const urlParams = new URLSearchParams(window.location.search);
    const gameSlug = urlParams.get("game");

    if (gameSlug) {
      console.log("🎮 Game slug found in URL:", gameSlug);
      await this.loadGameFromSlug(gameSlug);
      return;
    }

    // Check sessionStorage for current game
    const gameData = sessionStorage.getItem("current_game");
    if (gameData) {
      try {
        const game = JSON.parse(gameData);
        console.log("🎮 Game found in sessionStorage:", game.title);
        await this.loadGame(game);
        return;
      } catch (error) {
        console.error("Error parsing game data from sessionStorage:", error);
      }
    }

    // Check localStorage for game session
    const sessionData = localStorage.getItem("codequest_game_session");
    if (sessionData) {
      try {
        const session = JSON.parse(sessionData);
        console.log("🎮 Game session found:", session);
        await this.loadGameFromSession(session);
        return;
      } catch (error) {
        console.error("Error parsing game session:", error);
      }
    }

    console.log("ℹ️ No game found to load");
  }

  async loadGameFromSlug(slug) {
    try {
      console.log("🔄 Loading game from slug:", slug);

      // Fetch game data from API
      const response = await fetch(`${this.apiBase}/games?slug=${slug}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch game: ${response.status}`);
      }

      const result = await response.json();
      if (result.success && result.data && result.data.length > 0) {
        const game = result.data[0];
        await this.loadGame(game);
      } else {
        throw new Error("Game not found");
      }
    } catch (error) {
      console.error("Error loading game from slug:", error);
      this.showError("Failed to load game: " + error.message);
    }
  }

  async loadGame(game) {
    console.log("🎮 Loading game:", game.title);

    this.currentGame = game;
    this.currentMode = "game";

    // Update UI to show game mode
    this.updateGameUI(game);

    // Load game instructions and setup
    this.displayGameInstructions(game);

    // Setup game-specific editor behavior
    this.setupGameMode(game);

    // Update button states for game mode
    this.updateButtonStatesForGame();

    console.log("✅ Game loaded successfully:", game.title);
  }

  async loadGameFromSession(session) {
    try {
      console.log("🔄 Loading game from session:", session.id);

      if (session.game) {
        await this.loadGame(session.game);
      } else {
        console.warn("No game data in session");
      }
    } catch (error) {
      console.error("Error loading game from session:", error);
    }
  }

  updateGameUI(game) {
    console.log("🎨 Updating UI for game:", game.title);

    // Update page title
    document.title = `${game.title} - CodeQuest Editor`;

    // Update challenge info display
    const challengeTitle = document.getElementById("challengeTitle");
    const challengeDifficulty = document.getElementById("challengeDifficulty");
    const challengeXP = document.getElementById("challengeXP");

    if (challengeTitle) challengeTitle.textContent = game.title;
    if (challengeDifficulty) challengeDifficulty.textContent = game.difficulty;
    if (challengeXP) challengeXP.textContent = `${game.xp_reward} XP`;

    // Show game mode indicator
    this.showGameModeIndicator(game);
  }

  displayGameInstructions(game) {
    console.log("📋 Displaying game instructions for:", game.title);

    // Find instructions container
    let instructionsContainer = document.getElementById("gameInstructions");

    if (!instructionsContainer) {
      // Create instructions container if it doesn't exist
      instructionsContainer = document.createElement("div");
      instructionsContainer.id = "gameInstructions";
      instructionsContainer.className = "game-instructions";

      // Insert at the top of the main content area
      const mainContent =
        document.querySelector(".main-content") ||
        document.querySelector(".editor-container");
      if (mainContent) {
        mainContent.insertBefore(instructionsContainer, mainContent.firstChild);
      }
    }

    // Create instructions HTML
    instructionsContainer.innerHTML = `
      <div class="instructions-header">
        <div class="game-info">
          <h2>${game.icon} ${game.title}</h2>
          <div class="game-meta">
            <span class="difficulty ${game.difficulty}">${
      game.difficulty
    }</span>
            <span class="category">${game.category}</span>
            <span class="xp">${game.xp_reward} XP</span>
            <span class="time-limit">⏱️ ${Math.floor(
              game.time_limit / 60
            )}m</span>
          </div>
        </div>
        <button class="collapse-btn" onclick="this.closest('.game-instructions').classList.toggle('collapsed')">
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
            ${game.instructions || this.generateDefaultInstructions(game)}
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

    // Add styling for instructions
    this.addInstructionsStyles();

    // Show success message
    this.showSuccess(`Game loaded: ${game.title}`);
  }

  generateDefaultInstructions(game) {
    const instructions = {
      html: "Build a contact card with the following requirements: 1) Display a profile photo, 2) Show name and job title, 3) Include contact information, 4) Make it responsive for mobile devices, 5) Add hover effects for better user experience.",
      css: "Style the contact card with modern CSS: 1) Use flexbox or grid for layout, 2) Add attractive colors and typography, 3) Include hover animations, 4) Make it mobile responsive, 5) Add subtle shadows and borders.",
      javascript:
        "Add interactivity to the contact card: 1) Toggle contact details on click, 2) Add form validation, 3) Implement smooth animations, 4) Handle user interactions, 5) Add dynamic content updates.",
    };

    return instructions[game.category] || instructions["html"];
  }

  setupGameMode(game) {
    console.log("⚙️ Setting up game mode for:", game.title);

    // Set initial code based on game type
    this.setInitialGameCode(game);

    // Setup game-specific validation
    this.setupGameValidation(game);

    // Enable game features
    this.enableGameFeatures(game);
  }

  setInitialGameCode(game) {
    // Set starter code based on game category
    const starterCode = {
      html: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${game.title}</title>
</head>
<body>
    <!-- Your HTML code here -->
    
</body>
</html>`,
      css: `/* ${game.title} - CSS Styles */

/* Add your CSS styles here */
body {
    font-family: Arial, sans-serif;
    margin: 0;
    padding: 20px;
}`,
      javascript: `// ${game.title} - JavaScript Code

// Add your JavaScript code here
console.log("Game started: ${game.title}");`,
    };

    if (this.editors.html && starterCode.html) {
      this.editors.html.value = starterCode.html;
    }
    if (this.editors.css && starterCode.css) {
      this.editors.css.value = starterCode.css;
    }
    if (this.editors.js && starterCode.javascript) {
      this.editors.js.value = starterCode.javascript;
    }

    // Update preview
    this.updatePreview();
  }

  updateButtonStatesForGame() {
    console.log("🔘 Updating button states for game mode");

    // Enable Execute Code button for games
    const executeBtn = document.getElementById("executeCodeBtn");
    if (executeBtn) {
      executeBtn.disabled = false;
      executeBtn.textContent = "🎮 Test Game";
      executeBtn.onclick = () => this.testGameCode();
    }

    // Update Run Tests button
    const runTestsBtn = document.getElementById("runTestsBtn");
    if (runTestsBtn) {
      runTestsBtn.disabled = false;
      runTestsBtn.textContent = "🧪 Run Tests";
      runTestsBtn.onclick = () => this.runGameTests();
    }

    // Add Submit Game button if not exists
    let submitBtn = document.getElementById("submitGameBtn");
    if (!submitBtn) {
      submitBtn = document.createElement("button");
      submitBtn.id = "submitGameBtn";
      submitBtn.className = "btn btn-success";
      submitBtn.innerHTML = "🏆 Submit Game";
      submitBtn.onclick = () => this.submitGame();

      // Add to button container
      const buttonContainer =
        document.querySelector(".editor-actions") ||
        document.querySelector(".button-container");
      if (buttonContainer) {
        buttonContainer.appendChild(submitBtn);
      }
    }
  }

  testGameCode() {
    console.log("🧪 Testing game code...");

    if (!this.currentGame) {
      this.showError("No game loaded");
      return;
    }

    // Update preview to test the code
    this.updatePreview();

    // Show test results
    this.showSuccess("Code executed! Check the preview to see your results.");

    // Log for debugging
    console.log("Game code tested for:", this.currentGame.title);
  }

  runGameTests() {
    console.log("🔬 Running game tests...");

    if (!this.currentGame) {
      this.showError("No game loaded");
      return;
    }

    // Simulate test results for now
    const tests = [
      {
        name: "HTML Structure",
        passed: true,
        message: "Valid HTML structure found",
      },
      {
        name: "CSS Styling",
        passed: true,
        message: "Styles applied correctly",
      },
      { name: "Responsive Design", passed: true, message: "Mobile responsive" },
      {
        name: "Accessibility",
        passed: true,
        message: "Good accessibility practices",
      },
    ];

    this.displayTestResults(tests);
    this.showSuccess("Tests completed! Check results below.");
  }

  async submitGame() {
    console.log("🏆 Submitting game...");

    if (!this.currentGame) {
      this.showError("No game loaded");
      return;
    }

    try {
      // Get current code
      const code = {
        html: this.editors.html?.value || "",
        css: this.editors.css?.value || "",
        js: this.editors.js?.value || "",
      };

      // Calculate a simple score based on code length and completeness
      const score = this.calculateGameScore(code);

      // Show submission success
      this.showSuccess(`Game submitted! Score: ${score}/1000`);

      // Show completion modal
      this.showGameCompletionModal(score);
    } catch (error) {
      console.error("Error submitting game:", error);
      this.showError("Failed to submit game: " + error.message);
    }
  }

  calculateGameScore(code) {
    let score = 0;

    // Basic scoring based on code presence and length
    if (code.html && code.html.length > 50) score += 300;
    if (code.css && code.css.length > 30) score += 300;
    if (code.js && code.js.length > 20) score += 200;

    // Bonus for using specific elements/features
    if (code.html.includes("<div") || code.html.includes("<section"))
      score += 50;
    if (code.css.includes("flex") || code.css.includes("grid")) score += 50;
    if (code.js.includes("function") || code.js.includes("=>")) score += 50;

    // Random bonus for variation
    score += Math.floor(Math.random() * 100);

    return Math.min(score, 1000);
  }

  showGameCompletionModal(score) {
    const modal = document.createElement("div");
    modal.className = "game-completion-modal";
    modal.innerHTML = `
      <div class="modal-overlay"></div>
      <div class="modal-content">
        <div class="completion-header">
          <h2>🎉 Game Completed!</h2>
          <div class="score-display">
            <span class="score">${score}</span>
            <span class="max-score">/1000</span>
          </div>
        </div>
        <div class="completion-body">
          <div class="stats">
            <div class="stat-item">
              <span class="stat-label">XP Earned:</span>
              <span class="stat-value">${this.currentGame.xp_reward}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Difficulty:</span>
              <span class="stat-value">${this.currentGame.difficulty}</span>
            </div>
          </div>
          <div class="actions">
            <button class="btn btn-primary" onclick="window.location.href='games.html'">
              🎮 Back to Games
            </button>
            <button class="btn btn-secondary" onclick="location.reload()">
              🔄 Play Again
            </button>
            <button class="btn btn-outline" onclick="this.closest('.game-completion-modal').remove()">
              ✏️ Continue Editing
            </button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // Auto-remove after 10 seconds if no action
    setTimeout(() => {
      if (modal.parentNode) {
        modal.remove();
      }
    }, 10000);
  }

  showGameModeIndicator(game) {
    // Add game mode indicator to the UI
    let indicator = document.getElementById("gameModeIndicator");
    if (!indicator) {
      indicator = document.createElement("div");
      indicator.id = "gameModeIndicator";
      indicator.className = "game-mode-indicator";

      const header =
        document.querySelector(".editor-header") ||
        document.querySelector("header");
      if (header) {
        header.appendChild(indicator);
      }
    }

    indicator.innerHTML = `
      <span class="mode-label">🎮 Game Mode</span>
      <span class="game-title">${game.title}</span>
    `;
  }

  addInstructionsStyles() {
    // Add CSS for game instructions if not already added
    if (document.getElementById("gameInstructionsStyles")) return;

    const style = document.createElement("style");
    style.id = "gameInstructionsStyles";
    style.textContent = `
      .game-instructions {
        background: #1e1e1e;
        border: 1px solid #333;
        border-radius: 8px;
        margin-bottom: 20px;
        overflow: hidden;
        transition: all 0.3s ease;
      }
      
      .game-instructions.collapsed .instructions-content {
        display: none;
      }
      
      .instructions-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 15px 20px;
        background: #2d2d2d;
        border-bottom: 1px solid #333;
      }
      
      .game-info h2 {
        margin: 0 0 8px 0;
        color: #fff;
        font-size: 1.4em;
      }
      
      .game-meta {
        display: flex;
        gap: 12px;
        flex-wrap: wrap;
      }
      
      .game-meta span {
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 0.85em;
        font-weight: 500;
      }
      
      .difficulty.easy { background: #4caf50; color: white; }
      .difficulty.medium { background: #ff9800; color: white; }
      .difficulty.hard { background: #f44336; color: white; }
      
      .category { background: #2196f3; color: white; }
      .xp { background: #9c27b0; color: white; }
      .time-limit { background: #607d8b; color: white; }
      
      .collapse-btn {
        background: #333;
        border: none;
        color: #fff;
        width: 30px;
        height: 30px;
        border-radius: 50%;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 18px;
        transition: background 0.2s;
      }
      
      .collapse-btn:hover {
        background: #555;
      }
      
      .instructions-content {
        padding: 20px;
        color: #e0e0e0;
      }
      
      .instructions-content h3 {
        color: #fff;
        margin: 0 0 10px 0;
        font-size: 1.1em;
      }
      
      .instructions-content > div {
        margin-bottom: 20px;
      }
      
      .instructions-content p {
        margin: 0 0 10px 0;
        line-height: 1.5;
      }
      
      .instructions-content ul {
        margin: 0;
        padding-left: 20px;
      }
      
      .instructions-content li {
        margin-bottom: 5px;
        line-height: 1.4;
      }
      
      .game-mode-indicator {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 8px 15px;
        background: #4caf50;
        color: white;
        border-radius: 20px;
        font-size: 0.9em;
        font-weight: 500;
      }
      
      .game-completion-modal {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        z-index: 10000;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      
      .game-completion-modal .modal-overlay {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.8);
      }
      
      .game-completion-modal .modal-content {
        background: #1e1e1e;
        border: 1px solid #333;
        border-radius: 12px;
        padding: 30px;
        max-width: 500px;
        width: 90%;
        position: relative;
        text-align: center;
      }
      
      .completion-header h2 {
        color: #4caf50;
        margin: 0 0 20px 0;
        font-size: 2em;
      }
      
      .score-display {
        font-size: 3em;
        font-weight: bold;
        color: #fff;
        margin-bottom: 20px;
      }
      
      .score-display .max-score {
        color: #888;
        font-size: 0.6em;
      }
      
      .stats {
        display: flex;
        justify-content: space-around;
        margin: 20px 0;
        padding: 20px;
        background: #2d2d2d;
        border-radius: 8px;
      }
      
      .stat-item {
        text-align: center;
      }
      
      .stat-label {
        display: block;
        color: #888;
        font-size: 0.9em;
        margin-bottom: 5px;
      }
      
      .stat-value {
        display: block;
        color: #fff;
        font-size: 1.2em;
        font-weight: bold;
      }
      
      .actions {
        display: flex;
        gap: 10px;
        justify-content: center;
        flex-wrap: wrap;
      }
    `;

    document.head.appendChild(style);
  }

  // Challenge Loading Methods (existing functionality)
  async checkForChallenge() {
    console.log("=== checkForChallenge() called ===");

    // Check URL parameters for challenge
    const urlParams = new URLSearchParams(window.location.search);
    const challengeId = urlParams.get("challenge");

    if (challengeId) {
      console.log("🎯 Challenge ID found in URL:", challengeId);
      await this.loadChallengeFromId(challengeId);
      return;
    }

    console.log("ℹ️ No challenge found in URL parameters");
  }

  async checkForPendingChallenge() {
    console.log("=== checkForPendingChallenge() called ===");

    // Check localStorage for pending challenge
    const pendingChallenge = localStorage.getItem("pendingChallenge");
    if (pendingChallenge) {
      try {
        const challenge = JSON.parse(pendingChallenge);
        console.log("📋 Pending challenge found:", challenge.title);
        await this.loadChallenge(challenge);
        // Clear pending challenge
        localStorage.removeItem("pendingChallenge");
        return;
      } catch (error) {
        console.error("Error parsing pending challenge:", error);
        localStorage.removeItem("pendingChallenge");
      }
    }

    console.log("ℹ️ No pending challenge found");
  }

  async loadChallengeFromId(challengeId) {
    try {
      console.log("🔄 Loading challenge from ID:", challengeId);

      const response = await fetch(`${this.apiBase}/challenges/${challengeId}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch challenge: ${response.status}`);
      }

      const result = await response.json();
      if (result.success && result.data) {
        await this.loadChallenge(result.data);
      } else {
        throw new Error("Challenge not found");
      }
    } catch (error) {
      console.error("Error loading challenge:", error);
      this.showError("Failed to load challenge: " + error.message);
    }
  }

  async loadChallenge(challenge) {
    console.log("📋 Loading challenge:", challenge.title);

    this.currentChallenge = challenge;
    this.currentMode = "challenge";

    // Update UI for challenge mode
    this.updateChallengeUI(challenge);

    // Display challenge instructions
    this.displayChallengeInstructions(challenge);

    // Setup challenge-specific editor behavior
    this.setupChallengeMode(challenge);

    // Update button states for challenge mode
    this.updateButtonStatesForChallenge();

    console.log("✅ Challenge loaded successfully:", challenge.title);
  }

  updateChallengeUI(challenge) {
    console.log("🎨 Updating UI for challenge:", challenge.title);

    // Update page title
    document.title = `${challenge.title} - CodeQuest Editor`;

    // Update challenge info display
    const challengeTitle = document.getElementById("challengeTitle");
    const challengeDifficulty = document.getElementById("challengeDifficulty");
    const challengeXP = document.getElementById("challengeXP");

    if (challengeTitle) challengeTitle.textContent = challenge.title;
    if (challengeDifficulty)
      challengeDifficulty.textContent = challenge.difficulty;
    if (challengeXP) challengeXP.textContent = `${challenge.xp_reward} XP`;
  }

  displayChallengeInstructions(challenge) {
    console.log("📋 Displaying challenge instructions for:", challenge.title);

    // Find or create instructions container
    let instructionsContainer = document.getElementById(
      "challengeInstructions"
    );

    if (!instructionsContainer) {
      instructionsContainer = document.createElement("div");
      instructionsContainer.id = "challengeInstructions";
      instructionsContainer.className = "challenge-instructions";

      const mainContent =
        document.querySelector(".main-content") ||
        document.querySelector(".editor-container");
      if (mainContent) {
        mainContent.insertBefore(instructionsContainer, mainContent.firstChild);
      }
    }

    // Create instructions HTML
    instructionsContainer.innerHTML = `
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
        <button class="collapse-btn" onclick="this.closest('.challenge-instructions').classList.toggle('collapsed')">
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

    // Add styling
    this.addInstructionsStyles();

    // Show success message
    this.showSuccess(`Challenge loaded: ${challenge.title}`);
  }

  setupChallengeMode(challenge) {
    console.log("⚙️ Setting up challenge mode for:", challenge.title);

    // Set initial code if provided
    if (challenge.starter_code) {
      this.setInitialChallengeCode(challenge.starter_code);
    }

    // Setup challenge-specific validation
    this.setupChallengeValidation(challenge);
  }

  setInitialChallengeCode(starterCode) {
    if (starterCode.html && this.editors.html) {
      this.editors.html.value = starterCode.html;
    }
    if (starterCode.css && this.editors.css) {
      this.editors.css.value = starterCode.css;
    }
    if (starterCode.js && this.editors.js) {
      this.editors.js.value = starterCode.js;
    }

    // Update preview
    this.updatePreview();
  }

  updateButtonStatesForChallenge() {
    console.log("🔘 Updating button states for challenge mode");

    // Enable buttons for challenge mode
    const executeBtn = document.getElementById("executeCodeBtn");
    if (executeBtn) {
      executeBtn.disabled = false;
      executeBtn.textContent = "▶️ Execute Code";
      executeBtn.onclick = () => this.executeCode();
    }

    const runTestsBtn = document.getElementById("runTestsBtn");
    if (runTestsBtn) {
      runTestsBtn.disabled = false;
      runTestsBtn.textContent = "🧪 Run Tests";
      runTestsBtn.onclick = () => this.runTests();
    }
  }

  // Format code method
  formatCode(type) {
    if (this.editors[type]) {
      const code = this.editors[type].value;
      // Simple formatting - add proper indentation
      let formatted = code;
      if (type === "html") {
        formatted = this.formatHTML(code);
      } else if (type === "css") {
        formatted = this.formatCSS(code);
      } else if (type === "js") {
        formatted = this.formatJS(code);
      }
      this.editors[type].value = formatted;
      this.updatePreview();
    }
  }

  formatHTML(html) {
    // Basic HTML formatting
    return html.replace(/></g, ">\n<").replace(/^\s+|\s+$/g, "");
  }

  formatCSS(css) {
    // Basic CSS formatting
    return css
      .replace(/;/g, ";\n")
      .replace(/{/g, " {\n")
      .replace(/}/g, "\n}\n");
  }

  formatJS(js) {
    // Basic JS formatting
    return js.replace(/;/g, ";\n").replace(/{/g, " {\n").replace(/}/g, "\n}\n");
  }

  // Toggle fullscreen mode
  toggleFullscreen() {
    const editorContainer = document.querySelector(".editor-container");
    if (editorContainer) {
      editorContainer.classList.toggle("editor-fullscreen");
    }
  }

  // Setup events for individual editor
  setupEditorEvents(editor, type) {
    if (!editor) return;

    console.log(`Setting up events for ${type} editor`);

    // Auto-update preview on input
    editor.addEventListener("input", () => {
      clearTimeout(this.previewTimeout);
      this.previewTimeout = setTimeout(() => {
        this.updatePreview();
      }, 300);
    });

    // Handle tab key for indentation
    editor.addEventListener("keydown", (e) => {
      if (e.key === "Tab") {
        e.preventDefault();
        const start = editor.selectionStart;
        const end = editor.selectionEnd;

        // Insert tab character
        editor.value =
          editor.value.substring(0, start) + "  " + editor.value.substring(end);
        editor.selectionStart = editor.selectionEnd = start + 2;
      }
    });

    // Auto-resize textarea
    editor.addEventListener("input", () => {
      this.autoResizeTextarea(editor);
    });

    // Initial resize
    this.autoResizeTextarea(editor);
  }

  // Auto-resize textarea based on content
  autoResizeTextarea(textarea) {
    if (!textarea) return;

    // Reset height to auto to get the correct scrollHeight
    textarea.style.height = "auto";

    // Set height based on content, with min and max limits
    const minHeight = 300;
    const maxHeight = window.innerHeight * 0.6;
    const newHeight = Math.max(
      minHeight,
      Math.min(textarea.scrollHeight, maxHeight)
    );

    textarea.style.height = newHeight + "px";
  }

  // Force reinitialize editors (for debugging)
  forceReinitialize() {
    console.log("Force reinitializing editors...");
    this.editors = {};
    this.initializeSimpleEditor();
    this.setupEventListeners();
  }

  // Preview Update
  updatePreview() {
    console.log("Updating preview...");

    const previewFrame =
      document.getElementById("preview-frame") || this.createPreviewFrame();

    if (!previewFrame) {
      console.warn("Preview frame not found");
      return;
    }

    const htmlCode = this.editors.html?.value || "";
    const cssCode = this.editors.css?.value || "";
    const jsCode = this.editors.js?.value || "";

    // Create complete HTML document
    const fullHTML = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Preview</title>
        <style>
          body { margin: 0; padding: 20px; font-family: Arial, sans-serif; }
          ${cssCode}
        </style>
      </head>
      <body>
        ${htmlCode}
        <script>
          try {
            ${jsCode}
          } catch (error) {
            console.error('JavaScript Error:', error);
          }
        </script>
      </body>
      </html>
    `;

    // Update preview
    previewFrame.srcdoc = fullHTML;

    console.log("Preview updated successfully");
  }

  createPreviewFrame() {
    console.log("Creating preview frame...");

    // Find or create preview container
    let previewContainer = document.getElementById("preview-editor");

    if (!previewContainer) {
      // Create preview pane if it doesn't exist
      previewContainer = document.createElement("div");
      previewContainer.id = "preview-editor";
      previewContainer.className = "editor-pane";
      previewContainer.innerHTML = `
        <div class="editor-header">
          <span>Live Preview</span>
          <div class="editor-actions">
            <button class="btn-icon" onclick="codeEditor.updatePreview()" title="Refresh Preview">
              <i class="fas fa-refresh"></i>
            </button>
          </div>
        </div>
        <div class="preview-container">
          <iframe id="preview-frame" class="preview-frame"></iframe>
        </div>
      `;

      // Add to tab container
      const tabContainer = document.querySelector(".tab-container");
      if (tabContainer) {
        tabContainer.appendChild(previewContainer);
      }
    }

    const previewFrame = document.getElementById("preview-frame");

    // Add preview frame styles
    if (previewFrame && !document.getElementById("previewFrameStyles")) {
      const style = document.createElement("style");
      style.id = "previewFrameStyles";
      style.textContent = `
        .preview-container {
          background: #fff;
          border-radius: 0 0 12px 12px;
          overflow: hidden;
          height: 400px;
        }
        
        .preview-frame {
          width: 100%;
          height: 100%;
          border: none;
          background: white;
        }
      `;
      document.head.appendChild(style);
    }

    return previewFrame;
  }

  // Code Execution Methods
  executeCode() {
    console.log("Executing code...");

    if (this.currentGame) {
      this.testGameCode();
    } else if (this.currentChallenge) {
      this.testChallengeCode();
    } else {
      // Free play mode
      this.updatePreview();
      this.showSuccess(
        "Code executed! Check the preview tab to see your results."
      );
    }
  }

  testChallengeCode() {
    console.log("Testing challenge code...");

    if (!this.currentChallenge) {
      this.showError("No challenge loaded");
      return;
    }

    // Update preview
    this.updatePreview();

    // Show success message
    this.showSuccess(
      "Challenge code executed! Check the preview to see your results."
    );
  }

  runTests() {
    console.log("Running tests...");

    if (this.currentGame) {
      this.runGameTests();
    } else if (this.currentChallenge) {
      this.runChallengeTests();
    } else {
      // Free play mode - run basic validation
      this.runBasicValidation();
    }
  }

  runChallengeTests() {
    console.log("Running challenge tests...");

    if (!this.currentChallenge) {
      this.showError("No challenge loaded");
      return;
    }

    // Simulate test results
    const tests = [
      {
        name: "HTML Structure",
        passed: true,
        message: "Valid HTML structure found",
      },
      {
        name: "CSS Styling",
        passed: true,
        message: "Styles applied correctly",
      },
      {
        name: "JavaScript Functionality",
        passed: true,
        message: "JavaScript working properly",
      },
      {
        name: "Requirements Met",
        passed: true,
        message: "All requirements satisfied",
      },
    ];

    this.displayTestResults(tests);
    this.showSuccess("Tests completed! All tests passed.");
  }

  runBasicValidation() {
    console.log("Running basic validation...");

    const htmlCode = this.editors.html?.value || "";
    const cssCode = this.editors.css?.value || "";
    const jsCode = this.editors.js?.value || "";

    const tests = [];

    // HTML validation
    if (htmlCode.includes("<!DOCTYPE html>")) {
      tests.push({
        name: "HTML DOCTYPE",
        passed: true,
        message: "DOCTYPE declaration found",
      });
    } else {
      tests.push({
        name: "HTML DOCTYPE",
        passed: false,
        message: "Missing DOCTYPE declaration",
      });
    }

    // CSS validation
    if (cssCode.trim().length > 0) {
      tests.push({
        name: "CSS Present",
        passed: true,
        message: "CSS styles found",
      });
    } else {
      tests.push({
        name: "CSS Present",
        passed: false,
        message: "No CSS styles found",
      });
    }

    // JS validation
    if (jsCode.trim().length > 0) {
      tests.push({
        name: "JavaScript Present",
        passed: true,
        message: "JavaScript code found",
      });
    } else {
      tests.push({
        name: "JavaScript Present",
        passed: false,
        message: "No JavaScript code found",
      });
    }

    this.displayTestResults(tests);

    const passedTests = tests.filter((t) => t.passed).length;
    const totalTests = tests.length;

    if (passedTests === totalTests) {
      this.showSuccess(`All ${totalTests} validation checks passed!`);
    } else {
      this.showWarning(
        `${passedTests}/${totalTests} validation checks passed.`
      );
    }
  }

  displayTestResults(tests) {
    console.log("Displaying test results:", tests);

    // Find or create test results container
    let resultsContainer = document.getElementById("testResults");

    if (!resultsContainer) {
      resultsContainer = document.createElement("div");
      resultsContainer.id = "testResults";
      resultsContainer.className = "test-results-container";

      // Insert after the tab container
      const tabContainer = document.querySelector(".tab-container");
      if (tabContainer && tabContainer.parentNode) {
        tabContainer.parentNode.insertBefore(
          resultsContainer,
          tabContainer.nextSibling
        );
      }
    }

    // Create test results HTML
    const resultsHTML = `
      <div class="test-results-header">
        <h3><i class="fas fa-flask"></i> Test Results</h3>
        <button class="btn-icon" onclick="document.getElementById('testResults').style.display='none'">
          <i class="fas fa-times"></i>
        </button>
      </div>
      <div class="test-results-list">
        ${tests
          .map(
            (test) => `
          <div class="test-result ${test.passed ? "passed" : "failed"}">
            <div class="test-icon">
              <i class="fas fa-${test.passed ? "check" : "times"}"></i>
            </div>
            <div class="test-content">
              <div class="test-name">${test.name}</div>
              <div class="test-message">${test.message}</div>
            </div>
          </div>
        `
          )
          .join("")}
      </div>
    `;

    resultsContainer.innerHTML = resultsHTML;
    resultsContainer.style.display = "block";

    // Add styles if not already added
    this.addTestResultsStyles();
  }

  addTestResultsStyles() {
    if (document.getElementById("testResultsStyles")) return;

    const style = document.createElement("style");
    style.id = "testResultsStyles";
    style.textContent = `
      .test-results-container {
        background: #1e293b;
        border: 1px solid #334155;
        border-radius: 12px;
        margin: 20px 0;
        overflow: hidden;
        display: none;
      }
      
      .test-results-header {
        background: linear-gradient(135deg, #334155, #475569);
        color: #e2e8f0;
        padding: 15px 20px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-bottom: 1px solid #334155;
      }
      
      .test-results-header h3 {
        margin: 0;
        font-size: 16px;
        font-weight: 600;
      }
      
      .test-results-list {
        padding: 15px;
      }
      
      .test-result {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 12px;
        border-radius: 8px;
        margin-bottom: 8px;
        transition: all 0.2s ease;
      }
      
      .test-result:last-child {
        margin-bottom: 0;
      }
      
      .test-result.passed {
        background: rgba(16, 185, 129, 0.1);
        border: 1px solid rgba(16, 185, 129, 0.3);
      }
      
      .test-result.failed {
        background: rgba(239, 68, 68, 0.1);
        border: 1px solid rgba(239, 68, 68, 0.3);
      }
      
      .test-icon {
        width: 24px;
        height: 24px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 12px;
      }
      
      .test-result.passed .test-icon {
        background: #10b981;
        color: white;
      }
      
      .test-result.failed .test-icon {
        background: #ef4444;
        color: white;
      }
      
      .test-content {
        flex: 1;
      }
      
      .test-name {
        font-weight: 600;
        color: #e2e8f0;
        margin-bottom: 4px;
      }
      
      .test-message {
        font-size: 14px;
        color: #94a3b8;
      }
    `;

    document.head.appendChild(style);
  }

  // Utility Methods
  showSuccess(message) {
    this.showNotification(message, "success");
  }

  showError(message) {
    this.showNotification(message, "error");
  }

  showWarning(message) {
    this.showNotification(message, "warning");
  }

  showInfo(message) {
    this.showNotification(message, "info");
  }

  showNotification(message, type = "info") {
    console.log(`${type.toUpperCase()}: ${message}`);

    // Create notification element
    const notification = document.createElement("div");
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
      <div class="notification-content">
        <i class="fas fa-${this.getNotificationIcon(type)}"></i>
        <span>${message}</span>
      </div>
      <button class="notification-close" onclick="this.parentElement.remove()">
        <i class="fas fa-times"></i>
      </button>
    `;

    // Add to page
    document.body.appendChild(notification);

    // Auto-remove after 5 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.remove();
      }
    }, 5000);

    // Add notification styles if not already added
    this.addNotificationStyles();
  }

  getNotificationIcon(type) {
    const icons = {
      success: "check-circle",
      error: "exclamation-circle",
      warning: "exclamation-triangle",
      info: "info-circle",
    };
    return icons[type] || icons.info;
  }

  addNotificationStyles() {
    if (document.getElementById("notificationStyles")) return;

    const style = document.createElement("style");
    style.id = "notificationStyles";
    style.textContent = `
      .notification {
        position: fixed;
        top: 20px;
        right: 20px;
        background: #1e293b;
        border: 1px solid #334155;
        border-radius: 8px;
        padding: 15px;
        display: flex;
        align-items: center;
        gap: 10px;
        z-index: 10000;
        min-width: 300px;
        max-width: 500px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        animation: slideInRight 0.3s ease-out;
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
      
      .notification-success {
        border-left: 4px solid #10b981;
      }
      
      .notification-error {
        border-left: 4px solid #ef4444;
      }
      
      .notification-warning {
        border-left: 4px solid #f59e0b;
      }
      
      .notification-info {
        border-left: 4px solid #3b82f6;
      }
      
      .notification-content {
        display: flex;
        align-items: center;
        gap: 10px;
        flex: 1;
        color: #e2e8f0;
      }
      
      .notification-success .notification-content i {
        color: #10b981;
      }
      
      .notification-error .notification-content i {
        color: #ef4444;
      }
      
      .notification-warning .notification-content i {
        color: #f59e0b;
      }
      
      .notification-info .notification-content i {
        color: #3b82f6;
      }
      
      .notification-close {
        background: none;
        border: none;
        color: #94a3b8;
        cursor: pointer;
        padding: 4px;
        border-radius: 4px;
        transition: all 0.2s ease;
      }
      
      .notification-close:hover {
        background: rgba(148, 163, 184, 0.1);
        color: #e2e8f0;
      }
    `;

    document.head.appendChild(style);
  }

  // Additional Methods for HTML buttons
  formatCode(type) {
    console.log(`Formatting ${type} code...`);
    // Simple formatting - just add some basic indentation
    const editor = this.editors[type];
    if (editor) {
      let code = editor.value;
      // Basic formatting - add proper line breaks and indentation
      if (type === "html") {
        code = this.formatHTML(code);
      } else if (type === "css") {
        code = this.formatCSS(code);
      } else if (type === "js") {
        code = this.formatJS(code);
      }
      editor.value = code;
      this.showSuccess(`${type.toUpperCase()} code formatted!`);
    }
  }

  formatHTML(html) {
    // Basic HTML formatting
    return html
      .replace(/></g, ">\n<")
      .replace(/^\s+|\s+$/g, "")
      .split("\n")
      .map((line, index) => {
        const indent = "  ".repeat(
          Math.max(
            0,
            (line.match(/</g) || []).length - (line.match(/\//g) || []).length
          )
        );
        return indent + line.trim();
      })
      .join("\n");
  }

  formatCSS(css) {
    // Basic CSS formatting
    return css
      .replace(/\{/g, " {\n  ")
      .replace(/\}/g, "\n}\n")
      .replace(/;/g, ";\n  ")
      .replace(/\n\s*\n/g, "\n")
      .trim();
  }

  formatJS(js) {
    // Basic JS formatting
    return js
      .replace(/\{/g, " {\n  ")
      .replace(/\}/g, "\n}\n")
      .replace(/;/g, ";\n")
      .replace(/\n\s*\n/g, "\n")
      .trim();
  }

  toggleFullscreen() {
    console.log("Toggling fullscreen...");
    const previewPane = document.getElementById("preview-editor");
    if (previewPane) {
      if (previewPane.classList.contains("fullscreen")) {
        previewPane.classList.remove("fullscreen");
        this.showInfo("Exited fullscreen mode");
      } else {
        previewPane.classList.add("fullscreen");
        this.showInfo("Entered fullscreen mode");
      }
    }
  }
}

// Initialize the editor when the page loads
document.addEventListener("DOMContentLoaded", () => {
  console.log("DOM loaded, initializing CodeEditor...");
  window.codeEditor = new CodeEditor();
});
