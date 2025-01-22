document.addEventListener('DOMContentLoaded', function() {
    // PART 1: Particles Background
    particlesJS('particles-js', {
      "particles": {
        "number": {
          "value": 60,
          "density": { "enable": true, "value_area": 800 }
        },
        "color": { "value": "#333" },
        "shape": {
          "type": "circle",
          "stroke": { "width": 0, "color": "#000" }
        },
        "opacity": { "value": 0.2, "random": false },
        "size": { "value": 3, "random": true },
        "line_linked": {
          "enable": true,
          "distance": 120,
          "color": "#333",
          "opacity": 0.3,
          "width": 1
        },
        "move": {
          "enable": true,
          "speed": 1.5,
          "direction": "none",
          "random": false,
          "straight": false,
          "out_mode": "out",
          "bounce": false
        }
      },
      "interactivity": {
        "detect_on": "window",
        "events": {
          "onhover": { "enable": true, "mode": "grab" },
          "onclick": { "enable": true, "mode": "push" }, // still enabled for general clicks
          "resize": true
        },
        "modes": {
          "grab": { "distance": 140, "line_linked": { "opacity": 1 } },
          "bubble": {
            "distance": 400,
            "size": 40,
            "duration": 2,
            "opacity": 8,
            "speed": 3
          },
          "repulse": { "distance": 200, "duration": 0.4 },
          "push": { "particles_nb": 4 },
          "remove": { "particles_nb": 2 }
        }
      },
      "retina_detect": true
    });
  
    // PART 2: Collapsible Sections
    var collapsibles = document.querySelectorAll('.collapsible');
    collapsibles.forEach(function(collapsible) {
      var title = collapsible.querySelector('.section-title');
      var content = collapsible.querySelector('.section-content');
  
      title.addEventListener('click', function() {
        title.classList.toggle('open');
        content.classList.toggle('closed');
      });
    });
  
    // PART 3: Carousel with 20 images, 3 visible at once
    const track = document.querySelector('.carousel-track');
    const slides = Array.from(track.querySelectorAll('.slide'));
    const prevButton = document.querySelector('.carousel-btn.prev');
    const nextButton = document.querySelector('.carousel-btn.next');
    const carouselContainer = document.querySelector('.carousel-container');
  
    // total slides
    const numSlides = slides.length;    
    const slidesVisible = 3;           
    const maxIndex = numSlides - slidesVisible; 
  
    let currentIndex = 0;
  
    // Go to specific slide
    function goToSlide(index) {
      if (index < 0) index = maxIndex;  // wrap-around
      if (index > maxIndex) index = 0;
      currentIndex = index;
      const offsetPercent = -(currentIndex * (100 / slidesVisible));
      track.style.transform = `translateX(${offsetPercent}%)`;
    }
  
    // Next/Prev button events
    nextButton.addEventListener('click', (e) => {
      // Stop click from bubbling up to Particles.js
      e.stopPropagation();
      goToSlide(currentIndex + 1);
    });
    prevButton.addEventListener('click', (e) => {
      e.stopPropagation();
      goToSlide(currentIndex - 1);
    });
  
    // Auto-slide every 4 seconds
    let autoSlide = setInterval(() => {
      goToSlide(currentIndex + 1);
    }, 4000);
  
    // PAUSE ON HOVER: When mouse is over the carousel, stop auto-slide
    carouselContainer.addEventListener('mouseover', () => {
      clearInterval(autoSlide);
    });
  
    // RESUME WHEN MOUSE LEAVES
    carouselContainer.addEventListener('mouseout', () => {
      autoSlide = setInterval(() => {
        goToSlide(currentIndex + 1);
      }, 4000);
    });
  });
  