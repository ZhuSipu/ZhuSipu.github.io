#!/usr/bin/env python3
"""Generate embedded previews and intrinsic dimensions for website photographs."""

import base64
import hashlib
import io
import json
from pathlib import Path

from PIL import Image, ImageCms, ImageOps


ROOT = Path(__file__).resolve().parent.parent
SOURCE = ROOT / "assets/img/user"
MANIFEST = ROOT / "materials/data/image_previews.json"


def main():
    previews = {}
    for source in sorted(SOURCE.rglob("*")):
        if source.suffix.lower() not in (".jpg", ".jpeg", ".png", ".webp") or "thumbs" in source.parts:
            continue
        with Image.open(source) as original:
            image = ImageOps.exif_transpose(original)
            width, height = image.size
            if image.info.get("icc_profile"):
                image = ImageCms.profileToProfile(
                    image, ImageCms.ImageCmsProfile(io.BytesIO(image.info["icc_profile"])),
                    ImageCms.createProfile("sRGB"), outputMode="RGB",
                )
            else:
                image = image.convert("RGB")
            image.thumbnail((40, 40), Image.Resampling.LANCZOS)
            buffer = io.BytesIO()
            image.save(buffer, "WEBP", quality=40, method=6)
            key = "/" + source.relative_to(ROOT).as_posix()
            previews[key] = {
                "width": width, "height": height,
                "source_sha256": hashlib.sha256(source.read_bytes()).hexdigest(),
                "preview": "data:image/webp;base64," + base64.b64encode(buffer.getvalue()).decode("ascii"),
            }
    MANIFEST.write_text(json.dumps(previews, indent=2) + "\n")
    print(f"Embedded previews and dimensions for {len(previews)} images ({MANIFEST.stat().st_size // 1024} KiB manifest)")


if __name__ == "__main__":
    main()
