document.addEventListener('DOMContentLoaded', function() {
    // Version control and cleanup
    const CURRENT_VERSION = '2.3';
    const storedVersion = localStorage.getItem('siteVersion');
    
    // If version changed or doesn't exist, clean up old data
    if (storedVersion !== CURRENT_VERSION) {
      console.log('New version detected, cleaning up old data...');
      
      // Clear specific items that might cause issues
      localStorage.removeItem('curseParticleCount');
      
      // If you want to clear everything except certain items:
      // const itemsToKeep = ['userPreference1', 'userPreference2'];
      // Object.keys(localStorage).forEach(key => {
      //   if (!itemsToKeep.includes(key) && key !== 'siteVersion') {
      //     localStorage.removeItem(key);
      //   }
      // });
      
      // Update version
      localStorage.setItem('siteVersion', CURRENT_VERSION);
      
      // Force reload to ensure fresh assets
      if (storedVersion && storedVersion !== CURRENT_VERSION) {
        window.location.reload(true);
      }
    }
    
    // Global variables for friends list shuffling
    let firstShuffle = true;
    
    // Randomize friends list order
    const friendsList = document.getElementById('friends-list');
    let isHoveringFriend = false;
    let rearrangeInterval;
    let isFriendsVisible = false; // track on-screen visibility
    
    // Function to shuffle friends
    function shuffleFriends(smooth = false) {
      // For the first shuffle after opening, ignore hover state
      if (!friendsList || (!firstShuffle && isHoveringFriend)) return;
      
      const friends = Array.from(friendsList.children);
      if (friends.length === 0) return;
      
      // Create a copy of the array to shuffle
      const shuffled = [...friends];
      
      // Fisher-Yates shuffle algorithm
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      
      // Check if the order actually changed
      const orderChanged = shuffled.some((friend, index) => friend !== friends[index]);
      if (!orderChanged && smooth) {
        // If order didn't change, try again
        shuffleFriends(smooth);
        return;
      }
      
      if (smooth) {
        // Add transition for smooth rearrangement
        friends.forEach((friend) => {
          friend.style.transition = 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)';
          friend.style.transform = 'scale(0.95)';
          friend.style.opacity = '0.6';
        });
        
        setTimeout(() => {
          // Clear and re-append in new order
          friendsList.innerHTML = '';
          shuffled.forEach((friend, index) => {
            friendsList.appendChild(friend);
            // Reset styles with delay for staggered effect
            setTimeout(() => {
              friend.style.transform = 'scale(1)';
              friend.style.opacity = '1';
            }, index * 60);
          });
          
          // Re-attach hover listeners after DOM manipulation
          attachHoverListeners();
        }, 200);
      } else {
        // Initial load - no animation
        friendsList.innerHTML = '';
        shuffled.forEach(friend => friendsList.appendChild(friend));
        attachHoverListeners();
      }
    }
    
    // Function to attach hover listeners to individual friend links
    function attachHoverListeners() {
      if (!friendsList) return;
      
      // Get all links and spans within the friends list
      const friendElements = friendsList.querySelectorAll('a, span.no-link');
      
      friendElements.forEach(element => {
        element.addEventListener('mouseenter', () => {
          isHoveringFriend = true;
        });
        
        element.addEventListener('mouseleave', () => {
          isHoveringFriend = false;
        });
      });
    }
    
    // Initial shuffle on page load
    shuffleFriends(false);

    // Visibility observer for friends section
    const friendsSectionEl = document.getElementById('friends-section');
    if (friendsSectionEl && 'IntersectionObserver' in window) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          isFriendsVisible = entry.isIntersecting && entry.intersectionRatio > 0.15;
        });
      }, { threshold: [0, 0.15, 0.3, 1] });
      observer.observe(friendsSectionEl);
    } else {
      // Fallback: assume visible
      isFriendsVisible = true;
    }

    // Pause shuffling when tab not visible
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState !== 'visible') {
        clearInterval(rearrangeInterval);
      } else {
        if (typeof startRearrangeInterval === 'function') startRearrangeInterval(false);
      }
    });

    // Set up hover tracking for the friends list links
    if (friendsList) {
      // Initial attachment of hover listeners
      attachHoverListeners();
      
      // Function to start the rearrange interval
      function startRearrangeInterval(firstTime = false) {
        clearInterval(rearrangeInterval);
        firstShuffle = firstTime;
        
        // Use 3 seconds for the first shuffle after opening, 8 seconds thereafter
        const interval = firstTime ? 3000 : 8000;
        
        rearrangeInterval = setInterval(() => {
          const friendsSection = document.getElementById('friends-section');
          // Only rearrange if the section is expanded, actually visible on screen, and tab is visible
          if (
            friendsSection &&
            friendsSection.classList.contains('expanded') &&
            isFriendsVisible &&
            document.visibilityState === 'visible'
          ) {
            shuffleFriends(true);
            
            // After the first shuffle, switch to 8 second intervals
            if (firstTime) {
              firstShuffle = false;
              clearInterval(rearrangeInterval);
              startRearrangeInterval(false);
            }
          }
        }, interval);
      }
      
      // Start the interval
      startRearrangeInterval();
    }
    
    // CURSE PARTICLE SYSTEM
    // Load saved particle count from localStorage
    let savedCount = parseInt(localStorage.getItem('curseParticleCount') || '0');
    let isInitialized = false;
    
    // Initialize with empty particles config
    const particleConfig = {
      "particles": {
        "number": {
          "value": 0,
          "density": { "enable": true, "value_area": 800 }
        },
        "color": { "value": "#d0d0d0" },
        "shape": {
          "type": "circle",
          "stroke": { "width": 0, "color": "#000000" }
        },
        "opacity": { "value": 0.7, "random": false },
        "size": { "value": 1.5, "random": false },  // Even smaller and no random variation
        "line_linked": {
          "enable": true,
          "distance": 150,
          "color": "#d0d0d0",
          "opacity": 0.6,
          "width": 1
        },
        "move": {
          "enable": true,
          "speed": 2,
          "direction": "none",
          "random": true,
          "straight": false,
          "out_mode": "out",
          "bounce": false,
          "attract": {
            "enable": false,
            "rotateX": 600,
            "rotateY": 1200
          }
        }
      },
      "interactivity": {
        "detect_on": "canvas",
        "events": {
          "onhover": { "enable": true, "mode": "grab" },
          "onclick": { "enable": false },
          "resize": true
        },
        "modes": {
          "grab": { 
            "distance": 140, 
            "line_linked": { "opacity": 1 } 
          }
        }
      },
      "retina_detect": true
    };
    
    particlesJS('particles-js', particleConfig);
  
    // Wait for particles.js to initialize
    setTimeout(() => {
      isInitialized = true;
      
      // Restore saved particles
      if (savedCount > 0) {
        const particlesToRestore = Math.min(savedCount, 500);
        
        // Create initial neurons if restoring
        if (particlesToRestore >= 2) {
          // Add first two neurons at random positions
          const x1 = Math.random() * window.innerWidth;
          const y1 = Math.random() * window.innerHeight;
          const x2 = Math.random() * window.innerWidth;
          const y2 = Math.random() * window.innerHeight;
          
          addParticleAtPosition(x1, y1);
          addParticleAtPosition(x2, y2);
          
          // Add remaining particles with slight delay for visual effect
          for (let i = 2; i < particlesToRestore; i++) {
            setTimeout(() => {
              const x = Math.random() * window.innerWidth;
              const y = Math.random() * window.innerHeight;
              addParticleAtPosition(x, y);
            }, i * 5);
          }
        }
      }
      
      // Auto-spawn two particles after 4 seconds to show interaction is possible
      setTimeout(() => {
        if (window.pJSDom && window.pJSDom[0] && window.pJSDom[0].pJS) {
          const pJS = window.pJSDom[0].pJS;
          const particles = pJS.particles.array;
          
          // Only auto-spawn if no particles exist yet (user hasn't clicked)
          if (particles.length === 0) {
            // Left particle - 15% from left edge
            const leftX = window.innerWidth * 0.15;
            const leftY = window.innerHeight * (0.3 + Math.random() * 0.4); // 30-70% height
            
            // Right particle - 85% from left edge  
            const rightX = window.innerWidth * 0.85;
            const rightY = window.innerHeight * (0.3 + Math.random() * 0.4); // 30-70% height
            
            // Add particles with slight velocities towards center
            addParticleAtPosition(leftX, leftY, 0.5, (Math.random() - 0.5) * 0.5);
            addParticleAtPosition(rightX, rightY, -0.5, (Math.random() - 0.5) * 0.5);
            
            // Update particle count
            totalParticlesAdded = 2;
          }
        }
      }, 4000);
    }, 100);

    let totalParticlesAdded = savedCount;
    let clickCount = savedCount > 0 ? Math.ceil(savedCount / 5) : 0; // Track number of clicks
    
    // Function to add a single particle at position with explosion effect
    function addParticleAtPosition(x, y, vx = null, vy = null) {
      if (!window.pJSDom || !window.pJSDom[0] || !window.pJSDom[0].pJS) return;
      
      const pJS = window.pJSDom[0].pJS;
      const canvas = pJS.canvas.el;
      
      // Get canvas position - it should be at 0,0 since it's fixed position
      const rect = canvas.getBoundingClientRect();
      
      // Calculate position relative to canvas
      const canvasX = (x - rect.left);
      const canvasY = (y - rect.top);
      
      // Apply pixel ratio for retina displays
      const finalX = canvasX * pJS.canvas.pxratio;
      // Subtract a small offset to compensate for particles appearing below cursor
      const finalY = (canvasY * pJS.canvas.pxratio) - (10 * pJS.canvas.pxratio);
      
      const p = new pJS.fn.particle(
        pJS.particles.color,
        pJS.particles.opacity.value
      );
      
      // Set position
      p.x = finalX;
      p.y = finalY;
      
      // Set velocity - either provided or random
      if (vx !== null && vy !== null) {
        p.vx = vx;
        p.vy = vy;
      } else {
        p.vx = (Math.random() - 0.5) * 2;
        p.vy = (Math.random() - 0.5) * 2;
      }
      
      // Set size - tiny particles (1.5 base size)
      p.radius = pJS.particles.size.value * pJS.canvas.pxratio;
      
      // Add to particles array
      pJS.particles.array.push(p);
      
      return p;
    }
    
    // Neuron splitting function
    function splitNeuron(parentParticle) {
      if (!window.pJSDom || !window.pJSDom[0] || !window.pJSDom[0].pJS) return;
      
      const pJS = window.pJSDom[0].pJS;
      const canvas = pJS.canvas.el;
      const rect = canvas.getBoundingClientRect();
      
      // Convert particle position back to screen coordinates
      const screenX = (parentParticle.x / pJS.canvas.pxratio) + rect.left;
      const screenY = (parentParticle.y / pJS.canvas.pxratio) + rect.top + 10; // Compensate for offset
      
      // Create two daughter neurons with splitting animation
      const splitAngle = Math.random() * Math.PI * 2;
      const splitForce = 2;
      
      // First daughter - moves in one direction
      const vx1 = Math.cos(splitAngle) * splitForce + parentParticle.vx * 0.5;
      const vy1 = Math.sin(splitAngle) * splitForce + parentParticle.vy * 0.5;
      
      // Second daughter - moves in opposite direction
      const vx2 = Math.cos(splitAngle + Math.PI) * splitForce + parentParticle.vx * 0.5;
      const vy2 = Math.sin(splitAngle + Math.PI) * splitForce + parentParticle.vy * 0.5;
      
      // Create daughter particles
      addParticleAtPosition(screenX, screenY, vx1, vy1);
      addParticleAtPosition(screenX, screenY, vx2, vy2);
    }
    
    // Global click handler - now triggers neuron splitting
    document.addEventListener('click', function(e) {
      if (!isInitialized) return;
      
      // Don't add particles if clicking on interactive elements
      if (e.target.closest('.carousel-btn') || 
          e.target.closest('#reset-curse') ||
          e.target.closest('#neurogenic-burst') ||
          e.target.closest('a')) {
        return;
      }
      
      const pJS = window.pJSDom[0].pJS;
      const particles = pJS.particles.array;
      
      if (particles.length === 0) {
        // First click - create 2 initial neurons at random positions
        const x1 = Math.random() * window.innerWidth;
        const y1 = Math.random() * window.innerHeight;
        const x2 = Math.random() * window.innerWidth;
        const y2 = Math.random() * window.innerHeight;
        
        addParticleAtPosition(x1, y1);
        addParticleAtPosition(x2, y2);
        totalParticlesAdded = 2;
      } else {
        // Subsequent clicks - split existing neurons AND add random particles
        clickCount++;
        
        // Always spawn random particles to prevent clustering
        const minRandom = 2; // Minimum random particles per click
        const maxRandom = 5; // Maximum random particles per click
        const numRandom = minRandom + Math.floor(Math.random() * (maxRandom - minRandom + 1));
        let randomParticlesAdded = 0;
        
        // Spawn random particles across the screen
        for (let i = 0; i < numRandom; i++) {
          // 20% chance to spawn near click, 80% completely random
          const nearClick = Math.random() < 0.2;
          
          let x, y;
          if (nearClick) {
            // Spawn within a larger radius of click to reduce clustering
            const radius = 100 + Math.random() * 150; // 100-250px from click
            const angle = Math.random() * Math.PI * 2;
            x = e.clientX + Math.cos(angle) * radius;
            y = e.clientY + Math.sin(angle) * radius;
            
            // Keep within screen bounds
            x = Math.max(0, Math.min(window.innerWidth, x));
            y = Math.max(0, Math.min(window.innerHeight, y));
          } else {
            // Completely random position with some margin from edges
            const margin = 50;
            x = margin + Math.random() * (window.innerWidth - margin * 2);
            y = margin + Math.random() * (window.innerHeight - margin * 2);
          }
          
          // Add with random velocity for more dynamic movement
          const angle = Math.random() * Math.PI * 2;
          const speed = 0.5 + Math.random() * 2.5;
          addParticleAtPosition(x, y, Math.cos(angle) * speed, Math.sin(angle) * speed);
          randomParticlesAdded++;
        }
        
        // Also split some existing neurons (but fewer to balance with random spawns)
        const neuronsToSplit = Math.min(Math.floor(1 + clickCount * 0.4), 5); // Reduced from 0.8 to 0.4
        
        // Randomly select neurons to split
        const availableNeurons = [...particles];
        const selectedNeurons = [];
        
        for (let i = 0; i < neuronsToSplit && availableNeurons.length > 0; i++) {
          const randomIndex = Math.floor(Math.random() * availableNeurons.length);
          selectedNeurons.push(availableNeurons[randomIndex]);
          availableNeurons.splice(randomIndex, 1);
        }
        
        // Split each selected neuron
        selectedNeurons.forEach(neuron => {
          splitNeuron(neuron);
        });
        
        totalParticlesAdded += neuronsToSplit * 2 + randomParticlesAdded; // Each split creates 2 new particles plus randoms
      }
      
      localStorage.setItem('curseParticleCount', totalParticlesAdded.toString());
    });
    
    // Neurogenic burst button handler
    const burstButton = document.getElementById('neurogenic-burst');
    if (burstButton) {
      burstButton.addEventListener('click', function(e) {
        e.stopPropagation();
        
        if (!window.pJSDom || !window.pJSDom[0] || !window.pJSDom[0].pJS) return;
        
        const pJS = window.pJSDom[0].pJS;
        const existingParticles = pJS.particles.array.slice(); // Copy existing particles
        const minParticles = 50; // Minimum particles for a good burst effect
        
        // Calculate how many new particles to create
        const currentCount = existingParticles.length;
        const particlesToCreate = Math.max(minParticles - currentCount, 20); // At least 20 new ones
        
        // Create new particles at random positions
        for (let i = 0; i < particlesToCreate; i++) {
          const x = Math.random() * window.innerWidth;
          const y = Math.random() * window.innerHeight;
          addParticleAtPosition(x, y);
        }
        
        // Now scatter ALL particles (existing + new) with high velocity
        setTimeout(() => {
          const allParticles = pJS.particles.array;
          
          allParticles.forEach(particle => {
            // Random explosion direction and force
            const angle = Math.random() * Math.PI * 2;
            const force = 8 + Math.random() * 12; // Very high velocity
            
            particle.vx = Math.cos(angle) * force;
            particle.vy = Math.sin(angle) * force;
            
            // Reset any investigation states
            const state = particleStates.get(particle);
            if (state) {
              state.investigating = false;
              state.excitementLevel = 1; // Max excitement
              state.chaosTimer = 0;
            }
          });
          
          // Gradually slow down particles over time
          let decaySteps = 0;
          const decayInterval = setInterval(() => {
            decaySteps++;
            
            allParticles.forEach(particle => {
              // Exponential decay of velocity
              particle.vx *= 0.92;
              particle.vy *= 0.92;
              
              // Add some randomness as they slow
              if (decaySteps > 10) {
                particle.vx += (Math.random() - 0.5) * 0.5;
                particle.vy += (Math.random() - 0.5) * 0.5;
              }
            });
            
            // Stop after sufficient decay
            if (decaySteps > 30) {
              clearInterval(decayInterval);
              
              // Reset excitement levels
              allParticles.forEach(particle => {
                const state = particleStates.get(particle);
                if (state) {
                  state.excitementLevel = 0;
                }
              });
            }
          }, 100);
          
          // Update particle count
          totalParticlesAdded = allParticles.length;
          localStorage.setItem('curseParticleCount', totalParticlesAdded.toString());
        }, 50); // Small delay to ensure particles are created
      });
    }
    
    // Glymphatic flush button glow timing
    const glymphaticButton = document.getElementById('reset-curse');
    let glowCount = 0;
    
    // First glow after 13 seconds
    setTimeout(() => {
      if (glymphaticButton && glowCount < 2) {
        glymphaticButton.classList.add('glow');
        glowCount++;
        
        // Remove glow class after animation completes
        setTimeout(() => {
          glymphaticButton.classList.remove('glow');
        }, 1500);
      }
    }, 13000);
    
    // Second glow after 23 seconds total (13 + 10)
    setTimeout(() => {
      if (glymphaticButton && glowCount < 2) {
        glymphaticButton.classList.add('glow');
        glowCount++;
        
        // Remove glow class after animation completes
        setTimeout(() => {
          glymphaticButton.classList.remove('glow');
        }, 1500);
      }
    }, 23000);
    
    // Urgent glow when particle count is high
    function updateUrgentGlow() {
      if (!glymphaticButton || !window.pJSDom || !window.pJSDom[0] || !window.pJSDom[0].pJS) return;
      const pJS = window.pJSDom[0].pJS;
      const count = pJS.particles.array.length;
      // Thresholds with hysteresis to avoid flicker
      const highThreshold = 250; // start urgent glow above this
      const lowThreshold = 240;   // stop urgent glow below this
      const isUrgent = glymphaticButton.classList.contains('glow-urgent');
      if (!isUrgent && count >= highThreshold) {
        glymphaticButton.classList.add('glow-urgent');
      } else if (isUrgent && count <= lowThreshold) {
        glymphaticButton.classList.remove('glow-urgent');
      }
    }

    // Check particle count periodically
    setInterval(updateUrgentGlow, 1000);

    // Neural resonance - particles react to mouse movement
    let mouseX = 0;
    let mouseY = 0;
    let isOverInteractiveElement = false;
    
    // Track when mouse is over carousel
    const carousel = document.querySelector('.carousel-container');
    if (carousel) {
      carousel.addEventListener('mouseenter', () => {
        isOverInteractiveElement = true;
      });
      
      carousel.addEventListener('mouseleave', () => {
        isOverInteractiveElement = false;
      });
    }
    
    // Track when mouse is over buttons
    const glymphaticContainer = document.querySelector('.glymphatic-container');
    if (glymphaticContainer) {
      glymphaticContainer.addEventListener('mouseenter', () => {
        isOverInteractiveElement = true;
      });
      
      glymphaticContainer.addEventListener('mouseleave', () => {
        isOverInteractiveElement = false;
      });
    }
    
    document.addEventListener('mousemove', function(e) {
      if (!isInitialized || !window.pJSDom || !window.pJSDom[0] || !window.pJSDom[0].pJS) return;
      
      const pJS = window.pJSDom[0].pJS;
      const canvas = pJS.canvas.el;
      const rect = canvas.getBoundingClientRect();
      
      // Update mouse position relative to canvas
      mouseX = (e.clientX - rect.left) * pJS.canvas.pxratio;
      mouseY = (e.clientY - rect.top) * pJS.canvas.pxratio;
    });
    
    // Track particle states for neural behavior
    const particleStates = new Map();
    
    // Override particles update to add neural resonance effect
    setInterval(() => {
      if (!isInitialized || !window.pJSDom || !window.pJSDom[0] || !window.pJSDom[0].pJS) return;
      
      const pJS = window.pJSDom[0].pJS;
      const particles = pJS.particles.array;
      
      // Neural interaction radius - increased for more noticeable effect
      const neuralRadius = 240 * pJS.canvas.pxratio; // Increased from 220
      const innerRadius = 100 * pJS.canvas.pxratio; // Increased from 80
      
      // Find particles near cursor for neural connections
      const nearbyParticles = [];
      
      particles.forEach(particle => {
        // Initialize particle state if needed
        if (!particleStates.has(particle)) {
          particleStates.set(particle, {
            investigating: false,
            investigationTime: 0,
            lastMouseDist: Infinity,
            baseVx: particle.vx || (Math.random() - 0.5) * 2,
            baseVy: particle.vy || (Math.random() - 0.5) * 2,
            excitementLevel: 0,
            chaosTimer: Math.random() * 100,
            lastDirectionChange: 0,
            turbulencePhase: Math.random() * Math.PI * 2,
            pauseTimer: 0,
            orbitAngle: Math.random() * Math.PI * 2
          });
        }
        
        const state = particleStates.get(particle);
        
        // Increment chaos timer and turbulence phase
        state.chaosTimer++;
        state.turbulencePhase += 0.05 + Math.random() * 0.05;
        
        // Calculate distance from particle to mouse
        const dx = particle.x - mouseX;
        const dy = particle.y - mouseY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Check if particle is near cursor
        if (distance < neuralRadius && !isOverInteractiveElement) {
          nearbyParticles.push({ particle, distance, dx, dy });
        }
        
        // Neural response behavior - only if not over interactive elements
        if (distance < neuralRadius && distance > 0 && !isOverInteractiveElement) {
          const strength = 1 - (distance / neuralRadius);
          state.excitementLevel = Math.min(state.excitementLevel + strength * 0.2, 1); // Increased from 0.15
          
          // Curiosity behavior - particles investigate the cursor
          if (distance < innerRadius && !state.investigating) {
            // Start investigation
            state.investigating = true;
            state.investigationTime = 0;
          }
          
          if (state.investigating) {
            state.investigationTime++;
            
            // Extended investigation with more dynamic movement
            const phase = state.investigationTime * 0.08;
            const curveFactor = Math.sin(phase) * 0.8 * state.excitementLevel; // Increased from 0.6
            const pulseFactor = 1 + Math.sin(phase * 2) * 0.4; // Increased from 0.3
            const slowFactor = 0.1; // Decreased from 0.15 for stronger attraction
            
            // Complex curving motion with orbital dynamics
            state.orbitAngle += 0.05 + state.excitementLevel * 0.05;
            const orbitRadius = 20 + Math.sin(phase) * 10;
            const orbitX = Math.cos(state.orbitAngle) * orbitRadius;
            const orbitY = Math.sin(state.orbitAngle) * orbitRadius;
            
            const perpX = -dy / distance;
            const perpY = dx / distance;
            
            // Figure-8 pattern around cursor with orbital motion
            particle.vx = particle.vx * slowFactor + 
                         perpX * curveFactor * strength * pulseFactor +
                         (dx / distance) * Math.cos(phase) * 0.5 + // Increased from 0.4
                         orbitX * 0.02 * state.excitementLevel +
                         (Math.random() - 0.5) * 0.15; // Reduced randomness
            particle.vy = particle.vy * slowFactor +
                         perpY * curveFactor * strength * pulseFactor +
                         (dy / distance) * Math.sin(phase) * 0.5 + // Increased from 0.4
                         orbitY * 0.02 * state.excitementLevel +
                         (Math.random() - 0.5) * 0.15; // Reduced randomness
            
            // After extended investigation, particle moves away
            if (state.investigationTime > 60) {
              state.investigating = false;
              state.excitementLevel *= 0.5;
              // Give particle an excited push in an interesting direction
              const angle = Math.atan2(dy, dx) + (Math.random() - 0.5) * Math.PI;
              particle.vx = Math.cos(angle) * 3 * (1 + state.excitementLevel);
              particle.vy = Math.sin(angle) * 3 * (1 + state.excitementLevel);
            }
          } else if (distance > innerRadius) {
            // Enhanced curious approach - more dramatic curves
            if (state.lastMouseDist > distance || state.excitementLevel > 0.25) { // Lowered threshold
              // Getting closer - show strong interest
              const curvePull = strength * 0.7 * (1 + state.excitementLevel); // Increased from 0.5
              const perpX = -dy / distance;
              const perpY = dx / distance;
              
              // Stronger curve trajectory toward cursor
              particle.vx -= (dx / distance) * curvePull;
              particle.vy -= (dy / distance) * curvePull;
              
              // Enhanced perpendicular motion for dramatic curves
              particle.vx += perpX * curvePull * 0.5; // Reduced for more direct approach
              particle.vy += perpY * curvePull * 0.5;
              
              // Add some jitter when excited - creates nervous energy
              if (state.excitementLevel > 0.4) {
                const jitter = state.excitementLevel * 1.2;
                particle.vx += (Math.random() - 0.5) * jitter;
                particle.vy += (Math.random() - 0.5) * jitter;
              }
            }
            
            // Gentle continuous pull even when not approaching
            if (distance > innerRadius * 1.5) {
              const gentlePull = strength * 0.15; // Increased from 0.1
              particle.vx -= (dx / distance) * gentlePull;
              particle.vy -= (dy / distance) * gentlePull;
            }
          }
          
          // Dampen to prevent excessive speed but less dampening for more movement
          particle.vx *= 0.97; // Increased from 0.96
          particle.vy *= 0.97;
          
        } else {
          // EXTREME CHAOS WHEN AWAY FROM CURSOR - TRUE ORGANISM BEHAVIOR
          // Decay excitement when away from cursor
          state.excitementLevel *= 0.95;
          
          // Reset investigation state when far from cursor
          state.investigating = false;
          
          // AGGRESSIVE RANDOMNESS - completely unpredictable movement
          
          // Random jerky movements - high frequency
          if (Math.random() < 0.3) { // 30% chance each frame!
            particle.vx += (Math.random() - 0.5) * 3;
            particle.vy += (Math.random() - 0.5) * 3;
          }
          
          // Sudden stops and starts
          if (Math.random() < 0.05) { // 5% chance to almost stop
            particle.vx *= 0.1;
            particle.vy *= 0.1;
          }
          
          // Wild directional changes
          if (Math.random() < 0.08) { // 8% chance for complete direction change
            const wildAngle = Math.random() * Math.PI * 2;
            const wildForce = 1 + Math.random() * 4;
            particle.vx = Math.cos(wildAngle) * wildForce;
            particle.vy = Math.sin(wildAngle) * wildForce;
          }
          
          // Spiral movements
          if (Math.random() < 0.1) {
            const spiralAngle = Math.atan2(particle.vy, particle.vx) + (Math.random() - 0.5) * 2;
            const currentMag = Math.sqrt(particle.vx * particle.vx + particle.vy * particle.vy);
            particle.vx = Math.cos(spiralAngle) * currentMag;
            particle.vy = Math.sin(spiralAngle) * currentMag;
          }
          
          // Random acceleration/deceleration
          const accel = 0.7 + Math.random() * 0.6; // Between 0.7 and 1.3
          particle.vx *= accel;
          particle.vy *= accel;
          
          // Zigzag motion
          if (Math.random() < 0.15) {
            const perpX = -particle.vy;
            const perpY = particle.vx;
            const zigzagForce = (Math.random() - 0.5) * 2;
            particle.vx += perpX * zigzagForce * 0.3;
            particle.vy += perpY * zigzagForce * 0.3;
          }
          
          // Occasional "tumbling" - complete velocity randomization
          if (Math.random() < 0.02) {
            particle.vx = (Math.random() - 0.5) * 6;
            particle.vy = (Math.random() - 0.5) * 6;
          }
          
          // Micro-vibrations (constant small shaking)
          particle.vx += (Math.random() - 0.5) * 0.5;
          particle.vy += (Math.random() - 0.5) * 0.5;
  
          // Random pauses (like organism resting)
          if (Math.random() < 0.03) {
            state.pauseTimer = 10 + Math.random() * 30;
          }
          
          if (state.pauseTimer > 0) {
            state.pauseTimer--;
            particle.vx *= 0.8;
            particle.vy *= 0.8;
          }
        }
        
        // Store last distance for next frame
        state.lastMouseDist = distance;
        
        // CONSTANT CHAOS - always add some randomness
        particle.vx += (Math.random() - 0.5) * 0.4;
        particle.vy += (Math.random() - 0.5) * 0.4;
        
        // Variable friction with more randomness
        const friction = 0.85 + Math.random() * 0.15;
        particle.vx *= friction;
        particle.vy *= friction;
        
        // Highly variable max speed
        const maxSpeed = 2 + Math.random() * 5; // Can go quite fast!
        const currentSpeed = Math.sqrt(particle.vx * particle.vx + particle.vy * particle.vy);
        if (currentSpeed > maxSpeed) {
          particle.vx = (particle.vx / currentSpeed) * maxSpeed;
          particle.vy = (particle.vy / currentSpeed) * maxSpeed;
        }
        
        // Keep particles always moving with high variation
        if (currentSpeed < 0.5 && !state.investigating && !state.pauseTimer) {
          const angle = Math.random() * Math.PI * 2;
          const speed = 1 + Math.random() * 3;
          particle.vx = Math.cos(angle) * speed;
          particle.vy = Math.sin(angle) * speed;
        }
      });
      
      // Clean up states for particles that no longer exist
      if (particleStates.size > particles.length + 100) {
        const currentParticles = new Set(particles);
        for (const [particle, state] of particleStates) {
          if (!currentParticles.has(particle)) {
            particleStates.delete(particle);
          }
        }
      }
    }, 1000 / 60); // 60 FPS update

    // Reset curse button handler
    const resetButton = document.getElementById('reset-curse');
    if (resetButton) {
      resetButton.addEventListener('click', function(e) {
        e.stopPropagation();
        localStorage.removeItem('curseParticleCount');
        totalParticlesAdded = 0;
        clickCount = 0; // Reset click count
        
        // Clear all particles
        if (window.pJSDom && window.pJSDom[0] && window.pJSDom[0].pJS) {
          window.pJSDom[0].pJS.particles.array.splice(0);
          window.pJSDom[0].pJS.fn.vendors.destroypJS();
          window["pJSDom"] = [];
          
          // Reinitialize with empty particles
          particlesJS('particles-js', particleConfig);
          setTimeout(() => { isInitialized = true; }, 100);
        }
      });
    }
  
    // CAROUSEL with centered hero layout
    const track = document.querySelector('.carousel-track');
    const slides = Array.from(track.querySelectorAll('.slide'));
    const nav = document.querySelector('.carousel-nav');
    const carouselContainer = document.querySelector('.carousel-container');
  
    // Clone first and last slides for infinite loop
    const firstClone = slides[0].cloneNode(true);
    const lastClone = slides[slides.length - 1].cloneNode(true);
    
    // Add clones to track
    track.appendChild(firstClone);
    track.insertBefore(lastClone, slides[0]);
    
    // Update slides array to include clones
    const allSlides = Array.from(track.querySelectorAll('.slide'));
    
    // total slides (not including clones for dots)
    const numSlides = slides.length;    
    let currentIndex = 0;
    let trackIndex = 1; // Start at 1 because of prepended clone
    
    // Create navigation dots (only for original slides)
    slides.forEach((_, index) => {
      const dot = document.createElement('button');
      dot.classList.add('carousel-dot');
      if (index === 0) dot.classList.add('active');
      dot.addEventListener('click', (e) => {
        e.stopPropagation();
        goToSlide(index);
      });
      nav.appendChild(dot);
    });
    
    const dots = nav.querySelectorAll('.carousel-dot');
    
    // Function to get consistent slide dimensions
    function getSlideDimensions() {
      const isMobile = window.innerWidth <= 600;
      
      if (isMobile) {
        // Get actual computed width from first slide for consistency
        const firstSlide = slides[0];
        const computedStyle = window.getComputedStyle(firstSlide);
        const slideWidth = firstSlide.offsetWidth;
        const marginLeft = parseFloat(computedStyle.marginLeft);
        const marginRight = parseFloat(computedStyle.marginRight);
        const totalGap = marginLeft + marginRight;
        
        return {
          slideWidth: slideWidth,
          gap: totalGap,
          isMobile: true
        };
      } else {
        return {
          slideWidth: 360,
          gap: 16,
          isMobile: false
        };
      }
    }
  
    // Go to specific slide
    function goToSlide(index, instant = false) {
      // Update index with wrapping
      if (index < 0) index = numSlides - 1;
      if (index >= numSlides) index = 0;
      
      // Remove all state classes
      allSlides.forEach(slide => {
        slide.classList.remove('active', 'prev', 'next');
      });
      dots[currentIndex].classList.remove('active');
      
      currentIndex = index;
      trackIndex = index + 1; // Account for prepended clone
      
      // Add state classes
      allSlides[trackIndex].classList.add('active');
      dots[currentIndex].classList.add('active');
      
      // Add prev/next classes
      allSlides[trackIndex - 1].classList.add('prev');
      allSlides[trackIndex + 1].classList.add('next');
      
      // Get consistent dimensions
      const dims = getSlideDimensions();
      const containerWidth = carouselContainer.offsetWidth;
      
      // Calculate position to center active slide
      const centerOffset = (containerWidth - dims.slideWidth) / 2;
      const slideOffset = trackIndex * (dims.slideWidth + dims.gap);
      const finalOffset = centerOffset - slideOffset;
      
      if (instant) {
        track.style.transition = 'none';
      } else {
        track.style.transition = 'transform 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
      }
      
      // Use rounded values to prevent accumulation of decimal errors
      track.style.transform = `translateX(${Math.round(finalOffset)}px)`;
      
      // Reset position if we're on a clone
      if (instant) {
        setTimeout(() => {
          track.style.transition = 'transform 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
        }, 50);
      }
    }
    
    // Handle infinite loop transitions
    function handleInfiniteLoop() {
      // If we're on the last clone (showing first image), jump to real first
      if (currentIndex === 0 && trackIndex === numSlides + 1) {
        setTimeout(() => {
          trackIndex = 1;
          goToSlide(0, true);
        }, 500);
      }
      // If we're on the first clone (showing last image), jump to real last
      else if (currentIndex === numSlides - 1 && trackIndex === 0) {
        setTimeout(() => {
          trackIndex = numSlides;
          goToSlide(numSlides - 1, true);
        }, 500);
      }
    }
    
    // Modified navigation functions
    function navigateNext() {
      if (currentIndex === numSlides - 1) {
        // Move to clone of first slide
        trackIndex = numSlides + 1;
        allSlides.forEach(slide => slide.classList.remove('active', 'prev', 'next'));
        allSlides[trackIndex].classList.add('active');
        allSlides[trackIndex - 1].classList.add('prev');
        if (allSlides[trackIndex + 1]) allSlides[trackIndex + 1].classList.add('next');
        
        const dims = getSlideDimensions();
        const containerWidth = carouselContainer.offsetWidth;
        const centerOffset = (containerWidth - dims.slideWidth) / 2;
        const slideOffset = trackIndex * (dims.slideWidth + dims.gap);
        const finalOffset = centerOffset - slideOffset;
        track.style.transform = `translateX(${Math.round(finalOffset)}px)`;
        
        currentIndex = 0;
        dots[numSlides - 1].classList.remove('active');
        dots[0].classList.add('active');
        
        handleInfiniteLoop();
      } else {
      goToSlide(currentIndex + 1);
      }
    }
    
    function navigatePrev() {
      if (currentIndex === 0) {
        // Move to clone of last slide
        trackIndex = 0;
        allSlides.forEach(slide => slide.classList.remove('active', 'prev', 'next'));
        allSlides[trackIndex].classList.add('active');
        if (allSlides[trackIndex - 1]) allSlides[trackIndex - 1].classList.add('prev');
        allSlides[trackIndex + 1].classList.add('next');
        
        const dims = getSlideDimensions();
        const containerWidth = carouselContainer.offsetWidth;
        const centerOffset = (containerWidth - dims.slideWidth) / 2;
        const slideOffset = trackIndex * (dims.slideWidth + dims.gap);
        const finalOffset = centerOffset - slideOffset;
        track.style.transform = `translateX(${Math.round(finalOffset)}px)`;
        
        currentIndex = numSlides - 1;
        dots[0].classList.remove('active');
        dots[numSlides - 1].classList.add('active');
        
        handleInfiniteLoop();
      } else {
        goToSlide(currentIndex - 1);
      }
    }
    
    // Initialize first slide
    goToSlide(0);
    
    // Carousel activation state
    let carouselActivated = false;
    let autoSlide = null;
    
    // Periodic recalibration to prevent drift on mobile
    if (window.innerWidth <= 600) {
      setInterval(() => {
        if (carouselActivated) {
          // Silently recalibrate position without animation
          const dims = getSlideDimensions();
          const containerWidth = carouselContainer.offsetWidth;
          const centerOffset = (containerWidth - dims.slideWidth) / 2;
          const slideOffset = trackIndex * (dims.slideWidth + dims.gap);
          const finalOffset = centerOffset - slideOffset;
          
          // Only update if there's a significant drift (more than 2px)
          const currentTransform = track.style.transform;
          const currentOffset = parseFloat(currentTransform.match(/translateX\(([-\d.]+)px\)/)?.[1] || 0);
          
          if (Math.abs(currentOffset - Math.round(finalOffset)) > 2) {
            track.style.transform = `translateX(${Math.round(finalOffset)}px)`;
          }
        }
      }, 5000); // Check every 5 seconds
    }
    
    // Function to activate carousel
    function activateCarousel() {
      if (!carouselActivated) {
        carouselActivated = true;
        carouselContainer.classList.add('active');
        
        // Start auto-slide after activation
        autoSlide = setInterval(() => {
          navigateNext();
        }, 2750);
      }
    }
    
    // Activate carousel on first interaction
    carouselContainer.addEventListener('mouseenter', () => {
      activateCarousel();
    });
    

    
    // Pause auto-slide when hovering (after activation)
    carouselContainer.addEventListener('mouseenter', () => {
      if (autoSlide) {
        clearInterval(autoSlide);
      }
    });
    
    carouselContainer.addEventListener('mouseleave', () => {
      if (carouselActivated && autoSlide) {
        clearInterval(autoSlide);
        autoSlide = setInterval(() => {
          navigateNext();
        }, 2750);
      }
    });
    
    // Pause on focus (accessibility)
    carouselContainer.addEventListener('focusin', () => {
      if (autoSlide) {
        clearInterval(autoSlide);
      }
    });
  
    carouselContainer.addEventListener('focusout', () => {
      if (carouselActivated) {
        clearInterval(autoSlide);
        autoSlide = setInterval(() => {
          navigateNext();
        }, 2750);
      }
    });
    
    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft') {
        navigatePrev();
      } else if (e.key === 'ArrowRight') {
        navigateNext();
      }
    });
    
    // Click on slides to navigate
    allSlides.forEach((slide, index) => {
      slide.addEventListener('click', (e) => {
      e.stopPropagation();
        // Calculate which original slide this represents
        let targetIndex;
        if (index === 0) {
          targetIndex = numSlides - 1; // Last slide clone
        } else if (index === numSlides + 1) {
          targetIndex = 0; // First slide clone
        } else {
          targetIndex = index - 1; // Regular slides
        }
        goToSlide(targetIndex);
      });
    });
    
    // Touch/swipe support for mobile with improved handling
    let touchStartX = 0;
    let touchEndX = 0;
    let isSwiping = false;
    
    carouselContainer.addEventListener('touchstart', (e) => {
      touchStartX = e.changedTouches[0].screenX;
      isSwiping = true;
      // Activate carousel on touch if not already active
      activateCarousel();
      // Pause auto-slide during touch
      if (autoSlide) {
      clearInterval(autoSlide);
      }
    }, { passive: true });
    
    carouselContainer.addEventListener('touchmove', (e) => {
      if (!isSwiping) return;
      
      // Optional: Add visual feedback during swipe
      const currentX = e.changedTouches[0].screenX;
      const diff = currentX - touchStartX;
      
      // Prevent vertical scrolling while swiping horizontally
      if (Math.abs(diff) > 10) {
        e.preventDefault();
      }
    }, { passive: false });
    
    carouselContainer.addEventListener('touchend', (e) => {
      touchEndX = e.changedTouches[0].screenX;
      handleSwipe();
      isSwiping = false;
      
      // Resume auto-slide after touch if carousel is active
      if (carouselActivated) {
        autoSlide = setInterval(() => {
          navigateNext();
        }, 2750);
      }
    }, { passive: true });
    
    function handleSwipe() {
      const swipeThreshold = 30; // Lower threshold for easier swiping
      if (touchEndX < touchStartX - swipeThreshold) {
        navigateNext();
      }
      if (touchEndX > touchStartX + swipeThreshold) {
        navigatePrev();
      }
    }
    
    // Handle resize and orientation changes
    let resizeTimeout;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        // Force recalculation of positions on resize
        // Use instant transition to prevent jarring movement
        const savedIndex = currentIndex;
        goToSlide(savedIndex, true);
      }, 250);
    });
    
    // Expandable sections
    const expandableSections = document.querySelectorAll('.engrams-title.expandable');
    console.log('Found expandable sections:', expandableSections.length);
    
    // Flag to track if friends section is animating
    let friendsAnimating = false;
    
    expandableSections.forEach(section => {
      section.addEventListener('click', function() {
        console.log('Section clicked:', this.textContent);
        const parentSection = this.closest('.engrams-section');
        
        // Special check for friends section
        if (this.classList.contains('friends-title') && friendsAnimating) {
          // Ignore clicks while animating
          return;
        }
        
        parentSection.classList.toggle('expanded');
        const content = this.nextElementSibling;
        
        if (content) {
          if (parentSection.classList.contains('expanded')) {
            content.style.height = content.scrollHeight + 'px';
            content.style.opacity = '1';
            
            // Special handling for friends section
            if (this.classList.contains('friends-title')) {
              // Set animating flag
              friendsAnimating = true;
              
              // Reset first shuffle flag and trigger first-time shuffle interval when section opens
              firstShuffle = true;
              startRearrangeInterval(true);
              
              // Start typewriter effect
              const tagline = document.getElementById('friends-tagline');
              const friendsList = document.getElementById('friends-list');
              const text1 = "Every one of these people has shaped how I think and who I've become.";
              const text2 = "They are incredible.";
              
              // Clear any existing content and intervals
              tagline.textContent = '';
              tagline.classList.remove('typing');
              friendsList.classList.remove('fade-in');
              
              // Clear any existing typewriter intervals
              if (window.friendsTypeInterval) {
                clearInterval(window.friendsTypeInterval);
              }
              if (window.friendsTypeInterval2) {
                clearInterval(window.friendsTypeInterval2);
              }
              
              // Start typing after a short delay
              setTimeout(() => {
                tagline.classList.add('typing');
                let index = 0;
                let currentText = text1;
                let isSecondLine = false;
                
                window.friendsTypeInterval = setInterval(() => {
                  if (index < currentText.length) {
                    tagline.textContent += currentText[index];
                    index++;
                  } else if (!isSecondLine) {
                    // Add line break and pause before second line
                    tagline.innerHTML += '<br>';
                    clearInterval(window.friendsTypeInterval);
                    
                    // Pause for 800ms before typing second line
                    setTimeout(() => {
                      currentText = text2;
                      index = 0;
                      isSecondLine = true;
                      
                      // Resume typing
                      window.friendsTypeInterval2 = setInterval(() => {
                        if (index < currentText.length) {
                          tagline.innerHTML += currentText[index];
                          index++;
                        } else {
                          // Typing complete - keep the typing class for cursor
                          clearInterval(window.friendsTypeInterval2);
                          // Don't remove typing class to keep content visible
                          
                          // Fade in all friends together after typing completes
                          setTimeout(() => {
                            friendsList.classList.add('fade-in');
                            // Reset animating flag after all animations complete
                            friendsAnimating = false;
                          }, 500);
                        }
                      }, 30); // Faster typing speed
                    }, 800); // Pause duration
                  }
                }, 30); // Faster typing speed (30ms per character)
              }, 300);
            }
          } else {
            content.style.height = '0';
            content.style.opacity = '0';
            
            // Reset friends section if closing
            if (this.classList.contains('friends-title')) {
              const tagline = document.getElementById('friends-tagline');
              const friendsList = document.getElementById('friends-list');
              tagline.textContent = '';
              tagline.classList.remove('typing');
              friendsList.classList.remove('fade-in');
              // Clear any running intervals
              if (window.friendsTypeInterval) {
                clearInterval(window.friendsTypeInterval);
              }
              if (window.friendsTypeInterval2) {
                clearInterval(window.friendsTypeInterval2);
              }
              // Reset animating flag
              friendsAnimating = false;
            }
          }
        }
      });
    });
  });
  