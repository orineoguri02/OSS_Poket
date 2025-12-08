import React from "react";
import { useGoogleLogin } from "@react-oauth/google";
import { useAuth } from "../../contexts/AuthContext";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleGoogleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        // Google 사용자 정보 가져오기
        const userInfoResponse = await fetch(
          "https://www.googleapis.com/oauth2/v3/userinfo",
          {
            headers: {
              Authorization: `Bearer ${tokenResponse.access_token}`,
            },
          }
        );

        if (!userInfoResponse.ok) {
          throw new Error("사용자 정보를 가져올 수 없습니다.");
        }

        const userData = await userInfoResponse.json();

        // 사용자 정보 저장
        const user = {
          id: userData.sub,
          name: userData.name,
          email: userData.email,
          picture: userData.picture,
          accessToken: tokenResponse.access_token,
        };

        login(user);
        navigate("/home");
      } catch (error) {
        console.error("로그인 실패:", error);
        alert("로그인에 실패했습니다. 다시 시도해주세요.");
      }
    },
    onError: () => {
      console.error("Google 로그인 실패");
      alert("Google 로그인에 실패했습니다.");
    },
  });

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        padding: "20px",
      }}
    >
      <div
        style={{
          backgroundColor: "rgba(255, 255, 255, 0.95)",
          borderRadius: "24px",
          padding: "48px 32px",
          boxShadow: "0 20px 60px rgba(0, 0, 0, 0.3)",
          maxWidth: "400px",
          width: "100%",
          textAlign: "center",
        }}
      >
        <div
          style={{
            marginBottom: "32px",
          }}
        >
          <img
            src="/image/pokeball.svg"
            alt="Pokeball"
            style={{
              width: "80px",
              height: "80px",
              marginBottom: "24px",
            }}
          />
          <h1
            style={{
              margin: "0 0 8px 0",
              fontSize: "32px",
              fontWeight: "bold",
              color: "#1a1a1a",
            }}
          >
            포켓몬 도감
          </h1>
          <p
            style={{
              margin: 0,
              color: "#666",
              fontSize: "16px",
            }}
          >
            나만의 포켓몬 컬렉션을 시작하세요
          </p>
        </div>

        {!import.meta.env.VITE_GOOGLE_CLIENT_ID && (
          <div
            style={{
              padding: "12px",
              backgroundColor: "#fef3c7",
              border: "1px solid #f59e0b",
              borderRadius: "12px",
              marginBottom: "16px",
              fontSize: "14px",
              color: "#92400e",
            }}
          >
            ⚠️ Google OAuth Client ID가 설정되지 않았습니다.
            <br />
            <span style={{ fontSize: "12px" }}>
              GOOGLE_AUTH_SETUP.md 파일을 참고하여 설정해주세요.
            </span>
          </div>
        )}
        <button
          onClick={handleGoogleLogin}
          disabled={!import.meta.env.VITE_GOOGLE_CLIENT_ID}
          style={{
            width: "100%",
            padding: "14px 24px",
            backgroundColor: !import.meta.env.VITE_GOOGLE_CLIENT_ID
              ? "#e5e7eb"
              : "#fff",
            color: !import.meta.env.VITE_GOOGLE_CLIENT_ID
              ? "#9ca3af"
              : "#1a1a1a",
            border: "1px solid #dadce0",
            borderRadius: "24px",
            fontSize: "16px",
            fontWeight: "500",
            cursor: !import.meta.env.VITE_GOOGLE_CLIENT_ID
              ? "not-allowed"
              : "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "12px",
            boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
            transition: "all 0.2s",
            opacity: !import.meta.env.VITE_GOOGLE_CLIENT_ID ? 0.6 : 1,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.boxShadow = "0 4px 8px rgba(0, 0, 0, 0.15)";
            e.currentTarget.style.transform = "translateY(-2px)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow = "0 2px 4px rgba(0, 0, 0, 0.1)";
            e.currentTarget.style.transform = "translateY(0)";
          }}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            style={{ flexShrink: 0 }}
          >
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          Google로 로그인
        </button>

        <p
          style={{
            marginTop: "24px",
            fontSize: "12px",
            color: "#999",
            lineHeight: "1.5",
          }}
        >
          로그인하면 나만의 포켓몬 컬렉션을
          <br />
          저장하고 관리할 수 있습니다
        </p>
      </div>
    </div>
  );
}
