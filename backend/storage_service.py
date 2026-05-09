"""Emergent object storage helper. Handles product image uploads + downloads.

If EMERGENT_LLM_KEY is missing the helpers gracefully fall back: callers can
detect via `is_enabled()` and stash images as base64 in MongoDB instead.
"""
from __future__ import annotations

import logging
import os
import uuid
from typing import Optional, Tuple

import requests

logger = logging.getLogger(__name__)

STORAGE_URL = "https://integrations.emergentagent.com/objstore/api/v1/storage"
APP_NAME = os.environ.get("APP_NAME", "siri-boutique")

_storage_key: Optional[str] = None


def is_enabled() -> bool:
    return bool(os.environ.get("EMERGENT_LLM_KEY"))


def init_storage() -> Optional[str]:
    """Initialize storage session. Returns storage_key or None on failure."""
    global _storage_key
    if _storage_key:
        return _storage_key
    if not is_enabled():
        logger.warning("EMERGENT_LLM_KEY not set — object storage disabled")
        return None
    try:
        resp = requests.post(
            f"{STORAGE_URL}/init",
            json={"emergent_key": os.environ["EMERGENT_LLM_KEY"]},
            timeout=30,
        )
        resp.raise_for_status()
        _storage_key = resp.json()["storage_key"]
        logger.info("Object storage initialized")
        return _storage_key
    except Exception as e:
        logger.error("Storage init failed: %s", e)
        return None


def _reinit() -> Optional[str]:
    global _storage_key
    _storage_key = None
    return init_storage()


def put_image(data: bytes, content_type: str, ext: str = "jpg") -> Optional[str]:
    """Upload image bytes. Returns canonical path (e.g. siri-boutique/products/xxx.jpg) or None."""
    key = init_storage()
    if not key:
        return None
    path = f"{APP_NAME}/products/{uuid.uuid4().hex}.{ext.lstrip('.')}"
    for attempt in range(2):
        try:
            resp = requests.put(
                f"{STORAGE_URL}/objects/{path}",
                headers={"X-Storage-Key": key, "Content-Type": content_type},
                data=data,
                timeout=120,
            )
            if resp.status_code == 403 and attempt == 0:
                key = _reinit()
                if not key:
                    return None
                continue
            resp.raise_for_status()
            return resp.json().get("path", path)
        except Exception as e:
            logger.error("put_image failed (attempt %d): %s", attempt + 1, e)
            if attempt == 0:
                key = _reinit() or key
                continue
            return None
    return None


def get_image(path: str) -> Optional[Tuple[bytes, str]]:
    """Download image. Returns (bytes, content_type) or None."""
    key = init_storage()
    if not key:
        return None
    for attempt in range(2):
        try:
            resp = requests.get(
                f"{STORAGE_URL}/objects/{path}",
                headers={"X-Storage-Key": key},
                timeout=60,
            )
            if resp.status_code == 403 and attempt == 0:
                key = _reinit()
                if not key:
                    return None
                continue
            resp.raise_for_status()
            return resp.content, resp.headers.get("Content-Type", "image/jpeg")
        except Exception as e:
            logger.error("get_image failed (attempt %d): %s", attempt + 1, e)
            if attempt == 0:
                key = _reinit() or key
                continue
            return None
    return None
