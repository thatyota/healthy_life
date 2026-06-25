import { 
  View, 
  Text, 
  TouchableOpacity, 
  TextInput,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useSearchUsers } from '@/hooks/useSearchUsers';
import UserSearchResult from '@/components/UserSearchResult';

const TRENDING_TOPICS = [
  { topic: "#HealthyEating", tweets: "234k" },
  { topic: "#MealPrep", tweets: "189k" },
  { topic: "#PlantBased", tweets: "567k" },
  { topic: "#CleanEating", tweets: "98k" },
  { topic: "#NutritionTips", tweets: "125k" },
];

export default function SearchScreen() {
  const {
    query,
    results,
    loading,
    hasSearched,
    handleSearch,
    clearSearch,
    setQuery,
  } = useSearchUsers();

  if (hasSearched || query.length > 0) {
    return (
      <SafeAreaView className="flex-1 bg-[#F1F8E9]">
        {/* Header */}
        <View className="flex-row items-center px-3 py-2 gap-2 bg-white border-b border-[#C8E6C9]">
          <TouchableOpacity onPress={clearSearch}>
            <Feather name="arrow-left" size={24} color="#3A6604" />
          </TouchableOpacity>

          <View className="flex-1 flex-row items-center bg-[#E8F5E9] rounded-full px-3 py-2">
            <Feather name="search" size={16} color="#65B307" />
            <TextInput
              placeholder="Pesquisar chefs..."
              placeholderTextColor="#486623"
              className="flex-1 ml-2 text-[#3A6604] text-[15px]"
              value={query}
              onChangeText={handleSearch}
              autoCapitalize="none"
              autoCorrect={false}
              autoFocus
            />
            {query.length > 0 && (
              <TouchableOpacity onPress={() => handleSearch('')}>
                <View className="w-4 h-4 rounded-full bg-[#486623] justify-center items-center">
                  <Feather name="x" size={10} color="white" />
                </View>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Results */}
        {loading ? (
          <View className="flex-1 justify-center items-center">
            <ActivityIndicator size="large" color="#65B307" />
          </View>
        ) : results.length === 0 ? (
          <View className="flex-1 justify-center items-center px-6">
            <View className="w-16 h-16 rounded-full bg-[#E8F5E9] justify-center items-center mb-4">
              <Feather name="search" size={32} color="#65B307" />
            </View>
            <Text className="text-[#486623] text-base text-center">
              Nenhum chef encontrado para "{query}"
            </Text>
          </View>
        ) : (
          <FlatList
            data={results}
            keyExtractor={(item) => item._id}
            renderItem={({ item }) => <UserSearchResult user={item} />}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            ItemSeparatorComponent={() => (
              <View className="h-[0.5px] bg-[#C8E6C9] ml-[72px]" />
            )}
          />
        )}
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-[#F1F8E9]">
      <View className="px-4 py-2 bg-white border-b border-[#C8E6C9]">
        <TouchableOpacity
          onPress={() => handleSearch('')}
          className="flex-row items-center bg-[#E8F5E9] rounded-full px-3 py-2.5"
        >
          <Feather name="search" size={16} color="#65B307" />
          <Text className="ml-2 text-[#486623] text-[15px]">Pesquisar chefs, receitas...</Text>
        </TouchableOpacity>
      </View>

      <View className="flex-1 justify-center items-center">
        <View className="w-20 h-20 rounded-full bg-[#E8F5E9] justify-center items-center mb-4">
          <Ionicons name="search" size={40} color="#65B307" />
        </View>
        <Text className="text-[#3A6604] font-bold text-lg">Descobre novos chefs</Text>
        <Text className="text-[#486623] text-base mt-2 text-center px-6">
          Pesquisa por utilizadores e encontra receitas saudáveis
        </Text>
      </View>
    </SafeAreaView>
  );
}