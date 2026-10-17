#!/usr/bin/env python3
"""Generate embedded previews and responsive WebP assets for content images."""

import base64
import hashlib
import io
import json
from pathlib import Path

from PIL import Image, ImageCms, ImageOps, __version__


ROOT = Path(__file__).resolve().parent.parent
SOURCE = ROOT / "assets/img/user"
MANIFEST = ROOT / "materials/data/image_previews.json"
OUTPUT = ROOT / "assets/img/generated/content"
WIDTHS = (480, 800, 1280, 1920)
RECIPE = f"content-webp-v1-pillow-{__version__}-82/88-lanczos"


def main():
    OUTPUT.mkdir(parents=True, exist_ok=True)
    previous = json.loads(MANIFEST.read_text()) if MANIFEST.exists() else {}
    previews = {}
    for source in sorted(SOURCE.rglob("*")):
        if source.suffix.lower() not in (".jpg", ".jpeg", ".png", ".webp") or "thumbs" in source.parts:
            continue
        key = "/" + source.relative_to(ROOT).as_posix()
        digest = hashlib.sha256(source.read_bytes()).hexdigest()
        cached = previous.get(key, {})
        content_image = "photography" not in source.relative_to(SOURCE).parts
        if cached.get("source_sha256") == digest and (not content_image or (
            cached.get("recipe") == RECIPE and cached.get("variants") and all(
                (ROOT / variant["path"].lstrip("/")).is_file() for variant in cached["variants"]
            )
        )):
            previews[key] = cached
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
            variants = []
            if content_image:
                for target_width in sorted({min(width, candidate) for candidate in WIDTHS}):
                    target_height = round(height * target_width / width)
                    resized = image.resize((target_width, target_height), Image.Resampling.LANCZOS)
                    encoded = io.BytesIO()
                    resized.save(encoded, "WEBP", quality=88 if "projects" in source.parts else 82, method=6)
                    content = encoded.getvalue()
                    name = f"{source.stem}-{target_width}-{hashlib.sha256(content).hexdigest()[:10]}.webp"
                    (OUTPUT / name).write_bytes(content)
                    variants.append({"path": f"/assets/img/generated/content/{name}", "width": target_width,
                                     "height": target_height, "bytes": len(content)})
            image.thumbnail((40, 40), Image.Resampling.LANCZOS)
            buffer = io.BytesIO()
            image.save(buffer, "WEBP", quality=40, method=6)
            previews[key] = {
                "width": width, "height": height,
                "source_sha256": digest,
                "preview": "data:image/webp;base64," + base64.b64encode(buffer.getvalue()).decode("ascii"),
            }
            if variants:
                previews[key].update({"recipe": RECIPE, "variants": variants})
    used = {Path(variant["path"]).name for item in previews.values() for variant in item.get("variants", [])}
    for asset in OUTPUT.glob("*.webp"):
        if asset.name not in used:
            asset.unlink()
    MANIFEST.write_text(json.dumps(previews, indent=2) + "\n")
    print(f"{len(previews)} embedded previews; {len(used)} responsive content assets; "
          f"{sum(p.stat().st_size for p in OUTPUT.glob('*.webp')) // 1024} KiB across all sizes")


if __name__ == "__main__":
    main()
