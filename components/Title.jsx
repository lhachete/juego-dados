import { Text } from "react-native";

const Title = ({ children }) => {
    return (
        <Text
            className="text-5xl font-extrabold mb-4 tracking-widest text-yellow-400"
            style={{
                textShadowColor: 'rgba(255, 215, 215, 0.5)',
                textShadowOffset: { width: 2, height: 2 },
                textShadowRadius: 8,
                lineHeight: 70, // ajusta según el tamaño del texto
            }}
        >
            {children}
        </Text>

    );
};

export default Title;