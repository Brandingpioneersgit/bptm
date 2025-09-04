/**
 * IP Tracking and Geolocation Utilities
 * Handles IP address detection and location data for login tracking
 */

/**
 * Get the user's IP address from various sources
 * @returns {Promise<string>} The user's IP address
 */
export const getUserIP = async () => {
  try {
    // Try multiple IP detection services for reliability
    const ipServices = [
      'https://api.ipify.org?format=json',
      'https://ipapi.co/json/',
      'https://ip-api.com/json/'
    ];

    for (const service of ipServices) {
      try {
        const response = await fetch(service, {
          method: 'GET',
          timeout: 5000 // 5 second timeout
        });
        
        if (response.ok) {
          const data = await response.json();
          // Different services return IP in different fields
          const ip = data.ip || data.query || data.ipAddress;
          if (ip) {
            return ip;
          }
        }
      } catch (error) {
        console.warn(`IP service ${service} failed:`, error);
        continue;
      }
    }
    
    // Fallback: try to get from headers (if available)
    return 'unknown';
  } catch (error) {
    console.error('Failed to get user IP:', error);
    return 'unknown';
  }
};

/**
 * Get location data based on IP address
 * @param {string} ipAddress - The IP address to lookup
 * @returns {Promise<Object>} Location data object
 */
export const getLocationData = async (ipAddress) => {
  try {
    if (!ipAddress || ipAddress === 'unknown' || ipAddress === '127.0.0.1') {
      return {
        country: 'Unknown',
        region: 'Unknown',
        city: 'Unknown',
        timezone: 'Unknown',
        isp: 'Unknown'
      };
    }

    // Use ip-api.com for location data (free tier allows 1000 requests/month)
    const response = await fetch(`https://ip-api.com/json/${ipAddress}?fields=status,message,country,regionName,city,timezone,isp,org,as,query`, {
      method: 'GET',
      timeout: 5000
    });

    if (response.ok) {
      const data = await response.json();
      
      if (data.status === 'success') {
        return {
          country: data.country || 'Unknown',
          region: data.regionName || 'Unknown',
          city: data.city || 'Unknown',
          timezone: data.timezone || 'Unknown',
          isp: data.isp || 'Unknown',
          organization: data.org || 'Unknown',
          as: data.as || 'Unknown'
        };
      }
    }
    
    // Fallback location data
    return {
      country: 'Unknown',
      region: 'Unknown', 
      city: 'Unknown',
      timezone: 'Unknown',
      isp: 'Unknown'
    };
  } catch (error) {
    console.error('Failed to get location data:', error);
    return {
      country: 'Unknown',
      region: 'Unknown',
      city: 'Unknown', 
      timezone: 'Unknown',
      isp: 'Unknown'
    };
  }
};

/**
 * Get browser and device information
 * @returns {Object} User agent and device info
 */
export const getDeviceInfo = () => {
  try {
    const userAgent = navigator.userAgent;
    
    // Basic browser detection
    let browser = 'Unknown';
    if (userAgent.includes('Chrome')) browser = 'Chrome';
    else if (userAgent.includes('Firefox')) browser = 'Firefox';
    else if (userAgent.includes('Safari')) browser = 'Safari';
    else if (userAgent.includes('Edge')) browser = 'Edge';
    else if (userAgent.includes('Opera')) browser = 'Opera';
    
    // Basic OS detection
    let os = 'Unknown';
    if (userAgent.includes('Windows')) os = 'Windows';
    else if (userAgent.includes('Mac')) os = 'macOS';
    else if (userAgent.includes('Linux')) os = 'Linux';
    else if (userAgent.includes('Android')) os = 'Android';
    else if (userAgent.includes('iOS')) os = 'iOS';
    
    // Device type detection
    let deviceType = 'Desktop';
    if (/Mobi|Android/i.test(userAgent)) deviceType = 'Mobile';
    else if (/Tablet|iPad/i.test(userAgent)) deviceType = 'Tablet';
    
    return {
      userAgent,
      browser,
      os,
      deviceType,
      language: navigator.language || 'Unknown',
      platform: navigator.platform || 'Unknown'
    };
  } catch (error) {
    console.error('Failed to get device info:', error);
    return {
      userAgent: 'Unknown',
      browser: 'Unknown',
      os: 'Unknown',
      deviceType: 'Unknown',
      language: 'Unknown',
      platform: 'Unknown'
    };
  }
};

/**
 * Record a login attempt with all tracking data
 * @param {Object} loginData - Login attempt data
 * @returns {Promise<Object>} Complete tracking record
 */
export const recordLoginAttempt = async (loginData) => {
  try {
    // Get IP address and location data
    const ipAddress = await getUserIP();
    const locationData = await getLocationData(ipAddress);
    const deviceInfo = getDeviceInfo();

    // Create comprehensive tracking record for user_sessions table
    const trackingRecord = {
      user_id: loginData.userId || null,
      email: loginData.email,
      user_type: loginData.userType || 'employee',
      login_status: loginData.loginStatus, // 'success' or 'failed'
      failure_reason: loginData.failureReason || null,
      session_id: loginData.sessionId || null,
      ip_address: ipAddress,
      user_agent: navigator.userAgent,
      location_data: locationData,
      device_info: deviceInfo,
      timestamp: new Date().toISOString()
    };

    console.log('Login attempt recorded:', {
      email: trackingRecord.email,
      status: trackingRecord.login_status,
      ip: trackingRecord.ip_address,
      location: `${locationData?.city}, ${locationData?.country}`,
      device: `${deviceInfo?.browser} on ${deviceInfo?.os}`
    });

    return trackingRecord;
  } catch (error) {
    console.error('Failed to record login attempt:', error);
    return {
      email: loginData.email,
      login_status: loginData.loginStatus,
      failure_reason: loginData.failureReason,
      ip_address: 'unknown',
      user_agent: navigator.userAgent,
      timestamp: new Date().toISOString(),
      error: error.message
    };
  }
};

/**
 * Save login tracking record to database using user_sessions table
 * @param {Object} supabase - Supabase client instance
 * @param {Object} trackingRecord - The tracking record to save
 * @returns {Promise<Object>} The saved record or error
 */
export const saveLoginTracking = async (supabase, trackingRecord) => {
  try {
    // For successful logins, this will be handled by DatabaseAuthService
    // For failed attempts, we can log them to a separate tracking system or user_sessions with null user_id
    if (trackingRecord.login_status === 'success' && trackingRecord.user_id) {
      // Successful login - session should already be created by DatabaseAuthService
      console.log('Successful login tracked via user_sessions');
      return { success: true, message: 'Login tracked via user_sessions' };
    }

    // For failed attempts, we could create a failed login entry
    // But since we're removing login_attempts table, we'll just log it
    console.warn('Failed login attempt:', {
      email: trackingRecord.email,
      ip: trackingRecord.ip_address,
      reason: trackingRecord.failure_reason,
      timestamp: trackingRecord.timestamp
    });

    return { success: true, message: 'Failed login attempt logged' };

    return { success: true, data };
  } catch (error) {
    console.error('Error saving login tracking:', error);
    return { success: false, error: error.message };
  }
};