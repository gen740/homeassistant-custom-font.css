# Home Assistant Custom Font CSS

Single-page GitHub Pages helper for generating a Home Assistant `configuration.yaml` snippet from Google Font names.

## Usage

Open the Pages URL with `family` query parameters in fallback order:

```text
https://gen740.github.io/homeassistant-custom-font.css/?family=Roboto&code=Roboto+Mono
```

Comma separated values also work:

```text
https://gen740.github.io/homeassistant-custom-font.css/?family=Roboto,Noto+Sans+JP&code=Roboto+Mono
```

`Noto Sans JP` is shown as an example fallback, but the default body font is only `Roboto`.

Find Google Font names at <https://fonts.google.com/>.

The page includes editable preview text and a button to copy the generated YAML snippet.

The page generates YAML like:

```yaml
frontend:
  extra_module_url:
    - "https://gen740.github.io/homeassistant-custom-font.css/font-loader.js?family=Roboto&code=Roboto+Mono"
```

The hosted `font-loader.js` reads its own query parameters, adds a Google Fonts `<link>`, and injects a font override `<style>` tag.

## Apply to Home Assistant

1. Copy the generated YAML snippet.
2. Add it to `configuration.yaml`:

```yaml
frontend:
  extra_module_url:
    - "https://gen740.github.io/homeassistant-custom-font.css/font-loader.js?family=Roboto&code=Roboto+Mono"
```

3. Restart Home Assistant, then hard refresh the browser or clear the frontend cache.
