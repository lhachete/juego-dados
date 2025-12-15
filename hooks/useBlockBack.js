import { BackHandler } from "react-native";
import { useFocusEffect } from "expo-router";
import { useCallback } from "react";

export function useBlockBack(enabled = true, onBack) {
    useFocusEffect(
        useCallback(() => {
            if (!enabled) return;

            const onBackPress = () => {
                if (onBack) {
                    onBack();
                }
                return true; // ⛔ bloquea el back del sistema
            };

            const sub = BackHandler.addEventListener(
                "hardwareBackPress",
                onBackPress
            );

            return () => sub.remove();
        }, [enabled, onBack])
    );
}
