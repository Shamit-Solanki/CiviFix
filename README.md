# CiviFix

This is the first connected foundation of the SIH civic issue platform.

## Architecture

React/Vite frontend -> Express REST API -> PostgreSQL + PostGIS

## Implemented now

- PostgreSQL/PostGIS schema
- User registration/login with JWT
- Role middleware
- Civic issue creation
- Category -> department routing
- GPS coordinates stored with PostGIS
- 100m geographic duplicate detection
- Crowdsourced support
- Dynamic priority score
- React frontend connected to API
- API health endpoint
- Rate limiting

## Setup

### 1. Database
Create PostgreSQL database `civifix`, then run `database/schema.sql`.

### 2. Backend
cd backend
copy .env.example .env
Edit DATABASE_URL and JWT_SECRET.
npm install
npm run dev

### 3. Frontend
cd frontend
npm install
npm run dev

Frontend: http://localhost:5173
Backend: http://localhost:5000

## Next build
Citizen report UI -> camera/image upload -> Leaflet map -> officer dashboard ->
worker dashboard -> assignments -> notifications -> citizen verification ->
analytics/hotspots -> deployment -> optional AI.
