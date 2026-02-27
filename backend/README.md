# eSIM Launch Backend API

Backend middleware service for eSIM Launch platform. This service acts as a proxy between merchants and eSIM Access API.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. Set up database:
```bash
# Generate Prisma client
npm run prisma:generate

# Run migrations
npm run prisma:migrate
```

4. Start development server:
```bash
npm run dev
```

## Environment Variables

See `.env.example` for all required environment variables.

## Database

This project uses PostgreSQL with Prisma ORM. Run migrations to set up the database schema.

## API Endpoints

- `GET /health` - Health check
- `GET /` - API information

More endpoints will be added as development progresses.

## Development

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run prisma:studio` - Open Prisma Studio to view database













