'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { collection, getDocs, doc, updateDoc, deleteDoc, query, where, setDoc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { useCollege } from '@/context/CollegeContext';
import styles from './page.module.css';
import Link from 'next/link';
import { IconShield, IconCheck, IconX, IconEye, IconLock, IconFolder, IconUser, IconCalendar, IconFlag, IconPen } from '@/components/Icons';
import YouTubeAdmin from './YouTubeAdmin';

// Add your admin email(s) here
const ADMIN_EMAILS = ['sutraverse11@gmail.com'];

const TYPES = ['Notes', 'PYQ', 'Assignment'];
const BRANCHES = ['Computer', 'IT', 'Mechanical', 'Civil', 'Electrical', 'Electronics'];
const YEARS = ['1st Year', '2nd Year', '3rd Year', '4th Year'];
const DIVISIONS = ['A', 'B', 'C', 'D', 'E'];

const FEATURE_DESCRIPTIONS = {
    youtube: { label: 'YouTube Lectures', desc: 'Video lecture library' },
    community: { label: 'Community', desc: 'Discussion forum & student interaction' },
    clubs: { label: 'Clubs', desc: 'Student clubs & organizations' },
    news: { label: 'College News', desc: 'News feed & notices' },
    examMode: { label: 'Exam Mode', desc: 'Timed practice tests' },
    paperAnalysis: { label: 'Paper Analysis', desc: 'Past paper analysis tools' },
    assignments: { label: 'Assignments', desc: 'Assignment tracking & management' },
    leaderboard: { label: 'Leaderboard', desc: 'Contributor rankings' },
    aiTutor: { label: 'AI Tutor', desc: 'AI-powered study assistant' },
    pyqs: { label: 'Previous Year Questions', desc: 'PYQ archive' }
};

export default function AdminPage() {
    const { user } = useAuth();
    const [files, setFiles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState('pending');
    const [actionLoading, setActionLoading] = useState('');
    const [usersList, setUsersList] = useState([]);
    const [newsList, setNewsList] = useState([]);
    const [clubsList, setClubsList] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');

    // Broadcast State
    const [broadcastTitle, setBroadcastTitle] = useState('');
    const [broadcastBody, setBroadcastBody] = useState('');

    // Branding State
    const { branding: liveBranding } = useCollege();
    const [brandingForm, setBrandingForm] = useState({
        collegeName: '', collegeShortName: '', tagline: '', heroSubtitle: '',
        primaryColor: '#3b82f6', secondaryColor: '#22d3ee', accentColor: '#f472b6',
        primaryColorLight: '#2563eb', secondaryColorLight: '#0891b2', accentColorLight: '#db2777',
        letterColors: {}, letterColorsLight: {}, applyColorsGlobally: true,
    });
    const [brandingSaving, setBrandingSaving] = useState(false);
    const [brandingLoaded, setBrandingLoaded] = useState(false);
    const [editingTheme, setEditingTheme] = useState('dark');

    // Customization State
    const [customForm, setCustomForm] = useState({
        featureToggles: {
            youtube: true,
            community: true,
            clubs: true,
            news: true,
            examMode: true,
            paperAnalysis: true,
            assignments: true,
            leaderboard: true,
            aiTutor: true,
            pyqs: true
        },
        announcement: {
            enabled: false,
            text: '',
            link: '',
            color: '#3b82f6',
            expiresAt: ''
        },
        heroPlaceholder: 'Search for DBMS notes, DSA questions, Physics...',
        showHeroOrbs: true,
        ctaPilotText: 'Pilot Implementation',
        ctaPilotLink: '',
        ctaFacultyText: 'Faculty Onboarding',
        ctaFacultyLink: '/about',
        developedByName: 'Krushna Saruk',
        developedByLink: 'https://krushnasaruk.in',
        supportPhone: '+91 9834514884',
        supportEmail: 'sutraverse11@gmail.com',
        socials: {
            instagram: '',
            linkedin: '',
            github: '',
            youtube: ''
        },
        maintenanceMode: false,
        maintenanceMessage: 'We are performing scheduled maintenance. We will be back shortly!'
    });
    const [customSaving, setCustomSaving] = useState(false);
    const [customLoaded, setCustomLoaded] = useState(false);

    // Modal State
    const [editingFile, setEditingFile] = useState(null);
    const [editForm, setEditForm] = useState({ title: '', type: '', subject: '', branch: '', year: '' });

    const [editingUser, setEditingUser] = useState(null);
    const [userForm, setUserForm] = useState({ 
        role: 'student', 
        isAdmin: false,
        studentId: '',
        rollNo: '',
        year: '1st Year', 
        branch: 'Computer', 
        division: 'A',
        newSubject: '',
        newIsTG: false,
        newIsClassTeacher: false,
        newIsHOD: false
    });

    const openEditUserModal = (u) => {
        setEditingUser(u);
        setUserForm({
            role: u.role || 'student',
            isAdmin: u.isAdmin || false,
            studentId: u.studentId || '',
            rollNo: u.rollNo || '',
            year: u.year || '1st Year',
            branch: u.branch || 'Computer',
            division: u.division || 'A',
            newSubject: '',
            newIsTG: false,
            newIsClassTeacher: false,
            newIsHOD: false
        });
    };

    const isAdmin = user && (ADMIN_EMAILS.includes(user.email) || user.isAdmin);

    useEffect(() => {
        if (isAdmin) {
            if (tab === 'users') {
                fetchUsers();
            } else if (tab === 'news') {
                fetchNews();
            } else if (tab === 'clubs') {
                fetchClubs();
            } else if (tab === 'branding' && !brandingLoaded) {
                loadBranding();
            } else if (tab === 'customize' && !customLoaded) {
                loadCustomize();
            } else if (tab !== 'youtube' && tab !== 'system') {
                fetchFiles();
            }
        } else {
            setLoading(false);
        }
    }, [isAdmin, tab]);

    const loadBranding = async () => {
        try {
            const snap = await getDoc(doc(db, 'settings', 'college'));
            if (snap.exists()) {
                const data = snap.data();
                setBrandingForm({ 
                    ...brandingForm, 
                    ...data, 
                    letterColors: data.letterColors || {},
                    letterColorsLight: data.letterColorsLight || {}
                });
            } else {
                setBrandingForm({ ...liveBranding });
            }
            setBrandingLoaded(true);
        } catch (e) {
            console.warn('Error loading branding:', e);
            setBrandingForm({ ...liveBranding });
            setBrandingLoaded(true);
        }
    };

    const saveBranding = async () => {
        setBrandingSaving(true);
        try {
            await setDoc(doc(db, 'settings', 'college'), {
                collegeName: brandingForm.collegeName,
                collegeShortName: brandingForm.collegeShortName,
                tagline: brandingForm.tagline,
                heroSubtitle: brandingForm.heroSubtitle,
                primaryColor: brandingForm.primaryColor,
                secondaryColor: brandingForm.secondaryColor,
                accentColor: brandingForm.accentColor,
                primaryColorLight: brandingForm.primaryColorLight || brandingForm.primaryColor,
                secondaryColorLight: brandingForm.secondaryColorLight || brandingForm.secondaryColor,
                accentColorLight: brandingForm.accentColorLight || brandingForm.accentColor,
                letterColors: brandingForm.letterColors,
                letterColorsLight: brandingForm.letterColorsLight || {},
                applyColorsGlobally: brandingForm.applyColorsGlobally,
                updatedAt: new Date().toISOString(),
                updatedBy: user?.email || 'admin',
            }, { merge: true });
            alert('Branding saved successfully! Changes will appear across the platform.');
        } catch (e) {
            alert('Error saving branding: ' + e.message);
        }
        setBrandingSaving(false);
    };

    const loadCustomize = async () => {
        try {
            const snap = await getDoc(doc(db, 'settings', 'college'));
            if (snap.exists()) {
                const data = snap.data();
                setCustomForm({
                    featureToggles: {
                        ...customForm.featureToggles,
                        ...(data.featureToggles || {})
                    },
                    announcement: {
                        ...customForm.announcement,
                        ...(data.announcement || {}),
                        expiresAt: data.announcement?.expiresAt || ''
                    },
                    heroPlaceholder: data.heroPlaceholder ?? 'Search for DBMS notes, DSA questions, Physics...',
                    showHeroOrbs: data.showHeroOrbs ?? true,
                    ctaPilotText: data.ctaPilotText ?? 'Pilot Implementation',
                    ctaPilotLink: data.ctaPilotLink ?? '',
                    ctaFacultyText: data.ctaFacultyText ?? 'Faculty Onboarding',
                    ctaFacultyLink: data.ctaFacultyLink ?? '/about',
                    developedByName: data.developedByName ?? 'Krushna Saruk',
                    developedByLink: data.developedByLink ?? 'https://krushnasaruk.in',
                    supportPhone: data.supportPhone ?? '+91 9834514884',
                    supportEmail: data.supportEmail ?? 'sutraverse11@gmail.com',
                    socials: {
                        instagram: data.socials?.instagram ?? '',
                        linkedin: data.socials?.linkedin ?? '',
                        github: data.socials?.github ?? '',
                        youtube: data.socials?.youtube ?? ''
                    },
                    maintenanceMode: data.maintenanceMode ?? false,
                    maintenanceMessage: data.maintenanceMessage ?? 'We are performing scheduled maintenance. We will be back shortly!'
                });
            }
            setCustomLoaded(true);
        } catch (e) {
            console.warn('Error loading custom settings:', e);
            setCustomLoaded(true);
        }
    };

    const saveCustomize = async () => {
        setCustomSaving(true);
        try {
            await setDoc(doc(db, 'settings', 'college'), {
                featureToggles: customForm.featureToggles,
                announcement: {
                    ...customForm.announcement,
                    expiresAt: customForm.announcement.expiresAt || null
                },
                heroPlaceholder: customForm.heroPlaceholder || 'Search for DBMS notes, DSA questions, Physics...',
                showHeroOrbs: customForm.showHeroOrbs,
                ctaPilotText: customForm.ctaPilotText || 'Pilot Implementation',
                ctaPilotLink: customForm.ctaPilotLink || '',
                ctaFacultyText: customForm.ctaFacultyText || 'Faculty Onboarding',
                ctaFacultyLink: customForm.ctaFacultyLink || '/about',
                developedByName: customForm.developedByName || 'Krushna Saruk',
                developedByLink: customForm.developedByLink || 'https://krushnasaruk.in',
                supportPhone: customForm.supportPhone || '+91 9834514884',
                supportEmail: customForm.supportEmail || 'sutraverse11@gmail.com',
                socials: customForm.socials || {},
                maintenanceMode: customForm.maintenanceMode ?? false,
                maintenanceMessage: customForm.maintenanceMessage || 'We are performing scheduled maintenance. We will be back shortly!',
                updatedAt: new Date().toISOString(),
                updatedBy: user?.email || 'admin',
            }, { merge: true });
            alert('Custom settings saved successfully!');
        } catch (e) {
            alert('Error saving custom settings: ' + e.message);
        }
        setCustomSaving(false);
    };

    const setLetterColor = (index, color) => {
        setBrandingForm(prev => {
            const colorKey = editingTheme === 'light' ? 'letterColorsLight' : 'letterColors';
            return {
                ...prev,
                [colorKey]: { ...prev[colorKey], [index]: color }
            };
        });
    };

    const clearLetterColor = (index) => {
        setBrandingForm(prev => {
            const colorKey = editingTheme === 'light' ? 'letterColorsLight' : 'letterColors';
            const updated = { ...prev[colorKey] };
            delete updated[index];
            return { ...prev, [colorKey]: updated };
        });
    };

    const fetchNews = async () => {
        setLoading(true);
        try {
            const snapshot = await getDocs(collection(db, 'news'));
            let data = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
            data = data.filter(n => n.status === 'pending');
            data.sort((a, b) => {
               const timeA = a.timestamp?.toMillis ? a.timestamp.toMillis() : 0;
               const timeB = b.timestamp?.toMillis ? b.timestamp.toMillis() : 0;
               return timeB - timeA;
            });
            setNewsList(data);
        } catch (error) {
            console.error('Error fetching news:', error);
            setNewsList([]);
        }
        setLoading(false);
    };

    const handleApproveNews = async (newsId) => {
        setActionLoading(newsId);
        try {
            await updateDoc(doc(db, 'news', newsId), { status: 'approved' });
            
            const approvedNews = newsList.find(n => n.id === newsId);
            if (approvedNews) {
                fetch('/api/notifications/generate-and-send', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contentType: 'Campus Notice',
                        contentTitle: approvedNews.title,
                        contentDetails: approvedNews.content,
                    })
                }).catch(e => console.error('Failed to trigger notification', e));
            }

            setNewsList(prev => prev.filter(n => n.id !== newsId));
        } catch (error) {
            console.error('Error approving news:', error);
            alert('Failed to approve news.');
        }
        setActionLoading('');
    };

    const handleRejectNews = async (newsItem) => {
        if (!confirm(`Reject and delete news "${newsItem.title}"? This cannot be undone.`)) return;
        setActionLoading(newsItem.id);
        try {
            await deleteDoc(doc(db, 'news', newsItem.id));
            setNewsList(prev => prev.filter(n => n.id !== newsItem.id));
        } catch (error) {
            console.error('Error rejecting news:', error);
            alert('Failed to reject news.');
        }
        setActionLoading('');
    };

    const fetchClubs = async () => {
        setLoading(true);
        try {
            const snapshot = await getDocs(collection(db, 'clubs'));
            let data = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
            data = data.filter(c => c.status === 'pending');
            data.sort((a, b) => {
               const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
               const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
               return timeB - timeA;
            });
            setClubsList(data);
        } catch (error) {
            console.error('Error fetching clubs:', error);
            setClubsList([]);
        }
        setLoading(false);
    };

    const handleApproveClub = async (clubId) => {
        setActionLoading(clubId);
        try {
            await updateDoc(doc(db, 'clubs', clubId), { status: 'approved' });
            setClubsList(prev => prev.filter(c => c.id !== clubId));
        } catch (error) {
            console.error('Error approving club:', error);
            alert('Failed to approve club.');
        }
        setActionLoading('');
    };

    const handleRejectClub = async (club) => {
        if (!confirm(`Reject and delete club "${club.name}"? This cannot be undone.`)) return;
        setActionLoading(club.id);
        try {
            await deleteDoc(doc(db, 'clubs', club.id));
            setClubsList(prev => prev.filter(c => c.id !== club.id));
        } catch (error) {
            console.error('Error rejecting club:', error);
            alert('Failed to reject club.');
        }
        setActionLoading('');
    };

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const snapshot = await getDocs(collection(db, 'users'));
            const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
            data.sort((a,b) => (a.email || '').localeCompare(b.email || ''));
            setUsersList(data);
        } catch (error) {
            console.error('Error fetching users:', error);
            setUsersList([]);
        }
        setLoading(false);
    };

    const fetchFiles = async () => {
        setLoading(true);
        try {
            if (!db) throw new Error('Firestore not initialized');
            const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 8000));
            const fetchPromise = getDocs(collection(db, 'files'));
            const snapshot = await Promise.race([fetchPromise, timeout]);
            
            let data = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));

            if (tab === 'reported') {
                data = data.filter(f => f.isReported === true);
            } else {
                data = data.filter(f => f.status === tab && !f.isReported);
            }

            data.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
            setFiles(data);
        } catch (error) {
            console.error('Error fetching files:', error);
            setFiles([]);
        }
        setLoading(false);
    };

    const handleApprove = async (fileId) => {
        setActionLoading(fileId);
        try {
            await updateDoc(doc(db, 'files', fileId), { status: 'approved' });
            
            const approvedFile = files.find(f => f.id === fileId);
            if (approvedFile) {
                fetch('/api/notifications/generate-and-send', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contentType: approvedFile.type || 'Study Material',
                        contentTitle: `${approvedFile.subject || 'Subject'} - ${approvedFile.title}`,
                    })
                }).catch(e => console.error('Failed to trigger notification', e));
            }

            setFiles(prev => prev.filter(f => f.id !== fileId));
        } catch (error) {
            console.error('Error approving file:', error);
            alert('Failed to approve file.');
        }
        setActionLoading('');
    };

    const handleReject = async (file) => {
        if (!confirm(`Reject and delete "${file.title}"? This cannot be undone.`)) return;
        setActionLoading(file.id);
        try {
            await deleteDoc(doc(db, 'files', file.id));
            setFiles(prev => prev.filter(f => f.id !== file.id));
        } catch (error) {
            console.error('Error rejecting file:', error);
            alert('Failed to reject file.');
        }
        setActionLoading('');
    };

    const handleDismissReport = async (fileId) => {
        setActionLoading(fileId);
        try {
            await updateDoc(doc(db, 'files', fileId), { isReported: false, reportCount: 0 });
            setFiles(prev => prev.filter(f => f.id !== fileId));
        } catch (error) {
            console.error('Error dismissing report:', error);
            alert('Failed to clear report.');
        }
        setActionLoading('');
    };

    const toggleRole = async (userId, currentRole) => {
        setActionLoading(userId);
        try {
            const newRole = currentRole === 'teacher' ? 'student' : 'teacher';
            await updateDoc(doc(db, 'users', userId), { role: newRole });
            setUsersList(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
        } catch (e) {
            alert('Error toggling role: ' + e.message);
        }
        setActionLoading('');
    };

    const handleSeedM2 = async () => {
        if (!confirm('This will seed the M2 Notes PDFs to the database. Proceed?')) return;
        setActionLoading('seed-m2');
        try {
            const res = await fetch('/api/seed-m2');
            const data = await res.json();
            if (!data.success) throw new Error(data.error || 'Failed to fetch API res');
            
            for (let i = 0; i < data.metadataList.length; i++) {
                const meta = data.metadataList[i];
                meta.uploader = user.name || 'Admin';
                meta.uploaderUID = user.uid;
                meta.uploaderEmail = user.email;
                await setDoc(doc(collection(db, 'files')), meta);
            }
            alert('Successfully seeded M2 Notes!');
        } catch (e) {
            alert('Error seeding M2 notes: ' + e.message);
        }
        setActionLoading('');
    };

    const handleSeedBEE = async () => {
        if (!confirm('This will seed the BEE Notes/Papers to the database. Proceed?')) return;
        setActionLoading('seed-bee');
        try {
            const res = await fetch('/api/seed-bee');
            const data = await res.json();
            if (!data.success) throw new Error(data.error || 'Failed to fetch API res');
            
            for (let i = 0; i < data.metadataList.length; i++) {
                const meta = data.metadataList[i];
                meta.uploader = user.name || 'Admin';
                meta.uploaderUID = user.uid;
                meta.uploaderEmail = user.email;
                await setDoc(doc(collection(db, 'files')), meta);
            }
            alert('Successfully seeded BEE materials!');
        } catch (e) {
            alert('Error seeding BEE: ' + e.message);
        }
        setActionLoading('');
    };

    const handleFixM2Subjects = async () => {
        if (!confirm('This will fix all "Engineering Mathematics 2" subjects to "Engineering Mathematics II", AND convert all BEE files to type "Notes". Proceed?')) return;
        setActionLoading('fix-m2');
        try {
            const snapshot = await getDocs(collection(db, 'files'));
            let updatedCount = 0;
            const promises = [];
            snapshot.forEach(d => {
                const f = d.data();
                if (f.subject === 'Engineering Mathematics 2' || f.subject === 'M2') {
                    promises.push(updateDoc(doc(db, 'files', d.id), { subject: 'Engineering Mathematics II' }));
                    updatedCount++;
                }
                if (f.subject === 'BEE' && f.type !== 'Notes') {
                    promises.push(updateDoc(doc(db, 'files', d.id), { type: 'Notes' }));
                    updatedCount++;
                }
            });
            await Promise.all(promises);
            alert(`Fixed metadata for ${updatedCount} files!`);
        } catch (e) {
            alert('Error fixing subjects: ' + e.message);
        }
        setActionLoading('');
    };

    const handlePreview = (fileURL) => {
        let url = fileURL;
        if (!url) return;
        
        if (!url.includes('firebasestorage')) {
            let relativePath = '';
            if (url.includes('/api/downloads/')) relativePath = url.split('/api/downloads/')[1];
            else if (url.includes('/uploads/')) relativePath = url.split('/uploads/')[1];
            else relativePath = url.split('/').pop();
            
            relativePath = relativePath.split('?')[0];
            url = '/api/downloads/' + relativePath;
        }
        window.open(url, '_blank');
    };

    const handleBroadcastNotification = async () => {
        if (!broadcastTitle || !broadcastBody) {
            alert('Title and body are required for broadcast');
            return;
        }
        if (!confirm('Are you sure you want to send this push notification to ALL app users?')) return;
        
        setActionLoading('broadcast');
        try {
            const res = await fetch('/api/notifications/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title: broadcastTitle, body: broadcastBody })
            });
            const data = await res.json();
            if (data.success) {
                alert(`Broadcast sent successfully! (Sent to ${data.sentCount} devices)`);
                setBroadcastTitle('');
                setBroadcastBody('');
            } else {
                alert('Failed to send broadcast: ' + (data.error || 'Unknown error'));
            }
        } catch (e) {
            alert('Error sending broadcast: ' + e.message);
        }
        setActionLoading('');
    };

    const openEditModal = (file) => {
        setEditingFile(file);
        setEditForm({
            title: file.title || '',
            type: file.type || 'Notes',
            subject: file.subject || '',
            branch: file.branch || 'Computer',
            year: file.year || '1st Year'
        });
    };

    const savePathCorrection = async () => {
        if (!editingFile) return;
        setActionLoading(editingFile.id);
        try {
            const updatedData = {
                title: editForm.title || editingFile.title,
                type: editForm.type,
                subject: editForm.subject,
                branch: editForm.branch,
                year: editForm.year,
                isReported: false,
                reportCount: 0
            };
            await updateDoc(doc(db, 'files', editingFile.id), updatedData);
            
            alert('Metadata updated successfully!');
            
            if (tab === 'reported') {
                setFiles(prev => prev.filter(f => f.id !== editingFile.id));
            } else {
                setFiles(prev => prev.map(f => f.id === editingFile.id ? { ...f, ...updatedData } : f));
            }
            
            setEditingFile(null);
        } catch (error) {
            console.error('Error saving path:', error);
            alert('Failed to update file metadata.');
        }
        setActionLoading('');
    };

    const saveUserEdit = async () => {
        if (!editingUser) return;
        setActionLoading(editingUser.id);
        try {
            const updates = {
                role: userForm.role,
                isAdmin: userForm.isAdmin
            };

            // If changing to student, set class metadata
            if (userForm.role === 'student') {
                const classId = `${userForm.year}-${userForm.branch}-${userForm.division}`;
                updates.year = userForm.year;
                updates.branch = userForm.branch;
                updates.division = userForm.division;
                updates.classId = classId;
                updates.studentId = userForm.studentId;
                updates.rollNo = userForm.rollNo;

                const rosterId = `${classId}_${editingUser.id}`;
                await setDoc(doc(db, 'roster', rosterId), {
                    classId: classId, role: 'student',
                    name: editingUser.name || 'Student', email: editingUser.email || '',
                    studentId: userForm.studentId || '', rollNo: userForm.rollNo || '', 
                    studentPhone: editingUser.phone || '',
                    userId: editingUser.id, timestamp: new Date().toISOString()
                });
            }

            await updateDoc(doc(db, 'users', editingUser.id), updates);

            setUsersList(prev => prev.map(u => u.id === editingUser.id ? { ...u, ...updates } : u));
            setEditingUser(null);
            alert(`Updated profile for ${editingUser.name || editingUser.email}`);
        } catch (e) {
            alert('Error updating user: ' + e.message);
        }
        setActionLoading('');
    };

    const addTeacherAssignment = async () => {
        if (!editingUser || !userForm.newSubject.trim()) { alert('Subject is required'); return; }
        setActionLoading('adding-assignment');
        try {
            const classId = `${userForm.year}-${userForm.branch}-${userForm.division}`;
            const newAssignment = {
                classId, year: userForm.year, branch: userForm.branch,
                division: userForm.division, subject: userForm.newSubject.trim(), 
                isTG: userForm.newIsTG, isClassTeacher: userForm.newIsClassTeacher, isHOD: userForm.newIsHOD
            };
            
            const currentAssignments = editingUser.assignments || [];
            const updatedAssignments = [...currentAssignments, newAssignment];

            await updateDoc(doc(db, 'users', editingUser.id), { assignments: updatedAssignments });

            const safeSubject = userForm.newSubject.replace(/[^a-zA-Z0-9]/g, '');
            const rosterId = `${classId}_${editingUser.id}_${safeSubject}`;
            await setDoc(doc(db, 'roster', rosterId), {
                classId: classId, role: 'teacher', isTG: userForm.newIsTG, isClassTeacher: userForm.newIsClassTeacher, isHOD: userForm.newIsHOD,
                subject: userForm.newSubject.trim(), name: editingUser.name || 'Teacher',
                email: editingUser.email || '', userId: editingUser.id, timestamp: new Date().toISOString()
            });

            const updatedUser = { ...editingUser, assignments: updatedAssignments };
            setEditingUser(updatedUser);
            setUsersList(prev => prev.map(u => u.id === editingUser.id ? updatedUser : u));
            setUserForm(prev => ({ ...prev, newSubject: '', newIsTG: false, newIsClassTeacher: false, newIsHOD: false }));
        } catch (e) { alert('Error: ' + e.message); }
        setActionLoading('');
    };

    const removeTeacherAssignment = async (teacherId, indexToRemove) => {
        if (!confirm('Remove this assignment?')) return;
        setActionLoading(teacherId);
        try {
            const teacher = usersList.find(u => u.id === teacherId);
            const updated = teacher.assignments.filter((_, i) => i !== indexToRemove);
            await updateDoc(doc(db, 'users', teacherId), { assignments: updated });
            setUsersList(prev => prev.map(u => u.id === teacherId ? { ...u, assignments: updated } : u));
            if (editingUser && editingUser.id === teacherId) {
                setEditingUser({ ...editingUser, assignments: updated });
            }
        } catch(e) { alert('Error: ' + e.message); }
        setActionLoading('');
    };

    const formatFileSize = (bytes) => {
        if (!bytes) return '—';
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / 1048576).toFixed(1) + ' MB';
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '—';
        return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    };

    if (!user) {
        return (
            <div className={styles.pageWrapper}>
                <div className={styles.pageInner}>
                    <div className={styles.accessDenied}>
                        <div className={styles.accessDeniedIcon}><IconLock size={64} /></div>
                        <h2 className={styles.accessDeniedTitle}>Sign In Required</h2>
                        <p className={styles.accessDeniedText}>You must be logged in to access this page.</p>
                        <Link href="/login" style={{ color: 'var(--primary)', fontWeight: 700 }}>Go to Login →</Link>
                    </div>
                </div>
            </div>
        );
    }

    if (!isAdmin) {
        return (
            <div className={styles.pageWrapper}>
                <div className={styles.pageInner}>
                    <div className={styles.accessDenied}>
                        <div className={styles.accessDeniedIcon}><IconShield size={64} /></div>
                        <h2 className={styles.accessDeniedTitle}>Access Denied</h2>
                        <p className={styles.accessDeniedText}>You do not have admin privileges. This page is restricted to moderators only.</p>
                        <Link href="/" style={{ color: 'var(--primary)', fontWeight: 700 }}>← Go Home</Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.pageWrapper}>
            <div className={styles.pageInner}>
                <div className={styles.pageHeader}>
                    <h1 className={styles.pageTitle}><IconShield size={40} /> Admin Panel</h1>
                    <p className={styles.pageDesc}>Review uploads, moderate content, and control user access profiles.</p>
                </div>

                <div className={styles.tabs}>
                    <button className={`${styles.tab} ${tab === 'pending' ? styles.tabActive : ''}`} onClick={() => setTab('pending')}>
                        ⏳ Pending
                    </button>
                    <button className={`${styles.tab} ${tab === 'approved' ? styles.tabActive : ''}`} onClick={() => setTab('approved')}>
                        ✅ Approved
                    </button>
                    <button className={`${styles.tab} ${tab === 'reported' ? styles.reportedActive : ''}`} onClick={() => setTab('reported')}>
                        ⚠️ Reported
                    </button>
                    <button className={`${styles.tab} ${tab === 'rejected' ? styles.tabActive : ''}`} onClick={() => setTab('rejected')}>
                        ❌ Rejected
                    </button>
                    <button className={`${styles.tab} ${tab === 'news' ? styles.tabActive : ''}`} onClick={() => setTab('news')}>
                        📰 Pending News
                    </button>
                    <button className={`${styles.tab} ${tab === 'clubs' ? styles.tabActive : ''}`} onClick={() => setTab('clubs')}>
                        🏢 Pending Clubs
                    </button>
                    <button className={`${styles.tab} ${tab === 'youtube' ? styles.tabActive : ''}`} onClick={() => setTab('youtube')}>
                        ▶️ YouTube
                    </button>
                    <button className={`${styles.tab} ${tab === 'users' ? styles.specialActive : ''}`} onClick={() => setTab('users')} style={{marginLeft: 'auto', background: tab === 'users' ? 'rgba(138, 43, 226, 0.1)' : 'transparent'}}>
                        👥 Access Control
                    </button>
                    <button className={`${styles.tab} ${tab === 'system' ? styles.tabActive : ''}`} onClick={() => setTab('system')} style={{background: tab === 'system' ? 'rgba(255, 69, 0, 0.1)' : 'transparent'}}>
                        ⚙️ System
                    </button>
                    <button className={`${styles.tab} ${tab === 'branding' ? styles.tabActive : ''}`} onClick={() => setTab('branding')} style={{background: tab === 'branding' ? 'rgba(59, 130, 246, 0.1)' : 'transparent'}}>
                        🎨 Branding
                    </button>
                    <button className={`${styles.tab} ${tab === 'customize' ? styles.tabActive : ''}`} onClick={() => setTab('customize')} style={{background: tab === 'customize' ? 'rgba(16, 185, 129, 0.1)' : 'transparent'}}>
                        🔧 Customize
                    </button>
                </div>

                {tab === 'news' ? (
                    <div style={{marginTop: '20px'}}>
                        {loading ? (
                            <div className={styles.loadingState}>Fetching pending news...</div>
                        ) : newsList.length === 0 ? (
                            <div className={styles.emptyState}>No pending news applications.</div>
                        ) : (
                            <div className={styles.fileList}>
                                {newsList.map(n => (
                                    <div key={n.id} className={styles.fileCard} style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                                        <div className={styles.fileInfo}>
                                            <div className={styles.fileTitle}>{n.title}</div>
                                            <div className={styles.fileMeta}>
                                                <span className={styles.metaTag}><IconUser size={14} /> {n.authorName || 'Unknown'}</span>
                                                <span className={styles.metaTag}>Type: {n.type || 'General'}</span>
                                                <span className={styles.metaTag}><IconCalendar size={14} /> {n.timestamp?.toDate ? formatDate(n.timestamp.toDate().toISOString()) : 'Recent'}</span>
                                            </div>
                                            <div style={{marginTop: '12px', color: 'var(--text-secondary)', fontSize: '0.9rem', whiteSpace: 'pre-wrap'}}>
                                                {n.content}
                                            </div>
                                        </div>
                                        <div className={styles.fileActions} style={{flexDirection: 'column'}}>
                                            <button 
                                                className={`${styles.actionBtn} ${styles.approveBtn}`}
                                                onClick={() => handleApproveNews(n.id)}
                                                disabled={actionLoading === n.id}
                                                style={{justifyContent: 'center'}}
                                            >
                                                <IconCheck size={16} /> {actionLoading === n.id ? '...' : 'Approve'}
                                            </button>
                                            <button 
                                                className={`${styles.actionBtn} ${styles.rejectBtn}`}
                                                onClick={() => handleRejectNews(n)}
                                                disabled={actionLoading === n.id}
                                                style={{justifyContent: 'center'}}
                                            >
                                                <IconX size={16} /> Reject
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ) : tab === 'clubs' ? (
                    <div style={{marginTop: '20px'}}>
                        {loading ? (
                            <div className={styles.loadingState}>Fetching pending clubs...</div>
                        ) : clubsList.length === 0 ? (
                            <div className={styles.emptyState}>No pending club applications.</div>
                        ) : (
                            <div className={styles.fileList}>
                                {clubsList.map(c => (
                                    <div key={c.id} className={styles.fileCard} style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                                        <div className={styles.fileInfo}>
                                            <div className={styles.fileTitle}>{c.emoji} {c.name}</div>
                                            <div className={styles.fileMeta}>
                                                <span className={styles.metaTag}><IconUser size={14} /> Creator: {c.adminName || 'Unknown'} ({c.adminEmail})</span>
                                                <span className={styles.metaTag}>Category: {c.category || 'General'}</span>
                                                <span className={styles.metaTag}><IconCalendar size={14} /> {c.createdAt?.toDate ? formatDate(c.createdAt.toDate().toISOString()) : 'Recent'}</span>
                                            </div>
                                            <div style={{marginTop: '12px', color: 'var(--text-secondary)', fontSize: '0.9rem', whiteSpace: 'pre-wrap'}}>
                                                <strong>Description:</strong> {c.description}
                                            </div>
                                            {c.supervisorName && (
                                                <div style={{marginTop: '8px', color: 'var(--text-secondary)', fontSize: '0.9rem'}}>
                                                    <strong>Supervisor:</strong> {c.supervisorName} ({c.supervisorEmail})
                                                </div>
                                            )}
                                        </div>
                                        <div className={styles.fileActions} style={{flexDirection: 'column'}}>
                                            <button 
                                                className={`${styles.actionBtn} ${styles.approveBtn}`}
                                                onClick={() => handleApproveClub(c.id)}
                                                disabled={actionLoading === c.id}
                                                style={{justifyContent: 'center'}}
                                            >
                                                <IconCheck size={16} /> {actionLoading === c.id ? '...' : 'Approve'}
                                            </button>
                                            <button 
                                                className={`${styles.actionBtn} ${styles.rejectBtn}`}
                                                onClick={() => handleRejectClub(c)}
                                                disabled={actionLoading === c.id}
                                                style={{justifyContent: 'center'}}
                                            >
                                                <IconX size={16} /> Reject
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ) : tab === 'users' ? (
                    <div style={{marginTop: '20px'}}>
                        <div style={{marginBottom: '20px'}}>
                            <input 
                                type="text" 
                                placeholder="Search by name or email..." 
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className={styles.searchBar}
                            />
                        </div>
                        {loading ? (
                            <div className={styles.loadingState}>Fetching active accounts...</div>
                        ) : usersList.length === 0 ? (
                            <div className={styles.emptyState}>No users found.</div>
                        ) : (
                            <div className={styles.fileList}>
                                {usersList
                                    .filter(u => `${u.name||''} ${u.email||''}`.toLowerCase().includes(searchQuery.toLowerCase()))
                                    .map(u => (
                                    <div key={u.id} className={styles.fileCard} style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                                        <div className={styles.fileInfo}>
                                            <div className={styles.fileTitle}>{u.name || 'No Name Set'}</div>
                                            <div className={styles.fileMeta}>
                                                <span className={styles.metaTag}><IconUser size={14} /> {u.email}</span>
                                                <span className={styles.metaTag} style={{color: u.role === 'teacher' ? 'var(--neo)' : 'var(--text-secondary)'}}>Role: {u.role || 'student'}</span>
                                                {u.role === 'student' && u.classId && <span className={styles.metaTag}>Class: {u.classId}</span>}
                                                {u.isAdmin && <span className={styles.metaTag} style={{color: 'var(--primary)'}}>★ Admin</span>}
                                            </div>
                                            {u.role === 'teacher' && u.assignments?.length > 0 && (
                                                <div style={{marginTop: '8px', fontSize: '0.8rem', color: 'var(--text-secondary)'}}>
                                                    {u.assignments.map((a, i) => (
                                                        <div key={i} style={{display: 'flex', gap: '8px', alignItems: 'center', marginBottom:'4px'}}>
                                                            <span>• {a.classId} ({a.subject}) {a.isTG && <strong style={{color:'var(--primary)'}}>[TG]</strong>} {a.isClassTeacher && <strong style={{color:'var(--error)'}}>[Class Teacher]</strong>} {a.isHOD && <strong style={{color:'var(--success)'}}>[HOD]</strong>}</span>
                                                            <button 
                                                                onClick={() => removeTeacherAssignment(u.id, i)}
                                                                style={{background:'none', border:'none', color:'var(--error)', cursor:'pointer', fontSize:'0.75rem'}}
                                                            >✕</button>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                        <div className={styles.fileActions} style={{flexDirection: 'column', gap: '6px', alignItems: 'flex-end'}}>
                                            <button 
                                                className={`${styles.actionBtn} ${styles.editBtn}`}
                                                onClick={() => openEditUserModal(u)}
                                                disabled={actionLoading === u.id}
                                            >
                                                <IconPen size={16} /> Edit Profile & Roles
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ) : tab === 'youtube' ? (
                    <YouTubeAdmin />
                ) : tab === 'branding' ? (
                    <div className={styles.brandingContainer}>
                        <div className={styles.brandingHeader}>
                            <h2><IconPen size={24} /> College Branding</h2>
                            <p>Customize the platform appearance and identity for your institution.</p>
                        </div>
                        
                        <div className={styles.brandingGrid}>
                            <div className={styles.brandingCard}>
                                <h3>Identity Settings</h3>
                                
                                <div className={styles.formGroup}>
                                    <label>Full College Name</label>
                                    <input 
                                        type="text" 
                                        className={styles.modalInput}
                                        value={brandingForm.collegeName} 
                                        onChange={e => setBrandingForm({...brandingForm, collegeName: e.target.value})}
                                        placeholder="e.g. Dhole Patil College of Engineering"
                                    />
                                </div>
                                
                                <div className={styles.formGroup}>
                                    <label>Short Name (Acronym)</label>
                                    <input 
                                        type="text" 
                                        className={styles.modalInput}
                                        value={brandingForm.collegeShortName} 
                                        onChange={e => setBrandingForm({...brandingForm, collegeShortName: e.target.value})}
                                        placeholder="e.g. DPCOE"
                                    />
                                    <small style={{color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '4px', display: 'block'}}>
                                        Used in the main hero title and navigation.
                                    </small>
                                </div>
                                
                                <div className={styles.formGroup}>
                                    <label>Hero Tagline</label>
                                    <input 
                                        type="text" 
                                        className={styles.modalInput}
                                        value={brandingForm.tagline} 
                                        onChange={e => setBrandingForm({...brandingForm, tagline: e.target.value})}
                                        placeholder="e.g. Digital Academic Ecosystem for DPCOE Students"
                                    />
                                </div>

                                <div className={styles.formGroup}>
                                    <label>Hero Subtitle</label>
                                    <textarea 
                                        className={styles.modalInput}
                                        value={brandingForm.heroSubtitle} 
                                        onChange={e => setBrandingForm({...brandingForm, heroSubtitle: e.target.value})}
                                        placeholder="A brief description of the platform's goals at your college..."
                                        rows={3}
                                    />
                                </div>
                            </div>
                            
                            <div className={styles.brandingCard}>
                                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid var(--border-light)', paddingBottom: '12px'}}>
                                    <h3 style={{margin: 0, padding: 0, border: 'none'}}>Theme Colors</h3>
                                    <div style={{display: 'flex', gap: '10px'}}>
                                        <button 
                                            className={styles.tab} 
                                            style={{padding: '6px 12px', fontSize: '0.85rem', background: editingTheme === 'dark' ? 'var(--bg-elevated)' : 'transparent', color: editingTheme === 'dark' ? 'var(--text-primary)' : 'var(--text-muted)'}}
                                            onClick={() => setEditingTheme('dark')}
                                        >
                                            🌙 Dark
                                        </button>
                                        <button 
                                            className={styles.tab} 
                                            style={{padding: '6px 12px', fontSize: '0.85rem', background: editingTheme === 'light' ? 'var(--bg-elevated)' : 'transparent', color: editingTheme === 'light' ? 'var(--text-primary)' : 'var(--text-muted)'}}
                                            onClick={() => setEditingTheme('light')}
                                        >
                                            ☀️ Light
                                        </button>
                                    </div>
                                </div>
                                
                                <div className={styles.formRow} style={{display: 'flex', gap: '15px'}}>
                                    <div className={styles.formGroup} style={{flex: 1}}>
                                        <label>Primary Color</label>
                                        <div style={{display: 'flex', gap: '10px', alignItems: 'center'}}>
                                            <input 
                                                type="color" 
                                                className={styles.colorPicker}
                                                value={editingTheme === 'dark' ? brandingForm.primaryColor : (brandingForm.primaryColorLight || brandingForm.primaryColor)} 
                                                onChange={e => setBrandingForm({...brandingForm, [editingTheme === 'dark' ? 'primaryColor' : 'primaryColorLight']: e.target.value})}
                                            />
                                            <input 
                                                type="text" 
                                                className={styles.modalInput}
                                                value={editingTheme === 'dark' ? brandingForm.primaryColor : (brandingForm.primaryColorLight || brandingForm.primaryColor)} 
                                                onChange={e => setBrandingForm({...brandingForm, [editingTheme === 'dark' ? 'primaryColor' : 'primaryColorLight']: e.target.value})}
                                                style={{flex: 1}}
                                            />
                                        </div>
                                    </div>
                                    
                                    <div className={styles.formGroup} style={{flex: 1}}>
                                        <label>Secondary Color</label>
                                        <div style={{display: 'flex', gap: '10px', alignItems: 'center'}}>
                                            <input 
                                                type="color" 
                                                className={styles.colorPicker}
                                                value={editingTheme === 'dark' ? brandingForm.secondaryColor : (brandingForm.secondaryColorLight || brandingForm.secondaryColor)} 
                                                onChange={e => setBrandingForm({...brandingForm, [editingTheme === 'dark' ? 'secondaryColor' : 'secondaryColorLight']: e.target.value})}
                                            />
                                            <input 
                                                type="text" 
                                                className={styles.modalInput}
                                                value={editingTheme === 'dark' ? brandingForm.secondaryColor : (brandingForm.secondaryColorLight || brandingForm.secondaryColor)} 
                                                onChange={e => setBrandingForm({...brandingForm, [editingTheme === 'dark' ? 'secondaryColor' : 'secondaryColorLight']: e.target.value})}
                                                style={{flex: 1}}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className={styles.checkboxGroup} style={{marginTop: '15px'}}>
                                    <input 
                                        type="checkbox" 
                                        id="applyGlobally" 
                                        checked={brandingForm.applyColorsGlobally} 
                                        onChange={e => setBrandingForm({...brandingForm, applyColorsGlobally: e.target.checked})} 
                                    />
                                    <label htmlFor="applyGlobally">Apply colors globally across the platform (buttons, links, accents)</label>
                                </div>
                            </div>
                            
                            <div className={`${styles.brandingCard} ${styles.fullWidth}`}>
                                <h3>Per-Letter Accent Coloring</h3>
                                <p style={{color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '15px'}}>
                                    Customize the color of specific letters in your college's short name for the hero section.
                                </p>
                                
                                <div className={styles.letterColorGrid}>
                                    {brandingForm.collegeShortName.split('').map((letter, index) => {
                                        const activeLetterColors = editingTheme === 'light' ? brandingForm.letterColorsLight : brandingForm.letterColors;
                                        const activePrimary = editingTheme === 'light' ? (brandingForm.primaryColorLight || brandingForm.primaryColor) : brandingForm.primaryColor;
                                        return (
                                            <div key={index} className={styles.letterColorItem}>
                                                <div className={styles.letterDisplay}>{letter}</div>
                                                <input 
                                                    type="color"
                                                    className={styles.colorPickerSmall}
                                                    value={activeLetterColors[index] || activePrimary}
                                                    onChange={e => setLetterColor(index, e.target.value)}
                                                />
                                                <button 
                                                    className={styles.clearColorBtn}
                                                    onClick={() => clearLetterColor(index)}
                                                    title="Reset to default gradient"
                                                >
                                                    Reset
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                                
                                {brandingForm.collegeShortName.length === 0 && (
                                    <div className={styles.emptyState} style={{padding: '20px'}}>
                                        Enter a short name above to customize its letters.
                                    </div>
                                )}
                            </div>
                            
                            <div className={`${styles.brandingCard} ${styles.fullWidth}`}>
                                <h3 style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                                    Live Preview ({editingTheme === 'dark' ? 'Dark' : 'Light'} Theme)
                                </h3>
                                <div className={styles.previewContainer} style={{background: editingTheme === 'dark' ? '#0f172a' : '#ffffff', color: editingTheme === 'dark' ? '#f8fafc' : '#0f172a'}}>
                                    <div className={styles.previewBadge} style={{background: editingTheme === 'dark' ? '#1e293b' : '#f1f5f9', borderColor: editingTheme === 'dark' ? '#334155' : '#e2e8f0', color: editingTheme === 'dark' ? '#94a3b8' : '#64748b'}}>
                                        <span className={styles.previewBadgeDot} style={{
                                            background: editingTheme === 'dark' ? brandingForm.primaryColor : (brandingForm.primaryColorLight || brandingForm.primaryColor), 
                                            boxShadow: `0 0 8px ${editingTheme === 'dark' ? brandingForm.primaryColor : (brandingForm.primaryColorLight || brandingForm.primaryColor)}`
                                        }}></span>
                                        {brandingForm.tagline || 'Digital Academic Ecosystem'}
                                    </div>
                                    <h1 className={styles.previewTitle}>
                                        <span style={{color: editingTheme === 'dark' ? '#f8fafc' : '#0f172a', fontSize: '0.5em', display: 'block', marginBottom: '10px'}}>{brandingForm.collegeName}</span>
                                        <span className={styles.previewGradientText} style={!brandingForm.applyColorsGlobally ? {} : {
                                            background: `linear-gradient(135deg, ${editingTheme === 'dark' ? brandingForm.primaryColor : (brandingForm.primaryColorLight || brandingForm.primaryColor)}, ${editingTheme === 'dark' ? brandingForm.secondaryColor : (brandingForm.secondaryColorLight || brandingForm.secondaryColor)})`,
                                            WebkitBackgroundClip: 'text',
                                            WebkitTextFillColor: Object.keys(editingTheme === 'dark' ? brandingForm.letterColors : (brandingForm.letterColorsLight || {})).length > 0 ? 'initial' : 'transparent',
                                            color: Object.keys(editingTheme === 'dark' ? brandingForm.letterColors : (brandingForm.letterColorsLight || {})).length > 0 ? (editingTheme === 'dark' ? '#f8fafc' : '#0f172a') : 'transparent'
                                        }}>
                                            {brandingForm.collegeShortName.split('').map((letter, i) => {
                                                const activeLetterColors = editingTheme === 'light' ? (brandingForm.letterColorsLight || {}) : brandingForm.letterColors;
                                                const color = activeLetterColors[i];
                                                return (
                                                  <span
                                                    key={i}
                                                    style={color ? { color, WebkitTextFillColor: color } : {}}
                                                  >
                                                    {letter}
                                                  </span>
                                                );
                                            })}
                                        </span>
                                    </h1>
                                    <p className={styles.previewSubtitle} style={{color: editingTheme === 'dark' ? '#94a3b8' : '#64748b'}}>
                                        {brandingForm.heroSubtitle || 'A brief description of the platform...'}
                                    </p>
                                </div>
                            </div>
                        </div>
                        
                        <div className={styles.brandingActions}>
                            <button 
                                className={styles.saveBrandingBtn} 
                                onClick={saveBranding}
                                disabled={brandingSaving}
                                style={{background: brandingForm.primaryColor}}
                            >
                                {brandingSaving ? 'Saving...' : 'Save Branding Settings'}
                            </button>
                        </div>
                    </div>
                ) : tab === 'customize' ? (
                    <div className={styles.brandingContainer}>
                        <div className={styles.brandingHeader}>
                            <h2>🔧 Customize Site Features & Alerts</h2>
                            <p>Control feature availability and publish urgent announcements sitewide.</p>
                        </div>
                        
                        <div className={styles.brandingGrid}>
                            <div className={styles.brandingCard}>
                                <h3>Feature Toggles</h3>
                                <p style={{color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '20px'}}>
                                    Enable or disable modules across the platform. Disabled features will be hidden from navigation.
                                </p>
                                
                                <div className={styles.toggleGrid}>
                                    {Object.entries(FEATURE_DESCRIPTIONS).map(([key, info]) => (
                                        <div key={key} className={styles.toggleCard}>
                                            <div className={styles.toggleInfo}>
                                                <div className={styles.toggleLabel}>{info.label}</div>
                                                <div className={styles.toggleDesc}>{info.desc}</div>
                                            </div>
                                            <label className={styles.switch}>
                                                <input 
                                                    type="checkbox"
                                                    checked={customForm.featureToggles[key] ?? true}
                                                    onChange={e => {
                                                        const newVal = e.target.checked;
                                                        setCustomForm(prev => ({
                                                            ...prev,
                                                            featureToggles: {
                                                                ...prev.featureToggles,
                                                                [key]: newVal
                                                            }
                                                        }));
                                                    }}
                                                />
                                                <span className={styles.slider}></span>
                                            </label>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            
                            <div className={styles.brandingCard}>
                                <h3>Sitewide Announcement Banner</h3>
                                <p style={{color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '20px'}}>
                                    Display a prominent notice banner at the very top of every page.
                                </p>
                                
                                <div className={styles.checkboxGroup} style={{marginBottom: '20px'}}>
                                    <input 
                                        type="checkbox" 
                                        id="bannerEnabled" 
                                        checked={customForm.announcement.enabled} 
                                        onChange={e => setCustomForm({
                                            ...customForm,
                                            announcement: {
                                                ...customForm.announcement,
                                                enabled: e.target.checked
                                            }
                                        })} 
                                    />
                                    <label htmlFor="bannerEnabled" style={{fontWeight: 'bold', fontSize: '1rem'}}>Enable Announcement Banner</label>
                                </div>
                                
                                <div className={styles.formGroup}>
                                    <label>Banner Message Text</label>
                                    <input 
                                        type="text" 
                                        className={styles.modalInput}
                                        value={customForm.announcement.text} 
                                        onChange={e => setCustomForm({
                                            ...customForm,
                                            announcement: {
                                                ...customForm.announcement,
                                                text: e.target.value
                                            }
                                        })}
                                        placeholder="e.g. 📢 End Sem Exam schedule has been released! Check dates now."
                                        disabled={!customForm.announcement.enabled}
                                    />
                                </div>
                                
                                <div className={styles.formGroup}>
                                    <label>Action Link URL (Optional)</label>
                                    <input 
                                        type="text" 
                                        className={styles.modalInput}
                                        value={customForm.announcement.link} 
                                        onChange={e => setCustomForm({
                                            ...customForm,
                                            announcement: {
                                                ...customForm.announcement,
                                                link: e.target.value
                                            }
                                        })}
                                        placeholder="e.g. /news or https://college.edu/schedule.pdf"
                                        disabled={!customForm.announcement.enabled}
                                    />
                                </div>
                                
                                <div className={styles.formRow} style={{display: 'flex', gap: '15px'}}>
                                    <div className={styles.formGroup} style={{flex: 1}}>
                                        <label>Banner Color</label>
                                        <div style={{display: 'flex', gap: '10px', alignItems: 'center'}}>
                                            <input 
                                                type="color" 
                                                className={styles.colorPicker}
                                                value={customForm.announcement.color || '#3b82f6'} 
                                                onChange={e => setCustomForm({
                                                    ...customForm,
                                                    announcement: {
                                                        ...customForm.announcement,
                                                        color: e.target.value
                                                    }
                                                })}
                                                disabled={!customForm.announcement.enabled}
                                            />
                                            <input 
                                                type="text" 
                                                className={styles.modalInput}
                                                value={customForm.announcement.color || '#3b82f6'} 
                                                onChange={e => setCustomForm({
                                                    ...customForm,
                                                    announcement: {
                                                        ...customForm.announcement,
                                                        color: e.target.value
                                                    }
                                                })}
                                                style={{flex: 1}}
                                                disabled={!customForm.announcement.enabled}
                                            />
                                        </div>
                                    </div>
                                    
                                    <div className={styles.formGroup} style={{flex: 1}}>
                                        <label>Auto-Expiry Date & Time (Optional)</label>
                                        <input 
                                            type="datetime-local" 
                                            className={styles.modalInput}
                                            value={customForm.announcement.expiresAt || ''} 
                                            onChange={e => setCustomForm({
                                                ...customForm,
                                                announcement: {
                                                    ...customForm.announcement,
                                                    expiresAt: e.target.value
                                                }
                                            })}
                                            disabled={!customForm.announcement.enabled}
                                        />
                                    </div>
                                </div>
                            </div>
                            
                            {customForm.announcement.enabled && customForm.announcement.text && (
                                <div className={`${styles.brandingCard} ${styles.fullWidth}`}>
                                    <h3>Live Banner Preview</h3>
                                    <div style={{marginTop: '15px'}}>
                                        <div style={{
                                            backgroundColor: customForm.announcement.color || '#3b82f6',
                                            color: '#ffffff',
                                            padding: '10px 20px',
                                            borderRadius: '8px',
                                            textAlign: 'center',
                                            fontWeight: 500,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '10px',
                                            fontSize: '0.9rem',
                                            cursor: customForm.announcement.link ? 'pointer' : 'default',
                                            boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                                        }}>
                                            <span>{customForm.announcement.text}</span>
                                            {customForm.announcement.link && (
                                                <span style={{
                                                    textDecoration: 'underline',
                                                    fontSize: '0.8rem',
                                                    background: 'rgba(255, 255, 255, 0.2)',
                                                    padding: '2px 6px',
                                                    borderRadius: '4px'
                                                }}>Learn more →</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className={styles.brandingCard}>
                                <h3>Hero Section Customization</h3>
                                <p style={{color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '20px'}}>
                                    Customize search inputs, background effects, and calls-to-action on the landing page.
                                </p>
                                
                                <div className={styles.formGroup}>
                                    <label>Search Bar Placeholder</label>
                                    <input 
                                        type="text" 
                                        className={styles.modalInput}
                                        value={customForm.heroPlaceholder || ''} 
                                        onChange={e => setCustomForm({...customForm, heroPlaceholder: e.target.value})}
                                        placeholder="e.g. Search for DBMS notes, DSA questions, Physics..."
                                    />
                                </div>
                                
                                <div className={styles.checkboxGroup} style={{marginBottom: '20px'}}>
                                    <input 
                                        type="checkbox" 
                                        id="showHeroOrbs" 
                                        checked={customForm.showHeroOrbs ?? true} 
                                        onChange={e => setCustomForm({...customForm, showHeroOrbs: e.target.checked})} 
                                    />
                                    <label htmlFor="showHeroOrbs" style={{fontWeight: 'bold'}}>Show Decorative Background Orbs</label>
                                </div>
                                
                                <div className={styles.formRow} style={{display: 'flex', gap: '15px', marginBottom: '15px'}}>
                                    <div className={styles.formGroup} style={{flex: 1}}>
                                        <label>Pilot CTA Button Text</label>
                                        <input 
                                            type="text" 
                                            className={styles.modalInput}
                                            value={customForm.ctaPilotText || ''} 
                                            onChange={e => setCustomForm({...customForm, ctaPilotText: e.target.value})}
                                            placeholder="e.g. Pilot Implementation"
                                        />
                                    </div>
                                    <div className={styles.formGroup} style={{flex: 1}}>
                                        <label>Pilot CTA Link URL</label>
                                        <input 
                                            type="text" 
                                            className={styles.modalInput}
                                            value={customForm.ctaPilotLink || ''} 
                                            onChange={e => setCustomForm({...customForm, ctaPilotLink: e.target.value})}
                                            placeholder="Leave blank to default to institutional mail"
                                        />
                                    </div>
                                </div>
                                
                                <div className={styles.formRow} style={{display: 'flex', gap: '15px'}}>
                                    <div className={styles.formGroup} style={{flex: 1}}>
                                        <label>Faculty CTA Button Text</label>
                                        <input 
                                            type="text" 
                                            className={styles.modalInput}
                                            value={customForm.ctaFacultyText || ''} 
                                            onChange={e => setCustomForm({...customForm, ctaFacultyText: e.target.value})}
                                            placeholder="e.g. Faculty Onboarding"
                                        />
                                    </div>
                                    <div className={styles.formGroup} style={{flex: 1}}>
                                        <label>Faculty CTA Link URL</label>
                                        <input 
                                            type="text" 
                                            className={styles.modalInput}
                                            value={customForm.ctaFacultyLink || ''} 
                                            onChange={e => setCustomForm({...customForm, ctaFacultyLink: e.target.value})}
                                            placeholder="e.g. /about"
                                        />
                                    </div>
                                </div>
                            </div>
                            
                            <div className={styles.brandingCard}>
                                <h3>Footer & Support Settings</h3>
                                <p style={{color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '20px'}}>
                                    Configure institutional contact info, support links, and platform developers.
                                </p>
                                
                                <div className={styles.formRow} style={{display: 'flex', gap: '15px', marginBottom: '15px'}}>
                                    <div className={styles.formGroup} style={{flex: 1}}>
                                        <label>Developed By (Name)</label>
                                        <input 
                                            type="text" 
                                            className={styles.modalInput}
                                            value={customForm.developedByName || ''} 
                                            onChange={e => setCustomForm({...customForm, developedByName: e.target.value})}
                                            placeholder="e.g. Krushna Saruk"
                                        />
                                    </div>
                                    <div className={styles.formGroup} style={{flex: 1}}>
                                        <label>Developer Website Link</label>
                                        <input 
                                            type="text" 
                                            className={styles.modalInput}
                                            value={customForm.developedByLink || ''} 
                                            onChange={e => setCustomForm({...customForm, developedByLink: e.target.value})}
                                            placeholder="e.g. https://krushnasaruk.in"
                                        />
                                    </div>
                                </div>
                                
                                <div className={styles.formRow} style={{display: 'flex', gap: '15px'}}>
                                    <div className={styles.formGroup} style={{flex: 1}}>
                                        <label>Support Contact Phone</label>
                                        <input 
                                            type="text" 
                                            className={styles.modalInput}
                                            value={customForm.supportPhone || ''} 
                                            onChange={e => setCustomForm({...customForm, supportPhone: e.target.value})}
                                            placeholder="e.g. +91 9834514884"
                                        />
                                    </div>
                                    <div className={styles.formGroup} style={{flex: 1}}>
                                        <label>Support Email Address</label>
                                        <input 
                                            type="email" 
                                            className={styles.modalInput}
                                            value={customForm.supportEmail || ''} 
                                            onChange={e => setCustomForm({...customForm, supportEmail: e.target.value})}
                                            placeholder="e.g. support@sutraverse.com"
                                        />
                                    </div>
                                </div>
                            </div>
                            
                            <div className={`${styles.brandingCard} ${styles.fullWidth}`}>
                                <h3>Social Media Links</h3>
                                <p style={{color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '15px'}}>
                                    Configure institutional social pages visible to students and visitors in the footer.
                                </p>
                                
                                <div className={styles.formRow} style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '15px'}}>
                                    <div className={styles.formGroup}>
                                        <label>LinkedIn Link</label>
                                        <input 
                                            type="text" 
                                            className={styles.modalInput}
                                            value={customForm.socials?.linkedin || ''} 
                                            onChange={e => setCustomForm({
                                                ...customForm,
                                                socials: { ...customForm.socials, linkedin: e.target.value }
                                            })}
                                            placeholder="https://linkedin.com/in/..."
                                        />
                                    </div>
                                    <div className={styles.formGroup}>
                                        <label>Instagram Link</label>
                                        <input 
                                            type="text" 
                                            className={styles.modalInput}
                                            value={customForm.socials?.instagram || ''} 
                                            onChange={e => setCustomForm({
                                                ...customForm,
                                                socials: { ...customForm.socials, instagram: e.target.value }
                                            })}
                                            placeholder="https://instagram.com/..."
                                        />
                                    </div>
                                    <div className={styles.formGroup}>
                                        <label>GitHub Profile Link</label>
                                        <input 
                                            type="text" 
                                            className={styles.modalInput}
                                            value={customForm.socials?.github || ''} 
                                            onChange={e => setCustomForm({
                                                ...customForm,
                                                socials: { ...customForm.socials, github: e.target.value }
                                            })}
                                            placeholder="https://github.com/..."
                                        />
                                    </div>
                                    <div className={styles.formGroup}>
                                        <label>YouTube Channel Link</label>
                                        <input 
                                            type="text" 
                                            className={styles.modalInput}
                                            value={customForm.socials?.youtube || ''} 
                                            onChange={e => setCustomForm({
                                                ...customForm,
                                                socials: { ...customForm.socials, youtube: e.target.value }
                                            })}
                                            placeholder="https://youtube.com/..."
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className={`${styles.brandingCard} ${styles.fullWidth}`}>
                                <h3>System Maintenance Mode</h3>
                                <p style={{color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '20px'}}>
                                    Prevent non-admin users from accessing the site during system upgrades or migrations. Admins can still access all features.
                                </p>
                                
                                <div className={styles.checkboxGroup} style={{marginBottom: '20px'}}>
                                    <input 
                                        type="checkbox" 
                                        id="maintenanceMode" 
                                        checked={customForm.maintenanceMode ?? false} 
                                        onChange={e => setCustomForm({...customForm, maintenanceMode: e.target.checked})} 
                                    />
                                    <label htmlFor="maintenanceMode" style={{fontWeight: 'bold', fontSize: '1rem'}}>Enable Maintenance Mode (Sitewide Alert)</label>
                                </div>
                                
                                <div className={styles.formGroup}>
                                    <label>Custom Maintenance Message</label>
                                    <textarea 
                                        className={styles.modalInput}
                                        value={customForm.maintenanceMessage || ''} 
                                        onChange={e => setCustomForm({...customForm, maintenanceMessage: e.target.value})}
                                        placeholder="e.g. We are performing scheduled upgrades to improve campus database performance. We will be back online shortly!"
                                        disabled={!customForm.maintenanceMode}
                                        rows={3}
                                    />
                                </div>
                            </div>
                        </div>
                        
                        <div className={styles.brandingActions}>
                            <button 
                                className={styles.saveBrandingBtn} 
                                onClick={saveCustomize}
                                disabled={customSaving}
                                style={{background: 'var(--primary)'}}
                            >
                                {customSaving ? 'Saving...' : 'Save Customize Settings'}
                            </button>
                        </div>
                    </div>
                ) : tab === 'system' ? (
                    <div style={{marginTop: '20px'}}>
                        
                        <div className={styles.fileCard} style={{marginBottom: '20px', padding: '20px', borderLeft: '4px solid var(--accent)'}}>
                            <h3 style={{marginBottom: '10px'}}>📢 Global Push Notification Broadcast</h3>
                            <p style={{color: 'var(--text-secondary)', marginBottom: '15px'}}>Manually blast a push notification to all mobile app users (e.g. for new features, urgent alerts).</p>
                            <div style={{display: 'flex', flexDirection: 'column', gap: '10px', maxWidth: '500px'}}>
                                <input 
                                    type="text" 
                                    placeholder="Notification Title (e.g. 🚀 Exam Mode is Live!)" 
                                    className={styles.modalInput}
                                    value={broadcastTitle}
                                    onChange={e => setBroadcastTitle(e.target.value)}
                                />
                                <textarea 
                                    placeholder="Notification Body" 
                                    className={styles.modalInput}
                                    rows={3}
                                    value={broadcastBody}
                                    onChange={e => setBroadcastBody(e.target.value)}
                                />
                                <button 
                                    className={`${styles.actionBtn} ${styles.approveBtn}`}
                                    onClick={handleBroadcastNotification}
                                    disabled={actionLoading === 'broadcast'}
                                    style={{padding: '10px 20px', background: 'var(--accent)', color: '#fff', alignSelf: 'flex-start'}}
                                >
                                    {actionLoading === 'broadcast' ? 'Sending...' : 'Blast Notification'}
                                </button>
                            </div>
                        </div>

                        <div className={styles.fileCard} style={{marginBottom: '20px', padding: '20px'}}>
                            <h3 style={{marginBottom: '10px'}}>M2 Notes Functionality</h3>
                            <p style={{color: 'var(--text-secondary)', marginBottom: '15px'}}>Use these tools to seed Engineering Mathematics II notes or fix mapping issues if they are not showing up in the subject section.</p>
                            <div style={{display: 'flex', gap: '15px'}}>
                                <button 
                                    className={`${styles.actionBtn} ${styles.approveBtn}`}
                                    onClick={handleSeedM2}
                                    disabled={actionLoading === 'seed-m2'}
                                    style={{padding: '10px 20px'}}
                                >
                                    <IconCheck size={16} /> {actionLoading === 'seed-m2' ? 'Seeding...' : 'Seed M2 Notes'}
                                </button>
                                <button 
                                    className={`${styles.actionBtn} ${styles.editBtn}`}
                                    onClick={handleFixM2Subjects}
                                    disabled={actionLoading === 'fix-m2'}
                                    style={{padding: '10px 20px'}}
                                >
                                    <IconPen size={16} /> {actionLoading === 'fix-m2' ? 'Fixing...' : 'Fix M2 Subject Mappings'}
                                </button>
                            </div>
                        </div>

                        <div className={styles.fileCard} style={{marginBottom: '20px', padding: '20px'}}>
                            <h3 style={{marginBottom: '10px'}}>BEE Material Seeding</h3>
                            <p style={{color: 'var(--text-secondary)', marginBottom: '15px'}}>Seed the extracted BEE notes, question banks, and assignments into the database.</p>
                            <div style={{display: 'flex', gap: '15px'}}>
                                <button 
                                    className={`${styles.actionBtn} ${styles.approveBtn}`}
                                    onClick={handleSeedBEE}
                                    disabled={actionLoading === 'seed-bee'}
                                    style={{padding: '10px 20px'}}
                                >
                                    <IconCheck size={16} /> {actionLoading === 'seed-bee' ? 'Seeding...' : 'Seed BEE Materials'}
                                </button>
                            </div>
                        </div>
                    </div>
                ) : loading ? (
                    <div className={styles.loadingState}>Refreshing database...</div>
                ) : files.length === 0 ? (
                    <div className={styles.emptyState}>
                        <div className={styles.emptyIcon}><IconFolder size={64} /></div>
                        <div className={styles.emptyText}>No files in this queue</div>
                        <div className={styles.emptySubtext}>
                            {tab === 'pending' ? 'All uploads have been reviewed! 🎉' : 
                             tab === 'reported' ? 'Amazing! No community reports found. 🏆' : 
                             `No files with ${tab} status.`}
                        </div>
                    </div>
                ) : (
                    <div className={styles.fileList}>
                        {files.map((file) => (
                            <div key={file.id} className={`${styles.fileCard} ${file.isReported ? styles.reportedCard : ''}`}>
                                <div className={styles.fileInfo}>
                                    <div className={styles.fileTitle}>
                                        {file.title} 
                                        {file.isReported && <span className={styles.flagBadge}>{file.reportCount || 1} Flags</span>}
                                    </div>
                                    <div className={styles.fileMeta}>
                                        <span className={styles.metaTag}><IconFolder size={14} /> {file.type}</span>
                                        <span className={styles.metaTag}>{file.subject}</span>
                                        <span className={styles.metaTag}>{file.branch}</span>
                                        <span className={styles.metaTag}>{file.year}</span>
                                        <span className={styles.metaTag}><IconUser size={14} /> {file.uploader || file.uploaderName}</span>
                                        <span className={styles.metaTag}><IconCalendar size={14} /> {formatDate(file.createdAt)}</span>
                                        <span className={styles.metaTag}>{formatFileSize(file.fileSize)}</span>
                                        <span className={styles.metaTag}>{file.fileName}</span>
                                    </div>
                                </div>
                                <div className={styles.fileActions}>
                                    {(file.fileURL || file.fileUrl) && (
                                        <button className={`${styles.actionBtn} ${styles.previewBtn}`} onClick={() => handlePreview(file.fileURL || file.fileUrl, file.fileName || 'document.pdf')}>
                                            <IconEye size={16} /> View
                                        </button>
                                    )}
                                    {tab === 'pending' && (
                                        <>
                                            <button
                                                className={`${styles.actionBtn} ${styles.approveBtn}`}
                                                onClick={() => handleApprove(file.id)}
                                                disabled={actionLoading === file.id}
                                            >
                                                <IconCheck size={16} /> {actionLoading === file.id ? '...' : 'Approve'}
                                            </button>
                                            <button
                                                className={`${styles.actionBtn} ${styles.editBtn}`}
                                                onClick={() => openEditModal(file)}
                                            >
                                                <IconPen size={16} /> Edit
                                            </button>
                                            <button
                                                className={`${styles.actionBtn} ${styles.rejectBtn}`}
                                                onClick={() => handleReject(file)}
                                                disabled={actionLoading === file.id}
                                            >
                                                <IconX size={16} /> Reject
                                            </button>
                                        </>
                                    )}
                                    {tab === 'approved' && (
                                        <>
                                            <button
                                                className={`${styles.actionBtn} ${styles.editBtn}`}
                                                onClick={() => openEditModal(file)}
                                            >
                                                <IconPen size={16} /> Edit
                                            </button>
                                            <button
                                                className={`${styles.actionBtn} ${styles.rejectBtn}`}
                                                onClick={() => handleReject(file)}
                                                disabled={actionLoading === file.id}
                                            >
                                                <IconX size={16} /> Delete
                                            </button>
                                        </>
                                    )}
                                    {tab === 'reported' && (
                                        <>
                                            <button
                                                className={`${styles.actionBtn} ${styles.editBtn}`}
                                                onClick={() => openEditModal(file)}
                                            >
                                                <IconPen size={16} /> Edit Path
                                            </button>
                                            <button
                                                className={`${styles.actionBtn} ${styles.approveBtn}`}
                                                onClick={() => handleDismissReport(file.id)}
                                                disabled={actionLoading === file.id}
                                            >
                                                <IconCheck size={16} /> Ignore
                                            </button>
                                            <button
                                                className={`${styles.actionBtn} ${styles.rejectBtn}`}
                                                onClick={() => handleReject(file)}
                                                disabled={actionLoading === file.id}
                                            >
                                                <IconX size={16} /> Delete
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        ))}
                     </div>
                )}
            </div>

            {/* EDIT FILE MODAL — rendered via Portal */}
            {editingFile && createPortal(
                <div className={styles.modalOverlay}>
                    <div className={styles.modalContent} style={{ maxWidth: '520px' }}>
                        <h2 className={styles.modalTitle}>Edit Document Metadata</h2>
                        <p className={styles.modalDesc}>Update metadata for <strong>{editingFile.title}</strong>.</p>
                        
                        <div className={styles.formGroup}>
                            <label>Document Title</label>
                            <input type="text" className={styles.modalInput} value={editForm.title} onChange={e => setEditForm({...editForm, title: e.target.value})} placeholder="e.g. Unit 1 Notes" />
                        </div>

                        <div className={styles.formRow} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                            <div className={styles.formGroup}>
                                <label>File Type</label>
                                <select className={styles.modalSelect} value={editForm.type} onChange={e => setEditForm({...editForm, type: e.target.value})}>
                                    {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                            </div>
                            <div className={styles.formGroup}>
                                <label>Subject</label>
                                <input type="text" className={styles.modalInput} value={editForm.subject} onChange={e => setEditForm({...editForm, subject: e.target.value})} placeholder="e.g. Physics" />
                            </div>
                        </div>

                        <div className={styles.formRow} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                            <div className={styles.formGroup}>
                                <label>Branch</label>
                                <select className={styles.modalSelect} value={editForm.branch} onChange={e => setEditForm({...editForm, branch: e.target.value})}>
                                    {BRANCHES.map(b => <option key={b} value={b}>{b}</option>)}
                                </select>
                            </div>
                            <div className={styles.formGroup}>
                                <label>Year</label>
                                <select className={styles.modalSelect} value={editForm.year} onChange={e => setEditForm({...editForm, year: e.target.value})}>
                                    {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                                </select>
                            </div>
                        </div>

                        <div className={styles.modalActions}>
                            <button className={styles.modalCancel} onClick={() => setEditingFile(null)}>Cancel</button>
                            <button className={styles.modalSave} disabled={actionLoading === editingFile.id} onClick={savePathCorrection}>
                                {actionLoading === editingFile.id ? 'Saving...' : 'Save & Resolve'}
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* EDIT USER & ROLES MODAL — rendered via Portal */}
            {editingUser && createPortal(
                <div className={styles.modalOverlay}>
                    <div className={`${styles.modalContent} glass-panel`} style={{ maxWidth: '650px', background: 'var(--background-primary)', border: '1px solid var(--border)', boxShadow: '0 20px 40px rgba(0,0,0,0.4)', borderRadius: '16px' }}>
                        <h2 className={styles.modalTitle} style={{color: 'var(--primary)', fontSize: '1.8rem', marginBottom: '8px'}}>Manage Access & Roles</h2>
                        <p className={styles.modalDesc} style={{color: 'var(--text-secondary)', marginBottom: '24px'}}>Editing profile for <strong>{editingUser.name || editingUser.email}</strong>.</p>
                        
                        <div className={styles.formRow} style={{display: 'flex', gap: '15px'}}>
                            <div className={styles.formGroup} style={{flex: 1}}>
                                <label>Primary Role</label>
                                <select className={styles.modalSelect} value={userForm.role} onChange={e => setUserForm({...userForm, role: e.target.value})}>
                                    <option value="student">Student</option>
                                    <option value="teacher">Teacher / Staff</option>
                                </select>
                            </div>
                            <div className={styles.formGroup} style={{flex: 1, flexDirection: 'row', alignItems: 'center', gap: '8px', marginTop: '24px'}}>
                                <input type="checkbox" id="isAdmin" checked={userForm.isAdmin} onChange={e => setUserForm({...userForm, isAdmin: e.target.checked})} style={{width: '18px', height: '18px', cursor: 'pointer', accentColor: 'var(--primary)'}} />
                                <label htmlFor="isAdmin" style={{fontSize: '0.95rem', cursor: 'pointer', color: 'var(--text-primary)', fontWeight: 'bold'}}>Grant Admin Privileges</label>
                            </div>
                        </div>

                        {userForm.role === 'student' && (
                            <div className={styles.roleSection} style={{marginTop: '20px', padding: '15px', background: 'var(--background-secondary)', borderRadius: '8px'}}>
                                <h3 style={{marginBottom: '15px', fontSize: '1.1rem', color: 'var(--text-primary)'}}>Student Class Assignment</h3>
                                <div className={styles.formRow} style={{display: 'flex', gap: '10px', marginBottom: '15px'}}>
                                    <div className={styles.formGroup} style={{flex: 1}}>
                                        <label>Year</label>
                                        <select className={styles.modalSelect} value={userForm.year} onChange={e => setUserForm({...userForm, year: e.target.value})}>
                                            {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                                        </select>
                                    </div>
                                    <div className={styles.formGroup} style={{flex: 1}}>
                                        <label>Branch</label>
                                        <select className={styles.modalSelect} value={userForm.branch} onChange={e => setUserForm({...userForm, branch: e.target.value})}>
                                            {BRANCHES.map(b => <option key={b} value={b}>{b}</option>)}
                                        </select>
                                    </div>
                                    <div className={styles.formGroup} style={{flex: 1}}>
                                        <label>Division</label>
                                        <select className={styles.modalSelect} value={userForm.division} onChange={e => setUserForm({...userForm, division: e.target.value})}>
                                            {DIVISIONS.map(d => <option key={d} value={d}>Division {d}</option>)}
                                        </select>
                                    </div>
                                </div>
                                <div className={styles.formRow} style={{display: 'flex', gap: '15px'}}>
                                    <div className={styles.formGroup} style={{flex: 1}}>
                                        <label>PRN / Student ID</label>
                                        <input type="text" className={styles.modalInput} value={userForm.studentId} onChange={e => setUserForm({...userForm, studentId: e.target.value})} placeholder="e.g. 202100123" />
                                    </div>
                                    <div className={styles.formGroup} style={{flex: 1}}>
                                        <label>Roll Number</label>
                                        <input type="text" className={styles.modalInput} value={userForm.rollNo} onChange={e => setUserForm({...userForm, rollNo: e.target.value})} placeholder="e.g. 45" />
                                    </div>
                                </div>
                            </div>
                        )}

                        {userForm.role === 'teacher' && (
                            <div className={styles.roleSection} style={{marginTop: '20px', padding: '15px', background: 'var(--background-secondary)', borderRadius: '8px'}}>
                                <h3 style={{marginBottom: '15px', fontSize: '1.1rem', color: 'var(--text-primary)'}}>Teacher Matrix</h3>
                                {editingUser.assignments?.length > 0 && (
                                    <div className={styles.existingAssignments} style={{marginBottom: '15px'}}>
                                        {editingUser.assignments.map((a, i) => (
                                            <div key={i} className={styles.assignmentBadge} style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--background-primary)', padding: '8px 12px', borderRadius: '6px', marginBottom: '8px', border: '1px solid var(--border)'}}>
                                                <span style={{fontSize: '0.9rem'}}><strong>{a.classId}</strong> - {a.subject}</span>
                                                <button onClick={() => removeTeacherAssignment(editingUser.id, i)} className={styles.removeAssignment} style={{background: 'none', border: 'none', color: 'var(--error)', cursor: 'pointer', fontWeight: 'bold'}}>✕</button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                
                                <div className={styles.addAssignmentBox} style={{borderTop: '1px solid var(--border)', paddingTop: '15px'}}>
                                    <h4 style={{marginBottom: '10px', color: 'var(--text-secondary)'}}>Add New Module Assignment</h4>
                                    <div className={styles.formRow} style={{display: 'flex', gap: '15px', flexWrap: 'wrap'}}>
                                        <div className={styles.formGroup} style={{flex: '1 1 200px'}}>
                                            <label>Class Matrix</label>
                                            <select className={styles.modalSelect} value={userForm.year} onChange={e => setUserForm({...userForm, year: e.target.value})} style={{marginBottom:'5px'}}>
                                                {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                                            </select>
                                            <select className={styles.modalSelect} value={userForm.branch} onChange={e => setUserForm({...userForm, branch: e.target.value})} style={{marginBottom:'5px'}}>
                                                {BRANCHES.map(b => <option key={b} value={b}>{b}</option>)}
                                            </select>
                                            <select className={styles.modalSelect} value={userForm.division} onChange={e => setUserForm({...userForm, division: e.target.value})}>
                                                {DIVISIONS.map(d => <option key={d} value={d}>Division {d}</option>)}
                                            </select>
                                        </div>
                                        <div className={styles.formGroup} style={{flex: '1 1 200px'}}>
                                            <label>Subject Module</label>
                                            <input type="text" className={styles.modalInput} placeholder="e.g. Computer Networks" value={userForm.newSubject} onChange={e => setUserForm({...userForm, newSubject: e.target.value})} />
                                            
                                            <div style={{marginTop: '15px'}}>
                                                <div className={styles.checkboxGroup} style={{display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '5px'}}>
                                                    <input type="checkbox" id="isTG" checked={userForm.newIsTG} onChange={e => setUserForm({...userForm, newIsTG: e.target.checked})} />
                                                    <label htmlFor="isTG" style={{fontSize: '0.9rem', color: 'var(--text-secondary)'}}>Teacher Guardian (TG)</label>
                                                </div>
                                                <div className={styles.checkboxGroup} style={{display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '5px'}}>
                                                    <input type="checkbox" id="isClassTeacher" checked={userForm.newIsClassTeacher} onChange={e => setUserForm({...userForm, newIsClassTeacher: e.target.checked})} />
                                                    <label htmlFor="isClassTeacher" style={{fontSize: '0.9rem', color: 'var(--text-secondary)'}}>Class Teacher</label>
                                                </div>
                                                <div className={styles.checkboxGroup} style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                                                    <input type="checkbox" id="isHOD" checked={userForm.newIsHOD} onChange={e => setUserForm({...userForm, newIsHOD: e.target.checked})} />
                                                    <label htmlFor="isHOD" style={{fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 'bold'}}>Head of Department (HOD)</label>
                                                </div>
                                            </div>
                                            
                                            <button 
                                                className={styles.addAssignmentBtn} 
                                                onClick={addTeacherAssignment} 
                                                disabled={actionLoading === 'adding-assignment'}
                                                style={{marginTop: '15px', background: 'rgba(138, 43, 226, 0.1)', color: 'var(--primary)', border: '1px solid var(--primary)', padding: '8px 12px', borderRadius: '6px', cursor: 'pointer', width: '100%'}}
                                            >
                                                {actionLoading === 'adding-assignment' ? 'Adding...' : '+ Add Module'}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className={styles.modalActions} style={{marginTop: '25px', display: 'flex', justifyContent: 'flex-end', gap: '10px'}}>
                            <button className={styles.modalCancel} onClick={() => setEditingUser(null)}>Cancel</button>
                            <button className={styles.modalSave} disabled={actionLoading === editingUser.id} onClick={saveUserEdit}>
                                {actionLoading === editingUser.id ? 'Saving...' : 'Save Profile Details'}
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
}
