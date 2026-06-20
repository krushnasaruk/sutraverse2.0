'use client';
// Force Turbopack reload 2

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { collection, getDocs, query, where, orderBy, limit, addDoc, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db, storage } from '@/database/config/firebase';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { useAuth } from '@/frontend/context/AuthContext';
import { useTheme } from '@/frontend/context/ThemeContext';
import { IconUpload, IconDownload, IconStar, IconFolder, IconNotes, IconPyq, IconAssignment, IconLock, IconCalendar } from '@/frontend/components/ui/Icons';
import Webcam from 'react-webcam';
import jsQR from 'jsqr';
import { BRANCHES, YEARS, SEMESTERS, COLLEGES, getSubjects } from '@/shared/constants/subjectMap';
import { getSPPUGrade, calculateSGPA } from '@/shared/utils/sppuGrading';
import { getUserLevelAndBadges } from '@/database/queries/points';
import { getBannerGradient, BANNER_PRESETS } from '@/shared/constants/bannerPresets';
import styles from './page.module.css';
import RepositoryTab from './components/RepositoryTab';
import ClassroomTab from './components/ClassroomTab';
import SettingsTab from './components/SettingsTab';
import OverviewTab from './components/OverviewTab';
import LeaveModal from './components/LeaveModal';
import QRScannerModal from './components/QRScannerModal';
import BioScannerModal from './components/BioScannerModal';
import OnboardingPopup from './components/OnboardingPopup';

const MODEL_URL = 'https://cdn.jsdelivr.net/gh/cgarciagl/face-api.js@0.22.2/weights/';

function getUploadIcon(type) {
    switch (type) {
        case 'Notes': return <IconNotes size={20} />;
        case 'PYQ': return <IconPyq size={20} />;
        case 'Assignment': return <IconAssignment size={20} />;
        default: return <IconFolder size={20} />;
    }
}

function getTypeClass(type) {
    switch (type) {
        case 'Notes': return styles.iconNotes;
        case 'PYQ': return styles.iconPyq;
        case 'Assignment': return styles.iconAssignment;
        default: return styles.iconNotes;
    }
}

function getStatusBadge(status) {
    switch (status) {
        case 'pending': return <span className={styles.statusPending}>⏳ Pending</span>;
        case 'approved': return <span className={styles.statusApproved}>✅ Live</span>;
        case 'rejected': return <span className={styles.statusRejected}>❌ Rejected</span>;
        default: return null;
    }
}

export default function DashboardPage() {
    const { user, updateUserProfile } = useAuth();
    const { performanceMode, togglePerformanceMode } = useTheme();
    const [uploads, setUploads] = useState([]);
    const [loadingUploads, setLoadingUploads] = useState(true);
    const [editing, setEditing] = useState(false);
    const [dockOpen, setDockOpen] = useState(false);
    const [showOnboarding, setShowOnboarding] = useState(false);
    const [activeDashboardTab, setActiveDashboardTab] = useState('overview');

    // Profile Edit State
    const [editName, setEditName] = useState('');
    const [editCollege, setEditCollege] = useState('');
    const [editBranch, setEditBranch] = useState('');
    const [editYear, setEditYear] = useState('');
    const [editSemester, setEditSemester] = useState('');
    const [editBio, setEditBio] = useState('');
    const [editStudentPhone, setEditStudentPhone] = useState('');
    const [editParentPhone, setEditParentPhone] = useState('');
    const [editBanner, setEditBanner] = useState('neon');
    const [editTagline, setEditTagline] = useState('');
    const [editShowcase, setEditShowcase] = useState([]);
    const [saving, setSaving] = useState(false);

    // Avatar Upload State
    const [avatarPreview, setAvatarPreview] = useState(null);
    const [avatarFile, setAvatarFile] = useState(null);
    const [uploadingAvatar, setUploadingAvatar] = useState(false);
    const fileInputRef = useRef(null);

    // Class Hub State
    const [attendanceStats, setAttendanceStats] = useState({ present: 0, absent: 0, late: 0, excused: 0, total: 0, percentage: 0 });
    const [announcements, setAnnouncements] = useState([]);
    const [classMaterials, setClassMaterials] = useState([]);
    const [loadingClassData, setLoadingClassData] = useState(false);

    // Gamification & Leave Request State
    const [leaveModalOpen, setLeaveModalOpen] = useState(false);
    const [leaveDate, setLeaveDate] = useState('');
    const [leaveReason, setLeaveReason] = useState('');
    const [leaveSubmitting, setLeaveSubmitting] = useState(false);
    const [myLeaveRequests, setMyLeaveRequests] = useState([]);
    const [attendanceHistory, setAttendanceHistory] = useState([]);
    const [currentStreak, setCurrentStreak] = useState(0);

    // Geo-Radar & Camera State
    const [activeLiveSession, setActiveLiveSession] = useState(null);
    const [hasCheckedIn, setHasCheckedIn] = useState(null);
    const [monthlyReports, setMonthlyReports] = useState([]);
    const [showScanner, setShowScanner] = useState(false);
    const [scanStatus, setScanStatus] = useState(''); // 'scanning', 'verifying', 'success', 'error'
    const [showQRScanner, setShowQRScanner] = useState(false);
    const [qrStatus, setQrStatus] = useState('');
    const [enteredPin, setEnteredPin] = useState('');
    const webcamRef = useRef(null);

    // Deadlines Tracking State
    const [deadlines, setDeadlines] = useState([]);
    const [mySubmissions, setMySubmissions] = useState([]);
    const [mcqTests, setMcqTests] = useState([]);
    const [myMcqSubmissions, setMyMcqSubmissions] = useState([]);
    const [submittingAssignment, setSubmittingAssignment] = useState(null);
    const [submissionFile, setSubmissionFile] = useState(null);
    const [submissionProgress, setSubmissionProgress] = useState(0);
    const [sppuGrades, setSppuGrades] = useState([]);
    const [now, setNow] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setNow(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    // Onboarding popup — show once on mobile for new users
    useEffect(() => {
        if (typeof window === 'undefined') return;
        const isMobile = window.innerWidth <= 768;
        const hasSeen = localStorage.getItem('dashboard_onboarding_seen');
        if (isMobile && !hasSeen && user) {
            const timer = setTimeout(() => setShowOnboarding(true), 800);
            return () => clearTimeout(timer);
        }
    }, [user]);

    const formatCountdown = (targetDateStr) => {
        const diff = new Date(targetDateStr) - now;
        if (diff <= 0) return '🚨 System Locked';
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
        const mins = Math.floor((diff / 1000 / 60) % 60);
        const secs = Math.floor((diff / 1000) % 60);
        
        if (days > 0) return `${days}d ${hours}h ${mins}m`;
        return `${hours}h ${mins}m ${secs}s`;
    };

    // Bio-Metric Configuration
    const [modelsLoaded, setModelsLoaded] = useState(false);
    const [enrollmentStatus, setEnrollmentStatus] = useState(''); // '', 'loading', 'acquiring', 'success', 'error', 'restart'
    const enrollWebcamRef = useRef(null);
    const isEnrolled = !!(user && user.faceDescriptor);

    const loadFaceModels = async () => {
        if (modelsLoaded) return;
        try {
            const faceapi = await import('@vladmandic/face-api');
            window.faceapi = faceapi;
            
            await Promise.all([
                faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
                faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
                faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL)
            ]);
            setModelsLoaded(true);
        } catch(e) {
            console.error("Failed to load models:", e);
        }
    };

    useEffect(() => {
        if (!user) { setLoadingUploads(false); return; }
        let cancelled = false;

        const fetchPersonalUploads = async () => {
            setLoadingUploads(true);
            try {
                if (!db) throw new Error('Firestore not initialized');
                const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 6000));
                // Only fetch this user's uploads — not the entire collection
                const userUploadsQ = query(
                    collection(db, 'files'),
                    where('uploaderUID', '==', user.uid)
                );
                const snapshot = await Promise.race([getDocs(userUploadsQ), timeout]);
                if (cancelled) return;
                const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
                // Sort manually to avoid requiring a composite index
                data.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
                setUploads(data);
            } catch (error) {
                console.error('Error fetching uploads:', error);
                if (!cancelled) setUploads([]);
            }
            if (!cancelled) setLoadingUploads(false);
        };

        const fetchClassData = async () => {
            if (!user.classId) return;
            setLoadingClassData(true);
            try {
                // 1. Fetch entire attendance for the class to calc personal stats
                const attQuery = query(collection(db, 'attendance'), where('classId', '==', user.classId));
                const attSnap = await getDocs(attQuery);
                let p = 0, a = 0, l = 0, e = 0;
                
                const history = [];

                attSnap.forEach(docSnap => {
                    const data = docSnap.data();
                    let status = null;
                    if (data.presentStudents?.includes(user.email)) { p++; status = 'present'; }
                    else if (data.absentStudents?.includes(user.email)) { a++; status = 'absent'; }
                    else if (data.lateStudents?.includes(user.email)) { l++; status = 'late'; }
                    else if (data.excusedStudents?.includes(user.email)) { e++; status = 'excused'; }

                    if (status) {
                        history.push({ date: data.date, status });
                    }
                });

                history.sort((x, y) => new Date(y.date) - new Date(x.date));
                let streak = 0;
                for (let rec of history) {
                    if (rec.status === 'present') streak++;
                    else if (rec.status === 'excused') continue;
                    else break;
                }

                if (!cancelled) {
                    setAttendanceHistory(history.slice(0, 7)); // Last 7 records
                    setCurrentStreak(streak);
                }

                const total = p + a + l + e;
                const pct = total > 0 ? Math.round(((p + (l * 0.5) + e) / total) * 100) : 0;
                if (!cancelled) setAttendanceStats({ present: p, absent: a, late: l, excused: e, total, percentage: pct });

                // 1.5 Fetch My Leave Requests
                const lrQuery = query(collection(db, 'leaveRequests'), where('studentEmail', '==', user.email));
                const lrSnap = await getDocs(lrQuery);
                const lrList = lrSnap.docs.map(d => ({ id: d.id, ...d.data() }));
                lrList.sort((x, y) => new Date(y.timestamp) - new Date(x.timestamp));
                if (!cancelled) setMyLeaveRequests(lrList);

                // 1.6 Fetch My Submissions
                const subQuery = query(collection(db, 'submissions'), where('studentEmail', '==', user.email));
                const subSnap = await getDocs(subQuery);
                const subList = subSnap.docs.map(d => ({ id: d.id, ...d.data() }));
                if (!cancelled) setMySubmissions(subList);

                // 1.6.5 Fetch My MCQ Submissions
                const mcqSubQuery = query(collection(db, 'mcqSubmissions'), where('studentEmail', '==', user.email));
                const mcqSubSnap = await getDocs(mcqSubQuery);
                const mcqSubList = mcqSubSnap.docs.map(d => ({ id: d.id, ...d.data() }));
                if (!cancelled) setMyMcqSubmissions(mcqSubList);

                // 1.7 Fetch SPPU Grades
                const sppuGradesQ = query(collection(db, 'sppuGrades'), where('studentEmail', '==', user.email));
                const sppuGradesSnap = await getDocs(sppuGradesQ);
                const sppuList = sppuGradesSnap.docs.map(d => ({ id: d.id, ...d.data() }));
                if (!cancelled) setSppuGrades(sppuList);

                // 2. Fetch Announcements
                const annQuery = query(collection(db, 'announcements'), where('classId', '==', user.classId));
                const annSnap = await getDocs(annQuery);
                const annList = annSnap.docs.map(d => ({ id: d.id, ...d.data() }));
                annList.sort((x, y) => (y.timestamp || '').localeCompare(x.timestamp || ''));
                if (!cancelled) setAnnouncements(annList);

                // 3. Fetch Class Uploads
                const matQuery = query(collection(db, 'files'), where('classId', '==', user.classId));
                const matSnap = await getDocs(matQuery);
                const matList = matSnap.docs.map(d => ({ id: d.id, ...d.data() }));
                matList.sort((x, y) => (y.createdAt || '').localeCompare(x.createdAt || ''));
                if (!cancelled) setClassMaterials(matList);

            } catch(e) {
                console.error("Error fetching class data:", e);
            }
            if (!cancelled) setLoadingClassData(false);
        };

        fetchPersonalUploads();
        fetchClassData();

        return () => { cancelled = true; };
    }, [user]);

    // Live Session Listener
    useEffect(() => {
        if (!user || !user.classId) {
            return () => {};
        }
        
        const unsub = onSnapshot(doc(db, 'liveSessions', user.classId), (docSnap) => {
            if (docSnap.exists() && docSnap.data().active) {
                setActiveLiveSession(docSnap.data());
            } else {
                setActiveLiveSession(null);
                setShowScanner(false);
            }
        });

        // 1.5 Listen for Live Deadlines
        const unsubDeadlines = onSnapshot(query(collection(db, 'deadlines'), where('classId', '==', user.classId)), (snapshot) => {
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            const upcoming = data.filter(d => new Date(d.dueDate) > new Date());
            upcoming.sort((a,b) => new Date(a.dueDate) - new Date(b.dueDate)); // Most urgent first
            setDeadlines(upcoming);
        });

        // 1.6 Listen for Live MCQ Tests
        const unsubMcq = onSnapshot(query(collection(db, 'mcqTests'), where('classId', '==', user.classId)), (snapshot) => {
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            const upcoming = data.filter(d => new Date(d.dueDate) > new Date());
            upcoming.sort((a,b) => new Date(a.dueDate) - new Date(b.dueDate));
            setMcqTests(upcoming);
        });

        return () => {
            unsub();
            unsubDeadlines();
            unsubMcq();
        };
    }, [user]);

    // Check if user has already checked in to the active session
    useEffect(() => {
        if (!activeLiveSession || !user) {
            setHasCheckedIn(null);
            return;
        }
        
        const q = query(
            collection(db, 'liveCheckins'), 
            where('classId', '==', activeLiveSession.classId), 
            where('date', '==', activeLiveSession.date),
            where('studentEmail', '==', user.email)
        );
        const unsub = onSnapshot(q, (snap) => {
            if (!snap.empty) {
                setHasCheckedIn(snap.docs[0].data());
            } else {
                setHasCheckedIn(null);
            }
        });
        return () => unsub();
    }, [activeLiveSession, user]);

    // Listen for Official Monthly Reports
    useEffect(() => {
        if (!user || !user.classId) return;
        const q = query(
            collection(db, 'monthlyReports'),
            where('classId', '==', user.classId)
        );
        const unsub = onSnapshot(q, (snap) => {
            const reports = [];
            snap.forEach(d => reports.push({ id: d.id, ...d.data() }));
            // sort by month descending
            reports.sort((a,b) => b.month.localeCompare(a.month));
            setMonthlyReports(reports);
        });
        return () => unsub();
    }, [user]);

    // Haversine Algorithm
    const getDistanceFromLatLonInM = (lat1, lon1, lat2, lon2) => {
        const R = 6371e3; // Radius of the earth in m
        const dLat = (lat2 - lat1) * (Math.PI / 180);
        const dLon = (lon2 - lon1) * (Math.PI / 180);
        const a = 
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * 
            Math.sin(dLon / 2) * Math.sin(dLon / 2); 
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)); 
        const d = R * c; 
        return d;
    };

    // Handle check in
    const triggerVerification = () => {
        setShowScanner(true);
        setScanStatus('');
    };

    const handleFacialScanAndGeo = async () => {
        if (!activeLiveSession) return;

        if (enteredPin !== activeLiveSession.sessionPin) {
            setScanStatus('error: Invalid Session PIN. Ask your teacher for the 4-digit code.');
            return;
        }

        if (!user.faceDescriptor) {
            setScanStatus('error: No biometric data found! Enroll your face in Profile settings first.');
            return;
        }

        setScanStatus('verifying');
        
        if (!webcamRef.current || !webcamRef.current.video) {
            setScanStatus('error: camera disconnected or not rendering'); return;
        }

        try {
            // Load models if not loaded
            if (!modelsLoaded) {
                setScanStatus('loading AI Models (this will take a few seconds)...');
                await loadFaceModels();
                setScanStatus('verifying'); // revert text
            }

            // Extract live descriptor
            const faceapi = window.faceapi;
            const videoEl = webcamRef.current.video;
            const detections = await faceapi.detectSingleFace(videoEl, new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks().withFaceDescriptor();

            if (!detections) {
                setScanStatus('error: No face detected. Ensure good lighting and look straight at the camera.');
                return;
            }

            // Compare with saved descriptor
            const savedDescriptor = new Float32Array(user.faceDescriptor);
            const liveDescriptor = detections.descriptor;
            const distance = faceapi.euclideanDistance(liveDescriptor, savedDescriptor);

            if (distance > 0.55) { // default is 0.6, 0.55 is a bit stricter
                setScanStatus(`error: Identity mismatch! (Distance: ${distance.toFixed(2)} / limit 0.55)`);
                return;
            }

            // Face verified mathematically! Now do fast Geo.
            if (!navigator.geolocation) {
                setScanStatus('error: Geolocation not supported'); return;
            }

            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    const { latitude, longitude, accuracy } = position.coords;
                    
                    if (accuracy > 40) {
                        setScanStatus(`error: GPS signal too weak (Accuracy: ${Math.round(accuracy)}m). Needs < 40m. Move closer to a window.`);
                        return;
                    }

                    const geoDist = getDistanceFromLatLonInM(
                        latitude, longitude, 
                        activeLiveSession.teacherLat, activeLiveSession.teacherLng
                    );

                    if (geoDist > 15) {
                        setScanStatus(`error: ML Math passed, but you're ${Math.round(geoDist)}m away. Must be < 15m.`);
                        return;
                    }

                    // Fast write to Firebase (No storage blobs overhead!)
                    await addDoc(collection(db, 'liveCheckins'), {
                        classId: activeLiveSession.classId,
                        date: activeLiveSession.date,
                        studentEmail: user.email,
                        studentName: user.name || 'Anonymous',
                        distance: geoDist,
                        verifiedMath: true,
                        timestamp: new Date().toISOString()
                    });

                    setScanStatus('success');
                    setTimeout(() => setShowScanner(false), 2000);
                },
                (error) => {
                    setScanStatus('error: GPS Error: ' + error.message);
                },
                { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
            );

        } catch (e) {
            setScanStatus('error: ML Engine Failure - ' + e.message);
        }
    };

    // QR Scanning Logic
    const triggerQRScan = () => {
        setShowQRScanner(true);
        setQrStatus('');
    };

    const runQRExtraction = () => {
        if (!showQRScanner) return; // double check

        if (!webcamRef.current || !webcamRef.current.video) {
            requestAnimationFrame(runQRExtraction);
            return;
        }

        const video = webcamRef.current.video;
        if (video.readyState === video.HAVE_ENOUGH_DATA && video.videoWidth > 0) {
            const canvas = document.createElement("canvas");
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const ctx = canvas.getContext("2d");
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            
            const code = jsQR(imageData.data, imageData.width, imageData.height, {
                inversionAttempts: "attemptBoth",
            });
            
            if (code) {
                try {
                    const payload = JSON.parse(code.data);
                    if (payload.classId === activeLiveSession.classId && payload.date === activeLiveSession.date) {
                        setQrStatus('success');
                        
                        addDoc(collection(db, 'liveCheckins'), {
                            classId: activeLiveSession.classId,
                            date: activeLiveSession.date,
                            studentEmail: user.email,
                            studentName: user.name || 'Anonymous',
                            distance: 0,
                            verifiedMath: true,
                            isQR: true,
                            timestamp: new Date().toISOString()
                        });
                        
                        setTimeout(() => setShowQRScanner(false), 2000);
                        return; // Stop scan loop
                    } else {
                        setQrStatus('error: Invalid QR payload');
                    }
                } catch(e) {
                    // Invalid JSON payload, ignore
                }
            }
        }
        
        requestAnimationFrame(runQRExtraction);
    };

    useEffect(() => {
        if (showQRScanner && qrStatus !== 'success') {
            setQrStatus('scanning');
            const timer = setTimeout(() => {
                requestAnimationFrame(runQRExtraction);
            }, 600); // Give webcam warmup time
            return () => clearTimeout(timer);
        }
    }, [showQRScanner]);

    const startEditing = () => {
        setEditName(user.name || '');
        setEditCollege(user.college || '');
        setEditBranch(user.branch || '');
        setEditYear(user.year || '');
        setEditSemester(user.semester || '');
        setEditBio(user.bio || '');
        setEditStudentPhone(user.studentPhone || '');
        setEditParentPhone(user.parentPhone || '');
        setEditBanner(user.profileBanner || 'neon');
        setEditTagline(user.profileTagline || '');
        setEditShowcase(user.showcaseBadges || []);
        setAvatarPreview(null);
        setAvatarFile(null);
        setEditing(true);
    };

    const handleAvatarSelect = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        
        // Validate file type
        if (!file.type.startsWith('image/')) {
            alert('Please select an image file (JPEG, PNG, WebP, etc.)');
            return;
        }
        
        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            alert('Image must be under 5MB');
            return;
        }
        
        setAvatarFile(file);
        // Create preview
        const reader = new FileReader();
        reader.onload = (ev) => setAvatarPreview(ev.target.result);
        reader.readAsDataURL(file);
    };

    const uploadAvatar = async () => {
        if (!avatarFile || !user) return null;
        setUploadingAvatar(true);
        try {
            const safeName = avatarFile.name.replace(/[^a-zA-Z0-9._-]/g, '_');
            const fileName = `${Date.now()}_${safeName}`;
            const storageRef = ref(storage, `avatars/${fileName}`);

            const uploadTask = await uploadBytesResumable(storageRef, avatarFile);
            const downloadURL = await getDownloadURL(uploadTask.ref);

            setUploadingAvatar(false);
            return downloadURL;
        } catch (err) {
            console.error('Avatar upload failed:', err);
            setUploadingAvatar(false);
            return null;
        }
    };

    const enrollBiometrics = async () => {
        setEnrollmentStatus('loading');
        await loadFaceModels();
        setEnrollmentStatus('acquiring');
        
        setTimeout(async () => {
            if (!enrollWebcamRef.current || !enrollWebcamRef.current.video) {
                setEnrollmentStatus('error: Webcam feed missing');
                return;
            }
            try {
                const faceapi = window.faceapi;
                const videoEl = enrollWebcamRef.current.video;
                const detections = await faceapi.detectSingleFace(videoEl, new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks().withFaceDescriptor();
                
                if (!detections) {
                    setEnrollmentStatus('error: No face clearly visible to compute math.');
                    return;
                }
                
                const descriptorArray = Array.from(detections.descriptor);
                
                await updateDoc(doc(db, 'users', user.uid), {
                    faceDescriptor: descriptorArray
                });
                
                // Locally mutate active user object temporarily until next Auth refresh
                user.faceDescriptor = descriptorArray;
                setEnrollmentStatus('success');
            } catch (err) {
                setEnrollmentStatus('error: ' + err.message);
            }
        }, 1500); 
    };

    const saveProfile = async () => {
        setSaving(true);
        try {
            const subjects = getSubjects(editBranch, editSemester);
            const profileData = {
                name: editName,
                college: editCollege, branch: editBranch, year: editYear,
                semester: editSemester, subjects: subjects,
                bio: editBio,
                studentPhone: editStudentPhone, parentPhone: editParentPhone,
                profileBanner: editBanner, profileTagline: editTagline,
                showcaseBadges: editShowcase,
                profileComplete: true,
            };

            // Upload avatar if a new one was selected
            if (avatarFile) {
                const photoURL = await uploadAvatar();
                if (photoURL) {
                    profileData.photoURL = photoURL;
                }
            }

            await updateUserProfile(profileData);
            setAvatarPreview(null);
            setAvatarFile(null);
            setEditing(false);
        } catch (e) { console.error(e); }
        setSaving(false);
    };

    const submitLeaveRequest = async (e) => {
        e.preventDefault();
        if (!leaveDate || !leaveReason) return;
        setLeaveSubmitting(true);
        try {
            const newReq = {
                studentEmail: user.email,
                studentName: user.name || 'Anonymous',
                classId: user.classId,
                date: leaveDate,
                reason: leaveReason,
                status: 'pending',
                timestamp: new Date().toISOString()
            };
            const docRef = await addDoc(collection(db, 'leaveRequests'), newReq);
            setMyLeaveRequests(prev => [{ id: docRef.id, ...newReq }, ...prev]);
            setLeaveModalOpen(false);
            setLeaveDate('');
            setLeaveReason('');
        } catch (err) {
            console.error("Leave request error", err);
        }
        setLeaveSubmitting(false);
    };

    const handleAssignmentSubmit = async (e, deadline) => {
        e.preventDefault();
        if (!submissionFile) return;
        setSubmittingAssignment(deadline.id);
        setSubmissionProgress(0);
        
        try {
            const safeName = submissionFile.name.replace(/[^a-zA-Z0-9._-]/g, '_');
            const fileName = `${Date.now()}_${safeName}`;
            const storageRef = ref(storage, `submissions/${fileName}`);

            const uploadTask = uploadBytesResumable(storageRef, submissionFile);

            uploadTask.on(
                'state_changed',
                (snapshot) => {
                    const pct = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
                    setSubmissionProgress(pct);
                },
                (err) => {
                    console.error('Submission upload error:', err);
                    setSubmittingAssignment(null);
                    setSubmissionProgress(0);
                },
                async () => {
                    try {
                        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);

                        const newSub = {
                            deadlineId: deadline.id,
                            studentEmail: user.email,
                            studentName: user.name || 'Anonymous',
                            studentPhone: user.studentPhone || '',
                            parentPhone: user.parentPhone || '',
                            fileUrl: downloadURL, // Public HTTPS Firebase Storage URL!
                            submittedAt: new Date().toISOString()
                        };
                        
                        const docRef = await addDoc(collection(db, 'submissions'), newSub);
                        setMySubmissions(prev => [...prev, { id: docRef.id, ...newSub }]);
                        
                        setSubmittingAssignment(null);
                        setSubmissionFile(null);
                        setSubmissionProgress(0);
                    } catch (err) {
                        console.error('Firestore save error:', err);
                        setSubmittingAssignment(null);
                    }
                }
            );
        } catch(e) {
            console.error(e);
            setSubmittingAssignment(null);
        }
    };

    if (!user) {
        return (
            <div className={styles.pageWrapper}>
                <div className={styles.pageInner}>
                    <div className={`${styles.loginPrompt} glass-panel`}>
                        <div className={styles.loginIcon}><IconLock size={64} /></div>
                        <h2 className={styles.loginTitle}>Sign In Required</h2>
                        <p className={styles.loginText}>Track your uploads, saved notes, and contribution points.</p>
                        <Link href="/login" className={styles.loginBtn}>Authenticate Now</Link>
                    </div>
                </div>
            </div>
        );
    }

    const totalDownloads = uploads.reduce((sum, u) => sum + (u.downloads || 0), 0);
    const availableSemesters = editYear ? (SEMESTERS[editYear] || []) : [];

    // --- Gamification Logic (Unified) ---
    const userPoints = user.points || 0;
    const gamification = getUserLevelAndBadges(userPoints);
    const userLevel = gamification.level;
    const nextLevelPoints = gamification.nextLevelPoints;
    const levelProgress = gamification.progressToNextLevel;
    const earnedBadges = gamification.earnedBadges;
    const currentBadge = gamification.currentBadge;

    // Determine ring color
    let ringColor = 'var(--success)';
    if (attendanceStats.percentage < 75) ringColor = 'var(--error)';
    else if (attendanceStats.percentage < 85) ringColor = 'var(--warning)';

    // Aggregate SPPU Grades
    const subjectGrades = {};
    sppuGrades.forEach(g => {
        if (!subjectGrades[g.subject]) {
            subjectGrades[g.subject] = { totalObtained: 0, totalMax: 0, components: [] };
        }
        subjectGrades[g.subject].components.push({ type: g.examType, obtained: g.marksObtained, max: g.maxMarks, date: g.dateRecorded });
        subjectGrades[g.subject].totalObtained += g.marksObtained;
        subjectGrades[g.subject].totalMax += g.maxMarks;
    });

    const sppuSummary = Object.keys(subjectGrades).map(sub => {
        const data = subjectGrades[sub];
        const gradeInfo = getSPPUGrade(data.totalObtained, data.totalMax);
        return { subject: sub, ...data, gradeInfo };
    });

    const currentSGPA = calculateSGPA(sppuSummary.map(s => s.gradeInfo));

    return (
        <div className={styles.pageWrapper}>
            <div className={styles.pageInner}>
                
                {/* ═══ FLOATING ORBS ═══ */}
                <div className={styles.heroOrb1}></div>
                <div className={styles.heroOrb2}></div>
                <div className={styles.heroOrb3}></div>

                {/* ═══ HERO PROFILE SECTION ═══ */}
                <section className={styles.heroSection} style={{ background: getBannerGradient(user.profileBanner) }}>
                    <div className={styles.bannerOverlay}></div>
                    <div className={styles.bannerParticles}>
                        {[...Array(6)].map((_, i) => (
                            <div key={i} className={styles.bannerParticle}
                                style={{ left: `${10 + i * 15}%`, animationDelay: `${i * 0.6}s`, width: `${3 + (i % 3) * 2}px`, height: `${3 + (i % 3) * 2}px` }}
                            />
                        ))}
                    </div>
                    <div className={styles.heroProfile}>
                        <div className={styles.heroAvatarRing}>
                            <svg className={styles.xpRingSvg} viewBox="0 0 120 120">
                                <circle cx="60" cy="60" r="54" className={styles.xpRingBg} />
                                <circle cx="60" cy="60" r="54" className={styles.xpRingFill}
                                    style={{ strokeDasharray: `${(levelProgress / 100) * 339.3} 339.3` }}
                                />
                            </svg>
                            <div className={styles.heroAvatarInner}>
                                {user.photoURL ? (
                                    <img src={user.photoURL} alt={user.name} referrerPolicy="no-referrer" className={styles.heroAvatarImg} />
                                ) : (
                                    <div className={styles.heroAvatarFallback}>
                                        {user.name ? user.name.charAt(0).toUpperCase() : '?'}
                                    </div>
                                )}
                            </div>
                            <div className={styles.heroLevelPill}>{currentBadge?.icon} {userLevel}</div>
                            <button 
                                className={styles.heroEditBtn}
                                onClick={() => { startEditing(); setActiveDashboardTab('settings'); setTimeout(() => fileInputRef.current?.click(), 100); }}
                                title="Change photo"
                            >📷</button>
                        </div>
                        <div className={styles.heroMeta}>
                            <h1 className={styles.heroName}>{user.name}</h1>
                            <p className={styles.heroEmail}>{user.email}</p>
                            {user.bio && <p className={styles.heroBio}>"{user.bio}"</p>}
                            <div className={styles.heroPills}>
                                <span className={styles.heroPill}>{currentBadge?.icon} {currentBadge?.name}</span>
                                <span className={styles.heroPill}>⭐ {userPoints} XP</span>
                                {user.classId && <span className={styles.heroPillAccent}>📘 {user.classId}</span>}
                            </div>
                        </div>
                    </div>

                    {/* ── XP Progress Bar ── */}
                    <div className={styles.heroProgressWrap}>
                        <div className={styles.heroProgressMeta}>
                            <span>Level {userLevel} → Level {userLevel + 1}</span>
                            <span>{userPoints} / {nextLevelPoints} XP</span>
                        </div>
                        <div className={styles.heroProgressTrack}>
                            <div className={styles.heroProgressFill} style={{ width: `${levelProgress}%` }}></div>
                        </div>
                    </div>

                    {/* ── Stats Cards ── */}
                    <div className={styles.heroStats}>
                        <div className={styles.heroStatItem}>
                            <span className={styles.heroStatNum}>{uploads.length}</span>
                            <span className={styles.heroStatLabel}>Uploads</span>
                        </div>
                        <div className={styles.heroStatItem}>
                            <span className={styles.heroStatNum}>{totalDownloads}</span>
                            <span className={styles.heroStatLabel}>Downloads</span>
                        </div>
                        <div className={styles.heroStatItem}>
                            <span className={styles.heroStatNum}>{userPoints}</span>
                            <span className={styles.heroStatLabel}>Total XP</span>
                        </div>
                        <div className={styles.heroStatItem}>
                            <span className={styles.heroStatNum}>{earnedBadges.length}</span>
                            <span className={styles.heroStatLabel}>Badges</span>
                        </div>
                    </div>
                </section>

                {/* ═══ INTERACTIVE DASHBOARD TABS ═══ */}
                <div className={styles.dashboardTabsNav}>
                    <button 
                        className={`${styles.dashboardTabBtn} ${activeDashboardTab === 'overview' ? styles.dashboardTabBtnActive : ''}`}
                        onClick={() => setActiveDashboardTab('overview')}
                    >
                        🏠 Overview
                    </button>
                    {user.classId && (
                        <button 
                            className={`${styles.dashboardTabBtn} ${activeDashboardTab === 'classroom' ? styles.dashboardTabBtnActive : ''}`}
                            onClick={() => setActiveDashboardTab('classroom')}
                        >
                            📘 Class Hub
                        </button>
                    )}
                    <button 
                        className={`${styles.dashboardTabBtn} ${activeDashboardTab === 'repository' ? styles.dashboardTabBtnActive : ''}`}
                        onClick={() => setActiveDashboardTab('repository')}
                    >
                        📂 Repository
                    </button>
                    <button 
                        className={`${styles.dashboardTabBtn} ${activeDashboardTab === 'settings' ? styles.dashboardTabBtnActive : ''}`}
                        onClick={() => setActiveDashboardTab('settings')}
                    >
                        ⚙️ Settings
                    </button>
                </div>

                {/* ═══ TAB CONTENT PANELS ═══ */}
                <div className={styles.tabContentPanel}>
                    
                    {/* ──── OVERVIEW TAB ──── */}
                    {activeDashboardTab === 'overview' && (
                        <OverviewTab
                            setDockOpen={setDockOpen}
                            dockOpen={dockOpen}
                            user={user}
                            earnedBadges={earnedBadges}
                            uploads={uploads}
                            totalDownloads={totalDownloads}
                            userPoints={userPoints}
                            currentBadge={currentBadge}
                            userLevel={userLevel}
                            loadingUploads={loadingUploads}
                        />
                    )}

                    {/* ──── CLASSROOM TAB ──── */}
                    {activeDashboardTab === 'classroom' && user.classId && (
                        <ClassroomTab
                            user={user}
                            activeLiveSession={activeLiveSession}
                            hasCheckedIn={hasCheckedIn}
                            triggerQRScan={triggerQRScan}
                            triggerVerification={triggerVerification}
                            sppuSummary={sppuSummary}
                            currentSGPA={currentSGPA}
                            monthlyReports={monthlyReports}
                            deadlines={deadlines}
                            now={now}
                            formatCountdown={formatCountdown}
                            mySubmissions={mySubmissions}
                            submittingAssignment={submittingAssignment}
                            submissionProgress={submissionProgress}
                            handleAssignmentSubmit={handleAssignmentSubmit}
                            setSubmissionFile={setSubmissionFile}
                            mcqTests={mcqTests}
                            myMcqSubmissions={myMcqSubmissions}
                            attendanceStats={attendanceStats}
                            ringColor={ringColor}
                            currentStreak={currentStreak}
                            attendanceHistory={attendanceHistory}
                            setLeaveModalOpen={setLeaveModalOpen}
                            myLeaveRequests={myLeaveRequests}
                            announcements={announcements}
                            loadingClassData={loadingClassData}
                        />
                    )}

                    {/* ──── REPOSITORY TAB ──── */}
                    {activeDashboardTab === 'repository' && (
                        <RepositoryTab
                            user={user}
                            classMaterials={classMaterials}
                            getTypeClass={getTypeClass}
                            getUploadIcon={getUploadIcon}
                            loadingUploads={loadingUploads}
                            uploads={uploads}
                            getStatusBadge={getStatusBadge}
                        />
                    )}

                    {/* ──── SETTINGS TAB ──── */}
                    {activeDashboardTab === 'settings' && (
                        <SettingsTab
                            editing={editing}
                            user={user}
                            startEditing={startEditing}
                            avatarPreview={avatarPreview}
                            handleAvatarSelect={handleAvatarSelect}
                            fileInputRef={fileInputRef}
                            editName={editName}
                            setEditName={setEditName}
                            editBio={editBio}
                            setEditBio={setEditBio}
                            editStudentPhone={editStudentPhone}
                            setEditStudentPhone={setEditStudentPhone}
                            editParentPhone={editParentPhone}
                            setEditParentPhone={setEditParentPhone}
                            editCollege={editCollege}
                            setEditCollege={setEditCollege}
                            editBranch={editBranch}
                            setEditBranch={setEditBranch}
                            editYear={editYear}
                            setEditYear={setEditYear}
                            editSemester={editSemester}
                            setEditSemester={setEditSemester}
                            availableSemesters={availableSemesters}
                            selectedSubjects={selectedSubjects}
                            handleSubjectToggle={handleSubjectToggle}
                            editBanner={editBanner}
                            setEditBanner={setEditBanner}
                            earnedBadges={earnedBadges}
                            editShowcase={editShowcase}
                            setEditShowcase={setEditShowcase}
                            isEnrolled={isEnrolled}
                            enrollmentStatus={enrollmentStatus}
                            setEnrollmentStatus={setEnrollmentStatus}
                            enrollWebcamRef={enrollWebcamRef}
                            enrollBiometrics={enrollBiometrics}
                            setEditing={setEditing}
                            saveProfile={saveProfile}
                            saving={saving}
                            uploadingAvatar={uploadingAvatar}
                            performanceMode={performanceMode}
                            togglePerformanceMode={togglePerformanceMode}
                        />
                    )}
                </div>
            </div>

            {/* LEAVE REQUEST MODAL */}
            <LeaveModal
                leaveModalOpen={leaveModalOpen}
                setLeaveModalOpen={setLeaveModalOpen}
                submitLeaveRequest={submitLeaveRequest}
                leaveDate={leaveDate}
                setLeaveDate={setLeaveDate}
                leaveReason={leaveReason}
                setLeaveReason={setLeaveReason}
                leaveSubmitting={leaveSubmitting}
            />

            {/* LIVE QR SCANNER MODAL */}
            <QRScannerModal
                showQRScanner={showQRScanner}
                setShowQRScanner={setShowQRScanner}
                webcamRef={webcamRef}
                qrStatus={qrStatus}
            />

            {/* LIVE BIO SCANNER MODAL */}
            <BioScannerModal
                showScanner={showScanner}
                setShowScanner={setShowScanner}
                webcamRef={webcamRef}
                scanStatus={scanStatus}
                handleFacialScanAndGeo={handleFacialScanAndGeo}
                enteredPin={enteredPin}
                setEnteredPin={setEnteredPin}
            />

            {/* ONBOARDING POPUP */}
            <OnboardingPopup
                showOnboarding={showOnboarding}
                setShowOnboarding={setShowOnboarding}
            />
        </div>
    );
}
