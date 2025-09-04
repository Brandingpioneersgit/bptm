import React from 'react';
import { SupabaseProvider } from '@/components/SupabaseProvider';
import { DataSyncProvider } from '@/components/DataSyncContext';
import { EmployeeSyncProvider } from '@/features/employees/context/EmployeeSyncContext';
import { UnifiedAuthProvider } from '../features/auth/UnifiedAuthContext';
import { CrossDashboardSyncProvider } from '@/components/CrossDashboardSync';
import { RBACProvider } from '@/components/useRBAC';
import { NotificationProvider } from '@/components/NotificationSystem';
import { AuditProvider } from '@/components/AuditLogging';
import { ThemeProvider } from '@/shared/context/ThemeContext';
import { GlobalErrorProvider } from '@/shared/components/GlobalErrorHandler';

export function AppProviders({ children }) {
  return (
    <SupabaseProvider>
      <DataSyncProvider>
        <EmployeeSyncProvider>
          <UnifiedAuthProvider>
            <CrossDashboardSyncProvider>
              <RBACProvider>
                <NotificationProvider>
                  <AuditProvider>
                    <ThemeProvider>
                      <GlobalErrorProvider>
                        {children}
                      </GlobalErrorProvider>
                    </ThemeProvider>
                  </AuditProvider>
                </NotificationProvider>
              </RBACProvider>
            </CrossDashboardSyncProvider>
          </UnifiedAuthProvider>
        </EmployeeSyncProvider>
      </DataSyncProvider>
    </SupabaseProvider>
  );
}

