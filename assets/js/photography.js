(() => {
  const gallery = document.querySelector("[data-photo-gallery]");
  if (!gallery) return;
  const viewer = gallery.querySelector("[data-photo-carousel]");
  const slides = Array.from(gallery.querySelectorAll("[data-photo-slide]"));
  const thumbs = Array.from(gallery.querySelectorAll("[data-photo-thumb]"));
  if (!viewer || !slides.length) return;

  const images = slides.map((slide) => slide.querySelector("[data-photo-full]"));
  const frames = slides.map((slide) => slide.querySelector("[data-photo-frame]"));
  const jobs = new Map();
  const background = new Map();
  const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const connection = navigator.connection;
  let opened = false;
  let activeIndex = -1;
  let generation = 0;
  let transitionTimer;
  let modeTimer;
  let warmTimer;
  let cancelIdle = () => {};
  let stopTransitionListener = () => {};
  let opener;
  let scrollPosition = [0, 0];
  const wrap = (index) => (index + slides.length) % slides.length;
  const mayPrefetch = () => !connection || (!connection.saveData && !/^(slow-2g|2g)$/.test(connection.effectiveType));

  const imageWidth = (index) => {
    const mobile = window.innerWidth <= 768;
    const height = parseFloat(viewer.style.getPropertyValue("--photo-detail-viewport-height")) || window.innerHeight;
    const ratio = parseFloat(frames[index].style.getPropertyValue("--photo-ratio")) || 1.5;
    return Math.max(1, Math.ceil(Math.min(window.innerWidth - (mobile ? 128 : 160), 1240, (height - (mobile ? 96 : 128)) * ratio)));
  };

  const updateViewport = () => {
    const navbar = document.querySelector("#navbar");
    const top = navbar ? Math.ceil(navbar.getBoundingClientRect().bottom) : 0;
    const height = window.visualViewport ? window.visualViewport.height : window.innerHeight;
    viewer.style.setProperty("--photo-detail-nav-height", `${top}px`);
    viewer.style.setProperty("--photo-detail-viewport-height", `${Math.max(0, height - top)}px`);
    jobs.forEach((_, index) => { images[index].sizes = `${imageWidth(index)}px`; });
  };

  const releasePhoto = (index) => {
    jobs.delete(index);
    const image = images[index];
    if (window.siteImageLoading) window.siteImageLoading.release(image);
    image.removeAttribute("src");
    image.removeAttribute("srcset");
    frames[index].classList.remove("is-ready");
    slides[index].querySelector("[data-photo-error]").hidden = true;
  };

  const trimPhotos = (keep) => {
    Array.from(jobs.keys()).forEach((index) => {
      if (!keep.includes(index)) releasePhoto(index);
    });
  };

  const loadPhoto = (index, priority = "low") => {
    const image = images[index];
    if (priority === "high" || !jobs.has(index)) image.fetchPriority = priority;
    if (jobs.has(index)) return jobs.get(index).promise;
    const job = {};
    jobs.set(index, job);
    frames[index].setAttribute("aria-busy", "true");
    image.sizes = `${imageWidth(index)}px`;
    if (image.dataset.photoSrcset) image.srcset = image.dataset.photoSrcset;
    image.src = image.dataset.photoSrc;
    const ready = window.siteImageLoading ? window.siteImageLoading.ready(image) : image.decode().then(() => true, () => false);
    job.promise = ready.then((success) => {
      if (jobs.get(index) !== job) return false;
      frames[index].classList.toggle("is-ready", success);
      frames[index].setAttribute("aria-busy", "false");
      slides[index].querySelector("[data-photo-error]").hidden = success;
      return success;
    });
    return job.promise;
  };

  const prepareNeighbors = (token) => {
    if (!opened || token !== generation || !mayPrefetch()) return;
    const neighbors = [wrap(activeIndex + 1)];
    if (!connection || connection.effectiveType !== "3g") neighbors.push(wrap(activeIndex - 1));
    const run = () => {
      for (const index of new Set(neighbors)) {
        if (!opened || token !== generation) return;
        loadPhoto(index);
      }
    };
    if (window.requestIdleCallback) {
      const id = window.requestIdleCallback(run, { timeout: 160 });
      cancelIdle = () => window.cancelIdleCallback(id);
    } else {
      const id = window.setTimeout(run, 40);
      cancelIdle = () => clearTimeout(id);
    }
  };

  const finishTransition = () => {
    clearTimeout(transitionTimer);
    stopTransitionListener();
    stopTransitionListener = () => {};
    slides.forEach((slide, index) => {
      slide.classList.remove("is-entering", "is-exiting", "from-next", "from-prev", "to-next", "to-prev");
      slide.hidden = index !== activeIndex;
      slide.inert = index !== activeIndex;
      slide.classList.toggle("is-active", index === activeIndex);
      slide.setAttribute("aria-hidden", String(index !== activeIndex));
    });
  };

  const selectPhoto = (index, direction = 0) => {
    cancelIdle();
    finishTransition();
    const previous = slides[activeIndex];
    const next = slides[index];
    const focused = document.activeElement;
    activeIndex = index;
    const token = ++generation;
    next.hidden = false;
    next.inert = false;
    next.setAttribute("aria-hidden", "false");
    next.classList.add("is-active");
    const preview = next.querySelector(".photo-feature-preview");
    const thumbnail = thumbs[index].querySelector("img");
    if (thumbnail.naturalWidth && thumbnail.hasAttribute("data-image-ready")) {
      preview.src = thumbnail.currentSrc || thumbnail.src;
      preview.classList.add("has-thumbnail");
      if (window.siteImageLoading) window.siteImageLoading.ready(preview);
    }
    thumbs.forEach((thumb, i) => thumb.setAttribute("aria-current", String(i === index)));
    if (previous && previous !== next && direction && !motion.matches) {
      previous.inert = true;
      previous.setAttribute("aria-hidden", "true");
      previous.classList.add("is-exiting", direction > 0 ? "to-next" : "to-prev");
      next.classList.add("is-entering", direction > 0 ? "from-next" : "from-prev");
      // Commit the entering state once; subsequent input can replace this transition.
      next.getBoundingClientRect();
      requestAnimationFrame(() => {
        if (token === generation) next.classList.remove("is-entering", "from-next", "from-prev");
      });
      const ended = (event) => {
        if (event.target === next && event.propertyName === "transform" && token === generation) finishTransition();
      };
      next.addEventListener("transitionend", ended);
      stopTransitionListener = () => next.removeEventListener("transitionend", ended);
      transitionTimer = window.setTimeout(finishTransition, 420);
    } else {
      finishTransition();
    }
    if (previous && previous.contains(focused)) {
      const control = focused.matches("[data-photo-next]") ? "[data-photo-next]" : focused.matches("[data-photo-prev]") ? "[data-photo-prev]" : "[data-photo-back]";
      next.querySelector(control).focus({ preventScroll: true });
    }
    trimPhotos([index, wrap(index - 1), wrap(index + 1)]);
    loadPhoto(index, "high");
    prepareNeighbors(token);
  };

  const setBackgroundInert = (value) => {
    if (!value) {
      background.forEach((inert, element) => { element.inert = inert; });
      background.clear();
      return;
    }
    for (let branch = viewer; branch.parentElement; branch = branch.parentElement) {
      Array.from(branch.parentElement.children).forEach((element) => {
        if (element !== branch && !element.matches("#navbar") && !element.querySelector("#navbar") && !/^(SCRIPT|STYLE|LINK)$/.test(element.tagName)) {
          background.set(element, element.inert);
          element.inert = true;
        }
      });
      if (branch.parentElement === document.body) break;
    }
  };

  const openPhoto = (index, trigger) => {
    clearTimeout(modeTimer);
    clearTimeout(warmTimer);
    if (!opened) {
      opener = trigger;
      scrollPosition = [window.scrollX, window.scrollY];
      setBackgroundInert(true);
    }
    opened = true;
    viewer.hidden = false;
    viewer.inert = false;
    document.body.classList.add("photo-gallery-detail-mode");
    updateViewport();
    selectPhoto(index);
    viewer.focus({ preventScroll: true });
    if (window.siteImageLoading) window.siteImageLoading.reveal();
    requestAnimationFrame(() => { if (opened) viewer.classList.add("is-visible"); });
  };

  const closePhoto = () => {
    if (!opened) return;
    opened = false;
    ++generation;
    cancelIdle();
    finishTransition();
    viewer.inert = true;
    viewer.classList.remove("is-visible");
    document.body.classList.remove("photo-gallery-detail-mode");
    setBackgroundInert(false);
    if (opener && opener.isConnected) opener.focus({ preventScroll: true });
    window.scrollTo(...scrollPosition);
    modeTimer = window.setTimeout(() => {
      if (opened) return;
      viewer.hidden = true;
    }, motion.matches ? 0 : 380);
  };

  thumbs.forEach((thumb, index) => {
    thumb.addEventListener("click", (event) => {
      if (event.button || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      openPhoto(index, thumb);
    });
    const warm = () => {
      clearTimeout(warmTimer);
      if (opened || !viewer.hidden || !mayPrefetch()) return;
      warmTimer = window.setTimeout(() => {
        if (opened || !viewer.hidden) return;
        updateViewport();
        trimPhotos([index]);
        loadPhoto(index);
      }, 140);
    };
    thumb.addEventListener("pointerenter", (event) => { if (event.pointerType !== "touch") warm(); });
    thumb.addEventListener("focus", warm);
    thumb.addEventListener("pointerleave", () => clearTimeout(warmTimer));
    thumb.addEventListener("blur", () => clearTimeout(warmTimer));
  });

  // Prepare the first likely selections after the overview is clear and decoded.
  // Keep these decoded images available when the viewer closes and reopens.
  const overviewReady = window.siteImageLoading ? window.siteImageLoading.pageReady : Promise.resolve();
  overviewReady.then(async () => {
    if (!mayPrefetch()) return;
    if (window.siteImageLoading) await Promise.all(thumbs.map((thumb) => window.siteImageLoading.ready(thumb.querySelector("img"))));
    const warmOverview = () => {
      if (opened || !viewer.hidden || document.hidden || jobs.size || !mayPrefetch()) return;
      updateViewport();
      const first = mayPrefetch() && (!connection || connection.effectiveType !== "3g") ? [0, wrap(1)] : [0];
      trimPhotos(first);
      first.forEach((index) => loadPhoto(index));
    };
    if (window.requestIdleCallback) window.requestIdleCallback(warmOverview, { timeout: 500 });
    else window.setTimeout(warmOverview, 120);
  });

  viewer.addEventListener("click", (event) => {
    if (event.target.closest("[data-photo-back]")) closePhoto();
    if (event.target.closest("[data-photo-next]") && opened) selectPhoto(wrap(activeIndex + 1), 1);
    if (event.target.closest("[data-photo-prev]") && opened) selectPhoto(wrap(activeIndex - 1), -1);
    if (event.target.closest("[data-photo-retry]") && opened) {
      releasePhoto(activeIndex);
      const token = generation;
      loadPhoto(activeIndex, "high").then((success) => { if (success) prepareNeighbors(token); });
    }
  });

  document.addEventListener("keydown", (event) => {
    if (!opened || event.altKey || event.ctrlKey || event.metaKey) return;
    if (event.key === "Escape") { event.preventDefault(); closePhoto(); }
    if ((event.key === "ArrowLeft" || event.key === "ArrowRight") && viewer.contains(event.target)) {
      event.preventDefault();
      const direction = event.key === "ArrowRight" ? 1 : -1;
      selectPhoto(wrap(activeIndex + direction), direction);
    }
  });

  const navbar = document.querySelector("#navbar");
  if (navbar && window.ResizeObserver) new ResizeObserver(updateViewport).observe(navbar);
  if (navbar) navbar.addEventListener("click", (event) => {
    const link = event.target.closest("a[href]");
    if (!opened || !link || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const destination = new URL(link.href, window.location.href);
    if (destination.pathname === window.location.pathname && destination.origin === window.location.origin && !destination.hash) {
      event.preventDefault();
      closePhoto();
    }
  });

  let touch;
  viewer.addEventListener("pointerdown", (event) => {
    if (event.isPrimary && event.pointerType === "touch" && event.target.closest("[data-photo-frame]")) {
      touch = { id: event.pointerId, x: event.clientX, y: event.clientY };
    } else { touch = null; }
  });
  viewer.addEventListener("pointerup", (event) => {
    if (!opened || !touch || touch.id !== event.pointerId) return;
    const x = event.clientX - touch.x;
    const y = event.clientY - touch.y;
    touch = null;
    if (Math.abs(x) > 45 && Math.abs(x) > Math.abs(y) * 1.25) selectPhoto(wrap(activeIndex + (x < 0 ? 1 : -1)), x < 0 ? 1 : -1);
  });
  viewer.addEventListener("pointercancel", () => { touch = null; });
  window.addEventListener("resize", updateViewport, { passive: true });
  if (window.visualViewport) window.visualViewport.addEventListener("resize", updateViewport, { passive: true });
  document.documentElement.style.scrollbarGutter = "stable";
  viewer.inert = true;
})();
