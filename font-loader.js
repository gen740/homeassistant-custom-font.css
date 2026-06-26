(() => {
  const params = new URL(import.meta.url).searchParams;

  const getFonts = (name, fallback) => {
    const fonts = params.getAll(name).flatMap((value) => value.split(",")).map((value) => value.trim()).filter(Boolean);
    return params.has(name) ? fonts : fallback;
  };

  const bodyFonts = getFonts("family", ["Roboto"]);
  const codeFonts = getFonts("code", ["Roboto Mono"]);

  const quote = (font) => `"${font.replaceAll("\\", "\\\\").replaceAll('"', '\\"')}"`;
  const stack = (fonts, generic) => [...fonts.map(quote), generic].join(", ");
  const googleFont = (font) => `family=${encodeURIComponent(font).replaceAll("%20", "+")}`;

  const googleFontsUrl = [...new Set([...codeFonts, ...bodyFonts])].map(googleFont).join("&");
  const root = document.head || document.documentElement;
  const bodyStack = stack(bodyFonts, "sans-serif");
  const codeStack = stack([...codeFonts, ...bodyFonts], "monospace");
  const css = `html {
    --ha-font-family-body: ${bodyStack};
    --ha-font-family-heading: ${bodyStack};
    --ha-font-family-code: ${codeStack};
    --primary-font-family: ${bodyStack};
    --paper-font-common-base_-_font-family: ${bodyStack};
    --mdc-typography-font-family: ${bodyStack};
    font-family: ${bodyStack};
  }

  body {
    font-family: ${bodyStack};
  }
  `;
  let pending = false;

  const ensure = () => {
    if (googleFontsUrl) {
      const link = document.getElementById("home-assistant-custom-font-google") || document.createElement("link");
      link.id = "home-assistant-custom-font-google";
      link.rel = "stylesheet";
      link.href = `https://fonts.googleapis.com/css2?${googleFontsUrl}&display=block`;
      if (!link.isConnected) {
        root.prepend(link);
      }
    }

    const style = document.getElementById("home-assistant-custom-font") || document.createElement("style");
    style.id = "home-assistant-custom-font";
    if (style.textContent !== css) {
      style.textContent = css;
    }
    if (!style.isConnected || root.lastElementChild !== style) {
      root.append(style);
    }
  };

  const scheduleEnsure = () => {
    if (pending) {
      return;
    }
    pending = true;
    queueMicrotask(() => {
      pending = false;
      ensure();
    });
  };

  // Home Assistant can add theme styles during startup. Keep this style last
  // without removing/reloading the Google Fonts link, which can cause flicker.
  new MutationObserver(scheduleEnsure).observe(root, { childList: true });
  ensure();
})();
