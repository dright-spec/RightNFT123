import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { patchLongForHedera } from "./lib/hedera-long-patch";

// Patch Long.js for Hedera SDK browser compatibility
// This must happen before any Hedera SDK imports
patchLongForHedera();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
