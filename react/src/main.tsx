import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import PCBuilderPage from "./PCBuilderPage";

const root = document.getElementById("pc-root");
if (root) {
  ReactDOM.createRoot(root).render(
    <React.StrictMode>
      <PCBuilderPage />
    </React.StrictMode>
  );
} else {
  const fallback = document.getElementById("root");
  if (fallback) {
    ReactDOM.createRoot(fallback).render(
      <React.StrictMode>
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
          <div className="max-w-5xl w-full">
            <PCBuilderPage />
          </div>
        </div>
      </React.StrictMode>
    );
  }
}