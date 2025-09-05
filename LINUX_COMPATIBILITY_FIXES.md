# Cross-platform fixes applied

## Fixes implemented:

### 1. **Fixed dynamic route loading (Linux compatibility)**

- Problem: Case-sensitive file system in Linux vs Windows
- Solution: Use exact file names for imports instead of reconstructed names
- File: `src/adapters/routes/index.ts`

### 2. **Removed non-existent DailySummary entity**

- Problem: Import of non-existent `DailySummaryEntity`
- Solution: Removed from `ormconfig.ts` imports and entities array
- File: `src/adapters/database/ormconfig.ts`

### 3. **Files affected:**

- `src/adapters/routes/index.ts` - Fixed dynamic imports
- `src/adapters/database/ormconfig.ts` - Removed DailySummary import

### 4. **Route files mapping:**

- `AuthRoute.ts` → `/auth`
- `CategoryRoute.ts` → `/category`
- `EmailVerificationRoute.ts` → `/emailverification`
- `RoutineRoute.ts` → `/routine`
- `UserSessionRoute.ts` → `/usersession`
- `UsersRoute.ts` → `/users`

## Testing on Linux:

```bash
# Build and test
npm run build
npm run start

# Should see:
# auth
# category
# emailverification
# routine
# usersession
# users
# 🚀 Server running on port 3000
```

## Notes:

- Always test builds on Linux/Docker before production deployment
- File names are case-sensitive in Linux containers
- Dynamic imports should use exact file names
