$(document).ready(function () {
  // add toggle functionality to abstract, award and bibtex buttons
  $("a.abstract").click(function () {
    $(this).parent().parent().find(".abstract.hidden").toggleClass("open");
    $(this).parent().parent().find(".award.hidden.open").toggleClass("open");
    $(this).parent().parent().find(".bibtex.hidden.open").toggleClass("open");
  });
  $("a.award").click(function () {
    $(this).parent().parent().find(".abstract.hidden.open").toggleClass("open");
    $(this).parent().parent().find(".award.hidden").toggleClass("open");
    $(this).parent().parent().find(".bibtex.hidden.open").toggleClass("open");
  });
  $("a.bibtex").click(function () {
    $(this).parent().parent().find(".abstract.hidden.open").toggleClass("open");
    $(this).parent().parent().find(".award.hidden.open").toggleClass("open");
    $(this).parent().parent().find(".bibtex.hidden").toggleClass("open");
  });
  $("a").removeClass("waves-effect waves-light");

  // bootstrap-toc
  if ($("#toc-sidebar").length) {
    // remove related publications years from the TOC
    $(".publications h2").each(function () {
      $(this).attr("data-toc-skip", "");
    });
    var navSelector = "#toc-sidebar";
    var $myNav = $(navSelector);
    Toc.init($myNav);
    $("body").scrollspy({
      target: navSelector,
      offset: 100,
    });
  }

  // add css to jupyter notebooks
  const cssLink = document.createElement("link");
  cssLink.href = "../css/jupyter.css";
  cssLink.rel = "stylesheet";
  cssLink.type = "text/css";

  let jupyterTheme = determineComputedTheme();

  $(".jupyter-notebook-iframe-container iframe").each(function () {
    $(this).contents().find("head").append(cssLink);

    if (jupyterTheme == "dark") {
      $(this).bind("load", function () {
        $(this).contents().find("body").attr({
          "data-jp-theme-light": "false",
          "data-jp-theme-name": "JupyterLab Dark",
        });
      });
    }
  });

  // trigger popovers
  $('[data-toggle="popover"]').popover({
    trigger: "hover",
  });

  const photoCarousel = document.querySelector("[data-photo-carousel]");
  if (photoCarousel) {
    const PHOTO_MODE_DURATION_MS = 380;
    const PHOTO_SLIDE_DURATION_MS = 420;
    const photoOverview = document.querySelector("[data-photo-overview]");
    const photoThumbs = Array.from(document.querySelectorAll("[data-photo-thumb]"));
    const photoBackButtons = Array.from(document.querySelectorAll("[data-photo-back]"));
    const photoCarouselStage = photoCarousel.querySelector(".photo-carousel-stage");
    const slides = Array.from(photoCarousel.querySelectorAll("[data-photo-slide]"));
    const prevButton = photoCarousel.querySelector("[data-photo-prev]");
    const nextButton = photoCarousel.querySelector("[data-photo-next]");
    const photoImages = Array.from(document.querySelectorAll(".photo-gallery img"));
    let activeIndex = slides.findIndex((slide) => slide.classList.contains("is-active"));
    let isTransitioning = false;

    if (activeIndex < 0) {
      activeIndex = 0;
    }

    const markImageAsLoaded = (image) => {
      if (!image) return;
      if (image.complete) {
        image.classList.add("is-loaded");
        window.requestAnimationFrame(updatePhotoStageMetrics);
        return;
      }
      image.addEventListener(
        "load",
        () => {
          image.classList.add("is-loaded");
          window.requestAnimationFrame(updatePhotoStageMetrics);
        },
        { once: true }
      );
    };

    const preloadPhotoImage = (index) => {
      const slide = slides[index];
      if (!slide) return;
      const image = slide.querySelector("img");
      if (!image || !image.currentSrc) return;

      const preload = new Image();
      preload.decoding = "async";
      preload.src = image.currentSrc;
    };

    const updatePhotoStageMetrics = () => {
      if (!photoCarouselStage) return;

      const activeSlide = slides[activeIndex];
      const activeImage = activeSlide ? activeSlide.querySelector(".photo-feature-image img") : null;

      if (!activeImage) return;

      const stageRect = photoCarouselStage.getBoundingClientRect();
      const imageRect = activeImage.getBoundingClientRect();

      if (!stageRect.width || !imageRect.width) return;

      const imageLeft = Math.max(0, imageRect.left - stageRect.left);
      const imageRight = Math.max(0, stageRect.right - imageRect.right);

      photoCarouselStage.style.setProperty("--photo-image-left", `${imageLeft}px`);
      photoCarouselStage.style.setProperty("--photo-image-right", `${imageRight}px`);
      photoCarouselStage.style.setProperty("--photo-image-width", `${imageRect.width}px`);
    };

    const updateThumbSelection = () => {
      photoThumbs.forEach((thumb, index) => {
        thumb.classList.toggle("is-selected", index === activeIndex && !photoOverview.hidden);
      });
    };

    const renderPhotoSlide = (nextIndex, direction = 0, immediate = false) => {
      const currentSlide = slides[activeIndex];
      const nextSlide = slides[nextIndex];

      if (!nextSlide || currentSlide === nextSlide) {
        activeIndex = nextIndex;
        if (nextSlide) {
          nextSlide.classList.add("is-active");
          nextSlide.setAttribute("aria-hidden", "false");
        }
        window.requestAnimationFrame(updatePhotoStageMetrics);
        preloadPhotoImage(nextIndex);
        preloadPhotoImage((nextIndex + 1) % slides.length);
        preloadPhotoImage((nextIndex - 1 + slides.length) % slides.length);
        updateThumbSelection();
        return;
      }

      slides.forEach((slide, index) => {
        if (index !== activeIndex && index !== nextIndex) {
          slide.classList.remove("is-active", "is-entering", "is-exiting", "from-next", "from-prev", "to-next", "to-prev");
          slide.setAttribute("aria-hidden", "true");
        }
      });

      if (immediate || direction === 0) {
        if (currentSlide) {
          currentSlide.classList.remove("is-active", "is-entering", "is-exiting", "from-next", "from-prev", "to-next", "to-prev");
          currentSlide.setAttribute("aria-hidden", "true");
        }
        nextSlide.classList.remove("is-entering", "is-exiting", "from-next", "from-prev", "to-next", "to-prev");
        nextSlide.classList.add("is-active");
        nextSlide.setAttribute("aria-hidden", "false");
        activeIndex = nextIndex;
        window.requestAnimationFrame(updatePhotoStageMetrics);
        preloadPhotoImage(nextIndex);
        preloadPhotoImage((nextIndex + 1) % slides.length);
        preloadPhotoImage((nextIndex - 1 + slides.length) % slides.length);
        updateThumbSelection();
        return;
      }

      isTransitioning = true;

      const incomingDirectionClass = direction > 0 ? "from-next" : "from-prev";
      const outgoingDirectionClass = direction > 0 ? "to-next" : "to-prev";

      nextSlide.classList.remove("is-exiting", "to-next", "to-prev");
      nextSlide.classList.add("is-active", "is-entering", incomingDirectionClass);
      nextSlide.setAttribute("aria-hidden", "false");

      if (currentSlide) {
        currentSlide.classList.remove("is-entering", "from-next", "from-prev");
        currentSlide.classList.add("is-active", "is-exiting", outgoingDirectionClass);
        currentSlide.setAttribute("aria-hidden", "true");
      }

      requestAnimationFrame(() => {
        nextSlide.classList.remove("is-entering", "from-next", "from-prev");
      });

      window.setTimeout(() => {
        if (currentSlide) {
          currentSlide.classList.remove("is-active", "is-exiting", "to-next", "to-prev");
        }
        nextSlide.classList.remove("is-entering", "from-next", "from-prev", "is-exiting", "to-next", "to-prev");
        nextSlide.classList.add("is-active");
        activeIndex = nextIndex;
        isTransitioning = false;
        window.requestAnimationFrame(updatePhotoStageMetrics);
        preloadPhotoImage(nextIndex);
        preloadPhotoImage((nextIndex + 1) % slides.length);
        preloadPhotoImage((nextIndex - 1 + slides.length) % slides.length);
        updateThumbSelection();
      }, PHOTO_SLIDE_DURATION_MS);
    };

    const showPhotoOverview = () => {
      if (!photoOverview) return;
      photoOverview.hidden = false;
      requestAnimationFrame(() => {
        photoOverview.classList.add("is-visible");
      });
    };

    const hidePhotoOverview = () => {
      if (!photoOverview) return;
      photoOverview.classList.remove("is-visible");
      window.setTimeout(() => {
        if (document.body.classList.contains("photo-gallery-detail-mode")) {
          photoOverview.hidden = true;
        }
      }, PHOTO_MODE_DURATION_MS);
    };

    const showPhotoDetail = () => {
      photoCarousel.hidden = false;
      requestAnimationFrame(() => {
        photoCarousel.classList.add("is-visible");
        updatePhotoStageMetrics();
      });
    };

    const hidePhotoDetail = () => {
      photoCarousel.classList.remove("is-visible");
      window.setTimeout(() => {
        if (!document.body.classList.contains("photo-gallery-detail-mode")) {
          photoCarousel.hidden = true;
        }
      }, PHOTO_MODE_DURATION_MS);
    };

    const setPhotoMode = (detailMode) => {
      document.body.classList.toggle("photo-gallery-detail-mode", detailMode);
      if (detailMode) {
        hidePhotoOverview();
        showPhotoDetail();
      } else {
        hidePhotoDetail();
        showPhotoOverview();
      }
      updateThumbSelection();
    };

    const openPhotoDetail = (nextIndex) => {
      renderPhotoSlide(nextIndex, nextIndex >= activeIndex ? 1 : -1, true);
      setPhotoMode(true);
      photoCarousel.focus();
    };

    const closePhotoDetail = () => {
      setPhotoMode(false);
    };

    const stepPhotoSlide = (direction) => {
      if (!slides.length || isTransitioning) return;
      const nextIndex = (activeIndex + direction + slides.length) % slides.length;
      renderPhotoSlide(nextIndex, direction);
    };

    photoImages.forEach(markImageAsLoaded);
    window.addEventListener("resize", () => {
      window.requestAnimationFrame(updatePhotoStageMetrics);
    });

    if (slides.length) {
      renderPhotoSlide(activeIndex, 0, true);
    }

    showPhotoOverview();
    photoCarousel.hidden = true;

    photoThumbs.forEach((thumb) => {
      thumb.addEventListener("click", () => {
        const nextIndex = Number(thumb.getAttribute("data-photo-index") || "0");
        photoThumbs.forEach((item) => item.classList.remove("is-selected"));
        thumb.classList.add("is-selected");
        openPhotoDetail(nextIndex);
      });
    });

    photoBackButtons.forEach((button) => {
      button.addEventListener("click", closePhotoDetail);
    });

    if (prevButton) {
      prevButton.addEventListener("click", () => stepPhotoSlide(-1));
    }

    if (nextButton) {
      nextButton.addEventListener("click", () => stepPhotoSlide(1));
    }

    photoCarousel.addEventListener("keydown", (event) => {
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        stepPhotoSlide(-1);
      }
      if (event.key === "ArrowRight") {
        event.preventDefault();
        stepPhotoSlide(1);
      }
      if (event.key === "Escape") {
        event.preventDefault();
        closePhotoDetail();
      }
    });
  }
});
