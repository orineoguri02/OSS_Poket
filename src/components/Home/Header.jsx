import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import SearchAndFilter from "./SearchAndFilter";

export default function Header({ onSearchChange, onFilterChange }) {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

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
      <SearchAndFilter
        onSearchChange={onSearchChange}
        onFilterChange={onFilterChange}
      />
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <Link to="/cart" style={{ cursor: "pointer" }}>
          <img
            src="/image/cart.png"
            alt="장바구니"
            style={{ width: "150px", height: "150px", objectFit: "contain" }}
          />
        </Link>
        <button
          onClick={handleLogout}
          style={{
            padding: "8px 16px",
            backgroundColor: "#dc2626",
            color: "#fff",
            border: "none",
            borderRadius: "20px",
            fontSize: "14px",
            fontWeight: "600",
            cursor: "pointer",
            boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
            transition: "all 0.2s",
            display: "flex",
            alignItems: "center",
            gap: "6px",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "#b91c1c";
            e.currentTarget.style.transform = "translateY(-1px)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "#dc2626";
            e.currentTarget.style.transform = "translateY(0)";
          }}
        >
          <span>🚪</span>
          <span>로그아웃</span>
        </button>
      </div>
    </header>
  );
}
