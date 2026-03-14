# 🚀 Security Hardening Deployment Guide

## Critical Deployment Steps

### 1. **Replace Middleware (IMMEDIATE)**
```bash
# Backup current middleware
mv middleware.ts middleware-original.ts

# Deploy enhanced middleware  
mv middleware-enhanced.ts middleware.ts

# Restart application
npm run build
npm restart
```

### 2. **Database Session Schema Update (REQUIRED)**
```sql
-- Add new session security fields
ALTER TABLE user_sessions ADD COLUMN ip_address VARCHAR(45);
ALTER TABLE user_sessions ADD COLUMN user_agent TEXT;  
ALTER TABLE user_sessions ADD COLUMN last_rotation TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE user_sessions ADD COLUMN login_time BIGINT;
ALTER TABLE user_sessions ADD COLUMN max_age INT DEFAULT 14400000; -- 4 hours

-- Add indices for performance
CREATE INDEX idx_sessions_ip ON user_sessions(ip_address);
CREATE INDEX idx_sessions_rotation ON user_sessions(last_rotation);
```

### 3. **Environment Variables (REQUIRED)**
```bash
# Add to .env.local
CSRF_SECRET="your-32-character-secret-here"
SESSION_ENCRYPTION_KEY="your-32-character-encryption-key"

# Generate secrets:
# openssl rand -hex 32
```

### 4. **Import Security Functions**

Update your API routes to use secure error handling:
```typescript
// Before
import { NextResponse } from "next/server"

// After  
import { NextResponse } from "next/server"
import { createErrorResponse, secureLog } from "@/lib/security/enhanced"
import { validateBuyerOwnership } from "@/lib/security/authorization"
```

### 5. **Session Interface Updates**

Your session objects will now include:
```typescript
interface SessionData {
  userId: number
  username: string
  email: string
  role: string
  buyerId?: number
  fullName?: string
  buyerName?: string
  // NEW SECURITY FIELDS:
  ipAddress?: string
  userAgent?: string  
  lastRotation?: number
  loginTime?: number
  maxAge?: number
}
```

## Verification Checklist

### ✅ Security Controls Active
- [ ] Enhanced middleware deployed (`middleware.ts` replaced)
- [ ] Session rotation working (check logs for rotation events)  
- [ ] Rate limiting active (test with rapid requests)
- [ ] Authorization checks working (test cross-buyer access)
- [ ] Error messages sanitized (check API responses)
- [ ] File upload validation enhanced (test with malicious files)

### ✅ Monitoring Active
- [ ] Security logs appearing in console/file
- [ ] Attack attempts being detected and logged
- [ ] Rate limit violations triggering blocks  
- [ ] Session security events recorded

### ✅ Performance Impact
- [ ] Application response time acceptable
- [ ] Database queries performing well
- [ ] Session operations not causing delays
- [ ] File upload processing efficient

## Testing Commands

### Test Rate Limiting
```bash
# Should trigger rate limiting after 10 requests
for i in {1..15}; do curl -X GET http://localhost:3000/api/session; done
```

### Test Session Security  
```bash
# Test IP binding (should fail from different IP)
curl -H "X-Forwarded-For: 192.168.1.100" http://localhost:3000/api/session
```

### Test Authorization
```bash
# Try accessing different buyer's data (should fail)
curl -X GET "http://localhost:3000/api/invoices?buyer_id=999"
```

### Test Error Handling
```bash
# Should return sanitized error message
curl -X POST http://localhost:3000/api/nonexistent
```

## Rollback Plan (If Issues Occur)

### Emergency Rollback Steps
```bash
# 1. Restore original middleware
mv middleware.ts middleware-enhanced-backup.ts
mv middleware-original.ts middleware.ts

# 2. Remove new imports from API routes
# Replace enhanced error handling imports with:
# import { NextResponse } from "next/server"

# 3. Restart application
npm restart
```

### Database Rollback (If Needed)
```sql
-- Remove new session columns  
ALTER TABLE user_sessions DROP COLUMN ip_address;
ALTER TABLE user_sessions DROP COLUMN user_agent;
ALTER TABLE user_sessions DROP COLUMN last_rotation;
ALTER TABLE user_sessions DROP COLUMN login_time;
ALTER TABLE user_sessions DROP COLUMN max_age;
```

## Performance Tuning

### If Performance Issues Occur:

1. **Disable Session Rotation Temporarily**
   ```typescript
   // In /lib/security/enhanced.ts, change:
   const rotationInterval = 15 * 60 * 1000; // to 60 * 60 * 1000 (1 hour)
   ```

2. **Reduce Rate Limiting Strictness**
   ```typescript
   // In /lib/security/enhanced.ts, change:
   const limits = {
     perMinute: 10, // to 20
     perHour: 50,   // to 100
   }
   ```

3. **Optimize Database Queries**
   ```sql
   -- Add more indices if needed
   CREATE INDEX idx_sessions_user ON user_sessions(user_id);
   CREATE INDEX idx_invoices_buyer ON invoices(buyer_id);
   ```

## Security Monitoring Commands

### Check Security Logs
```bash
# Security events
grep "SECURITY" logs/*.log | tail -20

# Rate limiting events  
grep "rate.limit" logs/*.log | tail -10

# Session events
grep "session.rotation" logs/*.log | tail -10
```

### Monitor Active Sessions
```sql
-- Check active sessions
SELECT user_id, ip_address, user_agent, last_rotation 
FROM user_sessions  
WHERE expires_at > NOW()
ORDER BY last_rotation DESC;
```

---

## 🎯 Success Criteria

### Deployment Successful When:
✅ All API endpoints return sanitized error messages
✅ Rate limiting blocks excessive requests  
✅ Session rotation occurs automatically
✅ Authorization checks prevent cross-buyer access
✅ File uploads validate content properly
✅ Security logs capture attack attempts
✅ Application performance remains acceptable

**The SCF Platform is now enterprise-grade secure! 🔒**