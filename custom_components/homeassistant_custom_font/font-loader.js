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
  const css = `* {
    font-family: ${bodyStack} !important;
  }

  code,
  pre,
  kbd,
  samp {
    font-family: ${codeStack} !important;
  }
  `;

  const STYLE_ID = "home-assistant-custom-font";
  const LINK_ID = "home-assistant-custom-font-google";

  // Inject the override <style> into a Document (append to <head>) or an open
  // ShadowRoot (append to the root). A document-level rule never crosses shadow
  // boundaries, so reaching each shadow root is what lets the font win inside
  // web components (e.g. text in <ha-data-table>). Documents keep the style
  // last so it beats globals appended later; shadow roots only need it present
  // because !important already wins there and re-ordering would fight renders.
  const injectStyle = (root) => {
    const container = root.head || root.documentElement || root;
    const style = root.getElementById(STYLE_ID) || (root.ownerDocument || root).createElement("style");
    style.id = STYLE_ID;
    if (style.textContent !== css) {
      style.textContent = css;
    }
    if (!style.isConnected) {
      container.append(style);
    } else if (root.nodeType === 9 && container.lastElementChild !== style) {
      container.append(style);
    }
  };

  const injectLink = (doc) => {
    if (!googleFontsUrl) {
      return;
    }
    const head = doc.head || doc.documentElement;
    if (!head) {
      return;
    }
    const link = doc.getElementById(LINK_ID) || doc.createElement("link");
    link.id = LINK_ID;
    link.rel = "stylesheet";
    link.href = `https://fonts.googleapis.com/css2?${googleFontsUrl}&display=block`;
    if (!link.isConnected) {
      head.prepend(link);
    }
  };

  // Home Assistant writes theme variables onto <html style> as inline values,
  // which beat a stylesheet rule, so re-assert ours as inline !important. Font
  // tokens read by components (e.g. var(--mdc-typography-font-family)) win too.
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
  };

  const frameDoc = (frame) => {
    try {
      return frame.contentDocument;
    } catch {
      return null; // genuinely cross-origin frame: inaccessible
    }
  };

  const observedRoots = new WeakSet();
  const styledDocs = new WeakSet();
  const hookedFrames = new WeakSet();

  // New panels/iframes appear, and apps append their own <style> after ours.
  const watchChildList = (root, target) => {
    if (observedRoots.has(root)) {
      return;
    }
    observedRoots.add(root);
    new MutationObserver(schedule).observe(target, { childList: true, subtree: true });
  };

  // Home Assistant rewrites <html style> on theme changes; re-assert variables.
  const watchDocStyle = (doc) => {
    if (styledDocs.has(doc) || !doc.documentElement) {
      return;
    }
    styledDocs.add(doc);
    new MutationObserver(() => applyVariables(doc)).observe(doc.documentElement, {
      attributes: true,
      attributeFilter: ["style"],
    });
  };

  // Custom panels (HACS) and add-on apps (Music Assistant) render in their own
  // same-origin <iframe>, and web components keep styles in shadow roots. Both
  // are invisible to a document-level stylesheet, so we descend into every
  // accessible frame and open shadow root and inject the override there too.
  const apply = (root) => {
    injectStyle(root);
    root.querySelectorAll("*").forEach((el) => {
      if (el.shadowRoot) {
        watchChildList(el.shadowRoot, el.shadowRoot);
        apply(el.shadowRoot);
      } else if (el.localName === "iframe") {
        const doc = frameDoc(el);
        if (doc) {
          applyDocument(doc);
        }
        if (!hookedFrames.has(el)) {
          hookedFrames.add(el);
          el.addEventListener("load", schedule);
        }
      }
    });
  };

  const applyDocument = (doc) => {
    injectLink(doc);
    applyVariables(doc);
    watchDocStyle(doc);
    watchChildList(doc, doc.documentElement);
    apply(doc);
  };

  let scheduled = false;
  const run = () => {
    scheduled = false;
    applyDocument(document);
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
