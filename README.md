# PookieChat — Secure chat (React + Django + MySQL)

- Frontend: React (JSX), Vite, Ant Design + Bootstrap (via CDN)
- Backend: Django 5 + Django Admin, MySQL, Redis (for Channels if you enable websockets later)
- Features: session auth, search pookies, conversations, 5s polling for chat lists/messages, settings (theme + avatar upload to media), posts (text/image) with visibility + reach, initial admin “pookie”

## Prerequisites

- Node.js 18+ and pnpm
- Python 3.10+ and pip
- MySQL 8+ and Redis 6+

## Environment

Create backend/.env

```
DJANGO_SECRET_KEY=change-me
DEBUG=true
MYSQL_HOST=127.0.0.1
MYSQL_PORT=3306
MYSQL_DATABASE=pookiechat
MYSQL_USER=root
MYSQL_PASSWORD=yourpassword
REDIS_URL=redis://127.0.0.1:6379
```

## Backend (Django)

```
python -m venv .venv
# macOS/Linux
source .venv/bin/activate
# Windows PowerShell: .venv\Scripts\Activate.ps1

pip install -r backend/requirements.txt
python backend/manage.py migrate
python backend/manage.py init_pookie   # admin: pookie / pookie-admin-123
python backend/manage.py runserver 8000
```

Django Admin: http://127.0.0.1:8000/admin/

## Frontend (Vite)

```
pnpm install
pnpm dev
```

Dev URL: http://localhost:5173

## Troubleshooting

- **403 Forbidden loading CSS**: Fixed by using CDN CSS (see index.html). We removed direct imports from node_modules in App.tsx.
- **Logout not working**: Clear browser localStorage/sessionStorage and refresh. The frontend uses session-based auth with Django.
- **Still seeing "Logout" when not logged in**: This happens if localStorage has stale data. Clear browser storage or hard refresh (Ctrl+F5).
- **API base**: frontend uses relative "/api"; proxy to Django if you run behind one, or serve the SPA with the backend in production.
- **Media (avatars/posts)**: served in DEBUG via /media/. Ensure MEDIA_ROOT writable.
- **Migration needed**: Run `python backend/manage.py makemigrations accounts` then `python backend/manage.py migrate` after pulling new Profile model changes.

## Project Structure

- client/ — React app
- backend/ — Django project (apps: accounts, chat, social)

Key endpoints

- Auth: POST /api/auth/register/ (with first_name, last_name, profile_visibility), /api/auth/login/, /api/auth/logout/
- Me/Settings: GET /api/me/, POST /api/settings/, POST /api/profile/, POST /api/accounts/avatar/
- Users: GET /api/users/search/?q= (searches username, first_name, last_name)
- Chat: GET /api/conversations/list/, POST /api/conversations/, GET/POST /api/conversations/<uuid>/messages(/post)/
- Posts: GET /api/posts/?username=..., POST /api/posts/create/

## New Features Added

- **Username Validation**: Only allows letters, numbers, dots (.), and single underscores (_). No double underscores or leading/trailing dots/underscores.
- **Extended Registration**: First name, last name, and profile visibility (public/followers/private)
- **Profile Visibility**: Controls who can see your profile and posts
- **Admin Blocking**: Django Admin can block users permanently or temporarily with custom reasons and end dates
- **Blocked User Login**: Blocked users see specific error messages with reason and end date (if temporary)

## Notes

- We removed Netlify files (netlify/, netlify.toml). Use your preferred hosting for Django and the SPA.
- For production, run Django on Daphne/Uvicorn behind a reverse proxy, set strong SECRET_KEY, and configure ALLOWED_HOSTS and TLS.
