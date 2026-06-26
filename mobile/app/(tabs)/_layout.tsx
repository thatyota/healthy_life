import { View, Text } from 'react-native'
import React, { useEffect, useState } from 'react'
import { Redirect, Tabs } from 'expo-router'
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@clerk/expo';
import { useApiClient } from '@/utils/api';

const TabsLayout = () => {
   const insets = useSafeAreaInsets();
   const { isSignedIn } = useAuth();
   const api = useApiClient();
   const [unreadCount, setUnreadCount] = useState(0);

   // busca notificacoes para mostrar badge
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

      // atualiza a cada 30 segundos
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
            height: 50 + insets.bottom,
            padding: 8,
         },
         headerShown: false,
      }}>
         <Tabs.Screen
            name="index"
            options={{
               title: "",
               tabBarIcon: ({color, size}) => <Feather name='home' size={size} color={color}/>
            }}
         />
         <Tabs.Screen
            name="search"
            options={{
               title: "",
               tabBarIcon: ({color, size}) => <Feather name='search' size={size} color={color}/>
            }}
         />
         <Tabs.Screen
            name="notifications"
            options={{
               title: "",
               tabBarBadge: unreadCount > 0 ? unreadCount : undefined, // badge vermelho com numero
               tabBarBadgeStyle: { 
                  backgroundColor: "#ED4956",
                  fontSize: 10,
                  minWidth: 16,
                  height: 16,
                  borderRadius: 8,
               },
               tabBarIcon: ({color, size}) => <Feather name='bell' size={size} color={color}/>
            }}
         />
         <Tabs.Screen
            name="profile"
            options={{
               title: "",
               tabBarIcon: ({color, size}) => <Feather name='user' size={size} color={color}/>
            }}
         />
      </Tabs>
   )
}

export default TabsLayout