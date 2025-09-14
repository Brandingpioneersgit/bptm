/**
 * Authentication API service
 * This service handles authentication by making API calls to the server
 * instead of directly using Supabase in the browser
 */

import { supabase } from '@/shared/lib/supabase';

/**
 * Authenticate a user with first name and phone number
 * @param {string} firstName - User's first name
 * @param {string} phoneNumber - User's phone number
 * @returns {Promise<{success: boolean, user?: object, token?: string, error?: string}>}
 */
export async function authenticateUser(firstName, phoneNumber) {
  try {
    console.log('🔐 API: Authenticating user:', { firstName, phoneNumber });
    
    if (!firstName || !phoneNumber) {
      return {
        success: false,
        error: 'First name and phone number are required'
      };
    }

    // Normalize inputs
    const normalizedFirstName = firstName.trim();
    const normalizedPhone = normalizePhoneNumber(phoneNumber.trim());
    
    console.log('🔐 API: Normalized inputs:', { firstName: normalizedFirstName, phone: normalizedPhone });

    // Use the backend API for authentication instead of direct Supabase
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        firstName: normalizedFirstName,
        phone: normalizedPhone,
        type: 'phone_auth'
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('❌ API: Authentication failed:', errorData);
      return {
        success: false,
        error: errorData.error || 'Authentication failed'
      };
    }

    const authResult = await response.json();
    console.log('✅ API: Authentication successful:', authResult.user?.name);

    // Generate session token
    const sessionToken = generateSessionToken(authResult.user.id);
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Create session data
    const sessionData = {
      sessionId: sessionToken,
      userId: authResult.user.id,
      expiresAt: expiresAt.toISOString(),
      createdAt: new Date().toISOString()
    };

    return {
      success: true,
      user: authResult.user,
      token: sessionToken,
      sessionData
    };

  } catch (error) {
    console.error('❌ API: Authentication error:', error);
    return {
      success: false,
      error: 'An unexpected error occurred during authentication'
    };
  }
}

/**
 * Normalize phone number for comparison
 * Removes country codes, spaces, dashes, and parentheses
 */
function normalizePhoneNumber(phone) {
  if (!phone) return '';
  
  return phone
    .replace(/^\+91-?/, '') // Remove +91 country code
    .replace(/[\s\-\(\)]/g, '') // Remove spaces, dashes, parentheses
    .replace(/^0/, ''); // Remove leading zero if present
}

/**
 * Generate a session token (simplified JWT-like token)
 */
function generateSessionToken(userId) {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2);
  return `${userId}_${timestamp}_${randomString}`;
}

/**
 * Get dashboard route based on user role
 */
export function getDashboardRoute(role) {
  const roleRoutes = {
    'Super Admin': '/super-admin',
    'Operations Head': '/admin',
    'Manager': '/admin',
    'HR': '/admin',
    'Accountant': '/admin',
    'Sales': '/admin',
    'SEO': '/employee',
    'Ads': '/employee',
    'Social Media': '/employee',
    'YouTube SEO': '/employee',
    'Web Developer': '/employee',
    'Graphic Designer': '/employee',
    'Freelancer': '/employee',
    'Intern': '/employee',
    'Client': '/client'
  };

  return roleRoutes[role] || '/dashboard';
}

/**
 * Validate session token
 */
export async function validateSession(token) {
  try {
    if (!token) return { valid: false, error: 'No token provided' };

    // Extract user ID from token
    const [userId] = token.split('_');
    
    // Check if session exists in database
    const { data: session, error } = await supabase
      .from('user_sessions')
      .select('*')
      .eq('session_token', token)
      .eq('user_id', userId)
      .single();

    if (error || !session) {
      return { valid: false, error: 'Invalid session' };
    }

    // Check if session is expired
    if (new Date(session.expires_at) < new Date()) {
      // Clean up expired session
      await supabase
        .from('user_sessions')
        .delete()
        .eq('session_token', token);
      
      return { valid: false, error: 'Session expired' };
    }

    return { valid: true, session };
  } catch (error) {
    console.error('Session validation error:', error);
    return { valid: false, error: 'Session validation failed' };
  }
}

/**
 * Logout user and clear session
 */
export async function logout(token) {
  try {
    if (token) {
      // Remove session from database
      await supabase
        .from('user_sessions')
        .delete()
        .eq('session_token', token);
    }

    // Clear localStorage
    if (typeof window !== 'undefined') {
      localStorage.removeItem('unified_auth_session');
      localStorage.removeItem('unified_auth_user');
      localStorage.removeItem('unified_auth_local_user');
    }

    return { success: true };
  } catch (error) {
    console.error('Logout error:', error);
    return { success: false, error: 'Logout failed' };
  }
}