import { View, Text, TouchableOpacity } from 'react-native'
import React, { useEffect, useState } from 'react'
import { Redirect, Tabs } from 'expo-router'
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@clerk/clerk-expo';
import { useApiClient } from '@/utils/api';

/**
 * TabsLayout - Bottom navigation bar
 * 
 * Tabs: Home, Search, Create (botao destacado), Notifications, Profile
 * Botao + verde redondo no centro, ligeiramente acima da barra.
 */
const TabsLayout = () => {
   const insets = useSafeAreaInsets();
   const { isSignedIn } = useAuth();
   const api = useApiClient();
   const [unreadCount, setUnreadCount] = useState(0);

   useEffect(() => {
      if (!isSignedIn) return;

      const fetchNotifications = async () => {
         try {
            const response = await api.get('/notifications');
            const notifications = response.data.notifications || [];
            const unread = notifications.filter((n: any) => !n.read).length;
            setUnreadCount(unread);
         } catch (error) {
            console.error('Erro ao buscar notificações:', error);
         }
      };

      fetchNotifications();
      const interval = setInterval(fetchNotifications, 30000);
      return () => clearInterval(interval);
   }, [isSignedIn, api]);

   if (!isSignedIn) return <Redirect href="/(auth)"/>;

   return (
      <Tabs screenOptions={{
         tabBarActiveTintColor: "#65B307", 
         tabBarInactiveTintColor: "#486623",  
         tabBarStyle: {
            backgroundColor: "#fff",
            borderTopWidth: 1,
            borderTopColor: "#C8E6C9",
            height: 55 + insets.bottom,
            paddingBottom: insets.bottom,
            paddingTop: 5,
         },
         headerShown: false,
      }}>
         {/* Home */}
         <Tabs.Screen
            name="index"
            options={{
               title: "",
               tabBarIcon: ({color, size, focused}) => (
                  <View className="items-center justify-center">
                     <Feather name='home' size={22} color={focused ? "#3A6604" : color}/>
                     {focused && <View className="w-1 h-1 bg-[#3A6604] rounded-full mt-1"/>}
                  </View>
               )
            }}
         />

         {/* Search */}
         <Tabs.Screen
            name="search"
            options={{
               title: "",
               tabBarIcon: ({color, size, focused}) => (
                  <View className="items-center justify-center">
                     <Feather name='search' size={22} color={focused ? "#3A6604" : color}/>
                     {focused && <View className="w-1 h-1 bg-[#3A6604] rounded-full mt-1"/>}
                  </View>
               )
            }}
         />

         {/* Create Post - Botao destacado redondo */}
         <Tabs.Screen
            name="createposts"
            options={{
               title: "",
               tabBarShowLabel: false,
               tabBarIcon: ({ focused }) => (
                  <View className="items-center justify-center" style={{ marginTop: -15 }}>
                     <View
                        style={{
                           width: 48,
                           height: 48,
                           backgroundColor: focused ? "#2d5203" : "#3A6604",
                           borderRadius: 24,
                           borderWidth: 2.5,
                           borderColor: "#fff",
                           shadowColor: '#3A6604',
                           shadowOffset: { width: 0, height: 3 },
                           shadowOpacity: 0.25,
                           shadowRadius: 4,
                           elevation: 6,
                           alignItems: 'center',
                           justifyContent: 'center',
                        }}
                     >
                        <Feather name='plus' size={24} color="white"/>
                     </View>
                  </View>
               ),
            }}
         />

         {/* Notifications */}
         <Tabs.Screen
            name="notifications"
            options={{
               title: "",
               tabBarBadge: unreadCount > 0 ? unreadCount : undefined,
               tabBarBadgeStyle: { 
                  backgroundColor: "#ED4956",
                  fontSize: 10,
                  minWidth: 16,
                  height: 16,
                  borderRadius: 8,
               },
               tabBarIcon: ({color, size, focused}) => (
                  <View className="items-center justify-center">
                     <Feather name='bell' size={22} color={focused ? "#3A6604" : color}/>
                     {focused && <View className="w-1 h-1 bg-[#3A6604] rounded-full mt-1"/>}
                  </View>
               )
            }}
         />

         {/* Profile */}
         <Tabs.Screen
            name="profile"
            options={{
               title: "",
               tabBarIcon: ({color, size, focused}) => (
                  <View className="items-center justify-center">
                     <Feather name='user' size={22} color={focused ? "#3A6604" : color}/>
                     {focused && <View className="w-1 h-1 bg-[#3A6604] rounded-full mt-1"/>}
                  </View>
               )
            }}
         />
      </Tabs>
   )
}

export default TabsLayout