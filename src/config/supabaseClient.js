import { createClient } from '@supabase/supabase-js'

// Get Supabase URL (same for both legacy and new)
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL

// Support both new publishable key and legacy anon key during migration
const supabaseKey = process.env.REACT_APP_SUPABASE_PUBLISHABLE_KEY || 
                   process.env.REACT_APP_SUPABASE_KEY || 
                   process.env.REACT_APP_SUPABASE_ANON_KEY

// Detect which type of key is being used
const isUsingNewKey = supabaseKey && supabaseKey.startsWith('sb_publishable_')
const keyType = isUsingNewKey ? 'new publishable' : 'legacy anon'

// Log key type for debugging (remove in production)
if (process.env.NODE_ENV === 'development') {
  console.log(`Using ${keyType} key for Supabase client`)
}

if (!supabaseUrl || !supabaseKey) {
  const missingVars = []
  if (!supabaseUrl) missingVars.push('REACT_APP_SUPABASE_URL')
  if (!supabaseKey) {
    missingVars.push('REACT_APP_SUPABASE_PUBLISHABLE_KEY (or REACT_APP_SUPABASE_KEY for legacy)')
  }
  throw new Error(`Missing Supabase environment variables: ${missingVars.join(', ')}. Please check your .env file.`)
}

// Create Supabase client with appropriate configuration
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    // Add storage key prefix to avoid conflicts during migration
    storageKey: isUsingNewKey ? 'supabase-v2' : 'supabase-v1',
    storage: window.localStorage
  }
})

// Helper function to get the current user's JWT token with refresh handling
export const getAuthToken = async () => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession()
    
    if (error) {
      console.error('Error getting session:', error)
      return null
    }
    
    // If no session, try to refresh
    if (!session) {
      const { data: { session: refreshedSession }, error: refreshError } = await supabase.auth.refreshSession()
      if (refreshError) {
        console.error('Error refreshing session:', refreshError)
        return null
      }
      return refreshedSession?.access_token || null
    }
    
    return session?.access_token || null
  } catch (error) {
    console.error('Error in getAuthToken:', error)
    return null
  }
}

// Helper function to get current user with error handling
export const getCurrentUser = async () => {
  try {
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error) {
      console.error('Error getting user:', error)
      return null
    }
    return user
  } catch (error) {
    console.error('Error in getCurrentUser:', error)
    return null
  }
}

// Helper function to handle authentication state changes
export const onAuthStateChange = (callback) => {
  return supabase.auth.onAuthStateChange(callback)
}

// Helper function to sign out
export const signOut = async () => {
  try {
    const { error } = await supabase.auth.signOut()
    if (error) {
      console.error('Error signing out:', error)
      return { error }
    }
    return { error: null }
  } catch (error) {
    console.error('Error in signOut:', error)
    return { error }
  }
}

// Migration helper to check key type
export const getKeyType = () => keyType
export const isNewKeySystem = () => isUsingNewKey
