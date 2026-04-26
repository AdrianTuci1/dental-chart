# Deploy Backend And Routing On Contabo VPS

## Goal

Run this project's backend on the same VPS as another existing backend without interfering with it.

Target setup:

- `api.simplu.io` stays on the existing backend and existing internal port
- `api.pixtooth.com` points to this project's backend on a different internal port
- optionally `app.pixtooth.com` serves the frontend for this project

Recommended internal port split:

- existing backend: `127.0.0.1:3000`
- this project backend: `127.0.0.1:3100`

Public traffic still comes through:

- `80`
- `443`

Nginx will separate traffic by hostname via `server_name`.

## Recommended Architecture

- VPS provider: Contabo
- DNS: Route53
- CDN: CloudFront only for frontend if desired
- Reverse proxy: Nginx
- Process manager: PM2
- Backend binding: `127.0.0.1:3100`

Recommended final mapping:

- `api.simplu.io` -> Nginx -> `127.0.0.1:3000`
- `api.pixtooth.com` -> Nginx -> `127.0.0.1:3100`
- `app.pixtooth.com` -> Nginx static frontend or CloudFront -> VPS

This avoids any collision between the two backends.

## 1. Connect To The VPS

```bash
ssh root@YOUR_VPS_IP
```

Or use a deploy user if already configured.

## 2. Prepare Folders

Recommended location:

```bash
mkdir -p /opt/pixtooth
cd /opt/pixtooth
```

If using a non-root user:

```bash
sudo mkdir -p /opt/pixtooth
sudo chown -R $USER:$USER /opt/pixtooth
cd /opt/pixtooth
```

## 3. Pull The Project From Git

```bash
git clone <YOUR_GIT_REPO_URL> repo
cd repo
git checkout debug-connection
```

For future updates:

```bash
cd /opt/pixtooth/repo
git pull origin debug-connection
```

Replace `debug-connection` with the actual deploy branch if needed.

## 4. Install Backend Dependencies

```bash
cd /opt/pixtooth/repo/server
npm install
```

If the backend has a build step:

```bash
npm run build
```

## 5. Configure Environment Variables

Create a backend `.env` in `server/`.

Example:

```env
PORT=3100
HOST=127.0.0.1
NODE_ENV=production
CORS_ORIGIN=https://app.pixtooth.com
```

Important rules:

- do not use port `3000` for this project
- bind to `127.0.0.1`, not `0.0.0.0`
- allow only your frontend domain in CORS

If your server uses database credentials, JWT secrets, S3 keys, or mail credentials, add them there too.

## 6. Run Backend With PM2

Install PM2 once:

```bash
sudo npm install -g pm2
```

Start the backend:

```bash
cd /opt/pixtooth/repo/server
pm2 start npm --name pixtooth-api -- start
```

If your backend runs with another script, adapt it:

```bash
pm2 start npm --name pixtooth-api -- run start
```

Save PM2 process list:

```bash
pm2 save
```

Enable startup:

```bash
pm2 startup
```

Useful commands:

```bash
pm2 status
pm2 logs pixtooth-backend
pm2 restart pixtooth-backend
pm2 stop pixtooth-backend
```

## 7. Install And Configure Nginx

Install Nginx if missing:

```bash
sudo apt update
sudo apt install -y nginx
```

### Existing backend stays separate

Your current backend can remain something like:

```nginx
server {
    listen 80;
    server_name api.simplu.io;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### Add new backend host for this project

Create:

```bash
sudo nano /etc/nginx/sites-available/api.pixtooth.com
```

Paste:

```nginx
server {
    listen 80;
    server_name api.pixtooth.com;

    location / {
        proxy_pass http://127.0.0.1:3100;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Enable it:

```bash
sudo ln -s /etc/nginx/sites-available/api.pixtooth.com /etc/nginx/sites-enabled/
```

### Optional frontend host

If you want frontend served from the same VPS:

```bash
sudo nano /etc/nginx/sites-available/app.pixtooth.com
```

Paste:

```nginx
server {
    listen 80;
    server_name app.pixtooth.com;

    root /opt/pixtooth/repo/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

Enable it:

```bash
sudo ln -s /etc/nginx/sites-available/app.pixtooth.com /etc/nginx/sites-enabled/
```

### Validate and reload

```bash
sudo nginx -t
sudo systemctl reload nginx
```

## 8. Build Frontend If Needed

If serving frontend from the same VPS:

```bash
cd /opt/pixtooth/repo
npm install
npm run build
```

This should generate `dist/`.

## 9. Configure Route53

Create DNS records pointing to the Contabo VPS public IP.

Recommended:

- `A` record: `api.pixtooth.com` -> `YOUR_VPS_IP`
- `A` record: `app.pixtooth.com` -> `YOUR_VPS_IP`

Your existing:

- `api.simplu.io` can continue to point to the same VPS IP

This is safe because Nginx routes based on hostname, not only IP.

## 10. Add SSL With Certbot

Install Certbot:

```bash
sudo apt install -y certbot python3-certbot-nginx
```

Then issue certificates:

```bash
sudo certbot --nginx -d api.pixtooth.com -d app.pixtooth.com
```

If only backend exists for now:

```bash
sudo certbot --nginx -d api.pixtooth.com
```

This will update Nginx to serve HTTPS on `443`.

## 11. Firewall Rules

Only expose:

- `22`
- `80`
- `443`

Do not expose:

- `3000`
- `3100`

Those internal ports should only be reachable from Nginx on localhost.

Example with UFW:

```bash
sudo ufw allow OpenSSH
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable
```

## 12. CloudFront Recommendation

Recommended usage:

- use CloudFront only for `app.pixtooth.com`
- do not put the backend behind CloudFront unless you specifically need it

Reason:

- frontend static assets benefit from CDN
- APIs need more careful cache and header handling
- direct Route53 -> VPS is simpler and safer for backend

Recommended final DNS shape:

- `app.pixtooth.com` -> CloudFront -> VPS or Nginx frontend origin
- `api.pixtooth.com` -> Route53 directly to VPS

## 13. Deploy Flow For Future Updates

### Backend update

```bash
cd /opt/pixtooth/repo
git pull origin debug-connection

cd server
npm install
pm2 restart pixtooth-backend
```

### Frontend update

```bash
cd /opt/pixtooth/repo
git pull origin debug-connection
npm install
npm run build
```

If Nginx config changed:

```bash
sudo nginx -t
sudo systemctl reload nginx
```

## 14. Verification Checklist

Check backend locally on VPS:

```bash
curl http://127.0.0.1:3100
```

Check PM2:

```bash
pm2 status
pm2 logs pixtooth-backend
```

Check Nginx:

```bash
sudo nginx -t
sudo systemctl status nginx
```

Check public routing:

```bash
curl -I https://api.pixtooth.com
curl -I https://app.pixtooth.com
```

## 15. Why This Will Not Interfere With api.simplu.io

Because separation happens at three levels:

- different domain names
  - `api.simplu.io`
  - `api.pixtooth.com`
- different internal ports
  - existing backend on `3000`
  - this backend on `3100`
- different Nginx `server_name` blocks
  - each hostname proxies to its own service

As long as you keep this project's backend off port `3000`, there is no conflict with the existing API.

## 16. Recommended Final Layout

```text
/opt/pixtooth/repo
  /server
  /src
  /dist
```

Nginx:

- `api.simplu.io` -> existing service
- `api.pixtooth.com` -> `127.0.0.1:3100`
- `app.pixtooth.com` -> `/opt/pixtooth/repo/dist`

PM2:

- `pixtooth-api`

## 17. Optional Next Step

If needed, create:

- an `ecosystem.config.js` for PM2
- a small deploy script
- separate staging and production branches/domains
