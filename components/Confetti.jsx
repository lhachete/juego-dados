import { useEffect, useMemo } from "react";
import { View, StyleSheet, useWindowDimensions } from "react-native";
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withDelay,
    withRepeat,
    withTiming,
    Easing,
    cancelAnimation,
} from "react-native-reanimated";
 
const COLORS = ["#FACC15", "#F87171", "#60A5FA", "#34D399", "#A78BFA", "#FB923C", "#ffffff"];
 
const Piece = ({ x, size, color, delay, duration, drift, spin, height }) => {
    const progress = useSharedValue(0);
 
    useEffect(() => {
        progress.value = withDelay(
            delay,
            withRepeat(
                withTiming(1, { duration, easing: Easing.linear }),
                -1,
                false
            )
        );
        return () => cancelAnimation(progress);
    }, []);
 
    const style = useAnimatedStyle(() => {
        const p = progress.value;
        return {
            opacity: p === 0 ? 0 : 1,
            transform: [
                { translateY: -40 + p * (height + 80) },
                { translateX: Math.sin(p * Math.PI * 4) * drift },
                { rotate: `${p * spin}deg` },
                { rotateX: `${p * spin * 1.5}deg` },
            ],
        };
    });
 
    return (
        <Animated.View
            style={[
                styles.piece,
                { left: x, width: size, height: size * 0.45, backgroundColor: color },
                style,
            ]}
        />
    );
};
 
const Confetti = ({ count = 45 }) => {
    const { width, height } = useWindowDimensions();
 
    const pieces = useMemo(
        () =>
            Array.from({ length: count }, (_, i) => ({
                key: i,
                x: Math.random() * width,
                size: 8 + Math.random() * 8,
                color: COLORS[i % COLORS.length],
                delay: Math.random() * 2500,
                duration: 3000 + Math.random() * 2500,
                drift: 10 + Math.random() * 25,
                spin: (Math.random() > 0.5 ? 1 : -1) * (360 + Math.random() * 720),
            })),
        [count, width]
    );
 
    return (
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
            {pieces.map(({ key, ...p }) => (
                <Piece key={key} {...p} height={height} />
            ))}
        </View>
    );
};
 
export default Confetti;
 
const styles = StyleSheet.create({
    piece: {
        position: "absolute",
        top: 0,
        borderRadius: 2,
    },
});
 