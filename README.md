# Vibecast Full-Stack Architecture

Vibecast is a context-aware music recommendation platform powered by weather, mood, time, temperature, and user preferences.

## Stack

- Frontend: React + Tailwind CSS + Framer Motion + Lucide React + Recharts
- Backend: FastAPI
- Database: MongoDB
- Auth: JWT + bcrypt
- Weather API: OpenWeatherMap
- Music Source: SoundCloud URLs in song records

## Project Structure

- backend/app/main.py: FastAPI entrypoint
- backend/app/config: settings and environment config
- backend/app/database: MongoDB connection and index setup
- backend/app/core: security + auth dependencies
- backend/app/routes: auth, songs, recommendations, user, playlists, admin
- backend/app/services: recommendation engine + weather integration
- backend/app/middleware: request logging + error handling
- backend/app/utils: weather/mood/time utilities and serializers
- frontend/src/pages: Landing, Login, Register, Dashboard, Profile, Admin
- frontend/src/components: all major reusable UI components
- frontend/src/services: typed API client wrappers
- frontend/src/context: auth state and token lifecycle
- frontend/src/routes: application routing and protected routes

## Recommendation Formula

score =
(weatherMatch * 5) +
(moodMatch * 4) +
(timeMatch * 3) +
(tempMatch * 2) +
(userLikesArtist * 4) +
(songPopularity * 2) -
(recentlyPlayedPenalty * 3)

Implemented in backend/app/services/recommendation_service.py.

## Backend Setup

1. Copy backend/.env.example to backend/.env.
2. Fill OPENWEATHER_API_KEY and JWT_SECRET.
3. Start MongoDB locally (or use docker compose).
4. Install dependencies:

   pip install -r backend/requirements.txt

5. Run API from backend folder:

   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

## Frontend Setup

1. Copy frontend/.env.example to frontend/.env.
2. Install dependencies:

   npm install --prefix frontend

3. Run frontend:

   npm run dev --prefix frontend

## Docker Compose

To run MongoDB + backend + frontend containers:

1. Ensure backend/.env exists.
2. Run:

   docker compose up --build

Frontend will be exposed on port 5173 and backend on port 8000.

## Implemented API Endpoints

### Auth
- POST /auth/register
- POST /auth/login
- GET /auth/me

### Songs
- GET /songs
- GET /songs/{id}
- POST /songs
- PUT /songs/{id}
- DELETE /songs/{id}

### Recommendations
- GET /recommendations/weather
- GET /recommendations/trending
- GET /recommendations/mood/{mood}

### User
- GET /user/profile
- PUT /user/profile
- POST /user/like-song
- POST /user/dislike-song
- GET /user/history

### Playlists
- POST /playlists
- GET /playlists
- DELETE /playlists/{id}

### Admin
- GET /admin/analytics
- GET /admin/users
- GET /admin/weather-trends

## Notes

- Legacy root Flask files were removed to keep the repository focused on the full-stack structure.
- Production architecture lives under backend and frontend.
