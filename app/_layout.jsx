import { Stack } from "expo-router";
import { GameProvider } from "../contexts/GameContext";
import { ReducedMotionConfig, ReduceMotion } from "react-native-reanimated";

export default function RootLayout() {
  return (
    <GameProvider>
      
      <ReducedMotionConfig mode={ReduceMotion.Never} />
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
