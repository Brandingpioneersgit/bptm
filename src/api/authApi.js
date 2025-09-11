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
    console.log('🔑 API: Supabase client available:', supabase ? '✅ Yes' : '❌ No');
    
    if (!supabase) {
      console.error('❌ API: Supabase client is not initialized');
      return {
        success: false,
        error: 'Database connection error. Please try again later.'
      };
    }
    
    if (!firstName || !phoneNumber) {
      return {
        success: false,
        error: 'First name and phone number are required'
      };
    }

    // Normalize inputs
    const normalizedFirstName = firstName.trim();
    const normalizedPhone = phoneNumber.trim();
    
    console.log('🔐 API: Normalized inputs:', { firstName: normalizedFirstName, phone: normalizedPhone });

    // First, get all users with names containing the first name (case-insensitive)
    // This handles cases where first name is part of full name like "Marketing" in "Marketing Manager"
    console.log(`🔍 API: Executing query: .from('unified_users').select('*').ilike('name', '%${normalizedFirstName}%').eq('status', 'active')`);
    
    let users;
    try {
      const { data, error: searchError } = await supabase
        .from('unified_users')
        .select('*')
        .ilike('name', `%${normalizedFirstName}%`) // Search for first name anywhere in full name
        .eq('status', 'active');

      if (searchError) {
        console.error('❌ API: Database search error:', searchError);
        return {
          success: false,
          error: 'Database error occurred during authentication'
        };
      }
      
      users = data;
      console.log(`🔍 API: Query returned ${users?.length || 0} users`);
      if (users) {
        console.log('🔍 API: User IDs returned:', users.map(u => u.id).join(', '));
      }
    } catch (queryError) {
      console.error('❌ API: Error executing query:', queryError);
      return {
        success: false,
        error: 'Database error occurred during authentication'
      };
    }

    if (!users || users.length === 0) {
      console.log('❌ API: No users found matching pattern:', normalizedFirstName);
      return {
        success: false,
        error: `No user found with name starting with "${normalizedFirstName}". Please check your spelling and try again.`
      };
    }

    // Find exact match by extracting first name from full name
    console.log('🔍 API: Looking for exact first name match...');
    
    // First try exact match (case-insensitive)
    let matchingUser = users.find(user => {
      const userFirstName = user.name.split(' ')[0].toLowerCase();
      const inputFirstName = normalizedFirstName.toLowerCase();
      const isMatch = userFirstName === inputFirstName;
      console.log(`🔍 API: Comparing '${userFirstName}' with '${inputFirstName}' = ${isMatch}`);
      return isMatch;
    });
    
    // If no exact match, try to match with the first part of the name
    // This handles cases like "john" matching "John SEO"
    if (!matchingUser) {
      console.log('🔍 API: No exact match found, trying partial match...');
      matchingUser = users.find(user => {
        const userName = user.name.toLowerCase();
        const inputName = normalizedFirstName.toLowerCase();
        // Check if the user's name starts with the input name
        const isPartialMatch = userName.startsWith(inputName);
        console.log(`🔍 API: Partial comparing '${userName}' with '${inputName}' = ${isPartialMatch}`);
        return isPartialMatch;
      });
    }

    if (!matchingUser) {
      console.log('❌ API: No matching user found');
      return {
        success: false,
        error: `No user found matching "${normalizedFirstName}". Please try your exact first name as shown in your profile (e.g., "John" for "John SEO").`
      };
    }
    
    console.log('✅ API: Found matching user:', matchingUser.name);

    // Validate phone number
    const userPhone = normalizePhoneNumber(matchingUser.phone);
    const inputPhone = normalizePhoneNumber(normalizedPhone);
    
    console.log('🔍 API: Phone validation:', { 
      original: { user: matchingUser.phone, input: normalizedPhone },
      normalized: { user: userPhone, input: inputPhone },
      match: userPhone === inputPhone
    });

    if (userPhone !== inputPhone) {
      console.log('❌ API: Phone number mismatch:', { expected: userPhone, provided: inputPhone });
      return {
        success: false,
        error: 'Incorrect phone number. Please try again.'
      };
    }
    
    console.log('✅ API: Phone number validated successfully');

    // Generate session token
    console.log('🔍 API: Generating session token...');
    const sessionToken = generateSessionToken(matchingUser.id);
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Create session data
    const sessionData = {
      sessionId: sessionToken,
      userId: matchingUser.id,
      expiresAt: expiresAt.toISOString(),
      createdAt: new Date().toISOString()
    };
    
    console.log('🔍 API: Session data created');

    // Store session in database
    try {
      console.log('🔍 API: Storing session in database...');
      await supabase
        .from('user_sessions')
        .insert({
          user_id: matchingUser.id,
          session_token: sessionToken,
          expires_at: expiresAt.toISOString()
        });
      console.log('✅ API: Session stored in database');
    } catch (sessionError) {
      console.warn('⚠️ API: Could not store session in database:', sessionError);
      // Continue anyway - session will be stored in localStorage
    }

    // Prepare user data for return
    const userData = {
      id: matchingUser.id,
      name: matchingUser.name,
      firstName: matchingUser.name.split(' ')[0],
      phone: matchingUser.phone,
      email: matchingUser.email,
      role: matchingUser.role,
      user_category: matchingUser.user_category,
      department: matchingUser.department,
      permissions: matchingUser.permissions || {},
      dashboard_access: matchingUser.dashboard_access || []
    };
    
    console.log('✅ API: Authentication successful for:', matchingUser.name);

    return {
      success: true,
      user: userData,
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