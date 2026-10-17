(() => {
  const root = document.documentElement;
  const imagePromises = new WeakMap();
  const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const connection = navigator.connection;
  const mayPrefetch = !connection || (!connection.saveData && !/^(slow-2g|2g)$/.test(connection.effectiveType));
  let staged = false;
  let revealed = false;
  let revealTimer;
  let resolvePage;
  const pageReady = new Promise((resolve) => { resolvePage = resolve; });

  const finishReveal = () => {
    revealed = true;
    clearTimeout(deadline);
    clearTimeout(revealTimer);
    root.classList.remove("page-loading", "page-revealing");
    resolvePage();
  };

  const startReveal = () => {
    if (revealed) return;
    revealed = true;
    clearTimeout(deadline);
    root.classList.remove("page-loading");
    if (motion.matches || window.scrollY > 0 || document.hidden) return finishReveal();
    root.classList.add("page-revealing");
    revealTimer = window.setTimeout(finishReveal, 320);
  };

  const deadline = window.setTimeout(finishReveal, 1800);
  root.classList.add("loading-effects", "page-loading");

  const prepareImage = (image) => {
    // Detail sources are assigned by the photo viewer when they are needed.
    if (!image.hasAttribute("src") && !image.hasAttribute("srcset")) return Promise.resolve(false);
    const pictureSources = image.closest("picture")?.querySelectorAll("source") || [];
    const source = [image.getAttribute("src"), image.getAttribute("srcset"),
      ...Array.from(pictureSources, (item) => item.getAttribute("srcset"))].join("|");
    const previous = imagePromises.get(image);
    if (previous && previous.source === source) return previous.promise;
    if (previous) previous.cancel();
    const record = { source };
    imagePromises.set(image, record);
    if (previous) image.removeAttribute("data-image-ready");
    image.removeAttribute("data-image-error");

    record.promise = new Promise((resolve) => {
      let settled = false;
      const finish = (success, cancelled = false) => {
        if (settled) return;
        settled = true;
        image.removeEventListener("load", loaded);
        image.removeEventListener("error", failed);
        if (!cancelled && imagePromises.get(image) === record) {
          const bounds = image.getBoundingClientRect();
          // Images prepared before reading need no second entrance on scroll.
          image.toggleAttribute("data-image-prepared", root.classList.contains("page-loading") ||
            !image.getClientRects().length || bounds.top >= window.innerHeight || bounds.bottom <= 0);
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
    return record.promise;
  };

  const releaseImage = (image) => {
    const record = imagePromises.get(image);
    if (record) record.cancel();
    imagePromises.delete(image);
    ["data-image-ready", "data-image-error", "data-image-prepared"].forEach((name) => image.removeAttribute(name));
  };

  const stagePage = () => {
    if (staged || !document.querySelector("[role='main']")) return;
    staged = true;
    const critical = [];
    const background = [];
    let firstImage = true;
    const ahead = window.IntersectionObserver ? new IntersectionObserver((entries) => {
      entries.forEach(({ target, isIntersecting }) => {
        if (!isIntersecting) return;
        target.loading = "eager";
        prepareImage(target);
        ahead.unobserve(target);
      });
    }, { rootMargin: mayPrefetch ? "1600px 0px" : "200px 0px" }) : null;

    document.querySelectorAll("img").forEach((image) => {
      if (!image.getClientRects().length || image.closest("[inert], [data-photo-carousel]")) return;
      const bounds = image.getBoundingClientRect();
      const visible = bounds.bottom > 0 && bounds.top < window.innerHeight;
      if (visible) {
        image.loading = "eager";
        if (firstImage) { image.fetchPriority = "high"; firstImage = false; }
        critical.push(prepareImage(image));
      } else {
        prepareImage(image);
        if (ahead) ahead.observe(image);
        else image.loading = "eager";
        background.push(image);
      }
    });
    if (document.fonts) critical.push(document.fonts.ready);
    Promise.race([
      Promise.allSettled(critical),
      new Promise((resolve) => window.setTimeout(resolve, 850)),
    ]).then(() => requestAnimationFrame(startReveal));

    // Prepare the rest of this page at low priority after the initial composition.
    // Two jobs at a time keep long articles from crowding out the current image.
    if (mayPrefetch) pageReady.then(() => {
      let cursor = 0;
      const warm = async () => {
        while (cursor < background.length) {
          const image = background[cursor++];
          if (image.hasAttribute("data-image-ready")) continue;
          image.fetchPriority = "low";
          image.loading = "eager";
          await prepareImage(image);
        }
      };
      warm();
      warm();
    });
  };

  window.siteImageLoading = { ready: prepareImage, release: releaseImage, reveal: finishReveal, stage: stagePage, pageReady };
  ["load", "error"].forEach((eventName) => {
    document.addEventListener(eventName, (event) => {
      if (event.target instanceof HTMLImageElement) prepareImage(event.target);
    }, true);
  });
  document.addEventListener("DOMContentLoaded", stagePage, { once: true });
  // Reading and interaction always take precedence over the introductory effect.
  window.addEventListener("scroll", finishReveal, { once: true, passive: true });
  document.addEventListener("pointerdown", finishReveal, { once: true, passive: true });
  document.addEventListener("keydown", finishReveal, { once: true });
  document.addEventListener("focusin", finishReveal, { once: true });
  window.addEventListener("pageshow", (event) => { if (event.persisted) finishReveal(); });
})();
