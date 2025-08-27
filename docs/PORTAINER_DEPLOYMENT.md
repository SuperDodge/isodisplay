# Portainer Stack Deployment on TrueNAS

## Prerequisites

1. TrueNAS SCALE with Portainer installed
2. Docker configured and running
3. Access to Portainer web interface
4. Storage pool configured (default: `/mnt/tank/appdata`)

## Deployment Steps

### 1. Prepare TrueNAS Storage

Create the necessary directories on your TrueNAS system:

```bash
# SSH into TrueNAS
ssh root@your-truenas-ip

# Create application data directories
mkdir -p /mnt/tank/appdata/isodisplay/{postgres,uploads,nginx/conf.d,nginx/ssl,nginx/cache}

# Set proper permissions
chmod -R 755 /mnt/tank/appdata/isodisplay
```

### 2. Build and Push Docker Image

On your development machine:

```bash
# Build the production image
docker build -t isodisplay:latest .

# Tag for your registry (if using private registry)
docker tag isodisplay:latest your-registry/isodisplay:latest

# Push to registry
docker push your-registry/isodisplay:latest
```

### 3. Configure Nginx Files

Copy nginx configuration files to TrueNAS:

```bash
# Copy nginx configs to TrueNAS
scp nginx/nginx.conf root@your-truenas-ip:/mnt/tank/appdata/isodisplay/nginx/
scp -r nginx/conf.d/* root@your-truenas-ip:/mnt/tank/appdata/isodisplay/nginx/conf.d/
```

### 4. Deploy Stack in Portainer

1. **Access Portainer**: Navigate to `http://your-truenas-ip:9000`

2. **Create Stack**:
   - Go to "Stacks" → "Add stack"
   - Name: `isodisplay`
   - Choose "Upload" and select `docker-compose.portainer.yml`

3. **Configure Environment Variables**:
   Add these in the "Environment variables" section:

   ```
   POSTGRES_PASSWORD=your-secure-password
   NEXTAUTH_URL=https://your-domain.com
   NEXTAUTH_SECRET=generate-with-openssl-rand-base64-32
   DOMAIN_NAME=your-domain.com
   HTTP_PORT=80
   HTTPS_PORT=443
   ```

4. **Deploy**: Click "Deploy the stack"

### 5. Verify Deployment

Check that all services are running:

```bash
# Via Portainer UI
# Go to "Containers" and verify all three containers are running

# Via CLI
docker ps | grep isodisplay
```

### 6. Initial Database Setup

Run database migrations:

```bash
# Exec into the Next.js container
docker exec -it isodisplay-app sh

# Run migrations (once Prisma is set up)
npx prisma migrate deploy
```

## Backup Configuration

### Automated Backups

Create a backup script at `/mnt/tank/scripts/backup-isodisplay.sh`:

```bash
#!/bin/bash
BACKUP_DIR="/mnt/tank/backups/isodisplay"
DATE=$(date +%Y%m%d_%H%M%S)

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup PostgreSQL
docker exec isodisplay-db pg_dump -U isodisplay isodisplay | gzip > $BACKUP_DIR/db_$DATE.sql.gz

# Backup uploads
tar czf $BACKUP_DIR/uploads_$DATE.tar.gz /mnt/tank/appdata/isodisplay/uploads

# Keep only last 7 days of backups
find $BACKUP_DIR -name "*.gz" -mtime +7 -delete
```

Schedule with cron:

```bash
# Add to crontab
0 2 * * * /mnt/tank/scripts/backup-isodisplay.sh
```

## Monitoring

### Health Checks

- PostgreSQL: `http://your-truenas-ip:9000` (Portainer dashboard)
- Application: `http://your-domain.com/api/health`
- Nginx: `http://your-domain.com/health`

### Logs

View logs in Portainer or via CLI:

```bash
# Application logs
docker logs isodisplay-app

# Database logs
docker logs isodisplay-db

# Nginx logs
docker logs isodisplay-proxy
```

## Troubleshooting

### Common Issues

1. **Permission Denied**:
   - Check TrueNAS dataset permissions
   - Ensure Docker has access to mount paths

2. **Database Connection Failed**:
   - Verify PostgreSQL container is healthy
   - Check DATABASE_URL environment variable
   - Review PostgreSQL logs

3. **502 Bad Gateway**:
   - Check if Next.js app is running
   - Verify nginx upstream configuration
   - Review application logs

### Useful Commands

```bash
# Restart stack
docker-compose -f docker-compose.portainer.yml restart

# View real-time logs
docker-compose -f docker-compose.portainer.yml logs -f

# Stop stack
docker-compose -f docker-compose.portainer.yml down

# Remove stack (preserves volumes)
docker-compose -f docker-compose.portainer.yml down

# Remove everything (including volumes) - CAUTION
docker-compose -f docker-compose.portainer.yml down -v
```

## Updating the Application

1. Build new image with updated code
2. Push to registry
3. In Portainer: Stack → isodisplay → "Update"
4. Click "Re-deploy"

## Security Considerations

1. **Use strong passwords** for PostgreSQL and NextAuth
2. **Enable HTTPS** with valid SSL certificates
3. **Configure firewall** rules on TrueNAS
4. **Regular backups** of database and uploads
5. **Monitor logs** for suspicious activity
6. **Keep images updated** with security patches
