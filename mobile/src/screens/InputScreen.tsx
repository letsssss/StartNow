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
      <View style={styles.hero}>
        <Text style={styles.heroTitle}>텍스트를 워크플로우로</Text>
        <Text style={styles.heroDesc}>
          AI가 입력한 문장을 분석해 논리적인 실행 흐름을 자동 생성합니다.
        </Text>
      </View>
      <Text style={styles.inputLabel}>
        순서나 정리는 신경 쓰지 마세요. 생각나는 대로 적어 주세요.
      </Text>
      <TextInput
        style={styles.input}
        placeholder="예: 빨래 돌리고, 밥 먹고, 공부해야 하는데..."
        placeholderTextColor="#8E8E93"
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
            <Text style={styles.buttonText}>생성 중...</Text>
          </>
        ) : (
          <Text style={styles.buttonText}>AI 워크플로우 생성</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    paddingTop: 40,
    backgroundColor: "#1C1C1E",
  },
  hero: {
    marginBottom: 24,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 8,
  },
  heroDesc: {
    fontSize: 15,
    color: "#8E8E93",
    lineHeight: 22,
  },
  inputLabel: {
    fontSize: 14,
    color: "#8E8E93",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#2C2C2E",
    borderWidth: 1,
    borderColor: "#3A3A3C",
    borderRadius: 12,
    padding: 14,
    minHeight: 120,
    textAlignVertical: "top",
    marginBottom: 16,
    fontSize: 16,
    color: "#fff",
  },
  button: {
    backgroundColor: "#007AFF",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
  },
  spinner: { marginRight: 0 },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
});
