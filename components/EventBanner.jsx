
import { useEffect } from "react";
import { View, Text, StyleSheet, useWindowDimensions, Image } from "react-native";
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

        // Transición directa: cambia el contenido sin volver a entrar
        // desde la izquierda.
        if (event.transition) {
            opacity.value = withSequence(
                withTiming(0, { duration: 120 }),
                withTiming(1, { duration: 180 }),
                withTiming(1, { duration: 2000 }),
                withTiming(0, { duration: 600 })
            );

            translateX.value = withSequence(
                withTiming(0, { duration: 1 }),
                withTiming(0, { duration: 2300 }),
                withTiming(width, { duration: 600 })
            );

            return;
        }

        // Animación normal: entra por la izquierda,
        // permanece 2 segundos y sale por la derecha.
        translateX.value = -width;
        opacity.value = 0;

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
    const isScore = event.type === "score";

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

            {isScore ? (
                <>
                    <Text style={styles.points}>
                        +{event.points} puntos
                    </Text>


                    <View style={styles.scoreDescriptionRow}>
                        <Text style={styles.scoreDescription}>
                            {event.player} anotó {event.faceCount}{" "}
                            {event.faceCount === 1 ? "figura" : "figuras"} de
                        </Text>

                        {event.faceImage && (
                            <Image
                                source={event.faceImage}
                                style={styles.scoreFaceImage}
                                resizeMode="contain"
                            />
                        )}
                    </View>


                    {!!event.nextPlayer && (
                        <Text style={styles.nextPlayer}>
                            Turno de {event.nextPlayer}
                        </Text>
                    )}
                </>
            ) : (
                <>
                    <Text style={styles.eyebrow}>
                        {isRound ? "⚔️ NUEVA RONDA ⚔️" : event.title}
                    </Text>

                    <Text
                        style={[
                            styles.title,
                            { color },
                        ]}
                    >
                        {isRound ? event.title : ""}
                    </Text>

                    {!!event.subtitle && (
                        <Text style={styles.subtitle}>
                            {event.subtitle}
                        </Text>
                    )}
                </>
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
    points: {
        color: "#FACC15",
        fontSize: 36,
        fontWeight: "900",
        textAlign: "center",
        letterSpacing: 0.5,
    },
    scoreDescription: {
        color: "#FFFFFF",
        fontSize: 16,
        fontWeight: "700",
        textAlign: "center",
        marginTop: 8,
        lineHeight: 23,
    },
    nextPlayer: {
        color: "#FACC15",
        fontSize: 20,
        fontWeight: "900",
        textAlign: "center",
        marginTop: 12,
    },
    eyebrow: {
        color: "#93C5FD",
        fontSize: 12,
        fontWeight: "900",
        letterSpacing: 2.5,
        marginBottom: 10,
        textAlign: "center",
    },
    title: {
        fontSize: 34,
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

    scoreDescriptionRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        flexWrap: "wrap",
        marginTop: 8,
        gap: 7,
    },
    scoreDescription: {
        color: "#FFFFFF",
        fontSize: 16,
        fontWeight: "700",
        textAlign: "center",
        lineHeight: 28,
    },
    scoreFaceImage: {
        width: 27,
        height: 27,
    },

});

export default EventBanner;
