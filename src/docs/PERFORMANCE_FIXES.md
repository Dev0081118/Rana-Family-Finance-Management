# 429 Too Many Requests - Fix Documentation

## Problem Summary

The React application was experiencing continuous 429 errors and UI flickering due to:

1. **Infinite useEffect loops** caused by `location.state` dependency
2. **StrictMode double execution** exacerbating the issue
3. **Missing mounted flag** causing state updates on unmounted components
4. **No 429 error handling** - immediate retry on rate limit errors
5. **Poor dependency arrays** - using `currentUser` object instead of `currentUser.id`

## Root Causes Identified

### Issue 1: location.state Infinite Loop
```typescript
// BEFORE (problematic)
useEffect(() => {
  if (location.state?.refresh) {
    fetchData();
    window.history.replaceState({}, document.title);
  }
}, [location.state]); // location.state is a new object on every navigation → infinite loop
```

### Issue 2: Missing Mounted Flag
```typescript
// BEFORE (problematic)
const fetchData = async () => {
  try {
    setLoading(true);
    const response = await apiCall();
    setData(response.data); // Can cause "Can't perform a React state update on an unmounted component"
  } finally {
    setLoading(false);
  }
};
```

### Issue 3: No 429 Handling
```typescript
// BEFORE (problematic)
catch (err) {
  setError('Failed to fetch');
  // No special handling for 429 - user could keep clicking retry
}
```

### Issue 4: Dependency Array Issues
```typescript
// BEFORE (problematic)
useEffect(() => {
  fetchData();
}, [currentUser, navigate]); // currentUser is an object → new reference on every render
```

## Solutions Implemented

### Solution 1: State Flag Pattern for Refresh
```typescript
// AFTER (fixed)
const [shouldRefresh, setShouldRefresh] = useState(false);

useEffect(() => {
  if (location.state?.refresh) {
    setShouldRefresh(true);
  }
}, [location.state]);

useEffect(() => {
  if (shouldRefresh && isMounted.current) {
    fetchData().finally(() => {
      if (isMounted.current) {
        setShouldRefresh(false);
        window.history.replaceState({}, document.title);
      }
    });
  }
}, [shouldRefresh]);
```

### Solution 2: Mounted Flag Pattern
```typescript
// AFTER (fixed)
const isMounted = React.useRef(true);

useEffect(() => {
  isMounted.current = true;
  return () => {
    isMounted.current = false;
  };
}, []);

const fetchData = async (retryCount = 0): Promise<boolean> => {
  if (!isMounted.current) return false;

  try {
    setLoading(true);
    const response = await apiCall();
    if (isMounted.current) {
      setData(response.data);
    }
    return true;
  } finally {
    if (isMounted.current) {
      setLoading(false);
    }
  }
};
```

### Solution 3: Exponential Backoff for 429
```typescript
// AFTER (fixed)
const fetchData = async (retryCount = 0): Promise<boolean> => {
  if (!isMounted.current) return false;

  try {
    // ... fetch logic
  } catch (err: any) {
    if (!isMounted.current) return false;

    const status = err.response?.status;

    // Handle 429 Too Many Requests with exponential backoff
    if (status === 429) {
      const delay = Math.min(1000 * Math.pow(2, retryCount), 30000);
      console.warn(`Rate limited. Retrying in ${delay}ms (attempt ${retryCount + 1})`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return fetchData(retryCount + 1);
    }

    if (status !== 401) {
      setError('Failed to fetch data');
    }
    return false;
  }
};
```

### Solution 4: Proper Dependency Arrays
```typescript
// AFTER (fixed)
useEffect(() => {
  isMounted.current = true;
  if (currentUser) {
    fetchData();
  }
  return () => {
    isMounted.current = false;
  };
}, [currentUser?.id]); // Only depend on user ID, not whole object
```

### Solution 5: Retry Button Handler
```typescript
// AFTER (fixed)
const handleRetry = () => {
  fetchData();
};

// In JSX:
<Button onClick={handleRetry}>Retry</Button>
```

## Files Modified

1. **src/pages/Expenses/index.tsx** - Complete refactor with all fixes
2. **src/pages/Income/index.tsx** - Complete refactor with all fixes
3. **src/pages/Savings/index.tsx** - Complete refactor with all fixes
4. **src/pages/Investments/index.tsx** - Complete refactor with all fixes

## Key Improvements

✅ **Stops infinite loops** - State flag pattern prevents `location.state` loop
✅ **Production safe** - Mounted flag prevents state updates on unmounted components
✅ **429 handling** - Exponential backoff (1s, 2s, 4s, 8s, 16s, max 30s)
✅ **No duplicate calls** - `fetchInProgress` flag prevents concurrent requests
✅ **Proper dependencies** - Using `currentUser?.id` instead of object reference
✅ **Cleanup** - All effects have proper cleanup functions
✅ **Type safe** - Fixed `handleRetry` to avoid type errors

## Behavior Changes

### Before
- Continuous API calls → 429 errors → UI flicker
- Infinite loops on navigation
- Memory leaks from state updates on unmounted components
- No backoff on rate limit

### After
- Single API call per page load
- Graceful handling of 429 with automatic retry
- No memory leaks
- Smooth UI without flickering
- Proper cleanup on unmount

## Testing Checklist

- [x] Navigate to /expenses - should load once, no flicker
- [x] Navigate to /income - should load once, no flicker
- [x] Navigate to /savings - should load once, no flicker
- [x] Navigate to /investments - should load once, no flicker
- [x] Add new expense → return to list → data refreshes once
- [x] Add new income → return to list → data refreshes once
- [x] Simulate 429 (if backend throttling) → see exponential backoff in console
- [x] Rapid navigation between pages → no infinite loops
- [x] Unmount component during fetch → no state update errors

## Notes for Production

1. **Exponential backoff** is capped at 30 seconds to avoid excessive delays
2. **Mount checks** prevent all "Can't perform a React state update on an unmounted component" errors
3. **State flag pattern** eliminates the `location.state` infinite loop
4. **Dependency optimization** using `currentUser?.id` prevents unnecessary re-renders
5. **Console warnings** help debug rate limiting in production logs

## Backend Considerations

The backend should still implement proper rate limiting (e.g., `express-rate-limit`) to protect against abuse. The frontend backoff is a courtesy, not a security measure.

## Monitoring

Watch for these console logs to verify fixes:
- `Rate limited. Retrying in Xms (attempt Y)` - indicates 429 handling working
- No "Warning: Can't perform a React state update on an unmounted component" errors
- No repeated identical API calls in Network tab
- UI should be stable without flickering

## Rollback Plan

If issues arise, the changes are isolated to the 4 page components. Simply revert those files to restore previous behavior.
