# Frontend environment config

Create a `.env` file in `Easy-Talk/frontend/` (not committed) with:

```
VITE_API_BASE=/api
VITE_SOCKET_URL=https://your-backend-domain:5000
```

Notes
- In local dev, `VITE_API_BASE=/api` works with the Vite proxy in `vite.config.ts`.
- For production, set `VITE_SOCKET_URL` to your backend base (e.g., `https://api.example.com`).

