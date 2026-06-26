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
  const variables = [
    ["--ha-font-family-body", bodyStack],
    ["--ha-font-family-code", codeStack],
    ["--ha-font-family-longform", bodyStack],
    ["--ha-font-family-heading", bodyStack],
    ["--md-list-item-label-text-font", bodyStack],
    ["--md-list-item-supporting-text-font", bodyStack],
    ["--md-list-item-trailing-supporting-text-font", bodyStack],
  ];
  const css = `html {
    --ha-font-family-body: ${bodyStack};
    --ha-font-family-code: ${codeStack};
    --ha-font-family-longform: ${bodyStack};
    --ha-font-family-heading: ${bodyStack};
    --md-list-item-label-text-font: ${bodyStack};
    --md-list-item-supporting-text-font: ${bodyStack};
    --md-list-item-trailing-supporting-text-font: ${bodyStack};
    font-family: ${bodyStack};
  }
  * {
    font-family: ${bodyStack};
  }

  code,
  pre,
  kbd,
  samp {
    font-family: ${codeStack};
  }
  `;
  const ensureHead = () => {
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

  const applyVariables = () => {
    variables.forEach(([name, value]) => {
      if (document.documentElement.style.getPropertyValue(name) !== value) {
        document.documentElement.style.setProperty(name, value);
      }
    });
    if (document.documentElement.style.getPropertyValue("font-family") !== bodyStack) {
      document.documentElement.style.setProperty("font-family", bodyStack);
    }
    if (document.body && document.body.style.getPropertyValue("font-family") !== bodyStack) {
      document.body.style.setProperty("font-family", bodyStack);
    }
  };

  const ensure = () => {
    ensureHead();
    applyVariables();
  };

  // Home Assistant writes theme variables to <html style> during startup.
  // Watch only that attribute and restore the font variables when it changes.
  new MutationObserver(applyVariables).observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["style"],
  });
  ensure();
})();
