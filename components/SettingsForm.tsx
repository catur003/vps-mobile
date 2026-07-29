import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { FormField } from './FormField';
import { Card } from './Card';
import { Button } from './Button';
import { ThemePicker } from './ThemePicker';
import { AppModal, AppModalKind, AppModalButton } from './AppModal';
import { AuroraBackground } from './AuroraBackground';
import { colors, radius, spacing } from '@/lib/theme';
import { useTabTopPadding } from '@/lib/useTopInset';
import { getApiKey, getBaseUrl, setApiKey, setBaseUrl, clearCredentials } from '@/lib/storage';
import { healthCheck } from '@/lib/api';

interface ModalState {
  visible: boolean;
  kind: AppModalKind;
  title: string;
  message?: string;
  buttons?: AppModalButton[];
}

const MODAL_CLOSED: ModalState = { visible: false, kind: 'info', title: '' };

interface SettingsFormProps {
  /**
   * 'tab'   - dipakai di tab "Setelan" (Tabs headerShown: false) - butuh
   *           padding atas dari safe-area insets sendiri + header custom.
   * 'modal' - dipakai di layar `/settings` yang dibuka lewat Stack modal
   *           (sudah punya native header "Pengaturan Koneksi") - JANGAN
   *           dobel padding/header.
   */
  variant?: 'tab' | 'modal';
}

export function SettingsForm({ variant = 'modal' }: SettingsFormProps) {
  const router = useRouter();
  const topPadding = useTabTopPadding(spacing.lg);

  const [baseUrl, setBaseUrlInput] = useState('');
  const [apiKey, setApiKeyInput] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [testing, setTesting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [modal, setModal] = useState<ModalState>(MODAL_CLOSED);

  useEffect(() => {
    (async () => {
      const [url, key] = await Promise.all([getBaseUrl(), getApiKey()]);
      if (url) setBaseUrlInput(url);
      if (key) setApiKeyInput(key);
    })();
  }, []);

  function closeModal() {
    setModal(MODAL_CLOSED);
  }

  function showInfo(kind: AppModalKind, title: string, message?: string) {
    setModal({ visible: true, kind, title, message, buttons: [{ label: 'OK', onPress: closeModal }] });
  }

  async function handleTest() {
    if (!baseUrl.trim()) {
      showInfo('warning', 'Isi dulu', 'URL API wajib diisi, mis. https://vps-anda.com/api');
      return;
    }
    setTesting(true);
    const ok = await healthCheck(baseUrl.trim());
    setTesting(false);
    showInfo(
      ok ? 'success' : 'error',
      ok ? 'Berhasil' : 'Gagal',
      ok ? 'Server bisa dihubungi.' : 'Server tidak merespons di URL ini. Cek lagi alamatnya.'
    );
  }

  async function handleSave() {
    if (!baseUrl.trim() || !apiKey.trim()) {
      showInfo('warning', 'Belum lengkap', 'URL API dan API Key wajib diisi.');
      return;
    }
    setSaving(true);
    await setBaseUrl(baseUrl.trim());
    await setApiKey(apiKey.trim());
    setSaving(false);
    router.replace('/(tabs)');
  }

  function handleReset() {
    setModal({
      visible: true,
      kind: 'warning',
      title: 'Hapus koneksi?',
      message: 'API key yang tersimpan di HP ini akan dihapus. Anda perlu isi ulang URL & API key buat pakai app lagi.',
      buttons: [
        { label: 'Batal', onPress: closeModal, variant: 'secondary' },
        {
          label: 'Hapus',
          variant: 'danger',
          onPress: async () => {
            await clearCredentials();
            setBaseUrlInput('');
            setApiKeyInput('');
            closeModal();
            router.replace('/settings');
          },
        },
      ],
    });
  }

  return (
    <View style={{ flex: 1 }}>
      {variant === 'tab' && <AuroraBackground />}
      <ScrollView
        // 'tab' - AuroraBackground dipasang langsung di atas (di dalam
        // wrapper View yang sama), jadi transparent biar nembus. 'modal' -
        // dipakai juga buat onboarding pertama kali SEBELUM masuk (tabs)
        // sama sekali (gak ada Aurora dipasang), jadi TETAP solid colors.bg
        // biar gak nampilin layar kosong/transparan yang aneh.
        style={{ flex: 1, backgroundColor: variant === 'tab' ? 'transparent' : colors.bg }}
        contentContainerStyle={[styles.content, variant === 'tab' && { paddingTop: topPadding }]}
      >
      {variant === 'tab' && (
        <>
          <Text style={styles.eyebrow}>ZENHUB VPS</Text>
          <Text style={styles.title}>Setelan</Text>
        </>
      )}

      <Card style={styles.introCard}>
        <View style={styles.introIconWrap}>
          <Ionicons name="link-outline" size={18} color={colors.accent} />
        </View>
        <Text style={styles.intro}>
          Hubungkan app ke API vps-manager di server Anda. API key didapat dari perintah{' '}
          <Text style={styles.code}>npm run api:keygen</Text> di VPS. Server API jalan di localhost:4001 secara
          default — pastikan sudah dipasang reverse proxy + SSL lewat Nginx, lalu isi URL publiknya di bawah.
        </Text>
      </Card>

      {variant === 'tab' && (
        <>
          <Text style={styles.sectionTitle}>Tampilan</Text>
          <ThemePicker />
        </>
      )}

      <Text style={styles.sectionTitle}>Koneksi Server</Text>
      <Card>
        <FormField
          label="URL API"
          placeholder="https://vps-anda.com"
          keyboardType="url"
          value={baseUrl}
          onChangeText={setBaseUrlInput}
        />
        <FormField
          label="API Key"
          placeholder="Tempel API key di sini"
          secureTextEntry={!showKey}
          value={apiKey}
          onChangeText={setApiKeyInput}
          rightElement={
            <Pressable hitSlop={8} onPress={() => setShowKey((v) => !v)}>
              <Ionicons name={showKey ? 'eye-off-outline' : 'eye-outline'} size={18} color={colors.inkFaint} />
            </Pressable>
          }
        />
        <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xs }}>
          <View style={{ flex: 1 }}>
            <Button label="Tes Koneksi" variant="secondary" loading={testing} onPress={handleTest} />
          </View>
          <View style={{ flex: 1 }}>
            <Button label="Simpan" loading={saving} onPress={handleSave} />
          </View>
        </View>
      </Card>

      <Text style={styles.sectionTitle}>Data & Cache</Text>
      <Card onPress={() => router.push('/cleanup')} style={styles.rowCard}>
        <View style={[styles.rowIconWrap, { backgroundColor: colors.blueSoft }]}>
          <Ionicons name="trash-bin-outline" size={18} color={colors.blue} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.rowTitle}>Bersihkan Cache Project</Text>
          <Text style={styles.rowSub}>Hapus .next/cache & node_modules/.cache tiap project di VPS</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={colors.inkFaint} />
      </Card>

      <Text style={[styles.sectionTitle, { color: colors.red }]}>Zona Berbahaya</Text>
      <Card style={styles.dangerCard} onPress={handleReset}>
        <View style={[styles.rowIconWrap, { backgroundColor: colors.redSoft }]}>
          <Ionicons name="log-out-outline" size={18} color={colors.red} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.rowTitle, { color: colors.red }]}>Hapus Koneksi Tersimpan</Text>
          <Text style={styles.rowSub}>URL & API key akan dihapus dari HP ini</Text>
        </View>
      </Card>

      <AppModal
        visible={modal.visible}
        kind={modal.kind}
        title={modal.title}
        message={modal.message}
        buttons={modal.buttons}
        onRequestClose={closeModal}
      />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  eyebrow: { fontSize: 11, fontWeight: '700', color: colors.inkFaint, letterSpacing: 1 },
  title: { fontSize: 24, fontWeight: '800', color: colors.ink, marginBottom: spacing.lg },
  introCard: { flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start' },
  introIconWrap: {
    width: 32,
    height: 32,
    borderRadius: radius.md,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  intro: { flex: 1, fontSize: 13, color: colors.inkMuted, lineHeight: 19 },
  code: { fontFamily: 'monospace', color: colors.ink, backgroundColor: colors.divider },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.inkFaint,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  rowCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  rowIconWrap: { width: 36, height: 36, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  rowTitle: { fontSize: 14, fontWeight: '700', color: colors.ink },
  rowSub: { fontSize: 11.5, color: colors.inkMuted, marginTop: 2 },
  dangerCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, borderColor: colors.redSoft },
});
