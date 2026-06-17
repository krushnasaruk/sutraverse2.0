import React from 'react';

export interface DownloadEntry {
  id: string;
  title: string;
  type: string;
  subject: string;
  year: string;
  fileName: string;
  localUri: string;
  fileSize: number;
  extension: string;
  downloadedAt: string;
}

export interface DownloadsContextType {
  downloads: DownloadEntry[];
  loading: boolean;
  downloadFile: (
    fileMeta: {
      id: string;
      title: string;
      type: string;
      subject: string;
      year: string;
      fileUrl?: string;
      fileName?: string;
    },
    resolvedUrl: string,
    onProgress?: (progress: number) => void
  ) => Promise<string>;
  removeDownload: (fileId: string) => Promise<void>;
  isDownloaded: (fileId: string) => boolean;
  getLocalUri: (fileId: string) => string | null;
  totalStorageUsed: number;
}

export declare const DownloadsProvider: React.FC<{ children: React.ReactNode }>;
export declare const useDownloads: () => DownloadsContextType;
