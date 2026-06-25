import { View, Text, Image, TouchableOpacity, Alert } from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useAuth } from '@clerk/expo';
import { useLikePost, useDeletePost, Post } from '@/hooks/usePosts';
import { useRouter } from 'expo-router';

interface Props {
  post: Post;
}

// Função simples para formatar tempo relativo
function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return 'agora';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `${weeks}sem`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}m`;
  return `${Math.floor(days / 365)}a`;
}

export default function PostCard({ post }: Props) {
  const { userId } = useAuth();
  const router = useRouter();
  const likeMutation = useLikePost();
  const deleteMutation = useDeletePost();

  const isLiked = post.Likes?.includes(userId || '');
  const likeCount = post.Likes?.length || 0;
  const commentCount = post.Comments?.length || 0;

  const displayName = `${post.user?.FirstName || ''} ${post.user?.LastName || ''}`.trim() || post.user?.Username;

  const handleLike = () => {
    likeMutation.mutate(post._id);
  };

  const handleDelete = () => {
    Alert.alert(
      'Eliminar post',
      'Tens a certeza que queres eliminar este post?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Eliminar', 
          style: 'destructive',
          onPress: () => deleteMutation.mutate(post._id),
        },
      ]
    );
  };

  const timeAgo = post.createdAt ? formatTimeAgo(post.createdAt) : '';

  return (
    <View className="border-b border-[#262626]">
      {/* Header */}
      <View className="flex-row items-center px-4 pt-3 pb-2">
        <TouchableOpacity 
          onPress={() => router.push(`/profile/${post.user?.Username}` as any)}
          className="flex-row items-center flex-1"
        >
          {post.user?.ProfilePicture ? (
            <Image 
              source={{ uri: post.user.ProfilePicture }} 
              className="w-9 h-9 rounded-full"
            />
          ) : (
            <View className="w-9 h-9 rounded-full bg-[#333] justify-center items-center">
              <Text className="text-white font-bold text-sm">
                {post.user?.Username?.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
          <View className="ml-3 flex-1">
            <Text className="text-white font-semibold text-[15px]">
              {displayName}
            </Text>
            <Text className="text-[#8E8E8E] text-[13px]">
              @{post.user?.Username} · {timeAgo}
            </Text>
          </View>
        </TouchableOpacity>

        {/* Delete button (só se for o autor) */}
        {post.user?._id === userId && (
          <TouchableOpacity onPress={handleDelete}>
            <Feather name="more-horizontal" size={20} color="#8E8E8E" />
          </TouchableOpacity>
        )}
      </View>

      {/* Content */}
      <View className="px-4 pb-2">
        {post.Content ? (
          <Text className="text-white text-[15px] leading-[22px]">
            {post.Content}
          </Text>
        ) : null}
      </View>

      {/* Image */}
      {post.Image ? (
        <View className="px-4 pb-3">
          <Image 
            source={{ uri: post.Image }} 
            className="w-full aspect-[4/3] rounded-xl"
            resizeMode="cover"
          />
        </View>
      ) : null}

      {/* Actions */}
      <View className="flex-row items-center px-4 pb-3 gap-6">
        {/* Like */}
        <TouchableOpacity 
          onPress={handleLike}
          className="flex-row items-center gap-1.5"
        >
          <Ionicons 
            name={isLiked ? "heart" : "heart-outline"} 
            size={22} 
            color={isLiked ? "#ED4956" : "#8E8E8E"} 
          />
          {likeCount > 0 && (
            <Text className={`text-[13px] ${isLiked ? 'text-[#ED4956]' : 'text-[#8E8E8E]'}`}>
              {likeCount}
            </Text>
          )}
        </TouchableOpacity>

        {/* Comment */}
        <TouchableOpacity className="flex-row items-center gap-1.5">
          <Ionicons name="chatbubble-outline" size={20} color="#8E8E8E" />
          {commentCount > 0 && (
            <Text className="text-[#8E8E8E] text-[13px]">{commentCount}</Text>
          )}
        </TouchableOpacity>

        {/* Share */}
        <TouchableOpacity>
          <Feather name="send" size={20} color="#8E8E8E" />
        </TouchableOpacity>
      </View>
    </View>
  );
}