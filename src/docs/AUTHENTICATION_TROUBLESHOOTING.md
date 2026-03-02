# Authentication Troubleshooting Guide

## Common Issues and Solutions

### 1. **Frontend Environment Variables**
**Issue**: Frontend can't connect to backend API
**Solution**: Ensure `.env` file exists in frontend root with:
```
VITE_API_URL=http://localhost:5001/api/v1
```

### 2. **Backend Dependencies**
**Issue**: Backend server won't start due to missing dependencies
**Solution**: Install missing dependencies:
```bash
cd backend
npm install
```

### 3. **Database Connection**
**Issue**: MongoDB connection fails
**Solutions**:
- **MongoDB Atlas**: Verify connection string in `backend/.env`
- **Local MongoDB**: Change connection string to: `mongodb://localhost:27017/home_finance`
- **IP Whitelist**: Ensure your IP is whitelisted in MongoDB Atlas

### 4. **JWT Secret**
**Issue**: Authentication fails due to weak JWT secret
**Solution**: Use strong JWT secret (32+ characters) in `backend/.env`

### 5. **CORS Issues**
**Issue**: Frontend requests blocked by CORS
**Solution**: Update `CORS_ORIGIN` in `backend/.env` to include your frontend URL

## Testing Authentication

### 1. **Start Backend Server**
```bash
cd backend
npm run dev
```
Check console for: `Server running in development mode on port 5001`

### 2. **Start Frontend**
```bash
npm run dev
```
Check console for: `VITE v5.x.x ready in XXX ms`

### 3. **Test Registration**
1. Go to `/register` page
2. Fill form with valid data
3. Submit and check for success message
4. Verify user created in database

### 4. **Test Login**
1. Go to `/login` page
2. Use registered credentials
3. Check for successful redirect to dashboard
4. Verify token stored in localStorage

### 5. **Test Protected Routes**
1. Try accessing `/dashboard` without login
2. Should redirect to `/login`
3. Login and verify access granted

## Debug Steps

### 1. **Check Browser Console**
Look for:
- Network errors
- CORS errors
- API endpoint errors

### 2. **Check Network Tab**
Verify:
- API calls are reaching backend
- Proper headers (Authorization) are sent
- Response status codes

### 3. **Check Backend Logs**
Look for:
- Database connection success
- Route handling
- Error messages

### 4. **Test API Endpoints Directly**
Use curl or Postman to test:
```bash
# Test registration
curl -X POST http://localhost:5001/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"password123"}'

# Test login
curl -X POST http://localhost:5001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

## Common Error Messages

### "Network Error"
- Check if backend server is running
- Verify API URL in frontend `.env`
- Check firewall settings

### "CORS Error"
- Update `CORS_ORIGIN` in backend `.env`
- Ensure frontend URL matches allowed origins

### "Database Connection Failed"
- Verify MongoDB connection string
- Check MongoDB Atlas IP whitelist
- Ensure MongoDB service is running (for local)

### "Invalid Credentials"
- Verify user exists in database
- Check password hashing
- Ensure JWT secret is properly set

## Quick Fix Checklist

- [ ] Backend dependencies installed (`npm install`)
- [ ] Frontend `.env` file created with correct API URL
- [ ] Backend `.env` file has proper MongoDB connection string
- [ ] JWT secret is 32+ characters long
- [ ] CORS_ORIGIN includes frontend URL
- [ ] MongoDB Atlas IP whitelist configured
- [ ] Backend server running on port 5001
- [ ] Frontend server running on port 3000/5173

## Getting Help

If issues persist:
1. Check all environment files
2. Verify database connection
3. Test API endpoints directly
4. Check browser and server console logs
5. Ensure all dependencies are installed