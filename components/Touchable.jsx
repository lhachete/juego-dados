import { useState } from "react";
import { Pressable } from "react-native";

const Touchable = ({
    style,
    activeOpacity = 0.7,
    disabled,
    onPressIn,
    onPressOut,
    children,
    ...rest
}) => {
    const [pressed, setPressed] = useState(false);

    return (
        <Pressable
            {...rest}
            disabled={disabled}
            onPressIn={(e) => {
                setPressed(true);
                onPressIn?.(e);
            }}
            onPressOut={(e) => {
                setPressed(false);
                onPressOut?.(e);
            }}
            style={[style, pressed && !disabled && { opacity: activeOpacity }]}
        >
            {children}
        </Pressable>
    );
};

export default Touchable;