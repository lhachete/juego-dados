import { useEffect } from "react";
import { useNavigation } from "@react-navigation/native";
import { router } from "expo-router";

export const useBlockBack = (enabled, fallback) => {
    const navigation = useNavigation();

    useEffect(() => {
        if (!enabled) return;

        const unsubscribe = navigation.addListener("beforeRemove", (e) => {
            // 🔹 SOLO bloquear el BACK físico / gesto
            if (e.data.action.type !== "POP") {
                return;
            }

            e.preventDefault();

            if (fallback) {
                router.replace(fallback);
            }
        });

        return unsubscribe;
    }, [navigation, enabled, fallback]);
};
