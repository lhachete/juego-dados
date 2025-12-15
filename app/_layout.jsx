import { Stack } from "expo-router";
import { GameProvider } from "../contexts/GameContext";

export default function RootLayout() {
  return (
    <GameProvider>
      <Stack
        screenOptions={{
          headerShown: false,
          animation: "none",
        }}
      >

        <Stack.Screen
          name="index"
          options={{ gestureEnabled: false }}
        />

        <Stack.Screen
          name="end-game"
          options={{
            gestureEnabled: false,
            headerBackVisible: false,
          }}
        />

        <Stack.Screen
          name="manual-mode"
          options={{ gestureEnabled: true }}
        />

        <Stack.Screen
          name="virtual-mode"
          options={{ gestureEnabled: false }}
        />

      </Stack>
    </GameProvider>
  );
}
