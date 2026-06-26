"""Set up Home Assistant custom font frontend module."""

from __future__ import annotations

from pathlib import Path
from urllib.parse import urlencode

import voluptuous as vol

from homeassistant.components.frontend import add_extra_js_url
from homeassistant.components.http import StaticPathConfig
from homeassistant.core import HomeAssistant
from homeassistant.helpers import config_validation as cv
from homeassistant.helpers.typing import ConfigType

DOMAIN = "homeassistant_custom_font"
CONF_FONT_FAMILY = "font-family"
CONF_CODE_FONT_FAMILY = "code-font-family"

DEFAULT_FONT_FAMILY = ["Roboto"]
DEFAULT_CODE_FONT_FAMILY = ["Roboto Mono"]
STATIC_URL_PATH = f"/{DOMAIN}"

CONFIG_SCHEMA = vol.Schema(
    {
        DOMAIN: vol.Schema(
            {
                vol.Optional(CONF_FONT_FAMILY, default=DEFAULT_FONT_FAMILY): vol.All(
                    cv.ensure_list, [cv.string]
                ),
                vol.Optional(
                    CONF_CODE_FONT_FAMILY, default=DEFAULT_CODE_FONT_FAMILY
                ): vol.All(cv.ensure_list, [cv.string]),
            }
        )
    },
    extra=vol.ALLOW_EXTRA,
)


def _module_url(font_family: list[str], code_font_family: list[str]) -> str:
    family_params = [("family", font) for font in font_family] or [("family", "")]
    code_params = [("code", font) for font in code_font_family] or [("code", "")]
    query = urlencode(
        [
            *family_params,
            *code_params,
        ]
    )
    return f"{STATIC_URL_PATH}/font-loader.js?{query}"


async def async_setup(hass: HomeAssistant, config: ConfigType) -> bool:
    """Set up the custom font frontend module."""
    conf = config.get(DOMAIN)
    if conf is None:
        return True

    await hass.http.async_register_static_paths(
        [
            StaticPathConfig(
                STATIC_URL_PATH,
                str(Path(__file__).parent),
                False,
            )
        ]
    )

    add_extra_js_url(
        hass,
        _module_url(conf[CONF_FONT_FAMILY], conf[CONF_CODE_FONT_FAMILY]),
    )
    return True
