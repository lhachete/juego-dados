import { View, Image, StyleSheet } from "react-native";
import { Link } from "expo-router";
import Button from "../components/Button";
import Title from "../components/Title";
import logo from "../assets/logo.png";
import TextButton from "../components/TextButton";
import { useBlockBack } from "../hooks/useBlockBack";

const Index = () => {
    useBlockBack(true);
    return (
        <View style={styles.container}>

            {/* Título */}
            <Title>Royal Dices</Title>

            {/* Imagen */}
            <Image
                source={logo}
                style={styles.logo}
                resizeMode="contain"
            />

            {/* Jugar → Navega al GameMode, como hacer push */}
            <Link href="/game-mode" asChild>
                <Button title="Jugar" variant="filled" />
            </Link>

            {/* Botón Reglas solo texto subrayado */}
            <TextButton title="Reglas" onPress={() => console.log("Reglas presionado")} />

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
    logo: {
        width: 224, // w-56 (56 * 4 = 224px)
        height: 224, // h-56
        marginBottom: 20, // mb-5 (5 * 4 = 20px)
    },
});

export default Index;
