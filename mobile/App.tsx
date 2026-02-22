import React from "react";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { InputScreen } from "./src/screens/InputScreen";
import { ResultScreen } from "./src/screens/ResultScreen";
import { HistoryScreen } from "./src/screens/HistoryScreen";

export type RootStackParamList = {
  Input: undefined;
  Result: undefined;
  History: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <NavigationContainer>
        <StatusBar style="auto" />
        <Stack.Navigator
          initialRouteName="Input"
          screenOptions={{ headerShown: true, title: "StartNow" }}
        >
          <Stack.Screen name="Input" component={InputScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Result" component={ResultScreen} options={{ title: "결과" }} />
          <Stack.Screen name="History" component={HistoryScreen} options={{ headerShown: false }} />
        </Stack.Navigator>
      </NavigationContainer>
    </GestureHandlerRootView>
  );
}
