// Supabase Configuration Helper
// This module handles fetching Supabase configuration from the backend
// if the local environment variables are not properly configured

import API_BASE_URL from './api';

// Cache the configuration
let cachedConfig = null;

/**
 * Fetch Supabase configuration from the backend
 * This is useful when the frontend doesn't have the keys configured
 * or when using dynamic configuration
 */
export async function fetchSupabaseConfig() {
  if (cachedConfig) {
    return cachedConfig;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/config`);
    const config = await response.json();
    
    if (config.error) {
      console.error('Backend config error:', config.message);
      console.log('Instructions:', config.instructions);
      return null;
    }
    
    cachedConfig = {
      url: config.supabaseUrl,
      anonKey: config.supabasePublishableKey || config.supabaseAnonKey,
      isNewKeyFormat: config.key_format === 'new',
      legacyKeysDisabled: config.legacy_keys_disabled
    };
    
    console.log('Fetched Supabase config from backend:', {
      url: cachedConfig.url,
      keyFormat: cachedConfig.isNewKeyFormat ? 'new' : 'legacy',
      legacyKeysDisabled: cachedConfig.legacyKeysDisabled
    });
    
    return cachedConfig;
  } catch (error) {
    console.error('Failed to fetch Supabase config from backend:', error);
    return null;
  }
}

/**
 * Get Supabase configuration from environment or backend
 */
export async function getSupabaseConfig() {
  // First try local environment variables
  const localUrl = process.env.REACT_APP_SUPABASE_URL;
  const localKey = process.env.REACT_APP_SUPABASE_PUBLISHABLE_KEY || 
                   process.env.REACT_APP_SUPABASE_KEY || 
                   process.env.REACT_APP_SUPABASE_ANON_KEY;
  
  // Check if the local key looks complete (should be > 100 chars for new keys)
  const isLocalKeyComplete = localKey && localKey.length > 100;
  
  if (localUrl && isLocalKeyComplete) {
    console.log('Using local Supabase configuration');
    return {
      url: localUrl,
      anonKey: localKey,
      isNewKeyFormat: localKey.startsWith('sb_publishable_'),
      legacyKeysDisabled: false
    };
  }
  
  // If local config is incomplete, try fetching from backend
  console.log('Local Supabase key appears incomplete, fetching from backend...');
  const backendConfig = await fetchSupabaseConfig();
  
  if (backendConfig) {
    return backendConfig;
  }
  
  // If backend fetch failed, return local config anyway (might work partially)
  if (localUrl && localKey) {
    console.warn('Using potentially incomplete local configuration');
    return {
      url: localUrl,
      anonKey: localKey,
      isNewKeyFormat: localKey.startsWith('sb_publishable_'),
      legacyKeysDisabled: false
    };
  }
  
  throw new Error('No valid Supabase configuration found');
}

/**
 * Clear cached configuration (useful for testing or reconfiguration)
 */
export function clearConfigCache() {
  cachedConfig = null;
}
