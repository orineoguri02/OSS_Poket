import React from "react";
import Header from "../Home/Header";

export default function Cart() {
  return (
    <div
      style={{
        padding: "20px 10px",
        backgroundColor: "#f0f2f5",
        minHeight: "100vh",
        width: "100vw",
        boxSizing: "border-box",
        paddingTop: "100px",
      }}
    >
      <Header />
      
      <div
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          padding: "20px",
        }}
      >
        <h1 style={{ color: "#333", marginBottom: "30px" }}>장바구니</h1>
        
        <div
          style={{
            backgroundColor: "white",
            borderRadius: "15px",
            padding: "30px",
            boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
          }}
        >
          <p style={{ color: "#666", textAlign: "center" }}>
            장바구니가 비어있습니다.
          </p>
        </div>
      </div>
    </div>
  );
}

