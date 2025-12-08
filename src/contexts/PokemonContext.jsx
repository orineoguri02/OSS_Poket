import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { useAuth } from "./AuthContext";

const PokemonContext = createContext(null);

export function PokemonProvider({ children }) {
  const { user } = useAuth();
  const [myPokemon, setMyPokemon] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // API 기본 URL (개발 환경에서는 로컬, 프로덕션에서는 Vercel 도메인)
  const API_BASE_URL = import.meta.env.VITE_API_URL || "/api";

  // 사용자의 포켓몬 목록 조회
  const fetchMyPokemon = useCallback(async () => {
    if (!user?.id) {
      setMyPokemon([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/pokemon?userId=${user.id}`);

      if (!response.ok) {
        throw new Error("포켓몬 목록을 불러올 수 없습니다.");
      }

      const data = await response.json();
      const pokemonIds = data.pokemon?.map((p) => p.pokemon_id) || [];
      setMyPokemon(pokemonIds);
    } catch (err) {
      console.error("포켓몬 목록 조회 실패:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user?.id, API_BASE_URL]);

  // 포켓몬 추가
  const addPokemon = useCallback(
    async (pokemonId) => {
      if (!user?.id) {
        throw new Error("로그인이 필요합니다.");
      }

      if (myPokemon.includes(pokemonId)) {
        return { success: true, message: "이미 저장된 포켓몬입니다." };
      }

      setLoading(true);
      setError(null);

      try {
        console.log("포켓몬 추가 요청:", {
          url: `${API_BASE_URL}/pokemon?userId=${user.id}`,
          pokemonId: Number(pokemonId),
          userId: user.id,
        });

        const response = await fetch(
          `${API_BASE_URL}/pokemon?userId=${user.id}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              pokemonId: Number(pokemonId),
              email: user.email,
              name: user.name,
              picture: user.picture,
            }),
          }
        );

        console.log("API 응답:", {
          status: response.status,
          statusText: response.statusText,
          ok: response.ok,
        });

        if (!response.ok) {
          let errorData;
          try {
            const text = await response.text();
            console.error("에러 응답 본문:", text);
            errorData = text ? JSON.parse(text) : {};
          } catch (parseError) {
            console.error("응답 파싱 실패:", parseError);
            errorData = {
              error: `HTTP ${response.status}: ${response.statusText}`,
            };
          }

          const errorMessage =
            errorData.error ||
            errorData.details ||
            `포켓몬 추가에 실패했습니다. (${response.status})`;
          const hint = errorData.hint ? `\n💡 ${errorData.hint}` : "";
          throw new Error(errorMessage + hint);
        }

        const data = await response.json();
        console.log("포켓몬 추가 성공:", data);
        setMyPokemon((prev) => [...prev, pokemonId]);
        return {
          success: true,
          message: data.message || "포켓몬이 추가되었습니다.",
        };
      } catch (err) {
        console.error("포켓몬 추가 실패:", err);
        console.error("에러 상세:", {
          message: err.message,
          stack: err.stack,
          name: err.name,
        });
        setError(err.message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [user, myPokemon, API_BASE_URL]
  );

  // 포켓몬 삭제
  const removePokemon = useCallback(
    async (pokemonId) => {
      if (!user?.id) {
        throw new Error("로그인이 필요합니다.");
      }

      setLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `${API_BASE_URL}/pokemon?userId=${user.id}&pokemonId=${pokemonId}`,
          {
            method: "DELETE",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ pokemonId: Number(pokemonId) }),
          }
        );

        if (!response.ok) {
          let errorData;
          try {
            const text = await response.text();
            errorData = text ? JSON.parse(text) : {};
          } catch (parseError) {
            console.error("응답 파싱 실패:", parseError);
            errorData = {
              error: `포켓몬 삭제에 실패했습니다. (${response.status} ${response.statusText})`,
            };
          }
          throw new Error(errorData.error || "포켓몬 삭제에 실패했습니다.");
        }

        setMyPokemon((prev) => prev.filter((id) => id !== pokemonId));
        return { success: true, message: "포켓몬이 삭제되었습니다." };
      } catch (err) {
        console.error("포켓몬 삭제 실패:", err);
        setError(err.message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [user?.id, API_BASE_URL]
  );

  // 포켓몬이 저장되어 있는지 확인
  const isPokemonSaved = useCallback(
    (pokemonId) => {
      return myPokemon.includes(Number(pokemonId));
    },
    [myPokemon]
  );

  // 사용자가 로그인하면 자동으로 포켓몬 목록 조회
  useEffect(() => {
    if (user?.id) {
      fetchMyPokemon();
    } else {
      setMyPokemon([]);
    }
  }, [user?.id, fetchMyPokemon]);

  const value = {
    myPokemon,
    loading,
    error,
    addPokemon,
    removePokemon,
    isPokemonSaved,
    refreshPokemon: fetchMyPokemon,
  };

  return (
    <PokemonContext.Provider value={value}>{children}</PokemonContext.Provider>
  );
}

export function usePokemon() {
  const context = useContext(PokemonContext);
  if (!context) {
    throw new Error("usePokemon must be used within a PokemonProvider");
  }
  return context;
}
