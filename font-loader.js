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
  const bodyStack = stack(bodyFonts, "sans-serif");
  const codeStack = stack([...codeFonts, ...bodyFonts], "monospace");
  const variables = [
    ["--ha-font-family-body", bodyStack],
    ["--ha-font-family-code", codeStack],
    ["--ha-font-family-longform", bodyStack],
    ["--ha-font-family-heading", bodyStack],
    ["--primary-font-family", bodyStack],
    ["--font-family", bodyStack],
    ["--v-font-family", bodyStack],
    ["--paper-font-common-base_-_font-family", bodyStack],
    ["--mdc-typography-font-family", bodyStack],
    ["--md-list-item-label-text-font", bodyStack],
    ["--md-list-item-supporting-text-font", bodyStack],
    ["--md-list-item-trailing-supporting-text-font", bodyStack],
  ];
  const variableCss = variables.map(([name, value]) => `    ${name}: ${value};`).join("\n");
  const css = `* {
    font-family: ${bodyStack} !important;
  }

  code,
  pre,
  kbd,
  samp {
    font-family: ${codeStack} !important;
  }

  /* Keep icon webfonts intact so glyphs are not replaced with empty boxes. */
  .mdi,
  .mdi::before,
  [class^="mdi-"]::before,
  [class*=" mdi-"]::before {
    font-family: "Material Design Icons" !important;
  }
  .material-icons { font-family: "Material Icons" !important; }
  .material-icons-outlined { font-family: "Material Icons Outlined" !important; }
  .material-icons-round { font-family: "Material Icons Round" !important; }
  .material-icons-sharp { font-family: "Material Icons Sharp" !important; }
  .material-icons-two-tone { font-family: "Material Icons Two Tone" !important; }
  .material-symbols-outlined { font-family: "Material Symbols Outlined" !important; }
  .material-symbols-rounded { font-family: "Material Symbols Rounded" !important; }
  .material-symbols-sharp { font-family: "Material Symbols Sharp" !important; }

  html {
${variableCss}
    font-family: ${bodyStack} !important;
  }
  `;

  const GOOGLE_LINK_ID = "home-assistant-custom-font-google";
  const STYLE_ID = "home-assistant-custom-font";

  const injectStyle = (doc) => {
    const root = doc.head || doc.documentElement;
    if (!root) {
      return;
    }
    if (googleFontsUrl) {
      const link = doc.getElementById(GOOGLE_LINK_ID) || doc.createElement("link");
      link.id = GOOGLE_LINK_ID;
      link.rel = "stylesheet";
      link.href = `https://fonts.googleapis.com/css2?${googleFontsUrl}&display=block`;
      if (!link.isConnected) {
        root.prepend(link);
      }
    }

    const style = doc.getElementById(STYLE_ID) || doc.createElement("style");
    style.id = STYLE_ID;
    if (style.textContent !== css) {
      style.textContent = css;
    }
    // Keep our override last so it wins over styles appended afterwards.
    if (!style.isConnected || root.lastElementChild !== style) {
      root.append(style);
    }
  };

  const applyVariables = (doc) => {
    const el = doc.documentElement;
    if (!el) {
      return;
    }
    variables.forEach(([name, value]) => {
      if (el.style.getPropertyValue(name) !== value) {
        el.style.setProperty(name, value, "important");
      }
    });
    if (el.style.getPropertyValue("font-family") !== bodyStack) {
      el.style.setProperty("font-family", bodyStack, "important");
    }
    if (doc.body && doc.body.style.getPropertyValue("font-family") !== bodyStack) {
      doc.body.style.setProperty("font-family", bodyStack, "important");
    }
  };

  const applyTo = (doc) => {
    injectStyle(doc);
    applyVariables(doc);
  };

  const frameDoc = (frame) => {
    try {
      return frame.contentDocument;
    } catch {
      return null; // genuinely cross-origin frame: inaccessible
    }
  };

  // Custom panels (e.g. HACS) and add-on apps (e.g. Music Assistant) render in
  // their own same-origin <iframe> document where this module never runs, so we
  // reach into each accessible frame and inject the override there too. Frames
  // can live inside shadow roots, so the search descends into them and starts
  // observing those roots to catch panels added later.
  const collectFrames = (root, out) => {
    root.querySelectorAll("iframe").forEach((frame) => out.push(frame));
    root.querySelectorAll("*").forEach((el) => {
      if (el.shadowRoot) {
        watchChildList(el.shadowRoot, el.shadowRoot);
        collectFrames(el.shadowRoot, out);
      }
    });
  };

  const styleObservedDocs = new WeakSet();
  const childObservedRoots = new WeakSet();
  const hookedFrames = new WeakSet();

  // Home Assistant rewrites theme variables onto <html style>; re-assert ours.
  const watchDocStyle = (doc) => {
    if (!doc || styleObservedDocs.has(doc) || !doc.documentElement) {
      return;
    }
    styleObservedDocs.add(doc);
    new MutationObserver(() => applyVariables(doc)).observe(doc.documentElement, {
      attributes: true,
      attributeFilter: ["style"],
    });
  };

  // New panels/iframes appear, and apps append their own <style> after ours.
  const watchChildList = (root, target) => {
    if (!root || childObservedRoots.has(root) || !target) {
      return;
    }
    childObservedRoots.add(root);
    new MutationObserver(schedule).observe(target, { childList: true, subtree: true });
  };

  let scheduled = false;
  const run = () => {
    scheduled = false;
    applyTo(document);
    watchDocStyle(document);
    watchChildList(document, document.documentElement);

    const frames = [];
    try {
      collectFrames(document, frames);
    } catch {
      return;
    }
    frames.forEach((frame) => {
      const doc = frameDoc(frame);
      if (doc) {
        applyTo(doc);
        watchDocStyle(doc);
        watchChildList(doc, doc.documentElement);
      }
      if (!hookedFrames.has(frame)) {
        hookedFrames.add(frame);
        frame.addEventListener("load", schedule);
      }
    });
  };

  const schedule = () => {
    if (scheduled) {
      return;
    }
    scheduled = true;
    requestAnimationFrame(run);
  };

  run();
})();
