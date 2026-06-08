from fastapi import Request
from slowapi import Limiter


def get_real_ip(request: Request) -> str:
    xff = request.headers.get("x-forwarded-for")
    if xff:
        return xff.split(",")[0].strip()
    return request.client.host


limiter = Limiter(key_func=get_real_ip)
