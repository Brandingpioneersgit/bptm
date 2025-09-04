import React from "react";
import { AppProviders } from "@/app/AppProviders";
import AppRouter from "./components/Router";

export default function App() {
  return (
    <AppProviders>
      <AppRouter />
    </AppProviders>
  );
}
