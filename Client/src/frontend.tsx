/**
 * This file is the entry point for the React app, it sets up the root
 * element and renders the App component to the DOM.
 *
 * It is included in `src/index.html`.
 */

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";

const elem = document.getElementById("root")!;
const app = (
  <StrictMode>
    <App />
  </StrictMode>
);

// Safely handle hot module reloading in development, falling back to a standard mount in production
const root = import.meta.hot
  ? (import.meta.hot.data.root ??= createRoot(elem))
  : createRoot(elem);

root.render(app);
