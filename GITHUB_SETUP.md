# GitHub Repository Setup Guide

This guide walks you through setting up your GitHub repository for automated CI/CD with IsoDisplay.

## Step 1: Create GitHub Repository

If you haven't already created a repository:

```bash
# Initialize git in your local project
git init

# Add all files
git add .

# Create initial commit
git commit -m "Initial commit: IsoDisplay production setup"

# Create repository on GitHub (using GitHub CLI)
gh repo create isodisplay --public --source=. --remote=origin --push
```

Or manually:

1. Go to [GitHub](https://github.com/new)
2. Create a new repository named `isodisplay`
3. Don't initialize with README (we already have one)
4. Push your local code:

```bash
git remote add origin https://github.com/yourusername/isodisplay.git
git branch -M main
git push -u origin main
```

## Step 2: Configure Repository Settings

### Enable GitHub Pages (Optional - for documentation)

1. Go to Settings → Pages
2. Source: Deploy from a branch
3. Branch: `main` / `docs` folder

### Branch Protection Rules

1. Go to Settings → Branches
2. Add rule for `main` branch:
   - Require pull request reviews
   - Require status checks to pass
   - Require branches to be up to date
   - Include administrators

## Step 3: Set Up GitHub Secrets

Go to Settings → Secrets and variables → Actions

### Required Secrets

Click "New repository secret" for each:

#### 1. `NEXTAUTH_SECRET`

Generate a secure secret:

```bash
openssl rand -base64 32
```

Value: `[generated-secret-string]`

#### 2. `DATABASE_URL`

Production database connection string:

```
postgresql://username:password@host:5432/database_name
```

#### 3. `NEXT_PUBLIC_APP_URL`

Your production URL:

```
https://your-domain.com
```

### Optional Secrets (for Docker Hub)

#### 4. `DOCKER_USERNAME`

Your Docker Hub username

#### 5. `DOCKER_PASSWORD`

Your Docker Hub access token (not password!)

- Go to [Docker Hub Security](https://hub.docker.com/settings/security)
- Create New Access Token
- Copy and use as secret

### Optional Secrets (for deployment platforms)

#### For Vercel:

- `VERCEL_TOKEN`: Get from [Vercel Account Settings](https://vercel.com/account/tokens)
- `VERCEL_ORG_ID`: Found in Vercel project settings
- `VERCEL_PROJECT_ID`: Found in Vercel project settings

#### For Railway:

- `RAILWAY_TOKEN`: Get from Railway dashboard

#### For AWS:

- `AWS_ACCESS_KEY_ID`: AWS IAM access key
- `AWS_SECRET_ACCESS_KEY`: AWS IAM secret key
- `AWS_REGION`: e.g., `us-east-1`

## Step 4: Configure GitHub Actions

The CI/CD workflow is already set up in `.github/workflows/ci.yml`

### Workflow Features:

- ✅ Runs on push to main/master/develop
- ✅ Runs on pull requests
- ✅ Tests with PostgreSQL service
- ✅ Builds Docker images
- ✅ Pushes to GitHub Container Registry
- ✅ Creates artifacts for deployment

### Manual Workflow Triggers

To run workflows manually:

1. Go to Actions tab
2. Select the workflow
3. Click "Run workflow"
4. Choose branch and run

## Step 5: Set Up GitHub Container Registry

GitHub Container Registry is automatically available for your repository.

### Pull Docker Images:

```bash
# Login to GitHub Container Registry
echo $GITHUB_TOKEN | docker login ghcr.io -u USERNAME --password-stdin

# Pull the image
docker pull ghcr.io/yourusername/isodisplay:latest
```

### Use in docker-compose.yml:

```yaml
services:
  app:
    image: ghcr.io/yourusername/isodisplay:latest
    # ... rest of configuration
```

## Step 6: Set Up Deployment Webhooks (Optional)

### For Auto-deployment on Push

1. Go to Settings → Webhooks
2. Add webhook with:
   - Payload URL: `https://your-server.com/webhook/deploy`
   - Content type: `application/json`
   - Secret: Generate secure webhook secret
   - Events: Push events

### Sample Webhook Handler (Node.js):

```javascript
const crypto = require('crypto');
const { exec } = require('child_process');

app.post('/webhook/deploy', (req, res) => {
  const signature = req.headers['x-hub-signature-256'];
  const payload = JSON.stringify(req.body);

  const hash = `sha256=${crypto
    .createHmac('sha256', process.env.WEBHOOK_SECRET)
    .update(payload)
    .digest('hex')}`;

  if (hash === signature) {
    exec('cd /app && docker-compose pull && docker-compose up -d', (error) => {
      if (error) {
        console.error('Deployment failed:', error);
        res.status(500).send('Deployment failed');
      } else {
        res.status(200).send('Deployed successfully');
      }
    });
  } else {
    res.status(401).send('Unauthorized');
  }
});
```

## Step 7: Monitor Deployments

### GitHub Actions Status

1. Go to Actions tab to see workflow runs
2. Click on a run to see detailed logs
3. Download artifacts if needed

### Deployment Environments

1. Go to Settings → Environments
2. Create environments:
   - `production`
   - `staging`
   - `development`

3. Configure environment protection rules:
   - Required reviewers
   - Deployment branches
   - Environment secrets

### Set Environment-Specific Secrets:

Each environment can have its own secrets that override repository secrets.

## Step 8: Badge Setup (Optional)

Add status badges to your README.md:

```markdown
![CI/CD](https://github.com/yourusername/isodisplay/workflows/CI%2FCD%20Pipeline/badge.svg)
![Docker](https://img.shields.io/docker/v/yourusername/isodisplay?sort=semver)
![License](https://img.shields.io/github/license/yourusername/isodisplay)
```

## Step 9: Release Management

### Create a Release:

```bash
# Tag the release
git tag -a v1.0.0 -m "Release version 1.0.0"
git push origin v1.0.0

# Or use GitHub CLI
gh release create v1.0.0 --title "Release v1.0.0" --notes "Release notes here"
```

### Automated Releases:

Add to `.github/workflows/release.yml`:

```yaml
name: Release

on:
  push:
    tags:
      - 'v*'

jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Create Release
        uses: actions/create-release@v1
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        with:
          tag_name: ${{ github.ref }}
          release_name: Release ${{ github.ref }}
          draft: false
          prerelease: false
```

## Step 10: Security Scanning

### Enable Dependabot:

1. Go to Settings → Security & analysis
2. Enable:
   - Dependabot alerts
   - Dependabot security updates
   - Code scanning

### Add Security Scanning Workflow:

Create `.github/workflows/security.yml`:

```yaml
name: Security Scan

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]
  schedule:
    - cron: '0 0 * * 0' # Weekly on Sunday

jobs:
  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Run Trivy vulnerability scanner
        uses: aquasecurity/trivy-action@master
        with:
          scan-type: 'fs'
          scan-ref: '.'
          format: 'sarif'
          output: 'trivy-results.sarif'

      - name: Upload Trivy results to GitHub Security
        uses: github/codeql-action/upload-sarif@v2
        with:
          sarif_file: 'trivy-results.sarif'
```

## Troubleshooting

### Common Issues:

1. **Workflow not triggering:**
   - Check branch names in workflow file
   - Verify file is in `.github/workflows/`
   - Check Actions are enabled in repository

2. **Docker push failing:**
   - Verify DOCKER_USERNAME and DOCKER_PASSWORD secrets
   - Check Docker Hub rate limits

3. **Tests failing:**
   - Check DATABASE_URL in workflow
   - Verify all dependencies are installed
   - Check for environment-specific code

### Debugging Workflows:

Add debug logging:

```yaml
- name: Debug
  run: |
    echo "Event: ${{ github.event_name }}"
    echo "Ref: ${{ github.ref }}"
    echo "SHA: ${{ github.sha }}"
```

## Next Steps

1. ✅ Push your code to GitHub
2. ✅ Verify CI/CD pipeline runs successfully
3. ✅ Check Docker images are created
4. ✅ Deploy to your production environment
5. ✅ Set up monitoring and alerts
6. ✅ Configure backup strategies

## Support

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [GitHub Container Registry Docs](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-container-registry)
- [GitHub Secrets Documentation](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
