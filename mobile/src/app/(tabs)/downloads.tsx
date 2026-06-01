import React, { useRef, useCallback } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Animated, Platform, Alert, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../context/ThemeContext';
import { useDownloads } from '../../context/DownloadsContext';
import { BlurView } from 'expo-blur';
import * as Sharing from 'expo-sharing';

const { width: SW } = Dimensions.get('window');

function formatBytes(bytes) {
  if (!bytes || bytes === 0) return '0 B';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / 1048576).toFixed(1) + ' MB';
}

function formatDate(isoStr) {
  if (!isoStr) return '';
  const d = new Date(isoStr);
  const now = new Date();
  const diffMs = now - d;
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHrs = Math.floor(diffMins / 60);
  if (diffHrs < 24) return `${diffHrs}h ago`;
  const diffDays = Math.floor(diffHrs / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

const getTypeColor = (t) => {
  if (t === 'Notes') return '#0066cc';
  if (t === 'PYQ') return '#ff9500';
  return '#34c759';
};

const getTypeIcon = (t) => {
  if (t === 'Notes') return 'document-text';
  if (t === 'PYQ') return 'help-circle';
  return 'clipboard';
};

export default function DownloadsScreen() {
  const { colors, theme } = useTheme();
  const { downloads, removeDownload, totalStorageUsed } = useDownloads();
  const scrollY = useRef(new Animated.Value(0)).current;

  const headerBgOpacity = scrollY.interpolate({
    inputRange: [0, 50],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const handleOpen = async (item) => {
    try {
      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        let mimeType = 'application/pdf';
        let uti = 'com.adobe.pdf';
        const ext = item.extension || '.pdf';
        if (ext === '.zip') { mimeType = 'application/zip'; uti = 'public.zip-archive'; }
        else if (ext === '.doc') { mimeType = 'application/msword'; uti = 'com.microsoft.word.doc'; }
        else if (ext === '.docx') { mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'; uti = 'org.openxmlformats.wordprocessingml.document'; }
        else if (ext === '.ppt') { mimeType = 'application/vnd.ms-powerpoint'; uti = 'com.microsoft.powerpoint.ppt'; }
        else if (ext === '.pptx') { mimeType = 'application/vnd.openxmlformats-officedocument.presentationml.presentation'; uti = 'org.openxmlformats.presentationml.presentation'; }
        else if (ext === '.jpg' || ext === '.jpeg') { mimeType = 'image/jpeg'; uti = 'public.jpeg'; }
        else if (ext === '.png') { mimeType = 'image/png'; uti = 'public.png'; }

        await Sharing.shareAsync(item.localUri, { mimeType, UTI: uti });
      } else {
        Alert.alert('Cannot Open', 'Sharing is not available on this device.');
      }
    } catch (e) {
      Alert.alert('Error', 'Could not open the file.');
    }
  };

  const handleDelete = (item) => {
    Alert.alert(
      'Remove Download',
      `Delete "${item.title}" from your device? This will free up ${formatBytes(item.fileSize)}.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => removeDownload(item.id),
        },
      ]
    );
  };

  // Group downloads by type
  const grouped = {};
  downloads.forEach(d => {
    const key = d.type || 'Other';
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(d);
  });
  const groupKeys = Object.keys(grouped).sort();

  return (
    <View style={[styles.container, { backgroundColor: colors.bgMain }]}>
      {/* Gradient backdrop */}
      <LinearGradient
        colors={theme === 'dark'
          ? ['rgba(52,215,89,0.1)', 'rgba(52,215,89,0.02)', 'transparent']
          : ['rgba(52,199,89,0.08)', 'rgba(52,199,89,0.01)', 'transparent']
        }
        style={styles.heroBackground}
      />

      {/* Top bar */}
      <View style={styles.topBar}>
        <Animated.View style={[
          StyleSheet.absoluteFill,
          {
            opacity: headerBgOpacity,
            backgroundColor: Platform.OS === 'ios' ? 'transparent' : colors.bgMain,
            borderBottomWidth: StyleSheet.hairlineWidth,
            borderBottomColor: colors.dividerSoft,
          }
        ]}>
          {Platform.OS === 'ios' && (
            <BlurView
              intensity={80}
              tint={theme === 'dark' ? 'dark' : 'light'}
              style={StyleSheet.absoluteFill}
            />
          )}
        </Animated.View>
        <Text style={[styles.topTitle, { color: colors.textPrimary }]}>Downloads</Text>
        {downloads.length > 0 && (
          <View style={[styles.countPill, { backgroundColor: colors.successSoft }]}>
            <Text style={[styles.countText, { color: colors.success }]}>{downloads.length}</Text>
          </View>
        )}
      </View>

      {downloads.length === 0 ? (
        /* ═══ EMPTY STATE ═══ */
        <View style={styles.emptyContainer}>
          <View style={[styles.emptyCard, { backgroundColor: colors.bgCard, borderColor: colors.dividerSoft }]}>
            <View style={[styles.emptyIconWrap, { backgroundColor: colors.successSoft }]}>
              <Ionicons name="cloud-download-outline" size={40} color={colors.success} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>
              No downloads yet
            </Text>
            <Text style={[styles.emptySub, { color: colors.textMuted }]}>
              Save files from the Library to access them anytime — even without internet.
            </Text>
            <View style={[styles.emptyHint, { backgroundColor: colors.downloadBg }]}>
              <Ionicons name="information-circle-outline" size={16} color={colors.success} />
              <Text style={[styles.emptyHintText, { color: colors.success }]}>
                Tap "Save Offline" on any file to get started
              </Text>
            </View>
          </View>
        </View>
      ) : (
        /* ═══ DOWNLOADS LIST ═══ */
        <Animated.ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: true }
          )}
          scrollEventThrottle={16}
        >
          {/* Storage usage bar */}
          <View style={[styles.storageCard, { backgroundColor: colors.bgCard, borderColor: colors.dividerSoft }]}>
            <View style={styles.storageRow}>
              <View style={[styles.storageIcon, { backgroundColor: colors.successSoft }]}>
                <Ionicons name="folder" size={16} color={colors.success} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.storageTitle, { color: colors.textPrimary }]}>
                  {downloads.length} {downloads.length === 1 ? 'file' : 'files'} saved offline
                </Text>
                <Text style={[styles.storageSub, { color: colors.textMuted }]}>
                  Using {formatBytes(totalStorageUsed)} on device
                </Text>
              </View>
              <View style={[styles.offlineBadge, { backgroundColor: colors.successSoft }]}>
                <Ionicons name="checkmark-circle" size={12} color={colors.success} />
                <Text style={[styles.offlineBadgeText, { color: colors.success }]}>Offline</Text>
              </View>
            </View>
          </View>

          {/* Grouped file list */}
          {groupKeys.map(type => {
            const tc = getTypeColor(type);
            return (
              <View key={type}>
                <View style={styles.groupHeader}>
                  <View style={[styles.groupDot, { backgroundColor: tc }]} />
                  <Text style={[styles.groupTitle, { color: colors.textPrimary }]}>{type}</Text>
                  <Text style={[styles.groupCount, { color: colors.textMuted }]}>{grouped[type].length}</Text>
                </View>

                {grouped[type].map((item, idx) => (
                  <TouchableOpacity
                    key={item.id}
                    style={[styles.fileRow, { backgroundColor: colors.bgCard, borderColor: colors.dividerSoft }]}
                    onPress={() => handleOpen(item)}
                    onLongPress={() => handleDelete(item)}
                    activeOpacity={0.85}
                  >
                    <View style={[styles.fileIconBox, { backgroundColor: tc + '14' }]}>
                      <Ionicons name={getTypeIcon(type)} size={20} color={tc} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.fileTitle, { color: colors.textPrimary }]} numberOfLines={1}>
                        {item.title}
                      </Text>
                      <Text style={[styles.fileMeta, { color: colors.textMuted }]}>
                        {item.subject} · {formatBytes(item.fileSize)} · {formatDate(item.downloadedAt)}
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => handleDelete(item)}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      style={styles.deleteBtn}
                    >
                      <Ionicons name="trash-outline" size={16} color={colors.textDisabled} />
                    </TouchableOpacity>
                  </TouchableOpacity>
                ))}
              </View>
            );
          })}
        </Animated.ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  heroBackground: {
    position: 'absolute', top: 0, left: 0, right: 0, height: 260,
  },
  topBar: {
    position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: 56, paddingHorizontal: 20, paddingBottom: 12,
  },
  topTitle: { fontSize: 22, fontWeight: '700', letterSpacing: -0.3 },
  countPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  countText: { fontSize: 14, fontWeight: '700' },

  // Empty state
  emptyContainer: { flex: 1, justifyContent: 'center', paddingHorizontal: 20 },
  emptyCard: {
    borderRadius: 24, borderWidth: 1, padding: 40, alignItems: 'center',
  },
  emptyIconWrap: {
    width: 80, height: 80, borderRadius: 24, justifyContent: 'center', alignItems: 'center',
    marginBottom: 20,
  },
  emptyTitle: { fontSize: 22, fontWeight: '700', letterSpacing: -0.3, marginBottom: 8 },
  emptySub: { fontSize: 16, fontWeight: '400', textAlign: 'center', lineHeight: 24, marginBottom: 20 },
  emptyHint: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12,
  },
  emptyHintText: { fontSize: 13, fontWeight: '600' },

  // Scroll content
  scrollContent: { paddingTop: 108, paddingBottom: 120 },

  // Storage card
  storageCard: {
    marginHorizontal: 20, marginBottom: 16, borderRadius: 18, borderWidth: 1, padding: 16,
  },
  storageRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  storageIcon: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  storageTitle: { fontSize: 15, fontWeight: '600', letterSpacing: -0.2 },
  storageSub: { fontSize: 13, fontWeight: '400', marginTop: 2 },
  offlineBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8,
  },
  offlineBadgeText: { fontSize: 11, fontWeight: '700' },

  // Group headers
  groupHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 24, marginTop: 20, marginBottom: 10,
  },
  groupDot: { width: 8, height: 8, borderRadius: 4 },
  groupTitle: { fontSize: 16, fontWeight: '700', letterSpacing: -0.2 },
  groupCount: { fontSize: 13, fontWeight: '400' },

  // File rows
  fileRow: {
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: 20, marginBottom: 6, borderRadius: 16, borderWidth: 1,
    padding: 14, gap: 12,
  },
  fileIconBox: {
    width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center',
  },
  fileTitle: { fontSize: 15, fontWeight: '600', letterSpacing: -0.2, marginBottom: 2 },
  fileMeta: { fontSize: 12, fontWeight: '400' },
  deleteBtn: { padding: 6 },
});
