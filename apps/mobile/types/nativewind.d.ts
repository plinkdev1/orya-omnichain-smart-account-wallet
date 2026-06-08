// Augment react-native types to support NativeWind className prop

declare module 'react-native' {
  // Extend ViewProps to include className
  interface ViewProps {
    className?: string;
  }

  // Extend TextProps to include className
  interface TextProps {
    className?: string;
  }

  // Extend ScrollViewProps to include className
  interface ScrollViewProps {
    className?: string;
  }

  // Extend FlatListProps to include className
  interface FlatListProps<ItemT> {
    className?: string;
  }

  // Extend TouchableOpacityProps to include className
  interface TouchableOpacityProps {
    className?: string;
  }

  // Extend SafeAreaViewProps to include className
  interface SafeAreaViewProps {
    className?: string;
  }

  // Extend TextInputProps to include className
  interface TextInputProps {
    className?: string;
  }

  // Extend ImageProps to include className
  interface ImageProps {
    className?: string;
  }

  // Extend TouchableHighlightProps to include className
  interface TouchableHighlightProps {
    className?: string;
  }

  // Extend ModalProps to include className
  interface ModalProps {
    className?: string;
  }
}

// Augment react-native-safe-area-context
declare module 'react-native-safe-area-context' {
  interface SafeAreaViewProps {
    className?: string;
  }
}
