import { 
  View, 
  ScrollView, 
  Text, 
  TouchableOpacity, 
  TextInput,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
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

  // Estado de pesquisa ativa
  if (hasSearched || query.length > 0) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        {/* Search Bar */}
        <View className="px-4 py-3 border-b border-gray-100">
          <View className="flex-row items-center bg-gray-100 rounded-full px-4 py-3">
            <Feather name="search" size={20} color="#657786" />
            <TextInput
              placeholder="Pesquisar users..."
              className="flex-1 ml-3 text-base"
              placeholderTextColor="#657786"
              value={query}
              onChangeText={handleSearch}
              autoCapitalize="none"
              autoCorrect={false}
              autoFocus
            />
            {query.length > 0 && (
              <TouchableOpacity onPress={clearSearch}>
                <Feather name="x" size={20} color="#657786" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Resultados */}
        {loading ? (
          <View className="flex-1 justify-center items-center">
            <ActivityIndicator size="large" color="#1DA1F2" />
          </View>
        ) : results.length === 0 ? (
          <View className="flex-1 justify-center items-center px-6">
            <Feather name="search" size={48} color="#CBD5E1" />
            <Text className="text-gray-400 text-base mt-4 text-center">
              Nenhum user encontrado para "{query}"
            </Text>
          </View>
        ) : (
          <FlatList
            data={results}
            keyExtractor={(item) => item._id}
            renderItem={({ item }) => <UserSearchResult user={item} />}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          />
        )}
      </SafeAreaView>
    );
  }

  // Estado inicial — Trending
  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="px-4 py-3 border-b border-gray-100">
        <View className="flex-row items-center bg-gray-100 rounded-full px-4 py-3">
          <Feather name="search" size={20} color="#657786" />
          <TextInput
            placeholder="Search"
            className="flex-1 ml-3 text-base"
            placeholderTextColor="#657786"
            value={query}
            onChangeText={handleSearch}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>
      </View>

      <ScrollView className="flex-1">
        <View className="p-4">
          <Text className="text-xl font-bold text-gray-900 mb-4">
            Trending for you
          </Text>
          {TRENDING_TOPICS.map((item, index) => (
            <TouchableOpacity
              key={index}
              className="py-3 border-b border-gray-100"
              onPress={() => {
                setQuery(item.topic);
                handleSearch(item.topic);
              }}
            >
              <Text className="text-gray-500 text-sm">
                Trending in Health & Food
              </Text>
              <Text className="font-bold text-gray-900 text-lg">
                {item.topic}
              </Text>
              <Text className="text-gray-500 text-sm">{item.tweets} Tweets</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}