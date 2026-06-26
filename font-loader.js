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

  const apply = () => {
    if (!document.head) {
      setTimeout(apply, 100);
      return;
    }

    const bodyStack = stack(bodyFonts, "sans-serif");
    const codeStack = stack([...codeFonts, ...bodyFonts], "monospace");
    const googleFontsUrl = [...new Set([...codeFonts, ...bodyFonts])].map(googleFont).join("&");

    document.getElementById("home-assistant-custom-font-google")?.remove();
    document.getElementById("home-assistant-custom-font")?.remove();

    if (googleFontsUrl) {
      const link = document.createElement("link");
      link.id = "home-assistant-custom-font-google";
      link.rel = "stylesheet";
      link.href = `https://fonts.googleapis.com/css2?${googleFontsUrl}&display=block`;
      document.head.append(link);
    }

    const style = document.createElement("style");
    style.id = "home-assistant-custom-font";
    style.textContent = `html {
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
    document.head.append(style);
  };

  apply();
  setTimeout(apply, 1000);
})();
