import { Pressable, Text } from "react-native";

const TextButton = ({ title, onPress }) => {
    return (
        <Pressable onPress={onPress} className="mb-4">
            <Text className="text-white text-lg font-semibold border-b-2 border-white">
                {title}
            </Text>

        </Pressable>
    );
};

export default TextButton;