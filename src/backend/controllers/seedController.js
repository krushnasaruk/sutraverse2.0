import { NextResponse } from 'next/server';
import { copyFile, mkdir, stat } from 'fs/promises';
import { join } from 'path';
import { requireUser } from '@/backend/middlewares/requireUser';

// ── Shared guard: block seed routes in production, require admin in dev ──
async function guardSeedRoute(request) {
    if (process.env.NODE_ENV === 'production') {
        return new NextResponse('Not Found', { status: 404 });
    }
    const { user, error } = await requireUser(request, { admin: true });
    if (error) return error;
    return null; // allowed
}


export const handleGet_seedbee = async (request) => {
    const blocked = await guardSeedRoute(request);
    if (blocked) return blocked;
    try {
        const uploadDir = join(process.cwd(), 'public', 'uploads');
        await mkdir(uploadDir, { recursive: true });

        const filesToProcess = [
            { path: 'bee_temp_extract/notes/UNIT -I.pdf', type: 'Notes' },
            { path: 'bee_temp_extract/notes/Unit-I Question Bank -CO.pdf', type: 'Notes' },
            { path: 'bee_temp_extract/notes/Unit-I Question Bank.pdf', type: 'Notes' },
            { path: 'bee_temp_extract/notes/Unit-II Assignment co.pdf', type: 'Notes' },
            { path: 'bee_temp_extract/notes/Unit-II Question Bank co.pdf', type: 'Notes' },
            { path: 'bee_temp_extract/notes/BEE Unit 2 ppt.pptx', type: 'Notes' },
            { path: 'bee_temp_extract/unit_v/Unit-IV Assignment.docx', type: 'Notes' },
            { path: 'bee_temp_extract/unit_v/Unit-IV Question Bank.pdf', type: 'Notes' },
            { path: 'bee_temp_extract/unit_v/unit-4 BEE notes.pdf', type: 'Notes' },
            { path: 'bee_temp_extract/unit_v/Unit-V Assignment.docx', type: 'Notes' },
            { path: 'bee_temp_extract/unit_v/Unit-V QB.docx', type: 'Notes' },
            { path: 'bee_temp_extract/papers/BEE- CCE-I_PAPER .pdf', type: 'Notes' },
            { path: 'bee_temp_extract/papers/CCE-II_PAPER.pdf', type: 'Notes' }
        ];

        let metadataList = [];

        for (const fileObj of filesToProcess) {
            const fileName = fileObj.path.split('/').pop();
            const safeName = fileName.replace(/[^a-zA-Z0-9.\-_]/g, '_');
            const uniqueName = `${Date.now()}_${safeName}`;
            
            const sourcePath = join(process.cwd(), fileObj.path);
            const destPath = join(uploadDir, uniqueName);
            
            try {
                await copyFile(sourcePath, destPath);
            } catch (e) {
                console.warn(`Could not copy ${fileObj.path}:`, e.message);
                continue;
            }
            
            const stats = await stat(sourcePath);

            const metadata = {
                title: fileName.replace(/\.[^/.]+$/, ""),
                subject: 'BEE',
                type: fileObj.type,
                branch: 'All', 
                year: '1st Year',
                description: `Auto-seeded BEE ${fileObj.type}`,
                fileURL: `/uploads/${uniqueName}`,
                fileName: uniqueName,
                fileSize: stats.size,
                rating: 0,
                ratingCount: 0,
                downloads: 0,
                status: 'approved',
                createdAt: new Date().toISOString(),
            };

            metadataList.push(metadata);
        }
        
        return NextResponse.json({ success: true, metadataList });
    } catch (error) {
        console.error("Seed error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}






export const handleGet_seedfiles = async (request) => {
    const blocked = await guardSeedRoute(request);
    if (blocked) return blocked;
    try {
        const uploadDir = join(process.cwd(), 'public', 'uploads');
        await mkdir(uploadDir, { recursive: true });

        const dirsToProcess = [
            { path: join(process.cwd(), '..', 'bee notes quetions bank assignments'), subject: 'BEE' },
            { path: join(process.cwd(), '..', 'iks assignments'), subject: 'Indian Knowledge System (IKS)' },
            { path: join(process.cwd(), '..', 'fpl assignment notes question bank paper'), subject: 'FPL' },
            { path: join(process.cwd(), '..', 'pps notes assignment and question bank with papers'), subject: 'PPS' }
        ];

        let metadataList = [];

        for (const { path: dirPath, subject } of dirsToProcess) {
            let files;
            try {
                files = await readdir(dirPath);
            } catch (e) {
                console.warn("Could not read directory", dirPath, e.message);
                continue;
            }

            for (const file of files) {
                const extMatch = file.match(/\.[0-9a-z]+$/i);
                if (!extMatch) continue;

                // Determine type
                let type = 'Notes';
                const lowerFile = file.toLowerCase();
                if (lowerFile.includes('assignment')) type = 'Assignment';
                else if (lowerFile.includes('question bank') || lowerFile.includes('qb')) type = 'PYQ';

                const safeName = file.replace(/[^a-zA-Z0-9.\-_]/g, '_');
                const uniqueName = `${Date.now()}_${safeName}`;
                
                const sourcePath = join(dirPath, file);
                const destPath = join(uploadDir, uniqueName);
                
                await copyFile(sourcePath, destPath);
                
                const stats = await stat(sourcePath);

                const metadata = {
                    title: file.replace(extMatch[0], ''),
                    subject: subject,
                    type: type,
                    branch: 'All', 
                    year: '1st Year',
                    description: `Auto-seeded from Admin for ${subject}`,
                    fileURL: `/uploads/${uniqueName}`,
                    fileName: uniqueName,
                    fileSize: stats.size,
                    rating: 0,
                    ratingCount: 0,
                    downloads: 0,
                    status: 'approved',
                    createdAt: new Date().toISOString(),
                };

                metadataList.push(metadata);
            }
        }
        
        return NextResponse.json({ success: true, metadataList });
    } catch (error) {
        console.error("Seed error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}





export const handleGet_seedm2 = async (request) => {
    const blocked = await guardSeedRoute(request);
    if (blocked) return blocked;
    try {
        const uploadDir = join(process.cwd(), 'public', 'uploads');
        await mkdir(uploadDir, { recursive: true });

        const filesToProcess = [
            'Unit 2 notes SG m2.pdf',
            'Unit 2 notes m2.pdf',
            'Unit 3 notes m2.pdf',
            'Unit 5 (M-II).pdf',
            'Unit-iv (M-II).pdf',
            'Unit1 Notes m2.pdf'
        ];

        let metadataList = [];

        for (const file of filesToProcess) {
            const safeName = file.replace(/[^a-zA-Z0-9.\-_]/g, '_');
            const uniqueName = `${Date.now()}_${safeName}`;
            
            const sourcePath = join(process.cwd(), file);
            const destPath = join(uploadDir, uniqueName);
            
            try {
                await copyFile(sourcePath, destPath);
            } catch (e) {
                console.warn(`Could not copy ${file}:`, e.message);
                continue;
            }
            
            const stats = await stat(sourcePath);

            const metadata = {
                title: file.replace('.pdf', ''),
                subject: 'Engineering Mathematics II',
                type: 'Notes',
                branch: 'All', 
                year: '1st Year',
                description: `Auto-seeded M2 notes`,
                fileURL: `/uploads/${uniqueName}`,
                fileName: uniqueName,
                fileSize: stats.size,
                rating: 0,
                ratingCount: 0,
                downloads: 0,
                status: 'approved',
                createdAt: new Date().toISOString(),
            };

            metadataList.push(metadata);
        }
        
        return NextResponse.json({ success: true, metadataList });
    } catch (error) {
        console.error("Seed error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}





// Map folder names in public/pyqs/ to subject metadata
var SUBJECT_MAP = {
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

export const handleGet_seedpyqs = async (request) => {
  const blocked = await guardSeedRoute(request);
  if (blocked) return blocked;
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





/* ── M2 Unit 4 Lectures ─────────────────────────────────────────────────── */
const M2_LECTURES = [
  {
    title: "Differential Equation - Lecture 1 | First Order & First Degree",
    url: "https://www.youtube.com/watch?v=TH4Kd9mfIgI",
    videoId: "TH4Kd9mfIgI",
  },
  {
    title: "Differential Equation - Lecture 2 | First Order & First Degree",
    url: "https://www.youtube.com/watch?v=WXZETpHneec",
    videoId: "WXZETpHneec",
  },
  {
    title: "Differential Equation - Lecture 3 | First Order & First Degree",
    url: "https://www.youtube.com/watch?v=znwRMyRLv1Q",
    videoId: "znwRMyRLv1Q",
  },
  {
    title: "Differential Equation - Lecture 4 | First Order & First Degree",
    url: "https://www.youtube.com/watch?v=tfhytqk1kHk",
    videoId: "tfhytqk1kHk",
  },
  {
    title: "Differential Equation - Lecture 5 | First Order & First Degree",
    url: "https://www.youtube.com/watch?v=x1S7cb0l2PU",
    videoId: "x1S7cb0l2PU",
  },
  {
    title: "Differential Equation - Lecture 6 | First Order & First Degree",
    url: "https://www.youtube.com/watch?v=8Sn1-FpeEUQ",
    videoId: "8Sn1-FpeEUQ",
  },
  {
    title: "Differential Equation - Oneshot | Complete Chapter",
    url: "https://www.youtube.com/watch?v=QokgGO3omhU",
    videoId: "QokgGO3omhU",
  },
  {
    title: "Best Trick to Identify Types of First Order Differential Equations",
    url: "https://www.youtube.com/watch?v=73Acm6A6BLs",
    videoId: "73Acm6A6BLs",
  },
  {
    title: "Differential Equation - Quick Revision | Whole Chapter in 5 mins",
    url: "https://www.youtube.com/watch?v=kpf3DrjfSeA",
    videoId: "kpf3DrjfSeA",
  },
];

/* ── M2 Unit 5 Lectures ─────────────────────────────────────────────────── */
const M2_UNIT5_LECTURES = [
  {
    title: "Applications of Differential Equations | Orthogonal Trajectories | Lecture 01",
    url: "https://www.youtube.com/watch?v=Ziu0y2kWTCM",
    videoId: "Ziu0y2kWTCM",
  },
  {
    title: "Applications of Differential Equations | Newton's Law of Cooling | Lecture 02",
    url: "https://www.youtube.com/watch?v=gJSvcf9_Duc",
    videoId: "gJSvcf9_Duc",
  },
  {
    title: "Applications of Differential Equations | Kirchoff's Law of Electrical Circuit | Lecture 03",
    url: "https://www.youtube.com/watch?v=6ku8k9WmZK8",
    videoId: "6ku8k9WmZK8",
  },
  {
    title: "Applications of Differential Equations | Rectilinear Motion | Lecture 04",
    url: "https://www.youtube.com/watch?v=oHh3qvsVJjA",
    videoId: "oHh3qvsVJjA",
  },
  {
    title: "Applications of Differential Equations | Simple Harmonic Motion | Lecture 05",
    url: "https://www.youtube.com/watch?v=br8wfLxZAso",
    videoId: "br8wfLxZAso",
  },
  {
    title: "Applications of Differential Equations | Fourier's Law of Heat Flow | Conduction of Heat | Lecture 06",
    url: "https://www.youtube.com/watch?v=CzH3DkZdZNY",
    videoId: "CzH3DkZdZNY",
  },
];

/* ── Physics All Units Lectures ──────────────────────────────────────────── */
const PHYSICS_LECTURES = [
  {
    title: "UNIT 1 | ONE SHOT LASERS | SPPU PUNE UNIVERSITY | 2024 PATTERN | ENGINEERING PHYSICS",
    url: "https://www.youtube.com/watch?v=IWDLRoDWCYY",
    videoId: "IWDLRoDWCYY",
    unit: "Unit 1",
  },
  {
    title: "UNIT 1 | ONE SHOT OPTIC FIBERS | ENGINEERING PHYSICS | SPPU PUNE UNIVERSITY",
    url: "https://www.youtube.com/watch?v=nWDew7_c-Ts",
    videoId: "nWDew7_c-Ts",
    unit: "Unit 1",
  },
  {
    title: "UNIT 2 | ONE SHOT | STM & NUMERICALS RIGID BOX | QUANTUM PHYSICS | SPPU PUNE UNIVERSITY",
    url: "https://www.youtube.com/watch?v=CEu0wlNUiU0",
    videoId: "CEu0wlNUiU0",
    unit: "Unit 2",
  },
  {
    title: "UNIT 2 | ONE SHOT | QUANTUM PHYSICS DE BROGLIE | SPPU PUNE UNIVERSITY",
    url: "https://www.youtube.com/watch?v=h2B_4-t6vMA",
    videoId: "h2B_4-t6vMA",
    unit: "Unit 2",
  },
  {
    title: "UNIT 3 | ONE SHOT | POLARIZATION | SPPU PUNE UNIVERSITY | 2024 PATTERN",
    url: "https://www.youtube.com/watch?v=acd0_KNsP28",
    videoId: "acd0_KNsP28",
    unit: "Unit 3",
  },
  {
    title: "UNIT 3 | ONE SHOT | WAVE OPTICS | SPPU PUNE UNIVERSITY | 2024 PATTERN",
    url: "https://www.youtube.com/watch?v=UxZ6iY8bwsU",
    videoId: "UxZ6iY8bwsU",
    unit: "Unit 3",
  },
  {
    title: "UNIT 4 | ONE SHOT | ULTRASONICS | SPPU PUNE UNIVERSITY | 2024 PATTERN",
    url: "https://www.youtube.com/watch?v=DGiVFCGFKFE",
    videoId: "DGiVFCGFKFE",
    unit: "Unit 4",
  },
  {
    title: "UNIT 5 | ONE SHOT | NANOPARTICLES | SPPU PUNE UNIVERSITY | 2024 PATTERN",
    url: "https://www.youtube.com/watch?v=27mhnrW4pX0",
    videoId: "27mhnrW4pX0",
    unit: "Unit 5",
  },
  {
    title: "PHYSICS | PREPARATION STRATEGY | SPPU 2024 PATTERN",
    url: "https://www.youtube.com/watch?v=BMC-WDvaTPc",
    videoId: "BMC-WDvaTPc",
    unit: "General",
  },
  {
    title: "IMP QUE | PHYSICS | SPPU PUNE UNIVERSITY | 2024 PATTERN | ENGINEERING PHYSICS",
    url: "https://www.youtube.com/watch?v=MFuzDLndNpM",
    videoId: "MFuzDLndNpM",
    unit: "General",
  },
];

/* ── BXE (Basic Electronics Engineering) All Units Lectures ──────────── */
const BXE_LECTURES = [
  {
    title: "UNIT 1 | BXE ONESHOT | BASIC ELECTRONICS | All IMP QUE | ALL PYQs | SPPU 2024 PUNE UNIVERSITY",
    url: "https://www.youtube.com/watch?v=h7hOHZny5Uo",
    videoId: "h7hOHZny5Uo",
    unit: "Unit 1",
  },
  {
    title: "UNIT 2 | BXE ONESHOT | BASIC ELECTRONICS | All IMP QUE | ALL PYQs | SPPU 2024 PUNE UNIVERSITY",
    url: "https://www.youtube.com/watch?v=KKlctWpPXDM",
    videoId: "KKlctWpPXDM",
    unit: "Unit 2",
  },
  {
    title: "UNIT 2 | NUMERICAL BXE ONESHOT | BASIC ELECTRONICS | ALL PYQs | SPPU 2024 PUNE UNIVERSITY",
    url: "https://www.youtube.com/watch?v=J3WHuCTxM7Y",
    videoId: "J3WHuCTxM7Y",
    unit: "Unit 2",
  },
  {
    title: "UNIT 3 | NUMERICAL + THEORY ONESHOT | BASIC ELECTRONICS | ALL PYQs | SPPU 2024 PUNE UNIVERSITY",
    url: "https://www.youtube.com/watch?v=LGfJHRMkdTs",
    videoId: "LGfJHRMkdTs",
    unit: "Unit 3",
  },
  {
    title: "UNIT 4 | NUMERICAL + THEORY ONESHOT | BASIC ELECTRONICS | ALL PYQs | SPPU 2024 PUNE UNIVERSITY",
    url: "https://www.youtube.com/watch?v=-xdQLkc4nCs",
    videoId: "-xdQLkc4nCs",
    unit: "Unit 4",
  },
  {
    title: "UNIT 5 | BXE ONESHOT | BASIC ELECTRONICS | All IMP QUE | ALL PYQs | SPPU 2024 PUNE UNIVERSITY",
    url: "https://www.youtube.com/watch?v=XqRT3R0Qw-4",
    videoId: "XqRT3R0Qw-4",
    unit: "Unit 5",
  },
];

/* ── Engineering Mechanics Lectures ───────────────────────────────────────── */
const MECHANICS_LECTURES = [
  // Unit 1
  {
    title: "SYSTEM OF FORCES|ONE SHOT|ENGINEERING MECHANICS|PRADEEP GIRI SIR",
    url: "https://www.youtube.com/watch?v=YIkKnRUEfaY",
    videoId: "YIkKnRUEfaY",
    unit: "Unit 1",
  },
  {
    title: "Centroid | Engineering Mechanics | One Shot in 50 Mins | Pradeep Giri Sir",
    url: "https://www.youtube.com/watch?v=5wE1p7a99NI",
    videoId: "5wE1p7a99NI",
    unit: "Unit 1",
  },
  // Unit 2
  {
    title: "EQUILIBRIUM|FIRST YEAR|ENGINEERING MECHANICS 1|Lecture 01",
    url: "https://www.youtube.com/watch?v=HAySR-amOfU",
    videoId: "HAySR-amOfU",
    unit: "Unit 2",
  },
  {
    title: "EQUILIBRIUM|FIRST YEAR|ENGINEERING MECHANICS 1|Lecture 02|NUMERICAL TO FIND THE REACTION & LOADS",
    url: "https://www.youtube.com/watch?v=BGXbOIFy9Wg",
    videoId: "BGXbOIFy9Wg",
    unit: "Unit 2",
  },
  {
    title: "EQUILIBRIUM|FIRST YEAR|ENGINEERING MECHANICS 1|Lecture 03|Numericals",
    url: "https://www.youtube.com/watch?v=AFTyklCE5RM",
    videoId: "AFTyklCE5RM",
    unit: "Unit 2",
  },
  {
    title: "EQUILIBRIUM|FIRST YEAR|ENGINEERING MECHANICS 1|Lecture 04|Lami's Theorem",
    url: "https://www.youtube.com/watch?v=2jgfXFtCH1Y",
    videoId: "2jgfXFtCH1Y",
    unit: "Unit 2",
  },
  {
    title: "EQUILIBRIUM|FIRST YEAR|ENGINEERING MECHANICS 1|Lecture 05|Numericals on Cylinders and Spheres",
    url: "https://www.youtube.com/watch?v=fhBOm8PEyqY",
    videoId: "fhBOm8PEyqY",
    unit: "Unit 2",
  },
  {
    title: "EQUILIBRIUM|FIRST YEAR|ENGINEERING MECHANICS 1|Lecture 06|TWO BODIES CONNECTED",
    url: "https://www.youtube.com/watch?v=qY4q9Py6rso",
    videoId: "qY4q9Py6rso",
    unit: "Unit 2",
  },
  // Unit 3
  {
    title: "FRICTION|FIRST YEAR|ENGINEERING MECHANICS1|ONE SHOT LECTURE|PART2|PRADEEP GIRI SIR",
    url: "https://www.youtube.com/watch?v=eCUdaLSjklY",
    videoId: "eCUdaLSjklY",
    unit: "Unit 3",
  },
  {
    title: "FRICTION|FIRST YEAR|ENGINEERING MECHANICS1|ONE SHOT LECTURE|PART1|PRADEEP GIRI SIR",
    url: "https://www.youtube.com/watch?v=l0HgL4bXF80",
    videoId: "l0HgL4bXF80",
    unit: "Unit 3",
  },
  {
    title: "FRICTION|FIRST YEAR|ENGINEERING MECHANICS 1|Lecture 01|INTRODUCTION",
    url: "https://www.youtube.com/watch?v=DqNflziPGJM",
    videoId: "DqNflziPGJM",
    unit: "Unit 3",
  },
  {
    title: "Friction|FIRST YEAR|ENGINEERING MECHANICS 1|Lecture 02|Angles involved in friction",
    url: "https://www.youtube.com/watch?v=CjgHMa66gKk",
    videoId: "CjgHMa66gKk",
    unit: "Unit 3",
  },
  {
    title: "Friction|FIRST YEAR|ENGINEERING MECHANICS 1|Lecture 03|Numerical on Simple Friction",
    url: "https://www.youtube.com/watch?v=30FZvlpHG80",
    videoId: "30FZvlpHG80",
    unit: "Unit 3",
  },
  {
    title: "Friction|FIRST YEAR|ENGINEERING MECHANICS1|Lecture 4|Numerical on Simple Friction on Connected Block",
    url: "https://www.youtube.com/watch?v=NBwBUu1Qbb8",
    videoId: "NBwBUu1Qbb8",
    unit: "Unit 3",
  },
  {
    title: "Friction|FIRST YEAR|ENGINEERING MECHANICS1|Lecture 05|Numerical on  Wedges",
    url: "https://www.youtube.com/watch?v=6wG00oXJoRI",
    videoId: "6wG00oXJoRI",
    unit: "Unit 3",
  },
  {
    title: "Friction|FIRST YEAR|ENGINEERING MECHANICS1|Lecture 07|Wedges",
    url: "https://www.youtube.com/watch?v=RJwpjX6PIl0",
    videoId: "RJwpjX6PIl0",
    unit: "Unit 3",
  },
  {
    title: "Friction|FIRST YEAR|ENGINEERING MECHANICS1|Lecture 06|Ladder Friction",
    url: "https://www.youtube.com/watch?v=pbGKWCjVHgo",
    videoId: "pbGKWCjVHgo",
    unit: "Unit 3",
  },
  {
    title: "Friction|FIRST YEAR|ENGINEERING MECHANICS1|Lecture 07|Ladder Friction",
    url: "https://www.youtube.com/watch?v=TytdVNn5xxg",
    videoId: "TytdVNn5xxg",
    unit: "Unit 3",
  },
  // Unit 4
  {
    title: "KINETICS OF PARTICLES|ONE SHOT|ENGINEERING MECHANICS|PRADEEP GIRI SIR",
    url: "https://www.youtube.com/watch?v=1bVEu40JxGo",
    videoId: "1bVEu40JxGo",
    unit: "Unit 4",
  },
  {
    title: "INSTANTANEOUS CENTRE OF ROTATION|KINEMATICS OF RIGID BODY|ONE SHOT|ENGINEERING MECHANICS|PRADEEP SIR",
    url: "https://www.youtube.com/watch?v=GQKJ6ugELCs",
    videoId: "GQKJ6ugELCs",
    unit: "Unit 4",
  },
  {
    title: "KINEMATICS OF PARTICLES|ONE SHOT|ENGINEERING MECHANICS|PRADEEP GIRI SIR",
    url: "https://www.youtube.com/watch?v=9yaU22oASEc",
    videoId: "9yaU22oASEc",
    unit: "Unit 4",
  },
  {
    title: "EQUILIBRIUM|ONE SHOT|ENGINEERING MECHANICS|PRADEEP GIRI SIR",
    url: "https://www.youtube.com/watch?v=gQezRynNuXg",
    videoId: "gQezRynNuXg",
    unit: "Unit 4",
  },
  {
    title: "CENTROID|ONE SHOT|ENGINEERING MECHANICS|PRADEEP GIRI SIR",
    url: "https://www.youtube.com/watch?v=bL4Ahhmasag",
    videoId: "bL4Ahhmasag",
    unit: "Unit 4",
  },
  {
    title: "SPACE FORCES|ONE SHOT|ENGINEERING MECHANICS|PRADEEP GIRI SIR",
    url: "https://www.youtube.com/watch?v=azoHcRG9jsQ",
    videoId: "azoHcRG9jsQ",
    unit: "Unit 4",
  },
];

export const handleGet_seedyoutube = async (request) => {
  const blocked = await guardSeedRoute(request);
  if (blocked) return blocked;
  try {
    if (!db) throw new Error('Firestore not initialized');

    const { searchParams } = new URL(request.url);
    const subject = searchParams.get('subject') || 'physics';

    let lectures, subjectName, unitOverride;

    if (subject === 'm2') {
      lectures = M2_LECTURES;
      subjectName = 'Engineering Mathematics II';
      unitOverride = 'Unit 4';
    } else if (subject === 'm2u5') {
      lectures = M2_UNIT5_LECTURES;
      subjectName = 'Engineering Mathematics II';
      unitOverride = 'Unit 5';
    } else if (subject === 'bxe') {
      lectures = BXE_LECTURES;
      subjectName = 'Basic Electronics Engineering';
    } else if (subject === 'mechanics') {
      lectures = MECHANICS_LECTURES;
      subjectName = 'Engineering Mechanics';
    } else {
      lectures = PHYSICS_LECTURES;
      subjectName = 'Physics';
    }

    let added = 0;
    for (const lecture of lectures) {
      await addDoc(collection(db, 'youtube_lectures'), {
        title: lecture.title,
        url: lecture.url,
        videoId: lecture.videoId,
        branch: 'Computer',
        year: '1st Year',
        subject: subjectName,
        unit: lecture.unit || unitOverride || 'Unit 1',
        createdAt: new Date().toISOString(),
      });
      added++;
    }

    return NextResponse.json({ success: true, added, subject: subjectName, message: `Seeded ${added} ${subjectName} lectures.` });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

