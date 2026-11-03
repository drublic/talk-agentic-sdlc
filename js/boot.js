/**
 * Load one outline, present one cut.
 * 20: code.talks, linear path, no team deep dives.
 * 60: Digitale Leute, deep dives in the forward path.
 */
(function () {
  var CUT = document.documentElement.getAttribute("data-cut");
  if (CUT !== "20" && CUT !== "60") CUT = "60";

  var EVENT = CUT === "20" ? "code.talks" : "Digitale Leute";

  var FILES = [
    "slides/01-open.html",
    "slides/02-argument.html",
    "slides/03-loop.html",
    "slides/04-twist.html",
    "slides/05-beyond.html",
    "slides/06-close.html",
  ];

  var STATIONS = ["Ticket", "Context", "Spec+Plan", "Build", "Review", "Hand-off"];

  function mountStrips(root) {
    root.querySelectorAll("[data-strip]").forEach(function (el) {
      var mode = el.getAttribute("data-strip") || "map";
      el.classList.add("strip");
      el.setAttribute("aria-label", "Six stations");
      if (mode === "play") el.classList.add("strip-play");
      if (mode === "map") el.classList.add("strip-map");
      el.innerHTML = STATIONS.map(function (name, i) {
        var n = i + 1;
        var cls = "";
        if (mode === String(n)) cls = "now";
        if (mode === "gap" && n === 5) cls = "gap";
        if (mode === "kept" && n === 6) cls = "ok";
        return (
          '<span data-id="st' +
          n +
          '" class="' +
          cls +
          '"><b>' +
          n +
          "</b> " +
          name +
          "</span>"
        );
      }).join("");
    });
  }

  function matches(value, cut) {
    if (!value) return true;
    return value.split(/\s+/).indexOf(cut) !== -1;
  }

  function filter(root, cut) {
    root.querySelectorAll("[data-when]").forEach(function (el) {
      if (!matches(el.getAttribute("data-when"), cut)) el.remove();
    });

    var marked = Array.prototype.slice.call(root.querySelectorAll("[data-cut]"));
    for (var i = marked.length - 1; i >= 0; i--) {
      if (!matches(marked[i].getAttribute("data-cut"), cut)) marked[i].remove();
    }

    Array.prototype.slice
      .call(root.querySelectorAll("section.deck-stack"))
      .forEach(function (stack) {
        var kids = Array.prototype.filter.call(stack.children, function (el) {
          return el.tagName === "SECTION";
        });
        if (!kids.length) {
          stack.remove();
          return;
        }
        if (stack.classList.contains("is-fallback")) return;
        kids.forEach(function (kid) {
          stack.parentNode.insertBefore(kid, stack);
        });
        stack.remove();
      });
  }

  function mountChrome(root) {
    root.querySelectorAll("section[data-s]").forEach(function (section) {
      if (section.getAttribute("data-chrome") === "off") return;
      var bar = document.createElement("div");
      bar.className = "chrome-in";
      bar.innerHTML =
        '<span class="ev"></span><span class="end"><span class="sec"></span><span class="num"></span></span>';
      bar.querySelector(".ev").textContent = EVENT;
      bar.querySelector(".sec").textContent =
        section.getAttribute("data-title") || "";
      section.appendChild(bar);
    });
  }

  function paintCounts() {
    var slides = Reveal.getSlides();
    var total = slides.length;
    for (var i = 0; i < slides.length; i++) {
      var num = slides[i].querySelector(".chrome-in .num");
      if (!num) continue;
      num.textContent = i + 1 + " / " + total;
    }
  }

  function bindVideo() {
    document.querySelectorAll(".slide-background video").forEach(function (video) {
      var hide = function () {
        document.querySelectorAll(".video-fallback").forEach(function (el) {
          el.hidden = true;
        });
      };
      video.addEventListener("canplay", hide);
      if (video.readyState >= 2) hide();
    });
  }

  function bindOpener() {
    function stop() {
      document.querySelectorAll("video.opener-video").forEach(function (video) {
        video.pause();
      });
    }

    function play() {
      stop();
      var slide = Reveal.getCurrentSlide();
      if (!slide) return;
      var video = slide.querySelector("video.opener-video");
      if (!video) return;
      video.currentTime = 0;
      video.muted = false;
      var attempt = video.play();
      if (attempt && attempt.catch) {
        attempt.catch(function () {
          video.muted = true;
          video.play();
        });
      }
    }

    Reveal.on("ready", play);
    Reveal.on("slidechanged", play);
  }

  function start() {
    var minutes = CUT === "20" ? 20 : 50;
    Reveal.initialize({
      hash: true,
      controls: false,
      controlsTutorial: false,
      progress: true,
      slideNumber: false,
      transition: "fade",
      backgroundTransition: "fade",
      center: false,
      width: 1920,
      height: 1080,
      margin: 0,
      minScale: 0.2,
      maxScale: 2,
      totalTime: minutes * 60,
      autoAnimateEasing: "ease-out",
      autoAnimateDuration: 0.4,
      pdfSeparateFragments: false,
      plugins: [RevealNotes],
    }).then(function () {
      paintCounts();
      bindVideo();
      bindOpener();
    });
  }

  var host = document.querySelector(".reveal .slides");
  if (!host) return;

  Promise.all(
    FILES.map(function (file) {
      return fetch(file).then(function (res) {
        if (!res.ok) throw new Error(file + " (" + res.status + ")");
        return res.text();
      });
    }),
  )
    .then(function (parts) {
      var doc = new DOMParser().parseFromString(
        "<div id='root'>" + parts.join("\n") + "</div>",
        "text/html",
      );
      var root = doc.getElementById("root");
      filter(root, CUT);
      mountStrips(root);
      mountChrome(root);
      host.replaceChildren();
      while (root.firstChild) host.appendChild(root.firstChild);
      start();
    })
    .catch(function (err) {
      host.innerHTML =
        '<section data-background-color="oklch(0.16 0.022 285)"><div class="frame"><h2>Slides did not load</h2><p>Run <code>npm start</code> in this folder, then open the local URL. Fetching the slide files needs a server.</p><p>' +
        String(err).replace(/</g, "&lt;") +
        "</p></div></section>";
    });
})();
