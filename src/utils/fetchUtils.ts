/**
 * Production-grade utilities for data fetching with caching, throttling, and cleanup
 */

export const CACHE_KEYS = {
  ANALYTICS: 'analyticsCache',
  ANALYTICS_TIME: 'analyticsCacheTime',
};

export const FETCH_CONFIG = {
  MIN_INTERVAL: 30000, // 30 seconds minimum between fetches
  CACHE_DURATION: 5 * 60 * 1000, // 5 minutes cache validity
};

/**
 * Get the last fetch timestamp from sessionStorage
 */
export const getLastFetchTime = (key: string = CACHE_KEYS.ANALYTICS_TIME): number => {
  try {
    const stored = sessionStorage.getItem(key);
    return stored ? parseInt(stored, 10) : 0;
  } catch {
    return 0;
  }
};

/**
 * Set the last fetch timestamp in sessionStorage
 */
export const setLastFetchTime = (timestamp?: number, key: string = CACHE_KEYS.ANALYTICS_TIME): void => {
  try {
    sessionStorage.setItem(key, (timestamp ?? Date.now()).toString());
  } catch (error) {
    console.warn('Failed to set fetch time:', error);
  }
};

/**
 * Check if cache is still valid based on time threshold
 */
export const isCacheValid = (
  cacheTimeKey: string = CACHE_KEYS.ANALYTICS_TIME,
  maxAge: number = FETCH_CONFIG.CACHE_DURATION
): boolean => {
  const lastFetch = getLastFetchTime(cacheTimeKey);
  return Date.now() - lastFetch < maxAge;
};

/**
 * Get cached data from sessionStorage
 */
export const getCachedData = <T>(key: string = CACHE_KEYS.ANALYTICS): T | null => {
  try {
    const cached = sessionStorage.getItem(key);
    return cached ? JSON.parse(cached) : null;
  } catch (error) {
    console.warn('Failed to parse cached data:', error);
    return null;
  }
};

/**
 * Save data to sessionStorage cache
 */
export const setCachedData = <T>(key: string, data: T): void => {
  try {
    sessionStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.warn('Failed to cache data:', error);
  }
};

/**
 * Clear cache for a specific key
 */
export const clearCache = (key: string = CACHE_KEYS.ANALYTICS): void => {
  try {
    sessionStorage.removeItem(key);
    sessionStorage.removeItem(CACHE_KEYS.ANALYTICS_TIME);
  } catch (error) {
    console.warn('Failed to clear cache:', error);
  }
};

/**
 * Create an AbortController with signal for cancellation
 */
export const createAbortSignal = (signal?: AbortSignal): { controller: AbortController; signal: AbortSignal } => {
  const controller = new AbortController();
  const abortSignal = signal || controller.signal;
  return { controller, signal: abortSignal };
};

/**
 * Throttle function calls based on time interval
 */
export const shouldFetch = (
  lastFetchTime: number,
  minInterval: number = FETCH_CONFIG.MIN_INTERVAL,
  hasExistingData: boolean = false
): boolean => {
  // Always allow fetch if we don't have existing data
  if (!hasExistingData) return true;
  // Throttle based on time interval
  return Date.now() - lastFetchTime >= minInterval;
};
