// AI Assistant JavaScript
// Provides AI-powered help and guidance for users

// Prevent duplicate initialization
if (typeof window.AIAssistant !== "undefined") {
  console.log("AIAssistant already initialized, skipping...");
} else {
  class AIAssistant {
    constructor() {
      this.isOpen = false;
      this.conversationHistory = [];
      this.init();
    }

    init() {
      this.createAIWidget();
      this.setupEventListeners();
    }

    createAIWidget() {
      // Check if AI widget already exists
      if (document.getElementById("ai-assistant-widget")) {
        console.log("AI Assistant widget already exists, skipping creation");
        return;
      }

      // Also check for any existing AI buttons or widgets
      const existingAIElements = document.querySelectorAll(
        '[class*="ai-"], [id*="ai-"], [class*="assistant"], [id*="assistant"]'
      );
      if (existingAIElements.length > 0) {
        console.log("Found existing AI elements, checking for conflicts...");
        // Remove any duplicate AI buttons that might exist
        existingAIElements.forEach((element) => {
          if (
            element.textContent &&
            (element.textContent.includes("AI") ||
              element.textContent.includes("Assistant"))
          ) {
            console.log("Removing duplicate AI element:", element);
            element.remove();
          }
        });
      }

      const aiWidget = document.createElement("div");
      aiWidget.id = "ai-assistant-widget";
      aiWidget.className = "ai-assistant-widget";
      aiWidget.innerHTML = `
      <div class="ai-toggle-button" id="ai-toggle-btn">
        <span class="ai-icon">🤖</span>
        <span class="ai-text">AI Help</span>
      </div>
      
      <div class="ai-chat-window" id="ai-chat-window">
        <div class="ai-header">
          <h3>AI Assistant</h3>
          <button class="ai-close-btn" id="ai-close-btn">&times;</button>
        </div>
        
        <div class="ai-messages" id="ai-messages">
          <div class="ai-message ai-message">
            <p>👋 Hi! I'm your AI coding assistant. I can help you with:</p>
            <ul>
              <li>HTML structure and semantics</li>
              <li>CSS styling and layout</li>
              <li>JavaScript functionality</li>
              <li>Debugging code issues</li>
              <li>Best practices and tips</li>
            </ul>
            <p>What would you like to learn about?</p>
          </div>
        </div>
        
        <div class="ai-quick-actions">
          <button class="quick-action-btn" data-prompt="Explain HTML semantic elements">HTML Semantics</button>
          <button class="quick-action-btn" data-prompt="How to center a div with CSS">Center Div</button>
          <button class="quick-action-btn" data-prompt="JavaScript event handling basics">JS Events</button>
          <button class="quick-action-btn" data-prompt="CSS flexbox layout guide">Flexbox</button>
        </div>
        
        <div class="ai-input-area">
          <input type="text" id="ai-input" placeholder="Ask me anything about coding..." />
          <button id="ai-send-btn">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="22" y1="2" x2="11" y2="13"></line>
              <polygon points="22,2 15,22 11,13 2,9"></polygon>
            </svg>
          </button>
        </div>
      </div>
    `;

      document.body.appendChild(aiWidget);
    }

    setupEventListeners() {
      const toggleBtn = document.getElementById("ai-toggle-btn");
      const closeBtn = document.getElementById("ai-close-btn");
      const sendBtn = document.getElementById("ai-send-btn");
      const input = document.getElementById("ai-input");
      const quickActions = document.querySelectorAll(".quick-action-btn");

      if (toggleBtn) {
        toggleBtn.addEventListener("click", () => this.toggleChat());
      }

      if (closeBtn) {
        closeBtn.addEventListener("click", () => this.closeChat());
      }

      if (sendBtn) {
        sendBtn.addEventListener("click", () => this.sendMessage());
      }

      if (input) {
        input.addEventListener("keypress", (e) => {
          if (e.key === "Enter") {
            this.sendMessage();
          }
        });
      }

      quickActions.forEach((btn) => {
        btn.addEventListener("click", () => {
          const prompt = btn.dataset.prompt;
          if (prompt) {
            this.sendMessage(prompt);
          }
        });
      });
    }

    toggleChat() {
      const chatWindow = document.getElementById("ai-chat-window");
      if (chatWindow) {
        this.isOpen = !this.isOpen;
        chatWindow.classList.toggle("active", this.isOpen);

        if (this.isOpen) {
          const input = document.getElementById("ai-input");
          if (input) {
            setTimeout(() => input.focus(), 300);
          }
        }
      }
    }

    closeChat() {
      const chatWindow = document.getElementById("ai-chat-window");
      if (chatWindow) {
        this.isOpen = false;
        chatWindow.classList.remove("active");
      }
    }

    async sendMessage(customPrompt = null) {
      const input = document.getElementById("ai-input");
      const messagesContainer = document.getElementById("ai-messages");

      if (!input || !messagesContainer) return;

      const message = customPrompt || input.value.trim();
      if (!message) return;

      // Add user message to chat
      this.addMessage(message, "user");

      // Clear input
      if (!customPrompt) {
        input.value = "";
      }

      // Add loading message
      const loadingId = this.addMessage("🤔 Thinking...", "ai", true);

      try {
        console.log("Sending AI request:", {
          message,
          context: this.getPageContext(),
        });

        const response = await fetch("/api/ai", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            message: message,
            context: this.getPageContext(),
          }),
        });

        console.log(
          "AI response status:",
          response.status,
          response.statusText
        );

        if (!response.ok) {
          const errorText = await response.text();
          console.error("AI API error response:", errorText);
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const result = await response.json();
        console.log("AI response data:", result);

        // Remove loading message
        this.removeMessage(loadingId);

        if (result.success && result.response) {
          this.addMessage(result.response, "ai");
        } else {
          throw new Error(result.error || "Invalid response from AI service");
        }
      } catch (error) {
        console.error("AI request failed:", error);

        // Remove loading message
        this.removeMessage(loadingId);

        // Add error message
        this.addMessage(
          "❌ Sorry, I encountered an error. Please try again later.",
          "ai error"
        );
      }
    }

    addMessage(content, type, isLoading = false) {
      const messagesContainer = document.getElementById("ai-messages");
      if (!messagesContainer) return null;

      const messageId =
        "msg-" + Date.now() + "-" + Math.random().toString(36).substr(2, 9);
      const messageDiv = document.createElement("div");
      messageDiv.id = messageId;

      // Fix CSS class names to match ai-assistant.css
      if (type === "user") {
        messageDiv.className = "ai-message user-message";
        messageDiv.style.background =
          "linear-gradient(135deg, #6366f1, #8b5cf6)";
        messageDiv.style.color = "white";
        messageDiv.innerHTML = `<p><strong>You:</strong> ${this.escapeHtml(
          content
        )}</p>`;
      } else if (type === "ai error") {
        messageDiv.className = "ai-message ai-message error";
        messageDiv.innerHTML = `<p>${this.formatAIResponse(content)}</p>`;
      } else {
        messageDiv.className = "ai-message ai-message";
        if (isLoading) {
          messageDiv.classList.add("loading");
          messageDiv.innerHTML = `<p>${content}</p>`;
        } else {
          messageDiv.innerHTML = `<p>${this.formatAIResponse(content)}</p>`;
        }
      }

      messagesContainer.appendChild(messageDiv);
      messagesContainer.scrollTop = messagesContainer.scrollHeight;

      return isLoading ? messageId : null;
    }

    removeMessage(messageId) {
      if (messageId) {
        const message = document.getElementById(messageId);
        if (message) {
          message.remove();
        }
      }
    }

    formatAIResponse(content) {
      // Basic markdown-like formatting
      return content
        .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
        .replace(/\*(.*?)\*/g, "<em>$1</em>")
        .replace(/`(.*?)`/g, "<code>$1</code>")
        .replace(/\n/g, "<br>");
    }

    escapeHtml(text) {
      const div = document.createElement("div");
      div.textContent = text;
      return div.innerHTML;
    }

    getPageContext() {
      const path = window.location.pathname;
      const page = path.split("/").pop() || "index.html";

      return {
        page: page.replace(".html", ""),
        url: window.location.href,
        title: document.title,
      };
    }
  }

  // Initialize AI Assistant when DOM is loaded
  document.addEventListener("DOMContentLoaded", () => {
    // Prevent multiple instances
    if (window.aiAssistant) {
      console.log("AI Assistant already initialized, skipping...");
      return;
    }

    // Also check if the widget already exists in DOM
    if (document.getElementById("ai-assistant-widget")) {
      console.log(
        "AI Assistant widget already exists in DOM, skipping initialization..."
      );
      return;
    }

    window.aiAssistant = new AIAssistant();
    console.log("AI Assistant initialized successfully");
  });

  // Note: CSS styles are loaded from ai-assistant.css file
} // End of AIAssistant class prevention block
