// Particles Animation JavaScript - Clean Version
// No problematic scroll parallax or NaN-causing functions

// Particle System Configuration
const particleConfig = {
  particleCount: 15, // Reduced for better performance
  symbols: [
    "<>", "{}", "[]", "/>", "</>", "()", "/*", "*/", "==", "++", "--", "=>"
  ],
  colors: ["#6366f1", "#8b5cf6", "#ec4899", "#60a5fa", "#34d399"],
  minSize: 12,
  maxSize: 24,
  minSpeed: 8,
  maxSpeed: 20,
  fadeInTime: 1.5,
  fadeOutTime: 1.5
};

// Particle Class
class Particle {
  constructor(container) {
    this.container = container;
    this.element = null;
    
    // Initialize with safe values
    this.x = Math.max(0, Math.min(window.innerWidth - 50, Math.random() * window.innerWidth));
    this.y = window.innerHeight + 50;
    this.size = Math.max(
      particleConfig.minSize,
      Math.min(
        particleConfig.maxSize,
        Math.random() * (particleConfig.maxSize - particleConfig.minSize) + particleConfig.minSize
      )
    );
    this.speed = Math.max(
      particleConfig.minSpeed,
      Math.min(
        particleConfig.maxSpeed,
        Math.random() * (particleConfig.maxSpeed - particleConfig.minSpeed) + particleConfig.minSpeed
      )
    );
    this.symbol = particleConfig.symbols[
      Math.floor(Math.random() * particleConfig.symbols.length)
    ];
    this.color = particleConfig.colors[
      Math.floor(Math.random() * particleConfig.colors.length)
    ];
    this.rotation = Math.random() * 360;
    this.rotationSpeed = (Math.random() * 2 - 1) * 0.5; // Reduced rotation speed
    this.opacity = 0;
    this.fadeState = "in";
    this.horizontalMovement = (Math.random() * 2 - 1) * 0.3; // Reduced horizontal movement

    // Validate values before proceeding
    if (this.validateValues()) {
      this.createElement();
      this.animate();
    }
  }

  validateValues() {
    return !isNaN(this.x) && 
           !isNaN(this.y) && 
           !isNaN(this.size) && 
           !isNaN(this.speed) && 
           !isNaN(this.rotation) && 
           !isNaN(this.rotationSpeed) && 
           !isNaN(this.horizontalMovement) &&
           isFinite(this.x) && 
           isFinite(this.y) && 
           isFinite(this.size) && 
           isFinite(this.speed);
  }

  createElement() {
    this.element = document.createElement("div");
    this.element.className = "particle";
    this.element.innerHTML = this.symbol;
    this.element.style.cssText = `
      position: fixed;
      left: ${this.x}px;
      top: ${this.y}px;
      font-size: ${this.size}px;
      color: ${this.color};
      opacity: 0;
      z-index: -1;
      pointer-events: none;
      transform: rotate(${this.rotation}deg);
      transition: opacity ${particleConfig.fadeInTime}s ease;
      font-family: 'Monaco', 'Courier New', monospace;
      font-weight: bold;
      text-shadow: 0 0 10px ${this.color}40;
    `;

    this.container.appendChild(this.element);
  }

  animate() {
    // Start fade in
    setTimeout(() => {
      if (this.element) {
        this.element.style.opacity = "0.4";
        this.fadeState = "visible";
      }
    }, 100);

    // Animation loop
    this.animationFrame = setInterval(() => {
      this.update();
    }, 50);
  }

  update() {
    if (!this.element) return;

    // Update position with safety checks
    const speedDivisor = Math.max(this.speed, 1); // Prevent division by zero
    const newY = this.y - (speedDivisor / 12);
    const newX = this.x + this.horizontalMovement;
    
    // Only update if values are valid numbers
    if (!isNaN(newY) && !isNaN(newX) && isFinite(newY) && isFinite(newX)) {
      this.y = newY;
      this.x = newX;
    }
    
    this.rotation += this.rotationSpeed;

    // Apply transformations with safety check
    if (!isNaN(this.x) && !isNaN(this.y) && isFinite(this.x) && isFinite(this.y)) {
      this.element.style.transform = `translate(${this.x}px, ${this.y}px) rotate(${this.rotation}deg)`;
    }

    // Check if particle should fade out
    if (this.y < -50) {
      this.fadeOut();
    }

    // Add slight horizontal drift
    if (Math.random() > 0.99) {
      this.horizontalMovement = (Math.random() * 2 - 1) * 0.3;
    }
  }

  fadeOut() {
    if (this.fadeState === "out" || !this.element) return;

    this.fadeState = "out";
    this.element.style.transition = `opacity ${particleConfig.fadeOutTime}s ease`;
    this.element.style.opacity = "0";

    setTimeout(() => {
      this.destroy();
    }, particleConfig.fadeOutTime * 1000);
  }

  destroy() {
    if (this.animationFrame) {
      clearInterval(this.animationFrame);
    }
    if (this.element && this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
    }
    this.element = null;
  }
}

// Particle System Manager
class ParticleSystem {
  constructor() {
    this.particles = [];
    this.container = null;
    this.isActive = true;
    this.init();
  }

  init() {
    this.createContainer();
    this.startGeneration();
    this.handleVisibilityChange();
    this.handleResize();
  }

  createContainer() {
    this.container = document.createElement("div");
    this.container.id = "particle-container";
    this.container.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: -1;
      overflow: hidden;
    `;
    document.body.appendChild(this.container);
  }

  startGeneration() {
    // Initial particles
    for (let i = 0; i < particleConfig.particleCount; i++) {
      setTimeout(() => {
        if (this.isActive) {
          this.createParticle();
        }
      }, i * 600);
    }

    // Continuous generation
    this.generationInterval = setInterval(() => {
      if (this.isActive && this.particles.length < particleConfig.particleCount) {
        this.createParticle();
      }
    }, 3000);
  }

  createParticle() {
    const particle = new Particle(this.container);
    if (particle.element) { // Only add if creation was successful
      this.particles.push(particle);

      // Clean up completed particles
      setTimeout(() => {
        const index = this.particles.indexOf(particle);
        if (index > -1) {
          this.particles.splice(index, 1);
        }
      }, 25000);
    }
  }

  handleVisibilityChange() {
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        this.pause();
      } else {
        this.resume();
      }
    });
  }

  handleResize() {
    let resizeTimeout;
    window.addEventListener("resize", () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        // Adjust particle positions if needed
        this.particles.forEach((particle) => {
          if (particle.x > window.innerWidth && !isNaN(window.innerWidth)) {
            particle.x = Math.max(0, window.innerWidth - 50);
          }
        });
      }, 250);
    });
  }

  pause() {
    this.isActive = false;
    if (this.generationInterval) {
      clearInterval(this.generationInterval);
    }
  }

  resume() {
    this.isActive = true;
    this.startGeneration();
  }

  destroy() {
    this.pause();
    this.particles.forEach((particle) => particle.destroy());
    this.particles = [];
    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }
  }
}

// Initialize Particle System
let particleSystem = null;

document.addEventListener("DOMContentLoaded", () => {
  // Check if user prefers reduced motion
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (!prefersReducedMotion) {
    // Initialize particle system
    particleSystem = new ParticleSystem();
  }

  // Add CSS for particle animations
  const style = document.createElement("style");
  style.textContent = `
    .particle {
      will-change: transform, opacity;
    }
  `;
  document.head.appendChild(style);
});

// Cleanup on page unload
window.addEventListener("beforeunload", () => {
  if (particleSystem) {
    particleSystem.destroy();
  }
});

// Performance optimization
const checkPerformance = () => {
  // Reduce particles on low-end devices
  if (navigator.hardwareConcurrency && navigator.hardwareConcurrency < 4) {
    particleConfig.particleCount = Math.floor(particleConfig.particleCount / 2);
  }

  // Check available memory (if API is available)
  if (navigator.deviceMemory && navigator.deviceMemory < 4) {
    particleConfig.particleCount = Math.floor(particleConfig.particleCount / 2);
  }
};

checkPerformance();

// Export for external control
window.ParticleSystem = {
  pause: () => particleSystem?.pause(),
  resume: () => particleSystem?.resume(),
  destroy: () => particleSystem?.destroy(),
  setParticleCount: (count) => {
    particleConfig.particleCount = count;
    if (particleSystem) {
      particleSystem.destroy();
      particleSystem = new ParticleSystem();
    }
  }
};
