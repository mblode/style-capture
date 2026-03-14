import React from "react";
import { createRoot } from "react-dom/client";

import "@/index.css";
import { OptionsApp } from "@/options/options-app.tsx";

const mq = window.matchMedia("(prefers-color-scheme: dark)");
document.documentElement.classList.toggle("dark", mq.matches);
mq.addEventListener("change", (e) => {
  document.documentElement.classList.toggle("dark", e.matches);
});

const root = document.querySelector("#root");

if (!root) {
  throw new Error("Options root element not found.");
}

createRoot(root).render(
  <React.StrictMode>
    <OptionsApp />
  </React.StrictMode>
);
