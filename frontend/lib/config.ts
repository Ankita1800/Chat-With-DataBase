/**
 * Application Configuration
 * Centralized config to avoid hardcoding environment checks
 */

export const isDevelopment = process.env.NODE_ENV === 'development';
export const isProduction = process.env.NODE_ENV === 'production';

export const STORAGE_WARNING_KEY = 'storage_warning_dismissed';

export const shouldShowStorageWarning = (): boolean => {
  if (isProduction) return false;
  
  if (typeof window === 'undefined') return false;
  
  const dismissed = localStorage.getItem(STORAGE_WARNING_KEY);
  return dismissed !== 'true';
};

export const dismissStorageWarning = (): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_WARNING_KEY, 'true');
};
