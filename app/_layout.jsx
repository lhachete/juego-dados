import { Text, View } from 'react-native';
import { Slot } from 'expo-router';

const Layout = () => {

        return (
            <View className="flex-1 justify-center items-center bg-gray-900 px-4">
                <Text className="text-white text-2xl mt-10">Layout Principal Layout PrincipalLayout PrincipalLayout PrincipalLayout PrincipalLayout Principal</Text>
                <Slot />
            </View>
        )
    }

export default Layout;