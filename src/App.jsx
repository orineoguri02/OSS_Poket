import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { AuthProvider } from "./contexts/AuthContext";
import { PokemonProvider } from "./contexts/PokemonContext";
import Onboarding from "./components/Onboarding/Onboarding";
import Home from "./components/Home/Home";
import Detail from "./components/Detail/Detail";
import Login from "./components/Auth/Login";
import ProtectedRoute from "./components/Auth/ProtectedRoute";
import MyPokemonPage from "./components/MyPokemon/MyPokemonPage";
import Cart from "./components/Cart/Cart";

// Google OAuth Client ID (환경 변수에서 가져오거나 직접 설정)
// Vercel 배포 시 환경 변수로 설정: VITE_GOOGLE_CLIENT_ID
// 설정 방법: GOOGLE_AUTH_SETUP.md 참고
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

if (!GOOGLE_CLIENT_ID || GOOGLE_CLIENT_ID === "YOUR_GOOGLE_CLIENT_ID_HERE") {
  console.warn(
    "⚠️ Google OAuth Client ID가 설정되지 않았습니다.\n" +
      "GOOGLE_AUTH_SETUP.md 파일을 참고하여 설정해주세요.\n" +
      "현재는 더미 값으로 작동합니다."
  );
}

export default function App() {
  // clientId가 없을 때도 앱이 작동하도록 더미 값 사용
  const clientId = GOOGLE_CLIENT_ID || "dummy-client-id-for-development";

  return (
    <GoogleOAuthProvider clientId={clientId}>
      <AuthProvider>
        <PokemonProvider>
          <BrowserRouter>
            <Routes>
              {/* '/' 경로(온보딩)로 오면 Onboarding 컴포넌트를 보여줌 */}
              <Route path="/" element={<Onboarding />} />

              {/* '/login' 경로로 오면 Login 컴포넌트를 보여줌 */}
              <Route path="/login" element={<Login />} />

              {/* '/home' 경로로 오면 Home 컴포넌트를 보여줌 (로그인 필요) */}
              <Route
                path="/home"
                element={
                  <ProtectedRoute>
                    <Home />
                  </ProtectedRoute>
                }
              />

              {/* '/pokemon/숫자' 경로로 오면 Detail 컴포넌트를 보여줌 (로그인 필요)
                  :id는 변수처럼 동작해서, URL에 있는 숫자를 Detail 컴포넌트로 넘겨줍니다. */}
              <Route
                path="/pokemon/:id"
                element={
                  <ProtectedRoute>
                    <Detail />
                  </ProtectedRoute>
                }
              />

              {/* '/my-pokemon' 경로로 오면 MyPokemonPage 컴포넌트를 보여줌 (로그인 필요) */}
              <Route
                path="/my-pokemon"
                element={
                  <ProtectedRoute>
                    <MyPokemonPage />
                  </ProtectedRoute>
                }
              />

              {/* '/cart' 경로로 오면 Cart 컴포넌트를 보여줌 (로그인 필요) */}
              <Route
                path="/cart"
                element={
                  <ProtectedRoute>
                    <Cart />
                  </ProtectedRoute>
                }
              />
            </Routes>
          </BrowserRouter>
        </PokemonProvider>
      </AuthProvider>
    </GoogleOAuthProvider>
  );
}
