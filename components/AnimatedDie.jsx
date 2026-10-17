
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

const AnimatedDie = ({
    face,
    faces,
    locked,
    isRolling,
    delay = 0,
    disabled = false,
}) => {
    const [displayFace, setDisplayFace] = useState(face ?? null);

    const intervalRef = useRef(null);
    const timeoutRef = useRef(null);

    const rotate = useSharedValue(0);
    const scale = useSharedValue(1);
    const translateY = useSharedValue(0);

    // Limpiar temporizadores al desmontar el componente.
    useEffect(() => {
        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }

            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }

            cancelAnimation(rotate);
            cancelAnimation(scale);
            cancelAnimation(translateY);
        };
    }, []);

    useEffect(() => {
        // Si el dado está bloqueado, no se anima.
        if (locked) {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }

            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
                timeoutRef.current = null;
            }

            setDisplayFace(face ?? null);

            cancelAnimation(rotate);
            cancelAnimation(scale);
            cancelAnimation(translateY);

            rotate.value = 0;
            scale.value = 1;
            translateY.value = 0;

            return;
        }

        // Cuando termina la tirada, mostrar la cara definitiva.
        if (!isRolling) {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }

            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
                timeoutRef.current = null;
            }

            setDisplayFace(face ?? null);

            rotate.value = withTiming(0, { duration: 120 });
            scale.value = withSpring(1, {
                damping: 10,
                stiffness: 180,
            });
            translateY.value = withSpring(0, {
                damping: 10,
                stiffness: 180,
            });

            return;
        }

        // Cambiar las caras mientras se simula la tirada.
        intervalRef.current = setInterval(() => {
            if (faces?.length) {
                const randomFace =
                    faces[Math.floor(Math.random() * faces.length)];

                setDisplayFace(randomFace);
            }
        }, 70);

        // Rotación.
        rotate.value = withDelay(
            delay,
            withSequence(
                withTiming(-18, {
                    duration: 90,
                    easing: Easing.out(Easing.quad),
                }),
                withRepeat(
                    withTiming(18, {
                        duration: 100,
                        easing: Easing.linear,
                    }),
                    5,
                    true
                ),
                withTiming(0, {
                    duration: 120,
                    easing: Easing.out(Easing.quad),
                })
            )
        );

        // Efecto de escala.
        scale.value = withDelay(
            delay,
            withSequence(
                withTiming(0.9, { duration: 100 }),
                withTiming(1.08, { duration: 160 }),
                withSpring(1, {
                    damping: 8,
                    stiffness: 220,
                })
            )
        );

        // Pequeño salto vertical.
        translateY.value = withDelay(
            delay,
            withSequence(
                withTiming(-8, {
                    duration: 130,
                    easing: Easing.out(Easing.quad),
                }),
                withSpring(0, {
                    damping: 7,
                    stiffness: 240,
                })
            )
        );

        // Finalizar la animación visual y mostrar el resultado.
        timeoutRef.current = setTimeout(() => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }

            timeoutRef.current = null;
            setDisplayFace(face ?? null);
        }, 620 + delay);

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }

            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
                timeoutRef.current = null;
            }
        };
    }, [isRolling, locked, face, delay, faces]);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [
            { rotate: `${rotate.value}deg` },
            { scale: scale.value },
            { translateY: translateY.value },
        ],
    }));

    return (
        <Animated.View
            style={[
                styles.diceWrapper,
                locked && styles.diceLocked,
                disabled && styles.diceDisabled,
                animatedStyle,
            ]}
        >
            {displayFace && (
                <Image
                    source={displayFace.img}
                    style={styles.diceImg}
                    resizeMode="contain"
                />
            )}
        </Animated.View>
    );
};

export default AnimatedDie;

const styles = StyleSheet.create({
    diceWrapper: {
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
