import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import { structureText } from "../infra/apiClient";
import { setLastStructuredResult, setLastInputText, getLastInputText } from "../state/session";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../../App";

type Props = NativeStackScreenProps<RootStackParamList, "Input">;

export function InputScreen({ navigation }: Props) {
  const [text, setText] = useState(() => getLastInputText());
  const [loading, setLoading] = useState(false);

  const handleStructure = async () => {
    const trimmed = text.trim();
    if (!trimmed) {
      Alert.alert("입력", "텍스트를 입력해 주세요.");
      return;
    }

    setLoading(true);
    try {
      const result = await structureText(trimmed);
      if (result.ok) {
        setLastStructuredResult(result.data);
        setLastInputText(trimmed);
        navigation.replace("Result");
      } else {
        Alert.alert("오류", "응답 형식 오류");
        if (__DEV__ && result.error?.message) {
          console.log("[structure] 응답 형식 오류:", result.error.message);
        }
      }
    } catch (e) {
      Alert.alert("오류", "서버 연결 실패");
      const BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;
      const endpoint = "/api/structure";
      if (__DEV__) {
        const message = e instanceof Error ? e.message : String(e);
        console.log("[structure] 네트워크 실패:", {
          message,
          BASE_URL: BASE_URL ?? "(미설정)",
          endpoint,
          hint: "같은 WiFi 확인, 백엔드 포트 3000 또는 3001에서 실행 중인지 확인, Windows 방화벽 인바운드 허용",
        });
        if (!BASE_URL) {
          console.log("[structure] .env에 EXPO_PUBLIC_API_BASE_URL=http://PC_IP:3000 또는 :3001 설정 후 'npx expo start -c' 재시작");
        }
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>할 일/고민을 적어 주세요</Text>
      <TextInput
        style={styles.input}
        placeholder="예: 내일 발표 준비해야 하는데..."
        placeholderTextColor="#999"
        multiline
        value={text}
        onChangeText={setText}
        editable={!loading}
      />
      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleStructure}
        disabled={loading}
      >
        {loading ? (
          <>
            <ActivityIndicator color="#fff" style={styles.spinner} />
            <Text style={styles.buttonText}>정리 중...</Text>
          </>
        ) : (
          <Text style={styles.buttonText}>정리하기</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    paddingTop: 60,
    backgroundColor: "#fff",
  },
  label: { fontSize: 16, fontWeight: "600", marginBottom: 8 },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 12,
    minHeight: 120,
    textAlignVertical: "top",
    marginBottom: 16,
  },
  button: {
    backgroundColor: "#007AFF",
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
  },
  spinner: { marginRight: 0 },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
});
