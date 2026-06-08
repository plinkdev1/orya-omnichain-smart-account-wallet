import { Stack } from 'expo-router';

export default function NormieLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animationEnabled: true,
      }}
    >
      <Stack.Screen
        name="social-login"
        options={{
          animationEnabled: true,
        }}
      />
      <Stack.Screen
        name="card-setup"
        options={{
          animationEnabled: true,
        }}
      />
      <Stack.Screen
        name="biometric-setup"
        options={{
          animationEnabled: true,
        }}
      />
    </Stack>
  );
}
