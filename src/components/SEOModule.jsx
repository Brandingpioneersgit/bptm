/**
 * SEO Module Main Component
 * Central router and container for all SEO functionality
 */

import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart3, 
  Users, 
  Award, 
  Settings, 
  TrendingUp,
  User,
  Shield
} from 'lucide-react';

// Import SEO components
import SEOEmployeeDashboard from './SEOEmployeeDashboard';
import SEOTeamDashboard from './SEOTeamDashboard';
import SEOAppraisalSystem from './SEOAppraisalSystem';
import { 
  useSEOPermissions, 
  SEOModuleGuard, 
  SEOPermissionGuard,
  SEOAccessDenied,
  getSEORoleDisplayName
} from './SEORoleBasedAccess';
import { useUnifiedAuth } from '@/features/auth/UnifiedAuthContext';

const SEOModule = () => {
  return (
    <SEOModuleGuard>
      <SEOModuleContent />
    </SEOModuleGuard>
  );
};

const SEOModuleContent = () => {
  const { user, role } = useUnifiedAuth();
  const { 
    userRole, 
    isSEOUser, 
    hasPermission, 
    SEO_PERMISSIONS,
    SEO_ROLES 
  } = useSEOPermissions();
  
  const [activeTab, setActiveTab] = useState('dashboard');

  // Determine default tab based on role
  React.useEffect(() => {
    if (userRole === SEO_ROLES.ADMIN) {
      setActiveTab('team-dashboard');
    } else if (userRole === SEO_ROLES.TEAM_LEAD) {
      setActiveTab('team-dashboard');
    } else {
      setActiveTab('dashboard');
    }
  }, [userRole]);

  const getAvailableTabs = () => {
    const tabs = [];
    
    // Employee Dashboard - available to all SEO users
    if (hasPermission(SEO_PERMISSIONS.VIEW_EMPLOYEE_DASHBOARD)) {
      tabs.push({
        id: 'dashboard',
        label: 'My Dashboard',
        icon: BarChart3,
        component: SEOEmployeeDashboard
      });
    }
    
    // Team Dashboard - available to TL and Admin
    if (hasPermission(SEO_PERMISSIONS.VIEW_TEAM_DASHBOARD)) {
      tabs.push({
        id: 'team-dashboard',
        label: 'Team Dashboard',
        icon: Users,
        component: SEOTeamDashboard
      });
    }
    
    // Appraisal System - available to TL and Admin
    if (hasPermission(SEO_PERMISSIONS.VIEW_APPRAISALS)) {
      tabs.push({
        id: 'appraisals',
        label: 'Appraisals',
        icon: Award,
        component: SEOAppraisalSystem
      });
    }
    
    return tabs;
  };

  const availableTabs = getAvailableTabs();

  return (
    <SEODepartmentGuard>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">SEO Performance Management</h1>
            <p className="text-muted-foreground">
              Comprehensive SEO performance tracking and management system
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-sm font-medium">{authState.user?.name}</div>
              <div className="text-xs text-muted-foreground">
                {getSEORoleDisplayName(userRole)}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <Badge variant="outline">
                {getSEORoleDisplayName(userRole)}
              </Badge>
            </div>
          </div>
        </div>

        {/* Role-based Welcome Message */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Shield className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-medium">
                  Welcome to the SEO Module, {getSEORoleDisplayName(userRole)}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {userRole === SEO_ROLES.ADMIN && "You have full administrative access to all SEO features and data."}
                  {userRole === SEO_ROLES.TEAM_LEAD && "You can manage your team's performance, review submissions, and conduct appraisals."}
                  {userRole === SEO_ROLES.EMPLOYEE && "Track your performance, submit monthly data, and view your progress over time."}
                  {userRole === SEO_ROLES.MENTOR && "You can add mentor scores and provide guidance to team members."}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Navigation Tabs */}
        {availableTabs.length > 0 ? (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList className="grid w-full" style={{ gridTemplateColumns: `repeat(${availableTabs.length}, 1fr)` }}>
              {availableTabs.map((tab) => {
                const IconComponent = tab.icon;
                return (
                  <TabsTrigger key={tab.id} value={tab.id} className="flex items-center gap-2">
                    <IconComponent className="h-4 w-4" />
                    {tab.label}
                  </TabsTrigger>
                );
              })}
            </TabsList>

            {availableTabs.map((tab) => {
              const ComponentToRender = tab.component;
              return (
                <TabsContent key={tab.id} value={tab.id} className="space-y-4">
                  {tab.id === 'appraisals' ? (
                    <SEOModuleGuard requireManagerAccess={true}>
                      <ComponentToRender />
                    </SEOModuleGuard>
                  ) : (
                    <ComponentToRender />
                  )}
                </TabsContent>
              );
            })}
          </Tabs>
        ) : (
          <SEOAccessDenied 
            message="No SEO features are available for your current role. Please contact your administrator."
          />
        )}

        {/* Quick Stats Footer */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                <span>SEO Performance Management System v1.0</span>
              </div>
              <div className="flex items-center gap-4">
                <span>Role: {getSEORoleDisplayName(userRole)}</span>
                <span>Department: SEO</span>
                <span>Access Level: {userRole === SEO_ROLES.ADMIN ? 'Full' : userRole === SEO_ROLES.TEAM_LEAD ? 'Team' : 'Individual'}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
    </SEODepartmentGuard>
  );
};

export default SEOModule;
export { SEOModuleContent };