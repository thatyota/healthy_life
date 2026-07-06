import React from "react";
import { Stack } from "expo-router";
import AdminGuard from "../../components/AdminGuard";

// =============================================================================
// Admin Layout
// =============================================================================
// Layout do grupo (admin) - protege todas as screens com AdminGuard
// Define as screens filhas para o Stack navigator
// =============================================================================

export default function AdminLayout() {
  return (
    <AdminGuard>
      <Stack>
        <Stack.Screen
          name="index"
          options={{
            title: "Painel Admin",
            headerStyle: { backgroundColor: "#3A6604" },
            headerTintColor: "#fff",
            headerTitleStyle: { fontWeight: "bold" },
          }}
        />
        <Stack.Screen
          name="users"
          options={{
            title: "Utilizadores",
            headerStyle: { backgroundColor: "#3A6604" },
            headerTintColor: "#fff",
          }}
        />
        <Stack.Screen
          name="posts"
          options={{
            title: "Publicacoes",
            headerStyle: { backgroundColor: "#3A6604" },
            headerTintColor: "#fff",
          }}
        />
        <Stack.Screen
          name="moderation"
          options={{
            title: "Moderacao",
            headerStyle: { backgroundColor: "#3A6604" },
            headerTintColor: "#fff",
          }}
        />
      </Stack>
    </AdminGuard>
  );
}