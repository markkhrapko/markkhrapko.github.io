document.addEventListener('DOMContentLoaded', function() {
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
        // Subsequent clicks - split existing neurons
        clickCount++;
        
        // 30% chance to spawn new random particles in addition to splitting
        const spawnRandom = Math.random() < 0.3;
        let randomParticlesAdded = 0;
        
        if (spawnRandom) {
          // Spawn 1-2 random particles at click location or random positions
          const numRandom = Math.random() < 0.7 ? 1 : 2;
          
          for (let i = 0; i < numRandom; i++) {
            // 60% chance to spawn at click location, 40% at random position
            const useClickPos = Math.random() < 0.6;
            const x = useClickPos ? e.clientX : Math.random() * window.innerWidth;
            const y = useClickPos ? e.clientY : Math.random() * window.innerHeight;
            
            // Add with random velocity
            const angle = Math.random() * Math.PI * 2;
            const speed = 1 + Math.random() * 2;
            addParticleAtPosition(x, y, Math.cos(angle) * speed, Math.sin(angle) * speed);
            randomParticlesAdded++;
          }
        }
        
        // Calculate how many neurons to split (grows from 1 to ~10)
        const neuronsToSplit = Math.min(Math.floor(1 + clickCount * 0.8), 10);
        
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
    
    // Neural resonance - particles react to mouse movement
    let mouseX = 0;
    let mouseY = 0;
    let isOverCarousel = false;
    
    // Track when mouse is over carousel
    const carousel = document.querySelector('.carousel-container');
    if (carousel) {
      carousel.addEventListener('mouseenter', () => {
        isOverCarousel = true;
      });
      
      carousel.addEventListener('mouseleave', () => {
        isOverCarousel = false;
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
        if (distance < neuralRadius && !isOverCarousel) {
          nearbyParticles.push({ particle, distance, dx, dy });
        }
        
        // Neural response behavior - only if not over carousel
        if (distance < neuralRadius && distance > 0 && !isOverCarousel) {
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
      
      // Calculate offset to center the active slide
      const containerWidth = carouselContainer.offsetWidth;
      const slideWidth = 360;
      const gap = 16;
      
      // Calculate position to center active slide
      const centerOffset = (containerWidth - slideWidth) / 2;
      const slideOffset = trackIndex * (slideWidth + gap);
      const finalOffset = centerOffset - slideOffset;
      
      if (instant) {
        track.style.transition = 'none';
      } else {
        track.style.transition = 'transform 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
      }
      
      track.style.transform = `translateX(${finalOffset}px)`;
      
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
        
        const containerWidth = carouselContainer.offsetWidth;
        const slideWidth = 360;
        const gap = 16;
        const centerOffset = (containerWidth - slideWidth) / 2;
        const slideOffset = trackIndex * (slideWidth + gap);
        const finalOffset = centerOffset - slideOffset;
        track.style.transform = `translateX(${finalOffset}px)`;
        
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
        
        const containerWidth = carouselContainer.offsetWidth;
        const slideWidth = 360;
        const gap = 16;
        const centerOffset = (containerWidth - slideWidth) / 2;
        const slideOffset = trackIndex * (slideWidth + gap);
        const finalOffset = centerOffset - slideOffset;
        track.style.transform = `translateX(${finalOffset}px)`;
        
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
    
    // Touch/swipe support for mobile
    let touchStartX = 0;
    let touchEndX = 0;
    
    carouselContainer.addEventListener('touchstart', (e) => {
      touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });
    
    carouselContainer.addEventListener('touchend', (e) => {
      touchEndX = e.changedTouches[0].screenX;
      handleSwipe();
    }, { passive: true });
    
    function handleSwipe() {
      const swipeThreshold = 50;
      if (touchEndX < touchStartX - swipeThreshold) {
        navigateNext();
      }
      if (touchEndX > touchStartX + swipeThreshold) {
        navigatePrev();
      }
    }
  
    // Auto-slide every 5 seconds
    let autoSlide = setInterval(() => {
      navigateNext();
    }, 5000);
  
    // Pause on hover
    carouselContainer.addEventListener('mouseenter', () => {
      clearInterval(autoSlide);
    });
    
    carouselContainer.addEventListener('mouseleave', () => {
      clearInterval(autoSlide);
      autoSlide = setInterval(() => {
        navigateNext();
      }, 5000);
    });
    
    // Pause on focus (accessibility)
    carouselContainer.addEventListener('focusin', () => {
      clearInterval(autoSlide);
    });
  
    carouselContainer.addEventListener('focusout', () => {
      clearInterval(autoSlide);
      autoSlide = setInterval(() => {
        navigateNext();
      }, 5000);
    });
    
    // Expandable sections
    const expandableSections = document.querySelectorAll('.engrams-title.expandable');
    
    expandableSections.forEach(title => {
      title.addEventListener('click', function(e) {
        e.stopPropagation();
        
        const section = this.closest('.engrams-section');
        const content = section.querySelector('.engrams-content');
        
        // Toggle expanded class
        section.classList.toggle('expanded');
        
        // For smooth height animation, we need to set a specific max-height
        if (section.classList.contains('expanded')) {
          // Temporarily set max-height to none to measure actual height
          content.style.maxHeight = 'none';
          const height = content.scrollHeight;
          content.style.maxHeight = '0px';
          
          // Force reflow
          content.offsetHeight;
          
          // Set to actual height
          content.style.maxHeight = height + 'px';
        } else {
          // Set current height first for smooth transition
          content.style.maxHeight = content.scrollHeight + 'px';
          
          // Force reflow
          content.offsetHeight;
          
          // Then collapse
          content.style.maxHeight = '0px';
        }
      });
    });
  });
  