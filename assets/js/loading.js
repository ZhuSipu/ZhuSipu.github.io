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

  // Share decoding promises with the gallery instead of decoding a second Image.
  window.siteImageLoading = { ready: prepareImage, release: releaseImage, reveal: revealPage };

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

  document.addEventListener("DOMContentLoaded", () => {
    const aboveTheFold = [];
    document.querySelectorAll("img").forEach((image) => {
      const ready = prepareImage(image);
      const bounds = image.getBoundingClientRect();
      // Hidden carousel slides and offscreen lazy images load independently.
      if (
        image.getClientRects().length && !image.closest("[inert]") &&
        bounds.bottom > 0 && bounds.top < window.innerHeight &&
        bounds.right > 0 && bounds.left < window.innerWidth
      ) {
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
