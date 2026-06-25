import { useState, useEffect, useRef, useCallback } from "react";
import { useApiClient } from "@/utils/api";

interface UserResult {
  _id: string;
  Username: string;
  FirstName: string;
  LastName: string;
  ProfilePicture: string;
  bio: string;
  Followers: string[];
}

export function useSearchUsers() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<UserResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const api = useApiClient(); // ← Usa axios com token

  const searchUsers = useCallback(
    async (searchQuery: string) => {
      if (searchQuery.trim().length < 1) {
        setResults([]);
        setHasSearched(false);
        return;
      }

      setLoading(true);
      setHasSearched(true);

      try {
        console.log("🔍 Pesquisando:", searchQuery);
        const response = await api.get(`/users/search?q=${encodeURIComponent(searchQuery)}`);
        console.log("✅ Resultados:", response.data.users?.length || 0);
        setResults(response.data.users || []);
      } catch (error: any) {
        console.error("❌ Search error:", error.message);
        console.error("   Status:", error.response?.status);
        console.error("   Data:", error.response?.data);
        setResults([]);
      } finally {
        setLoading(false);
      }
    },
    [api]
  );

  const handleSearch = useCallback(
    (text: string) => {
      setQuery(text);

      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }

      debounceRef.current = setTimeout(() => {
        searchUsers(text);
      }, 300);
    },
    [searchUsers]
  );

  const clearSearch = useCallback(() => {
    setQuery("");
    setResults([]);
    setHasSearched(false);
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
  }, []);

  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  return {
    query,
    results,
    loading,
    hasSearched,
    handleSearch,
    clearSearch,
    setQuery,
  };
}