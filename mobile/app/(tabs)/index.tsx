import { ScrollView, Text, View, RefreshControl, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, Feather } from "@expo/vector-icons";
import { useUserSync } from "@/hooks/useUserSync";
import { usePosts } from "@/hooks/usePosts";
import PostCard from "@/components/PostCard";
import { useCallback, useState } from "react";

/**
 * HomeScreen - Feed principal de receitas
 * 
 * Mostra lista de receitas recentes com pull-to-refresh.
 * Para criar post, usa a tab "+" no bottom bar.
 */
const HomeScreen = () => {
  // Sincroniza user com backend
  useUserSync();

  // Busca posts do backend
  const { data: posts, isLoading, isError, error, refetch } = usePosts();
  const [refreshing, setRefreshing] = useState(false);

  // Pull-to-refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  // Mensagem de erro amigavel
  const getErrorMessage = () => {
    if (!error) return "Erro desconhecido";
    if ((error as any).response?.data?.error) return (error as any).response.data.error;
    if ((error as any).message) return (error as any).message;
    return "Erro ao carregar receitas";
  };

  return (
    <SafeAreaView className="flex-1 bg-[#F1F8E9]" edges={["top"]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 20 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#65B307" colors={["#65B307"]} />
        }
      >
        {/* Titulo da seccao */}
        <View className="flex-row items-center px-4 py-3">
          <Feather name="trending-up" size={18} color="#3A6604" />
          <Text className="text-[#3A6604] font-bold text-lg ml-2">Receitas Recentes</Text>
        </View>

        {/* Loading */}
        {isLoading && !posts ? (
          <View className="flex-1 justify-center items-center py-10">
            <ActivityIndicator size="large" color="#65B307" />
            <Text className="text-[#486623] mt-3">A carregar receitas...</Text>
          </View>
        ) : isError ? (
          <View className="flex-1 justify-center items-center py-10 px-6">
            <View className="w-16 h-16 rounded-full bg-[#FFEBEE] justify-center items-center mb-4">
              <Ionicons name="warning-outline" size={32} color="#C62828" />
            </View>
            <Text className="text-[#C62828] text-base text-center font-bold">Erro ao carregar</Text>
            <Text className="text-[#486623] text-sm text-center mt-2">{getErrorMessage()}</Text>
            <Text className="text-[#8E8E8E] text-xs text-center mt-4">
              Puxa para baixo para tentar novamente
            </Text>
          </View>
        ) : posts && posts.length > 0 ? (
          /* Lista de posts */
          posts.map((post) => <PostCard key={post._id} post={post} />)
        ) : (
          <View className="flex-1 justify-center items-center py-20 px-6">
            <View className="w-20 h-20 rounded-full bg-[#E8F5E9] justify-center items-center mb-4">
              <Ionicons name="restaurant-outline" size={40} color="#65B307" />
            </View>
            <Text className="text-[#3A6604] font-bold text-lg text-center">Ainda nao ha receitas</Text>
            <Text className="text-[#486623] text-base mt-2 text-center">
              Usa o botao mais em baixo para partilhar a primeira
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default HomeScreen;