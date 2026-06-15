/* eslint-disable @next/next/no-img-element */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react/no-unescaped-entities */
'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { db } from '@/database/config/firebase';
import {
    doc, getDoc, updateDoc, deleteDoc,
    arrayUnion, arrayRemove, collection, addDoc,
    query, where, orderBy, onSnapshot, serverTimestamp,
    increment, getDocs,
} from 'firebase/firestore';
import { useAuth } from '@/frontend/context/AuthContext';
import { BANNER_PRESETS } from '@/shared/constants/bannerPresets';
import styles from './page.module.css';
import AnnouncementsTab from './components/AnnouncementsTab';
import QATab from './components/QATab';
import EventsTab from './components/EventsTab';
import ShowcaseTab from './components/ShowcaseTab';
import GalleryTab from './components/GalleryTab';
import ChatTab from './components/ChatTab';
import MembersTab from './components/MembersTab';
import AboutTab from './components/AboutTab';
import ClubHero from './components/ClubHero';
import { adjustColorBrightness } from '@/shared/utils/colors';


export default function ClubDetailPage({ params: paramsPromise }) {
    const params = use(paramsPromise);
    const { user } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();

    const [club, setClub] = useState(null);
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);
    const [activeTab, setActiveTab] = useState('announcements');
    const [members, setMembers] = useState([]);
    const [announcements, setAnnouncements] = useState([]);
    const [newAnnouncement, setNewAnnouncement] = useState('');
    const [posting, setPosting] = useState(false);
    const [joined, setJoined] = useState(false);
    const [joiningLoading, setJoiningLoading] = useState(false);

    // Q&A state
    const [qaList, setQaList] = useState([]);
    const [newQuestion, setNewQuestion] = useState('');
    const [newReply, setNewReply] = useState({});
    const [submittingQA, setSubmittingQA] = useState(false);

    // Events state
    const [eventsList, setEventsList] = useState([]);
    const [showAddEventModal, setShowAddEventModal] = useState(false);
    const [newEventTitle, setNewEventTitle] = useState('');
    const [newEventDesc, setNewEventDesc] = useState('');
    const [newEventDate, setNewEventDate] = useState('');
    const [newEventTime, setNewEventTime] = useState('');
    const [newEventVenue, setNewEventVenue] = useState('');
    const [newEventGradient, setNewEventGradient] = useState('fire');
    const [submittingEvent, setSubmittingEvent] = useState(false);

    // Showcase state
    const [projectsList, setProjectsList] = useState([]);
    const [showAddProjModal, setShowAddProjModal] = useState(false);
    const [newProjTitle, setNewProjTitle] = useState('');
    const [newProjDesc, setNewProjDesc] = useState('');
    const [newProjLink, setNewProjLink] = useState('');
    const [newProjImage, setNewProjImage] = useState('');
    const [newProjTags, setNewProjTags] = useState('');
    const [submittingProj, setSubmittingProj] = useState(false);

    // Recruitment Applications state
    const [applicationsList, setApplicationsList] = useState([]);
    const [showApplyModal, setShowApplyModal] = useState(false);
    const [applicantAnswers, setApplicantAnswers] = useState({});
    const [submittingApp, setSubmittingApp] = useState(false);

    // Settings state
    const [editName, setEditName] = useState('');
    const [editDesc, setEditDesc] = useState('');
    const [editMeet, setEditMeet] = useState('');
    const [editDiscord, setEditDiscord] = useState('');
    const [editJoiningLink, setEditJoiningLink] = useState('');
    const [editWhatsapp, setEditWhatsapp] = useState('');
    const [editEvent, setEditEvent] = useState('');
    const [editBannerGradient, setEditBannerGradient] = useState('');
    const [editSupervisorName, setEditSupervisorName] = useState('');
    const [editSupervisorEmail, setEditSupervisorEmail] = useState('');
    const [recruitmentActive, setRecruitmentActive] = useState(false);
    const [screeningQuestions, setScreeningQuestions] = useState('');
    const [saving, setSaving] = useState(false);

    // Memories Gallery state
    const [galleryList, setGalleryList] = useState([]);
    const [showAddPhotoModal, setShowAddPhotoModal] = useState(false);
    const [newPhotoUrl, setNewPhotoUrl] = useState('');
    const [newPhotoCaption, setNewPhotoCaption] = useState('');
    const [newPhotoEvent, setNewPhotoEvent] = useState('');
    const [submittingPhoto, setSubmittingPhoto] = useState(false);

    // Live Member Chat state
    const [chatMessages, setChatMessages] = useState([]);
    const [newChatMessageText, setNewChatMessageText] = useState('');
    const [submittingChat, setSubmittingChat] = useState(false);

    // Dynamic Brand Personalization state
    const [editAccentColor, setEditAccentColor] = useState('');
    const [editCoverImage, setEditCoverImage] = useState('');

    const clubId = params.clubId;

    // ── FETCH CLUB ───────────────────────────────────────────────────────────
    useEffect(() => {
        if (!clubId) return;

        let unsubAnn = () => {};
        let unsubQA = () => {};
        let unsubEvents = () => {};
        let unsubProjects = () => {};
        let unsubApps = () => {};
        let unsubGallery = () => {};
        let unsubChat = () => {};

        const fetchClub = async () => {
            setLoading(true);
            try {
                // Real Firestore fetch
                const clubSnap = await getDoc(doc(db, 'clubs', clubId));
                if (!clubSnap.exists()) {
                    setNotFound(true);
                    setLoading(false);
                    return;
                }
                const clubData = { id: clubSnap.id, ...clubSnap.data() };
                setClub(clubData);
                populateSettings(clubData);

                // Check if current user is already a member
                if (user) {
                    setJoined(clubData.members?.includes(user.uid) || false);
                }

                // Fetch members from users collection
                fetchRealMembers(clubData.members || []);

                // Real-time announcements listener
                const q = query(
                    collection(db, 'clubAnnouncements'),
                    where('clubId', '==', clubId)
                );
                unsubAnn = onSnapshot(q, snap => {
                    const anns = snap.docs.map(d => ({ id: d.id, ...d.data() }));
                    anns.sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
                    setAnnouncements(anns);
                });

                // Real-time Q&A listener
                const qaQ = query(
                    collection(db, 'clubQA'),
                    where('clubId', '==', clubId)
                );
                unsubQA = onSnapshot(qaQ, snap => {
                    const qas = snap.docs.map(d => ({ id: d.id, ...d.data() }));
                    qas.sort((a, b) => (b.upvoteCount || 0) - (a.upvoteCount || 0) || (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
                    setQaList(qas);
                });

                // Real-time Events listener
                const eventsQ = query(
                    collection(db, 'clubEvents'),
                    where('clubId', '==', clubId)
                );
                unsubEvents = onSnapshot(eventsQ, snap => {
                    const evts = snap.docs.map(d => ({ id: d.id, ...d.data() }));
                    evts.sort((a, b) => {
                        const dateA = a.date?.toMillis?.() || new Date(a.date).getTime() || 0;
                        const dateB = b.date?.toMillis?.() || new Date(b.date).getTime() || 0;
                        return dateA - dateB;
                    });
                    setEventsList(evts);
                });

                // Real-time Projects listener
                const projQ = query(
                    collection(db, 'clubProjects'),
                    where('clubId', '==', clubId)
                );
                unsubProjects = onSnapshot(projQ, snap => {
                    const projs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
                    projs.sort((a, b) => (b.likeCount || 0) - (a.likeCount || 0) || (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
                    setProjectsList(projs);
                });

                // Real-time Applications listener (Admin only)
                if (clubData.adminId === user?.uid) {
                    const appsQ = query(
                        collection(db, 'clubApplications'),
                        where('clubId', '==', clubId)
                    );
                    unsubApps = onSnapshot(appsQ, snap => {
                        const apps = snap.docs.map(d => ({ id: d.id, ...d.data() }));
                        apps.sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
                        setApplicationsList(apps);
                    });
                }

                // Real-time Gallery listener
                const galleryQ = query(
                    collection(db, 'clubGallery'),
                    where('clubId', '==', clubId)
                );
                unsubGallery = onSnapshot(galleryQ, snap => {
                    const photos = snap.docs.map(d => ({ id: d.id, ...d.data() }));
                    photos.sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
                    setGalleryList(photos);
                });

                // Real-time Chat listener (Members & Admins only)
                if (clubData.members?.includes(user?.uid) || clubData.adminId === user?.uid) {
                    const chatQ = query(
                        collection(db, 'clubChat'),
                        where('clubId', '==', clubId)
                    );
                    unsubChat = onSnapshot(chatQ, snap => {
                        const msgs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
                        msgs.sort((a, b) => (a.createdAt?.toMillis?.() || 0) - (b.createdAt?.toMillis?.() || 0));
                        setChatMessages(msgs);
                    });
                }

                setLoading(false);
            } catch (err) {
                console.error('Error fetching club:', err);
                setNotFound(true);
                setLoading(false);
            }
        };

        fetchClub();

        return () => {
            unsubAnn();
            unsubQA();
            unsubEvents();
            unsubProjects();
            unsubApps();
            unsubGallery();
            unsubChat();
        };
    }, [clubId, user]);

    useEffect(() => {
        const tabParam = searchParams?.get('tab');
        if (tabParam) {
            setActiveTab(tabParam);
        }
    }, [searchParams]);

    const populateSettings = (c) => {
        setEditName(c.name || '');
        setEditDesc(c.description || '');
        setEditMeet(c.meetSchedule || '');
        setEditDiscord(c.discord || '');
        setEditJoiningLink(c.joiningLink || '');
        setEditWhatsapp(c.whatsapp || '');
        setEditEvent(c.upcomingEvent || '');
        setEditBannerGradient(c.bannerGradient || '');
        setEditSupervisorName(c.supervisorName || '');
        setEditSupervisorEmail(c.supervisorEmail || '');
        setRecruitmentActive(c.recruitmentActive || false);
        setScreeningQuestions(c.screeningQuestions || '');
        setEditAccentColor(c.accentColor || '#3b82f6');
        setEditCoverImage(c.coverImage || '');
    };

    const fetchRealMembers = async (memberIds) => {
        if (!memberIds.length) return;
        try {
            const memberData = await Promise.all(
                memberIds.slice(0, 20).map(uid =>
                    getDoc(doc(db, 'users', uid)).then(d => d.exists() ? { id: d.id, ...d.data() } : null)
                )
            );
            setMembers(memberData.filter(Boolean));
        } catch (err) {
            console.warn('Could not fetch members:', err);
        }
    };

    // ── JOIN / LEAVE ─────────────────────────────────────────────────────────
    const handleJoin = async () => {
        if (!user) {
            router.push('/login');
            return;
        }
        setJoiningLoading(true);
        try {
            const clubRef = doc(db, 'clubs', clubId);
            if (joined) {
                // Leave
                await updateDoc(clubRef, {
                    members: arrayRemove(user.uid),
                    membersCount: increment(-1),
                });
                setJoined(false);
                setClub(prev => ({ ...prev, membersCount: (prev.membersCount || 1) - 1 }));
            } else {
                // Join
                await updateDoc(clubRef, {
                    members: arrayUnion(user.uid),
                    membersCount: increment(1),
                });
                setJoined(true);
                setClub(prev => ({ ...prev, membersCount: (prev.membersCount || 0) + 1 }));

                // Notify supervisor
                if (club.supervisorEmail) {
                    await addDoc(collection(db, 'notifications'), {
                        type: 'member_joined',
                        recipientEmail: club.supervisorEmail,
                        recipientName: club.supervisorName || 'Supervisor',
                        clubId,
                        clubName: club.name,
                        memberName: user.name || user.email?.split('@')[0],
                        memberEmail: user.email,
                        message: `${user.name || user.email?.split('@')[0]} has joined the "${club.name}" club.`,
                        read: false,
                        createdAt: serverTimestamp(),
                    });
                }

                // Notify admin
                if (club.adminId && club.adminId !== user.uid) {
                    await addDoc(collection(db, 'notifications'), {
                        type: 'member_joined',
                        recipientId: club.adminId,
                        clubId,
                        clubName: club.name,
                        memberName: user.name || user.email?.split('@')[0],
                        memberEmail: user.email,
                        message: `${user.name || user.email?.split('@')[0]} has joined your club "${club.name}".`,
                        read: false,
                        createdAt: serverTimestamp(),
                    });
                }
            }
        } catch (err) {
            console.error('Join/leave error:', err);
            alert('Something went wrong. Please try again.');
        }
        setJoiningLoading(false);
    };

    // ── POST ANNOUNCEMENT ────────────────────────────────────────────────────
    const handlePostAnnouncement = async () => {
        if (!newAnnouncement.trim() || !user) return;
        setPosting(true);
        try {
            await addDoc(collection(db, 'clubAnnouncements'), {
                clubId,
                authorId: user.uid,
                authorName: user.name || user.email?.split('@')[0],
                content: newAnnouncement.trim(),
                pinned: false,
                createdAt: serverTimestamp(),
            });
            setNewAnnouncement('');
        } catch (err) {
            console.error('Error posting:', err);
        }
        setPosting(false);
    };

    // ── POST QUESTION (Q&A) ──────────────────────────────────────────────────
    const handlePostQuestion = async () => {
        if (!newQuestion.trim() || !user) return;
        setSubmittingQA(true);
        try {
            await addDoc(collection(db, 'clubQA'), {
                clubId,
                userId: user.uid,
                userName: user.name || user.email?.split('@')[0],
                questionText: newQuestion.trim(),
                upvotes: [],
                upvoteCount: 0,
                replies: [],
                createdAt: serverTimestamp(),
            });
            setNewQuestion('');
        } catch (err) {
            console.error('Error posting question:', err);
        }
        setSubmittingQA(false);
    };

    // ── POST REPLY (Q&A) ─────────────────────────────────────────────────────
    const handlePostReply = async (questionId) => {
        const replyText = newReply[questionId];
        if (!replyText?.trim() || !user) return;
        try {
            const qaRef = doc(db, 'clubQA', questionId);
            const qaSnap = await getDoc(qaRef);
            if (!qaSnap.exists()) return;

            let authorRole = 'Visitor';
            if (club.adminId === user.uid) authorRole = 'Admin';
            else if (club.members?.includes(user.uid)) {
                authorRole = club.memberRoles?.[user.uid] || 'Member';
            }

            const newReplyItem = {
                replyId: Math.random().toString(36).substring(2, 9),
                authorId: user.uid,
                authorName: user.name || user.email?.split('@')[0],
                authorRole,
                text: replyText.trim(),
                isOfficial: false,
                createdAt: new Date().toISOString(),
            };

            await updateDoc(qaRef, {
                replies: arrayUnion(newReplyItem)
            });

            setNewReply(prev => ({ ...prev, [questionId]: '' }));
        } catch (err) {
            console.error('Error posting reply:', err);
        }
    };

    // ── UPVOTE QUESTION (Q&A) ────────────────────────────────────────────────
    const handleUpvoteQuestion = async (questionId) => {
        if (!user) {
            router.push('/login');
            return;
        }
        try {
            const qaRef = doc(db, 'clubQA', questionId);
            const qaSnap = await getDoc(qaRef);
            if (!qaSnap.exists()) return;

            const qaData = qaSnap.data();
            const upvotes = qaData.upvotes || [];
            const hasUpvoted = upvotes.includes(user.uid);

            if (hasUpvoted) {
                await updateDoc(qaRef, {
                    upvotes: arrayRemove(user.uid),
                    upvoteCount: increment(-1)
                });
            } else {
                await updateDoc(qaRef, {
                    upvotes: arrayUnion(user.uid),
                    upvoteCount: increment(1)
                });
            }
        } catch (err) {
            console.error('Error upvoting question:', err);
        }
    };

    // ── VERIFY REPLY (Q&A) ───────────────────────────────────────────────────
    const handleVerifyReply = async (questionId, replyId) => {
        if (!isAdmin) return;
        try {
            const qaRef = doc(db, 'clubQA', questionId);
            const qaSnap = await getDoc(qaRef);
            if (!qaSnap.exists()) return;

            const qaData = qaSnap.data();
            const updatedReplies = qaData.replies.map(r => {
                if (r.replyId === replyId) {
                    return { ...r, isOfficial: !r.isOfficial };
                }
                return r;
            });

            await updateDoc(qaRef, {
                replies: updatedReplies
            });
        } catch (err) {
            console.error('Error verifying reply:', err);
        }
    };

    // ── RSVP TO EVENT ────────────────────────────────────────────────────────
    const handleRSVPEvent = async (eventId) => {
        if (!user) {
            router.push('/login');
            return;
        }
        try {
            const eventRef = doc(db, 'clubEvents', eventId);
            const eventSnap = await getDoc(eventRef);
            if (!eventSnap.exists()) return;

            const eventData = eventSnap.data();
            const attendees = eventData.attendees || [];
            const isGoing = attendees.includes(user.uid);

            if (isGoing) {
                await updateDoc(eventRef, {
                    attendees: arrayRemove(user.uid),
                    attendeeCount: increment(-1)
                });
            } else {
                await updateDoc(eventRef, {
                    attendees: arrayUnion(user.uid),
                    attendeeCount: increment(1)
                });
            }
        } catch (err) {
            console.error('Error toggling RSVP:', err);
        }
    };

    // ── CREATE NEW EVENT (ADMIN) ─────────────────────────────────────────────
    const handleCreateEvent = async (e) => {
        e.preventDefault();
        if (!newEventTitle.trim() || !newEventDate || !user) return;
        setSubmittingEvent(true);
        try {
            const presets = [
                { id: 'fire', gradient: 'linear-gradient(135deg, #f59e0b, #dc2626)' },
                { id: 'forest', gradient: 'linear-gradient(135deg, #22c55e, #15803d)' },
                { id: 'sky', gradient: 'linear-gradient(135deg, #06b6d4, #3b82f6)' },
                { id: 'sunset', gradient: 'linear-gradient(135deg, #f97316, #b91c1c)' },
                { id: 'purple', gradient: 'linear-gradient(135deg, #a855f7, #6366f1)' }
            ];
            const selectedGrad = presets.find(p => p.id === newEventGradient)?.gradient || presets[0].gradient;

            const combinedDateStr = `${newEventDate}T${newEventTime || '00:00'}:00`;
            const dateObj = new Date(combinedDateStr);

            await addDoc(collection(db, 'clubEvents'), {
                clubId,
                clubName: club.name,
                clubEmoji: club.emoji || '🎓',
                title: newEventTitle.trim(),
                description: newEventDesc.trim(),
                date: dateObj,
                venue: newEventVenue.trim() || 'Online',
                coverGradient: selectedGrad,
                gradientId: newEventGradient,
                attendees: [],
                attendeeCount: 0,
                createdAt: serverTimestamp(),
            });

            setNewEventTitle('');
            setNewEventDesc('');
            setNewEventDate('');
            setNewEventTime('');
            setNewEventVenue('');
            setNewEventGradient('fire');
            setShowAddEventModal(false);
            alert('📅 Event created successfully!');
        } catch (err) {
            console.error('Error creating event:', err);
            alert('Failed to create event. Please try again.');
        }
        setSubmittingEvent(false);
    };

    // ── LIKE PROJECT ─────────────────────────────────────────────────────────
    const handleLikeProject = async (projectId) => {
        if (!user) {
            router.push('/login');
            return;
        }
        try {
            const projRef = doc(db, 'clubProjects', projectId);
            const projSnap = await getDoc(projRef);
            if (!projSnap.exists()) return;

            const projData = projSnap.data();
            const likes = projData.likes || [];
            const hasLiked = likes.includes(user.uid);

            if (hasLiked) {
                await updateDoc(projRef, {
                    likes: arrayRemove(user.uid),
                    likeCount: increment(-1)
                });
            } else {
                await updateDoc(projRef, {
                    likes: arrayUnion(user.uid),
                    likeCount: increment(1)
                });
            }
        } catch (err) {
            console.error('Error toggling project like:', err);
        }
    };

    // ── CREATE NEW PROJECT ───────────────────────────────────────────────────
    const handleCreateProject = async (e) => {
        e.preventDefault();
        if (!newProjTitle.trim() || !newProjDesc.trim() || !user) return;
        setSubmittingProj(true);
        try {
            const tagsArray = newProjTags
                ? newProjTags.split(',').map(t => t.trim()).filter(t => t)
                : [];

            await addDoc(collection(db, 'clubProjects'), {
                clubId,
                clubName: club.name,
                title: newProjTitle.trim(),
                description: newProjDesc.trim(),
                link: newProjLink.trim(),
                imageUrl: newProjImage.trim() || 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?q=80&w=600&auto=format&fit=crop',
                tags: tagsArray,
                createdBy: user.uid,
                creatorName: user.displayName || user.email?.split('@')[0] || 'Club Member',
                likes: [],
                likeCount: 0,
                createdAt: serverTimestamp(),
            });

            setNewProjTitle('');
            setNewProjDesc('');
            setNewProjLink('');
            setNewProjImage('');
            setNewProjTags('');
            setShowAddProjModal(false);
            alert('🚀 Project shared successfully!');
        } catch (err) {
            console.error('Error creating project:', err);
            alert('Failed to share project. Please try again.');
        }
        setSubmittingProj(false);
    };

    // ── ASSIGN ROLE TO MEMBER (ADMIN) ─────────────────────────────────────────
    const handleAssignRole = async (memberId) => {
        if (!isAdmin) return;
        const currentRole = club.memberRoles?.[memberId] || '';
        const newRole = prompt('Enter role/position title for this member (e.g. Vice President, Marketing Lead, Technical Lead) or leave empty to clear role:', currentRole);
        if (newRole === null) return;

        try {
            const clubRef = doc(db, 'clubs', clubId);
            await updateDoc(clubRef, {
                [`memberRoles.${memberId}`]: newRole.trim()
            });
            alert('⚡ Member position updated successfully!');
        } catch (err) {
            console.error('Error updating member role:', err);
            alert('Failed to update member role. Please try again.');
        }
    };

    // ── SAVE SETTINGS ────────────────────────────────────────────────────────
    const handleSave = async () => {
        if (!user) return;
        setSaving(true);
        try {
            await updateDoc(doc(db, 'clubs', clubId), {
                name: editName.trim(),
                description: editDesc.trim(),
                meetSchedule: editMeet.trim(),
                discord: editDiscord.trim(),
                joiningLink: editJoiningLink.trim(),
                whatsapp: editWhatsapp.trim(),
                upcomingEvent: editEvent.trim(),
                bannerGradient: editBannerGradient,
                gradient: editBannerGradient ? BANNER_PRESETS.find(p => p.id === editBannerGradient)?.gradient || '' : '',
                supervisorName: editSupervisorName.trim(),
                supervisorEmail: editSupervisorEmail.trim(),
                recruitmentActive: recruitmentActive,
                screeningQuestions: screeningQuestions.trim(),
                accentColor: editAccentColor.trim(),
                coverImage: editCoverImage.trim(),
            });
            setClub(prev => ({
                ...prev,
                name: editName, description: editDesc, meetSchedule: editMeet,
                discord: editDiscord, joiningLink: editJoiningLink, whatsapp: editWhatsapp,
                upcomingEvent: editEvent,
                bannerGradient: editBannerGradient,
                gradient: editBannerGradient ? BANNER_PRESETS.find(p => p.id === editBannerGradient)?.gradient || '' : prev.gradient,
                supervisorName: editSupervisorName,
                supervisorEmail: editSupervisorEmail,
                recruitmentActive: recruitmentActive,
                screeningQuestions: screeningQuestions,
                accentColor: editAccentColor,
                coverImage: editCoverImage,
            }));
            alert('✅ Club details saved!');
        } catch (err) {
            console.error('Save error:', err);
            alert('Failed to save. Try again.');
        }
        setSaving(false);
    };

    // ── SUBMIT RECRUITMENT APPLICATION ────────────────────────────────────────
    const handleSubmitApplication = async (e) => {
        e.preventDefault();
        if (!user || submittingApp) return;
        setSubmittingApp(true);
        try {
            // Check if already applied
            const existingQ = query(
                collection(db, 'clubApplications'),
                where('clubId', '==', clubId),
                where('userId', '==', user.uid)
            );
            const existingSnap = await getDocs(existingQ);
            if (!existingSnap.empty) {
                alert('⚠️ You have already submitted an application to this club!');
                setSubmittingApp(false);
                setShowApplyModal(false);
                return;
            }

            await addDoc(collection(db, 'clubApplications'), {
                clubId,
                clubName: club.name,
                userId: user.uid,
                userName: user.displayName || user.email?.split('@')[0] || 'Applicant',
                userEmail: user.email,
                answers: applicantAnswers,
                status: 'pending',
                createdAt: serverTimestamp(),
            });

            // Notify admin
            if (club.adminId) {
                await addDoc(collection(db, 'notifications'), {
                    type: 'new_application',
                    recipientId: club.adminId,
                    clubId,
                    clubName: club.name,
                    memberName: user.displayName || user.email?.split('@')[0],
                    message: `${user.displayName || user.email?.split('@')[0]} submitted a membership application for "${club.name}".`,
                    read: false,
                    createdAt: serverTimestamp(),
                });
            }

            alert('🚀 Application submitted successfully! Good luck!');
            setShowApplyModal(false);
            setApplicantAnswers({});
        } catch (err) {
            console.error('Error submitting application:', err);
            alert('Failed to submit application. Try again.');
        }
        setSubmittingApp(false);
    };

    // ── UPDATE RECRUITMENT APPLICATION STATUS (ADMIN) ───────────────────────
    const handleUpdateAppStatus = async (appId, newStatus, applicantUid) => {
        if (!isAdmin) return;
        try {
            const appRef = doc(db, 'clubApplications', appId);
            await updateDoc(appRef, { status: newStatus });

            // If accepted, add applicant to club members!
            if (newStatus === 'accepted') {
                const clubRef = doc(db, 'clubs', clubId);
                await updateDoc(clubRef, {
                    members: arrayUnion(applicantUid),
                    membersCount: increment(1)
                });
            }

            // Create notification for applicant
            await addDoc(collection(db, 'notifications'), {
                type: 'application_update',
                recipientId: applicantUid,
                clubId,
                clubName: club.name,
                message: `Your membership application for "${club.name}" has been ${newStatus}! 🎉`,
                read: false,
                createdAt: serverTimestamp(),
            });

            alert(`⚡ Application marked as ${newStatus}!`);
        } catch (err) {
            console.error('Error updating application:', err);
            alert('Failed to update application status.');
        }
    };

    // ── UPLOAD PHOTO TO MEMORIES GALLERY ─────────────────────────────────────
    const handleUploadPhoto = async (e) => {
        e.preventDefault();
        if (!newPhotoUrl.trim() || !user || submittingPhoto) return;
        setSubmittingPhoto(true);
        try {
            await addDoc(collection(db, 'clubGallery'), {
                clubId,
                photoUrl: newPhotoUrl.trim(),
                caption: newPhotoCaption.trim(),
                eventName: newPhotoEvent.trim() || 'General Memories',
                uploadedBy: user.name || user.email?.split('@')[0] || 'Member',
                uploadedById: user.uid,
                createdAt: serverTimestamp(),
            });
            setNewPhotoUrl('');
            setNewPhotoCaption('');
            setNewPhotoEvent('');
            setShowAddPhotoModal(false);
            alert('📸 New photo added to memories gallery!');
        } catch (err) {
            console.error('Error uploading photo:', err);
            alert('Failed to post photo. Please try again.');
        }
        setSubmittingPhoto(false);
    };

    // ── SEND REAL-TIME CHAT MESSAGE ──────────────────────────────────────────
    const handleSendChatMessage = async (e) => {
        e.preventDefault();
        if (!newChatMessageText.trim() || !user || submittingChat) return;
        setSubmittingChat(true);
        try {
            let senderRole = 'Member';
            if (club.adminId === user.uid) senderRole = 'Admin';
            else if (club.memberRoles?.[user.uid]) {
                senderRole = club.memberRoles[user.uid];
            }

            await addDoc(collection(db, 'clubChat'), {
                clubId,
                senderId: user.uid,
                senderName: user.name || user.email?.split('@')[0] || 'Member',
                senderRole,
                messageText: newChatMessageText.trim(),
                reactions: {},
                createdAt: serverTimestamp(),
            });
            setNewChatMessageText('');
        } catch (err) {
            console.error('Error sending chat message:', err);
        }
        setSubmittingChat(false);
    };

    // ── REACT TO CHAT MESSAGE (EMOJI) ────────────────────────────────────────
    const handleReactToMessage = async (msgId, emoji) => {
        if (!user) return;
        try {
            const msgRef = doc(db, 'clubChat', msgId);
            const msgSnap = await getDoc(msgRef);
            if (!msgSnap.exists()) return;
            const msgData = msgSnap.data();
            const reactions = msgData.reactions || {};
            const userList = reactions[emoji] || [];

            if (userList.includes(user.uid)) {
                // Remove reaction
                await updateDoc(msgRef, {
                    [`reactions.${emoji}`]: arrayRemove(user.uid)
                });
            } else {
                // Add reaction
                await updateDoc(msgRef, {
                    [`reactions.${emoji}`]: arrayUnion(user.uid)
                });
            }
        } catch (err) {
            console.error('Error reacting to message:', err);
        }
    };

    const handleDelete = async () => {
        if (!confirm(`Delete "${club.name}"? This cannot be undone.`)) return;
        try {
            await deleteDoc(doc(db, 'clubs', clubId));
            router.push('/clubs');
        } catch (err) {
            console.error('Delete error:', err);
        }
    };

    // ── HELPERS ──────────────────────────────────────────────────────────────
    const formatDate = (ts) => {
        if (!ts) return '';
        try {
            const d = ts.toDate ? ts.toDate() : new Date(ts);
            const now = new Date();
            const diff = now - d;
            if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
            if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
            if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`;
            return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        } catch (_err) { return ''; }
    };

    const isAdmin = user && club && (club.adminId === user.uid || user.role === 'admin' || user.role === 'teacher');

    // ── RENDER STATES ────────────────────────────────────────────────────────
    if (loading) return (
        <div className={styles.loadingShimmer}>
            <div className={styles.shimmerHero}></div>
            <div className={styles.shimmerContent}></div>
        </div>
    );

    if (notFound) return (
        <div className={styles.pageWrapper} style={{ paddingTop: 'calc(var(--navbar-height) + 40px)' }}>
            <div className={styles.container} style={{ textAlign: 'center', padding: '60px 20px' }}>
                <div style={{ fontSize: '4rem', marginBottom: '16px' }}>🔍</div>
                <h1 style={{ color: 'var(--text-primary)', marginBottom: '12px' }}>Club not found</h1>
                <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>This club may have been removed or the link is incorrect.</p>
                <Link href="/clubs" className={styles.backBtn}>← Browse all clubs</Link>
            </div>
        </div>
    );

    if (!club) return null;

    const isMemberOrAdmin = joined || isAdmin;

    const tabs = [
        { key: 'announcements', label: 'Announcements', icon: '📢', count: announcements.length },
        { key: 'qa', label: 'Q&A', icon: '❓', count: qaList.length },
        { key: 'events', label: 'Events', icon: '📅', count: eventsList.length },
        { key: 'showcase', label: 'Showcase', icon: '🎨', count: projectsList.length },
        { key: 'gallery', label: 'Memories', icon: '📸', count: galleryList.length },
        { key: 'members', label: 'Members', icon: '👥', count: club.membersCount || members.length },
        { key: 'about', label: 'About', icon: 'ℹ️', count: null },
        ...(isMemberOrAdmin ? [
            { key: 'chat', label: 'Lounge', icon: '💬', count: null }
        ] : []),
        ...(isAdmin ? [
            { key: 'applications', label: 'Applications', icon: '📥', count: applicationsList.filter(a => a.status === 'pending').length },
            { key: 'settings', label: 'Settings', icon: '⚙️', count: null }
        ] : []),
    ];

    return (
        <div className={styles.pageWrapper} style={{
            '--primary': club.accentColor || '#3b82f6',
            '--gradient-brand': club.accentColor 
                ? `linear-gradient(135deg, ${club.accentColor}, ${adjustColorBrightness(club.accentColor, -30)})` 
                : 'linear-gradient(135deg, var(--primary), #1d4ed8)'
        }}>
            <ClubHero
                club={club}
                joined={joined}
                isAdmin={isAdmin}
                handleJoin={handleJoin}
                joiningLoading={joiningLoading}
                members={members}
            />

            {/* ── CONTENT ── */}
            <div className={styles.container}>
                {/* ── RECRUITMENT ACTIVE BANNER ── */}
                {club.recruitmentActive && !joined && (
                    <div className={styles.recruitmentBannerCard}>
                        <div className={styles.recruitmentBannerLeft}>
                            <span className={styles.recruitmentBannerBadge}>📢 NOW RECRUITING</span>
                            <h3>We are expanding our core team & membership!</h3>
                            <p>Apply today to represent this club, run events, collaborate on projects, and build your portfolio.</p>
                        </div>
                        <button 
                            className={styles.recruitmentBannerBtn} 
                            onClick={() => setShowApplyModal(true)}
                        >
                            🚀 Apply Now
                        </button>
                    </div>
                )}

                {/* Tabs */}
                <div className={styles.tabs}>
                    {tabs.map(t => (
                        <button key={t.key}
                            className={`${styles.tab} ${activeTab === t.key ? styles.tabActive : ''}`}
                            onClick={() => setActiveTab(t.key)}
                        >
                            {t.icon} {t.label}
                            {t.count !== null && (
                                <span className={styles.tabBadge}>{t.count}</span>
                            )}
                        </button>
                    ))}
                </div>

                {/* ── ANNOUNCEMENTS TAB ── */}
                {activeTab === 'announcements' && (
                    <AnnouncementsTab
                        isAdmin={isAdmin}
                        user={user}
                        newAnnouncement={newAnnouncement}
                        setNewAnnouncement={setNewAnnouncement}
                        handlePostAnnouncement={handlePostAnnouncement}
                        posting={posting}
                        joined={joined}
                        handleJoin={handleJoin}
                        joiningLoading={joiningLoading}
                        announcements={announcements}
                        formatDate={formatDate}
                    />
                )}

                {/* ── Q&A TAB ── */}
                {activeTab === 'qa' && (
                    <QATab
                        user={user}
                        newQuestion={newQuestion}
                        setNewQuestion={setNewQuestion}
                        handlePostQuestion={handlePostQuestion}
                        submittingQA={submittingQA}
                        qaList={qaList}
                        handleUpvoteQuestion={handleUpvoteQuestion}
                        newReply={newReply}
                        setNewReply={setNewReply}
                        handlePostReply={handlePostReply}
                        formatDate={formatDate}
                        club={club}
                    />
                )}
                                                            return (
                                                                <div
                                                                    key={reply.replyId}
                                                                    className={`${styles.qaReplyCard} ${reply.isOfficial ? styles.qaReplyOfficial : ''}`}
                                                                >
                                                                    {reply.isOfficial && (
                                                                        <div className={styles.officialBadge}>
                                                                            ✨ Verified Answer
                                                                        </div>
                                                                    )}
                                                                    <div className={styles.qaReplyHeader}>
                                                                        <div className={styles.qaReplyAuthorRow}>
                                                                            <span className={styles.qaReplyAuthor}>{reply.authorName}</span>
                                                                            <span className={`${styles.memberRoleBadge} ${isReplyAdmin ? styles.adminBadge : isSpecialRole ? styles.coreBadge : ''}`} style={{ fontSize: '0.65rem', padding: '2px 6px' }}>
                                                                                {isReplyAdmin ? '⭐ Admin' : isSpecialRole ? `🔶 ${reply.authorRole}` : reply.authorRole === 'Member' ? '• Member' : 'Visitor'}
                                                                            </span>
                                                                        </div>
                                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                                            <span className={styles.qaReplyTime}>{formatDate(reply.createdAt)}</span>
                                                                            {isAdmin && (
                                                                                <button
                                                                                    className={`${styles.verifyBtn} ${reply.isOfficial ? styles.verifyBtnActive : ''}`}
                                                                                    onClick={() => handleVerifyReply(qa.id, reply.replyId)}
                                                                                    title={reply.isOfficial ? 'Unverify Answer' : 'Mark as Official Answer'}
                                                                                >
                                                                                    {reply.isOfficial ? '✓ Verified' : 'Verify'}
                                                                                </button>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                    <div className={styles.qaReplyText}>{reply.text}</div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                )}

                                                {/* Write Reply Box */}
                                                {user && (
                                                    <div className={styles.replyBox}>
                                                        <input
                                                            type="text"
                                                            className={styles.replyInput}
                                                            placeholder="Write a reply..."
                                                            value={newReply[qa.id] || ''}
                                                            onChange={e => setNewReply(prev => ({ ...prev, [qa.id]: e.target.value }))}
                                                            onKeyDown={e => {
                                                                if (e.key === 'Enter') handlePostReply(qa.id);
                                                            }}
                                                        />
                                                        <button
                                                            className={styles.replySubmitBtn}
                                                            onClick={() => handlePostReply(qa.id)}
                                                            disabled={!newReply[qa.id]?.trim()}
                                                        >
                                                            Send
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}

                {/* ── EVENTS TAB ── */}
                {activeTab === 'events' && (
                    <EventsTab
                        isAdmin={isAdmin}
                        eventsList={eventsList}
                        setShowAddEventModal={setShowAddEventModal}
                        user={user}
                        handleRSVPEvent={handleRSVPEvent}
                        showAddEventModal={showAddEventModal}
                        handleCreateEvent={handleCreateEvent}
                        newEventTitle={newEventTitle}
                        setNewEventTitle={setNewEventTitle}
                        newEventDesc={newEventDesc}
                        setNewEventDesc={setNewEventDesc}
                        newEventDate={newEventDate}
                        setNewEventDate={setNewEventDate}
                        newEventTime={newEventTime}
                        setNewEventTime={setNewEventTime}
                        newEventVenue={newEventVenue}
                        setNewEventVenue={setNewEventVenue}
                        newEventGradient={newEventGradient}
                        setNewEventGradient={setNewEventGradient}
                        submittingEvent={submittingEvent}
                    />
                )}
                                                    className={styles.input}
                                                    required
                                                    value={newEventTime}
                                                    onChange={e => setNewEventTime(e.target.value)}
                                                />
                                            </div>
                                        </div>
                                        <div className={styles.formGroup}>
                                            <label className={styles.label}>Venue / Link</label>
                                            <input
                                                type="text"
                                                className={styles.input}
                                                required
                                                placeholder="e.g. Seminar Hall B, or Zoom link"
                                                value={newEventVenue}
                                                onChange={e => setNewEventVenue(e.target.value)}
                                            />
                                        </div>
                                        <div className={styles.formGroup}>
                                            <label className={styles.label}>Visual Theme</label>
                                            <div className={styles.bannerPickerGrid}>
                                                {[
                                                    { id: 'fire', color: 'linear-gradient(135deg, #f59e0b, #dc2626)' },
                                                    { id: 'forest', color: 'linear-gradient(135deg, #22c55e, #15803d)' },
                                                    { id: 'sky', color: 'linear-gradient(135deg, #06b6d4, #3b82f6)' },
                                                    { id: 'sunset', color: 'linear-gradient(135deg, #f97316, #b91c1c)' },
                                                    { id: 'purple', color: 'linear-gradient(135deg, #a855f7, #6366f1)' }
                                                ].map(preset => (
                                                    <div
                                                        key={preset.id}
                                                        className={`${styles.bannerSwatch} ${newEventGradient === preset.id ? styles.bannerSwatchActive : ''}`}
                                                        style={{ background: preset.color }}
                                                        onClick={() => setNewEventGradient(preset.id)}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                        <div className={styles.modalFooter}>
                                            <button
                                                type="button"
                                                className={styles.deleteBtn}
                                                style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}
                                                onClick={() => setShowAddEventModal(false)}
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                type="submit"
                                                className={styles.postBtn}
                                                disabled={submittingEvent}
                                            >
                                                {submittingEvent ? 'Scheduling...' : 'Schedule Event'}
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* ── SHOWCASE TAB ── */}
                {activeTab === 'showcase' && (
                    <ShowcaseTab
                        projectsList={projectsList}
                        joined={joined}
                        setShowAddProjModal={setShowAddProjModal}
                        user={user}
                        handleLikeProject={handleLikeProject}
                        showAddProjModal={showAddProjModal}
                        handleCreateProject={handleCreateProject}
                        newProjTitle={newProjTitle}
                        setNewProjTitle={setNewProjTitle}
                        newProjDesc={newProjDesc}
                        setNewProjDesc={setNewProjDesc}
                        newProjLink={newProjLink}
                        setNewProjLink={setNewProjLink}
                        newProjImage={newProjImage}
                        setNewProjImage={setNewProjImage}
                        newProjTags={newProjTags}
                        setNewProjTags={setNewProjTags}
                        submittingProj={submittingProj}
                    />
                )}
                                        </div>
                                    </form>
                                </div>
                            </div>
                        )}

                        {/* Add Photo Modal */}
                        {showAddPhotoModal && (
                            <div className={styles.modalOverlay}>
                                <div className={styles.modalContent}>
                                    <div className={styles.modalHeader}>
                                        <h3>📸 Add Event Memory Photo</h3>
                                        <button
                                            className={styles.closeModalBtn}
                                            onClick={() => setShowAddPhotoModal(false)}
                                        >
                                            ✕
                                        </button>
                                    </div>
                                    <form onSubmit={handleUploadPhoto} className={styles.modalForm}>
                                        <div className={styles.formGroup}>
                                            <label className={styles.label}>Memory Photo URL</label>
                                            <input
                                                type="url"
                                                className={styles.input}
                                                required
                                                placeholder="https://images.unsplash.com/..."
                                                value={newPhotoUrl}
                                                onChange={e => setNewPhotoUrl(e.target.value)}
                                            />
                                        </div>
                                        <div className={styles.formGroup}>
                                            <label className={styles.label}>Event / Location Name</label>
                                            <input
                                                type="text"
                                                className={styles.input}
                                                placeholder="e.g. Annual Hackathon 2026, Core Meetup"
                                                value={newPhotoEvent}
                                                onChange={e => setNewPhotoEvent(e.target.value)}
                                            />
                                        </div>
                                        <div className={styles.formGroup}>
                                            <label className={styles.label}>Caption</label>
                                            <textarea
                                                className={styles.textarea}
                                                placeholder="Write a short description or memory detail..."
                                                value={newPhotoCaption}
                                                onChange={e => setNewPhotoCaption(e.target.value)}
                                                rows={3}
                                            />
                                        </div>
                                        <div className={styles.modalFooter}>
                                            <button
                                                type="button"
                                                className={styles.deleteBtn}
                                                style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}
                                                onClick={() => setShowAddPhotoModal(false)}
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                type="submit"
                                                className={styles.postBtn}
                                                disabled={submittingPhoto}
                                            >
                                                {submittingPhoto ? 'Adding...' : 'Add Memory'}
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* ── MEMBERS TAB ── */}
                {activeTab === 'members' && (
                    <MembersTab
                        club={club}
                        members={members}
                        isAdmin={isAdmin}
                        handleAssignRole={handleAssignRole}
                    />
                )}

                {/* ── ABOUT TAB ── */}
                {activeTab === 'about' && (
                    <AboutTab club={club} />
                )}
                                                target="_blank" rel="noopener noreferrer" className={styles.aboutLinkBtn} style={{ background: 'rgba(220,38,38,0.1)', color: '#dc2626', borderColor: 'rgba(220,38,38,0.3)' }}>
                                                📋 Registration Form ↗
                                            </a>
                                        )}
                                        {club.discord && (
                                            <a href={club.discord.startsWith('http') ? club.discord : `https://${club.discord}`}
                                                target="_blank" rel="noopener noreferrer" className={styles.aboutLinkBtn} style={{ background: 'rgba(88,101,242,0.1)', color: '#5865f2', borderColor: 'rgba(88,101,242,0.3)' }}>
                                                💬 Discord Server ↗
                                            </a>
                                        )}
                                        {club.whatsapp && (
                                            <a href={club.whatsapp.startsWith('http') ? club.whatsapp : `https://${club.whatsapp}`}
                                                target="_blank" rel="noopener noreferrer" className={styles.aboutLinkBtn} style={{ background: 'rgba(34,197,94,0.1)', color: '#16a34a', borderColor: 'rgba(34,197,94,0.3)' }}>
                                                📱 WhatsApp Group ↗
                                            </a>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Supervisor */}
                            {club.supervisorName && (
                                <div className={styles.aboutCard}>
                                    <div className={styles.aboutCardIcon} style={{ background: 'linear-gradient(135deg, #22c55e, #b91c1c)' }}>🎓</div>
                                    <div className={styles.aboutCardTitle}>Faculty Supervisor</div>
                                    <div className={styles.aboutCardText}>
                                        <strong>{club.supervisorName}</strong>
                                        {club.supervisorEmail && (
                                            <div style={{ marginTop: 4 }}>
                                                <a href={`mailto:${club.supervisorEmail}`} className={styles.discordLink}>
                                                    ✉️ {club.supervisorEmail}
                                                </a>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* ── MEMORIES GALLERY TAB ── */}
                {activeTab === 'gallery' && (
                    <GalleryTab
                        isMemberOrAdmin={isMemberOrAdmin}
                        setShowAddPhotoModal={setShowAddPhotoModal}
                        galleryList={galleryList}
                        showAddPhotoModal={showAddPhotoModal}
                        handleAddPhoto={handleAddPhoto}
                        newPhotoUrl={newPhotoUrl}
                        setNewPhotoUrl={setNewPhotoUrl}
                        newPhotoCaption={newPhotoCaption}
                        setNewPhotoCaption={setNewPhotoCaption}
                        newPhotoEvent={newPhotoEvent}
                        setNewPhotoEvent={setNewPhotoEvent}
                        submittingPhoto={submittingPhoto}
                        eventsList={eventsList}
                    />
                )}

                {/* ── REAL-TIME MEMBER CHAT LOUNGE TAB ── */}
                {activeTab === 'chat' && isMemberOrAdmin && (
                    <ChatTab
                        isMemberOrAdmin={isMemberOrAdmin}
                        chatMessages={chatMessages}
                        user={user}
                        handleReactToMessage={handleReactToMessage}
                        handleSendChatMessage={handleSendChatMessage}
                        newChatMessageText={newChatMessageText}
                        setNewChatMessageText={setNewChatMessageText}
                    />
                )}
                    </div>
                )}

                {/* ── SETTINGS TAB ── */}
                {activeTab === 'settings' && isAdmin && (
                    <div className={styles.tabContent}>

                        <div className={styles.settingsSection}>
                            <div className={styles.settingsTitle}>✏️ Club Details</div>
                            <div className={styles.formGroup}>
                                <label className={styles.label}>Club Name</label>
                                <input className={styles.input} value={editName} onChange={e => setEditName(e.target.value)} />
                            </div>
                            <div className={styles.formGroup}>
                                <label className={styles.label}>Description</label>
                                <textarea className={styles.textarea} value={editDesc} onChange={e => setEditDesc(e.target.value)} />
                            </div>
                            <div className={styles.formGroup}>
                                <label className={styles.label}>📍 Meeting Schedule</label>
                                <input className={styles.input} value={editMeet} onChange={e => setEditMeet(e.target.value)} />
                            </div>
                            <div className={styles.formGroup}>
                                <label className={styles.label}>📅 Upcoming Event</label>
                                <input className={styles.input} value={editEvent} onChange={e => setEditEvent(e.target.value)} />
                            </div>
                        </div>

                        <div className={styles.settingsSection}>
                            <div className={styles.settingsTitle}>👨‍🏫 Club Supervisor Info</div>
                            <div className={styles.formGroup}>
                                <label className={styles.label}>Supervisor Name</label>
                                <input className={styles.input} value={editSupervisorName} onChange={e => setEditSupervisorName(e.target.value)} placeholder="e.g. Dr. Jane Doe" />
                            </div>
                            <div className={styles.formGroup}>
                                <label className={styles.label}>Supervisor Email</label>
                                <input className={styles.input} type="email" value={editSupervisorEmail} onChange={e => setEditSupervisorEmail(e.target.value)} placeholder="e.g. supervisor@college.edu" />
                            </div>
                        </div>

                        <div className={styles.settingsSection}>
                            <div className={styles.settingsTitle}>🔥 Native Recruitment Board</div>
                            <div className={styles.formGroup} style={{ flexDirection: 'row', alignItems: 'center', gap: '10px' }}>
                                <input 
                                    type="checkbox" 
                                    id="recruitmentActive"
                                    checked={recruitmentActive} 
                                    onChange={e => setRecruitmentActive(e.target.checked)} 
                                    style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                                />
                                <label htmlFor="recruitmentActive" className={styles.label} style={{ marginBottom: 0, cursor: 'pointer' }}>
                                    Active & Open for Applications
                                </label>
                            </div>
                            <div className={styles.formGroup}>
                                <label className={styles.label}>Screening Questions (One per line)</label>
                                <textarea 
                                    className={styles.textarea} 
                                    value={screeningQuestions} 
                                    onChange={e => setScreeningQuestions(e.target.value)} 
                                    placeholder="e.g. Why do you want to join?&#10;What relevant skills/experience do you have?"
                                    rows={4}
                                />
                            </div>
                        </div>

                        <div className={styles.settingsSection}>
                            <div className={styles.settingsTitle}>🔗 Links & Communication</div>
                            <div className={styles.formGroup}>
                                <label className={styles.label}>🌐 Joining / Registration Link</label>
                                <input className={styles.input} type="url" value={editJoiningLink} onChange={e => setEditJoiningLink(e.target.value)} placeholder="https://forms.google.com/..." />
                            </div>
                            <div className={styles.formGroup}>
                                <label className={styles.label}>💬 Discord Server</label>
                                <input className={styles.input} value={editDiscord} onChange={e => setEditDiscord(e.target.value)} placeholder="discord.gg/..." />
                            </div>
                            <div className={styles.formGroup}>
                                <label className={styles.label}>📱 WhatsApp Group</label>
                                <input className={styles.input} value={editWhatsapp} onChange={e => setEditWhatsapp(e.target.value)} placeholder="chat.whatsapp.com/..." />
                            </div>
                            <button className={styles.saveBtn} onClick={handleSave} disabled={saving}>
                                {saving ? 'Saving...' : '💾 Save Changes'}
                            </button>
                        </div>

                        {/* ── APPEARANCE ── */}
                        <div className={styles.settingsSection}>
                            <div className={styles.settingsTitle}>🎨 Appearance</div>
                            <div style={{ marginBottom: '16px' }}>
                                <label className={styles.label}>Banner Gradient</label>
                                <div className={styles.bannerPickerGrid}>
                                    {BANNER_PRESETS.map(preset => (
                                        <button
                                            key={preset.id}
                                            type="button"
                                            className={`${styles.bannerSwatch} ${editBannerGradient === preset.id ? styles.bannerSwatchActive : ''}`}
                                            style={{ background: preset.gradient }}
                                            onClick={() => setEditBannerGradient(preset.id)}
                                            title={preset.label}
                                        >
                                            {editBannerGradient === preset.id && <span>✓</span>}
                                        </button>
                                    ))}
                                </div>
                                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '8px' }}>
                                    This gradient will be used as the club&apos;s hero banner.
                                </p>
                            </div>

                            <div style={{ marginBottom: '16px', marginTop: '24px' }}>
                                <label className={styles.label}>🎨 Brand Accent Color</label>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <input 
                                        type="color" 
                                        value={editAccentColor} 
                                        onChange={e => setEditAccentColor(e.target.value)}
                                        style={{ width: '50px', height: '40px', border: '1px solid var(--border)', borderRadius: '6px', cursor: 'pointer', padding: 0 }}
                                    />
                                    <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: '800', fontFamily: 'monospace' }}>
                                        {editAccentColor}
                                    </span>
                                </div>
                                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '8px' }}>
                                    Choose a signature color. We will dynamically theme buttons, tags, and highlights to match!
                                </p>
                            </div>

                            <div style={{ marginBottom: '16px', marginTop: '20px' }}>
                                <label className={styles.label}>🖼️ Custom Cover Banner Image (URL)</label>
                                <input 
                                    className={styles.input} 
                                    type="url" 
                                    value={editCoverImage} 
                                    onChange={e => setEditCoverImage(e.target.value)} 
                                    placeholder="https://images.unsplash.com/your-custom-banner.jpg"
                                />
                                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '8px' }}>
                                    Provide a custom background image link. If set, this overrides the preset banner gradients.
                                </p>
                            </div>

                            <button className={styles.saveBtn} onClick={handleSave} disabled={saving}>
                                {saving ? 'Saving...' : '💾 Apply Theme'}
                            </button>
                        </div>

                        <div className={`${styles.settingsSection} ${styles.dangerZone}`}>
                            <div className={styles.settingsTitle}>⚠️ Danger Zone</div>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: 16 }}>
                                Permanently delete this club and all its data. This action cannot be undone.
                            </p>
                            <button className={styles.deleteBtn} onClick={handleDelete}>
                                🗑️ Delete Club
                            </button>
                        </div>
                    </div>
                )}

                {/* ── APPLICATIONS TAB ── */}
                {activeTab === 'applications' && isAdmin && (
                    <div className={styles.tabContent}>
                        <div className={styles.membersHeader}>
                            <span className={styles.membersTitle}>Recruitment Applications Inbox</span>
                            <span className={styles.membersSubtitle}>({applicationsList.length} total)</span>
                        </div>

                        {applicationsList.length === 0 ? (
                            <div className={styles.emptyState}>
                                <div className={styles.emptyIcon}>📥</div>
                                <p>No applications received yet. Configure screening questions in settings to get started!</p>
                            </div>
                        ) : (
                            <div className={styles.applicationsListStack}>
                                {applicationsList.map((app) => (
                                    <div key={app.id} className={styles.appInboxCard}>
                                        <div className={styles.appInboxCardHeader}>
                                            <div>
                                                <h3 className={styles.appInboxName}>{app.userName}</h3>
                                                <p className={styles.appInboxEmail}>{app.userEmail}</p>
                                            </div>
                                            <span className={`${styles.appStatusBadge} ${
                                                app.status === 'accepted' ? styles.appAccepted : 
                                                app.status === 'shortlisted' ? styles.appShortlisted : 
                                                app.status === 'rejected' ? styles.appRejected : styles.appPending
                                            }`}>
                                                {app.status.toUpperCase()}
                                            </span>
                                        </div>

                                        <div className={styles.appInboxAnswers}>
                                            {Object.entries(app.answers || {}).map(([question, answer]) => (
                                                <div key={question} className={styles.appInboxAnswerGroup}>
                                                    <div className={styles.appInboxQuestion}>{question}</div>
                                                    <div className={styles.appInboxAnswer}>{answer || 'No answer provided.'}</div>
                                                </div>
                                            ))}
                                        </div>

                                        {app.status === 'pending' && (
                                            <div className={styles.appInboxActions}>
                                                <button 
                                                    className={styles.appShortlistBtn}
                                                    onClick={() => handleUpdateAppStatus(app.id, 'shortlisted', app.userId)}
                                                >
                                                    🔶 Shortlist
                                                </button>
                                                <button 
                                                    className={styles.appAcceptBtn}
                                                    onClick={() => handleUpdateAppStatus(app.id, 'accepted', app.userId)}
                                                >
                                                    ✓ Accept Member
                                                </button>
                                                <button 
                                                    className={styles.appRejectBtn}
                                                    onClick={() => handleUpdateAppStatus(app.id, 'rejected', app.userId)}
                                                >
                                                    ✕ Reject
                                                </button>
                                            </div>
                                        )}
                                        {app.status === 'shortlisted' && (
                                            <div className={styles.appInboxActions}>
                                                <button 
                                                    className={styles.appAcceptBtn}
                                                    onClick={() => handleUpdateAppStatus(app.id, 'accepted', app.userId)}
                                                >
                                                    ✓ Accept Member
                                                </button>
                                                <button 
                                                    className={styles.appRejectBtn}
                                                    onClick={() => handleUpdateAppStatus(app.id, 'rejected', app.userId)}
                                                >
                                                    ✕ Reject
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* ── SCREENING APPLICATION MODAL ── */}
            {showApplyModal && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modalContent}>
                        <div className={styles.modalHeader}>
                            <h2>🚀 Apply to Join {club.name}</h2>
                            <button className={styles.closeBtn} onClick={() => setShowApplyModal(false)}>✕</button>
                        </div>
                        <form onSubmit={handleSubmitApplication} className={styles.modalForm}>
                            <p className={styles.modalSubtitle}>
                                Please answer the screening questions below to submit your membership request.
                            </p>
                            
                            {(club.screeningQuestions || "Why do you want to join this club?").split('\n').filter(Boolean).map((q, idx) => (
                                <div key={idx} className={styles.formGroup}>
                                    <label className={styles.label}>{q}</label>
                                    <textarea 
                                        className={styles.textarea}
                                        value={applicantAnswers[q] || ''}
                                        onChange={e => setApplicantAnswers(prev => ({
                                            ...prev,
                                            [q]: e.target.value
                                        }))}
                                        required
                                        placeholder="Type your response here..."
                                        rows={3}
                                    />
                                </div>
                            ))}

                            <div className={styles.modalFooterActions}>
                                <button 
                                    type="button" 
                                    className={styles.cancelBtn} 
                                    onClick={() => setShowApplyModal(false)}
                                    disabled={submittingApp}
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit" 
                                    className={styles.postBtn}
                                    disabled={submittingApp}
                                >
                                    {submittingApp ? 'Submitting...' : 'Submit Application'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
