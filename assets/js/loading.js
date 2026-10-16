(() => {
  const root = document.documentElement;
  const imagePromises = new WeakMap();
  let revealed = false;

  const revealPage = () => {
    if (revealed) return;
    revealed = true;
    clearTimeout(deadline);
    root.classList.replace("page-loading", "page-revealing");
    window.setTimeout(() => root.classList.remove("page-revealing"), 850);
  };

  // A slow external resource must not leave the page behind frosted glass.
  const deadline = window.setTimeout(revealPage, 4000);
  root.classList.add("loading-effects", "page-loading");

  const prepareImage = (image) => {
    if (imagePromises.has(image)) return imagePromises.get(image);

    const ready = new Promise((resolve) => {
      const reveal = () => {
        image.setAttribute("data-image-ready", "");
        resolve();
      };

      const loaded = () => {
        image.removeEventListener("load", loaded);
        image.removeEventListener("error", failed);
        // Wait for decoding as well as downloading to avoid progressive paints.
        if (image.naturalWidth > 0 && typeof image.decode === "function") {
          image.decode().catch(() => {}).then(reveal);
        } else {
          reveal();
        }
      };

      const failed = () => {
        image.removeEventListener("load", loaded);
        image.removeEventListener("error", failed);
        reveal();
      };

      image.addEventListener("load", loaded);
      image.addEventListener("error", failed);
      if (image.complete) loaded();
    });

    imagePromises.set(image, ready);
    return ready;
  };

  // Capture images that finish while the browser is still parsing the page.
  ["load", "error"].forEach((eventName) => {
    document.addEventListener(eventName, (event) => {
      if (event.target instanceof HTMLImageElement) prepareImage(event.target);
    }, true);
  });

  document.addEventListener("DOMContentLoaded", () => {
    const aboveTheFold = [];
    document.querySelectorAll("img").forEach((image) => {
      const ready = prepareImage(image);
      const bounds = image.getBoundingClientRect();
      // Hidden carousel slides and offscreen lazy images load independently.
      if (image.getClientRects().length && bounds.bottom > 0 && bounds.top < window.innerHeight &&
          bounds.right > 0 && bounds.left < window.innerWidth) {
        aboveTheFold.push(ready);
      }
    });

    if (document.fonts) aboveTheFold.push(document.fonts.ready);
    Promise.allSettled(aboveTheFold).then(() => {
      // Paint the frosted state before starting the transition, even from cache.
      requestAnimationFrame(() => requestAnimationFrame(revealPage));
    });
  }, { once: true });

  window.addEventListener("pageshow", (event) => {
    if (!event.persisted) return;
    clearTimeout(deadline);
    revealed = true;
    root.classList.remove("page-loading", "page-revealing");
  });
})();
