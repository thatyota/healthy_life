import { View, Text } from 'react-native'
import React from 'react'
import { Redirect, Tabs } from 'expo-router'
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@clerk/expo';
import { useNotifications } from '@/hooks/useNotifications';

const TabsLayout = () => {
   const insets = useSafeAreaInsets();
   const { isSignedIn } = useAuth();
   const { data: notifications } = useNotifications();
   
   const unreadCount = notifications?.filter((n) => !n.read).length || 0;

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
               tabBarBadge: unreadCount > 0 ? unreadCount : undefined,
               tabBarBadgeStyle: { 
                  backgroundColor: "#ED4956",
                  fontSize: 10,
                  minWidth: 16,
                  height: 16,
                  borderRadius: 8,
               },
               tabBarIcon: ({color, size}) => (
                  <View>
                     <Feather name='bell' size={size} color={color}/>
                  </View>
               )
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