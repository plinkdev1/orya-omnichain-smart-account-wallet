import { Stack } from 'expo-router'

export default function AtriumLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="atelier" />
      <Stack.Screen name="beacon" />
      <Stack.Screen name="conflux" />
      <Stack.Screen name="curator" />
      <Stack.Screen name="estate" />
      <Stack.Screen name="forum" />
      <Stack.Screen name="fragment" />
      <Stack.Screen name="haven" />
      <Stack.Screen name="horizon" />
      <Stack.Screen name="ledger" />
      <Stack.Screen name="lumen" />
      <Stack.Screen name="panorama" />
      <Stack.Screen name="shield" />
      <Stack.Screen name="vaultline" />
    </Stack>
  )
}