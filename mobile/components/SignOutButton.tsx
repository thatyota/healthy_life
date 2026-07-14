import { TouchableOpacity } from "react-native";
import React from "react";
import { Feather } from "@expo/vector-icons";
import { useSignOut } from "@/hooks/useSignOut";

interface Props {
  onPress?: () => void; // Permite o parent controlar o modal
}

const SignOutButton = ({ onPress }: Props) => {
  const { handleSignOut } = useSignOut();

  return (
    <TouchableOpacity 
      onPress={onPress || handleSignOut}
      className="flex-row items-center py-3 px-4"
    >
      <Feather name="log-out" size={20} color="#E6A050" />
      <React.Fragment />
    </TouchableOpacity>
  );
};

export default SignOutButton;