import React, { Suspense, lazy } from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import "@/index.css";
import App from "@/App";
import { LiveContentProvider } from "@/lib/store";

// The admin panel loads only when someone opens /admin.
const AdminPage = lazy(() => import("@/pages/AdminPage"));
const PreviewPage = lazy(() => import("@/pages/PreviewPage"));

// GitHub Pages fallback: 404.html sends unknown paths here as ?p=/path — put the real path back.
const redirect = new URLSearchParams(window.location.search).get("p");
if (redirect) {
  const base = import.meta.env.BASE_URL.replace(/\/$/, "");
  window.history.replaceState(null, "", base + redirect);
}

const root = ReactDOM.createRoot(document.getElementById("root") as HTMLElement);
root.render(
  <React.StrictMode>
    <BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/$/, "") || "/"}>
      <Routes>
        <Route
          path="/"
          element={
            <LiveContentProvider>
              <App />
            </LiveContentProvider>
          }
        />
        <Route
          path="/admin"
          element={
            <Suspense fallback={<div className="min-h-screen bg-ink" />}>
              <AdminPage />
            </Suspense>
          }
        />
        <Route
          path="/admin-preview"
          element={
            <Suspense fallback={null}>
              <PreviewPage />
            </Suspense>
          }
        />
        <Route
          path="*"
          element={
            <LiveContentProvider>
              <App />
            </LiveContentProvider>
          }
        />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>,
);
