import { useState, useEffect, useRef, useCallback } from "react";

const API_URL = "https://healthy-life-sable.vercel.app/api";

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

  const searchUsers = useCallback(async (searchQuery: string) => {
    if (searchQuery.trim().length < 1) {
      setResults([]);
      setHasSearched(false);
      return;
    }

    setLoading(true);
    setHasSearched(true);

    try {
      const response = await fetch(
        `${API_URL}/users/search?q=${encodeURIComponent(searchQuery)}`
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      setResults(data.users || []);
    } catch (error) {
      console.error("Search error:", error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

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