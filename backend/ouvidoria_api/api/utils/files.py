"""
Utilitários para streaming otimizado de arquivos
"""
from io import BytesIO
from typing import Union


async def iterfile(data: Union[bytes, BytesIO], chunk_size: int = 65536):
    """
    Iterador async para streaming de arquivos em chunks
    
    Args:
        data: Dados binários ou BytesIO
        chunk_size: Tamanho do chunk (padrão: 64KB)
    
    Yields:
        Chunks de dados binários
    """
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
    cache_max_age: int = 0
) -> dict:
    """
    Gera headers otimizados para download de arquivos
    
    Args:
        filename: Nome do arquivo
        content_length: Tamanho do arquivo em bytes
        disposition: 'inline' ou 'attachment'
        cache_max_age: Tempo de cache em segundos (padrão: 0)
    
    Returns:
        Dicionário de headers HTTP
    """
    cache_control = f'public, max-age={cache_max_age}' if cache_max_age > 0 else 'no-cache'

    return {
        'Content-Disposition': f'{disposition}; filename="{filename}"',
        'Content-Length': str(content_length),
        'Cache-Control': cache_control,
        'Accept-Ranges': 'bytes'
    }