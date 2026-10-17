(() => {
  const root = document.documentElement;
  const imagePromises = new WeakMap();
  const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const groups = new Set();
  const initialGroups = [];
  const queuedGroups = new Set();
  let resourcesReady = Promise.resolve();
  let staged = false;
  let revealed = false;

  const finishGroup = (node) => {
    node.removeAttribute("data-arrival");
    node.style.removeProperty("--arrival-delay");
    groups.delete(node);
  };

  const enterGroup = (node, delay = 0) => {
    if (!groups.has(node)) return;
    if (motion.matches) return finishGroup(node);
    node.style.setProperty("--arrival-delay", `${delay}ms`);
    node.setAttribute("data-arrival", "revealing");
    const end = (event) => {
      if (event.target !== node || event.animationName !== "page-materialize") return;
      node.removeEventListener("animationend", end);
      if (groups.has(node)) node.setAttribute("data-arrival", "formed");
    };
    const focused = (event) => {
      if (event.target !== node || event.propertyName !== "filter") return;
      node.removeEventListener("transitionend", focused);
      finishGroup(node);
    };
    node.addEventListener("animationend", end);
    node.addEventListener("transitionend", focused);
    window.setTimeout(() => {
      node.removeEventListener("animationend", end);
      node.removeEventListener("transitionend", focused);
      finishGroup(node);
    }, delay + 2600);
  };

  const startReveal = () => {
    if (revealed) return;
    if (!staged) { root.classList.remove("page-loading"); return; }
    revealed = true;
    clearTimeout(deadline);
    root.classList.remove("page-loading");
    root.classList.add("page-revealing");
    initialGroups.forEach(({ node, delay }) => enterGroup(node, delay));
    queuedGroups.forEach((node) => enterGroup(node, 40));
    queuedGroups.clear();
    Promise.all([
      new Promise((resolve) => window.setTimeout(resolve, motion.matches ? 0 : 820)),
      Promise.race([resourcesReady, new Promise((resolve) => window.setTimeout(resolve, 1100))]),
    ]).then(() => {
      if (!root.classList.contains("page-revealing")) return;
      root.classList.add("page-refining");
      window.setTimeout(() => root.classList.remove("page-revealing", "page-refining"), motion.matches ? 0 : 750);
    });
  };

  const deadline = window.setTimeout(() => {
    stagePage();
    startReveal();
  }, 3000);
  root.classList.add("loading-effects", "page-loading");

  const prepareImage = (image) => {
    // Gallery detail images have no source until requested by the viewer.
    if (!image.hasAttribute("src") && !image.hasAttribute("srcset")) return Promise.resolve(false);
    const source = [image.getAttribute("src"), image.getAttribute("srcset")].join("|");
    const previous = imagePromises.get(image);
    if (previous && previous.source === source) return previous.promise;
    if (previous) previous.cancel();
    const record = { source };
    imagePromises.set(image, record);
    if (previous) image.removeAttribute("data-image-ready");
    image.removeAttribute("data-image-error");

    const ready = new Promise((resolve) => {
      let settled = false;
      const finish = (success, cancelled = false) => {
        if (settled) return;
        settled = true;
        image.removeEventListener("load", loaded);
        image.removeEventListener("error", failed);
        if (!cancelled && imagePromises.get(image) === record) {
          image.setAttribute("data-image-ready", "");
          image.toggleAttribute("data-image-error", !success);
          const surface = image.closest("[data-image-surface]");
          if (surface) surface.toggleAttribute("data-image-settled", success);
        }
        resolve(success);
      };

      const loaded = () => {
        image.removeEventListener("load", loaded);
        image.removeEventListener("error", failed);
        // Wait for decoding as well as downloading to avoid progressive paints.
        if (image.naturalWidth > 0 && typeof image.decode === "function") {
          image.decode().catch(() => {}).then(() => finish(image.naturalWidth > 0));
        } else {
          finish(image.naturalWidth > 0);
        }
      };

      const failed = () => finish(false);
      record.cancel = () => finish(false, true);

      image.addEventListener("load", loaded);
      image.addEventListener("error", failed);
      if (image.complete) loaded();
    });

    record.promise = ready;
    return ready;
  };

  const releaseImage = (image) => {
    const record = imagePromises.get(image);
    if (record) record.cancel();
    imagePromises.delete(image);
    image.removeAttribute("data-image-ready");
    image.removeAttribute("data-image-error");
  };

  const stagePage = () => {
    if (staged || !document.querySelector("[role='main']")) return;
    staged = true;
    const main = document.querySelector("[role='main']");
    const selectors = [
      "[data-arrival-group]", "#navbar .navbar-brand", "#navbar .nav-item", "#navbar .toggle-container",
      "[role='main'] .post-header > *", "[role='main'] .blog-hero-content > *",
      "[role='main'] h1", "[role='main'] h2", "[role='main'] h3", "[role='main'] h4",
      "[role='main'] h5", "[role='main'] h6", "[role='main'] p", "[role='main'] figure",
      "[role='main'] blockquote", "[role='main'] pre", "[role='main'] table",
      "[role='main'] article > ul", "[role='main'] article > ol", "[role='main'] .list-group-item",
      "[role='main'] article > .clearfix > *", "[role='main'] .profile", "[role='main'] .section-title",
      "[role='main'] .bibliography > li:not(.project-entry)", "[role='main'] .project-entry > .title",
      "[role='main'] .project-entry > .author", "[role='main'] .project-entry > .periodical",
      "[role='main'] .project-entry > .abbr", "[role='main'] .project-entry > .links",
      "[role='main'] .project-media-section-title", "[role='main'] .project-media-card", "[role='main'] .project-video-card",
      "[role='main'] .social", "[role='main'] .blog-post-card", "[data-photo-thumb]", "body > footer",
    ];
    // New content blocks inherit the shared entrance even when they use a plain div.
    const textBlocks = Array.from(main.querySelectorAll("div, section, details, summary"))
      .filter((node) => Array.from(node.childNodes).some((child) => child.nodeType === 3 && child.textContent.trim().length > 1));
    const candidates = new Set([...document.querySelectorAll(selectors.join(",")), ...textBlocks]
      .filter((node) => !node.closest("[data-photo-carousel], [hidden], [data-arrival-skip]") && node.getClientRects().length));
    const nodes = Array.from(candidates).filter((node) => {
      for (let parent = node.parentElement; parent; parent = parent.parentElement) {
        if (candidates.has(parent)) return false;
      }
      return true;
    });
    const measured = nodes.map((node) => ({ node, bounds: node.getBoundingClientRect() }));
    const observer = window.IntersectionObserver ? new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) { queuedGroups.delete(entry.target); return; }
        if (root.classList.contains("page-loading")) { queuedGroups.add(entry.target); return; }
        enterGroup(entry.target, 40);
        observer.unobserve(entry.target);
      });
    }, { rootMargin: "0px 0px 40px 0px" }) : null;

    measured.forEach(({ node, bounds }) => {
      if (motion.matches) return;
      groups.add(node);
      node.setAttribute("data-arrival", "pending");
      if (bounds.bottom > 0 && bounds.top < window.innerHeight + 40) {
        const delay = Math.min(180, Math.max(0, Math.round(bounds.top / 90)) * 35);
        initialGroups.push({ node, delay });
      } else if (observer) {
        observer.observe(node);
      } else {
        initialGroups.push({ node, delay: 0 });
      }
    });

    const initialImages = [];
    document.querySelectorAll("img").forEach((image) => {
      const ready = prepareImage(image);
      const bounds = image.getBoundingClientRect();
      if (image.getClientRects().length && !image.closest("[inert], [data-photo-carousel]") &&
          bounds.bottom > 0 && bounds.top < window.innerHeight) initialImages.push(ready);
    });
    if (document.fonts) initialImages.push(document.fonts.ready);
    resourcesReady = Promise.allSettled(initialImages);
    // Embedded previews make the composition complete while detail arrives in the background.
    Promise.race([
      resourcesReady,
      new Promise((resolve) => window.setTimeout(resolve, 240)),
    ]).then(() => requestAnimationFrame(() => requestAnimationFrame(startReveal)));
  };

  const revealPage = () => {
    stagePage();
    startReveal();
  };

  // Share decoding promises with the gallery instead of decoding a second Image.
  window.siteImageLoading = { ready: prepareImage, release: releaseImage, reveal: revealPage, stage: stagePage };

  // Capture images that finish while the browser is still parsing the page.
  ["load", "error"].forEach((eventName) => {
    document.addEventListener(
      eventName,
      (event) => {
        if (event.target instanceof HTMLImageElement) prepareImage(event.target);
      },
      true
    );
  });

  document.addEventListener("DOMContentLoaded", stagePage, { once: true });
  document.addEventListener("focusin", (event) => {
    const group = event.target.closest("[data-arrival]");
    if (group) finishGroup(group);
  });

  window.addEventListener("pageshow", (event) => {
    if (!event.persisted) return;
    clearTimeout(deadline);
    revealed = true;
    root.classList.remove("page-loading", "page-revealing", "page-refining");
    Array.from(groups).forEach(finishGroup);
  });
})();
