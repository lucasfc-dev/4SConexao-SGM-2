"""Utilitários para streaming de arquivos."""
from io import BytesIO
from typing import Union


async def iterfile(data: Union[bytes, BytesIO], chunk_size: int = 65536):
    if isinstance(data, bytes):
        buffer = BytesIO(data)
    else:
        buffer = data

    while True:
        chunk = buffer.read(chunk_size)
        if not chunk:
            break
        yield chunk


def get_download_headers(
    filename: str,
    content_length: int,
    disposition: str = 'inline',
    cache_max_age: int = 0,
) -> dict:
    cache_control = f'public, max-age={cache_max_age}' if cache_max_age > 0 else 'no-cache'

    return {
        'Content-Disposition': f'{disposition}; filename="{filename}"',
        'Content-Length': str(content_length),
        'Cache-Control': cache_control,
        'Accept-Ranges': 'bytes',
    }
