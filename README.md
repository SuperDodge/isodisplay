# IsoDisplay - Digital Content Management System

A modern digital content management and display system built with Next.js, TypeScript, and PostgreSQL.

## Features

- 📊 **Digital Content Management**: Upload and organize images, videos, and PDFs
- 🖼️ **Dynamic Display System**: Create and manage digital displays with playlists
- 👥 **Multi-user Support**: Role-based access control with admin and user roles
- 🎨 **Customizable Layouts**: Multiple display layouts and configurations
- 📱 **Responsive Design**: Works on desktop, tablet, and mobile devices
- 🔒 **Secure Authentication**: Built-in authentication with NextAuth.js
- 📁 **File Management**: Organized file storage with automatic thumbnail generation
- 🎬 **Playlist Support**: Create and schedule content playlists
- 📊 **Analytics**: Track display views and content performance

## Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **Backend**: Node.js, Express, Prisma ORM
- **Database**: PostgreSQL
- **Authentication**: NextAuth.js
- **File Processing**: Sharp (images), FFmpeg (videos), PDF.js
- **Real-time**: Socket.io for live updates
- **Deployment**: Docker, GitHub Actions

## Prerequisites

- Node.js 20.x or higher
- PostgreSQL 15.x or higher
- FFmpeg (for video processing)
- npm or yarn

## Installation

### Local Development

1. Clone the repository:

```bash
git clone https://github.com/yourusername/isodisplay.git
cd isodisplay
```

2. Install dependencies:

```bash
npm install
```

3. Set up environment variables:

```bash
cp .env.example .env
# Edit .env with your configuration
```

4. Set up the database:

```bash
npx prisma migrate dev
npx prisma db seed
```

5. Start the development server:

```bash
npm run dev
```

Visit `http://localhost:3000` to see the application.

### Docker Deployment

1. Clone the repository:

```bash
git clone https://github.com/yourusername/isodisplay.git
cd isodisplay
```

2. Create environment file:

```bash
cp .env.production.example .env
# Edit .env with your production configuration
```

3. Build and run with Docker Compose:

```bash
docker-compose up -d
```

The application will be available at `http://localhost:3000`.

## Environment Variables

### Required Variables

- `DATABASE_URL`: PostgreSQL connection string
- `NEXTAUTH_SECRET`: Secret for NextAuth.js (generate with `openssl rand -base64 32`)
- `NEXTAUTH_URL`: Your application URL

### Optional Variables

- `UPLOAD_DIR`: Directory for file uploads (default: `./uploads`)
- `MAX_FILE_SIZE`: Maximum file size in bytes (default: 100MB)
- `NODE_ENV`: Environment mode (`development`, `production`)

## Project Structure

```
isodisplay/
├── src/
│   ├── app/              # Next.js app directory
│   ├── components/       # React components
│   ├── lib/             # Utility functions
│   ├── styles/          # Global styles
│   └── types/           # TypeScript types
├── prisma/              # Database schema and migrations
├── public/              # Static files
├── uploads/             # User uploads (gitignored)
├── scripts/             # Utility scripts
└── docker-compose.yml   # Docker configuration
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint
- `npm run type-check` - Check TypeScript types
- `npm run db:migrate` - Run database migrations
- `npm run db:seed` - Seed database with sample data
- `npm run db:reset` - Reset database (development only)

## Default Admin Account

After seeding the database, you can log in with:

- **Email**: admin@example.com
- **Password**: admin123

⚠️ **Important**: Change these credentials immediately in production!

## Production Deployment

### Using GitHub Actions

The project includes a CI/CD pipeline that:

1. Runs tests and linting on pull requests
2. Builds Docker images on merge to main
3. Pushes images to GitHub Container Registry

### Required GitHub Secrets

Set these in your repository settings:

- `DOCKER_USERNAME` (optional, for Docker Hub)
- `DOCKER_PASSWORD` (optional, for Docker Hub)
- `NEXT_PUBLIC_APP_URL` - Your production URL

### Manual Deployment

1. Build the Docker image:

```bash
docker build -t isodisplay:latest .
```

2. Run with environment variables:

```bash
docker run -d \
  -p 3000:3000 \
  -e DATABASE_URL="your-database-url" \
  -e NEXTAUTH_SECRET="your-secret" \
  -e NEXTAUTH_URL="https://your-domain.com" \
  -v /path/to/uploads:/app/uploads \
  isodisplay:latest
```

## Security Considerations

- Always use HTTPS in production
- Set strong passwords for all accounts
- Keep dependencies updated
- Use environment variables for sensitive data
- Configure rate limiting for API endpoints
- Implement proper CORS settings
- Regular database backups

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For issues and questions, please use the GitHub issue tracker.

## Acknowledgments

- Built with Next.js and the amazing React ecosystem
- Uses Tailwind CSS for styling
- Prisma for database management
- Special thanks to all contributors
