import { ScrollView, Text, View, RefreshControl, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, Feather } from '@expo/vector-icons';
import { useUserSync } from '@/hooks/useUserSync';
import { usePosts } from '@/hooks/usePosts';
import PostComposer from '@/components/PostComposer';
import PostCard from '@/components/PostCard';
import SignOutButton from '@/components/SignOutButton';
import { useCallback, useState } from 'react';

const HomeScreen = () => {
  useUserSync();
  const { data: posts, isLoading, isError, refetch, isRefetching } = usePosts();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  return (
    <SafeAreaView className="flex-1 bg-[#F1F8E9]">
      {/* Header */}
      <View className="flex-row justify-between items-center px-4 py-3 bg-white border-b border-[#C8E6C9]">
        <View className="flex-row items-center gap-2">
          <View className="w-8 h-8 rounded-full bg-[#3A6604] justify-center items-center">
            <Ionicons name="leaf" size={18} color="#83E509" />
          </View>
          <Text className="text-xl font-bold text-[#3A6604]">HealthyLife</Text>
        </View>
        <SignOutButton />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 80 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#65B307"
            colors={['#65B307']}
          />
        }
      >
        {/* Post Composer */}
        <View className="bg-white mx-3 mt-3 rounded-2xl shadow-sm border border-[#E8F5E9]">
          <PostComposer />
        </View>

        {/* Section Title */}
        <View className="flex-row items-center px-4 py-3">
          <Feather name="trending-up" size={18} color="#3A6604" />
          <Text className="text-[#3A6604] font-bold text-lg ml-2">Receitas Recentes</Text>
        </View>

        {/* Feed */}
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
            <Text className="text-[#486623] text-base text-center">
              Erro ao carregar receitas. Puxa para baixo para tentar novamente.
            </Text>
          </View>
        ) : posts && posts.length > 0 ? (
          posts.map((post) => (
            <PostCard key={post._id} post={post} />
          ))
        ) : (
          <View className="flex-1 justify-center items-center py-20 px-6">
            <View className="w-20 h-20 rounded-full bg-[#E8F5E9] justify-center items-center mb-4">
              <Ionicons name="restaurant-outline" size={40} color="#65B307" />
            </View>
            <Text className="text-[#3A6604] font-bold text-lg text-center">
              Ainda não há receitas
            </Text>
            <Text className="text-[#486623] text-base mt-2 text-center">
              Sê o primeiro a partilhar uma receita saudável!
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default HomeScreen;