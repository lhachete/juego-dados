import { useState } from "react";
import { View, Image, StyleSheet } from "react-native";
import { router } from "expo-router";
import Animated, { FadeInDown, FadeOutUp } from "react-native-reanimated";
import Button from "../components/Button";
import Title from "../components/Title";
import logo from "../assets/logo.png";
import TextButton from "../components/TextButton";

const Index = () => {
    // Al pulsar "Jugar" se despliega la elección Local / Online.
    const [showPlayOptions, setShowPlayOptions] = useState(false);

    return (
        <View style={styles.container}>

            <Title>Royal Dices</Title>

            <Image
                source={logo}
                style={styles.logo}
                resizeMode="contain"
            />

            <Button
                title="Jugar"
                variant={showPlayOptions ? "outline" : "filled"}
                onPress={() => setShowPlayOptions((v) => !v)}
            />

            {showPlayOptions && (
                <Animated.View
                    style={styles.playOptions}
                    entering={FadeInDown.duration(250)}
                    exiting={FadeOutUp.duration(180)}
                >
                    <Button
                        title="Jugar en local"
                        variant="filled"
                        onPress={() => router.push("/game-mode")}
                    />

                    {/* Multijugador con un dispositivo por jugador (Supabase). */}
                    <Button
                        title="Jugar online"
                        variant="outline"
                        onPress={() => router.push("/online")}
                    />
                </Animated.View>
            )}

            {/* Botón Reglas solo texto subrayado */}
            <TextButton title="Reglas" onPress={() => router.push("/rules")} />

        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#111827", // bg-gray-900
        paddingHorizontal: 16, // px-4
    },
    playOptions: {
        alignItems: "center",
        marginBottom: 8,
    },
    logo: {
        width: 224, // w-56 (56 * 4 = 224px)
        height: 224, // h-56
        marginBottom: 20, // mb-5 (5 * 4 = 20px)
    },
});

export default Index;
