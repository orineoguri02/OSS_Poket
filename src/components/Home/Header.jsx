import React from "react";

export default function Header() {
  return (
    <header
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        height: "80px",
        backgroundColor: "transparent",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 20px",
        zIndex: 1000,
      }}
    >
      <img
        src="/image/logo.png"
        alt="Pokémon"
        style={{
          height: "100px",
          width: "60",
          objectFit: "contain",
        }}
      />
      <h1 style={{ color: "black", fontWeight: "bold" }}>Pokémon</h1>
      <img src="/image/cart.png" alt="장바구니" style={{ width: "150px", height: "150px", objectFit: "contain" }} />
    </header>
  );
}
