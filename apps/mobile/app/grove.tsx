import { useRouter } from 'expo-router'
import {
    ArrowLeft,
    Heart,
    Menu,
    MessageCircle,
    Share2
} from 'lucide-react-native'
import { useColorScheme } from 'nativewind'
import { useState } from 'react'
import {
    FlatList,
    SafeAreaView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native'

interface CommunityPost {
  id: string
  author: string
  avatar: string
  content: string
  timestamp: string
  likes: number
  comments: number
  liked: boolean
}

const COMMUNITY_POSTS: CommunityPost[] = [
  {
    id: '1',
    author: 'Alex Chen',
    avatar: '👤',
    content: 'Just secured my first 10 BTC! #hodl #bitcoin',
    timestamp: '2h ago',
    likes: 234,
    comments: 45,
    liked: false,
  },
  {
    id: '2',
    author: 'Sarah Moon',
    avatar: '👤',
    content: 'SUI ecosystem is heating up 🔥 New DeFi opportunities emerging',
    timestamp: '4h ago',
    likes: 567,
    comments: 89,
    liked: true,
  },
  {
    id: '3',
    author: 'Marcus Webb',
    avatar: '👤',
    content: 'Portfolio up 45% this quarter thanks to diversification strategy',
    timestamp: '6h ago',
    likes: 892,
    comments: 156,
    liked: false,
  },
]

export default function GroveScreen() {
  const { colorScheme } = useColorScheme()
  const router = useRouter()
  const isDark = colorScheme === 'dark'
  const [newPost, setNewPost] = useState('')
  const [posts, setPosts] = useState(COMMUNITY_POSTS)

  const bgColor = isDark ? 'bg-slate-900' : 'bg-slate-50'
  const cardBg = isDark ? 'bg-slate-800' : 'bg-white'
  const textColor = isDark ? 'text-slate-50' : 'text-slate-900'
  const mutedColor = isDark ? 'text-slate-400' : 'text-slate-500'

  const handleLike = (id: string) => {
    setPosts(posts.map(p => p.id === id ? { ...p, liked: !p.liked } : p))
  }

  const handlePost = () => {
    if (newPost.trim()) {
      const post = {
        id: String(posts.length + 1),
        author: 'You',
        avatar: '👤',
        content: newPost,
        timestamp: 'now',
        likes: 0,
        comments: 0,
        liked: false,
      }
      setPosts([post, ...posts])
      setNewPost('')
    }
  }

  return (
    <SafeAreaView className={`flex-1 ${bgColor}`}>
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-4 border-b border-slate-200 dark:border-slate-700">
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft size={24} color={isDark ? '#64748b' : '#64748b'} />
        </TouchableOpacity>
        <View>
          <Text className={`text-2xl font-bold ${textColor}`}>Grove</Text>
          <Text className={`${mutedColor} text-xs`}>Community</Text>
        </View>
        <TouchableOpacity>
          <Menu size={24} color={isDark ? '#64748b' : '#64748b'} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={posts}
        keyExtractor={(item: CommunityPost) => item.id}
        scrollEnabled
        ListHeaderComponent={
          <View className="px-4 pt-4">
            {/* New Post Input */}
            <View className={`${cardBg} p-4 rounded-2xl mb-4`}>
              <View className="flex-row items-start gap-3 mb-3">
                <Text className="text-2xl">👤</Text>
                <TextInput
                  placeholder="Share your thoughts..."
                  placeholderTextColor={isDark ? '#94a3b8' : '#cbd5e1'}
                  value={newPost}
                  onChangeText={setNewPost}
                  multiline
                  className={`flex-1 ${isDark ? 'text-slate-50' : 'text-slate-900'}`}
                />
              </View>
              <View className="flex-row justify-end gap-2">
                <TouchableOpacity className={`px-4 py-2 rounded-2xl ${isDark ? 'bg-slate-700' : 'bg-slate-100'}`}>
                  <Text className={textColor}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handlePost} className="px-4 py-2 rounded-2xl bg-amber-500">
                  <Text className="text-white font-semibold">Post</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        }
        renderItem={({ item }: { item: CommunityPost }) => (
          <View className="px-4 mb-3">
            <View className={`${cardBg} p-4 rounded-2xl`}>
              {/* Author */}
              <View className="flex-row items-center justify-between mb-3">
                <View className="flex-row items-center gap-2">
                  <Text className="text-2xl">{item.avatar}</Text>
                  <View>
                    <Text className={`font-semibold ${textColor}`}>{item.author}</Text>
                    <Text className={`${mutedColor} text-xs`}>{item.timestamp}</Text>
                  </View>
                </View>
                <TouchableOpacity>
                  <Menu size={16} color={isDark ? '#94a3b8' : '#cbd5e1'} />
                </TouchableOpacity>
              </View>

              {/* Content */}
              <Text className={`${textColor} mb-3 leading-5`}>{item.content}</Text>

              {/* Actions */}
              <View className={`border-t ${isDark ? 'border-slate-700' : 'border-slate-200'} pt-3 flex-row justify-between`}>
                <TouchableOpacity
                  onPress={() => handleLike(item.id)}
                  className="flex-row items-center gap-1"
                >
                  <Heart
                    size={16}
                    color={item.liked ? '#ef4444' : isDark ? '#94a3b8' : '#cbd5e1'}
                    fill={item.liked ? '#ef4444' : 'none'}
                  />
                  <Text className={`text-xs ${item.liked ? 'text-red-500' : mutedColor}`}>
                    {item.likes}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity className="flex-row items-center gap-1">
                  <MessageCircle size={16} color={isDark ? '#94a3b8' : '#cbd5e1'} />
                  <Text className={`text-xs ${mutedColor}`}>{item.comments}</Text>
                </TouchableOpacity>
                <TouchableOpacity className="flex-row items-center gap-1">
                  <Share2 size={16} color={isDark ? '#94a3b8' : '#cbd5e1'} />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
        contentContainerStyle={{ paddingBottom: 32 }}
      />
    </SafeAreaView>
  )
}

