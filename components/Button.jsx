import { Pressable, Text } from "react-native";

const Button = ({ title, onPress, variant = "filled" }) => {
  const baseClass = "w-48 py-3 rounded-lg items-center justify-center mb-4";
  const filledClass = "bg-yellow-500";
  const outlineClass = "border border-white";

  const textClass = variant === "filled" ? "text-black text-lg font-semibold" : "text-white text-lg font-semibold";

  return (
    <Pressable
      className={`${baseClass} ${variant === "filled" ? filledClass : outlineClass}`}
      onPress={onPress}
    >
      <Text className={textClass}>{title}</Text>
    </Pressable>
  );
};

export default Button;
