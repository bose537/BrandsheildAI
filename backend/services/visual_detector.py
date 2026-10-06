import base64
import io
from PIL import Image, UnidentifiedImageError


def fingerprint(data):
    if not data:
        return None
    try:
        with Image.open(io.BytesIO(base64.b64decode(data.split(',', 1)[1]))) as img:
            if img.width * img.height > 16_000_000:
                raise ValueError('Image dimensions are too large.')
            pixels = img.convert('L').resize((8, 8))
            gray = [pixels.getpixel((x,y)) for y in range(8) for x in range(8)]
            # Uniform images carry no useful shape evidence.
            if max(gray) - min(gray) < 12:
                return None
            mean = sum(gray) / 64
            return [p >= mean for p in gray]
    except (UnidentifiedImageError, OSError, ValueError, Image.DecompressionBombError):
        raise ValueError('The uploaded logo could not be read. Use a smaller PNG, JPEG or WebP.')


def compare(first, second):
    a, b = fingerprint(first), fingerprint(second)
    if a is None or b is None:
        return None
    return round(100 * sum(x == y for x, y in zip(a, b)) / 64, 1)
