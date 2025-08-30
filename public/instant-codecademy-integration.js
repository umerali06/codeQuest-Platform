/**
 * CLEAN LESSON SYSTEM - ONLY WORKING VERSION
 * Matches the second screenshot styling exactly
 */

console.log("🎓 Loading Clean Lesson System...");

// Check if we're in lesson mode - ONLY activate with explicit ?lesson= parameter
const urlParams = new URLSearchParams(window.location.search);
const lessonParam = urlParams.get("lesson");

if (lessonParam) {
  console.log("📚 Lesson mode active:", lessonParam);

  // Apply transformation when page loads
  document.addEventListener("DOMContentLoaded", function () {
    setTimeout(applyCleanLessonLayout, 500);
  });
} else {
  console.log("🖥️ Regular editor mode - lesson system disabled");
  // Completely disable lesson system for regular editor
  return;
}

// Toast notification system
function showToast(message, type = "info", duration = 4000) {
  // Remove existing toasts
  const existingToasts = document.querySelectorAll(".lesson-toast");
  existingToasts.forEach((toast) => toast.remove());

  const toast = document.createElement("div");
  toast.className = "lesson-toast";

  const colors = {
    success: { bg: "#10b981", border: "#059669" },
    error: { bg: "#ef4444", border: "#dc2626" },
    info: { bg: "#3b82f6", border: "#2563eb" },
    warning: { bg: "#f59e0b", border: "#d97706" },
  };

  const color = colors[type] || colors.info;

  toast.style.cssText = `
    position: fixed;
    top: 80px;
    right: 20px;
    background: ${color.bg};
    color: white;
    padding: 16px 24px;
    border-radius: 8px;
    border-left: 4px solid ${color.border};
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    z-index: 10000;
    font-family: 'Inter', sans-serif;
    font-weight: 500;
    max-width: 400px;
    animation: slideInRight 0.3s ease-out;
  `;

  toast.innerHTML = message;

  // Add animation styles
  const style = document.createElement("style");
  style.textContent = `
    @keyframes slideInRight {
      from { transform: translateX(100%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOutRight {
      from { transform: translateX(0); opacity: 1; }
      to { transform: translateX(100%); opacity: 0; }
    }
  `;
  if (!document.querySelector("#toast-styles")) {
    style.id = "toast-styles";
    document.head.appendChild(style);
  }

  document.body.appendChild(toast);

  // Auto remove after duration
  setTimeout(() => {
    toast.style.animation = "slideOutRight 0.3s ease-out";
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

function applyCleanLessonLayout() {
  console.log("🔄 Applying clean lesson layout...");

  // Apply lesson mode styling to body
  document.body.style.background = "#1a1d29";
  document.body.style.color = "#e2e8f0";
  document.body.style.margin = "0";
  document.body.style.padding = "0";
  document.body.style.height = "100vh";
  document.body.style.overflow = "hidden";

  // Hide navigation for lesson mode
  const navbar = document.getElementById("navbar");
  if (navbar) navbar.style.display = "none";

  // Create lesson header with navigation
  const lessonHeader = document.createElement("div");
  lessonHeader.innerHTML = `
    <div style="display: flex; align-items: center; justify-content: space-between; width: 100%; padding: 0 20px;">
      <a href="index.html" style="color: #4299e1; text-decoration: none; padding: 8px 16px; border: 1px solid #4299e1; border-radius: 5px;">← Back to Home</a>
      <span style="color: #e2e8f0; font-weight: bold; font-size: 1.2rem;">CodeQuest Lesson</span>
      <a href="editor.html" style="color: #4299e1; text-decoration: none; padding: 8px 16px; border: 1px solid #4299e1; border-radius: 5px;">Regular Editor</a>
    </div>
  `;
  lessonHeader.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 60px;
    background: #2a2d3a;
    border-bottom: 2px solid #4299e1;
    display: flex;
    align-items: center;
    z-index: 1002;
  `;

  // Create main lesson container
  const lessonContainer = document.createElement("div");
  lessonContainer.style.cssText = `
    position: fixed;
    top: 60px;
    left: 0;
    width: 100vw;
    height: calc(100vh - 60px);
    display: grid;
    grid-template-columns: 400px 1fr;
    background: #1a1d29;
    z-index: 1000;
  `;

  // Create left lesson panel
  const lessonPanel = document.createElement("div");
  lessonPanel.style.cssText = `
    background: #2a2d3a;
    padding: 20px;
    overflow-y: auto;
    border-right: 2px solid #4299e1;
  `;

  lessonPanel.innerHTML = `
    <div style="margin-bottom: 30px;">
      <h1 id="lessonTitle" style="color: #e2e8f0; margin: 0 0 10px 0; font-size: 1.5rem;">HTML Fundamentals</h1>
      <div id="progressCircle" style="
        width: 60px; 
        height: 60px; 
        border-radius: 50%; 
        background: conic-gradient(#4299e1 0deg, #2d3748 0deg);
        display: flex; 
        align-items: center; 
        justify-content: center; 
        color: white; 
        font-weight: bold;
        margin: 10px 0;
      ">0%</div>
    </div>
    
    <div style="margin-bottom: 30px;">
      <div class="module-item active" onclick="loadModule(0)" style="
        background: #4299e1; 
        color: white; 
        padding: 15px; 
        margin: 10px 0; 
        border-radius: 8px; 
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 10px;
      ">
        <span class="module-number" style="
          background: white; 
          color: #4299e1; 
          width: 30px; 
          height: 30px; 
          border-radius: 50%; 
          display: flex; 
          align-items: center; 
          justify-content: center; 
          font-weight: bold;
        ">1</span>
        <span>What is HTML?</span>
      </div>
      <div class="module-item" onclick="loadModule(1)" style="
        background: #4a5568; 
        color: #e2e8f0; 
        padding: 15px; 
        margin: 10px 0; 
        border-radius: 8px; 
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 10px;
      ">
        <span class="module-number" style="
          background: #e2e8f0; 
          color: #4a5568; 
          width: 30px; 
          height: 30px; 
          border-radius: 50%; 
          display: flex; 
          align-items: center; 
          justify-content: center; 
          font-weight: bold;
        ">2</span>
        <span>HTML Elements</span>
      </div>
      <div class="module-item" onclick="loadModule(2)" style="
        background: #4a5568; 
        color: #e2e8f0; 
        padding: 15px; 
        margin: 10px 0; 
        border-radius: 8px; 
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 10px;
      ">
        <span class="module-number" style="
          background: #e2e8f0; 
          color: #4a5568; 
          width: 30px; 
          height: 30px; 
          border-radius: 50%; 
          display: flex; 
          align-items: center; 
          justify-content: center; 
          font-weight: bold;
        ">3</span>
        <span>Document Structure</span>
      </div>
    </div>
    
    <div id="stepContent">
      <h2 style="color: #4299e1; margin-bottom: 15px;">Understanding HTML</h2>
      <div style="background: #3a3d4a; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
        <h3 style="color: #e2e8f0; margin-top: 0;">📖 What is HTML?</h3>
        <p style="color: #b8bcc8; line-height: 1.6;">HTML (HyperText Markup Language) is the standard markup language for creating web pages. It describes the structure of a web page using elements and tags.</p>
        
        <h3 style="color: #e2e8f0;">🏗️ HTML Structure</h3>
        <p style="color: #b8bcc8; line-height: 1.6;">Every HTML document has a basic structure:</p>
        <ul style="color: #b8bcc8;">
          <li><strong>DOCTYPE declaration</strong> - tells the browser this is HTML5</li>
          <li><strong>html element</strong> - the root element</li>
          <li><strong>head element</strong> - contains metadata</li>
          <li><strong>body element</strong> - contains visible content</li>
        </ul>
      </div>
      
      <div style="background: #3a3d4a; padding: 15px; border-radius: 8px;">
        <h3 style="color: #e2e8f0; margin-top: 0;">💪 Exercise: Create Your First HTML Document</h3>
        <p style="color: #b8bcc8; margin-bottom: 15px;">Create a basic HTML document with the proper structure.</p>
        <div>
          <div style="display: flex; align-items: center; margin: 8px 0;">
            <span class="checkbox" id="req1" style="margin-right: 10px; font-size: 16px; color: #ef4444;">☐</span>
            <span style="color: #e2e8f0;">Add DOCTYPE declaration</span>
          </div>
          <div style="display: flex; align-items: center; margin: 8px 0;">
            <span class="checkbox" id="req2" style="margin-right: 10px; font-size: 16px; color: #ef4444;">☐</span>
            <span style="color: #e2e8f0;">Include html, head, and body elements</span>
          </div>
          <div style="display: flex; align-items: center; margin: 8px 0;">
            <span class="checkbox" id="req3" style="margin-right: 10px; font-size: 16px; color: #ef4444;">☐</span>
            <span style="color: #e2e8f0;">Add a title in the head section</span>
          </div>
          <div style="display: flex; align-items: center; margin: 8px 0;">
            <span class="checkbox" id="req4" style="margin-right: 10px; font-size: 16px; color: #ef4444;">☐</span>
            <span style="color: #e2e8f0;">Include an h1 heading in the body</span>
          </div>
        </div>
      </div>
    </div>
  `;

  // Create right editor panel
  const editorPanel = document.createElement("div");
  editorPanel.style.cssText = `
    background: #1a1d29;
    display: flex;
    flex-direction: column;
    height: 100%;
  `;

  editorPanel.innerHTML = `
    <div style="background: #2a2d3a; padding: 15px; border-bottom: 1px solid #4a5568;">
      <h3 style="color: #e2e8f0; margin: 0;">Code Editor</h3>
    </div>
    
    <div style="display: flex; background: #2a2d3a; border-bottom: 1px solid #4a5568;">
      <button class="tab-btn active" onclick="switchTab('html', this)" style="
        padding: 12px 20px; 
        background: #4299e1; 
        color: white; 
        border: none; 
        cursor: pointer;
        font-weight: bold;
      ">HTML</button>
      <button class="tab-btn" onclick="switchTab('css', this)" style="
        padding: 12px 20px; 
        background: #4a5568; 
        color: #e2e8f0; 
        border: none; 
        cursor: pointer;
      ">CSS</button>
      <button class="tab-btn" onclick="switchTab('js', this)" style="
        padding: 12px 20px; 
        background: #4a5568; 
        color: #e2e8f0; 
        border: none; 
        cursor: pointer;
      ">JavaScript</button>
    </div>
    
    <div style="flex: 1; position: relative;">
      <textarea id="htmlEditor" class="code-editor active" style="
        width: 100%; 
        height: 100%; 
        background: #1a1d29; 
        color: #e2e8f0; 
        border: none; 
        padding: 20px; 
        font-family: 'JetBrains Mono', monospace; 
        font-size: 14px; 
        resize: none; 
        outline: none;
        display: block;
      " placeholder="<!-- HTML code here -->"><!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>My First Webpage</title>
</head>
<body>
    <h1>Hello, World!</h1>
</body>
</html></textarea>
      
      <textarea id="cssEditor" class="code-editor" style="
        width: 100%; 
        height: 100%; 
        background: #1a1d29; 
        color: #e2e8f0; 
        border: none; 
        padding: 20px; 
        font-family: 'JetBrains Mono', monospace; 
        font-size: 14px; 
        resize: none; 
        outline: none;
        display: none;
      " placeholder="/* CSS code here */"></textarea>
      
      <textarea id="jsEditor" class="code-editor" style="
        width: 100%; 
        height: 100%; 
        background: #1a1d29; 
        color: #e2e8f0; 
        border: none; 
        padding: 20px; 
        font-family: 'JetBrains Mono', monospace; 
        font-size: 14px; 
        resize: none; 
        outline: none;
        display: none;
      " placeholder="// JavaScript code here"></textarea>
    </div>
    
    <div style="padding: 15px; background: #2a2d3a; border-top: 1px solid #4a5568; display: flex; gap: 10px;">
      <button onclick="runLessonCode()" style="
        padding: 12px 24px; 
        background: #4299e1; 
        color: white; 
        border: none; 
        border-radius: 6px; 
        cursor: pointer;
        font-weight: bold;
      ">▶️ Run Code</button>
      <button onclick="submitLessonStep()" style="
        padding: 12px 24px; 
        background: #10b981; 
        color: white; 
        border: none; 
        border-radius: 6px; 
        cursor: pointer;
        font-weight: bold;
      ">✅ Submit Step</button>
    </div>
  `;

  // Assemble the layout
  lessonContainer.appendChild(lessonPanel);
  lessonContainer.appendChild(editorPanel);

  // Clear body and add lesson layout
  document.body.innerHTML = "";
  document.body.appendChild(lessonHeader);
  document.body.appendChild(lessonContainer);

  // Load lesson content
  loadLessonContent();

  console.log("✅ Clean lesson layout applied!");
}

function loadLessonContent() {
  const lessonSlug = urlParams.get("lesson") || "html-basics";

  const titles = {
    "html-basics": "HTML Fundamentals",
    "css-fundamentals": "CSS Fundamentals",
    "javascript-intro": "JavaScript Introduction",
  };

  const lessonTitle = document.getElementById("lessonTitle");
  if (lessonTitle) {
    lessonTitle.textContent = titles[lessonSlug] || "HTML Fundamentals";
  }

  console.log("📚 Lesson content loaded:", lessonSlug);
}

// Tab switching function
window.switchTab = function (tab, clickedElement) {
  // Update tab buttons
  document.querySelectorAll(".tab-btn").forEach((btn) => {
    btn.style.background = "#4a5568";
    btn.style.color = "#e2e8f0";
  });

  // Update editors
  document.querySelectorAll(".code-editor").forEach((editor) => {
    editor.style.display = "none";
  });

  // Activate clicked tab
  if (clickedElement) {
    clickedElement.style.background = "#4299e1";
    clickedElement.style.color = "white";
  }

  // Show corresponding editor
  const editor = document.getElementById(tab + "Editor");
  if (editor) {
    editor.style.display = "block";
  }
};

// Module loading function
window.loadModule = function (moduleIndex) {
  console.log("📖 Loading module:", moduleIndex);

  // Update active module styling
  document.querySelectorAll(".module-item").forEach((item, index) => {
    if (index === moduleIndex) {
      item.style.background = "#4299e1";
      item.style.color = "white";
      const moduleNumber = item.querySelector(".module-number");
      if (moduleNumber) {
        moduleNumber.style.background = "white";
        moduleNumber.style.color = "#4299e1";
      }
    } else {
      item.style.background = "#4a5568";
      item.style.color = "#e2e8f0";
      const moduleNumber = item.querySelector(".module-number");
      if (moduleNumber) {
        moduleNumber.style.background = "#e2e8f0";
        moduleNumber.style.color = "#4a5568";
      }
    }
  });

  // Update step content based on module
  const stepContent = document.getElementById("stepContent");
  const modules = [
    {
      title: "Understanding HTML",
      content: `
        <h2 style="color: #4299e1; margin-bottom: 15px;">Understanding HTML</h2>
        <div style="background: #3a3d4a; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
          <h3 style="color: #e2e8f0; margin-top: 0;">📖 What is HTML?</h3>
          <p style="color: #b8bcc8; line-height: 1.6;">HTML (HyperText Markup Language) is the standard markup language for creating web pages.</p>
          <h3 style="color: #e2e8f0;">🏗️ Basic Structure</h3>
          <p style="color: #b8bcc8; line-height: 1.6;">Every HTML document needs proper structure with DOCTYPE, html, head, and body elements.</p>
        </div>
        <div style="background: #3a3d4a; padding: 15px; border-radius: 8px;">
          <h3 style="color: #e2e8f0; margin-top: 0;">💪 Exercise: Create HTML Structure</h3>
          <p style="color: #b8bcc8; margin-bottom: 15px;">Create a basic HTML document with proper structure.</p>
          <div>
            <div style="display: flex; align-items: center; margin: 8px 0;">
              <span class="checkbox" id="req1" style="margin-right: 10px; font-size: 16px; color: #ef4444;">☐</span>
              <span style="color: #e2e8f0;">Add DOCTYPE declaration</span>
            </div>
            <div style="display: flex; align-items: center; margin: 8px 0;">
              <span class="checkbox" id="req2" style="margin-right: 10px; font-size: 16px; color: #ef4444;">☐</span>
              <span style="color: #e2e8f0;">Include html, head, and body elements</span>
            </div>
            <div style="display: flex; align-items: center; margin: 8px 0;">
              <span class="checkbox" id="req3" style="margin-right: 10px; font-size: 16px; color: #ef4444;">☐</span>
              <span style="color: #e2e8f0;">Add a title in the head section</span>
            </div>
            <div style="display: flex; align-items: center; margin: 8px 0;">
              <span class="checkbox" id="req4" style="margin-right: 10px; font-size: 16px; color: #ef4444;">☐</span>
              <span style="color: #e2e8f0;">Include an h1 heading in the body</span>
            </div>
          </div>
        </div>
      `,
    },
    {
      title: "HTML Elements",
      content: `
        <h2 style="color: #4299e1; margin-bottom: 15px;">HTML Elements & Tags</h2>
        <div style="background: #3a3d4a; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
          <h3 style="color: #e2e8f0; margin-top: 0;">🏷️ HTML Tags</h3>
          <p style="color: #b8bcc8; line-height: 1.6;">HTML elements are defined by tags like &lt;h1&gt;, &lt;p&gt;, &lt;div&gt;, etc.</p>
          <h3 style="color: #e2e8f0;">📝 Common Elements</h3>
          <ul style="color: #b8bcc8;">
            <li>&lt;h1&gt; to &lt;h6&gt; - Headings</li>
            <li>&lt;p&gt; - Paragraphs</li>
            <li>&lt;div&gt; - Containers</li>
          </ul>
        </div>
        <div style="background: #3a3d4a; padding: 15px; border-radius: 8px;">
          <h3 style="color: #e2e8f0; margin-top: 0;">💪 Exercise: Use HTML Elements</h3>
          <p style="color: #b8bcc8; margin-bottom: 15px;">Practice using different HTML elements in your code.</p>
        </div>
      `,
    },
    {
      title: "Document Structure",
      content: `
        <h2 style="color: #4299e1; margin-bottom: 15px;">Document Structure</h2>
        <div style="background: #3a3d4a; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
          <h3 style="color: #e2e8f0; margin-top: 0;">🏗️ Semantic HTML</h3>
          <p style="color: #b8bcc8; line-height: 1.6;">Use semantic elements like &lt;header&gt;, &lt;main&gt;, &lt;section&gt; for better structure.</p>
          <h3 style="color: #e2e8f0;">♿ Accessibility</h3>
          <p style="color: #b8bcc8; line-height: 1.6;">Proper structure helps screen readers and improves accessibility.</p>
        </div>
        <div style="background: #3a3d4a; padding: 15px; border-radius: 8px;">
          <h3 style="color: #e2e8f0; margin-top: 0;">💪 Exercise: Semantic Structure</h3>
          <p style="color: #b8bcc8; margin-bottom: 15px;">Create a webpage using semantic HTML elements.</p>
        </div>
      `,
    },
  ];

  if (stepContent && modules[moduleIndex]) {
    stepContent.innerHTML = modules[moduleIndex].content;
  }
};

// Enhanced code validation function
window.runLessonCode = function () {
  console.log("▶️ Running lesson code validation...");

  const activeEditor =
    document.querySelector(".code-editor[style*='display: block']") ||
    document.getElementById("htmlEditor");

  if (!activeEditor) {
    showToast(
      "⚠️ No code editor found. Please make sure you're in the HTML tab.",
      "warning",
      4000
    );
    return;
  }

  const code = activeEditor.value || "";
  console.log("Code to validate:", code);

  const requirements = [
    {
      id: "req1",
      test: () => code.toLowerCase().includes("<!doctype html>"),
      text: "DOCTYPE declaration",
      hint: "Add <!DOCTYPE html> at the beginning",
    },
    {
      id: "req2",
      test: () =>
        code.includes("<html") &&
        code.includes("<head") &&
        code.includes("<body"),
      text: "HTML structure",
      hint: "Include <html>, <head>, and <body> elements",
    },
    {
      id: "req3",
      test: () => code.includes("<title>") && code.includes("</title>"),
      text: "Title element",
      hint: "Add <title>Your Title</title> in the head section",
    },
    {
      id: "req4",
      test: () => code.includes("<h1>") && code.includes("</h1>"),
      text: "H1 heading",
      hint: "Add <h1>Your Heading</h1> in the body section",
    },
  ];

  let completedCount = 0;
  let feedback = [];

  requirements.forEach((req) => {
    const checkbox = document.getElementById(req.id);
    if (checkbox) {
      if (req.test()) {
        checkbox.textContent = "☑️";
        checkbox.style.color = "#10b981";
        completedCount++;
      } else {
        checkbox.textContent = "☐";
        checkbox.style.color = "#ef4444";
        feedback.push(`❌ ${req.text}: ${req.hint}`);
      }
    }
  });

  // Update progress circle
  const progress = Math.round((completedCount / requirements.length) * 100);
  const progressCircle = document.getElementById("progressCircle");
  if (progressCircle) {
    progressCircle.textContent = progress + "%";
    progressCircle.style.background = `conic-gradient(#4299e1 ${
      progress * 3.6
    }deg, #2d3748 ${progress * 3.6}deg)`;
  }

  // Show feedback with toast notifications
  if (completedCount === requirements.length) {
    showToast(
      "🎉 Excellent! All requirements completed! Ready to submit.",
      "success",
      5000
    );
  } else {
    const missingCount = requirements.length - completedCount;
    showToast(
      `📝 Progress: ${completedCount}/${requirements.length} completed. ${missingCount} requirements remaining.`,
      "warning",
      4000
    );
  }

  console.log(
    `✅ Validation complete: ${completedCount}/${requirements.length} requirements met`
  );
};

// Submit lesson step function
window.submitLessonStep = function () {
  console.log("✅ Submitting lesson step...");

  const activeEditor =
    document.querySelector(".code-editor[style*='display: block']") ||
    document.getElementById("htmlEditor");

  if (!activeEditor) {
    alert("⚠️ No code found to submit.");
    return;
  }

  const code = activeEditor.value || "";

  const requirements = [
    () => code.toLowerCase().includes("<!doctype html>"),
    () =>
      code.includes("<html") &&
      code.includes("<head") &&
      code.includes("<body"),
    () => code.includes("<title>") && code.includes("</title>"),
    () => code.includes("<h1>") && code.includes("</h1>"),
  ];

  const allCompleted = requirements.every((test) => test());

  if (allCompleted) {
    // PASS - Show success toast
    showToast(
      "🎓 PASS! Step submitted successfully! Module completed.",
      "success",
      6000
    );

    // Update progress to 100%
    const progressCircle = document.getElementById("progressCircle");
    if (progressCircle) {
      progressCircle.textContent = "100%";
      progressCircle.style.background =
        "conic-gradient(#10b981 360deg, #2d3748 0deg)";
    }

    // Mark current module as completed
    const activeModule = document.querySelector(
      ".module-item[style*='#4299e1']"
    );
    if (activeModule) {
      activeModule.style.background = "#10b981";
      const moduleNumber = activeModule.querySelector(".module-number");
      if (moduleNumber) {
        moduleNumber.textContent = "✓";
        moduleNumber.style.background = "white";
        moduleNumber.style.color = "#10b981";
      }
    }

    // Save progress
    const lessonSlug = urlParams.get("lesson");
    if (lessonSlug) {
      const progressKey = `lesson_progress_${lessonSlug}`;
      const currentProgress = {
        currentModule: 0,
        completedAt: new Date().toISOString(),
        code: code,
      };
      localStorage.setItem(progressKey, JSON.stringify(currentProgress));
      console.log("Progress saved:", currentProgress);
    }
  } else {
    // FAIL - Show error toast
    showToast(
      "❌ FAIL! Please complete all requirements before submitting.",
      "error",
      5000
    );
    // Auto-run validation to show what's missing
    setTimeout(() => runLessonCode(), 1000);
  }
};

console.log("🎓 Clean Lesson System loaded!");
