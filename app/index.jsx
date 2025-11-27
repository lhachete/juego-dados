import { View, Image } from "react-native";
import { Link } from "expo-router";
import Button from "../components/Button";
import Title from "../components/Title";
import logo from "../assets/logo.png";
import TextButton from "../components/TextButton";

const Index = () => {
    return (
        <View className="flex-1 justify-center items-center bg-gray-900 px-4">

            {/* Título */}
            <Title>Royal Dices</Title>

            {/* Imagen */}
            <Image
                source={logo}
                className="w-56 h-56 mb-5"
                resizeMode="contain"
            />

            {/* Jugar → Navega al GameMode */}
            <Link href="/game-mode" asChild>
                <Button title="Jugar" variant="filled" />
            </Link>
            {/* Botón Reglas solo texto subrayado */}
            <TextButton title="Reglas" onPress={() => console.log("Reglas presionado")} />

        </View>
    );
}

export default Index;