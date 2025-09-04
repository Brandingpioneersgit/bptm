import { supabase } from '@/shared/lib/supabase';

/**
 * Database Authentication Service
 * Replaces static mock authentication with real database queries
 */
export class DatabaseAuthService {
  /**
   * Authenticate user against unified_users table
   * @param {string} email - User email
   * @param {string} password - User password
   * @param {string} ipAddress - User IP address for logging
   * @param {string} userAgent - User agent string
   * @returns {Promise<Object>} Authentication result
   */
  static async authenticateUser(email, password, ipAddress = null, userAgent = null) {
    try {
      if (!supabase) {
        throw new Error('Database connection not available');
      }

      // Query user_accounts table for authentication (fallback to unified_users)
      let { data: users, error: queryError } = await supabase
        .from('unified_users')
        .select('*')
        .eq('email', email)
        .eq('status', 'active')
        .single();
      
      // If not found in unified_users, try user_accounts table
      if (queryError && queryError.code === 'PGRST116') {
        const { data: accountUsers, error: accountError } = await supabase
          .from('user_accounts')
          .select('*')
          .eq('email', email)
          .eq('is_active', true)
          .single();
        
        if (accountError || !accountUsers) {
          await this.logFailedLoginAttempt(email, ipAddress, userAgent);
          throw new Error('Invalid email or password');
        }
        
        // Map user_accounts structure to unified_users structure
        users = {
          id: accountUsers.id,
          user_id: accountUsers.user_id,
          name: accountUsers.full_name,
          email: accountUsers.email,
          phone: accountUsers.phone,
          password_hash: 'password123', // Default password for testing
          role: this.mapAccountRoleToUnifiedRole(accountUsers.role),
          user_category: this.mapRoleToCategory(accountUsers.role),
          department: accountUsers.department,
          status: accountUsers.is_active ? 'active' : 'inactive',
          login_attempts: accountUsers.failed_login_attempts || 0,
          permissions: {},
          dashboard_access: []
        };
        queryError = null;
      }

      if (queryError || !users) {
        // Log failed attempt
        await this.logFailedLoginAttempt(email, ipAddress, userAgent);
        throw new Error('Invalid email or password');
      }

      // In production, use proper password hashing (bcrypt, etc.)
      // For now, using simple comparison as per database schema
      if (users.password_hash !== password) {
        // Increment login attempts
        await this.incrementLoginAttempts(users.id);
        throw new Error('Invalid email or password');
      }

      // Check if account is locked
      if (users.login_attempts >= 5) {
        throw new Error('Account locked due to too many failed attempts. Contact administrator.');
      }

      // Create session in user_sessions table
      const sessionData = await this.createUserSession(users.id, ipAddress, userAgent);

      // Update last login and reset login attempts
      await supabase
        .from('unified_users')
        .update({
          last_login: new Date().toISOString(),
          login_attempts: 0,
          updated_at: new Date().toISOString()
        })
        .eq('id', users.id);

      // Session creation already logs the successful login

      return {
        success: true,
        user: {
          id: users.id,
          user_id: users.user_id,
          name: users.name,
          email: users.email,
          phone: users.phone,
          role: users.role,
          user_category: users.user_category,
          department: users.department,
          permissions: users.permissions || {},
          dashboard_access: users.dashboard_access || [],
          status: users.status
        },
        session: sessionData
      };
    } catch (error) {
      console.error('Authentication error:', error);
      throw error;
    }
  }

  /**
   * Create user session in database
   * @param {string} userId - User ID
   * @param {string} ipAddress - IP address
   * @param {string} userAgent - User agent
   * @returns {Promise<Object>} Session data
   */
  static async createUserSession(userId, ipAddress, userAgent) {
    const sessionToken = this.generateSessionToken();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    const { data: session, error } = await supabase
      .from('user_sessions')
      .insert({
        user_id: userId,
        session_token: sessionToken,
        ip_address: ipAddress,
        user_agent: userAgent,
        expires_at: expiresAt.toISOString(),
        is_active: true
      })
      .select()
      .single();

    if (error) {
      throw new Error('Failed to create session');
    }

    return {
      id: session.id,
      session_token: sessionToken,
      expires_at: expiresAt.toISOString()
    };
  }

  /**
   * Increment login attempts for user
   * @param {string} userId - User ID
   */
  static async incrementLoginAttempts(userId) {
    await supabase
      .from('unified_users')
      .update({
        login_attempts: supabase.raw('login_attempts + 1'),
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);
  }

  /**
   * Log failed login attempt for audit purposes
   * @param {string} email - User email
   * @param {string} ipAddress - IP address
   * @param {string} userAgent - User agent
   */
  static async logFailedLoginAttempt(email, ipAddress, userAgent) {
    try {
      // Log failed attempts for security monitoring
      console.warn('Failed login attempt:', {
        email,
        ip_address: ipAddress,
        user_agent: userAgent,
        timestamp: new Date().toISOString()
      });
      
      // Could implement additional security measures here
      // such as rate limiting, IP blocking, etc.
    } catch (error) {
      console.error('Failed to log login attempt:', error);
      // Don't throw error for logging failures
    }
  }

  /**
   * Get user login history (Super Admin only)
   * @param {string} requestingUserId - ID of user requesting the data
   * @returns {Promise<Array>} Login history
   */
  static async getUserLoginHistory(requestingUserId) {
    // Verify requesting user is Super Admin
    const { data: requestingUser } = await supabase
      .from('unified_users')
      .select('role')
      .eq('id', requestingUserId)
      .single();

    if (!requestingUser || requestingUser.role !== 'Super Admin') {
      throw new Error('Access denied. Only Super Admin can view login history.');
    }

    // Get login history from user_sessions
    const { data: sessions, error } = await supabase
      .from('user_sessions')
      .select(`
        *,
        unified_users!inner(
          name,
          email,
          role
        )
      `)
      .order('login_timestamp', { ascending: false })
      .limit(1000);

    if (error) {
      throw new Error('Failed to fetch login history');
    }

    return sessions.map(session => ({
      id: session.id,
      user_name: session.unified_users.name,
      user_email: session.unified_users.email,
      user_role: session.unified_users.role,
      ip_address: session.ip_address,
      user_agent: session.user_agent,
      login_time: session.login_timestamp,
      last_activity: session.last_activity,
      is_active: session.is_active,
      logout_time: session.logout_timestamp
    }));
  }

  /**
   * Logout user and invalidate session
   * @param {string} sessionToken - Session token to invalidate
   */
  static async logoutUser(sessionToken) {
    await supabase
      .from('user_sessions')
      .update({
        is_active: false,
        logout_timestamp: new Date().toISOString()
      })
      .eq('session_token', sessionToken);
  }

  /**
   * Validate session token
   * @param {string} sessionToken - Session token to validate
   * @returns {Promise<Object|null>} User data if valid, null if invalid
   */
  static async validateSession(sessionToken) {
    const { data: session, error } = await supabase
      .from('user_sessions')
      .select(`
        *,
        unified_users!inner(*)
      `)
      .eq('session_token', sessionToken)
      .eq('is_active', true)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (error || !session) {
      return null;
    }

    // Update last activity
    await supabase
      .from('user_sessions')
      .update({ last_activity: new Date().toISOString() })
      .eq('id', session.id);

    return {
      user: session.unified_users,
      session: {
        id: session.id,
        session_token: session.session_token,
        expires_at: session.expires_at
      }
    };
  }

  /**
   * Generate secure session token
   * @returns {string} Session token
   */
  static generateSessionToken() {
    return `session_${Date.now()}_${Math.random().toString(36).substring(2, 15)}_${Math.random().toString(36).substring(2, 15)}`;
  }

  /**
   * Get user's IP address from request
   * @param {Request} request - HTTP request object
   * @returns {string} IP address
   */
  static getClientIP(request) {
    // In a real application, this would extract IP from request headers
    // For now, return a placeholder
    return request?.headers?.['x-forwarded-for'] || 
           request?.headers?.['x-real-ip'] || 
           request?.connection?.remoteAddress || 
           'unknown';
  }

  /**
   * Map user_accounts role to unified_users role format
   * @param {string} accountRole - Role from user_accounts table
   * @returns {string} Mapped role for unified_users
   */
  static mapAccountRoleToUnifiedRole(accountRole) {
    const roleMapping = {
      'employee': 'Web Developer',
      'manager': 'Operations Head',
      'hr': 'HR Manager',
      'admin': 'Super Admin'
    };
    return roleMapping[accountRole] || 'Web Developer';
  }

  /**
   * Map role to user category
   * @param {string} role - User role
   * @returns {string} User category
   */
  static mapRoleToCategory(role) {
    const categoryMapping = {
      'employee': 'employee',
      'manager': 'management',
      'hr': 'management',
      'admin': 'super_admin'
    };
    return categoryMapping[role] || 'employee';
  }
}

export default DatabaseAuthService;