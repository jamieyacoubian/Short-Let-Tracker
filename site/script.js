(function () {
  "use strict";

  var toggle = document.getElementById("navToggle");
  var nav = document.getElementById("mainNav");
  if (!toggle || !nav) return;

  function closeNav() {
    nav.classList.remove("open");
    toggle.setAttribute("aria-expanded", "false");
  }

  function openNav() {
    nav.classList.add("open");
    toggle.setAttribute("aria-expanded", "true");
  }

  toggle.addEventListener("click", function () {
    var isOpen = nav.classList.contains("open");
    if (isOpen) {
      closeNav();
    } else {
      openNav();
    }
  });

  nav.querySelectorAll("a").forEach(function (link) {
    link.addEventListener("click", closeNav);
  });

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") closeNav();
  });

  var mediaQuery = window.matchMedia("(min-width: 861px)");
  mediaQuery.addEventListener("change", function (event) {
    if (event.matches) closeNav();
  });
})();
