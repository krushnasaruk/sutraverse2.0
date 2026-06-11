import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ActivityIndicator, Alert, Share, Dimensions, Animated, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { doc, getDoc, updateDoc, increment } from 'firebase/firestore';
import * as Sharing from 'expo-sharing';
import * as WebBrowser from 'expo-web-browser';
import { LinearGradient } from 'expo-linear-gradient';
import { db } from '../../lib/firebase';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useDownloads } from '../../context/DownloadsContext';
import { BlurView } from 'expo-blur';

const { width: SW } = Dimensions.get('window');

interface NoteFile {
  id: string;
  title: string;
  type: string;
  uploader: string;
  uploaderUID?: string;
  subject: string;
  year: string;
  semester?: string;
  rating?: number;
  downloads?: number;
  fileURL?: string;
  fileUrl?: string;
  fileName?: string;
  description?: string;
  reported?: boolean;
  reportsCount?: number;
}

export default function FileDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors, theme } = useTheme();
  const { user, getToken } = useAuth();
  const { downloadFile, isDownloaded, getLocalUri, removeDownload } = useDownloads();
  const router = useRouter();

  const scrollY = useRef(new Animated.Value(0)).current;

  const headerBgOpacity = scrollY.interpolate({
    inputRange: [0, 50],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const [loading, setLoading] = useState(true);
  const [file, setFile] = useState<NoteFile | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [hasReported, setHasReported] = useState(false);

  const fileIsDownloaded = file ? isDownloaded(file.id) : false;

  useEffect(() => {
    const fetchFileDetail = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const fileRef = doc(db, 'files', id);
        const fileDoc = await getDoc(fileRef);
        if (fileDoc.exists()) {
          setFile({ id: fileDoc.id, ...fileDoc.data() } as NoteFile);
        } else {
          throw new Error('File not found in database');
        }
      } catch (err) {
        console.warn('Error loading file detail:', err);
        Alert.alert('File Not Found', 'This file does not exist or has been removed from the database.');
        setFile(null);
      } finally {
        setLoading(false);
      }
    };

    fetchFileDetail();
  }, [id]);

  const resolveUrl = (rawUrl: string) => {
    if (!rawUrl) return "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf";
    let url = rawUrl;
    const BASE_URL = 'https://sutraverse.co.in';

    if (url.includes('firebasestorage.googleapis.com')) {
      return url;
    }

    // Strip out base urls to get a clean relative path
    if (url.startsWith('http://') || url.startsWith('https://')) {
      try {
        // Only strip if it's not a generic http link that's unrelated
        if (url.includes('localhost') || url.includes('sutraverse.co.in') || url.includes('192.168.')) {
            const match = url.match(/^https?:\/\/[^\/]+(.*)/);
            if (match && match[1]) {
                url = match[1];
            }
        }
      } catch (e) {}
    }

    let relativePath = url;
    if (relativePath.startsWith('/')) {
      relativePath = relativePath.substring(1);
    }
    if (relativePath.includes('api/downloads/')) {
      relativePath = relativePath.split('api/downloads/')[1];
    }
    relativePath = relativePath.split('?')[0];

    return `${BASE_URL}/api/downloads/${relativePath}`;
  };

  const handleSaveOffline = async () => {
    if (!file) return;
    let url = resolveUrl(file.fileURL || file.fileUrl);

    const token = await getToken();
    if (token && !url.includes('firebasestorage')) {
      const sep = url.includes('?') ? '&' : '?';
      url = `${url}${sep}token=${token}`;
    }

    setDownloading(true);
    setDownloadProgress(0);

    try {
      await downloadFile(
        {
          id: file.id,
          title: file.title,
          type: file.type,
          subject: file.subject,
          year: file.year,
          fileUrl: file.fileURL || file.fileUrl,
          fileName: file.fileName,
        },
        url,
        (progress) => setDownloadProgress(progress),
      );

      try {
        const fileRef = doc(db, 'files', file.id);
        await updateDoc(fileRef, { downloads: increment(1) });
        setFile(prev => prev ? { ...prev, downloads: (prev.downloads || 0) + 1 } : null);
      } catch (e) {
        console.warn(e);
      }

      setDownloading(false);
      Alert.alert('Saved Offline ✓', 'This file is now available in your Downloads tab — even without internet.');
    } catch (error: any) {
      Alert.alert('Download Failed', 'The requested document could not be retrieved at this moment.');
      setDownloading(false);
    }
  };

  const handleOpenOffline = async () => {
    if (!file) return;
    const localUri = getLocalUri(file.id);
    if (!localUri) return;

    try {
      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        let mimeType = 'application/pdf';
        let uti = 'com.adobe.pdf';
        const parts = localUri.split('.');
        const ext = parts[parts.length - 1]?.toLowerCase();
        if (ext === 'zip') { mimeType = 'application/zip'; uti = 'public.zip-archive'; }
        else if (ext === 'doc') { mimeType = 'application/msword'; uti = 'com.microsoft.word.doc'; }
        else if (ext === 'docx') { mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'; uti = 'org.openxmlformats.wordprocessingml.document'; }
        else if (ext === 'ppt') { mimeType = 'application/vnd.ms-powerpoint'; uti = 'com.microsoft.powerpoint.ppt'; }
        else if (ext === 'pptx') { mimeType = 'application/vnd.openxmlformats-officedocument.presentationml.presentation'; uti = 'org.openxmlformats.presentationml.presentation'; }
        else if (['jpg', 'jpeg'].includes(ext)) { mimeType = 'image/jpeg'; uti = 'public.jpeg'; }
        else if (ext === 'png') { mimeType = 'image/png'; uti = 'public.png'; }

        await Sharing.shareAsync(localUri, { mimeType, UTI: uti });
      }
    } catch (e) {
      Alert.alert('Error', 'Could not open the file.');
    }
  };

  const handleRemoveDownload = () => {
    if (!file) return;
    Alert.alert(
      'Remove Download',
      `Delete "${file.title}" from your device?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => removeDownload(file.id) },
      ]
    );
  };

  const handleViewOnline = async () => {
    if (!file) return;
    let url = resolveUrl(file.fileURL || file.fileUrl);

    const token = await getToken();
    if (token && !url.includes('firebasestorage')) {
      const sep = url.includes('?') ? '&' : '?';
      url = `${url}${sep}token=${token}`;
    }

    const encodedUrl = url.includes('%') ? url : encodeURI(url);
    try {
      await WebBrowser.openBrowserAsync(encodedUrl);
    } catch {
      Alert.alert("Browser Error", "Could not open document link online.");
    }
  };

  const handleShareDetails = async () => {
    if (!file) return;
    try {
      await Share.share({
        message: `Check out "${file.title}" for ${file.subject} on Sutras — The Student OS!`,
      });
    } catch (e) {
      console.warn(e);
    }
  };

  const handleReportFile = () => {
    if (!file) return;
    if (hasReported) {
      Alert.alert("Already Flagged", "You have already reported this resource for review.");
      return;
    }

    Alert.alert(
      "Report Resource",
      "Are you sure you want to flag this resource as incorrect, poor quality, or inappropriate?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Report",
          style: "destructive",
          onPress: async () => {
            setHasReported(true);
            try {
              const fileRef = doc(db, 'files', file.id);
              await updateDoc(fileRef, {
                reported: true,
                reportsCount: increment(1)
              });
            } catch (err) {
              console.warn("Report Firebase sync bypassed.");
            }
            Alert.alert("Flagged successfully", "Thank you. Our moderators will review this content shortly.");
          }
        }
      ]
    );
  };

  const getTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'notes': return '#0066cc';
      case 'pyq': return '#ff9500';
      default: return '#34c759';
    }
  };

  if (loading) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: colors.bgMain }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!file) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: colors.bgMain }]}>
        <Text style={{ color: colors.textPrimary, fontSize: 16, fontWeight: '700' }}>File not found</Text>
      </View>
    );
  }

  const typeColor = getTypeColor(file.type);

  return (
    <View style={[styles.container, { backgroundColor: colors.bgMain }]}>
      <LinearGradient
        colors={theme === 'dark'
          ? ['rgba(41,151,255,0.15)', 'rgba(0,102,204,0.02)', 'transparent']
          : ['rgba(0,102,204,0.08)', 'rgba(0,102,204,0.01)', 'transparent']
        }
        style={styles.heroBackground}
      />

      {/* ═══ TOP APP BAR ═══ */}
      <View style={styles.topAppBar}>
        <Animated.View style={[
          StyleSheet.absoluteFill,
          {
            opacity: headerBgOpacity,
            backgroundColor: Platform.OS === 'ios' ? 'transparent' : colors.bgMain,
            borderBottomWidth: StyleSheet.hairlineWidth,
            borderBottomColor: colors.dividerSoft
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
        <TouchableOpacity onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: colors.bgCard, borderColor: colors.dividerSoft, borderWidth: 1 }]}>
          <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
        </TouchableOpacity>
        
        <View style={styles.topRightActions}>
          <TouchableOpacity onPress={handleShareDetails} style={[styles.actionBtn, { backgroundColor: colors.bgCard, borderColor: colors.dividerSoft, borderWidth: 1 }]}>
            <Ionicons name="share-social-outline" size={18} color={colors.textPrimary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleReportFile} style={[styles.actionBtn, { backgroundColor: colors.bgCard, borderColor: colors.dividerSoft, borderWidth: 1 }]}>
            <Ionicons name="flag-outline" size={18} color={hasReported ? "#ff3b30" : colors.textPrimary} />
          </TouchableOpacity>
        </View>
      </View>

      <Animated.ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
      >
        {/* FILE INFO CARD */}
        <View style={[styles.mainCard, { backgroundColor: colors.bgCard, borderColor: colors.dividerSoft }]}>
          <View style={styles.badgeRow}>
            <View style={[styles.typeBadge, { backgroundColor: typeColor + '12' }]}>
              <Text style={[styles.typeBadgeText, { color: typeColor }]}>{file.type.toUpperCase()}</Text>
            </View>
            {fileIsDownloaded && (
              <View style={[styles.offlineBadge, { backgroundColor: colors.successSoft }]}>
                <Ionicons name="checkmark-circle" size={12} color={colors.success} />
                <Text style={[styles.offlineBadgeText, { color: colors.success }]}>Available Offline</Text>
              </View>
            )}
          </View>

          <Text style={[styles.fileTitle, { color: colors.textPrimary }]}>{file.title}</Text>

          <View style={[styles.metaRow, { borderTopColor: colors.hairline }]}>
            <View style={styles.metaItem}>
              <Ionicons name="book-outline" size={14} color={colors.textMuted} />
              <Text style={[styles.metaVal, { color: colors.textSecondary }]}>{file.subject}</Text>
            </View>
            <View style={styles.metaItem}>
              <Ionicons name="calendar-outline" size={14} color={colors.textMuted} />
              <Text style={[styles.metaVal, { color: colors.textSecondary }]}>{file.year}</Text>
            </View>
            <View style={styles.metaItem}>
              <Ionicons name="star" size={14} color="#ffcc00" />
              <Text style={[styles.metaVal, { color: colors.textSecondary }]}>{file.rating || 'New'}</Text>
            </View>
          </View>
        </View>

        {/* Description & Contributor */}
        <View style={[styles.detailsCard, { backgroundColor: colors.bgCard, borderColor: colors.dividerSoft }]}>
          <Text style={[styles.detailsTitle, { color: colors.textPrimary }]}>About this Resource</Text>
          <Text style={[styles.descText, { color: colors.textSecondary }]}>
            {file.description || "Essential academic reference document shared by the community."}
          </Text>

          <View style={[styles.contributorBox, { borderTopColor: colors.hairline }]}>
            <View style={[styles.avatarCircle, { backgroundColor: colors.primarySoft }]}>
              <Text style={[styles.avatarText, { color: colors.primary }]}>
                {(file.uploader || 'Anonymous').charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.contributorName, { color: colors.textPrimary }]}>{file.uploader || 'Anonymous'}</Text>
              <Text style={[styles.contributorLabel, { color: colors.textMuted }]}>Sutras Contributor</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity style={styles.flagButton} onPress={handleReportFile} activeOpacity={0.7}>
          <Ionicons name="warning-outline" size={14} color={hasReported ? "#ff3b30" : colors.textMuted} />
          <Text style={[styles.flagButtonText, { color: hasReported ? "#ff3b30" : colors.textMuted }]}>
            {hasReported ? "Content Flagged" : "Report incorrect or poor quality content"}
          </Text>
        </TouchableOpacity>

        <Text style={[styles.downloadStatsText, { color: colors.textDisabled }]}>
          Downloaded {file.downloads || 0} times
        </Text>
      </Animated.ScrollView>

      {/* ═══ FLOATING ACTION BAR ═══ */}
      <View style={[styles.actionContainer, { backgroundColor: colors.bgCard, borderTopColor: colors.hairline }]}>
        {downloading ? (
          <View style={styles.downloadingWrapper}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={[styles.downloadingText, { color: colors.textPrimary }]}>
              {downloadProgress >= 0 ? `Saving... ${Math.round(downloadProgress * 100)}%` : 'Saving...'}
            </Text>
          </View>
        ) : fileIsDownloaded ? (
          <View style={styles.actionButtonsRow}>
            <TouchableOpacity
              style={[styles.downloadBtn, { backgroundColor: colors.success }]}
              onPress={handleOpenOffline}
              activeOpacity={0.85}
            >
              <Ionicons name="folder-open" size={18} color="#fff" style={{ marginRight: 6 }} />
              <Text style={styles.downloadBtnText}>Open File</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.viewOnlineBtn, { borderColor: colors.error, borderWidth: 1.5 }]}
              onPress={handleRemoveDownload}
              activeOpacity={0.85}
            >
              <Ionicons name="trash-outline" size={18} color={colors.error} style={{ marginRight: 4 }} />
              <Text style={[styles.viewOnlineBtnText, { color: colors.error }]}>Remove</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.actionButtonsRow}>
            <TouchableOpacity
              style={[styles.downloadBtn, { backgroundColor: colors.primary }]}
              onPress={handleSaveOffline}
              activeOpacity={0.85}
            >
              <Ionicons name="cloud-download" size={18} color="#fff" style={{ marginRight: 6 }} />
              <Text style={styles.downloadBtnText}>Save Offline</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.viewOnlineBtn, { borderColor: colors.primary, borderWidth: 1.5 }]}
              onPress={handleViewOnline}
              activeOpacity={0.85}
            >
              <Ionicons name="eye-outline" size={18} color={colors.primary} style={{ marginRight: 6 }} />
              <Text style={[styles.viewOnlineBtnText, { color: colors.primary }]}>View</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  heroBackground: { position: 'absolute', top: 0, left: 0, right: 0, height: 260 },
  topAppBar: {
    position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: 56, paddingHorizontal: 20, paddingBottom: 12,
  },
  backBtn: { width: 38, height: 38, borderRadius: 19, justifyContent: 'center', alignItems: 'center' },
  topRightActions: { flexDirection: 'row', gap: 10 },
  actionBtn: { width: 38, height: 38, borderRadius: 19, justifyContent: 'center', alignItems: 'center' },
  scrollContent: { padding: 20, paddingTop: 108, paddingBottom: 120 },
  mainCard: { borderRadius: 20, borderWidth: 1, padding: 20, marginBottom: 14 },
  badgeRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  typeBadge: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  typeBadgeText: { fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
  offlineBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  offlineBadgeText: { fontSize: 10, fontWeight: '700' },
  fileTitle: { fontSize: 20, fontWeight: '700', lineHeight: 28, marginBottom: 16, letterSpacing: -0.2 },
  metaRow: { flexDirection: 'row', borderTopWidth: StyleSheet.hairlineWidth, paddingTop: 14, gap: 20 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaVal: { fontSize: 13, fontWeight: '600' },
  detailsCard: { borderRadius: 20, borderWidth: 1, padding: 20, marginBottom: 16 },
  detailsTitle: { fontSize: 15, fontWeight: '700', marginBottom: 6, letterSpacing: -0.1 },
  descText: { fontSize: 13, lineHeight: 19, fontWeight: '400' },
  contributorBox: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 14, paddingTop: 14, borderTopWidth: StyleSheet.hairlineWidth },
  avatarCircle: { width: 34, height: 34, borderRadius: 17, justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 14, fontWeight: '700' },
  contributorName: { fontSize: 14, fontWeight: '600' },
  contributorLabel: { fontSize: 11, fontWeight: '400', marginTop: 1 },
  flagButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10 },
  flagButtonText: { fontSize: 12, fontWeight: '500' },
  downloadStatsText: { fontSize: 11, fontWeight: '500', textAlign: 'center', marginTop: 4 },
  actionContainer: { position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: 20, paddingVertical: 16, borderTopWidth: StyleSheet.hairlineWidth },
  actionButtonsRow: { flexDirection: 'row', gap: 12 },
  downloadBtn: { flex: 1.6, height: 48, borderRadius: 24, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  downloadBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  viewOnlineBtn: { flex: 1, height: 48, borderRadius: 24, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  viewOnlineBtnText: { fontSize: 14, fontWeight: '700' },
  downloadingWrapper: { height: 48, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  downloadingText: { fontSize: 14, fontWeight: '700', marginLeft: 10 },
});
