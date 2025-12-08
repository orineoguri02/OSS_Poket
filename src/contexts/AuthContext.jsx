import React, { createContext, useContext, useState } from "react";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // localStorage를 먼저 읽어서 초기 상태로 설정 (깜빡임 방지)
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem("pokemon_user");
    if (savedUser) {
      try {
        return JSON.parse(savedUser);
      } catch (error) {
        console.error("사용자 정보 복원 실패:", error);
        localStorage.removeItem("pokemon_user");
        return null;
      }
    }
    return null;
  });
  const [loading, setLoading] = useState(false); // 동기 작업이므로 false로 시작

  // 더 이상 useEffect 필요 없음 - 초기화 시 바로 처리

  const login = (userData) => {
    setUser(userData);
    localStorage.setItem("pokemon_user", JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("pokemon_user");
  };

  const value = {
    user,
    login,
    logout,
    loading,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
