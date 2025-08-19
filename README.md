# Amsral Lanka Backend API

Backend API for the Amsral Lanka MRP (Material Resource Planning) system built with Node.js, Express.js, PostgreSQL, and Drizzle ORM.

## Features

- RESTful API with Express.js
- PostgreSQL database with Drizzle ORM
- User management system
- Database migrations with Drizzle Kit
- Environment-based configuration
- CORS enabled
- Request logging middleware

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn package manager
- PostgreSQL database (we're using Neon PostgreSQL)

## Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd amsral-lanka-be
```

2. Install dependencies:

```bash
npm install
```

3. Create a `.env` file in the root directory:

```bash
DATABASE_URL=postgresql://neondb_owner:npg_KhIcY2g3VWbe@ep-raspy-art-a14bbhex-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
PORT=3000
NODE_ENV=development
```

## Database Setup

### Generate Migration Files

Generate migration files based on your schema changes:

```bash
npm run db:generate
```

<!-- ### Push Schema to Database

Push the schema directly to the database (good for development):

```bash
npm run db:push
``` -->

### Run Migrations

Apply pending migrations to the database:

```bash
npm run db:migrate
```

### Database Studio

Open Drizzle Studio to view and manage your database:

```bash
npm run db:studio
```

## Seeding Data

Seed the database with sample users:

```bash
node src/seeders/userSeeder.js
```

## Running the Application

### Development Mode

Start the server with auto-restart on file changes:

```bash
npm run dev
```

### Production Mode

Start the server in production mode:

```bash
npm start
```

The server will start on `http://localhost:3000` (or the port specified in your `.env` file).

## API Endpoints

### Health Check

- **GET** `/health` - Check server and database health

### Users

- **GET** `/api/users` - Get all users with pagination
  - Query parameters:
    - `page` (number): Page number (default: 1)
    - `limit` (number): Items per page (default: 10, max: 100)
    - `active` (boolean): Filter by active status
- **GET** `/api/users/:id` - Get user by ID
- **GET** `/api/users/email/:email` - Get user by email
- **GET** `/api/users/stats` - Get user statistics

### Example API Calls

```bash
# Get all users
curl http://localhost:3000/api/users

# Get users with pagination
curl "http://localhost:3000/api/users?page=1&limit=5"

# Get only active users
curl "http://localhost:3000/api/users?active=true"

# Get user by ID
curl http://localhost:3000/api/users/1

# Get user by email
curl http://localhost:3000/api/users/email/john.doe@example.com

# Get user statistics
curl http://localhost:3000/api/users/stats

# Health check
curl http://localhost:3000/health
```

## Project Structure

```
src/
├── app.js              # Express app configuration
├── server.js           # Server startup
├── config/
│   └── db.js          # Database connection and Drizzle setup
├── controllers/
│   └── userController.js  # User API controllers
├── db/
│   └── schema.js      # Drizzle database schema
├── models/
│   └── User.js        # User model with business logic
├── routes/
│   └── userRoutes.js  # User API routes
└── seeders/
    └── userSeeder.js  # Database seeder for sample data

drizzle/               # Generated migration files
migrations/           # Legacy migration files (for reference)
```

## Database Schema

### Users Table

- `id` (serial, primary key)
- `email` (varchar, unique, not null)
- `first_name` (varchar, not null)
- `last_name` (varchar, not null)
- `password_hash` (varchar, not null)
- `phone` (varchar, optional)
- `date_of_birth` (date, optional)
- `is_active` (boolean, default: true)
- `created_at` (timestamp with timezone, default: now)
- `updated_at` (timestamp with timezone, default: now)

## Available Scripts

- `npm start` - Start the production server
- `npm run dev` - Start the development server with nodemon
- `npm run db:generate` - Generate migration files from schema changes
- `npm run db:push` - Push schema changes directly to database
- `npm run db:migrate` - Run pending migrations
- `npm run db:studio` - Open Drizzle Studio for database management
- `npm test` - Run tests (not implemented yet)

## Environment Variables

- `DATABASE_URL` - PostgreSQL connection string
- `PORT` - Server port (default: 3000)
- `NODE_ENV` - Environment mode (development/production)

## Technologies Used

- **Node.js** - JavaScript runtime
- **Express.js** - Web framework
- **Drizzle ORM** - TypeScript ORM for SQL databases
- **PostgreSQL** - Relational database
- **Drizzle Kit** - Migration tool for Drizzle ORM
- **cors** - Cross-Origin Resource Sharing middleware
- **dotenv** - Environment variable loader

## Development Workflow

1. Make changes to the database schema in `src/db/schema.js`
2. Generate migration files: `npm run db:generate`
3. Apply changes to database: `npm run db:push` (development) or `npm run db:migrate` (production)
4. Test your changes with the API endpoints
5. Use `npm run db:studio` to visually inspect your database

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the ISC License.
