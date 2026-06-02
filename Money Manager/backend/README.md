# AOL Money Manager — Backend API

REST API untuk memenuhi requirement **repo backend** (Express + Node.js + JWT + Supabase PostgreSQL).

Frontend (React/Vite di Vercel) memanggil API ini; database & auth user disimpan di **Supabase**.

## Stack

| Lapisan | Teknologi |
|--------|-----------|
| Framework | **Node.js + Express** |
| API | **REST** |
| Auth | **JWT** (Supabase Auth `access_token`) |
| Database | **Supabase PostgreSQL** |
| Deploy | **Railway**, **Render**, atau **Fly.io** |

## Setup lokal

1. Buat project di [Supabase](https://supabase.com).
2. Jalankan SQL di `supabase/migrations/001_initial_schema.sql` (SQL Editor).
3. Salin `.env.example` → `.env` dan isi kunci dari Supabase → Settings → API.
4. Install & jalankan:

```bash
cd backend
npm install
npm run dev
```

API: `http://localhost:4000`  
Health: `GET http://localhost:4000/health`

## Environment

| Variabel | Keterangan |
|----------|------------|
| `PORT` | Port server (default 4000) |
| `CORS_ORIGIN` | URL frontend, mis. `http://localhost:5173` |
| `SUPABASE_URL` | URL project Supabase |
| `SUPABASE_ANON_KEY` | Anon key (opsional di server) |
| `SUPABASE_SERVICE_ROLE_KEY` | **Rahasia** — hanya di backend |

## Endpoint utama

### Auth (tanpa token)

- `POST /api/auth/register` — `{ email, password, name }`
- `POST /api/auth/login` — `{ email, password }`

Response berisi `session.access_token` → simpan di frontend.

### Auth (dengan token)

Header: `Authorization: Bearer <access_token>`

- `GET /api/auth/me`

### Finance (dengan token)

- `GET /api/finance` — seluruh state (books, accounts, transactions, …)
- `POST /api/finance/books` — `{ name }`
- `PATCH /api/finance/books/default` — `{ bookId }`
- `POST /api/finance/accounts` — `{ name, kind, accountSource }`
- `POST /api/finance/transactions` — transaksi income/expense
- `DELETE /api/finance/transactions/:id`
- `POST /api/finance/transfers` — `{ fromId, toId, amount }`
- `POST /api/finance/topups` — `{ accountId, amount }`

## Deploy backend (contoh Railway)

1. Push folder `backend/` ke **repo Git terpisah** (sesuai aturan kuliah).
2. [railway.app](https://railway.app) → New Project → Deploy from GitHub.
3. Set root directory = `/` (repo backend saja).
4. Tambah environment variables (sama seperti `.env`).
5. Dapat URL publik, mis. `https://xxx.up.railway.app`.

## Hubungkan frontend (Vercel)

Di Vercel → Environment Variables:

```
VITE_API_URL=https://xxx.up.railway.app
```

Frontend memanggil:

```javascript
const res = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/login`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password }),
})
const { session, user } = await res.json()
// session.access_token untuk request berikutnya
```

## Arsitektur

```
React (Vercel)  --REST+JWT-->  Express (Railway)  --service role-->  Supabase DB
```

Ini memenuhi: **repo backend terpisah**, **Node/Express**, **REST API**, **JWT**, **Supabase**, sambil frontend tetap di **Vercel**.
