import React from "react";
import {
  View, Text, ScrollView, TouchableOpacity,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

// =============================================================================
// Admin Dashboard
// =============================================================================
// Painel principal do admin com cards de navegacao
// Nao usa useUser (evita native module error)
// =============================================================================

export default function AdminDashboard() {
  const router = useRouter();

  // Cards do dashboard
  const cards = [
    {
      title: "Utilizadores",
      icon: "people-outline",
      route: "/(admin)/users" as any,
      color: "#3A6604",
      count: "--",
    },
    {
      title: "Publicacoes",
      icon: "newspaper-outline",
      route: "/(admin)/posts" as any,
      color: "#2E7D32",
      count: "--",
    },
    {
      title: "Moderacao",
      icon: "shield-checkmark-outline",
      route: "/(admin)/moderation" as any,
      color: "#1B5E20",
      count: "--",
    },
  ];

  return (
    <ScrollView className="flex-1 bg-[#F1F8E9]">
      {/* Header */}
      <View className="bg-[#3A6604] px-6 pt-12 pb-8 rounded-b-[32px]">
        <Text className="text-white text-2xl font-bold">Painel Admin</Text>
        <Text className="text-white/80 text-base mt-1">
          Bem-vindo ao painel de administracao
        </Text>
      </View>

      {/* Cards */}
      <View className="px-6 -mt-6">
        {cards.map((card, index) => (
          <TouchableOpacity
            key={index}
            onPress={() => router.push(card.route)}
            className="bg-white rounded-2xl p-5 mb-4 shadow-sm border border-[#3A6604]/10 flex-row items-center"
          >
            <View
              className="w-14 h-14 rounded-xl justify-center items-center mr-4"
              style={{ backgroundColor: card.color + "15" }}
            >
              <Ionicons name={card.icon as any} size={28} color={card.color} />
            </View>
            <View className="flex-1">
              <Text className="text-lg font-bold text-[#1B1B1B]">{card.title}</Text>
              <Text className="text-sm text-[#666]">{card.count} registos</Text>
            </View>
            <Ionicons name="chevron-forward" size={22} color="#3A6604" />
          </TouchableOpacity>
        ))}
      </View>

      {/* Stats resumo */}
      <View className="px-6 mt-4 mb-8">
        <Text className="text-lg font-bold text-[#1B1B1B] mb-4">Resumo</Text>
        <View className="bg-white rounded-2xl p-5 shadow-sm border border-[#3A6604]/10">
          <Text className="text-sm text-[#666]">
            Aqui podes gerir utilizadores, publicacoes e moderar conteudo da app.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}