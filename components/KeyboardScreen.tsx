import { ReactNode, createContext, useContext, useRef } from 'react';
import { ScrollView, Platform, StyleSheet, StyleProp, ViewStyle, findNodeHandle } from 'react-native';

/**
 * Context yang nyediain fungsi "scroll ke input yang lagi fokus" ke anak-anak
 * KeyboardScreen. Dipakai lewat hook `useKeyboardScroll()` di FormField / raw
 * TextInput yang butuh auto-scroll pas di-tap.
 */
const KeyboardScrollContext = createContext<{ scrollToInput: (node: any) => void } | null>(null);

export function useKeyboardScroll() {
  return useContext(KeyboardScrollContext);
}

/**
 * Wrapper standar buat layar berisi form (TextInput dkk).
 *
 * Sebelumnya pakai KeyboardAvoidingView yang "mendorong" seluruh layar ke
 * atas pas keyboard muncul - di Android ini sering bikin layout mantul aneh
 * (behavior="height" motong tinggi ScrollView tiba-tiba). Sekarang diganti
 * jadi ScrollView polos + auto-scroll ke posisi input yang lagi difokus
 * (mirip behavior form native), lewat `scrollResponderScrollNativeHandleToKeyboard`
 * yang udah built-in di RN - gak perlu tambah dependency baru.
 */
export function KeyboardScreen({
  children,
  style,
  contentContainerStyle,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  contentContainerStyle?: StyleProp<ViewStyle>;
}) {
  const scrollRef = useRef<ScrollView>(null);

  function scrollToInput(node: any) {
    const nodeHandle = findNodeHandle(node);
    if (!nodeHandle) return;
    // Delay dikit biar keyboard udah mulai naik & layout kelar settle sebelum
    // dihitung posisinya - tanpa ini di Android kadang keukur posisi lama.
    setTimeout(() => {
      const responder = scrollRef.current?.getScrollResponder?.();
      // @ts-ignore - method ini ada di runtime ScrollView RN walau gak ke-type di RN types
      responder?.scrollResponderScrollNativeHandleToKeyboard(nodeHandle, 80, true);
    }, Platform.OS === 'android' ? 100 : 50);
  }

  return (
    <KeyboardScrollContext.Provider value={{ scrollToInput }}>
      <ScrollView
        ref={scrollRef}
        style={[styles.flex, style]}
        contentContainerStyle={contentContainerStyle}
        keyboardShouldPersistTaps="handled"
      >
        {children}
      </ScrollView>
    </KeyboardScrollContext.Provider>
  );
}

const styles = StyleSheet.create({ flex: { flex: 1 } });
