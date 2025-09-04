import React, { useState, useEffect } from 'react';
import { DatabaseAuthService } from './DatabaseAuthService';
import { useUnifiedAuth } from '@/features/auth/UnifiedAuthContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { RefreshCw, Search, Download, Eye, EyeOff } from 'lucide-react';
import { useToast } from '@/shared/components/Toast';

/**
 * Login History Component - Super Admin Only
 * Displays comprehensive login logs with IP addresses and user details
 */
export function LoginHistoryComponent() {
  const { user, hasPermission } = useUnifiedAuth();
  const { notify } = useToast();
  const [loginHistory, setLoginHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showIPAddresses, setShowIPAddresses] = useState(true);
  const [filteredHistory, setFilteredHistory] = useState([]);

  // Check if user has permission to view login logs
  const canViewLogs = hasPermission('audit:logs') && user?.role === 'Super Admin';

  useEffect(() => {
    if (canViewLogs) {
      fetchLoginHistory();
    }
  }, [canViewLogs]);

  useEffect(() => {
    // Filter login history based on search term
    if (searchTerm) {
      const filtered = loginHistory.filter(log => 
        log.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.user_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.user_role?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.ip_address?.includes(searchTerm)
      );
      setFilteredHistory(filtered);
    } else {
      setFilteredHistory(loginHistory);
    }
  }, [searchTerm, loginHistory]);

  const fetchLoginHistory = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const history = await DatabaseAuthService.getUserLoginHistory(user.id);
      setLoginHistory(history);
      
      notify({
        type: 'success',
        title: 'Login History Loaded',
        message: `Retrieved ${history.length} login records`
      });
    } catch (err) {
      console.error('Failed to fetch login history:', err);
      setError(err.message);
      
      notify({
        type: 'error',
        title: 'Access Denied',
        message: err.message
      });
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    if (filteredHistory.length === 0) {
      notify({
        type: 'warning',
        title: 'No Data',
        message: 'No login history to export'
      });
      return;
    }

    const headers = ['User Name', 'Email', 'Role', 'IP Address', 'Login Time', 'Last Activity', 'Status', 'Logout Time'];
    const csvContent = [
      headers.join(','),
      ...filteredHistory.map(log => [
        `"${log.user_name || 'N/A'}"`,
        `"${log.user_email || 'N/A'}"`,
        `"${log.user_role || 'N/A'}"`,
        `"${showIPAddresses ? log.ip_address || 'N/A' : 'Hidden'}"`,
        `"${new Date(log.login_time).toLocaleString()}"`,
        `"${log.last_activity ? new Date(log.last_activity).toLocaleString() : 'N/A'}"`,
        `"${log.is_active ? 'Active' : 'Inactive'}"`,
        `"${log.logout_time ? new Date(log.logout_time).toLocaleString() : 'N/A'}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `login_history_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    notify({
      type: 'success',
      title: 'Export Complete',
      message: 'Login history exported to CSV'
    });
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };

  const getStatusBadge = (isActive) => {
    return (
      <Badge variant={isActive ? 'success' : 'secondary'}>
        {isActive ? 'Active' : 'Inactive'}
      </Badge>
    );
  };

  const getRoleBadge = (role) => {
    const roleColors = {
      'Super Admin': 'destructive',
      'Operations Head': 'warning',
      'HR': 'info',
      'Manager': 'secondary',
      'Employee': 'outline',
      'Intern': 'outline',
      'Freelancer': 'outline'
    };

    return (
      <Badge variant={roleColors[role] || 'outline'}>
        {role}
      </Badge>
    );
  };

  // Access control check
  if (!canViewLogs) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardContent className="p-6">
          <Alert>
            <AlertDescription>
              Access Denied: Only Super Admin users can view login history.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-6xl mx-auto">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="text-2xl font-bold">User Login History</CardTitle>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowIPAddresses(!showIPAddresses)}
              className="flex items-center gap-2"
            >
              {showIPAddresses ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              {showIPAddresses ? 'Hide IPs' : 'Show IPs'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={exportToCSV}
              disabled={filteredHistory.length === 0}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Export CSV
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchLoginHistory}
              disabled={loading}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>
        
        <div className="flex items-center gap-4 mt-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by name, email, role, or IP address..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="text-sm text-gray-600">
            Showing {filteredHistory.length} of {loginHistory.length} records
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {error && (
          <Alert className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {loading ? (
          <div className="flex justify-center items-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin" />
            <span className="ml-2">Loading login history...</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-200">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border border-gray-200 px-4 py-2 text-left">User</th>
                  <th className="border border-gray-200 px-4 py-2 text-left">Role</th>
                  {showIPAddresses && (
                    <th className="border border-gray-200 px-4 py-2 text-left">IP Address</th>
                  )}
                  <th className="border border-gray-200 px-4 py-2 text-left">Login Time</th>
                  <th className="border border-gray-200 px-4 py-2 text-left">Last Activity</th>
                  <th className="border border-gray-200 px-4 py-2 text-left">Status</th>
                  <th className="border border-gray-200 px-4 py-2 text-left">Logout Time</th>
                </tr>
              </thead>
              <tbody>
                {filteredHistory.length === 0 ? (
                  <tr>
                    <td 
                      colSpan={showIPAddresses ? 7 : 6} 
                      className="border border-gray-200 px-4 py-8 text-center text-gray-500"
                    >
                      {searchTerm ? 'No matching login records found' : 'No login history available'}
                    </td>
                  </tr>
                ) : (
                  filteredHistory.map((log, index) => (
                    <tr key={log.id || index} className="hover:bg-gray-50">
                      <td className="border border-gray-200 px-4 py-2">
                        <div>
                          <div className="font-medium">{log.user_name || 'Unknown'}</div>
                          <div className="text-sm text-gray-600">{log.user_email}</div>
                        </div>
                      </td>
                      <td className="border border-gray-200 px-4 py-2">
                        {getRoleBadge(log.user_role)}
                      </td>
                      {showIPAddresses && (
                        <td className="border border-gray-200 px-4 py-2 font-mono text-sm">
                          {log.ip_address || 'N/A'}
                        </td>
                      )}
                      <td className="border border-gray-200 px-4 py-2 text-sm">
                        {formatDate(log.login_time)}
                      </td>
                      <td className="border border-gray-200 px-4 py-2 text-sm">
                        {formatDate(log.last_activity)}
                      </td>
                      <td className="border border-gray-200 px-4 py-2">
                        {getStatusBadge(log.is_active)}
                      </td>
                      <td className="border border-gray-200 px-4 py-2 text-sm">
                        {formatDate(log.logout_time)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default LoginHistoryComponent;