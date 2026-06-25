import { View, Text, Image, TouchableOpacity } from "react-native";
import { Feather, Ionicons } from "@expo/vector-icons";
import { useAuth } from "@clerk/expo";
import { Comment, useDeleteComment } from "@/hooks/useComments";

interface Props {
  comment: Comment;
  postId: string;
}

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (seconds < 60) return "agora";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  return `${Math.floor(days / 7)}sem`;
}

export default function CommentItem({ comment, postId }: Props) {
  const { userId } = useAuth();
  const deleteMutation = useDeleteComment();

  const displayName = `${comment.user?.FirstName || ""} ${comment.user?.LastName || ""}`.trim() || comment.user?.Username;
  const timeAgo = comment.createdAt ? formatTimeAgo(comment.createdAt) : "";
  const isOwnComment = comment.user?._id === userId;

  const handleDelete = () => {
    deleteMutation.mutate({ commentId: comment._id, postId });
  };

  return (
    <View className="flex-row px-4 py-3 border-b border-[#E8F5E9]">
      {comment.user?.ProfilePicture ? (
        <Image source={{ uri: comment.user.ProfilePicture }} className="w-8 h-8 rounded-full" />
      ) : (
        <View className="w-8 h-8 rounded-full bg-[#3A6604] justify-center items-center">
          <Text className="text-white text-xs font-bold">
            {comment.user?.Username?.charAt(0).toUpperCase()}
          </Text>
        </View>
      )}

      <View className="flex-1 ml-3">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-1 flex-wrap">
            <Text className="text-[#3A6604] font-bold text-[14px]">{displayName}</Text>
            <Text className="text-[#486623] text-[12px]">@{comment.user?.Username}</Text>
            <Text className="text-[#8E8E8E] text-[12px]">· {timeAgo}</Text>
          </View>
          {isOwnComment && (
            <TouchableOpacity onPress={handleDelete}>
              <Feather name="trash-2" size={14} color="#C62828" />
            </TouchableOpacity>
          )}
        </View>

        <Text className="text-[#1a1a1a] text-[14px] mt-1 leading-[20px]">{comment.content}</Text>

        <TouchableOpacity className="flex-row items-center mt-2 gap-1">
          <Ionicons name="heart-outline" size={14} color="#486623" />
          <Text className="text-[#486623] text-[12px]">{comment.likes?.length || 0}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}