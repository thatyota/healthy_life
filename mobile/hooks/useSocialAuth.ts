import { useState } from "react"
import { useSSO } from "@clerk/expo";
import { Alert } from "react-native";
export  const  useSocialAuth = () => {  
    const [isLoading, setIsLoading] = useState(false);
    const {startSSOFlow}= useSSO();


    const handleSocialAuth = async(strategy: "oauth_google" | "oauth_apple") => {
        setIsLoading(true);
        try{
             const  { createdSessionId, setActive } = await startSSOFlow({ strategy });
              
                //check if user has been authenticated 
             if (createdSessionId && setActive) {
                    await setActive({ session: createdSessionId });
                }
        }catch (err) {
            console.log("Error in social auth", err);
            //check for the provider
            const provider = strategy === "oauth_google" ? "Google" : "Apple";
            Alert.alert("Error", `Failed to sign in with ${provider}. Please try again.`);
        }   finally {
            setIsLoading(false);
        }

    };



    return {isLoading, handleSocialAuth};
};