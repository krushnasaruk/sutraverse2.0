import { NextResponse } from 'next/server';
import { readdir, stat } from 'fs/promises';
import { join } from 'path';

// Map folder names in public/pyqs/ to subject metadata
const SUBJECT_MAP = {
  'bee': {
    subject: 'BEE',
    fullName: 'Basic Electrical Engineering',
    branch: 'All',
    year: '1st Year',
  },
  'chemistry': {
    subject: 'Chemistry',
    fullName: 'Engineering Chemistry',
    branch: 'All',
    year: '1st Year',
  },
  'electronics': {
    subject: 'Basic Electronics Engineering',
    fullName: 'Basic Electronics Engineering',
    branch: 'All',
    year: '1st Year',
  },
  'engineering-graphics': {
    subject: 'Engineering Graphics',
    fullName: 'Engineering Graphics & Design',
    branch: 'All',
    year: '1st Year',
  },
  'maths1': {
    subject: 'Engineering Mathematics I',
    fullName: 'Engineering Mathematics - I',
    branch: 'All',
    year: '1st Year',
  },
  'maths2': {
    subject: 'Engineering Mathematics II',
    fullName: 'Engineering Mathematics - II',
    branch: 'All',
    year: '1st Year',
  },
  'engineering-mechanics': {
    subject: 'Engineering Mechanics',
    fullName: 'Engineering Mechanics',
    branch: 'All',
    year: '1st Year',
  },
  'physics': {
    subject: 'Physics',
    fullName: 'Engineering Physics',
    branch: 'All',
    year: '1st Year',
  },
  'pps': {
    subject: 'PPS',
    fullName: 'Programming & Problem Solving',
    branch: 'All',
    year: '1st Year',
  },
};

// Convert filename like "Nov_Dec_2023" → readable title
function formatTitle(filename, subjectName) {
  const nameWithoutExt = filename.replace(/\.pdf$/i, '');
  // Clean underscores and extra spaces
  const readable = nameWithoutExt.replace(/_/g, ' ').replace(/-/g, ' ').trim();
  return `${subjectName} — ${readable}`;
}

export async function GET() {
  try {
    const pyqsDir = join(process.cwd(), 'public', 'pyqs');
    const metadataList = [];

    for (const [folderKey, meta] of Object.entries(SUBJECT_MAP)) {
      const folderPath = join(pyqsDir, folderKey);

      let files;
      try {
        files = await readdir(folderPath);
      } catch (e) {
        console.warn(`Could not read pyq folder: ${folderPath}`, e.message);
        continue;
      }

      for (const file of files) {
        if (!file.toLowerCase().endsWith('.pdf')) continue;

        const filePath = join(folderPath, file);
        let fileSize = 0;
        try {
          const stats = await stat(filePath);
          fileSize = stats.size;
        } catch (_) {}

        // The file is already in public/pyqs/<folder>/ — just reference it directly
        const fileURL = `/pyqs/${folderKey}/${encodeURIComponent(file)}`;

        metadataList.push({
          title: formatTitle(file, meta.fullName),
          subject: meta.subject,
          type: 'PYQ',
          branch: meta.branch,
          year: meta.year,
          description: `Past Year Question Paper — 2019 Pattern — ${meta.fullName}`,
          fileURL,
          fileName: file,
          fileSize,
          rating: 0,
          ratingCount: 0,
          downloads: 0,
          status: 'approved',
          createdAt: new Date().toISOString(),
        });
      }
    }

    return NextResponse.json({ success: true, count: metadataList.length, metadataList });
  } catch (error) {
    console.error('PYQ seed error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
