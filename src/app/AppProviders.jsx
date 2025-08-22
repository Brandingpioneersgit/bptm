import React from 'react';
import { SupabaseProvider } from '@/components/SupabaseProvider';
import { DataSyncProvider } from '@/components/DataSyncContext';
import { ClientSyncProvider } from '@/features/clients/context/ClientSyncContext';
import { EmployeeSyncProvider } from '@/features/employees/context/EmployeeSyncContext';

export function AppProviders({ children }) {
  return (
    <SupabaseProvider>
      <DataSyncProvider>
        <ClientSyncProvider>
          <EmployeeSyncProvider>
            {children}
          </EmployeeSyncProvider>
        </ClientSyncProvider>
      </DataSyncProvider>
    </SupabaseProvider>
  );
}

