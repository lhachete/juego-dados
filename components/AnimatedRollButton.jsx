
import { useEffect } from "react";
import { Pressable, Text, StyleSheet } from "react-native";
import Animated, {
    cancelAnimation,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withSequence,
    withTiming,
} from "react-native-reanimated";

const AnimatedRollButton = ({
    isRolling,
    rollsLeft,
    onPress,
    title,
    disabled = false,
}) => {
    const rollBtnScale = useSharedValue(1);

    useEffect(() => {
        if (isRolling || rollsLeft === 0 || disabled) {
            cancelAnimation(rollBtnScale);
            rollBtnScale.value = withTiming(1, {
                duration: 120,
            });

            return;
        }

        rollBtnScale.value = withRepeat(
            withSequence(
                withTiming(1.04, { duration: 900 }),
                withTiming(1, { duration: 900 })
            ),
            -1,
            false
        );

        return () => {
            cancelAnimation(rollBtnScale);
        };
    }, [isRolling, rollsLeft, disabled]);

    const rollBtnAnimatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: rollBtnScale.value }],
    }));

    return (
        <Animated.View style={rollBtnAnimatedStyle}>
            {/* Pressable: TouchableOpacity usa Animated nativo y dentro de una
                vista de Reanimated puede dar "disconnectAnimatedNodeFromView". */}
            {/* Estilo en un array fijo: NativeWind no aplica bien el estilo
                en forma de función ({ pressed }) => ... sobre Pressable. */}
            <Pressable
                style={[
                    styles.rollBtn,
                    disabled && styles.disabledBtn,
                ]}
                onPress={onPress}
                disabled={disabled}
            >
                <Text style={styles.rollBtnText}>
                    {title}
                </Text>
            </Pressable>
        </Animated.View>
    );
};

export default AnimatedRollButton;

const styles = StyleSheet.create({
    rollBtn: {
        marginTop: 20,
        paddingVertical: 14,
        paddingHorizontal: 40,
        backgroundColor: "#FACC15",
        borderRadius: 12,
    },

    rollBtnText: {
        color: "#1F2937",
        fontSize: 18,
        fontWeight: "700",
    },

    disabledBtn: {
        opacity: 0.4,
    },
});
