import React from "react";
import { AppProviders } from "@/app/AppProviders";
import { AppContent } from "./components/AppShell";

export default function App() {
  return (
    <AppProviders>
      <AppContent />
    </AppProviders>
  );
}
