import React, { useState } from "react";

export default function SearchAndFilter({ onSearchChange, onFilterChange }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterSavedOnly, setFilterSavedOnly] = useState(false);

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    onSearchChange(value);
  };

  const handleFilterToggle = () => {
    const newValue = !filterSavedOnly;
    setFilterSavedOnly(newValue);
    onFilterChange(newValue);
  };

  const handleClearSearch = () => {
    setSearchQuery("");
    onSearchChange("");
  };

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "12px",
        flex: 1,
        maxWidth: "600px",
        margin: "0 auto",
      }}
    >
      {/* 검색 입력 필드 */}
      <div
        style={{
          position: "relative",
          flex: 1,
          display: "flex",
          alignItems: "center",
        }}
      >
        <input
          type="text"
          placeholder="포켓몬 이름 또는 번호로 검색..."
          value={searchQuery}
          onChange={handleSearchChange}
          style={{
            width: "100%",
            padding: "10px 40px 10px 16px",
            borderRadius: "25px",
            border: "2px solid #e0e0e0",
            fontSize: "14px",
            outline: "none",
            transition: "all 0.2s",
            backgroundColor: "white",
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = "#3b82f6";
            e.currentTarget.style.boxShadow = "0 0 0 3px rgba(59, 130, 246, 0.1)";
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = "#e0e0e0";
            e.currentTarget.style.boxShadow = "none";
          }}
        />
        {searchQuery && (
          <button
            onClick={handleClearSearch}
            style={{
              position: "absolute",
              right: "8px",
              background: "none",
              border: "none",
              cursor: "pointer",
              fontSize: "18px",
              color: "#999",
              padding: "4px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: "50%",
              width: "24px",
              height: "24px",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#f0f0f0";
              e.currentTarget.style.color = "#333";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "transparent";
              e.currentTarget.style.color = "#999";
            }}
            title="검색어 지우기"
          >
            ×
          </button>
        )}
      </div>

      {/* 저장된 포켓몬만 보기 필터 */}
      <button
        onClick={handleFilterToggle}
        style={{
          padding: "10px 16px",
          borderRadius: "25px",
          border: `2px solid ${filterSavedOnly ? "#3b82f6" : "#e0e0e0"}`,
          backgroundColor: filterSavedOnly ? "#3b82f6" : "white",
          color: filterSavedOnly ? "white" : "#666",
          fontSize: "14px",
          fontWeight: "600",
          cursor: "pointer",
          transition: "all 0.2s",
          whiteSpace: "nowrap",
          display: "flex",
          alignItems: "center",
          gap: "6px",
        }}
        onMouseEnter={(e) => {
          if (!filterSavedOnly) {
            e.currentTarget.style.borderColor = "#3b82f6";
            e.currentTarget.style.color = "#3b82f6";
          }
        }}
        onMouseLeave={(e) => {
          if (!filterSavedOnly) {
            e.currentTarget.style.borderColor = "#e0e0e0";
            e.currentTarget.style.color = "#666";
          }
        }}
        title={filterSavedOnly ? "모든 포켓몬 보기" : "저장된 포켓몬만 보기"}
      >
        <span>{filterSavedOnly ? "✓" : "○"}</span>
        <span>저장된 것만</span>
      </button>
    </div>
  );
}

