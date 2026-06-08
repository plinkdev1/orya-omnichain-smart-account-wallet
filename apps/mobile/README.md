# ORYA Wallet Mobile App

Mobile application for ORYA - Crypto Wallet & DeFi Super App built with React Native and Expo.

## Overview

This is a complete React Native mobile application that mirrors all functionality from the web prototype. It features:

- **Vault** - Portfolio overview, balance management, transaction history
- **Link** - Cross-chain swaps, transfers, and fiat onramp
- **Circle** - Membership tiers, exclusive offers, and referral program
- **Care** - Customer support, FAQs, and support tickets
- **Suite** - Institutional features including multi-sig wallets and analytics

## Tech Stack

- **Framework**: React Native 0.74 with Expo SDK 51
- **Routing**: Expo Router (file-based routing)
- **Styling**: NativeWind (Tailwind CSS for React Native)
- **Forms**: React Hook Form + Zod validation
- **Icons**: Lucide React Native
- **Animations**: React Native Reanimated 3
- **State Management**: Redux Toolkit (ready to integrate)
- **Charts**: Victory Native or Recharts

## Project Structure

```
apps/mobile/
├── app/                    # Expo Router screens
│   ├── _layout.tsx        # Root navigation (tabs)
│   ├── index.tsx          # Vault screen (home)
│   ├── link.tsx           # Link/Swap screen
│   ├── circle.tsx         # Circle/Membership screen
│   ├── care.tsx           # Care/Support screen
│   └── suite.tsx          # Suite/Institutional screen
├── components/            # Reusable components (ready to add)
├── hooks/                 # Custom hooks (ready to add)
├── utils/                 # Utility functions
├── types/                 # TypeScript types
├── contexts/              # React contexts (ready to add)
├── assets/                # Images, fonts, icons
├── app.json               # Expo configuration
├── package.json           # Dependencies
├── tsconfig.json          # TypeScript configuration
├── tailwind.config.ts     # Tailwind configuration
└── README.md              # This file
```

## Getting Started

### Prerequisites

- Node.js 18+ or 20+
- pnpm (recommended) or npm
- Expo CLI (`npm install -g expo-cli`)
- iOS Simulator (macOS) or Android Emulator

### Installation

1. Install dependencies:

```bash
cd apps/mobile
pnpm install
```

2. Start the development server:

```bash
pnpm start
```

3. Choose your platform:
   - Press `i` for iOS
   - Press `a` for Android
   - Press `w` for web
   - Press `j` to open Expo Go

### Development Commands

```bash
# Start development server
pnpm start

# Run on iOS
pnpm ios

# Run on Android
pnpm android

# Run on web
pnpm web

# Lint code
pnpm lint

# Run tests
pnpm test
```

## Features

### Vault Screen (Home)
- Display total balance with 24h change
- Quick action buttons: Send, Receive, Swap
- Chain selector slider
- Asset list with real-time prices
- Transaction history
- Search and filter functionality

### Link Screen (Swaps & Transfers)
- Multi-step cross-chain transfer wizard
- Quick swap interface
- Add funds methods (card, bank)
- Live exchange rates display

### Circle Screen (Membership)
- Current membership tier display
- Progress bar to next tier
- Exclusive offers carousel
- Membership tier comparison
- Concierge chat access
- Referral program

### Care Screen (Support)
- Contact methods (chat, phone)
- Ticket submission form
- Support history
- Security alerts
- FAQ accordion

### Suite Screen (Institutional)
- Entity selection and management
- Multi-signature wallet creation
- Analytics dashboard placeholder
- Feature showcase grid
- Reports & export options
- Active wallets list

## Customization

### Colors & Theming
Edit `tailwind.config.ts` to customize the color scheme:

```typescript
colors: {
  "bone-white": "#F8F6F1",      // Light mode bg
  "pale-gold": "#D4C29E",       // Light mode accent
  "deep-charcoal": "#1A1A1A",   // Light mode text
  "dark-bg": "#111111",         // Dark mode bg
  "neon-gold": "#FFD700",       // Dark mode accent
}
```

### Adding Components
Create reusable components in `components/`:

```typescript
// components/Card.tsx
import { View, ViewProps } from 'react-native'
import { useColorScheme } from 'nativewind'

export function Card({ children, ...props }: ViewProps) {
  const { colorScheme } = useColorScheme()
  const isDark = colorScheme === 'dark'
  
  return (
    <View 
      className={`rounded-2xl p-4 ${isDark ? 'bg-gray-800' : 'bg-white'}`}
      {...props}
    >
      {children}
    </View>
  )
}
```

### Adding New Screens
1. Create a new file in `app/` folder (e.g., `app/atrium.tsx`)
2. Add a new tab in `app/_layout.tsx`:

```typescript
<Tabs.Screen
  name="atrium"
  options={{
    title: 'Atrium',
    tabBarIcon: ({ color, size }) => (
      <Briefcase color={color} size={size} />
    ),
    tabBarLabel: "Atrium"
  }}
/>
```

## Integration Points

### Backend API
Connect to backend by updating API calls in screens:

```typescript
// Replace mock data with API calls
const [assets, setAssets] = useState([])

useEffect(() => {
  fetchAssets().then(setAssets)
}, [])
```

### Redux Setup
Initialize Redux store in `_layout.tsx`:

```typescript
import { Provider } from 'react-redux'
import { store } from '@/redux/store'

return (
  <Provider store={store}>
    {/* App content */}
  </Provider>
)
```

### GraphQL Integration
Add Apollo Client for GraphQL queries:

```typescript
import { ApolloClient, InMemoryCache } from '@apollo/client'

const client = new ApolloClient({
  uri: 'your-graphql-endpoint',
  cache: new InMemoryCache(),
})
```

## Performance Optimization

- Use `FlatList` for long lists instead of `ScrollView`
- Implement React.memo for expensive components
- Use Redux for state management to prevent prop drilling
- Enable Hermes engine in Android for better performance

## Testing

Tests can be added using Jest and React Native Testing Library:

```bash
pnpm test
```

## Deployment

### iOS
```bash
eas build --platform ios
eas submit --platform ios
```

### Android
```bash
eas build --platform android
eas submit --platform android
```

## Troubleshooting

### Metro Bundler Issues
```bash
pnpm start --reset-cache
```

### Dependencies Conflict
```bash
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

### Expo Go Issues
Clear cache in Expo Go app and restart development server

## Next Steps

1. **Implement Backend Integration** - Connect to GraphQL API
2. **Add Authentication** - Set up user login/KYC flow
3. **Implement Wallet Integration** - Connect to Privy MPC wallets
4. **Add Real Data** - Replace mock data with live API calls
5. **Set Up Push Notifications** - Implement Expo Notifications
6. **Add Deep Linking** - Set up URL routing
7. **Implement Biometric Auth** - Face ID/Touch ID support

## Contributing

Follow these guidelines:
- Use TypeScript for all files
- Follow the existing component structure
- Use NativeWind classes for styling
- Keep components small and focused
- Document complex logic

## License

Proprietary - ORYA Wallet

## Support

For issues or questions:
1. Check README and documentation
2. Review existing code examples
3. Open an issue in the repository