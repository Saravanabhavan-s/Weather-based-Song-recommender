import logging
import time

from fastapi import FastAPI, Request

logger = logging.getLogger("app.request")


def add_request_logger(app: FastAPI) -> None:
    @app.middleware("http")
    async def log_requests(request: Request, call_next):
        start_time = time.perf_counter()
        response = await call_next(request)
        duration_ms = (time.perf_counter() - start_time) * 1000
        client_host = request.client.host if request.client else "-"

        logger.info(
            "%s %s %s -> %s (%.2fms)",
            client_host,
            request.method,
            request.url.path,
            response.status_code,
            duration_ms,
        )
        return response
