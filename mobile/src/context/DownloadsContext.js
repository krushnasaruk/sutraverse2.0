import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';

const DownloadsContext = createContext({});

const STORAGE_KEY = 'sutras-downloads';

/**
 * DownloadsProvider — Manages offline file storage.
 * Files are saved to FileSystem.documentDirectory and metadata to AsyncStorage.
 */
export function DownloadsProvider({ children }) {
  const [downloads, setDownloads] = useState([]);
  const [loading, setLoading] = useState(true);

  // Hydrate from AsyncStorage on mount, verify files still exist on disk
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          // Verify each file still exists on disk
          const verified = [];
          for (const item of parsed) {
            if (item.localUri) {
              const info = await FileSystem.getInfoAsync(item.localUri);
              if (info.exists) {
                verified.push(item);
              }
            }
          }
          setDownloads(verified);
          // Persist only verified entries
          if (verified.length !== parsed.length) {
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(verified));
          }
        }
      } catch (e) {
        console.warn('Failed to load downloads:', e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const persistDownloads = async (updated) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.warn('Failed to persist downloads:', e);
    }
  };

  /**
   * Download a file and save it for offline access.
   * @param {object} fileMeta - { id, title, type, subject, year, fileUrl, fileName }
   * @param {string} resolvedUrl - The fully-resolved download URL
   * @param {function} onProgress - Progress callback (0-1)
   * @returns {Promise<string>} localUri of the saved file
   */
  const downloadFile = useCallback(async (fileMeta, resolvedUrl, onProgress) => {
    // Determine file extension
    let extension = '.pdf';
    try {
      const parts = resolvedUrl.split('?')[0].split('.');
      const ext = parts[parts.length - 1].toLowerCase();
      if (['pdf', 'zip', 'rar', 'doc', 'docx', 'ppt', 'pptx', 'jpg', 'png', 'txt', 'dwg'].includes(ext)) {
        extension = `.${ext}`;
      }
    } catch (e) {}

    const safeName = (fileMeta.title || 'file').replace(/[^a-zA-Z0-9]/g, '_');
    const filename = `sutras_${fileMeta.id}_${safeName}${extension}`;
    const localUri = FileSystem.documentDirectory + filename;

    const encodedUrl = resolvedUrl.includes('%') ? resolvedUrl : encodeURI(resolvedUrl);

    const downloadResumable = FileSystem.createDownloadResumable(
      encodedUrl,
      localUri,
      {},
      (progress) => {
        const total = progress.totalBytesExpectedToWrite;
        if (total > 0 && onProgress) {
          onProgress(progress.totalBytesWritten / total);
        } else if (onProgress) {
          onProgress(-1); // indeterminate
        }
      }
    );

    const result = await downloadResumable.downloadAsync();

    if (!result || result.status !== 200) {
      throw new Error(`Download failed with status ${result?.status}`);
    }

    // Get file size
    const fileInfo = await FileSystem.getInfoAsync(localUri);

    const entry = {
      id: fileMeta.id,
      title: fileMeta.title || 'Untitled',
      type: fileMeta.type || 'Notes',
      subject: fileMeta.subject || 'General',
      year: fileMeta.year || '',
      fileName: fileMeta.fileName || filename,
      localUri: localUri,
      fileSize: fileInfo.size || 0,
      extension: extension,
      downloadedAt: new Date().toISOString(),
    };

    setDownloads(prev => {
      // Replace if already exists, else add
      const filtered = prev.filter(d => d.id !== fileMeta.id);
      const updated = [entry, ...filtered];
      persistDownloads(updated);
      return updated;
    });

    return localUri;
  }, []);

  /**
   * Remove a downloaded file from disk and state.
   */
  const removeDownload = useCallback(async (fileId) => {
    setDownloads(prev => {
      const target = prev.find(d => d.id === fileId);
      if (target?.localUri) {
        FileSystem.deleteAsync(target.localUri, { idempotent: true }).catch(console.warn);
      }
      const updated = prev.filter(d => d.id !== fileId);
      persistDownloads(updated);
      return updated;
    });
  }, []);

  /**
   * Check if a file is already downloaded.
   */
  const isDownloaded = useCallback((fileId) => {
    return downloads.some(d => d.id === fileId);
  }, [downloads]);

  /**
   * Get the local URI for a downloaded file.
   */
  const getLocalUri = useCallback((fileId) => {
    const entry = downloads.find(d => d.id === fileId);
    return entry?.localUri || null;
  }, [downloads]);

  /**
   * Get total storage used by downloads in bytes.
   */
  const totalStorageUsed = downloads.reduce((sum, d) => sum + (d.fileSize || 0), 0);

  return (
    <DownloadsContext.Provider value={{
      downloads,
      loading,
      downloadFile,
      removeDownload,
      isDownloaded,
      getLocalUri,
      totalStorageUsed,
    }}>
      {children}
    </DownloadsContext.Provider>
  );
}

export const useDownloads = () => useContext(DownloadsContext);
