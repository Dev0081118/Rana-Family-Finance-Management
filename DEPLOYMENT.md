# Deployment Guide - Rana Family Finance Management

This guide covers deploying the application to Vercel (frontend) and Render (backend).

## Project Structure

```
home-finance-app/
├── frontend/          # React + TypeScript + Vite (Vercel)
├── backend/           # Node.js + Express + MongoDB (Render)
├── vercel.json        # Vercel configuration
├── render.yaml        # Render configuration
├── .env.example       # Frontend environment template
└── backend/.env.example # Backend environment template
```

## Prerequisites

1. GitHub account with repository: `https://github.com/Dev0081118/Rana-Family-Finance-Management-.git`
2. Vercel account (https://vercel.com)
3. Render account (https://render.com)
4. MongoDB Atlas account (https://www.mongodb.com/cloud/atlas)

## Step 1: Setup MongoDB Atlas Database

1. Create a new cluster in MongoDB Atlas (free tier is fine)
2. Create a database user with read/write permissions
3. Get the connection string:
   ```
   mongodb+srv://<username>:<password>@cluster0.crna2oc.mongodb.net/home_finance?retryWrites=true&w=majority
   ```
4. Whitelist all IP addresses (0.0.0.0/0) for Render deployment

## Step 2: Deploy Backend to Render

1. Go to Render Dashboard → New → Web Service
2. Connect your GitHub repository
3. Configure the service:
   - **Name**: `home-finance-backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Free

4. Add Environment Variables:
   ```
   NODE_ENV=production
   PORT=5001
   MONGODB_URI=your_mongodb_atlas_connection_string
   JWT_SECRET=generate_a_strong_random_string_min_32_chars
   JWT_REFRESH_SECRET=generate_another_strong_random_string_min_32_chars
   JWT_EXPIRE=7d
   JWT_REFRESH_EXPIRE=30d
   CORS_ORIGIN=https://your-frontend.vercel.app
   RATE_LIMIT_WINDOW_MS=900000
   RATE_LIMIT_MAX_REQUESTS=500
   ```

5. Click "Create Web Service"
6. Wait for deployment to complete and note the backend URL (e.g., `https://home-finance-backend.onrender.com`)

## Step 3: Deploy Frontend to Vercel

1. Go to Vercel Dashboard → New Project
2. Import your GitHub repository
3. Configure project:
   - **Root Directory**: `.` (root of repository)
   - **Framework Preset**: `Vite`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

4. Add Environment Variables:
   ```
   VITE_API_URL=https://your-backend.onrender.com/api/v1
   ```

5. Click "Deploy"
6. Wait for deployment to complete and note the frontend URL (e.g., `https://your-project.vercel.app`)

## Step 4: Update Backend CORS Configuration

After frontend deployment, update the backend CORS_ORIGIN on Render:

1. Go to your backend service on Render
2. Update Environment Variable:
   ```
   CORS_ORIGIN=https://your-frontend.vercel.app
   ```
3. Click "Save Changes" and redeploy

## Step 5: Test Deployment

1. Visit your frontend URL
2. Test user registration and login
3. Test all CRUD operations (Income, Expenses, Savings, Investments, Loans)
4. Verify analytics dashboard is working

## Important Notes

### Security
- Never commit `.env` files with real credentials
- Use strong, random JWT secrets (minimum 32 characters)
- Keep your MongoDB Atlas IP whitelist updated
- Enable two-factor authentication on all accounts

### Environment Variables

**Frontend (.env)**:
```env
VITE_API_URL=https://your-backend.onrender.com/api/v1
```

**Backend (Render Environment Variables)**:
```env
NODE_ENV=production
PORT=5001
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_strong_secret_key_here
JWT_REFRESH_SECRET=your_strong_refresh_secret_here
JWT_EXPIRE=7d
JWT_REFRESH_EXPIRE=30d
CORS_ORIGIN=https://your-frontend.vercel.app
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=500
```

### Free Tier Considerations

**Render Free Tier**:
- Services spin down after 15 minutes of inactivity
- First request after inactivity may be slow (cold start)
- Limited to 750 hours/month (enough for 1 service running 24/7)

**Vercel Free Tier**:
- No server-side code execution limits
- Automatic HTTPS
- Global CDN
- 100GB bandwidth/month

### Troubleshooting

1. **CORS Errors**: Ensure CORS_ORIGIN matches your frontend URL exactly
2. **Database Connection**: Check MongoDB Atlas connection string and IP whitelist
3. **Build Failures**: Check Node.js version (requires >=16.0.0)
4. **API Not Responding**: Check backend logs on Render dashboard
5. **Environment Variables**: Verify all required variables are set correctly

## Maintenance

1. **Monitor Logs**: Check Render and Vercel dashboards regularly
2. **Database Backups**: Enable automated backups in MongoDB Atlas
3. **Update Dependencies**: Regularly update npm packages for security
4. **Scale as Needed**: Upgrade from free tier if usage increases

## Support

For issues or questions:
- Check the repository's README.md
- Review backend logs on Render
- Check frontend console for errors
- Verify environment variables are correctly set