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
    const slides = Array.from(photoCarousel.querySelectorAll("[data-photo-slide]"));
    const prevButton = photoCarousel.querySelector("[data-photo-prev]");
    const nextButton = photoCarousel.querySelector("[data-photo-next]");
    let activeIndex = slides.findIndex((slide) => slide.classList.contains("is-active"));

    if (activeIndex < 0) {
      activeIndex = 0;
    }

    const renderPhotoSlide = (nextIndex) => {
      slides.forEach((slide, index) => {
        const isActive = index === nextIndex;
        slide.classList.toggle("is-active", isActive);
        slide.setAttribute("aria-hidden", isActive ? "false" : "true");
      });
      activeIndex = nextIndex;
    };

    const stepPhotoSlide = (direction) => {
      if (!slides.length) return;
      const nextIndex = (activeIndex + direction + slides.length) % slides.length;
      renderPhotoSlide(nextIndex);
    };

    if (slides.length) {
      renderPhotoSlide(activeIndex);
    }

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
    });
  }
});
