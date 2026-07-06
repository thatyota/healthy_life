import { useState, useEffect } from "react";
import { View, Text, ActivityIndicator } from "react-native";
import { Redirect } from "expo-router";
import axios from "axios";

export default function AdminGuard({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const res = await axios.get("/api/admin/check");
      if (res.data?.isAdmin === true) {
        setIsLoggedIn(true);
        setIsAdmin(true);
      } else {
        setIsLoggedIn(true);
        setIsAdmin(false);
      }
    } catch (err: any) {
      if (err.response?.status === 401) {
        setIsLoggedIn(false);
      }
      setIsAdmin(false);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-[#F1F8E9]">
        <ActivityIndicator size="large" color="#3A6604" />
        <Text className="text-[#3A6604] mt-4 text-sm">A verificar permissoes...</Text>
      </View>
    );
  }

  if (!isLoggedIn) {
    return <Redirect href="/(auth)" />;
  }

  if (!isAdmin) {
    return <Redirect href="/(tabs)" />;
  }

  return <>{children}</>;
}