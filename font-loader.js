const DEFAULT_FONTS = ["Roboto", "Noto Sans JP"];
const CODE_FONTS = ["Roboto Mono"];

function fontsFromModuleUrl() {
  const params = new URL(import.meta.url).searchParams;
  const values = params.getAll("family").flatMap((value) => value.split(","));
  const fonts = values.map((value) => value.trim()).filter(Boolean);

  return fonts.length > 0 ? fonts : DEFAULT_FONTS;
}

function quoteFont(font) {
  return `"${font.replaceAll("\\", "\\\\").replaceAll('"', '\\"')}"`;
}

function googleFamily(font) {
  return encodeURIComponent(font.trim()).replaceAll("%20", "+");
}

function fontStack(fonts, generic) {
  return [...fonts.map(quoteFont), generic].join(", ");
}

function importUrl(fonts) {
  const families = [...new Set(fonts.length > 0 ? [...CODE_FONTS, ...fonts] : [])].map((font) => {
    return `family=${googleFamily(font)}`;
  });

  return families.length > 0 ? `https://fonts.googleapis.com/css2?${families.join("&")}&display=block` : "";
}

function buildCss(fonts) {
  const bodyStack = fontStack(fonts, "sans-serif");
  const codeStack = fontStack(fonts.length > 0 ? [...CODE_FONTS, ...fonts] : [], "monospace");

  return `html {
  --ha-font-family-body: ${bodyStack};
  --ha-font-family-heading: ${bodyStack};
  --ha-font-family-code: ${codeStack};

  --primary-font-family: ${bodyStack};
  --paper-font-common-base_-_font-family: ${bodyStack};
  --mdc-typography-font-family: ${bodyStack};
  --material-font-family: ${bodyStack};

  --md-sys-typescale-display-large-font: ${bodyStack};
  --md-sys-typescale-display-medium-font: ${bodyStack};
  --md-sys-typescale-display-small-font: ${bodyStack};

  --md-sys-typescale-headline-large-font: ${bodyStack};
  --md-sys-typescale-headline-medium-font: ${bodyStack};
  --md-sys-typescale-headline-small-font: ${bodyStack};

  --md-sys-typescale-title-large-font: ${bodyStack};
  --md-sys-typescale-title-medium-font: ${bodyStack};
  --md-sys-typescale-title-small-font: ${bodyStack};

  --md-sys-typescale-body-large-font: ${bodyStack};
  --md-sys-typescale-body-medium-font: ${bodyStack};
  --md-sys-typescale-body-small-font: ${bodyStack};

  --md-sys-typescale-label-large-font: ${bodyStack};
  --md-sys-typescale-label-medium-font: ${bodyStack};
  --md-sys-typescale-label-small-font: ${bodyStack};

  font-family: ${bodyStack};
}

body {
  font-family: ${bodyStack};
}
`;
}

const fontLinkId = "home-assistant-custom-font-google";
const styleId = "home-assistant-custom-font";
const fonts = fontsFromModuleUrl();
const googleFontsUrl = importUrl(fonts);

document.getElementById(fontLinkId)?.remove();
document.getElementById(styleId)?.remove();

if (googleFontsUrl) {
  const link = document.createElement("link");
  link.id = fontLinkId;
  link.rel = "stylesheet";
  link.href = googleFontsUrl;
  document.head.append(link);
}

const style = document.createElement("style");
style.id = styleId;
style.dataset.homeAssistantCustomFont = "true";
style.textContent = buildCss(fonts);
document.head.append(style);
