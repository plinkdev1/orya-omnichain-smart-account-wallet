import { Stack } from 'expo-router';

export default function OnboardingLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animationEnabled: true,
      }}
    >
      <Stack.Screen
        name="splash"
        options={{
          animationEnabled: false,
        }}
      />
      <Stack.Screen name="intro" />
      <Stack.Screen name="identity" />
      <Stack.Screen
        name="normie"
        options={{
          animationEnabled: true,
        }}
      />
      <Stack.Screen name="crypto_native" />
      <Stack.Screen name="external" />
      <Stack.Screen name="external/wallet-connect" />
      <Stack.Screen name="external/confirm" />
      <Stack.Screen name="institutional" />
      <Stack.Screen name="inst/kyb-flow" />
      <Stack.Screen name="inst/suite-confirm" />
    </Stack>
  );
}
