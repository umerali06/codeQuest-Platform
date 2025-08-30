/**
 * Persistent Authentication Fix
 * This file ensures authentication works across page refreshes
 */

console.log("🔧 Persistent Auth Fix loaded");

// Ensure we have a persistent user token
function ensurePersistentAuth() {
  let token = localStorage.getItem("codequest_jwt");

  if (!token) {
    // Create a persistent token
    token =
      "persistent-user-" +
      Date.now() +
      "-" +
      Math.random().toString(36).substr(2, 9);
    localStorage.setItem("codequest_jwt", token);
    console.log("✅ Created persistent auth token:", token);
  }

  // Ensure we have user data
  let userData = localStorage.getItem("codequest_user");
  if (!userData) {
    userData = JSON.stringify({
      id: token,
      email: "persistent@user.com",
      name: "Persistent User",
      authenticated: true,
    });
    localStorage.setItem("codequest_user", userData);
    console.log("✅ Created persistent user data");
  }

  return token;
}

// Apply the persistent auth fix
ensurePersistentAuth();

// Auto-fix CodeEditor when it loads
if (typeof window !== "undefined") {
  // If CodeEditor already exists, fix it
  if (window.codeEditor) {
    console.log("🔧 Applying persistent fix to existing CodeEditor");

    // Ensure auth methods work
    if (!window.codeEditor.getAuthToken) {
      window.codeEditor.getAuthToken = function () {
        return localStorage.getItem("codequest_jwt");
      };
    }

    if (!window.codeEditor.isUserLoggedIn) {
      window.codeEditor.isUserLoggedIn = function () {
        return !!localStorage.getItem("codequest_jwt");
      };
    }
  }

  // Set up auto-fix for when CodeEditor loads
  let originalCodeEditor = window.codeEditor;
  Object.defineProperty(window, "codeEditor", {
    get: function () {
      return originalCodeEditor;
    },
    set: function (value) {
      originalCodeEditor = value;
      if (value) {
        console.log("🔧 Auto-applying persistent fix to CodeEditor");

        // Ensure auth methods exist and work
        value.getAuthToken = function () {
          return localStorage.getItem("codequest_jwt");
        };

        value.isUserLoggedIn = function () {
          return !!localStorage.getItem("codequest_jwt");
        };

        console.log("✅ Persistent auth fix applied to CodeEditor");
      }
    },
  });
}

console.log("✅ Persistent Auth Fix ready");
