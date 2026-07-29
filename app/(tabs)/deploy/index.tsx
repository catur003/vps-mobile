import { View, Text, StyleSheet, FlatList, Pressable, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '@/components/Card';
import { StatusPill } from '@/components/StatusPill';
import { Fab } from '@/components/Fab';
import { AuroraBackground } from '@/components/AuroraBackground';
import { colors, radius, spacing } from '@/lib/theme';
import { useTabTopPadding } from '@/lib/useTopInset';
import { listJobs, Job } from '@/lib/api';

const TYPE_LABEL: Record<string, string> = {
  deploy_nextjs: 'Deploy',
  deploy_nextjs_retry: 'Retry Deploy',
  ssl_issue: 'Terbitkan SSL',
  project_build: 'Build Manual',
  project_seed: 'Seed Manual',
};

function jobTitle(job: Job): string {
  if (job.type === 'ssl_issue') return String(job.params.domain ?? 'SSL');
  return String(job.params.name ?? job.params.pm2Name ?? job.params.domain ?? job.id.slice(0, 8));
}

export default function JobsScreen() {
  const router = useRouter();
  const topPadding = useTabTopPadding();
  const { data, isLoading, isError, error, refetch, isRefetching } = useQuery({
    queryKey: ['jobs'],
    queryFn: listJobs,
    refetchInterval: 8000,
  });

  const jobs = data ?? [];

  return (
    <View style={styles.screen}>
      <AuroraBackground />
      <FlatList
        data={jobs}
        keyExtractor={(j) => j.id}
        contentContainerStyle={[styles.content, { paddingTop: topPadding }]}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.accent} />}
        ListHeaderComponent={
          <>
            <Card onPress={() => router.push('/(tabs)/deploy/nginx')} style={styles.nginxLink}>
              <View style={styles.row}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.type}>NGINX</Text>
                  <Text style={styles.name}>Kelola Site & Domain</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.inkFaint} />
              </View>
            </Card>
            <Card onPress={() => router.push('/(tabs)/deploy/backup')} style={styles.backupLink}>
              <View style={styles.row}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.type}>BACKUP</Text>
                  <Text style={styles.name}>Backup & Restore</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.inkFaint} />
              </View>
            </Card>
            <Text style={styles.sectionTitle}>{isLoading ? 'Memuat...' : `${jobs.length} Job`}</Text>
          </>
        }
        ListEmptyComponent={
          !isLoading ? (
            <Card>
              <Text style={styles.emptyText}>
                {isError ? `Gagal ambil daftar job: ${(error as Error)?.message}` : 'Belum ada job deploy/SSL.'}
              </Text>
            </Card>
          ) : null
        }
        renderItem={({ item }) => (
          <Card onPress={() => router.push(`/(tabs)/deploy/${item.id}`)}>
            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={styles.type}>{TYPE_LABEL[item.type] ?? item.type}</Text>
                <Text style={styles.name}>{jobTitle(item)}</Text>
                <Text style={styles.time}>{new Date(item.createdAt).toLocaleString('id-ID')}</Text>
              </View>
              <StatusPill status={item.status} />
            </View>
          </Card>
        )}
      />
      <View style={styles.fabRow}>
        <Pressable style={[styles.fab, styles.fabSecondary]} onPress={() => router.push('/(tabs)/deploy/ssl')}>
          <Ionicons name="lock-closed-outline" size={20} color={colors.accent} />
        </Pressable>
        <Fab onPress={() => router.push('/(tabs)/deploy/new')} size={54}>
          <Ionicons name="add" size={26} color={colors.onAccent} />
        </Fab>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // transparent - AuroraBackground dipasang sekali di (tabs)/_layout.tsx.
  screen: { flex: 1, backgroundColor: 'transparent' },
  content: { padding: spacing.lg, paddingBottom: 100 },
  sectionTitle: { fontSize: 12, fontWeight: '700', color: colors.inkFaint, marginBottom: spacing.sm, textTransform: 'uppercase', letterSpacing: 0.6 },
  emptyText: { fontSize: 13, color: colors.inkMuted },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  type: { fontSize: 10.5, fontWeight: '700', color: colors.accent, textTransform: 'uppercase', letterSpacing: 0.4 },
  name: { fontSize: 14.5, fontWeight: '700', color: colors.ink, marginTop: 2 },
  time: { fontSize: 11, color: colors.inkFaint, marginTop: 3 },
  fabRow: { position: 'absolute', right: spacing.lg, bottom: spacing.lg, gap: spacing.sm, alignItems: 'center' },
  nginxLink: { borderColor: colors.accentSoft, backgroundColor: colors.accentSoft },
  backupLink: { borderColor: colors.blueSoft, backgroundColor: colors.blueSoft },
  fab: {
    width: 54,
    height: 54,
    borderRadius: radius.pill,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  fabSecondary: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.divider, width: 46, height: 46 },
});
