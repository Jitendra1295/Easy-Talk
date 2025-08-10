# Environment configuration

Create a `.env` file in `Easy-Talk/backend/` with the following keys (copy from `.env.example` or the template below):

Required
- PORT=5000
- NODE_ENV=production
- MONGODB_URI=your-mongodb-connection-string
- JWT_SECRET=your-strong-random-secret
- JWT_EXPIRES_IN=7d
- CORS_ORIGIN=https://your-frontend-domain
- RATE_LIMIT_WINDOW_MS=60000
- RATE_LIMIT_MAX_REQUESTS=1000

Example
```
PORT=5000
NODE_ENV=production
MONGODB_URI=mongodb+srv://<user>:<pass>@<cluster>/chat-app?retryWrites=true&w=majority
JWT_SECRET=change-me-please-<random>
JWT_EXPIRES_IN=7d
CORS_ORIGIN=https://your-frontend.example.com
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=1000
```

Deployment notes
- Set `CORS_ORIGIN` to your actual frontend URL (e.g., Vercel/Netlify preview or custom domain).
- Ensure your MongoDB IP access list allows your server.
- Never commit `.env` to source control.

