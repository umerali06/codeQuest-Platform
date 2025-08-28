// Authentication Module for CodeQuest

// User Management
class UserManager {
  constructor() {
    this.currentUser = this.loadUser();
    this.userProgress = this.loadProgress();
    this.apiBase = '/api';
  }

  // Load user from localStorage (for session persistence)
  loadUser() {
    const userData = localStorage.getItem("codequest_user");
    return userData ? JSON.parse(userData) : null;
  }

  // Save user to localStorage (for session persistence)
  saveUser(user) {
    localStorage.setItem("codequest_user", JSON.stringify(user));
    this.currentUser = user;
  }

  // Clear user from localStorage
  clearUser() {
    localStorage.removeItem("codequest_user");
    this.currentUser = null;
  }

  // Load user progress
  loadProgress() {
    const progressData = localStorage.getItem("codequest_progress");
    return progressData ? JSON.parse(progressData) : this.getDefaultProgress();
  }

  // Get default progress structure
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

  // Register new user via database API
  async register(username, email, password) {
    try {
      const response = await fetch(`${this.apiBase}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username,
          email,
          password
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Registration failed');
      }

      if (result.success && result.data) {
        // Save user to localStorage for session persistence
        this.saveUser(result.data);
        return result.data;
      } else {
        throw new Error(result.message || 'Registration failed');
      }
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  }

  // Login user via database API
  async login(email, password) {
    try {
      const response = await fetch(`${this.apiBase}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Login failed');
      }

      if (result.success && result.data) {
        // Save user to localStorage for session persistence
        this.saveUser(result.data);
        return result.data;
      } else {
        throw new Error(result.message || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  // Logout user
  logout() {
    try {
      // Call logout API
      fetch(`${this.apiBase}/auth/logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      }).catch(error => {
        console.error('Logout API error:', error);
      });

      // Clear local session
      this.clearUser();
      return true;
    } catch (error) {
      console.error('Logout error:', error);
      // Still clear local session even if API fails
      this.clearUser();
      return false;
    }
  }

  // Check if user is logged in
  isLoggedIn() {
    return this.currentUser !== null;
  }

  // Get current user
  getCurrentUser() {
    return this.currentUser;
  }

  // Update user progress
  updateProgress(progressData) {
    this.userProgress = { ...this.userProgress, ...progressData };
    localStorage.setItem("codequest_progress", JSON.stringify(this.userProgress));
  }

  // Get user progress
  getProgress() {
    return this.userProgress;
  }

  // Validate email format
  validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Hash password (for client-side validation only)
  hashPassword(password) {
    // In production, this should be handled server-side
    // This is just for basic validation
    return btoa(password); // Simple base64 encoding (NOT secure)
  }

  // Verify password (for client-side validation only)
  verifyPassword(password, hashedPassword) {
    // In production, this should be handled server-side
    return this.hashPassword(password) === hashedPassword;
  }

  // Generate avatar based on username
  generateAvatar(username) {
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8'];
    const color = colors[username.length % colors.length];
    const initials = username.substring(0, 2).toUpperCase();
    
    return `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40"><rect width="40" height="40" fill="${color}"/><text x="20" y="25" text-anchor="middle">${initials}</text></svg>`;
  }

  // Update UI based on auth state
  updateAuthUI() {
    const currentUser = this.getCurrentUser();
    const authButtons = document.querySelector('.auth-buttons');
    const userMenu = document.querySelector('.user-menu');
    
    if (currentUser) {
      // User is logged in
      if (authButtons) authButtons.style.display = 'none';
      if (userMenu) {
        userMenu.style.display = 'flex';
        const username = userMenu.querySelector('.username');
        if (username) username.textContent = currentUser.username;
      }
    } else {
      // User is not logged in
      if (authButtons) authButtons.style.display = 'flex';
      if (userMenu) userMenu.style.display = 'none';
    }
  }
}

// Create global instance
window.AuthManager = new UserManager();
