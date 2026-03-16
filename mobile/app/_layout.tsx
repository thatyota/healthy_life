import { Stack } from "expo-router";
import "../global.css";
import { ClerkProvider } from '@clerk/expo'
import { tokenCache } from '@clerk/expo/token-cache'
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!

const queryClient = new QueryClient();

export default function RootLayout() {
  return (
      <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache}>
        <QueryClientProvider client={queryClient}>
      <Stack screenOptions={{headerShown: false}}> 
        <Stack.Screen name="(auth)" options={{headerShown: false}} />  
      </Stack>
      </QueryClientProvider>
    </ClerkProvider>
  )  
  
}
