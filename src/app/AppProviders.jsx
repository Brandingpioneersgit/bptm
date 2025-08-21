import React from 'react';
import { SupabaseProvider } from '@/components/SupabaseProvider';
import { DataSyncProvider } from '@/components/DataSyncContext';
import { ClientSyncProvider } from '@/features/clients/context/ClientSyncContext';

export function AppProviders({ children }) {
  return (
    <SupabaseProvider>
      <DataSyncProvider>
        <ClientSyncProvider>
          {children}
        </ClientSyncProvider>
      </DataSyncProvider>
    </SupabaseProvider>
  );
}

