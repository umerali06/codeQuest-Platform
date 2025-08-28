// Optimized Main JavaScript - Performance Focused
let currentUser = null;
let isInitialized = false;

// Performance-optimized initialization
function initializeApp() {
    if (isInitialized) return;
    isInitialized = true;
    
    console.log('🚀 Initializing optimized CodeQuest app...');
    
    // Initialize authentication
    initializeAuth();
    
    // Initialize page-specific functionality
    initializePageSpecific();
    
    // Setup global event listeners
    setupGlobalEventListeners();
}

// Optimized authentication initialization
function initializeAuth() {
    if (typeof window.AuthManager !== 'undefined') {
        window.AuthManager.updateAuthUI();
        
        // Override the updateAuthUI method to also update our local state
        const originalUpdateAuthUI = window.AuthManager.updateAuthUI;
        window.AuthManager.updateAuthUI = function() {
            originalUpdateAuthUI.call(this);
            updateAuthUI();
        };
    }
}

// Optimized page initialization
function initializePageSpecific() {
    const path = window.location.pathname;
    const page = path.split('/').pop() || 'index.html';
    
    console.log(`📄 Initializing page: ${page}`);
    
    switch (page) {
        case 'index.html':
        case '':
            initHomePage();
            break;
        case 'learn.html':
            if (typeof initLearnPage === 'function') {
                initLearnPage();
            }
            break;
        case 'editor.html':
            if (typeof initEditorPage === 'function') {
                initEditorPage();
            }
            break;
        case 'games.html':
            if (typeof initGamesPage === 'function') {
                initGamesPage();
            }
            break;
        case 'challenges.html':
            if (typeof initChallengesPage === 'function') {
                initChallengesPage();
            }
            break;
        case 'leaderboard.html':
            if (typeof initLeaderboardPage === 'function') {
                initLeaderboardPage();
            }
            break;
        case 'dashboard.html':
            if (typeof initDashboardPage === 'function') {
                initDashboardPage();
            }
            break;
        case 'about.html':
            if (typeof initAboutPage === 'function') {
                initAboutPage();
            }
            break;
        default:
            console.log('Unknown page, using default initialization');
            initHomePage();
    }
}

// Optimized home page initialization
function initHomePage() {
    console.log('🏠 Initializing home page...');
    
    // Load statistics with error handling
    loadStatistics();
    
    // Setup smooth scrolling for anchor links
    setupSmoothScrolling();
    
    // Setup AI assistant
    setupAI();
    
    // Initialize performance-optimized animations
    if (typeof AnimationManager !== 'undefined') {
        AnimationManager.init();
    }
    
    // Setup learning path interactions
    setupLearningPaths();
}

// Optimized statistics loading
async function loadStatistics() {
    try {
        const response = await fetch('/api/statistics');
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        
        const data = await response.json();
        if (data.success && data.data) {
            updateStatistics(data.data);
        }
    } catch (error) {
        console.warn('Statistics loading failed, using fallback:', error.message);
        // Use fallback data or show loading state
        showStatisticsLoadingState();
    }
}

// Update statistics display
function updateStatistics(data) {
    const stats = [
        { id: 'activeLearners', key: 'totalUsers' },
        { id: 'totalLessons', key: 'totalLessons' },
        { id: 'totalChallenges', key: 'totalChallenges' }
    ];
    
    stats.forEach(stat => {
        const element = document.getElementById(stat.id);
        if (element && data[stat.key] !== undefined) {
            element.textContent = data[stat.key].toLocaleString();
        }
    });
}

// Show loading state for statistics
function showStatisticsLoadingState() {
    const stats = ['activeLearners', 'totalLessons', 'totalChallenges'];
    stats.forEach(stat => {
        const element = document.getElementById(stat);
        if (element) {
            element.textContent = '...';
        }
    });
}

// Optimized smooth scrolling
function setupSmoothScrolling() {
    const links = document.querySelectorAll('a[href^="#"]');
    
    links.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.getAttribute('href').substring(1);
            const targetElement = document.getElementById(targetId);
            
            if (targetElement) {
                targetElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

// Optimized AI setup
function setupAI() {
    const aiButton = document.getElementById('ai-assistant-button');
    const aiChatWindow = document.getElementById('ai-chat-window');
    const closeAiChat = document.getElementById('close-ai-chat');
    
    if (aiButton && aiChatWindow && closeAiChat) {
        aiButton.addEventListener('click', () => {
            aiChatWindow.style.display = 'flex';
            aiChatWindow.classList.add('active');
        });
        
        closeAiChat.addEventListener('click', () => {
            aiChatWindow.style.display = 'none';
            aiChatWindow.classList.remove('active');
        });
    }
}

// Optimized learning paths setup
function setupLearningPaths() {
    const pathCards = document.querySelectorAll('.path-card');
    
    pathCards.forEach(card => {
        card.addEventListener('click', () => {
            const path = card.dataset.path;
            if (path) {
                window.location.href = path;
            }
        });
    });
}

// Optimized global event listeners
function setupGlobalEventListeners() {
    // Responsive navigation
    const hamburger = document.getElementById('hamburger');
    const navLinks = document.getElementById('navLinks');
    
    if (hamburger && navLinks) {
        hamburger.addEventListener('click', () => {
            navLinks.classList.toggle('active');
            hamburger.classList.toggle('active');
        });
    }
    
    // Close mobile menu when clicking outside
    document.addEventListener('click', (e) => {
        if (navLinks && navLinks.classList.contains('active')) {
            if (!e.target.closest('#navbar')) {
                navLinks.classList.remove('active');
                hamburger.classList.remove('active');
            }
        }
    });
    
    // Optimized scroll handling
    let scrollTimeout;
    window.addEventListener('scroll', () => {
        if (scrollTimeout) clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(handleScroll, 100);
    });
}

// Optimized scroll handling
function handleScroll() {
    const navbar = document.getElementById('navbar');
    if (navbar) {
        if (window.scrollY > 100) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    }
}

// Optimized authentication UI update
function updateAuthUI() {
    if (typeof window.AuthManager !== 'undefined' && window.AuthManager.updateAuthUI) {
        window.AuthManager.updateAuthUI();
    } else {
        const authButtons = document.getElementById("authButtons");
        const userMenu = document.getElementById("userMenu");
        const userGreeting = document.getElementById("userGreeting");
        
        if (currentUser && authButtons && userMenu && userGreeting) {
            authButtons.style.display = "none";
            userMenu.style.display = "inline-flex";
            userGreeting.textContent = `Welcome, ${currentUser.username || currentUser.full_name || 'User'}!`;
        } else if (authButtons && userMenu) {
            authButtons.style.display = "inline-flex";
            userMenu.style.display = "none";
        }
    }
}

// Utility functions
function showNotification(message, type = 'info', duration = 3000) {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    // Add styles
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 1rem 1.5rem;
        background: var(--primary);
        color: white;
        border-radius: 0.5rem;
        z-index: 10000;
        transform: translateX(100%);
        transition: transform 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    // Remove after duration
    setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 300);
    }, duration);
}

// Performance-optimized debounce
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Performance-optimized throttle
function throttle(func, limit) {
    let inThrottle;
    return function (...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => (inThrottle = false), limit);
        }
    };
}

// Export functions for use in other files
window.CodeQuest = {
    showNotification,
    currentUser: () => currentUser,
    isLoggedIn: () => currentUser !== null,
};

// Performance-optimized animation system
const AnimationManager = {
    init() {
        this.setupIntersectionObserver();
        this.setupScrollAnimations();
    },

    setupIntersectionObserver() {
        const options = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.animateElement(entry.target);
                    observer.unobserve(entry.target);
                }
            });
        }, options);

        // Observe all testimonial cards
        document.querySelectorAll('.testimonials .testimonial-card').forEach(card => {
            observer.observe(card);
        });
    },

    animateElement(element) {
        // Add animation class based on element position
        const rect = element.getBoundingClientRect();
        const centerX = window.innerWidth / 2;
        
        if (rect.left < centerX) {
            element.classList.add('slide-in-left');
        } else {
            element.classList.add('slide-in-right');
        }
    },

    setupScrollAnimations() {
        let ticking = false;
        
        const updateAnimations = () => {
            const scrolled = window.pageYOffset;
            const parallax = scrolled * 0.5;
            
            // Apply subtle parallax to background elements
            document.querySelectorAll('.testimonials::before').forEach(bg => {
                bg.style.transform = `translateY(${parallax}px)`;
            });
            
            ticking = false;
        };

        const requestTick = () => {
            if (!ticking) {
                requestAnimationFrame(updateAnimations);
                ticking = true;
            }
        };

        window.addEventListener('scroll', requestTick, { passive: true });
    }
};

// Global functions for HTML onclick handlers
window.showLogin = function() {
    const loginModal = document.getElementById('loginModal');
    if (loginModal) {
        loginModal.style.display = 'block';
    }
};

window.showSignup = function() {
    const signupModal = document.getElementById('signupModal');
    if (signupModal) {
        signupModal.style.display = 'block';
    }
};

window.closeModal = function(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
    }
};

window.logout = function() {
    if (typeof window.AuthManager !== 'undefined' && window.AuthManager.logout) {
        window.AuthManager.logout();
    }
    // Update UI to show login/signup buttons
    const authButtons = document.getElementById('authButtons');
    const userMenu = document.getElementById('userMenu');
    if (authButtons && userMenu) {
        authButtons.style.display = 'inline-flex';
        userMenu.style.display = 'none';
    }
};

window.googleLogin = function() {
    showNotification('Google login coming soon!', 'info');
};

window.googleSignup = function() {
    showNotification('Google signup coming soon!', 'info');
};

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    initializeApp();
}
