# JWT Secret Key - Complete Guide

## 🔐 What is JWT?

**JWT (JSON Web Token)** is a secure way to handle authentication in web applications.

### How Authentication Works in RuchiV2:

```
1. User Login
   ↓
2. Server verifies credentials (email + password)
   ↓
3. Server creates JWT token (signed with JWT_SECRET)
   ↓
4. Token sent to user's browser
   ↓
5. User stores token (in localStorage/cookies)
   ↓
6. User makes requests with token in header
   ↓
7. Server verifies token (using JWT_SECRET)
   ↓
8. Access granted ✅
```

## 🎯 What is JWT_SECRET?

The **JWT_SECRET** is a secret key that:

1. **Signs tokens** - Creates a cryptographic signature
2. **Verifies tokens** - Checks if token is valid
3. **Prevents forgery** - Only your server can create valid tokens

### Example JWT Token:

```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImVtYWlsIjoiYWRtaW5AcmVzdGF1cmFudC5jb20iLCJyb2xlIjoiYWRtaW4ifQ.signature_created_with_JWT_SECRET
```

**Parts:**
1. **Header** - Algorithm info
2. **Payload** - User data (userId, email, role)
3. **Signature** - Created using JWT_SECRET (prevents tampering)

## 🎲 Your Generated JWT Secret

I've generated a secure JWT secret for you:

```
JWT_SECRET=Q+xLsho6BM8vCyId0z20oG340mI6PB2H3VurOt733Eg=
```

**Properties:**
- ✅ 256-bit random key
- ✅ Base64 encoded
- ✅ Cryptographically secure
- ✅ Unique to your application

## 📝 How to Use It

### Step 1: Add to .env File

Open your `.env` file and add:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=restaurant_db
DB_USER=postgres
DB_PASSWORD=your_actual_password

# JWT Secret (for authentication)
JWT_SECRET=Q+xLsho6BM8vCyId0z20oG340mI6PB2H3VurOt733Eg=
```

### Step 2: Verify .env is in .gitignore

Check that `.gitignore` includes:
```
.env
.env*.local
```

This ensures your secret is NEVER committed to GitHub! 🔒

### Step 3: For Production

When deploying to Vercel/production:
1. Generate a **different** JWT_SECRET for production
2. Add it to Vercel environment variables
3. Never use the same secret for dev and production!

## 🔒 Security Best Practices

### ✅ DO:
- ✅ Keep JWT_SECRET in `.env` file
- ✅ Use different secrets for dev/staging/production
- ✅ Make it long and random (at least 256 bits)
- ✅ Regenerate if compromised
- ✅ Store securely in environment variables

### ❌ DON'T:
- ❌ Commit JWT_SECRET to GitHub
- ❌ Share it publicly
- ❌ Use simple/guessable secrets like "secret123"
- ❌ Hardcode it in your source code
- ❌ Use the same secret across multiple projects

## 🛠️ Generate New Secrets

### PowerShell (Windows):
```powershell
$bytes = New-Object byte[] 32
(New-Object Security.Cryptography.RNGCryptoServiceProvider).GetBytes($bytes)
[Convert]::ToBase64String($bytes)
```

### Node.js:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### Online (use with caution):
- https://generate-secret.vercel.app/32
- Only use for development, not production!

## 🔍 How RuchiV2 Uses JWT

### Login Process:

**File**: `app/api/auth/login/route.ts`

```typescript
// User logs in
const user = await verifyCredentials(email, password);

// Create JWT token
const token = jwt.sign(
  { 
    userId: user.id, 
    email: user.email, 
    role: user.role 
  },
  process.env.JWT_SECRET,  // ← Uses your secret!
  { expiresIn: '7d' }
);

// Send token to user
return { token };
```

### Verify Token:

**File**: `middleware/auth.ts` (if exists)

```typescript
// User makes request with token
const token = req.headers.authorization;

// Verify token
const decoded = jwt.verify(
  token, 
  process.env.JWT_SECRET  // ← Uses same secret!
);

// Access granted
req.user = decoded;
```

## 🚨 What If Secret is Compromised?

If your JWT_SECRET is exposed:

1. **Generate new secret immediately**
2. **Update .env file**
3. **Restart server**
4. **All users will need to log in again** (old tokens invalid)
5. **Update production environment variables**

## 📊 Token Expiration

Your tokens expire after a set time:

```typescript
{ expiresIn: '7d' }  // 7 days
{ expiresIn: '24h' } // 24 hours
{ expiresIn: '1h' }  // 1 hour
```

**Trade-off:**
- **Longer expiration** = Better UX (less login)
- **Shorter expiration** = Better security

## 🎯 Summary

### What You Need to Know:

1. **JWT_SECRET** is used to sign and verify authentication tokens
2. **Keep it secret** - never commit to GitHub
3. **Use the generated secret** in your `.env` file
4. **Different secrets** for dev/production
5. **Regenerate if compromised**

### Your Action Items:

- [x] JWT_SECRET generated
- [ ] Add to `.env` file
- [ ] Verify `.env` is in `.gitignore`
- [ ] Test login functionality
- [ ] Generate different secret for production

---

**Your JWT Secret** (copy this):
```
JWT_SECRET=Q+xLsho6BM8vCyId0z20oG340mI6PB2H3VurOt733Eg=
```

**⚠️ Keep this secret! Never share or commit to GitHub!**
