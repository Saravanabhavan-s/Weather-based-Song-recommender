from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config.settings import settings
from app.database.mongo import close_mongo_connection, connect_to_mongo
from app.middleware.error_handler import register_exception_handlers
from app.middleware.request_logger import add_request_logger
from app.routes import admin, auth, playlists, recommendations, songs, user


@asynccontextmanager
async def lifespan(_: FastAPI):
    await connect_to_mongo()
    yield
    await close_mongo_connection()


app = FastAPI(
    title=settings.app_name,
    version="1.0.0",
    debug=settings.debug,
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

add_request_logger(app)
register_exception_handlers(app)

app.include_router(auth.router)
app.include_router(songs.router)
app.include_router(recommendations.router)
app.include_router(user.router)
app.include_router(playlists.router)
app.include_router(admin.router)


@app.get("/")
async def root():
    return {
        "name": "Vibecast API",
        "status": "ok",
        "docs": "/docs",
    }
