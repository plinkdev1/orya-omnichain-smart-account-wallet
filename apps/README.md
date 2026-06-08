# ORŸA Apps

User-facing applications for the ORŸA platform.

## Structure

- **mobile/** - React Native / Expo app for iOS and Android
  - Target platforms: iOS 14+, Android 8+
  - Development: Expo SDK 50+
  - Framework: React Native 0.73+
  - Features: All 13 menus + 14 Atrium sub-pages

- **web/** - Web dashboard (future)
  - Coming in Phase 5

## Getting Started

### Mobile App

```bash
cd apps/mobile
pnpm install
pnpm dev          # Start Expo dev server
pnpm ios          # Run iOS simulator
pnpm android      # Run Android emulator
```

### Available Scripts

- `pnpm dev` - Start development server
- `pnpm ios` - Run on iOS simulator
- `pnpm android` - Run on Android emulator
- `pnpm build` - Build for production
- `pnpm test` - Run tests
- `pnpm lint` - Lint code
- `pnpm typecheck` - Type checking

## Dependencies

- react: ^18.2.0
- react-native: ^0.73.0
- expo: ^50.0.0
- expo-router: ^2.4.0 (routing)
- react-native-reanimated: ^3.6.0 (animations)
- @apollo/client: ^3.8.0 (GraphQL)
- zustand: ^4.4.0 (state management)

## Architecture

```
mobile/
├── src/
│   ├── screens/          # Page screens (13 menus)
│   ├── components/       # Reusable components
│   ├── hooks/           # Custom React hooks
│   ├── contexts/        # Context providers
│   ├── types/           # TypeScript types
│   ├── utils/           # Utility functions
│   └── styles/          # Styling
├── app.json             # Expo configuration
├── app.tsx              # Root component
└── package.json
```

## Screens (13 Menus)

1. **Vault** - Portfolio overview
2. **Link** - Wallet connections
3. **Flow** - Transactions
4. **Insights** - Analytics
5. **Curio** - Research
6. **Grove** - Community
7. **Care** - Support
8. **Nexus** - Network management
9. **Atrium** - Wealth portal (14 sub-pages)
10. **Settings** - User preferences
11. **Chains** - Multi-chain management
12. **Help** - FAQ
13. **Support** - Customer support

## Development

### Code Style

- TypeScript strict mode enabled
- ESLint configured
- Prettier auto-formatting
- React hooks best practices

### Testing

```bash
pnpm test
```

### Building for Production

```bash
pnpm build
eas build --platform ios
eas build --platform android
```

## Documentation

See `../../docs/` for app-specific documentation.

## Support

For issues or questions, check:
- `.zencoder/QUICK_REFERENCE.md`
- `.zencoder/README_START_HERE.md`