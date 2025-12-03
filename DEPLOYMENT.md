# 🚀 MoodChat Deployment Guide

## Two Deployment Modes

### 1. Development Mode (Frontend + Backend Separate)
- Frontend runs on Vite dev server (port 5173)
- Backend runs on Uvicorn (port 8000)
- Hot reload for both

### 2. Production Mode (Backend Serves Frontend)
- Backend serves built React app
- Single server on port 8000
- No separate frontend server needed

---

## Development Mode Setup

### Terminal 1: Backend
```bash
# Choose one backend:
uvicorn server_new:app --reload --host 127.0.0.1 --port 8000
# OR
uvicorn server_dynamic:app --reload --host 127.0.0.1 --port 8000
```

### Terminal 2: Frontend
```bash
cd frontend
npm run dev
```

### Access
- Frontend: http://localhost:5173
- Backend API: http://localhost:8000/api/*

---

## Production Mode Setup

### Step 1: Build Frontend

```bash
cd frontend
npm run build
```

This creates `frontend/dist/` with:
```
frontend/dist/
├── index.html
├── assets/
│   ├── index-[hash].js
│   ├── index-[hash].css
│   └── ...
```

### Step 2: Start Backend

```bash
# Backend will automatically serve the built frontend
uvicorn server_new:app --host 0.0.0.0 --port 8000
# OR
uvicorn server_dynamic:app --host 0.0.0.0 --port 8000
```

### Access
- Everything: http://localhost:8000
- Root (/) serves React app
- API at /api/*

---

## How It Works

### Backend Auto-Detection

Both `server_new.py` and `server_dynamic.py` check for built frontend:

```python
frontend_build_path = Path(__file__).parent / "frontend" / "dist"

if frontend_build_path.exists():
    # Serve React app
    app.mount("/assets", StaticFiles(directory=str(frontend_build_path / "assets")))
```

### Routes

**With Built Frontend**:
- `GET /` → Serves `frontend/dist/index.html`
- `GET /assets/*` → Serves static JS/CSS files
- `GET /api/*` → API endpoints
- `WS /ws/{id}` → WebSocket connections

**Without Built Frontend** (dev mode):
- `GET /` → Returns JSON with API info
- `GET /api/*` → API endpoints
- `WS /ws/{id}` → WebSocket connections

---

## Production Deployment

### Option 1: Single Server (Recommended)

```bash
# 1. Build frontend
cd frontend
npm run build
cd ..

# 2. Start production server
uvicorn server_new:app --host 0.0.0.0 --port 8000 --workers 4
```

**Pros**:
- Simple deployment
- Single process
- Easy to manage

**Cons**:
- Backend serves static files (less efficient than nginx)
- Limited to Uvicorn's static file performance

### Option 2: Nginx + Backend (Better Performance)

**nginx.conf**:
```nginx
server {
    listen 80;
    server_name your-domain.com;

    # Serve React app
    location / {
        root /path/to/frontend/dist;
        try_files $uri /index.html;
    }

    # Serve static assets
    location /assets/ {
        root /path/to/frontend/dist;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Proxy API requests to backend
    location /api/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Proxy WebSocket connections
    location /ws/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

**Start Backend**:
```bash
uvicorn server_new:app --host 127.0.0.1 --port 8000 --workers 4
```

**Pros**:
- Nginx handles static files (very efficient)
- Better performance
- Can add SSL/HTTPS easily
- Load balancing support

**Cons**:
- More complex setup
- Need to configure nginx

---

## Environment Configuration

### Development
Frontend `.env.development`:
```
VITE_API_URL=http://localhost:8000
```

### Production
Frontend `.env.production`:
```
VITE_API_URL=
```
(Empty = uses same origin)

Update `frontend/src/api.ts`:
```typescript
const API_BASE_URL = import.meta.env.VITE_API_URL || window.location.origin;
```

---

## Docker Deployment (Optional)

### Dockerfile
```dockerfile
# Multi-stage build
FROM node:18 AS frontend-build
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

FROM python:3.10-slim
WORKDIR /app

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend
COPY server_new.py .
COPY server_dynamic.py .

# Copy built frontend
COPY --from=frontend-build /app/frontend/dist ./frontend/dist

# Expose port
EXPOSE 8000

# Start backend (choose one)
CMD ["uvicorn", "server_new:app", "--host", "0.0.0.0", "--port", "8000"]
```

### docker-compose.yml
```yaml
version: '3.8'

services:
  moodchat:
    build: .
    ports:
      - "8000:8000"
    environment:
      - OLLAMA_BASE_URL=http://ollama:11434
    depends_on:
      - ollama

  ollama:
    image: ollama/ollama:latest
    ports:
      - "11434:11434"
    volumes:
      - ollama_data:/root/.ollama

volumes:
  ollama_data:
```

---

## Testing Production Build Locally

### Step 1: Build
```bash
cd frontend
npm run build
```

### Step 2: Preview
```bash
# Option A: Using Vite preview
npm run preview

# Option B: Using backend
cd ..
uvicorn server_new:app --host 127.0.0.1 --port 8000
```

### Step 3: Test
Open http://localhost:8000

---

## Troubleshooting

### Frontend Build Issues

**Error: "npm run build" fails**
```bash
# Clear cache and reinstall
cd frontend
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Backend Not Serving Frontend

**Check if dist exists**:
```bash
ls -la frontend/dist/
```

**Should see**:
```
index.html
assets/
```

**If missing**:
```bash
cd frontend
npm run build
```

### CORS Errors in Production

Backend already has CORS configured for both modes:
```python
allow_origins=["http://localhost:5173", "http://localhost:8000"]
```

For custom domain, add it:
```python
allow_origins=["http://localhost:5173", "http://localhost:8000", "https://your-domain.com"]
```

### WebSocket Connection Failed

Make sure WebSocket URL matches:
```typescript
// frontend/src/api.ts
createWebSocket(conversationId: string): WebSocket {
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsHost = window.location.host;  // Automatically uses same host
    return new WebSocket(`${wsProtocol}//${wsHost}/ws/${conversationId}`);
}
```

---

## Performance Optimization

### Frontend
```bash
# Build with optimizations
cd frontend
npm run build

# Analyze bundle size
npm run build -- --mode analyze
```

### Backend
```bash
# Use multiple workers
uvicorn server_new:app --host 0.0.0.0 --port 8000 --workers 4

# Use production ASGI server
pip install gunicorn
gunicorn server_new:app --workers 4 --worker-class uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```

---

## Security Checklist

### Production Security

- [ ] Set allowed CORS origins to specific domains
- [ ] Use HTTPS/WSS in production
- [ ] Set secure headers in nginx/backend
- [ ] Limit file upload sizes (already set to 1MB)
- [ ] Add rate limiting
- [ ] Use environment variables for secrets
- [ ] Enable authentication (if needed)
- [ ] Regular security updates

### Example: Secure Headers
```python
from fastapi.middleware.trustedhost import TrustedHostMiddleware

app.add_middleware(
    TrustedHostMiddleware,
    allowed_hosts=["your-domain.com", "www.your-domain.com"]
)
```

---

## Monitoring

### Health Check Endpoint
Add to backend:
```python
@app.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}
```

### Logging
```bash
uvicorn server_new:app --log-level info --access-log
```

---

## Quick Commands Reference

```bash
# Development
uvicorn server_new:app --reload --host 127.0.0.1 --port 8000
cd frontend && npm run dev

# Build Frontend
cd frontend && npm run build

# Production (Single Server)
uvicorn server_new:app --host 0.0.0.0 --port 8000 --workers 4

# Production (with Gunicorn)
gunicorn server_new:app --workers 4 --worker-class uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000

# Check if frontend is built
ls frontend/dist/index.html
```

---

**You're ready to deploy! 🚀**

Choose development mode for testing, production mode for deployment!
