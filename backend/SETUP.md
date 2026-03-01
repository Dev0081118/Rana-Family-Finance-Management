# Backend Setup Guide

## Prerequisites

- Node.js >= 16.0.0
- MongoDB (local or Atlas)
- npm or yarn

## Quick Setup

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Start MongoDB

**If using local MongoDB:**
```bash
# macOS (Homebrew)
brew services start mongodb-community

# Ubuntu/Debian
sudo systemctl start mongod

# Windows
net start MongoDB
```

**If using MongoDB Atlas:**
- Get your connection string from Atlas dashboard
- Update `MONGODB_URI` in `.env` file

### 3. Configure Environment

The `.env` file is already configured with your credentials:

```env
MONGODB_URI=mongodb://divyarajsinhrana0081_db_user:Rana0081.@localhost:27017/home_finance
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production_min_32_chars_long
```

**IMPORTANT:** Change the `JWT_SECRET` to a strong random string before production!

Generate a strong secret:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 4. Run the Server

```bash
# Development (with auto-reload)
npm run dev

# Production
npm start
```

Expected output:
```
MongoDB Connected: localhost
Database: home_finance
Server running in development mode on port 5000
```

### 5. Test the API

Open a new terminal and test:

```bash
# Health check
curl http://localhost:5000/api/v1/health

# Register a user
curl -X POST http://localhost:5000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"John Doe","email":"john@example.com","password":"password123","role":"admin"}'

# Login
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john@example.com","password":"password123"}'
```

## Project Structure

```
backend/
├── config/
│   └── database.js          # MongoDB connection
├── controllers/             # Business logic
├── middleware/              # Auth, validation, errors
├── models/                  # Mongoose schemas
├── routes/                  # API endpoints
├── .env                     # Your config (DO NOT COMMIT)
├── .env.example             # Template
├── server.js                # Express app
├── package.json
└── README.md                # Full documentation
```

## Available Scripts

- `npm start` - Start server (production)
- `npm run dev` - Start with nodemon (auto-reload)
- `npm test` - Run tests (if configured)
- `npm run lint` - Lint code (if configured)

## Common Issues

### MongoDB Connection Refused
- Ensure MongoDB is running: `brew services list` or `systemctl status mongod`
- Check if port 27017 is available
- Verify credentials in `.env`

### Port Already in Use
Change PORT in `.env`:
```env
PORT=5001
```

### JWT Secret Warning
Generate a proper secret and update `.env`:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

## Next Steps

1. Test authentication endpoints
2. Create test data for income/expenses/savings/investments
3. Explore analytics endpoints
4. Connect your frontend to `http://localhost:5000/api/v1`

See [README.md](README.md) for complete API documentation.
