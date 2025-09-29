/* ===========================
   Sorell - Main Script
   =========================== */

/* ========== Mobile Nav Toggle ========== */
const navToggle = document.querySelector(".navbar-toggler");
const offcanvas = document.querySelector("#offcanvasNavbar2");

if (navToggle && offcanvas) {
  navToggle.addEventListener("click", () => {
    offcanvas.classList.toggle("show");
  });

  document.querySelectorAll(".offcanvas .nav-link").forEach(link => {
    link.addEventListener("click", () => {
      offcanvas.classList.remove("show");
    });
  });
}

/* ========== Swiper Sliders ========== */
// Client logo slider
if (document.querySelector(".marquee-slider")) {
  new Swiper(".marquee-slider", {
    slidesPerView: 4,
    spaceBetween: 30,
    loop: true,
    autoplay: {
      delay: 2000,
      disableOnInteraction: false,
    },
    breakpoints: {
      320: { slidesPerView: 2 },
      640: { slidesPerView: 3 },
      1024: { slidesPerView: 5 }
    }
  });
}

// Black theme slider
if (document.querySelector(".blackTheme-slider")) {
  new Swiper(".blackTheme-slider", {
    slidesPerView: 1,
    spaceBetween: 24,
    loop: true,
    autoplay: {
      delay: 3000,
      disableOnInteraction: false,
    },
    pagination: {
      el: ".swiper-pagination",
      clickable: true,
    },
    navigation: {
      nextEl: ".swiper-button-next-unique",
      prevEl: ".swiper-button-prev-unique",
    },
    breakpoints: {
      768: { slidesPerView: 2 },
      1200: { slidesPerView: 3 },
    }
  });
}

/* ========== GSAP Animations ========== */
if (typeof gsap !== "undefined" && typeof ScrollTrigger !== "undefined") {
  gsap.utils.toArray(".gs_reveal").forEach(function (elem) {
    ScrollTrigger.create({
      trigger: elem,
      onEnter: function () {
        gsap.fromTo(
          elem,
          { autoAlpha: 0, y: 40 },
          { duration: 1, autoAlpha: 1, y: 0, overwrite: "auto" }
        );
      },
      once: true,
    });
  });
}

/* ========== Smooth Scroll for Anchor Links ========== */
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener("click", function (e) {
    const target = document.querySelector(this.getAttribute("href"));
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: "smooth" });
    }
  });
});

/* ========== Placeholder for Future AI/CTA ========== */
document.querySelectorAll("[data-action='cta']").forEach(btn => {
  btn.addEventListener("click", () => {
    alert("🚀 Sorell CTA Triggered — Connect to backend later!");
  });
});
