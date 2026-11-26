import { useState, useEffect, useRef } from "react";
import { Image, StyleSheet } from "react-native";
import Animated, {
    Easing,
    cancelAnimation,
    useAnimatedStyle,
    useSharedValue,
    withDelay,
    withRepeat,
    withSequence,
    withSpring,
    withTiming,
} from "react-native-reanimated";

// Tiempo que dura la animación de un dado (sin contar su retardo).
export const DIE_ROLL_DURATION = 620;

const AnimatedDie = ({
    face,
    faces,
    locked,
    isRolling,
    delay = 0,
    disabled = false,
    enterFrom = "left", // lado por el que entra en la primera tirada
}) => {
    const [displayFace, setDisplayFaceState] = useState(face ?? null);
    // Copia en ref para saber, al empezar una tirada, si el dado estaba vacío.
    const displayFaceRef = useRef(face ?? null);
    const setDisplayFace = (f) => {
        displayFaceRef.current = f;
        setDisplayFaceState(f);
    };

    const intervalRef = useRef(null);
    const startTimeoutRef = useRef(null);
    const revealTimeoutRef = useRef(null);

    const rotate = useSharedValue(0);
    const scale = useSharedValue(1);
    const translateY = useSharedValue(0);
    const translateX = useSharedValue(0);
    const opacity = useSharedValue(1);

    const clearTimers = () => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
        if (startTimeoutRef.current) {
            clearTimeout(startTimeoutRef.current);
            startTimeoutRef.current = null;
        }
        if (revealTimeoutRef.current) {
            clearTimeout(revealTimeoutRef.current);
            revealTimeoutRef.current = null;
        }
    };

    // Limpiar temporizadores al desmontar el componente.
    useEffect(() => {
        return () => {
            clearTimers();
            cancelAnimation(rotate);
            cancelAnimation(scale);
            cancelAnimation(translateY);
            cancelAnimation(translateX);
            cancelAnimation(opacity);
        };
    }, []);

    useEffect(() => {
        // Si el dado está bloqueado, no se anima.
        if (locked) {
            clearTimers();
            setDisplayFace(face ?? null);

            cancelAnimation(rotate);
            cancelAnimation(scale);
            cancelAnimation(translateY);
            cancelAnimation(translateX);
            cancelAnimation(opacity);

            rotate.value = 0;
            scale.value = 1;
            translateY.value = 0;
            translateX.value = 0;
            opacity.value = 1;
            return;
        }

        // Fuera de tirada: mostrar la cara definitiva (o nada si no hay).
        if (!isRolling) {
            clearTimers();
            setDisplayFace(face ?? null);

            opacity.value = withTiming(1, { duration: 120 });
            rotate.value = withTiming(0, { duration: 120 });
            scale.value = withSpring(1, { damping: 10, stiffness: 180 });
            translateY.value = withSpring(0, { damping: 10, stiffness: 180 });
            translateX.value = withSpring(0, { damping: 10, stiffness: 180 });
            return;
        }

        // --- Tirada ---
        const wasEmpty = !displayFaceRef.current;

        if (wasEmpty) {
            // Primera tirada del turno: el dado aún no está en la mesa.
            // Entra rodando desde un lateral cuando le toca según su retardo,
            // con un pequeño bote al llegar.
            const side = enterFrom === "right" ? 1 : -1;

            cancelAnimation(opacity);
            opacity.value = 0;
            translateX.value = side * 260;
            translateY.value = 0;
            scale.value = 0.8;
            rotate.value = side * 200;

            opacity.value = withDelay(delay, withTiming(1, { duration: 100 }));
            translateX.value = withDelay(
                delay,
                withSpring(0, { damping: 11, stiffness: 140, mass: 0.8 })
            );
            translateY.value = withDelay(
                delay,
                withSequence(
                    withTiming(-14, { duration: 160, easing: Easing.out(Easing.quad) }),
                    withTiming(0, { duration: 160, easing: Easing.in(Easing.quad) }),
                    withTiming(-5, { duration: 100, easing: Easing.out(Easing.quad) }),
                    withTiming(0, { duration: 100, easing: Easing.in(Easing.quad) })
                )
            );
            scale.value = withDelay(
                delay,
                withSequence(
                    withTiming(1.08, { duration: 180, easing: Easing.out(Easing.quad) }),
                    withSpring(1, { damping: 8, stiffness: 220 })
                )
            );
            // Va "rodando" hasta pararse.
            rotate.value = withDelay(
                delay,
                withTiming(0, { duration: 560, easing: Easing.out(Easing.cubic) })
            );
        } else {
            // Rotación.
            rotate.value = withDelay(
                delay,
                withSequence(
                    withTiming(-18, { duration: 90, easing: Easing.out(Easing.quad) }),
                    withRepeat(
                        withTiming(18, { duration: 100, easing: Easing.linear }),
                        5,
                        true
                    ),
                    withTiming(0, { duration: 120, easing: Easing.out(Easing.quad) })
                )
            );

            // Efecto de escala.
            scale.value = withDelay(
                delay,
                withSequence(
                    withTiming(0.9, { duration: 100 }),
                    withTiming(1.08, { duration: 160 }),
                    withSpring(1, { damping: 8, stiffness: 220 })
                )
            );

            // Pequeño salto vertical.
            translateY.value = withDelay(
                delay,
                withSequence(
                    withTiming(-8, { duration: 130, easing: Easing.out(Easing.quad) }),
                    withSpring(0, { damping: 7, stiffness: 240 })
                )
            );
        }

        // Cambiar las caras mientras gira, empezando cuando le toca.
        const shuffle = () => {
            if (faces?.length) {
                setDisplayFace(faces[Math.floor(Math.random() * faces.length)]);
            }
        };
        startTimeoutRef.current = setTimeout(() => {
            startTimeoutRef.current = null;
            shuffle();
            intervalRef.current = setInterval(shuffle, 70);
        }, delay);

        // Finalizar la animación visual y mostrar el resultado.
        revealTimeoutRef.current = setTimeout(() => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
            revealTimeoutRef.current = null;
            // Si todavía no hay cara final, seguimos mostrando la última aleatoria
            // en vez de dejar el hueco vacío.
            if (face) setDisplayFace(face);
        }, DIE_ROLL_DURATION + delay);

        return clearTimers;
    }, [isRolling, locked, face, delay, faces]);

    const animatedStyle = useAnimatedStyle(() => ({
        opacity: opacity.value,
        transform: [
            { translateX: translateX.value },
            { translateY: translateY.value },
            { rotate: `${rotate.value}deg` },
            { scale: scale.value },
        ],
    }));

    return (
        <Animated.View
            style={[
                styles.diceWrapper,
                locked && styles.diceLocked,
                animatedStyle,
            ]}
        >
            {displayFace && (
                <Image
                    source={displayFace.img}
                    // La opacidad de "desactivado" va en la imagen porque la
                    // del contenedor la controla la animación.
                    style={[styles.diceImg, disabled && styles.diceDisabled]}
                    resizeMode="contain"
                />
            )}
        </Animated.View>
    );
};

export default AnimatedDie;

const styles = StyleSheet.create({
    // Tamaño fijo: aunque el dado esté vacío ocupa su hueco, así la fila
    // no se recoloca (antes los dados "se apilaban" en la primera tirada).
    diceWrapper: {
        width: 128,
        height: 128,
        borderWidth: 2,
        borderColor: "transparent",
        borderRadius: 12,
        backgroundColor: "transparent",
    },

    diceLocked: {
        borderColor: "#FACC15",
    },

    diceDisabled: {
        opacity: 0.4,
    },

    diceImg: {
        width: 100,
        height: 100,
        margin: 12,
    },
});
