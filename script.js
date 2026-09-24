(function () {
  "use strict";

  var body = document.body;
  var prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  /* =========================================================
     LOADER
     ========================================================= */
  (function loaderBoot() {
    var loader = document.getElementById("loader");
    var ringFill = document.getElementById("loaderRingFill");
    var pctNum = document.getElementById("loaderPctNum");
    var statusEl = document.getElementById("loaderStatus");
    var CIRC = 339.292;
    var finished = false;

    function setProgress(p) {
      var clamped = Math.max(0, Math.min(100, p));
      if (ringFill) ringFill.style.strokeDashoffset = String(CIRC * (1 - clamped / 100));
      if (pctNum) pctNum.textContent = String(Math.round(clamped));
      if (statusEl) {
        if (clamped < 30) statusEl.textContent = "Iniciando sistema";
        else if (clamped < 70) statusEl.textContent = "Cargando activos";
        else if (clamped < 99) statusEl.textContent = "Sincronizando";
        else statusEl.textContent = "Listo";
      }
    }

    function finishLoader() {
      if (finished) return;
      finished = true;
      setProgress(100);
      window.setTimeout(function () {
        if (loader) loader.classList.add("is-done");
        document.documentElement.classList.remove("is-loading");
        body.classList.add("is-ready");
        window.setTimeout(function () {
          if (loader) loader.classList.add("is-gone");
        }, 1100);
      }, 220);
    }

    if (!loader) {
      document.documentElement.classList.remove("is-loading");
      body.classList.add("is-ready");
      return;
    }

    if (prefersReduced) {
      window.setTimeout(finishLoader, 250);
      return;
    }

    var MIN_MS = 1300;
    var MAX_MS = 2800;
    var started = performance.now();
    var pageLoaded = document.readyState === "complete";
    var shown = 0;
    var target = 0;

    window.addEventListener("load", function () {
      pageLoaded = true;
    });

    function tick(now) {
      var elapsed = now - started;
      var ceiling = pageLoaded ? 100 : 92;
      var paced = Math.min(100, (elapsed / MIN_MS) * 100);
      target = Math.max(target, Math.min(ceiling, paced));
      shown += (target - shown) * 0.15;
      setProgress(shown);

      if ((shown > 99 && elapsed > MIN_MS) || elapsed > MAX_MS) {
        finishLoader();
        return;
      }
      window.requestAnimationFrame(tick);
    }

    window.requestAnimationFrame(tick);
    window.setTimeout(finishLoader, MAX_MS + 300);
  })();

  /* =========================================================
     MOBILE NAV
     ========================================================= */
  (function mobileNav() {
    var toggle = document.getElementById("navToggle");
    var panel = document.getElementById("mobileNav");
    if (!toggle || !panel) return;

    function openNav() {
      body.classList.add("nav-open");
      toggle.setAttribute("aria-expanded", "true");
      panel.setAttribute("aria-hidden", "false");
    }
    function closeNav() {
      body.classList.remove("nav-open");
      toggle.setAttribute("aria-expanded", "false");
      panel.setAttribute("aria-hidden", "true");
    }

    toggle.addEventListener("click", function () {
      if (body.classList.contains("nav-open")) closeNav();
      else openNav();
    });

    panel.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", closeNav);
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") closeNav();
    });

    var desktopMq = window.matchMedia("(min-width: 1024px)");
    desktopMq.addEventListener("change", function (e) {
      if (e.matches) closeNav();
    });
  })();

  /* =========================================================
     REVEAL ON SCROLL
     ========================================================= */
  (function revealSystem() {
    document.querySelectorAll("[data-reveal-group]").forEach(function (group) {
      var items = group.querySelectorAll("[data-reveal]");
      items.forEach(function (el, i) {
        el.style.setProperty("--rd", i * 70 + "ms");
      });
    });

    var targets = document.querySelectorAll("[data-reveal]");
    if (!targets.length) return;

    if (prefersReduced || !("IntersectionObserver" in window)) {
      targets.forEach(function (el) {
        el.classList.add("is-visible");
      });
      return;
    }

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -8% 0px" }
    );

    targets.forEach(function (el) {
      observer.observe(el);
    });
  })();

  /* =========================================================
     ACTIVE NAV LINK ON SCROLL
     ========================================================= */
  (function activeNav() {
    var navLinks = document.querySelectorAll(".nav-link");
    if (!navLinks.length || !("IntersectionObserver" in window)) return;

    var ids = ["inicio", "servicios", "nosotros", "proyectos", "contacto"];
    var sections = ids.map(function (id) {
      return document.getElementById(id);
    }).filter(Boolean);

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          navLinks.forEach(function (link) {
            var match = link.getAttribute("href") === "#" + entry.target.id;
            link.classList.toggle("is-active", match);
          });
        });
      },
      { rootMargin: "-40% 0px -55% 0px", threshold: 0 }
    );

    sections.forEach(function (section) {
      observer.observe(section);
    });
  })();

  /* =========================================================
     PARTICLE FIELD (hero)
     ========================================================= */
  (function particleField() {
    if (prefersReduced) return;
    var canvas = document.getElementById("fieldCanvas");
    var hero = document.getElementById("inicio");
    if (!canvas || !hero || !canvas.getContext) return;

    var ctx = canvas.getContext("2d");
    var w = 0, h = 0, dpr = 1, particles = [], running = false, rafId = null;

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var count = Math.min(64, Math.round((w * h) / 20000));
      particles = [];
      for (var i = 0; i < count; i++) {
        particles.push({
          x: Math.random() * w,
          y: Math.random() * h,
          vx: (Math.random() - 0.5) * 0.24,
          vy: (Math.random() - 0.5) * 0.24,
          r: Math.random() * 1.5 + 0.6
        });
      }
    }

    function tick() {
      if (!running) return;
      ctx.clearRect(0, 0, w, h);

      for (var i = 0; i < particles.length; i++) {
        var p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = w; else if (p.x > w) p.x = 0;
        if (p.y < 0) p.y = h; else if (p.y > h) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(159,196,255,.6)";
        ctx.fill();

        for (var j = i + 1; j < particles.length; j++) {
          var q = particles[j];
          var dx = p.x - q.x, dy = p.y - q.y;
          var dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 118) {
            ctx.strokeStyle = "rgba(94,150,255," + (1 - dist / 118) * 0.2 + ")";
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(q.x, q.y);
            ctx.stroke();
          }
        }
      }
      rafId = window.requestAnimationFrame(tick);
    }

    function start() {
      if (running) return;
      running = true;
      rafId = window.requestAnimationFrame(tick);
    }
    function stop() {
      running = false;
      if (rafId) window.cancelAnimationFrame(rafId);
    }

    resize();

    if ("ResizeObserver" in window) {
      var ro = new ResizeObserver(function () {
        resize();
      });
      ro.observe(canvas);
    } else {
      window.addEventListener("resize", resize);
    }

    if ("IntersectionObserver" in window) {
      var io = new IntersectionObserver(
        function (entries) {
          if (entries[0].isIntersecting) start();
          else stop();
        },
        { threshold: 0 }
      );
      io.observe(hero);
    } else {
      start();
    }

    document.addEventListener("visibilitychange", function () {
      if (document.hidden) stop();
      else if (hero.getBoundingClientRect().top < window.innerHeight) start();
    });
  })();

  /* =========================================================
     GSAP SCROLL CHOREOGRAPHY (with graceful fallback)
     ========================================================= */
  (function scrollFx() {
    var header = document.getElementById("siteHeader");
    var progress = document.getElementById("scrollProgress");
    var hasGSAP = !!(window.gsap && window.ScrollTrigger);

    if (!hasGSAP) {
      if (header) {
        window.addEventListener(
          "scroll",
          function () {
            var y = window.scrollY;
            header.classList.toggle("is-scrolled", y > 10);
            header.classList.toggle("is-compact", y > 80);
          },
          { passive: true }
        );
      }
      return;
    }

    var gsap = window.gsap;
    var ScrollTrigger = window.ScrollTrigger;
    gsap.registerPlugin(ScrollTrigger);

    /* header state + scroll progress, driven by one batched ScrollTrigger
       instead of a raw scroll listener */
    ScrollTrigger.create({
      start: 0,
      end: "max",
      onUpdate: function (self) {
        var y = window.scrollY;
        if (header) {
          header.classList.toggle("is-scrolled", y > 10);
          header.classList.toggle("is-compact", y > 80);
          if (y > 160 && self.direction === 1) header.classList.add("is-hidden");
          else if (self.direction === -1) header.classList.remove("is-hidden");
        }
        if (progress) progress.style.width = self.progress * 100 + "%";
      }
    });

    /* services: sticky media crossfades with the active text block */
    var serviceItems = document.querySelectorAll("[data-service-item]");
    var serviceImgs = document.querySelectorAll("[data-service-img]");
    if (serviceItems.length && serviceImgs.length) {
      serviceItems.forEach(function (item, i) {
        ScrollTrigger.create({
          trigger: item,
          start: "top center",
          end: "bottom center",
          onToggle: function (self) {
            if (!self.isActive) return;
            serviceItems.forEach(function (el) {
              el.classList.remove("is-active");
            });
            serviceImgs.forEach(function (el) {
              el.classList.remove("is-active");
            });
            item.classList.add("is-active");
            if (serviceImgs[i]) serviceImgs[i].classList.add("is-active");
          }
        });
      });
    }

    /* full-bleed banner parallax */
    document.querySelectorAll("[data-parallax]").forEach(function (section) {
      var img = section.querySelector("[data-parallax-img]");
      if (!img) return;
      gsap.fromTo(
        img,
        { yPercent: -10 },
        {
          yPercent: 10,
          ease: "none",
          scrollTrigger: { trigger: section, start: "top bottom", end: "bottom top", scrub: true }
        }
      );
    });

    /* process line fill, desktop only */
    var mm = gsap.matchMedia();
    mm.add("(min-width: 1024px)", function () {
      var fill = document.getElementById("processLineFill");
      var track = document.querySelector(".process-track");
      if (fill && track) {
        gsap.fromTo(
          fill,
          { scaleX: 0 },
          {
            scaleX: 1,
            transformOrigin: "left center",
            ease: "none",
            scrollTrigger: { trigger: track, start: "top 75%", end: "bottom 65%", scrub: true }
          }
        );
      }
    });
  })();

  /* =========================================================
     FAQ ACCORDION
     ========================================================= */
  (function faqAccordion() {
    var items = document.querySelectorAll(".faq-item");
    if (!items.length) return;
    var hasGSAP = !!window.gsap;

    items.forEach(function (item) {
      var button = item.querySelector(".faq-question");
      var answer = item.querySelector(".faq-answer");
      if (!button || !answer) return;

      button.addEventListener("click", function () {
        var expanded = button.getAttribute("aria-expanded") === "true";
        button.setAttribute("aria-expanded", String(!expanded));

        if (!expanded) {
          if (hasGSAP) {
            window.gsap.to(answer, { height: "auto", duration: 0.45, ease: "power2.out" });
          } else {
            answer.style.height = answer.scrollHeight + "px";
          }
        } else {
          if (hasGSAP) {
            window.gsap.to(answer, { height: 0, duration: 0.35, ease: "power2.inOut" });
          } else {
            answer.style.height = "0px";
          }
        }
      });
    });
  })();

  /* =========================================================
     LIGHTBOX GALLERY
     ========================================================= */
  (function lightboxGallery() {
    var items = Array.prototype.slice.call(document.querySelectorAll(".gallery-item"));
    var lightbox = document.getElementById("lightbox");
    if (!items.length || !lightbox) return;

    var imageEl = document.getElementById("lightboxImage");
    var captionEl = document.getElementById("lightboxCaption");
    var currentEl = document.getElementById("lightboxCurrent");
    var totalEl = document.getElementById("lightboxTotal");
    var current = 0;

    if (totalEl) totalEl.textContent = String(items.length);

    function render() {
      var item = items[current];
      var img = item.querySelector("img");
      if (!img || !imageEl) return;
      imageEl.src = img.currentSrc || img.src;
      imageEl.alt = img.alt || "";
      if (captionEl) captionEl.textContent = item.getAttribute("data-caption") || "";
      if (currentEl) currentEl.textContent = String(current + 1);
    }

    function open(index) {
      current = index;
      render();
      lightbox.classList.add("is-open");
      lightbox.setAttribute("aria-hidden", "false");
      body.style.overflow = "hidden";
    }
    function close() {
      lightbox.classList.remove("is-open");
      lightbox.setAttribute("aria-hidden", "true");
      body.style.overflow = "";
    }
    function next() {
      current = (current + 1) % items.length;
      render();
    }
    function prev() {
      current = (current - 1 + items.length) % items.length;
      render();
    }

    items.forEach(function (item, i) {
      item.addEventListener("click", function () {
        open(i);
      });
    });

    lightbox.querySelectorAll("[data-lightbox-close]").forEach(function (btn) {
      btn.addEventListener("click", close);
    });
    var nextBtn = lightbox.querySelector("[data-lightbox-next]");
    var prevBtn = lightbox.querySelector("[data-lightbox-prev]");
    if (nextBtn) nextBtn.addEventListener("click", next);
    if (prevBtn) prevBtn.addEventListener("click", prev);

    document.addEventListener("keydown", function (e) {
      if (!lightbox.classList.contains("is-open")) return;
      if (e.key === "Escape") close();
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") prev();
    });
  })();

  /* =========================================================
     CONTACT FORM -> WHATSAPP
     ========================================================= */
  (function contactForm() {
    var form = document.getElementById("contactForm");
    if (!form) return;

    var WA_NUMBER = "7721513722";
    var fields = ["fieldName", "fieldService", "fieldMessage"].map(function (id) {
      return document.getElementById(id);
    });

    function validateField(field) {
      var row = field.closest(".form-row");
      var valid = field.value.trim() !== "";
      if (row) row.classList.toggle("has-error", !valid);
      return valid;
    }

    fields.forEach(function (field) {
      if (!field) return;
      field.addEventListener("input", function () {
        validateField(field);
      });
      field.addEventListener("change", function () {
        validateField(field);
      });
    });

    form.addEventListener("submit", function (e) {
      e.preventDefault();

      var valid = true;
      var firstInvalid = null;
      fields.forEach(function (field) {
        if (!field) return;
        if (!validateField(field)) {
          valid = false;
          if (!firstInvalid) firstInvalid = field;
        }
      });

      if (!valid) {
        if (firstInvalid) firstInvalid.focus();
        return;
      }

      var nombre = document.getElementById("fieldName").value.trim();
      var telefono = document.getElementById("fieldPhone").value.trim();
      var servicio = document.getElementById("fieldService").value;
      var mensaje = document.getElementById("fieldMessage").value.trim();

      var trail = /[.!?]$/.test(mensaje) ? "" : ".";
      var text = "Hola, me llamo " + nombre + ". Quiero cotizar: " + servicio + ". Detalle: " + mensaje + trail;
      if (telefono) text += " Mi teléfono de contacto: " + telefono + ".";

      var url = "https://wa.me/" + WA_NUMBER + "?text=" + encodeURIComponent(text);
      window.open(url, "_blank", "noopener");
    });
  })();
})();
