# PookieChat — Secure realtime chat (React + Django + MySQL)

Production‑grade scaffold for a secure, realtime chat app:
- Frontend: React (JSX), Vite, Ant Design + Bootstrap
- Backend: Django 5, Django Admin, Django Channels (WebSockets), MySQL, Redis
- Features: E2EE-ready message storage (ciphertext at rest), follows + friend requests, user settings (theme + avatar), initial admin “pookie”

## Prerequisites
- Node.js 18+ and pnpm
- Python 3.10+ and pip
- MySQL 8+ (or compatible) and Redis 6+

Optional (local containers):
- Docker Desktop

## Environment
Create backend/.env (never commit secrets):

```
# backend/.env
DJANGO_SECRET_KEY=change-me
DEBUG=true
MYSQL_HOST=127.0.0.1
MYSQL_PORT=3306
MYSQL_DATABASE=pookiechat
MYSQL_USER=root
MYSQL_PASSWORD=yourpassword
REDIS_URL=redis://127.0.0.1:6379
```

## Quick start
Open two terminals: one for backend (Django) and one for frontend (Vite).

### 1) Backend (Django + Channels)
```
# Create & activate virtualenv
python -m venv .venv
# macOS/Linux
source .venv/bin/activate
# Windows (PowerShell)
# .venv\Scripts\Activate.ps1

# Install deps
pip install -r backend/requirements.txt

# Configure DB & cache
# Ensure MySQL and Redis are running and match backend/.env

# Run migrations
python backend/manage.py migrate

# Create initial admin “pookie” (password: pookie-admin-123)
python backend/manage.py init_pookie

# Start development server (ASGI via runserver works with Channels 4)
python backend/manage.py runserver 8000
# Or with Daphne (recommended for websockets)
# python -m pip install daphne
# daphne -p 8000 pookiechat.asgi:application
```
Django Admin: http://127.0.0.1:8000/admin/ (login: pookie / pookie-admin-123)

WebSocket endpoint: ws://127.0.0.1:8000/ws/chat/<conversation_uuid>/

### 2) Frontend (React + Vite)
```
pnpm install
pnpm dev
```
Default dev URL: http://localhost:5173

### 3) Running MySQL & Redis with Docker (optional)
```
# MySQL 8
docker run --name mysql8 -e MYSQL_ROOT_PASSWORD=yourpassword -e MYSQL_DATABASE=pookiechat -p 3306:3306 -d mysql:8

# Redis
docker run --name redis6 -p 6379:6379 -d redis:6
```
Update backend/.env to match these credentials.

## Project Structure
- client/ … React app (JSX) and UI
- backend/ … Django project (apps: accounts, chat, social)

Key backend commands:
- Migrations: `python backend/manage.py makemigrations && python backend/manage.py migrate`
- Create superuser: `python backend/manage.py createsuperuser`
- Seed admin: `python backend/manage.py init_pookie`

## Notes
- Messages are stored as ciphertext (clients should encrypt before sending). Frontend currently includes local E2EE utilities; wiring to backend API/websocket is straightforward next.
- For production, run Django behind Daphne/Uvicorn + a reverse proxy, and configure allowed hosts, TLS, and strong secrets.

## Scripts Summary
Frontend:
- `pnpm dev` – start Vite dev server
- `pnpm build` – build SPA
- `pnpm start` – run Node server build (starter)

Backend:
- `python backend/manage.py runserver 8000` – dev server
- `daphne -p 8000 pookiechat.asgi:application` – ASGI server (websockets)
