#!/usr/bin/env python3
"""Build responsive gallery assets from materials/images/photography (requires Pillow)."""

import hashlib
import io
import json
import shutil
from pathlib import Path

from PIL import Image, ImageCms, ImageOps, __version__


ROOT = Path(__file__).resolve().parent.parent
SOURCE = ROOT / "materials/images/photography"
OUTPUT = ROOT / "assets/img/generated/photography"
MANIFEST = ROOT / "materials/data/photography_images.json"
WIDTHS = (320, 640, 1280, 1920, 2560)
RECIPE = f"webp-v1-pillow-{__version__}-82/86-lanczos"


def main():
    OUTPUT.mkdir(parents=True, exist_ok=True)
    previous = json.loads(MANIFEST.read_text()) if MANIFEST.exists() else {}
    photos = {}
    original_bytes = 0
    for source in sorted(SOURCE.iterdir()):
        if source.suffix.lower() not in (".jpg", ".jpeg", ".png"):
            continue
        key = f"user/photography/{source.name}"
        digest = hashlib.sha256(source.read_bytes()).hexdigest()
        original_bytes += source.stat().st_size
        runtime_original = ROOT / "assets/img/user/photography" / source.name
        runtime_original.parent.mkdir(parents=True, exist_ok=True)
        if not runtime_original.exists() or hashlib.sha256(runtime_original.read_bytes()).hexdigest() != digest:
            shutil.copyfile(source, runtime_original)
        cached = previous.get("photos", {}).get(key, {})
        if previous.get("recipe") == RECIPE and cached.get("source_sha256") == digest and all(
            (ROOT / variant["path"].lstrip("/")).is_file() for variant in cached.get("variants", [])
        ) and cached.get("variants"):
            photos[key] = cached
            continue

        with Image.open(source) as original:
            image = ImageOps.exif_transpose(original)
            profile = image.info.get("icc_profile")
            if profile:
                image = ImageCms.profileToProfile(
                    image, ImageCms.ImageCmsProfile(io.BytesIO(profile)),
                    ImageCms.createProfile("sRGB"), outputMode="RGB",
                )
            else:
                image = image.convert("RGB")
            variants = []
            for width in sorted({min(width, image.width) for width in WIDTHS}):
                height = round(image.height * width / image.width)
                resized = image.resize((width, height), Image.Resampling.LANCZOS)
                encoded = io.BytesIO()
                resized.save(encoded, "WEBP", quality=82 if width <= 640 else 86, method=6)
                content = encoded.getvalue()
                name = f"{source.stem}-{width}-{hashlib.sha256(content).hexdigest()[:10]}.webp"
                (OUTPUT / name).write_bytes(content)
                variants.append({"path": f"/assets/img/generated/photography/{name}", "width": width,
                                 "height": height, "bytes": len(content)})
            photos[key] = {"source_sha256": digest, "width": image.width, "height": image.height,
                           "ratio": round(image.width / image.height, 8), "variants": variants}

    manifest = {"recipe": RECIPE, "photos": photos}
    MANIFEST.write_text(json.dumps(manifest, indent=2) + "\n")
    used = {Path(variant["path"]).name for photo in photos.values() for variant in photo["variants"]}
    for asset in OUTPUT.glob("*.webp"):
        if asset.name not in used:
            asset.unlink()
    thumbs = sum(next(v["bytes"] for v in photo["variants"] if v["width"] == min(640, photo["width"]))
                 for photo in photos.values())
    print(f"{len(photos)} photos; {len(used)} variants; 640px thumbnails {thumbs / 1024:.0f} KiB; "
          f"originals preserved ({original_bytes / 1024:.0f} KiB)")


if __name__ == "__main__":
    main()
