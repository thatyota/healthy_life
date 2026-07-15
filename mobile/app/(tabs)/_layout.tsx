import { Tabs, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  View, TouchableOpacity, StyleSheet, Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@clerk/clerk-expo";
import { useApiClient } from "../../utils/api";
import { useTheme } from "../context/ThemeContext";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// =============================================================================
// Tabs Layout — Bottom Navigation Bar
// =============================================================================
// Tabs: Home | Search | [+] | Notifications | Profile
//
// O botao [+] e um circulo verde flutuante CENTRALIZADO para criar posts.
// O tab Admin foi REMOVIDO da barra — so acessivel por link direto.
//
// Sem nomes nos tabs — so icones.
// =============================================================================

export default function TabLayout() {
  const router = useRouter();
  const { isSignedIn } = useAuth();
  const api = useApiClient();
  const { darkMode } = useTheme();
  const insets = useSafeAreaInsets();

  // Cores do tema — SUAVES (mesmo do profile)
  const theme = {
    bg: darkMode ? "#0f1f0f" : "#FFFFFF",
    active: darkMode ? "#a3d977" : "#3A6604",
    inactive: darkMode ? "#5a7a4a" : "#8E8E8E",
    border: darkMode ? "#2a4a2a" : "#E0E0E0",
    circleBg: "#3A6604",
    circleIcon: "#FFFFFF",
  };

  /**
   * Botao customizado para o tab "create" (circulo verde flutuante)
   */
  const CreateButton = ({ onPress, accessibilityState }: any) => {
    const focused = accessibilityState?.selected;
    return (
      <TouchableOpacity
        onPress={onPress}
        style={styles.createButton}
        activeOpacity={0.8}
      >
        <View
          style={[
            styles.createButtonInner,
            { backgroundColor: focused ? "#2E7D32" : theme.circleBg },
          ]}
        >
          <Ionicons name="add" size={28} color={theme.circleIcon} />
        </View>
      </TouchableOpacity>
    );
  };

  // Altura do tab bar com safe area
  const tabBarHeight = Platform.OS === "ios" ? 75 + insets.bottom : 55 + insets.bottom;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarActiveTintColor: theme.active,
        tabBarInactiveTintColor: theme.inactive,
        tabBarStyle: {
          backgroundColor: theme.bg,
          borderTopWidth: 1,
          borderTopColor: theme.border,
          height: tabBarHeight,
          paddingBottom: insets.bottom > 0 ? insets.bottom : 8,
          paddingTop: 8,
          paddingHorizontal: 8,
        },
        tabBarItemStyle: {
          justifyContent: "center",
          alignItems: "center",
        },
      }}
    >
      {/* Tab 1: Home */}
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? "home" : "home-outline"}
              size={size}
              color={color}
            />
          ),
        }}
      />

      {/* Tab 2: Search */}
      <Tabs.Screen
        name="search"
        options={{
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? "search" : "search-outline"}
              size={size}
              color={color}
            />
          ),
        }}
      />

      {/* Tab 3: Create (botao circular flutuante) */}
      <Tabs.Screen
        name="createposts"
        options={{
          tabBarButton: (props) => <CreateButton {...props} />,
        }}
      />

      {/* Tab 4: Notifications */}
      <Tabs.Screen
        name="notifications"
        options={{
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? "notifications" : "notifications-outline"}
              size={size}
              color={color}
            />
          ),
        }}
      />

      {/* Tab 5: Profile */}
      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? "person" : "person-outline"}
              size={size}
              color={color}
            />
          ),
        }}
      />

      {/* Tab Admin — href: null esconde completamente do bottom bar */}
      <Tabs.Screen
        name="admin"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  createButton: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: -18,
  },
  createButtonInner: {
    width: 54,
    height: 54,
    borderRadius: 27,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
    borderWidth: 3,
    borderColor: "#FFFFFF",
  },
});