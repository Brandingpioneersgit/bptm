import { supabase as defaultSupabase } from '@/shared/lib/supabase';
import { adminSupabase } from '@/shared/lib/adminSupabase';

// Use admin Supabase client if available, otherwise fall back to default
const supabase = adminSupabase || defaultSupabase;

// Log which client we're using for debugging
console.log('AuthenticationService using:', adminSupabase ? 'Admin Supabase client' : 'Default Supabase client');

/**
 * Authentication Service for first name + phone number login
 * Implements the exact requirements: case-insensitive first name search,
 * phone number validation, and role-based dashboard routing
 */
export class AuthenticationService {
  /**
   * Authenticate user with first name and phone number
   * @param {string} firstName - User's first name (case-insensitive)
   * @param {string} phoneNumber - User's phone number
   * @returns {Promise<{success: boolean, user?: object, token?: string, error?: string}>}
   */
  static async authenticateUser(firstName, phoneNumber) {
    try {
      console.log('🔍 DEBUG: Authentication attempt with:', { firstName, phoneNumber });
      
      if (!firstName || !phoneNumber) {
        console.log('❌ DEBUG: Missing required fields');
        return {
          success: false,
          error: 'First name and phone number are required'
        };
      }

      // Normalize inputs
      const normalizedFirstName = firstName.trim();
      const normalizedPhone = phoneNumber.trim();

      console.log('🔐 DEBUG: Normalized inputs:', { firstName: normalizedFirstName, phone: normalizedPhone });

      // Search for user by first name (case-insensitive)
      // Using ilike for case-insensitive search in PostgreSQL
      console.log(`🔍 DEBUG: Executing query: .from('unified_users').select('*').ilike('name', '${normalizedFirstName}%').eq('status', 'active')`);
      
      const { data: users, error: searchError } = await supabase
        .from('unified_users')
        .select('*')
        .ilike('name', `${normalizedFirstName}%`) // Case-insensitive search starting with first name
        .eq('status', 'active');

      if (searchError) {
        console.error('❌ DEBUG: Database search error:', searchError);
        return {
          success: false,
          error: 'Database error occurred during authentication'
        };
      }

      console.log(`🔍 DEBUG: Query returned ${users?.length || 0} users:`, users);

      if (!users || users.length === 0) {
        console.log('❌ DEBUG: No users found matching pattern:', normalizedFirstName);
        return {
          success: false,
          error: `User with first name "${normalizedFirstName}" not found`
        };
      }

      // Find exact match by extracting first name from full name
      console.log('🔍 DEBUG: Looking for exact first name match...');
      
      const matchingUser = users.find(user => {
        const userFirstName = user.name.split(' ')[0].toLowerCase();
        const inputFirstName = normalizedFirstName.toLowerCase();
        const isMatch = userFirstName === inputFirstName;
        console.log(`🔍 DEBUG: Comparing '${userFirstName}' with '${inputFirstName}' = ${isMatch}`);
        return isMatch;
      });

      if (!matchingUser) {
        console.log('❌ DEBUG: No exact first name match found');
        return {
          success: false,
          error: `User with first name "${normalizedFirstName}" not found`
        };
      }
      
      console.log('✅ DEBUG: Found matching user:', matchingUser.name);

      // Validate phone number
      const userPhone = this.normalizePhoneNumber(matchingUser.phone);
      const inputPhone = this.normalizePhoneNumber(normalizedPhone);
      
      console.log('🔍 DEBUG: Phone validation:', { 
        original: { user: matchingUser.phone, input: normalizedPhone },
        normalized: { user: userPhone, input: inputPhone },
        match: userPhone === inputPhone
      });

      if (userPhone !== inputPhone) {
        console.log('❌ DEBUG: Phone number mismatch:', { expected: userPhone, provided: inputPhone });
        return {
          success: false,
          error: 'Incorrect phone number. Please try again.'
        };
      }
      
      console.log('✅ DEBUG: Phone number validated successfully');

      // Generate session token (JWT-like)
      console.log('🔍 DEBUG: Generating session token...');
      const sessionToken = this.generateSessionToken(matchingUser.id);
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      // Create session record
      const sessionData = {
        sessionId: sessionToken,
        userId: matchingUser.id,
        expiresAt: expiresAt.toISOString(),
        createdAt: new Date().toISOString()
      };
      
      console.log('🔍 DEBUG: Session data created:', sessionData);

      // Store session in database (optional - for session management)
      try {
        console.log('🔍 DEBUG: Storing session in database...');
        await supabase
          .from('user_sessions')
          .insert({
            user_id: matchingUser.id,
            session_token: sessionToken,
            expires_at: expiresAt.toISOString()
          });
        console.log('✅ DEBUG: Session stored in database');
      } catch (sessionError) {
        console.warn('⚠️ DEBUG: Could not store session in database:', sessionError);
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
      
      console.log('✅ DEBUG: Authentication successful for:', matchingUser.name);
      console.log('🔍 DEBUG: User data:', userData);
      console.log('🔍 DEBUG: Dashboard route:', this.getDashboardRoute(matchingUser.role));

      return {
        success: true,
        user: userData,
        token: sessionToken,
        sessionData
      };

    } catch (error) {
      console.error('Authentication error:', error);
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
  static normalizePhoneNumber(phone) {
    if (!phone) return '';
    
    return phone
      .replace(/^\+91-?/, '') // Remove +91 country code
      .replace(/[\s\-\(\)]/g, '') // Remove spaces, dashes, parentheses
      .replace(/^0/, ''); // Remove leading zero if present
  }

  /**
   * Generate a session token (simplified JWT-like token)
   */
  static generateSessionToken(userId) {
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2);
    return `${userId}_${timestamp}_${randomString}`;
  }

  /**
   * Get dashboard route based on user role
   */
  static getDashboardRoute(role) {
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
  static async validateSession(token) {
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
  static async logout(token) {
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
}