import { Stack } from "expo-router";
import "../global.css";
import { ClerkProvider } from '@clerk/expo'
import { tokenCache } from '@clerk/expo/token-cache'


const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!


export default function RootLayout() {
  return (
      <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache}>
      <Stack> 
        <Stack.Screen name="(auth)" options={{headerShown: false}} />  
      </Stack>
    </ClerkProvider>
  )  
  
}
