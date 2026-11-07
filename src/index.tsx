// src/index.tsx
import "./i18n";
import React from "react";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import { store } from "./app/store";
import reportWebVitals from "./reportWebVitals";
import ContextProvider from "./app/context/ContextProvider";
import ThemeWrapper from "./app/ThemeWrapper";
import { installAdminAuth } from "./lib/adminAuth";
import "./css/admin-theme.css";
import "./css/global.css";

installAdminAuth();

const container = document.getElementById("root")!;
const root = createRoot(container);

root.render(
  <React.StrictMode>
    <Provider store={store}>
      <ContextProvider>
        <ThemeWrapper />
      </ContextProvider>
    </Provider>
  </React.StrictMode>
);

reportWebVitals();
