import { View, Image } from "react-native";
import Button from "../components/Button";
import Title from "../components/Title";
import logo from "../assets/logo.png";
import TextButton from "../components/TextButton";

const HomeScreen = () => {
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

            {/* Botones */}
            <Button title="Jugar" onPress={() => console.log("Jugar presionado")} variant="filled" />
            {/* Botón Reglas solo texto subrayado */}
            <TextButton title="Reglas" onPress={() => console.log("Reglas presionado")} />

        </View>
    );
};

export default HomeScreen;