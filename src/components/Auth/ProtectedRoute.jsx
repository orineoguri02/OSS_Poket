import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        }}
      >
        <div style={{ textAlign: "center", color: "white" }}>
          <div
            style={{
              width: "60px",
              height: "60px",
              margin: "0 auto",
              animation: "spin 1s linear infinite",
            }}
          >
            <img
              src="/image/pokeball.svg"
              alt="Loading"
              style={{
                width: "100%",
                height: "100%",
              }}
            />
          </div>
          <p style={{ marginTop: "16px" }}>로딩 중...</p>
          <style>
            {`
              @keyframes spin {
                from { transform: rotate(0deg); }
                to { transform: rotate(360deg); }
              }
            `}
          </style>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
