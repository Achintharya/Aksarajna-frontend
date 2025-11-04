import { createClient } from '@supabase/supabase-js'
import { getSupabaseConfig } from './supabaseConfig'

// Initialize variables
let supabaseClient = null;
let isInitialized = false;
let initPromise = null;

// Initialize Supabase client asynchronously
async function initializeSupabase() {
  if (isInitialized && supabaseClient) {
    return supabaseClient;
  }

  if (initPromise) {
    return initPromise;
  }

  initPromise = (async () => {
    try {
      // Get configuration from environment or backend
      const config = await getSupabaseConfig();
      
      if (!config || !config.url || !config.anonKey) {
        throw new Error('Invalid Supabase configuration received');
      }

      // Log key type for debugging
      if (process.env.NODE_ENV === 'development') {
        console.log(`Using ${config.isNewKeyFormat ? 'new publishable' : 'legacy anon'} key for Supabase client`);
        if (config.legacyKeysDisabled && !config.isNewKeyFormat) {
          console.warn('Warning: Legacy keys are disabled but using legacy key format');
        }
      }

      // Create Supabase client with appropriate configuration
      supabaseClient = createClient(config.url, config.anonKey, {
        auth: {
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: true,
          // Add storage key prefix to avoid conflicts during migration
          storageKey: config.isNewKeyFormat ? 'supabase-v2' : 'supabase-v1',
          storage: window.localStorage
        }
      });

      isInitialized = true;
      return supabaseClient;
    } catch (error) {
      console.error('Failed to initialize Supabase client:', error);
      
      // Try fallback with hardcoded values if available
      const fallbackUrl = 'https://pvarvmjbazehivkiuosk.supabase.co';
      const fallbackKey = 'sb_publishable_IvjwC57DW32fhlGiWAiHBg_3eJLrr62';
      
      if (fallbackUrl && fallbackKey) {
        console.warn('Using fallback Supabase configuration');
        supabaseClient = createClient(fallbackUrl, fallbackKey, {
          auth: {
            autoRefreshToken: true,
            persistSession: true,
            detectSessionInUrl: true,
            storageKey: 'supabase-v2',
            storage: window.localStorage
          }
        });
        isInitialized = true;
        return supabaseClient;
      }
      
      throw error;
    }
  })();

  return initPromise;
}

// Helper function to ensure Supabase is initialized before use
async function ensureInitialized() {
  if (!supabaseClient) {
    await initializeSupabase();
  }
  return supabaseClient;
}

// Create a more sophisticated proxy that handles nested property access
function createSupabaseProxy() {
  function createProxy(path = []) {
    return new Proxy(() => {}, {
      get(target, prop) {
        // Handle special cases
        if (prop === 'then' || prop === 'catch' || prop === Symbol.toStringTag) {
          return undefined;
        }
        
        // Build the property path
        const newPath = [...path, prop];
        
        // Return another proxy for nested access
        return createProxy(newPath);
      },
      
      apply(target, thisArg, args) {
        // When the proxy is called as a function, execute the actual call
        return (async () => {
          const client = await ensureInitialized();
          
          // Navigate to the actual property using the path
          let current = client;
          for (let i = 0; i < path.length - 1; i++) {
            current = current[path[i]];
          }
          
          // Get the final property/method
          const method = current[path[path.length - 1]];
          
          // Call the method with the correct context
          if (typeof method === 'function') {
            return method.apply(current, args);
          }
          
          return method;
        })();
      }
    });
  }
  
  // Create the root proxy with special handling for common patterns
  return new Proxy({}, {
    get(target, prop) {
      // Handle special cases
      if (prop === 'then' || prop === 'catch' || prop === Symbol.toStringTag) {
        return undefined;
      }
      
      // For auth.onAuthStateChange and similar nested calls
      if (prop === 'auth') {
        return new Proxy({}, {
          get(authTarget, authProp) {
            // Special handling for onAuthStateChange which needs synchronous return
            if (authProp === 'onAuthStateChange') {
              return (callback) => {
                // Initialize if needed, but return a proper subscription object immediately
                if (supabaseClient) {
                  // Client already initialized, return subscription directly
                  return supabaseClient.auth.onAuthStateChange(callback);
                } else {
                  // Client not initialized yet, return a mock subscription and set up real one async
                  let realSubscription = null;
                  
                  // Initialize and set up real subscription
                  ensureInitialized().then(client => {
                    realSubscription = client.auth.onAuthStateChange(callback);
                  }).catch(err => {
                    console.error('Failed to set up auth state change listener:', err);
                  });
                  
                  // Return mock subscription that will clean up the real one when ready
                  return {
                    data: {
                      subscription: {
                        unsubscribe: () => {
                          if (realSubscription?.data?.subscription) {
                            realSubscription.data.subscription.unsubscribe();
                          }
                        }
                      }
                    }
                  };
                }
              };
            }
            
            // For other auth methods, keep async behavior
            return (...args) => {
              return (async () => {
                const client = await ensureInitialized();
                const authMethod = client.auth[authProp];
                if (typeof authMethod === 'function') {
                  return authMethod.apply(client.auth, args);
                }
                return authMethod;
              })();
            };
          }
        });
      }
      
      // For storage.from() and similar patterns
      if (prop === 'storage') {
        return new Proxy({}, {
          get(storageTarget, storageProp) {
            return (...args) => {
              return (async () => {
                const client = await ensureInitialized();
                const storageMethod = client.storage[storageProp];
                if (typeof storageMethod === 'function') {
                  return storageMethod.apply(client.storage, args);
                }
                return storageMethod;
              })();
            };
          }
        });
      }
      
      // For other direct properties/methods
      return (...args) => {
        return (async () => {
          const client = await ensureInitialized();
          const method = client[prop];
          if (typeof method === 'function') {
            return method.apply(client, args);
          }
          return method;
        })();
      };
    }
  });
}

// Export the proxy-wrapped supabase client
export const supabase = createSupabaseProxy();

// Initialize the client immediately to avoid race conditions
initializeSupabase().catch(err => {
  console.error('Failed to initialize Supabase client on load:', err);
});

// Helper function to get the current user's JWT token with refresh handling
export const getAuthToken = async () => {
  try {
    const client = await ensureInitialized();
    const { data: { session }, error } = await client.auth.getSession();
    
    if (error) {
      console.error('Error getting session:', error);
      return null;
    }
    
    // If no session, try to refresh
    if (!session) {
      const { data: { session: refreshedSession }, error: refreshError } = await client.auth.refreshSession();
      if (refreshError) {
        console.error('Error refreshing session:', refreshError);
        return null;
      }
      return refreshedSession?.access_token || null;
    }
    
    return session?.access_token || null;
  } catch (error) {
    console.error('Error in getAuthToken:', error);
    return null;
  }
}

// Helper function to get current user with error handling
export const getCurrentUser = async () => {
  try {
    const client = await ensureInitialized();
    const { data: { user }, error } = await client.auth.getUser();
    if (error) {
      console.error('Error getting user:', error);
      return null;
    }
    return user;
  } catch (error) {
    console.error('Error in getCurrentUser:', error);
    return null;
  }
}

// Helper function to handle authentication state changes
export const onAuthStateChange = async (callback) => {
  const client = await ensureInitialized();
  return client.auth.onAuthStateChange(callback);
}

// Helper function to sign out
export const signOut = async () => {
  try {
    const client = await ensureInitialized();
    const { error } = await client.auth.signOut();
    if (error) {
      console.error('Error signing out:', error);
      return { error };
    }
    return { error: null };
  } catch (error) {
    console.error('Error in signOut:', error);
    return { error };
  }
}

// Export initialization function for manual initialization
export { initializeSupabase };

// Migration helper to check key type
export const getKeyType = () => 'new publishable';
export const isNewKeySystem = () => true;
