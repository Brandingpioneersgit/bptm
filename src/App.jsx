import React from "react";
import { SupabaseProvider } from "./components/SupabaseProvider";
import { AppContent } from "./components/AppShell";

export default function App() {
  return (
    <SupabaseProvider>
      <AppContent />
    </SupabaseProvider>
  );
}