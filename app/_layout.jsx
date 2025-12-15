import { Stack } from "expo-router";
import { GameProvider } from "../contexts/GameContext";

export default function RootLayout() {
  return (
    <GameProvider>
      <Stack>

        {/* Pantalla final: no se puede volver */}
        <Stack.Screen
          name="end-game"
          options={{
            gestureEnabled: false, // Deshabilitar gesto de volver (swipe)
            headerBackVisible: false,
          }}
        />

        {/* Modos de juego: no se puede volver sin control */}
        <Stack.Screen
          name="manual-mode"
          options={{ gestureEnabled: false }}
        />
        <Stack.Screen
          name="virtual-mode"
          options={{ gestureEnabled: false }}
        />

        {/* El resto puede usar comportamiento normal */}
      </Stack>
    </GameProvider>
  );
}
