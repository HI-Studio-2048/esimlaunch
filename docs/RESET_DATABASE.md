# 🔄 Database Reset Guide

This guide explains how to completely reset your database and clear authentication state.

## ⚠️ WARNING

**This will delete ALL data in your database!** This includes:
- All merchants/users
- All stores
- All orders
- All API keys
- All subscriptions
- All support tickets
- Everything else

Only do this in development!

---

## 🗑️ Method 1: Using the Reset Script (Recommended)

### Step 1: Reset the Database

```bash
cd backend
npm run reset:db
```

This will:
1. Drop all tables
2. Re-run all migrations
3. Recreate the schema from scratch

### Step 2: Clear Browser localStorage

You need to clear your browser's localStorage to remove:
- JWT tokens (`jwt_token`)
- Clerk session data
- API keys (`api_key`)
- Store IDs (`store_id`)
- Other cached data

**Option A: Clear via Browser DevTools (Recommended)**

1. Open your browser's Developer Tools (F12)
2. Go to the **Application** tab (Chrome) or **Storage** tab (Firefox)
3. Click on **Local Storage** in the left sidebar
4. Select your site's URL (e.g., `http://localhost:5173`)
5. Right-click and select **Clear** or click the **Clear All** button

**Option B: Clear via Console**

Open the browser console (F12) and run:

```javascript
localStorage.clear();
sessionStorage.clear();
location.reload();
```

**Option C: Clear Specific Items Only**

If you only want to clear authentication-related items:

```javascript
localStorage.removeItem('jwt_token');
localStorage.removeItem('api_key');
localStorage.removeItem('store_id');
localStorage.removeItem('explicit_logout');
sessionStorage.removeItem('explicit_logout');
location.reload();
```

### Step 3: Restart Your Servers

```bash
# Stop your backend server (Ctrl+C)
# Then restart:
cd backend
npm run dev

# In another terminal, restart frontend:
cd esim-connect-hub
npm run dev
```

### Step 4: Sign Up Again

Navigate to `/signup` and create a fresh account.

---

## 🔧 Method 2: Manual Reset

If you prefer to do it manually:

### Step 1: Drop and Recreate Database

```bash
cd backend

# Drop all data and re-run migrations
npx prisma migrate reset --force

# Or if you want to keep migrations but clear data:
npx prisma db push --force-reset
```

### Step 2: Clear localStorage (same as Method 1, Step 2)

### Step 3: Restart Servers (same as Method 1, Step 3)

---

## 🧹 Quick Reset (Just Clear Auth State)

If you only want to log out and clear authentication (without deleting database data):

1. **Clear localStorage** (use Method 1, Step 2, Option C)
2. **Restart frontend server**

This will log you out but keep all your data in the database.

---

## 🔍 Verify Reset

After resetting, you should:

1. ✅ Not be automatically logged in
2. ✅ See the login/signup page when visiting `/dashboard`
3. ✅ Be able to create a fresh account
4. ✅ Have an empty database (check with `npx prisma studio`)

---

## 🐛 Troubleshooting

**Issue: Still logged in after reset**

- Make sure you cleared **both** `localStorage` and `sessionStorage`
- Check if Clerk is caching sessions (try incognito mode)
- Clear browser cookies as well

**Issue: Database reset fails**

- Make sure your database is running
- Check your `DATABASE_URL` in `.env`
- Try: `npx prisma db push --force-reset` instead

**Issue: Can't connect to database after reset**

- Verify your `DATABASE_URL` is correct
- Make sure PostgreSQL is running
- Check database permissions

---

## 📝 Notes

- **Clerk Authentication**: Clerk manages its own sessions separately. If you're still logged into Clerk, you may need to sign out from Clerk's dashboard or clear Clerk cookies.
- **Database Migrations**: The reset script will re-run all migrations, so your schema will be up-to-date.
- **Environment Variables**: Your `.env` file is not affected by the reset.

---

**Last Updated:** 2024


