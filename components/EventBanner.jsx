
import { useEffect } from "react";
import { View, Text, StyleSheet, useWindowDimensions } from "react-native";
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSequence,
    withTiming,
} from "react-native-reanimated";

const EventBanner = ({ event }) => {
    const { width } = useWindowDimensions();

    const translateX = useSharedValue(-width);
    const opacity = useSharedValue(0);

    useEffect(() => {
        if (!event) return;

        // Comienza fuera de la pantalla, por la izquierda.
        translateX.value = -width;
        opacity.value = 0;

        // 1. Entra en el centro en 0,6 segundos.
        // 2. Permanece visible durante 2 segundos.
        // 3. Sale por la derecha en 0,6 segundos.
        translateX.value = withSequence(
            withTiming(0, { duration: 600 }),
            withTiming(0, { duration: 2000 }),
            withTiming(width, { duration: 600 })
        );

        opacity.value = withSequence(
            withTiming(1, { duration: 150 }),
            withTiming(1, { duration: 2900 }),
            withTiming(0, { duration: 150 })
        );
    }, [event?.id, width, translateX, opacity]);

    const animatedStyle = useAnimatedStyle(() => ({
        opacity: opacity.value,
        transform: [{ translateX: translateX.value }],
    }));

    if (!event) return null;

    const color = event.color ?? "#FACC15";
    const isRound = event.type === "round";
    const isTurn = event.type === "turn";

    return (
        <Animated.View
            pointerEvents="none"
            style={[
                styles.banner,
                { borderColor: color },
                animatedStyle,
            ]}
        >
            <View
                style={[
                    styles.accent,
                    { backgroundColor: color },
                ]}
            />

            {(isRound || isTurn) && (
                <Text style={styles.eyebrow}>
                    {isRound ? "⚔️ NUEVA RONDA" : "🎲 CAMBIO DE TURNO"}
                </Text>
            )}

            <Text style={[styles.title, { color }]}>
                {event.title}
            </Text>

            {!!event.subtitle && (
                <Text style={styles.subtitle}>
                    {event.subtitle}
                </Text>
            )}
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    banner: {
        position: "absolute",
        top: "40%",
        left: 0,
        width: "100%",
        paddingVertical: 22,
        paddingHorizontal: 20,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "rgba(12, 15, 25, 0.98)",
        borderTopWidth: 2,
        borderBottomWidth: 2,
        elevation: 15,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.45,
        shadowRadius: 10,
        zIndex: 999,
    },
    accent: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        height: 4,
    },
    eyebrow: {
        color: "#D1D5DB",
        fontSize: 11,
        fontWeight: "900",
        letterSpacing: 2.5,
        marginBottom: 10,
        textAlign: "center",
    },
    title: {
        fontSize: 28,
        fontWeight: "900",
        textAlign: "center",
    },
    subtitle: {
        color: "#FFFFFF",
        fontSize: 16,
        fontWeight: "700",
        textAlign: "center",
        marginTop: 10,
        lineHeight: 23,
    },
});

export default EventBanner;
