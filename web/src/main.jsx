import React from "react";
import ReactDOM from "react-dom/client";
import { Toaster } from "react-hot-toast";
import AppShell from "./AppShell";
import "./styles.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 3000,
        style: {
          borderRadius: "14px",
          background: "#132238",
          color: "#ffffff"
        },
        success: {
          style: {
            background: "#0b8c7d"
          }
        },
        error: {
          style: {
            background: "#8e2020"
          }
        }
      }}
    />
    <AppShell />
  </React.StrictMode>
);
