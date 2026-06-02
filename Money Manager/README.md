# AOL Money Manager

Aplikasi manajemen keuangan web (React + REST API).

## Struktur repo (monorepo)

| Folder      | Peran                  | Deploy               |
| ----------- | ---------------------- | -------------------- |
| `frontend/` | React + Vite (UI)      | **Vercel**           |
| `backend/`  | Express REST API + JWT | **Railway / Render** |

## Quick start

### Frontend

```bash
cd frontend
npm install
npm run dev
```

### Backend

Lihat [backend/README.md](backend/README.md)

```bash
cd backend
npm install
npm run dev
```

## Database

Schema SQL: `backend/supabase/migrations/001_initial_schema.sql`  
Jalankan di Supabase Dashboard → SQL Editor.

## Status integrasi

- Frontend sudah terintegrasi dengan backend API via **REST + JWT**.
- Mode **demo** (localStorage) tetap berfungsi jika `VITE_API_URL` tidak diset.
- Set `VITE_API_URL` di [`frontend/.env`](frontend/.env) untuk mengaktifkan mode terhubung.
