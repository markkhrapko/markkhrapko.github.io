document.addEventListener('DOMContentLoaded', function () {
  'use strict';

  /* ---- housekeeping ---------------------------------------------- */
  var CURRENT_VERSION = '4.0';
  try {
    if (localStorage.getItem('siteVersion') !== CURRENT_VERSION) {
      localStorage.removeItem('curseParticleCount'); // pre-4.0 key
      localStorage.setItem('siteVersion', CURRENT_VERSION);
    }
  } catch (e) {}

  var REDUCED = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---- carousel ---------------------------------------------------- */
  var track = document.querySelector('.carousel-track');
  var container = document.querySelector('.carousel-container');
  if (!track || !container) return;

  var slides = Array.prototype.slice.call(track.querySelectorAll('.slide'));
  var numSlides = slides.length;

  // clone last/first slide so the loop can wrap seamlessly; clones are
  // presentation-only duplicates, so hide them from assistive tech and
  // demote the copied image loading hints
  var firstClone = slides[0].cloneNode(true);
  var lastClone = slides[numSlides - 1].cloneNode(true);
  [firstClone, lastClone].forEach(function (clone) {
    clone.setAttribute('aria-hidden', 'true');
    var img = clone.querySelector('img');
    if (img) {
      img.removeAttribute('fetchpriority');
      img.setAttribute('loading', 'lazy');
      img.setAttribute('alt', '');
    }
  });
  track.appendChild(firstClone);
  track.insertBefore(lastClone, slides[0]);
  var allSlides = Array.prototype.slice.call(track.querySelectorAll('.slide'));

  // 0 = last-clone, 1..numSlides = real slides, numSlides+1 = first-clone
  var trackIndex = 1;
  var snapGen = 0; // invalidates pending clone snaps when navigation changes
  var userTookControl = false;
  var hovering = false;
  var focused = false;

  function realIndex(ti) { return (ti - 1 + numSlides) % numSlides; }

  function dims() {
    var cs = window.getComputedStyle(slides[0]);
    return {
      w: slides[0].offsetWidth,
      gap: (parseFloat(cs.marginLeft) || 0) + (parseFloat(cs.marginRight) || 0)
    };
  }

  function applyPositions(instant) {
    var d = dims();
    var offset = (container.offsetWidth - d.w) / 2 - trackIndex * (d.w + d.gap);

    if (instant) track.classList.add('no-transition');
    track.style.transform = 'translateX(' + Math.round(offset) + 'px)';
    if (instant) {
      void track.offsetHeight; // commit the un-animated transform first
      track.classList.remove('no-transition');
    }

    allSlides.forEach(function (s) { s.classList.remove('active', 'prev', 'next'); });
    allSlides[trackIndex].classList.add('active');
    if (allSlides[trackIndex - 1]) allSlides[trackIndex - 1].classList.add('prev');
    if (allSlides[trackIndex + 1]) allSlides[trackIndex + 1].classList.add('next');
  }

  function onClone() { return trackIndex === 0 || trackIndex === numSlides + 1; }

  // instantly reposition from a clone to its real slide (no animation)
  function snapFromClone() {
    if (!onClone()) return;
    snapGen++;
    trackIndex = realIndex(trackIndex) + 1;
    applyPositions(true);
  }

  // after animating onto a clone, snap to the real slide once settled
  function scheduleSnap() {
    snapGen++;
    var gen = snapGen;
    var done = false;
    function finish() {
      if (done) return;
      done = true;
      track.removeEventListener('transitionend', onEnd); // always detach
      if (gen !== snapGen) return; // superseded by newer navigation
      if (onClone()) {
        trackIndex = realIndex(trackIndex) + 1;
        applyPositions(true);
      }
    }
    function onEnd(e) {
      if (e.target === track && e.propertyName === 'transform') finish();
    }
    track.addEventListener('transitionend', onEnd);
    setTimeout(finish, 1100); // fallback (hidden tab: transitionend may not fire)
  }

  function navigate(delta) {
    snapFromClone(); // never start an animation from a clone position
    trackIndex += delta;
    applyPositions(false);
    if (onClone()) scheduleSnap();
  }

  function goToSlide(i) {
    snapFromClone();
    snapGen++; // cancel pending snaps
    trackIndex = i + 1;
    applyPositions(false);
  }

  allSlides.forEach(function (slide, idx) {
    slide.addEventListener('click', function (e) {
      e.stopPropagation();
      takeControl();
      if (idx === 0) navigate(-1);
      else if (idx === numSlides + 1) navigate(1);
      else goToSlide(idx - 1);
    });
  });

  /* ---- auto-advance ------------------------------------------------ */
  var autoSlide = null;

  function startAuto() {
    if (REDUCED || userTookControl || hovering || focused || document.hidden) return;
    clearInterval(autoSlide);
    autoSlide = setInterval(function () { navigate(1); }, 3150);
  }
  function stopAuto() {
    clearInterval(autoSlide);
    autoSlide = null;
  }
  // any deliberate navigation stops the auto-advance for good
  function takeControl() {
    userTookControl = true;
    stopAuto();
  }

  setTimeout(startAuto, 3500);

  container.addEventListener('mouseenter', function () { hovering = true; stopAuto(); });
  container.addEventListener('mouseleave', function () { hovering = false; startAuto(); });
  container.addEventListener('focusin', function () { focused = true; stopAuto(); });
  container.addEventListener('focusout', function () { focused = false; startAuto(); });

  document.addEventListener('visibilitychange', function () {
    if (document.hidden) stopAuto(); else startAuto();
  });

  /* ---- keyboard ------------------------------------------------------ */
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    if (e.target && e.target.closest &&
        e.target.closest('input, textarea, select, a, button')) return;
    takeControl();
    navigate(e.key === 'ArrowRight' ? 1 : -1);
  });

  /* ---- touch --------------------------------------------------------- */
  var touchX = 0, touchY = 0;

  container.addEventListener('touchstart', function (e) {
    touchX = e.changedTouches[0].clientX;
    touchY = e.changedTouches[0].clientY;
    stopAuto();
  }, { passive: true });

  container.addEventListener('touchmove', function (e) {
    var dx = e.changedTouches[0].clientX - touchX;
    var dy = e.changedTouches[0].clientY - touchY;
    // only claim the gesture when it is clearly horizontal
    if (Math.abs(dx) > 10 && Math.abs(dx) > Math.abs(dy)) e.preventDefault();
  }, { passive: false });

  container.addEventListener('touchend', function (e) {
    var dx = e.changedTouches[0].clientX - touchX;
    if (Math.abs(dx) > 30) {
      takeControl();
      navigate(dx < 0 ? 1 : -1);
    } else {
      startAuto();
    }
  }, { passive: true });

  /* ---- resize -------------------------------------------------------- */
  var resizeT;
  window.addEventListener('resize', function () {
    clearTimeout(resizeT);
    resizeT = setTimeout(function () {
      snapFromClone();
      applyPositions(true);
    }, 200);
  });

  applyPositions(true);
});
