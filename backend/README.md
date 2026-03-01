# Home Finance Management - Backend API

Production-ready Node.js/Express backend for family finance tracking with role-based access control.

## Tech Stack

- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM
- **JWT** - Authentication
- **bcryptjs** - Password hashing
- **express-validator** - Input validation

## Features

- JWT Authentication with role-based access (Admin/Member)
- CRUD operations for Income, Expenses, Savings, Investments
- Advanced analytics with MongoDB aggregation
- Pagination, sorting, and filtering
- Rate limiting and security middleware
- Central error handling
- Request validation
- CORS configuration

## Project Structure

```
backend/
├── config/
│   └── database.js          # MongoDB connection
├── controllers/
│   ├── authController.js    # Authentication endpoints
│   ├── incomeController.js  # Income CRUD + summary
│   ├── expenseController.js # Expense CRUD + summary
│   ├── savingsController.js # Savings CRUD + summary
│   ├── investmentController.js # Investment CRUD + analytics
│   └── analyticsController.js  # Advanced analytics
├── middleware/
│   ├── asyncHandler.js      # Async error wrapper
│   ├── auth.js              # JWT verification + role check
│   ├── errorHandler.js      # Central error handler
│   └── validation.js        # Input validation rules
├── models/
│   ├── User.js              # User schema
│   ├── Income.js            # Income schema
│   ├── Expense.js           # Expense schema
│   ├── Savings.js           # Savings schema
│   └── Investment.js        # Investment schema
├── routes/
│   ├── authRoutes.js        # /api/v1/auth
│   ├── incomeRoutes.js      # /api/v1/income
│   ├── expenseRoutes.js     # /api/v1/expenses
│   ├── savingsRoutes.js     # /api/v1/savings
│   ├── investmentRoutes.js  # /api/v1/investments
│   └── analyticsRoutes.js   # /api/v1/analytics
├── utils/
├── .env                     # Environment variables
├── .env.example
├── server.js                # Express app entry
└── package.json
```

## Setup Instructions

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` file with your configuration:

```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/home_finance
JWT_SECRET=your_super_secret_jwt_key_min_32_chars_long
JWT_EXPIRE=7d
CORS_ORIGIN=http://localhost:3000,http://localhost:5173
```

### 3. Start MongoDB

Make sure MongoDB is running:

```bash
# Using brew (macOS)
brew services start mongodb-community

# Or manually
mongod
```

### 4. Run the Server

```bash
# Development
npm run dev

# Production
npm start
```

Server will start on `http://localhost:5000`

## API Documentation

### Base URL
```
http://localhost:5000/api/v1
```

### Authentication Endpoints

#### Register User
```http
POST /auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "role": "member"  // optional: "admin" or "member"
}
```

**Response:**
```json
{
  "success": true,
  "token": "jwt_token_here",
  "user": {
    "_id": "user_id",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "member",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

#### Login
```http
POST /auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}
```

#### Get Profile
```http
GET /auth/profile
Authorization: Bearer <jwt_token>
```

#### Update Profile
```http
PUT /auth/profile
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "name": "Updated Name",
  "email": "updated@example.com",
  "avatar": "avatar_url"
}
```

#### Change Password
```http
PUT /auth/change-password
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "currentPassword": "oldpassword",
  "newPassword": "newpassword"
}
```

### Income Endpoints

#### List Incomes (with pagination, filtering, sorting)
```http
GET /income?page=1&limit=10&sortBy=date&sortOrder=desc&category=Salary&startDate=2024-01-01&endDate=2024-12-31
Authorization: Bearer <jwt_token>
```

**Query Parameters:**
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 10, max: 100)
- `sortBy` - Field to sort by (default: date)
- `sortOrder` - asc or desc (default: desc)
- `category` - Filter by category
- `startDate` - Filter from date (ISO format)
- `endDate` - Filter to date (ISO format)

#### Get Single Income
```http
GET /income/:id
Authorization: Bearer <jwt_token>
```

#### Create Income
```http
POST /income
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "amount": 5000,
  "category": "Salary",
  "date": "2024-01-15",
  "description": "Monthly salary"
}
```

#### Update Income
```http
PUT /income/:id
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "amount": 5500,
  "category": "Salary",
  "date": "2024-01-15",
  "description": "Updated description"
}
```

#### Delete Income
```http
DELETE /income/:id
Authorization: Bearer <jwt_token>
```

#### Get Income Summary
```http
GET /income/summary?startDate=2024-01-01&endDate=2024-12-31
Authorization: Bearer <jwt_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "byCategory": [
      { "_id": "Salary", "totalAmount": 60000, "count": 12 },
      { "_id": "Freelance", "totalAmount": 15000, "count": 6 }
    ],
    "grandTotal": 75000
  }
}
```

### Expense Endpoints

Similar to Income:
- `GET /expenses` - List with pagination/filtering
- `GET /expenses/:id` - Get single
- `POST /expenses` - Create
- `PUT /expenses/:id` - Update
- `DELETE /expenses/:id` - Delete
- `GET /expenses/summary` - Category breakdown

**Expense Categories:**
Food & Dining, Transportation, Housing, Utilities, Healthcare, Entertainment, Shopping, Education, Personal Care, Travel, Insurance, Taxes, Other

### Savings Endpoints

- `GET /savings` - List with pagination
- `GET /savings/:id` - Get single
- `POST /savings` - Create
- `PUT /savings/:id` - Update
- `DELETE /savings/:id` - Delete
- `GET /savings/summary` - Net savings by type

**Savings Types:** `deposit` or `withdraw`

**Summary Response:**
```json
{
  "success": true,
  "data": {
    "byType": [
      { "_id": "deposit", "totalAmount": 20000, "count": 10 },
      { "_id": "withdraw", "totalAmount": 5000, "count": 3 }
    ],
    "netSavings": 15000,
    "totalDeposits": 20000,
    "totalWithdrawals": 5000
  }
}
```

### Investment Endpoints

- `GET /investments` - List with pagination
- `GET /investments/:id` - Get single
- `POST /investments` - Create
- `PUT /investments/:id` - Update
- `DELETE /investments/:id` - Delete
- `GET /investments/summary` - ROI by asset type
- `GET /investments/top-performers` - Best/worst performers

**Investment Asset Types:**
Stocks, Bonds, Mutual Funds, Cryptocurrency, Real Estate, Gold, Fixed Deposit, PPF, SIP, Other

**Summary Response:**
```json
{
  "success": true,
  "data": {
    "byAssetType": [
      {
        "_id": "Stocks",
        "totalInvested": 10000,
        "totalCurrentValue": 12000,
        "count": 5,
        "profitLoss": 2000,
        "roi": 20.5
      }
    ],
    "overall": {
      "totalInvested": 25000,
      "totalCurrentValue": 28000,
      "totalProfitLoss": 3000,
      "overallROI": 12.0
    }
  }
}
```

### Analytics Endpoints

#### Net Worth
```http
GET /analytics/net-worth?asOfDate=2024-12-31
Authorization: Bearer <jwt_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "netWorth": 150000,
    "breakdown": {
      "totalIncome": 100000,
      "totalExpenses": 60000,
      "netSavings": 20000,
      "investments": 90000,
      "investmentProfitLoss": 5000
    }
  }
}
```

#### Monthly Cash Flow
```http
GET /analytics/monthly-cashflow?year=2024&month=1
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "month": "2024-01",
      "income": 8000,
      "incomeCount": 3,
      "expenses": 5000,
      "expenseCount": 15,
      "deposits": 2000,
      "withdrawals": 500,
      "netCashFlow": 4500
    }
  ]
}
```

#### Savings Growth
```http
GET /analytics/savings-growth?startDate=2024-01-01&endDate=2024-12-31
```

#### Investment Performance
```http
GET /analytics/investment-performance?startDate=2024-01-01&endDate=2024-12-31
```

#### Member Contributions (Admin only)
```http
GET /analytics/member-contributions?startDate=2024-01-01&endDate=2024-12-31
Authorization: Bearer <admin_token>
```

#### Category Breakdown
```http
GET /analytics/category-breakdown?type=income&startDate=2024-01-01&endDate=2024-12-31
```

**type:** `income`, `expense`, or omit for both

#### Yearly Summary
```http
GET /analytics/yearly-summary?year=2024
```

**Response:**
```json
{
  "success": true,
  "data": {
    "year": 2024,
    "income": {
      "total": 96000,
      "count": 12,
      "monthly": [...]
    },
    "expenses": {
      "total": 60000,
      "count": 120,
      "monthly": [...]
    },
    "savings": {
      "net": 15000
    },
    "investments": {
      "currentValue": 90000,
      "invested": 85000,
      "profitLoss": 5000
    },
    "netSavings": 51000
  }
}
```

## Testing with Postman

### 1. Import Collection

Create a new Postman collection and add these requests:

**Folder: Authentication**
- POST `http://localhost:5000/api/v1/auth/register`
- POST `http://localhost:5000/api/v1/auth/login`
- GET `http://localhost:5000/api/v1/auth/profile` (Add Authorization header: Bearer {{token}})
- PUT `http://localhost:5000/api/v1/auth/profile` (Add Authorization header)
- PUT `http://localhost:5000/api/v1/auth/change-password` (Add Authorization header)

**Folder: Income**
- GET `http://localhost:5000/api/v1/income` (Add Authorization header)
- POST `http://localhost:5000/api/v1/income` (Add Authorization header)
- GET `http://localhost:5000/api/v1/income/:id` (Add Authorization header)
- PUT `http://localhost:5000/api/v1/income/:id` (Add Authorization header)
- DELETE `http://localhost:5000/api/v1/income/:id` (Add Authorization header)
- GET `http://localhost:5000/api/v1/income/summary` (Add Authorization header)

**Similar folders for:** Expenses, Savings, Investments, Analytics

### 2. Set Environment Variables

In Postman, set these variables:
- `token` - Store JWT from login response
- `baseUrl` - `http://localhost:5000/api/v1`

### 3. Test Flow

1. **Register** a new user (POST /auth/register)
2. **Login** (POST /auth/login) - Save token to `token` variable
3. **Test protected routes** - Add header `Authorization: Bearer {{token}}`
4. **Create test data** for income, expenses, savings, investments
5. **Run analytics** to see aggregated data

### 4. Sample Test Data

**Income:**
```json
{
  "amount": 5000,
  "category": "Salary",
  "date": "2024-01-15",
  "description": "Monthly salary"
}
```

**Expense:**
```json
{
  "amount": 150,
  "category": "Food & Dining",
  "date": "2024-01-16",
  "description": "Grocery shopping"
}
```

**Savings:**
```json
{
  "type": "deposit",
  "amount": 1000,
  "date": "2024-01-17",
  "note": "Monthly savings"
}
```

**Investment:**
```json
{
  "assetName": "Apple Inc.",
  "assetType": "Stocks",
  "investedAmount": 5000,
  "currentValue": 5500,
  "purchaseDate": "2024-01-01"
}
```

## Security Best Practices

### 1. JWT Secrets
- Use strong, random secrets (minimum 32 characters)
- Never commit `.env` to version control
- Rotate secrets periodically
- Use different secrets for access and refresh tokens

### 2. Password Security
- bcrypt with salt rounds 10 (configurable)
- Minimum 6 characters (increase to 8+ for production)
- Implement password complexity requirements
- Consider adding password reset functionality with expiry

### 3. Rate Limiting
- Configured on all API routes (100 requests per 15 minutes)
- Adjust based on production needs
- Consider stricter limits on auth endpoints

### 4. CORS
- Whitelist specific origins only
- Never use `origin: *` in production
- Configure properly for your frontend domain

### 5. Input Validation
- All inputs validated using express-validator
- Sanitize user inputs
- MongoDB injection protection via Mongoose

### 6. HTTPS
- Always use HTTPS in production
- Set `NODE_ENV=production` to enable security headers
- Use reverse proxy (nginx) for SSL termination

### 7. MongoDB Security
- Use authentication for MongoDB
- Configure network access controls
- Regular backups
- Enable encryption at rest

## Production Deployment Tips

### 1. Environment Configuration

```env
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/home_finance?retryWrites=true&w=majority
JWT_SECRET=<generate_strong_random_string_32+_chars>
JWT_EXPIRE=7d
CORS_ORIGIN=https://yourfrontend.com
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### 2. Process Manager (PM2)

```bash
npm install -g pm2
pm2 start server.js --name "home-finance-api"
pm2 save
pm2 startup
```

### 3. Nginx Reverse Proxy

```nginx
server {
    listen 80;
    server_name api.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.yourdomain.com;

    ssl_certificate /path/to/ssl/cert.pem;
    ssl_certificate_key /path/to/ssl/key.pem;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### 4. MongoDB Atlas (Cloud)

1. Create cluster at https://cloud.mongodb.com
2. Whitelist your server IP
3. Create database user
4. Update `MONGODB_URI` in `.env`:

```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/home_finance?retryWrites=true&w=majority
```

### 5. Monitoring & Logging

- Use PM2 monitoring: `pm2 monit`
- Set up log rotation
- Consider Winston/Morgan for structured logging
- Use application performance monitoring (APM) tools

### 6. Database Indexes

Indexes already created in models:
- `Income`: member+date, category
- `Expense`: member+date, category, date
- `Savings`: member+date, type
- `Investment`: member+assetType, purchaseDate

Monitor query performance and add additional indexes as needed.

### 7. Backup Strategy

```bash
# Daily MongoDB backup
mongodump --uri="mongodb+srv://user:pass@cluster.mongodb.net/home_finance" --out=/backups/finance_$(date +%Y%m%d)

# Restore
mongorestore --uri="mongodb+srv://user:pass@cluster.mongodb.net/home_finance" /backups/finance_20240101
```

### 8. Scaling Considerations

- **Horizontal scaling**: Stateless API, can run multiple instances behind load balancer
- **Database**: Use read replicas for analytics queries
- **Caching**: Add Redis for frequently accessed data
- **CDN**: For static assets if serving files

### 9. CI/CD Pipeline

Example GitHub Actions workflow:

```yaml
name: Deploy Backend
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Use Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '18'
      - name: Install dependencies
        run: npm ci
      - name: Run tests
        run: npm test
      - name: Deploy to server
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.HOST }}
          username: ${{ secrets.USERNAME }}
          key: ${{ secrets.SSH_KEY }}
          script: |
            cd /var/www/home-finance-backend
            git pull origin main
            npm install
            pm2 restart home-finance-api
```

## API Response Format

All responses follow this structure:

**Success:**
```json
{
  "success": true,
  "message": "Operation successful",  // optional
  "data": {},  // response data
  "count": 10,  // optional (for list endpoints)
  "total": 100, // optional (for pagination)
  "page": 1,    // optional
  "pages": 10   // optional
}
```

**Error:**
```json
{
  "success": false,
  "message": "Error description",
  "errors": [],  // validation errors
  "stack": "..." // only in development
}
```

## HTTP Status Codes

- `200` - OK
- `201` - Created
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (invalid/missing token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `409` - Conflict (duplicate email)
- `429` - Too Many Requests (rate limit)
- `500` - Internal Server Error

## Common Issues & Troubleshooting

### MongoDB Connection Failed
- Check if MongoDB is running: `brew services list` or `systemctl status mongod`
- Verify connection string in `.env`
- Check firewall/network settings

### JWT Token Expired
- Tokens expire after 7 days (configurable)
- Implement refresh token flow for production
- Clear localStorage and re-login

### CORS Errors
- Verify frontend URL in `CORS_ORIGIN`
- Check that frontend is running on allowed port
- Clear browser cache

### Rate Limit Exceeded
- Wait 15 minutes or adjust limits in `.env`
- Implement client-side request throttling

## Contributing

1. Follow existing code style
2. Add validation for all inputs
3. Use asyncHandler wrapper for all controller methods
4. Implement proper error handling
5. Add indexes for frequently queried fields
6. Update this README for new features

## License

MIT
