// Global type declarations for React Native 0.74 + NativeWind support
import type { PropsWithChildren, ReactNode } from 'react'

declare module 'react-native' {
  export interface ViewProps extends PropsWithChildren {
    className?: string
    style?: any
  }

  export interface TextProps extends PropsWithChildren {
    className?: string
    style?: any
  }

  export interface ScrollViewProps extends PropsWithChildren {
    className?: string
    style?: any
    showsVerticalScrollIndicator?: boolean
    showsHorizontalScrollIndicator?: boolean
    horizontal?: boolean
    contentContainerStyle?: any
    scrollEventThrottle?: number
    onScroll?: (event: any) => void
  }

  export interface FlatListProps<ItemT> extends PropsWithChildren {
    className?: string
    style?: any
    data: ItemT[]
    renderItem: (info: { item: ItemT; index: number }) => ReactNode
    keyExtractor?: (item: ItemT, index: number) => string
  }

  export interface SectionListProps<ItemT, SectionT> extends PropsWithChildren {
    className?: string
    style?: any
  }

  export interface TouchableOpacityProps extends PropsWithChildren {
    className?: string
    style?: any
    onPress?: () => void
    disabled?: boolean
  }

  export interface TouchableHighlightProps extends PropsWithChildren {
    className?: string
    style?: any
    onPress?: () => void
  }

  export interface TouchableWithoutFeedbackProps extends PropsWithChildren {
    className?: string
    style?: any
    onPress?: () => void
  }

  export interface PressableProps extends PropsWithChildren {
    className?: string
    style?: any
    onPress?: () => void
  }

  export interface SafeAreaViewProps extends PropsWithChildren {
    className?: string
    style?: any
  }

  export interface TextInputProps {
    className?: string
    style?: any
    placeholder?: string
    placeholderTextColor?: string
    value?: string
    onChangeText?: (text: string) => void
    editable?: boolean
    keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad' | 'decimal-pad' | 'visible-password' | 'ascii-capable' | 'numbers-and-punctuation' | 'url' | 'number-pad' | 'name-phone-pad' | 'twitter' | 'web-search'
    multiline?: boolean
    numberOfLines?: number
    maxLength?: number
    autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters'
    autoCorrect?: boolean
    secureTextEntry?: boolean
    onFocus?: () => void
    onBlur?: () => void
  }

  export interface ImageProps {
    className?: string
    style?: any
    source: any
    resizeMode?: 'cover' | 'contain' | 'stretch' | 'center'
  }

  export interface ModalProps extends PropsWithChildren {
    className?: string
    style?: any
    visible?: boolean
    transparent?: boolean
    animationType?: 'none' | 'slide' | 'fade'
    onRequestClose?: () => void
  }

  export interface ActivityIndicatorProps {
    className?: string
    style?: any
    size?: 'small' | 'large' | number
    color?: string
  }

  export const View: React.ComponentType<ViewProps>
  export const Text: React.ComponentType<TextProps>
  export const ScrollView: React.ComponentType<ScrollViewProps>
  export const FlatList: React.ComponentType<any>
  export const SectionList: React.ComponentType<any>
  export const TouchableOpacity: React.ComponentType<TouchableOpacityProps>
  export const TouchableHighlight: React.ComponentType<TouchableHighlightProps>
  export const TouchableWithoutFeedback: React.ComponentType<TouchableWithoutFeedbackProps>
  export const Pressable: React.ComponentType<PressableProps>
  export const SafeAreaView: React.ComponentType<SafeAreaViewProps>
  export const TextInput: React.ComponentType<TextInputProps>
  export const Image: React.ComponentType<ImageProps>
  export const Modal: React.ComponentType<ModalProps>
  export const ActivityIndicator: React.ComponentType<ActivityIndicatorProps>
}

declare module 'react-native-safe-area-context' {
  export interface SafeAreaViewProps extends PropsWithChildren {
    className?: string
    style?: any
  }
  export const SafeAreaProvider: React.ComponentType<PropsWithChildren>
  export const SafeAreaView: React.ComponentType<SafeAreaViewProps>
  export const useSafeAreaInsets: () => { top: number; left: number; right: number; bottom: number }
}

declare module 'react-native-gesture-handler' {
  export interface GestureHandlerRootViewProps extends PropsWithChildren {
    style?: any
  }
  export const GestureHandlerRootView: React.ComponentType<GestureHandlerRootViewProps>
}

declare module 'nativewind' {
  export const useColorScheme: () => { colorScheme: 'light' | 'dark'; toggleColorScheme: () => void }
}