# Registration Troubleshooting Guide

## Common Issues & Solutions

### 1. **Database Connection Failed**

**Problem:** Registration fails with "Registration failed" error

**Solution:**
- Ensure PostgreSQL is installed and running
- Check your database URL in `backend/server.js` (line 15)
- Default: `postgresql://postgres:password@localhost:5432/cityevent`

**To start PostgreSQL:**
```bash
# Windows (if installed)
net start postgresql

# Or check PostgreSQL is running via Services
```

### 2. **Database Doesn't Exist**

**Problem:** "database 'cityevent' does not exist"

**Solution:**
Create the database:
```bash
psql -U postgres -c "CREATE DATABASE cityevent;"
```

Or update the connection string in `backend/server.js`:
```javascript
connectionString: 'postgresql://postgres:password@localhost:5432/postgres' // Use existing database
```

### 3. **Wrong Credentials**

**Problem:** "password authentication failed"

**Solution:**
Check your PostgreSQL credentials. Update line 15 in `backend/server.js`:
```javascript
connectionString: 'postgresql://YOUR_USER:YOUR_PASSWORD@localhost:5432/cityevent'
```

### 4. **Check Server Logs**

Run the backend with detailed logging:
```bash
cd backend
npm run dev
```

Look for messages like:
- ✅ `Users table initialized successfully` - Database is working
- ❌ `Error creating users table` - Database connection failed

### 5. **Test Database Health**

Once the backend is running, test the health endpoint:
```bash
curl http://localhost:3001/api/health
```

**Success Response:**
```json
{
  "status": "ok",
  "database": "connected",
  "stats": {
    "events": 0,
    "registrations": 0,
    "users": 0
  }
}
```

**Error Response:**
```json
{
  "status": "error",
  "error": "Database connection failed",
  "message": "connect ECONNREFUSED 127.0.0.1:5432"
}
```

### 6. **Browser Console Errors**

Open browser DevTools (F12) and check:
- **Network tab** - See actual API response
- **Console tab** - See JavaScript errors
- **Look for the error message** from the server

### 7. **Test Registration with curl**

```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "fullName": "Test User",
    "role": "student"
  }'
```

## Quick Checklist

- [ ] PostgreSQL is running
- [ ] Database `cityevent` exists
- [ ] PostgreSQL user/password is correct
- [ ] Backend is running (`npm run dev`)
- [ ] Database tables are created (check logs for ✅ message)
- [ ] Health endpoint returns success
- [ ] Form validation passes (check for validation errors on form)

## Environment Variables (Optional)

Create a `.env` file in the `backend` folder:
```env
DATABASE_URL=postgresql://postgres:password@localhost:5432/cityevent
PORT=3001
NODE_ENV=development
```

## Still Having Issues?

1. Check the backend console for detailed error messages
2. Verify PostgreSQL is actually running
3. Test the `/api/health` endpoint for database status
4. Check the Network tab in browser DevTools to see exact error response
