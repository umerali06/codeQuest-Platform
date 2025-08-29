// Modern Authentication Module for CodeQuest with Appwrite Integration

class AuthManager {
  constructor() {
    this.currentUser = null;
    this.userProgress = null;
    this.apiBase = "/api";
    this.authStateListeners = [];

    // Initialize when Appwrite SDK is loaded
    this.initializeAppwrite();
  }

  // Initialize Appwrite (will be called when SDK is loaded)
  async initializeAppwrite() {
    try {
      // Load Appwrite SDK if not already loaded
      if (typeof window.Appwrite === "undefined") {
        console.log("Loading Appwrite SDK dynamically...");
        await this.loadAppwriteSDK();
      } else {
        console.log("Appwrite SDK already loaded");
      }

      const { Client, Account, Databases } = window.Appwrite;

      // Load configuration from server or use your configured values
      const config = await this.loadAppwriteConfig();

      this.client = new Client()
        .setEndpoint(config.endpoint)
        .setProject(config.projectId);

      this.account = new Account(this.client);
      this.databases = new Databases(this.client);

      console.log("Appwrite initialized successfully with:", config);

      // Check for existing session
      await this.checkSession();

      // Set up auth state listeners
      this.setupAuthStateListeners();
    } catch (error) {
      console.warn(
        "Failed to initialize Appwrite, using fallback:",
        error.message
      );
      // Fallback to localStorage for development
      this.initializeFallback();
    }
  }

  // Load Appwrite configuration
  async loadAppwriteConfig() {
    try {
      const response = await fetch("/api/config/appwrite");
      if (response.ok) {
        const config = await response.json();
        return config;
      }
    } catch (error) {
      console.log(
        "Could not load Appwrite config from server, using configured values"
      );
    }

    // Use your configured Appwrite values
    return {
      endpoint: "https://fra.cloud.appwrite.io/v1",
      projectId: "68ad2f3400028ae2b8e5",
    };
  }

  // Load Appwrite SDK dynamically if not already loaded
  async loadAppwriteSDK() {
    return new Promise((resolve, reject) => {
      if (typeof window.Appwrite !== "undefined") {
        resolve();
        return;
      }

      const script = document.createElement("script");
      script.src = "https://cdn.jsdelivr.net/npm/appwrite@13.0.1";
      script.onload = () => {
        console.log("Appwrite SDK loaded successfully");
        resolve();
      };
      script.onerror = () => {
        console.warn(
          "Failed to load Appwrite SDK, using fallback authentication"
        );
        // Don't reject, just use fallback
        resolve();
      };
      document.head.appendChild(script);
    });
  }

  // Fallback initialization for development
  initializeFallback() {
    console.log("Using localStorage fallback for authentication");
    this.currentUser = this.loadUserFromStorage();
    this.userProgress = this.loadProgressFromStorage();
    this.updateAuthUI();
    this.setupAuthStateListeners();
  }

  // Check for existing Appwrite session
  async checkSession() {
    try {
      const user = await this.account.get();
      if (user) {
        this.currentUser = user;
        await this.loadUserProgress();
        this.saveUserToStorage(user);
        this.updateAuthUI();
        this.notifyAuthStateChange(user);
      }
    } catch (error) {
      console.log("No active session");
      // Check localStorage for fallback session
      const storedUser = this.loadUserFromStorage();
      if (storedUser && this.isValidStoredSession(storedUser)) {
        this.currentUser = storedUser;
        this.userProgress = this.loadProgressFromStorage();
        this.updateAuthUI();
        this.notifyAuthStateChange(storedUser);
      } else {
        this.currentUser = null;
        this.clearStoredSession();
        this.updateAuthUI();
        this.notifyAuthStateChange(null);
      }
    }
  }

  // Setup auth state listeners for cross-page communication
  setupAuthStateListeners() {
    this.authStateListeners = [];

    // Listen for storage changes (cross-tab authentication)
    window.addEventListener("storage", (e) => {
      if (e.key === "codequest_user") {
        if (e.newValue) {
          const user = JSON.parse(e.newValue);
          if (this.isValidStoredSession(user)) {
            this.currentUser = user;
            this.userProgress = this.loadProgressFromStorage();
            this.updateAuthUI();
            this.notifyAuthStateChange(user);
          }
        } else {
          this.currentUser = null;
          this.userProgress = null;
          this.updateAuthUI();
          this.notifyAuthStateChange(null);
        }
      }
    });

    // Periodic session validation
    setInterval(() => {
      this.validateSession();
    }, 60000); // Check every minute
  }

  // Add auth state change listener
  onAuthStateChange(callback) {
    if (typeof callback === "function") {
      this.authStateListeners.push(callback);
    }
  }

  // Notify all listeners of auth state changes
  notifyAuthStateChange(user) {
    if (this.authStateListeners) {
      this.authStateListeners.forEach((callback) => {
        try {
          callback(user);
        } catch (error) {
          console.error("Auth state listener error:", error);
        }
      });
    }
  }

  // Validate stored session
  isValidStoredSession(user) {
    if (!user || !user.sessionExpiry) return false;
    return new Date(user.sessionExpiry) > new Date();
  }

  // Validate current session
  async validateSession() {
    if (!this.currentUser) return;

    try {
      if (this.account) {
        // Validate Appwrite session
        await this.account.get();
      } else {
        // Validate localStorage session
        if (!this.isValidStoredSession(this.currentUser)) {
          await this.logout();
        }
      }
    } catch (error) {
      console.log("Session validation failed, logging out");
      await this.logout();
    }
  }

  // Register new user with Appwrite
  async register(username, email, password) {
    try {
      if (this.account) {
        // Use Appwrite registration
        const user = await this.account.create(
          "unique()",
          email,
          password,
          username
        );
        await this.account.createEmailSession(email, password);

        // Initialize user progress
        await this.createUserProgress(user.$id);

        this.currentUser = user;
        await this.loadUserProgress();
        this.saveUserToStorage(user);
        this.updateAuthUI();
        this.notifyAuthStateChange(user);

        return { success: true, user };
      } else {
        // Fallback registration
        return this.registerFallback(username, email, password);
      }
    } catch (error) {
      console.error("Registration error:", error);
      throw new Error(error.message || "Registration failed");
    }
  }

  // Login user with Appwrite
  async login(email, password) {
    try {
      if (this.account) {
        // Use Appwrite login
        const session = await this.account.createEmailSession(email, password);
        const user = await this.account.get();

        this.currentUser = user;
        await this.loadUserProgress();
        this.saveUserToStorage(user);
        this.updateAuthUI();
        this.notifyAuthStateChange(user);

        return { success: true, user };
      } else {
        // Fallback login
        return this.loginFallback(email, password);
      }
    } catch (error) {
      console.error("Login error:", error);
      throw new Error(error.message || "Login failed");
    }
  }

  // Google OAuth login
  async loginWithGoogle() {
    try {
      if (this.account) {
        await this.account.createOAuth2Session(
          "google",
          window.location.origin + "/auth-success.html",
          window.location.origin + "/auth-failure.html"
        );
      } else {
        throw new Error("Google login not available in fallback mode");
      }
    } catch (error) {
      console.error("Google login error:", error);
      throw new Error("Google login failed");
    }
  }

  // Logout user
  async logout() {
    try {
      if (this.account && this.currentUser) {
        await this.account.deleteSession("current");
      }

      // Clear local state
      this.currentUser = null;
      this.userProgress = null;
      this.clearStoredSession();

      this.updateAuthUI();
      this.notifyAuthStateChange(null);
      return true;
    } catch (error) {
      console.error("Logout error:", error);
      // Still clear local state
      this.currentUser = null;
      this.userProgress = null;
      this.clearStoredSession();
      this.updateAuthUI();
      this.notifyAuthStateChange(null);
      return false;
    }
  }

  // Load user progress from Appwrite database
  async loadUserProgress() {
    try {
      if (this.databases && this.currentUser) {
        const appwriteProgress = await this.databases.getDocument(
          "codequest_db",
          "user_progress",
          this.currentUser.$id
        );

        // Convert from Appwrite schema to internal format
        this.userProgress = {
          totalXP: appwriteProgress.total_xp || 0,
          level: appwriteProgress.level || 1,
          levelTitle: appwriteProgress.level_title || "Beginner",
          streak: appwriteProgress.streak || 0,
          lastLogin: appwriteProgress.last_login || new Date().toISOString(),
          completedLessons: [],
          completedChallenges: [],
          badges: [],
          achievements: [],
          projects: [],
          statistics: {
            html: {
              xp: appwriteProgress.html_xp || 0,
              progress: appwriteProgress.html_progress || 0,
              lessons: appwriteProgress.html_lessons || 0,
            },
            css: {
              xp: appwriteProgress.css_xp || 0,
              progress: appwriteProgress.css_progress || 0,
              lessons: appwriteProgress.css_lessons || 0,
            },
            javascript: {
              xp: appwriteProgress.javascript_xp || 0,
              progress: appwriteProgress.javascript_progress || 0,
              lessons: appwriteProgress.javascript_lessons || 0,
            },
          },
        };
        console.log("User progress loaded from Appwrite");
      } else {
        // Fallback to localStorage
        this.userProgress = this.loadProgressFromStorage();
      }
    } catch (error) {
      console.log("Creating new user progress");
      this.userProgress = this.getDefaultProgress();
      if (this.currentUser) {
        await this.createUserProgress(this.currentUser.$id);
      }
    }
  }

  // Create user progress in Appwrite database
  async createUserProgress(userId) {
    try {
      if (this.databases) {
        const defaultProgress = this.getDefaultProgress();
        // Add required user_id field and map to Appwrite schema
        const appwriteProgress = {
          user_id: userId,
          total_xp: defaultProgress.totalXP || 0,
          level: defaultProgress.level || 1,
          level_title: defaultProgress.levelTitle || "Beginner",
          streak: defaultProgress.streak || 0,
          html_xp: defaultProgress.statistics?.html?.xp || 0,
          css_xp: defaultProgress.statistics?.css?.xp || 0,
          javascript_xp: defaultProgress.statistics?.javascript?.xp || 0,
          html_lessons: defaultProgress.statistics?.html?.lessons || 0,
          css_lessons: defaultProgress.statistics?.css?.lessons || 0,
          javascript_lessons:
            defaultProgress.statistics?.javascript?.lessons || 0,
          html_progress: defaultProgress.statistics?.html?.progress || 0.0,
          css_progress: defaultProgress.statistics?.css?.progress || 0.0,
          javascript_progress:
            defaultProgress.statistics?.javascript?.progress || 0.0,
          last_login: new Date().toISOString(),
        };

        await this.databases.createDocument(
          "codequest_db",
          "user_progress",
          userId,
          appwriteProgress
        );
        this.userProgress = defaultProgress;
        console.log("User progress created in Appwrite");
      }
    } catch (error) {
      console.error("Failed to create user progress:", error);

      // Fallback: Use default progress with localStorage
      this.userProgress = this.getDefaultProgress();
      localStorage.setItem(
        "codequest_progress",
        JSON.stringify(this.userProgress)
      );
      console.log("Using default progress with localStorage fallback");
    }
  }

  // Update user progress
  async updateProgress(progressData) {
    try {
      this.userProgress = { ...this.userProgress, ...progressData };

      if (this.databases && this.currentUser) {
        // Convert internal format to Appwrite schema
        const appwriteProgress = {
          user_id: this.currentUser.$id,
          total_xp: this.userProgress.totalXP || 0,
          level: this.userProgress.level || 1,
          level_title: this.userProgress.levelTitle || "Beginner",
          streak: this.userProgress.streak || 0,
          html_xp: this.userProgress.statistics?.html?.xp || 0,
          css_xp: this.userProgress.statistics?.css?.xp || 0,
          javascript_xp: this.userProgress.statistics?.javascript?.xp || 0,
          html_lessons: this.userProgress.statistics?.html?.lessons || 0,
          css_lessons: this.userProgress.statistics?.css?.lessons || 0,
          javascript_lessons:
            this.userProgress.statistics?.javascript?.lessons || 0,
          html_progress: this.userProgress.statistics?.html?.progress || 0.0,
          css_progress: this.userProgress.statistics?.css?.progress || 0.0,
          javascript_progress:
            this.userProgress.statistics?.javascript?.progress || 0.0,
          last_login: new Date().toISOString(),
        };

        await this.databases.updateDocument(
          "codequest_db",
          "user_progress",
          this.currentUser.$id,
          appwriteProgress
        );
        console.log("Progress updated in Appwrite");
      } else {
        // Fallback to localStorage
        localStorage.setItem(
          "codequest_progress",
          JSON.stringify(this.userProgress)
        );
      }
    } catch (error) {
      console.error("Failed to update progress:", error);
      // Fallback to localStorage
      localStorage.setItem(
        "codequest_progress",
        JSON.stringify(this.userProgress)
      );
    }
  }

  // Fallback methods for development
  registerFallback(username, email, password) {
    const users = JSON.parse(localStorage.getItem("codequest_users") || "[]");

    // Check if user already exists
    if (users.find((u) => u.email === email)) {
      throw new Error("User already exists");
    }

    const user = {
      $id: "user_" + Date.now(),
      name: username,
      email: email,
      password: this.hashPassword(password), // Simple hash for demo
      createdAt: new Date().toISOString(),
    };

    users.push(user);
    localStorage.setItem("codequest_users", JSON.stringify(users));

    this.currentUser = user;
    this.userProgress = this.getDefaultProgress();
    this.saveUserToStorage(user);
    localStorage.setItem(
      "codequest_progress",
      JSON.stringify(this.userProgress)
    );

    this.updateAuthUI();
    this.notifyAuthStateChange(user);
    return { success: true, user };
  }

  loginFallback(email, password) {
    const users = JSON.parse(localStorage.getItem("codequest_users") || "[]");
    const user = users.find(
      (u) => u.email === email && u.password === this.hashPassword(password)
    );

    if (!user) {
      throw new Error("Invalid credentials");
    }

    this.currentUser = user;
    this.userProgress = this.loadProgressFromStorage();
    this.saveUserToStorage(user);

    this.updateAuthUI();
    this.notifyAuthStateChange(user);
    return { success: true, user };
  }

  // Utility methods
  loadUserFromStorage() {
    try {
      const userData = localStorage.getItem("codequest_user");
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error("Error loading user from storage:", error);
      return null;
    }
  }

  loadProgressFromStorage() {
    try {
      const progressData = localStorage.getItem("codequest_progress");
      return progressData
        ? JSON.parse(progressData)
        : this.getDefaultProgress();
    } catch (error) {
      console.error("Error loading progress from storage:", error);
      return this.getDefaultProgress();
    }
  }

  saveUserToStorage(user) {
    try {
      // Add session expiry (24 hours from now)
      const userWithSession = {
        ...user,
        sessionExpiry: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        lastActivity: new Date().toISOString(),
      };
      localStorage.setItem("codequest_user", JSON.stringify(userWithSession));
    } catch (error) {
      console.error("Error saving user to storage:", error);
    }
  }

  clearStoredSession() {
    try {
      localStorage.removeItem("codequest_user");
      localStorage.removeItem("codequest_progress");
    } catch (error) {
      console.error("Error clearing stored session:", error);
    }
  }

  // Update last activity timestamp
  updateLastActivity() {
    if (this.currentUser) {
      this.currentUser.lastActivity = new Date().toISOString();
      this.saveUserToStorage(this.currentUser);
    }
  }

  getDefaultProgress() {
    return {
      totalXP: 0,
      level: 1,
      levelTitle: "Beginner",
      streak: 0,
      lastLogin: new Date().toISOString(),
      completedLessons: [],
      completedChallenges: [],
      badges: [],
      achievements: [],
      projects: [],
      statistics: {
        html: { xp: 0, progress: 0, lessons: 0 },
        css: { xp: 0, progress: 0, lessons: 0 },
        javascript: { xp: 0, progress: 0, lessons: 0 },
      },
    };
  }

  hashPassword(password) {
    // Simple hash for demo - in production use proper server-side hashing
    return btoa(password + "codequest_salt");
  }

  isLoggedIn() {
    return this.currentUser !== null;
  }

  getCurrentUser() {
    return this.currentUser;
  }

  getProgress() {
    return this.userProgress;
  }

  // Update authentication UI
  updateAuthUI() {
    const authButtons = document.getElementById("authButtons");
    const userMenu = document.getElementById("userMenu");
    const userGreeting = document.getElementById("userGreeting");

    if (this.currentUser) {
      // User is logged in
      if (authButtons) authButtons.style.display = "none";
      if (userMenu) {
        userMenu.style.display = "inline-flex";
        if (userGreeting) {
          userGreeting.textContent = `Welcome, ${
            this.currentUser.name || this.currentUser.email
          }!`;
        }
      }
    } else {
      // User is not logged in
      if (authButtons) authButtons.style.display = "inline-flex";
      if (userMenu) userMenu.style.display = "none";
    }
  }

  // Show login modal with animation
  showLogin() {
    const loginModal = document.getElementById("loginModal");
    const signupModal = document.getElementById("signupModal");

    // Hide signup modal if open
    if (signupModal) {
      signupModal.style.display = "none";
      signupModal.classList.remove("show");
    }

    if (loginModal) {
      loginModal.style.display = "flex";
      setTimeout(() => loginModal.classList.add("show"), 10);
      document.body.style.overflow = "hidden";
    }
  }

  // Show signup modal with animation
  showSignup() {
    const signupModal = document.getElementById("signupModal");
    const loginModal = document.getElementById("loginModal");

    // Hide login modal if open
    if (loginModal) {
      loginModal.style.display = "none";
      loginModal.classList.remove("show");
    }

    if (signupModal) {
      signupModal.style.display = "flex";
      setTimeout(() => signupModal.classList.add("show"), 10);
      document.body.style.overflow = "hidden";
    }
  }

  // Close modal with animation
  closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.remove("show");
      setTimeout(() => {
        modal.style.display = "none";
        document.body.style.overflow = "auto";
      }, 300);
    }
  }
}

// Create global instance
window.AuthManager = new AuthManager();

// Global functions for backward compatibility
function showLogin() {
  window.AuthManager.showLogin();
}

function showSignup() {
  window.AuthManager.showSignup();
}

function logout() {
  window.AuthManager.logout();
}

function googleLogin() {
  window.AuthManager.loginWithGoogle();
}

function googleSignup() {
  window.AuthManager.loginWithGoogle();
}

// Enhanced modal functions
function closeModal(modalId) {
  window.AuthManager.closeModal(modalId);
}

function switchToSignup() {
  closeModal("loginModal");
  setTimeout(() => showSignup(), 200);
}

function switchToLogin() {
  closeModal("signupModal");
  setTimeout(() => showLogin(), 200);
}

// Password strength checker
function checkPasswordStrength(password) {
  let strength = 0;

  // Length check
  if (password.length >= 8) strength += 1;
  if (password.length >= 12) strength += 1;

  // Character variety checks
  if (/[a-z]/.test(password)) strength += 1;
  if (/[A-Z]/.test(password)) strength += 1;
  if (/[0-9]/.test(password)) strength += 1;
  if (/[^A-Za-z0-9]/.test(password)) strength += 1;

  return Math.min(strength, 3); // Cap at 3 for our 3-level system
}

function updatePasswordStrength(password) {
  const strengthBar = document.getElementById("passwordStrengthBar");
  if (!strengthBar) return;

  const strength = checkPasswordStrength(password);

  strengthBar.className = "password-strength-bar";

  if (strength === 0) {
    strengthBar.style.width = "0%";
  } else if (strength === 1) {
    strengthBar.classList.add("weak");
  } else if (strength === 2) {
    strengthBar.classList.add("medium");
  } else {
    strengthBar.classList.add("strong");
  }
}

// Form validation helpers
function showFieldError(fieldId, message) {
  const field = document.getElementById(fieldId);
  const formGroup = field?.closest(".form-group");

  if (formGroup) {
    formGroup.classList.add("error");
    formGroup.classList.remove("success");

    // Remove existing error message
    const existingError = formGroup.querySelector(".error-message");
    if (existingError) existingError.remove();

    // Add new error message
    const errorDiv = document.createElement("div");
    errorDiv.className = "error-message";
    errorDiv.textContent = message;
    formGroup.appendChild(errorDiv);
  }
}

function showFieldSuccess(fieldId) {
  const field = document.getElementById(fieldId);
  const formGroup = field?.closest(".form-group");

  if (formGroup) {
    formGroup.classList.add("success");
    formGroup.classList.remove("error");

    // Remove error message
    const existingError = formGroup.querySelector(".error-message");
    if (existingError) existingError.remove();
  }
}

function clearFieldState(fieldId) {
  const field = document.getElementById(fieldId);
  const formGroup = field?.closest(".form-group");

  if (formGroup) {
    formGroup.classList.remove("error", "success");

    // Remove messages
    const existingError = formGroup.querySelector(".error-message");
    const existingSuccess = formGroup.querySelector(".success-message");
    if (existingError) existingError.remove();
    if (existingSuccess) existingSuccess.remove();
  }
}

function setButtonLoading(buttonId, loading = true) {
  const button =
    document.getElementById(buttonId) || document.querySelector(`#${buttonId}`);
  if (button) {
    if (loading) {
      button.classList.add("btn-loading");
      button.disabled = true;
    } else {
      button.classList.remove("btn-loading");
      button.disabled = false;
    }
  }
}

// Enhanced form handlers
document.addEventListener("DOMContentLoaded", function () {
  // Password strength indicator
  const signupPassword = document.getElementById("signupPassword");
  if (signupPassword) {
    signupPassword.addEventListener("input", function (e) {
      updatePasswordStrength(e.target.value);
    });
  }

  // Real-time validation
  const emailFields = document.querySelectorAll('input[type="email"]');
  emailFields.forEach((field) => {
    field.addEventListener("blur", function (e) {
      const email = e.target.value;
      if (email && !isValidEmail(email)) {
        showFieldError(e.target.id, "Please enter a valid email address");
      } else if (email) {
        clearFieldState(e.target.id);
      }
    });
  });

  // Login form handler
  const loginForm = document.getElementById("loginForm");
  if (loginForm) {
    loginForm.addEventListener("submit", async function (e) {
      e.preventDefault();

      const email = document.getElementById("loginEmail").value;
      const password = document.getElementById("loginPassword").value;
      const submitBtn = e.target.querySelector('button[type="submit"]');

      // Clear previous errors
      clearFieldState("loginEmail");
      clearFieldState("loginPassword");

      // Validate inputs
      if (!email) {
        showFieldError("loginEmail", "Email is required");
        return;
      }
      if (!isValidEmail(email)) {
        showFieldError("loginEmail", "Please enter a valid email address");
        return;
      }
      if (!password) {
        showFieldError("loginPassword", "Password is required");
        return;
      }

      // Set loading state
      submitBtn.classList.add("btn-loading");
      submitBtn.disabled = true;

      try {
        await window.AuthManager.login(email, password);
        closeModal("loginModal");
        showNotification("Welcome back! Login successful.", "success");

        // Clear form
        loginForm.reset();
      } catch (error) {
        showFieldError("loginPassword", error.message);
        showNotification(error.message, "error");
      } finally {
        // Remove loading state
        submitBtn.classList.remove("btn-loading");
        submitBtn.disabled = false;
      }
    });
  }

  // Signup form handler
  const signupForm = document.getElementById("signupForm");
  if (signupForm) {
    signupForm.addEventListener("submit", async function (e) {
      e.preventDefault();

      const name = document.getElementById("signupName").value;
      const email = document.getElementById("signupEmail").value;
      const password = document.getElementById("signupPassword").value;
      const submitBtn = e.target.querySelector('button[type="submit"]');

      // Clear previous errors
      clearFieldState("signupName");
      clearFieldState("signupEmail");
      clearFieldState("signupPassword");

      // Validate inputs
      if (!name || name.trim().length < 2) {
        showFieldError(
          "signupName",
          "Please enter your full name (at least 2 characters)"
        );
        return;
      }
      if (!email) {
        showFieldError("signupEmail", "Email is required");
        return;
      }
      if (!isValidEmail(email)) {
        showFieldError("signupEmail", "Please enter a valid email address");
        return;
      }
      if (!password) {
        showFieldError("signupPassword", "Password is required");
        return;
      }
      if (password.length < 8) {
        showFieldError(
          "signupPassword",
          "Password must be at least 8 characters long"
        );
        return;
      }

      // Set loading state
      submitBtn.classList.add("btn-loading");
      submitBtn.disabled = true;

      try {
        await window.AuthManager.register(name, email, password);
        closeModal("signupModal");
        showNotification(
          "Account created successfully! Welcome to CodeQuest.",
          "success"
        );

        // Clear form
        signupForm.reset();
        updatePasswordStrength(""); // Reset password strength bar
      } catch (error) {
        if (error.message.includes("email")) {
          showFieldError("signupEmail", error.message);
        } else {
          showFieldError("signupPassword", error.message);
        }
        showNotification(error.message, "error");
      } finally {
        // Remove loading state
        submitBtn.classList.remove("btn-loading");
        submitBtn.disabled = false;
      }
    });
  }

  // Close modal when clicking outside
  document.addEventListener("click", function (e) {
    if (e.target.classList.contains("modal")) {
      const modalId = e.target.id;
      closeModal(modalId);
    }
  });

  // Close modal with Escape key
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") {
      const openModal = document.querySelector(".modal.show");
      if (openModal) {
        closeModal(openModal.id);
      }
    }
  });
});

// Email validation helper
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Notification helper
function showNotification(message, type = "info") {
  // Use existing notification system if available
  if (
    typeof window.CodeQuest !== "undefined" &&
    window.CodeQuest.showNotification
  ) {
    window.CodeQuest.showNotification(message, type);
  } else {
    // Simple fallback
    alert(message);
  }
}
// Auto-initialize authentication when page loads
document.addEventListener("DOMContentLoaded", function () {
  // Ensure AuthManager is initialized
  if (window.AuthManager) {
    // Update activity tracking
    let activityTimer;

    function trackActivity() {
      if (
        window.AuthManager &&
        typeof window.AuthManager.isLoggedIn === "function" &&
        window.AuthManager.isLoggedIn()
      ) {
        window.AuthManager.updateLastActivity();
      }

      // Reset the timer
      clearTimeout(activityTimer);
      activityTimer = setTimeout(() => {
        // Auto-logout after 24 hours of inactivity
        if (
          window.AuthManager &&
          typeof window.AuthManager.isLoggedIn === "function" &&
          window.AuthManager.isLoggedIn()
        ) {
          const user = window.AuthManager.getCurrentUser();
          if (user && user.lastActivity) {
            const lastActivity = new Date(user.lastActivity);
            const now = new Date();
            const hoursSinceActivity = (now - lastActivity) / (1000 * 60 * 60);

            if (hoursSinceActivity > 24) {
              console.log("Auto-logout due to inactivity");
              window.AuthManager.logout();
            }
          }
        }
      }, 60000); // Check every minute
    }

    // Track user activity
    ["click", "keypress", "scroll", "mousemove"].forEach((event) => {
      document.addEventListener(event, trackActivity, { passive: true });
    });

    // Initial activity tracking
    trackActivity();
  }
});

// Handle page visibility changes
document.addEventListener("visibilitychange", function () {
  if (
    !document.hidden &&
    window.AuthManager &&
    typeof window.AuthManager.isLoggedIn === "function" &&
    window.AuthManager.isLoggedIn()
  ) {
    // Page became visible, validate session
    window.AuthManager.validateSession();
  }
});

// Handle beforeunload to update last activity
window.addEventListener("beforeunload", function () {
  if (
    window.AuthManager &&
    typeof window.AuthManager.isLoggedIn === "function" &&
    window.AuthManager.isLoggedIn()
  ) {
    window.AuthManager.updateLastActivity();
  }
});
