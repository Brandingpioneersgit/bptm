import React from "react";
import { SupabaseProvider } from "./components/SupabaseProvider";
import { ClientSyncProvider } from "./components/ClientSyncContext";
import { DataSyncProvider } from "./components/DataSyncContext";
import { AppContent } from "./components/AppShell";

export default function App() {
  return (
    <SupabaseProvider>
      <DataSyncProvider>
        <ClientSyncProvider>
          <AppContent />
        </ClientSyncProvider>
      </DataSyncProvider>
    </SupabaseProvider>
  );
}