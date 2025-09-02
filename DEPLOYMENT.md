# Deployment Guide for IsoDisplay

This guide covers various deployment options for the IsoDisplay application.

## Prerequisites

Before deploying, ensure you have:

- A PostgreSQL database (version 15 or higher)
- Node.js 20.x or higher (for building)
- A domain name (for production)
- SSL certificate (Let's Encrypt recommended)

## Environment Variables

Create a `.env` file with the following variables:

```env
# Required
DATABASE_URL=postgresql://username:password@host:5432/dbname
NEXTAUTH_SECRET=your-secret-key-here  # Generate with: openssl rand -base64 32
NEXTAUTH_URL=https://your-domain.com

# Optional
NODE_ENV=production
UPLOAD_DIR=/app/uploads
MAX_FILE_SIZE=104857600
```

## Deployment Options

### Option 1: Docker Deployment (Recommended)

#### Using Docker Compose

1. **Prepare environment file:**

```bash
cp .env.production.example .env
# Edit .env with your configuration
```

2. **Start the application:**

```bash
docker-compose up -d
```

3. **View logs:**

```bash
docker-compose logs -f app
```

4. **Stop the application:**

```bash
docker-compose down
```

#### Using Docker without Compose

1. **Build the image:**

```bash
docker build -t isodisplay:latest .
```

2. **Run the container:**

```bash
docker run -d \
  --name isodisplay \
  -p 3000:3000 \
  -e DATABASE_URL="postgresql://..." \
  -e NEXTAUTH_SECRET="..." \
  -e NEXTAUTH_URL="https://your-domain.com" \
  -v /path/to/uploads:/app/uploads \
  isodisplay:latest
```

### Option 2: VPS Deployment (Ubuntu/Debian)

1. **Install dependencies:**

```bash
# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PostgreSQL
sudo apt-get install postgresql postgresql-contrib

# Install FFmpeg for video processing
sudo apt-get install ffmpeg

# Install PM2 for process management
sudo npm install -g pm2
```

2. **Clone and setup:**

```bash
git clone https://github.com/yourusername/isodisplay.git
cd isodisplay
npm install
npx prisma generate
npm run build
```

3. **Setup database:**

```bash
npx prisma migrate deploy
npx prisma db seed  # Optional: seed with sample data
```

4. **Start with PM2:**

```bash
pm2 start npm --name "isodisplay" -- start
pm2 save
pm2 startup
```

### Option 3: Platform-as-a-Service (PaaS)

#### Vercel

1. **Install Vercel CLI:**

```bash
npm i -g vercel
```

2. **Deploy:**

```bash
vercel --prod
```

3. **Set environment variables in Vercel dashboard**

#### Railway

1. **Install Railway CLI:**

```bash
npm i -g @railway/cli
```

2. **Deploy:**

```bash
railway login
railway init
railway up
```

3. **Add PostgreSQL addon in Railway dashboard**

#### Render

1. **Create a new Web Service on Render**
2. **Connect your GitHub repository**
3. **Set build command:** `npm install && npx prisma generate && npm run build`
4. **Set start command:** `npm start`
5. **Add environment variables**
6. **Create a PostgreSQL database on Render**

### Option 4: Kubernetes Deployment

See `k8s/` directory for Kubernetes manifests (if available).

## Reverse Proxy Setup

### Nginx Configuration

```nginx
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

    client_max_body_size 100M;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /uploads {
        alias /var/www/isodisplay/uploads;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
}
```

### Apache Configuration

```apache
<VirtualHost *:443>
    ServerName your-domain.com

    SSLEngine on
    SSLCertificateFile /etc/letsencrypt/live/your-domain.com/fullchain.pem
    SSLCertificateKeyFile /etc/letsencrypt/live/your-domain.com/privkey.pem

    ProxyPreserveHost On
    ProxyPass / http://localhost:3000/
    ProxyPassReverse / http://localhost:3000/

    <Location /uploads>
        ProxyPass !
        Alias /var/www/isodisplay/uploads
    </Location>
</VirtualHost>
```

## Database Backup

### Automated Backups

Create a backup script `/usr/local/bin/backup-isodisplay.sh`:

```bash
#!/bin/bash
BACKUP_DIR="/backups/isodisplay"
DB_NAME="isodisplay"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR
pg_dump $DB_NAME | gzip > $BACKUP_DIR/backup_$DATE.sql.gz

# Keep only last 30 days of backups
find $BACKUP_DIR -name "backup_*.sql.gz" -mtime +30 -delete
```

Add to crontab:

```bash
0 2 * * * /usr/local/bin/backup-isodisplay.sh
```

## Monitoring

### Health Check Endpoint

The application provides a health check at `/api/health`:

```bash
curl https://your-domain.com/api/health
```

### Recommended Monitoring Tools

- **Uptime Monitoring**: UptimeRobot, Pingdom
- **Application Monitoring**: Sentry, LogRocket
- **Infrastructure Monitoring**: Datadog, New Relic
- **Log Management**: Papertrail, Loggly

## Security Checklist

- [ ] Use HTTPS everywhere
- [ ] Set strong `NEXTAUTH_SECRET`
- [ ] Configure firewall rules
- [ ] Enable rate limiting
- [ ] Regular security updates
- [ ] Implement backup strategy
- [ ] Monitor for suspicious activity
- [ ] Use strong database passwords
- [ ] Restrict database access
- [ ] Configure CORS properly

## Troubleshooting

### Common Issues

1. **Database connection errors:**
   - Check `DATABASE_URL` format
   - Verify PostgreSQL is running
   - Check firewall rules

2. **File upload issues:**
   - Verify upload directory permissions
   - Check disk space
   - Verify `MAX_FILE_SIZE` setting

3. **Authentication problems:**
   - Verify `NEXTAUTH_URL` matches your domain
   - Check `NEXTAUTH_SECRET` is set
   - Clear browser cookies

4. **Performance issues:**
   - Enable database connection pooling
   - Configure CDN for static assets
   - Implement Redis caching (optional)

### Logs

- **Docker:** `docker logs isodisplay`
- **PM2:** `pm2 logs isodisplay`
- **Systemd:** `journalctl -u isodisplay`

## Performance Optimization

1. **Enable CDN for static assets**
2. **Configure database connection pooling**
3. **Implement Redis for session storage (optional)**
4. **Use S3 or similar for file storage (optional)**
5. **Enable HTTP/2 in reverse proxy**
6. **Configure appropriate cache headers**

## Scaling

### Horizontal Scaling

1. **Use external PostgreSQL database**
2. **Store uploads in S3 or shared storage**
3. **Configure load balancer**
4. **Use Redis for session storage**
5. **Deploy multiple application instances**

### Vertical Scaling

- Increase server resources (CPU, RAM)
- Optimize database queries
- Implement caching strategies

## Support

For deployment issues:

1. Check the [GitHub Issues](https://github.com/yourusername/isodisplay/issues)
2. Review application logs
3. Verify environment variables
4. Test database connectivity
