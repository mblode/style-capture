import React from "react";
import { createRoot } from "react-dom/client";

import "@/index.css";
import { OptionsApp } from "@/options/options-app.tsx";

const root = document.getElementById("root");

if (!root) {
  throw new Error("Options root element not found.");
}

createRoot(root).render(
  <React.StrictMode>
    <OptionsApp />
  </React.StrictMode>
);
