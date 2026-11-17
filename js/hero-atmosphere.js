/* Homepage hero atmosphere (hansreinl.de) for the title slide.
   Low-res domain-warped noise, upscaled soft. Vital intensity. */
(function (global) {
  "use strict";

  function mountHeroAtmosphere(host, options) {
    options = options || {};
    var intensity = options.intensity || "vital";
    var media = host.querySelector(".title-media");
    if (!media) {
      media = document.createElement("div");
      media.className = "title-media";
      media.setAttribute("aria-hidden", "true");
      host.insertBefore(media, host.firstChild);
    }

    var canvas = media.querySelector("canvas.title-atmosphere");
    if (!canvas) {
      canvas = document.createElement("canvas");
      canvas.className = "title-atmosphere";
      canvas.setAttribute("aria-hidden", "true");
      media.insertBefore(canvas, media.firstChild);
    }

    var veil = media.querySelector(".title-veil");
    if (!veil) {
      veil = document.createElement("div");
      veil.className = "title-veil";
      media.appendChild(veil);
    }

    var ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return { destroy: function () {} };

    var reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    var raf = 0;
    var running = !reduced.matches;
    var width = 0;
    var height = 0;
    var lastPaint = 0;

    var vital = intensity === "vital";
    var timeScale = vital ? 0.00026 : 0.00012;
    var frameMs = vital ? 18 : 33;
    var warpAmp = vital ? 1.85 : 1.35;
    var fieldContrast = vital ? 1.28 : 0.85;
    var biasStrength = vital ? 0.38 : 0.45;
    var toneLift = vital ? 0.24 : 0.18;
    var vignetteAlpha = vital ? 0.84 : 0.55;

    var COLS = 72;
    var ROWS = 40;

    function hash(x, y) {
      var s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
      return s - Math.floor(s);
    }

    function smoothNoise(x, y) {
      var x0 = Math.floor(x);
      var y0 = Math.floor(y);
      var xf = x - x0;
      var yf = y - y0;
      var u = xf * xf * (3 - 2 * xf);
      var v = yf * yf * (3 - 2 * yf);
      var n00 = hash(x0, y0);
      var n10 = hash(x0 + 1, y0);
      var n01 = hash(x0, y0 + 1);
      var n11 = hash(x0 + 1, y0 + 1);
      var nx0 = n00 * (1 - u) + n10 * u;
      var nx1 = n01 * (1 - u) + n11 * u;
      return nx0 * (1 - v) + nx1 * v;
    }

    function fbm(x, y) {
      var value = 0;
      var amp = 0.5;
      var freq = 1;
      for (var i = 0; i < 3; i += 1) {
        value += amp * smoothNoise(x * freq, y * freq);
        freq *= 2.05;
        amp *= 0.5;
      }
      return value;
    }

    function mix(a, b, t) {
      return a + (b - a) * t;
    }

    function palette(t) {
      var stops = vital
        ? [
            [0, 0, 1, 2],
            [0.28, 1, 10, 14],
            [0.46, 28, 12, 150],
            [0.64, 165, 38, 235],
            [0.82, 255, 82, 36],
            [1, 255, 168, 62],
          ]
        : [
            [0, 8, 14, 18],
            [0.28, 18, 42, 58],
            [0.48, 72, 40, 170],
            [0.68, 150, 70, 210],
            [0.84, 230, 105, 70],
            [1, 255, 150, 90],
          ];

      for (var i = 0; i < stops.length - 1; i += 1) {
        var a = stops[i];
        var b = stops[i + 1];
        if (t >= a[0] && t <= b[0]) {
          var u = (t - a[0]) / (b[0] - a[0]);
          return [
            mix(a[1], b[1], u),
            mix(a[2], b[2], u),
            mix(a[3], b[3], u),
          ];
        }
      }
      return vital ? [0, 1, 2] : [8, 14, 18];
    }

    function resize() {
      width = host.clientWidth || 1920;
      height = host.clientHeight || 1080;
      canvas.width = COLS;
      canvas.height = ROWS;
      canvas.style.width = width + "px";
      canvas.style.height = height + "px";
    }

    function paint(time) {
      var t = time * timeScale;
      var image = ctx.createImageData(COLS, ROWS);
      var data = image.data;

      for (var y = 0; y < ROWS; y += 1) {
        for (var x = 0; x < COLS; x += 1) {
          var nx = x / COLS;
          var ny = y / ROWS;
          var warpX = fbm(nx * 1.6 + t * 0.7, ny * 1.4 - t * 0.35) * warpAmp;
          var warpY = fbm(nx * 1.3 - t * 0.45, ny * 1.7 + t * 0.55) * warpAmp;
          var n1 = fbm(nx * 2.2 + warpX + t, ny * 2.0 + warpY - t * 0.6);
          var n2 = fbm(
            nx * 3.1 - warpY * 0.8 - t * 0.4,
            ny * 2.6 + warpX * 0.7 + t * 0.5
          );
          var field = n1 * 0.72 + n2 * 0.28;
          var bias = Math.pow(nx * 0.55 + ny * 0.7, vital ? 1.45 : 1.35);
          var tone = field * fieldContrast + bias * biasStrength - toneLift;
          if (vital) {
            tone = Math.pow(Math.min(1, Math.max(0, tone)), 1.28);
          } else {
            tone = Math.min(1, Math.max(0, tone));
          }
          var rgb = palette(tone);
          var i = (y * COLS + x) * 4;
          data[i] = rgb[0];
          data[i + 1] = rgb[1];
          data[i + 2] = rgb[2];
          data[i + 3] = 255;
        }
      }

      ctx.putImageData(image, 0, 0);
      ctx.globalCompositeOperation = "source-over";
      var vignette = ctx.createRadialGradient(
        COLS * 0.38,
        ROWS * 0.32,
        ROWS * 0.1,
        COLS * 0.45,
        ROWS * 0.5,
        Math.max(COLS, ROWS) * (vital ? 0.7 : 0.85)
      );
      vignette.addColorStop(0, "rgba(1, 2, 3, 0)");
      vignette.addColorStop(1, "rgba(1, 2, 3, " + vignetteAlpha + ")");
      ctx.fillStyle = vignette;
      ctx.fillRect(0, 0, COLS, ROWS);
    }

    function loop(time) {
      if (time - lastPaint >= frameMs) {
        paint(time);
        lastPaint = time;
      }
      if (running) raf = window.requestAnimationFrame(loop);
    }

    function syncRunning() {
      running = !reduced.matches && !document.hidden;
      window.cancelAnimationFrame(raf);
      if (running) {
        raf = window.requestAnimationFrame(loop);
      } else {
        paint(performance.now());
      }
    }

    resize();
    paint(0);
    syncRunning();

    window.addEventListener("resize", resize);
    document.addEventListener("visibilitychange", syncRunning);
    if (reduced.addEventListener) {
      reduced.addEventListener("change", syncRunning);
    }

    return {
      destroy: function () {
        running = false;
        window.cancelAnimationFrame(raf);
        window.removeEventListener("resize", resize);
        document.removeEventListener("visibilitychange", syncRunning);
        if (reduced.removeEventListener) {
          reduced.removeEventListener("change", syncRunning);
        }
        if (canvas.parentNode) canvas.parentNode.removeChild(canvas);
      },
    };
  }

  global.mountHeroAtmosphere = mountHeroAtmosphere;
})(typeof window !== "undefined" ? window : this);
