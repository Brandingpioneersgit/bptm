import React, { useState } from 'react';
import { useToast } from '@/shared/components/Toast';
import { useCrossDashboardSync } from './CrossDashboardSync';
import { useRBAC } from './useRBAC';

export const RoleBasedAccessControl = () => {
  const { 
    roles, 
    users, 
    updateUserRole, 
    toggleUserStatus, 
    addUser, 
    removeUser, 
    updateRole 
  } = useRBAC();
  const { notify } = useCrossDashboardSync();
  const { showToast } = useToast();
  
  const [activeTab, setActiveTab] = useState('users');
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedRole, setSelectedRole] = useState(null);
  const [showAddUser, setShowAddUser] = useState(false);
  const [newUser, setNewUser] = useState({ name: '', email: '', role: 'employee' });

  const handleUserRoleChange = (userId, newRole) => {
    updateUserRole(userId, newRole);
    notify('User role updated', `User role has been changed to ${newRole}`, 'info');
    showToast('User role updated successfully', 'success');
  };

  const handleUserStatusToggle = (userId) => {
    toggleUserStatus(userId);
    const user = users.find(u => u.id === userId);
    notify('User status changed', `${user.name} has been ${user.active ? 'deactivated' : 'activated'}`, 'info');
    showToast('User status updated successfully', 'success');
  };

  const handleAddUser = () => {
    if (!newUser.name || !newUser.email) {
      showToast('Please fill in all required fields', 'error');
      return;
    }
    
    addUser(newUser);
    setNewUser({ name: '', email: '', role: 'employee' });
    setShowAddUser(false);
    notify('New user added', `${newUser.name} has been added to the system`, 'success');
    showToast('User added successfully', 'success');
  };

  const handleRemoveUser = (userId) => {
    const user = users.find(u => u.id === userId);
    if (window.confirm(`Are you sure you want to remove ${user.name}?`)) {
      removeUser(userId);
      notify('User removed', `${user.name} has been removed from the system`, 'warning');
      showToast('User removed successfully', 'success');
    }
  };

  const tabs = [
    { id: 'users', label: 'User Management', icon: '👥' },
    { id: 'roles', label: 'Role Management', icon: '🔐' },
    { id: 'permissions', label: 'Permissions', icon: '⚡' }
  ];

  const renderUserManagement = () => (
    <div className="space-y-6">
      {/* Add User Button */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">System Users</h3>
        <button
          onClick={() => setShowAddUser(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Add New User
        </button>
      </div>
      
      {/* Add User Modal */}
      {showAddUser && (
        <div className="bg-gray-50 rounded-lg p-6 border">
          <h4 className="text-lg font-medium text-gray-900 mb-4">Add New User</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <input
              type="text"
              placeholder="Full Name"
              value={newUser.name}
              onChange={(e) => setNewUser(prev => ({ ...prev, name: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <input
              type="email"
              placeholder="Email Address"
              value={newUser.email}
              onChange={(e) => setNewUser(prev => ({ ...prev, email: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <select
              value={newUser.role}
              onChange={(e) => setNewUser(prev => ({ ...prev, role: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {Object.entries(roles).map(([roleId, role]) => (
                <option key={roleId} value={roleId}>{role.name}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleAddUser}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Add User
            </button>
            <button
              onClick={() => setShowAddUser(false)}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
      
      {/* Users Table */}
      <div className="bg-white rounded-lg border overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.map((user) => (
              <tr key={user.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-medium text-gray-900">{user.name}</div>
                    <div className="text-sm text-gray-500">{user.email}</div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <select
                    value={user.role}
                    onChange={(e) => handleUserRoleChange(user.id, e.target.value)}
                    className="text-sm border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {Object.entries(roles).map(([roleId, role]) => (
                      <option key={roleId} value={roleId}>{role.name}</option>
                    ))}
                  </select>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    user.active 
                      ? 'bg-gray-100 text-gray-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {user.active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                  <button
                    onClick={() => handleUserStatusToggle(user.id)}
                    className={`px-3 py-1 rounded text-xs ${
                      user.active 
                        ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {user.active ? 'Deactivate' : 'Activate'}
                  </button>
                  <button
                    onClick={() => handleRemoveUser(user.id)}
                    className="px-3 py-1 bg-gray-100 text-gray-700 rounded text-xs hover:bg-gray-200"
                  >
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderRoleManagement = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">Role Definitions</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Object.entries(roles).map(([roleId, role]) => (
          <div key={roleId} className="bg-white rounded-lg border p-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-medium text-gray-900">{role.name}</h4>
              <span className="text-sm text-gray-500">({users.filter(u => u.role === roleId).length} users)</span>
            </div>
            
            <p className="text-sm text-gray-600 mb-4">{role.description}</p>
            
            <div className="space-y-3">
              <div>
                <h5 className="text-sm font-medium text-gray-700 mb-2">Dashboard Access</h5>
                <div className="flex flex-wrap gap-1">
                  {role.dashboardAccess.map(dashboard => (
                    <span key={dashboard} className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                      {dashboard}
                    </span>
                  ))}
                </div>
              </div>
              
              <div>
                <h5 className="text-sm font-medium text-gray-700 mb-2">Features</h5>
                <div className="space-y-1">
                  {Object.entries(role.features).map(([feature, enabled]) => (
                    <div key={feature} className="flex items-center justify-between text-xs">
                      <span className="text-gray-600 capitalize">{feature.replace(/([A-Z])/g, ' $1').trim()}</span>
                      <span className={enabled ? 'text-green-600' : 'text-red-600'}>
                        {enabled ? '✓' : '✗'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderPermissions = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">Permission Matrix</h3>
      
      <div className="bg-white rounded-lg border overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Manager</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Employee</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Agency</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Intern</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">System</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {Object.entries(roles).map(([roleId, role]) => (
              <tr key={roleId}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {role.name}
                </td>
                {['manager', 'employee', 'agency', 'intern', 'system'].map(dashboard => (
                  <td key={dashboard} className="px-6 py-4 whitespace-nowrap text-center">
                    <div className="flex justify-center space-x-1">
                      {['read', 'write', 'delete', 'configure'].map(permission => (
                        <span
                          key={permission}
                          className={`w-2 h-2 rounded-full ${
                            role.permissions[dashboard]?.includes(permission)
                              ? 'bg-blue-500'
                              : 'bg-gray-200'
                          }`}
                          title={`${permission} ${role.permissions[dashboard]?.includes(permission) ? 'allowed' : 'denied'}`}
                        ></span>
                      ))}
                    </div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        
        <div className="px-6 py-3 bg-gray-50 text-xs text-gray-500">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1">
              <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
              <span>Allowed</span>
            </div>
            <div className="flex items-center space-x-1">
              <span className="w-2 h-2 bg-gray-200 rounded-full"></span>
              <span>Denied</span>
            </div>
            <span>Permissions: Read • Write • Delete • Configure</span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="bg-white rounded-xl shadow-sm border">
      {/* Header */}
      <div className="border-b border-gray-200 p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              🔐 Role-Based Access Control
            </h2>
            <p className="text-gray-600 mt-1">Manage user roles, permissions, and dashboard access</p>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="text-sm text-gray-600">
              {users.filter(u => u.active).length} active users
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8 px-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <span className="flex items-center gap-2">
                {tab.icon} {tab.label}
              </span>
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <div className="p-6">
        {activeTab === 'users' && renderUserManagement()}
        {activeTab === 'roles' && renderRoleManagement()}
        {activeTab === 'permissions' && renderPermissions()}
      </div>
    </div>
  );
};

export default RoleBasedAccessControl;