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

const adjustColorBrightness = (hex, percent) => {
    if (!hex || hex.charAt(0) !== '#') return hex || '#3b82f6';
    let R = parseInt(hex.substring(1, 3), 16);
    let G = parseInt(hex.substring(3, 5), 16);
    let B = parseInt(hex.substring(5, 7), 16);

    R = parseInt(R * (100 + percent) / 100);
    G = parseInt(G * (100 + percent) / 100);
    B = parseInt(B * (100 + percent) / 100);

    R = R < 255 ? R : 255;
    G = G < 255 ? G : 255;
    B = B < 255 ? B : 255;

    R = R > 0 ? R : 0;
    G = G > 0 ? G : 0;
    B = B > 0 ? B : 0;

    const rHex = R.toString(16).padStart(2, '0');
    const gHex = G.toString(16).padStart(2, '0');
    const bHex = B.toString(16).padStart(2, '0');

    return `#${rHex}${gHex}${bHex}`;
};




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
            {/* ── HERO ── */}
            <div className={styles.heroBanner}>
                <div className={styles.heroBannerBg} style={{ 
                    background: club.coverImage 
                        ? `url(${club.coverImage}) center/cover no-repeat` 
                        : club.gradient || 'var(--gradient-brand)' 
                }}></div>

                {/* Floating particles */}
                <div className={styles.heroParticles}>
                    {[...Array(8)].map((_, i) => (
                        <div key={i} className={styles.particle}
                            style={{ left: `${10 + i * 12}%`, width: `${4 + i % 3 * 3}px`, height: `${4 + i % 3 * 3}px` }}
                        />
                    ))}
                </div>

                <div className={styles.heroContainer}>
                    <Link href="/clubs" className={styles.backBtn}>← All Clubs</Link>

                    <div className={styles.heroContent}>
                        {/* Icon */}
                        <div className={styles.heroLeft}>
                            <div className={styles.heroIconWrap}>
                                <div className={styles.heroIcon}>{club.emoji || '🎓'}</div>
                                <div className={styles.heroIconGlow} style={{ background: club.gradient || 'var(--gradient-brand)' }}></div>
                            </div>
                        </div>

                        {/* Info */}
                        <div className={styles.heroInfo}>
                            <div className={styles.heroTopRow}>
                                <span className={styles.clubCategoryBadge}>{club.category}</span>
                                {club.upcomingEvent && (
                                    <span className={styles.eventBadge}>📅 {club.upcomingEvent}</span>
                                )}
                            </div>
                            <h1 className={styles.clubName}>{club.name}</h1>
                            <p className={styles.clubDesc}>{club.description}</p>

                            {club.tags?.length > 0 && (
                                <div className={styles.heroTags}>
                                    {club.tags.map(tag => (
                                        <span key={tag} className={styles.heroTag}>{tag}</span>
                                    ))}
                                </div>
                            )}

                            <div className={styles.heroMetaRow}>
                                <span className={styles.metaPill}>👥 {club.membersCount || members.length} members</span>
                                {club.meetSchedule && <span className={styles.metaPill}>📍 {club.meetSchedule}</span>}
                                {club.adminName && <span className={styles.metaPill}>👤 Led by {club.adminName}</span>}
                                {club.supervisorName && <span className={styles.metaPill}>🎓 Supervised by {club.supervisorName}</span>}
                            </div>
                        </div>

                        {/* Actions */}
                        <div className={styles.heroActions}>
                            {/* Join/Leave */}
                            {!isAdmin && (
                                joined ? (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                        <div className={styles.joinedBadge}>✅ You're a member!</div>
                                        <button className={styles.leaveBtnLarge} onClick={handleJoin} disabled={joiningLoading}>
                                            {joiningLoading ? 'Leaving...' : 'Leave Club'}
                                        </button>
                                    </div>
                                ) : (
                                    <button className={styles.joinBtnLarge} onClick={handleJoin} disabled={joiningLoading}>
                                        {joiningLoading ? 'Joining...' : <>Join Club <span className={styles.joinArrow}>→</span></>}
                                    </button>
                                )
                            )}

                            {/* Joining/Registration link */}
                            {club.joiningLink && (
                                <a href={club.joiningLink.startsWith('http') ? club.joiningLink : `https://${club.joiningLink}`}
                                    target="_blank" rel="noopener noreferrer" className={styles.linkBtn} style={{ background: 'rgba(34,197,94,0.25)', borderColor: 'rgba(34,197,94,0.5)' }}>
                                    📋 Registration Form
                                </a>
                            )}

                            {/* Discord */}
                            {club.discord && (
                                <a href={club.discord.startsWith('http') ? club.discord : `https://${club.discord}`}
                                    target="_blank" rel="noopener noreferrer" className={styles.discordBtn}>
                                    💬 Discord Server
                                </a>
                            )}

                            {/* WhatsApp */}
                            {club.whatsapp && (
                                <a href={club.whatsapp.startsWith('http') ? club.whatsapp : `https://${club.whatsapp}`}
                                    target="_blank" rel="noopener noreferrer" className={styles.linkBtn} style={{ background: 'rgba(34,197,94,0.2)', borderColor: 'rgba(34,197,94,0.4)' }}>
                                    📱 WhatsApp Group
                                </a>
                            )}
                        </div>
                    </div>
                </div>
            </div>

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
                    <div className={styles.tabContent}>
                        {/* Compose box — visible to admins */}
                        {isAdmin && (
                            <div className={styles.composeBox}>
                                <div className={styles.composeAvatar}>
                                    {user?.photoURL ? <img src={user.photoURL} alt="" style={{ width: 44, height: 44, borderRadius: '50%' }} /> : '📢'}
                                </div>
                                <div className={styles.composeRight}>
                                    <textarea
                                        className={styles.composeInput}
                                        placeholder="Post an announcement to all members..."
                                        value={newAnnouncement}
                                        onChange={e => setNewAnnouncement(e.target.value)}
                                        maxLength={2000}
                                    />
                                    <div className={styles.composeFooter}>
                                        <span className={styles.composeTip}>📌 Members will see this immediately.</span>
                                        <button
                                            className={styles.postBtn}
                                            onClick={handlePostAnnouncement}
                                            disabled={posting || !newAnnouncement.trim()}
                                        >
                                            {posting ? 'Posting...' : 'Post Announcement'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Join prompt for non-members */}
                        {!joined && !isAdmin && (
                            <div className={styles.joinPrompt}>
                                <span>🔔</span>
                                <div>
                                    <strong>Join to see all announcements!</strong>
                                    <p>Members get notified about events, updates, and much more.</p>
                                </div>
                                <button className={styles.joinPromptBtn} onClick={handleJoin} disabled={joiningLoading}>
                                    {joiningLoading ? 'Joining...' : 'Join Club'}
                                </button>
                            </div>
                        )}

                        {announcements.length === 0 ? (
                            <div className={styles.emptyTab}>
                                <div className={styles.emptyTabIcon}>📭</div>
                                <p>No announcements yet.{isAdmin ? ' Be the first to post!' : ' Check back soon!'}</p>
                            </div>
                        ) : (
                            <div className={styles.announcementList}>
                                {announcements.map((a, i) => (
                                    <div key={a.id}
                                        className={`${styles.announcementCard} ${a.pinned ? styles.pinnedCard : ''}`}
                                        style={{ animationDelay: `${i * 60}ms` }}
                                    >
                                        {a.pinned && <div className={styles.pinnedBanner}>📌 Pinned</div>}
                                        <div className={styles.announceHeader}>
                                            <div className={styles.announceAuthorRow}>
                                                <div className={styles.announceAvatar}>{a.authorEmoji || a.authorName?.charAt(0) || '👤'}</div>
                                                <div>
                                                    <div className={styles.announceAuthor}>{a.authorName}</div>
                                                    <div className={styles.announceTime}>{formatDate(a.createdAt)}</div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className={styles.announceBody}>{a.content}</div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* ── Q&A TAB ── */}
                {activeTab === 'qa' && (
                    <div className={styles.tabContent}>
                        {/* Compose Question Box */}
                        {user ? (
                            <div className={styles.composeBox}>
                                <div className={styles.composeAvatar}>
                                    {user.photoURL ? <img src={user.photoURL} alt="" style={{ width: 44, height: 44, borderRadius: '50%' }} /> : '❓'}
                                </div>
                                <div className={styles.composeRight}>
                                    <textarea
                                        className={styles.composeInput}
                                        placeholder="Ask a question about this club..."
                                        value={newQuestion}
                                        onChange={e => setNewQuestion(e.target.value)}
                                        maxLength={1000}
                                    />
                                    <div className={styles.composeFooter}>
                                        <span className={styles.composeTip}>💬 Anyone can reply and upvote.</span>
                                        <button
                                            className={styles.postBtn}
                                            onClick={handlePostQuestion}
                                            disabled={submittingQA || !newQuestion.trim()}
                                        >
                                            {submittingQA ? 'Posting...' : 'Ask Question'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className={styles.joinPrompt}>
                                <span>🔒</span>
                                <div>
                                    <strong>Log in to ask questions!</strong>
                                    <p>Connect with club admins and members to learn more about club operations.</p>
                                </div>
                                <Link href="/login" className={styles.joinPromptBtn}>Log In</Link>
                            </div>
                        )}

                        {/* Questions List */}
                        {qaList.length === 0 ? (
                            <div className={styles.emptyTab}>
                                <div className={styles.emptyTabIcon}>💬</div>
                                <p>No questions asked yet. Be the first to start the conversation!</p>
                            </div>
                        ) : (
                            <div className={styles.qaList}>
                                {qaList.map((qa, i) => {
                                    const hasUpvoted = user && qa.upvotes?.includes(user.uid);
                                    return (
                                        <div key={qa.id} className={styles.qaCard} style={{ animationDelay: `${i * 60}ms` }}>
                                            {/* Left Column: Upvotes */}
                                            <div className={styles.qaUpvoteCol}>
                                                <button
                                                    className={`${styles.upvoteBtn} ${hasUpvoted ? styles.upvoteBtnActive : ''}`}
                                                    onClick={() => handleUpvoteQuestion(qa.id)}
                                                    title={hasUpvoted ? 'Remove Upvote' : 'Upvote Question'}
                                                >
                                                    <span className={styles.upvoteArrow}>▲</span>
                                                    <span className={styles.upvoteCount}>{qa.upvoteCount || 0}</span>
                                                </button>
                                            </div>

                                            {/* Right Column: Question & Replies */}
                                            <div className={styles.qaMainCol}>
                                                <div className={styles.qaQuestionHeader}>
                                                    <span className={styles.qaAuthor}>{qa.userName}</span>
                                                    <span className={styles.qaTime}>{formatDate(qa.createdAt)}</span>
                                                </div>
                                                <div className={styles.qaQuestionText}>{qa.questionText}</div>

                                                {/* Replies Stack */}
                                                {qa.replies && qa.replies.length > 0 && (
                                                    <div className={styles.qaRepliesStack}>
                                                        {qa.replies.map(reply => {
                                                            const isReplyAdmin = reply.authorRole === 'Admin';
                                                            const isSpecialRole = reply.authorRole !== 'Member' && reply.authorRole !== 'Admin' && reply.authorRole !== 'Visitor';
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
                    <div className={styles.tabContent}>
                        {/* Event Admin controls */}
                        <div className={styles.eventsHeader}>
                            <div>
                                <span className={styles.membersTitle}>Club Calendar</span>
                                <span className={styles.membersSubtitle}>({eventsList.length} scheduled)</span>
                            </div>
                            {isAdmin && (
                                <button
                                    className={styles.postBtn}
                                    onClick={() => setShowAddEventModal(true)}
                                >
                                    ✨ Schedule New Event
                                </button>
                            )}
                        </div>

                        {/* Events list */}
                        {eventsList.length === 0 ? (
                            <div className={styles.emptyTab}>
                                <div className={styles.emptyTabIcon}>📅</div>
                                <p>No events scheduled currently. Check back soon!</p>
                            </div>
                        ) : (
                            <div className={styles.eventsTimeline}>
                                {eventsList.map((evt, i) => {
                                    const hasRSVPd = user && evt.attendees?.includes(user.uid);
                                    const eventDateStr = evt.date?.toDate
                                        ? evt.date.toDate().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
                                        : new Date(evt.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
                                    
                                    const eventTimeStr = evt.date?.toDate
                                        ? evt.date.toDate().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
                                        : new Date(evt.date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

                                    // Google Calendar link builder
                                    const dObj = evt.date?.toDate ? evt.date.toDate() : new Date(evt.date);
                                    const gCalStart = dObj.toISOString().replace(/-|:|\.\d\d\d/g, "");
                                    const endD = new Date(dObj.getTime() + 2 * 60 * 60 * 1000); // assume 2 hours duration
                                    const gCalEnd = endD.toISOString().replace(/-|:|\.\d\d\d/g, "");
                                    const gCalUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(evt.title)}&dates=${gCalStart}/${gCalEnd}&details=${encodeURIComponent(evt.description)}&location=${encodeURIComponent(evt.venue)}`;

                                    return (
                                        <div key={evt.id} className={styles.eventTimelineCard} style={{ animationDelay: `${i * 80}ms` }}>
                                            <div className={styles.eventLeftBar} style={{ background: evt.coverGradient || 'var(--gradient-brand)' }}>
                                                <span className={styles.eventLeftDate}>
                                                    {evt.date?.toDate ? evt.date.toDate().getDate() : new Date(evt.date).getDate()}
                                                </span>
                                                <span className={styles.eventLeftMonth}>
                                                    {evt.date?.toDate ? evt.date.toDate().toLocaleDateString('en-US', { month: 'short' }) : new Date(evt.date).toLocaleDateString('en-US', { month: 'short' })}
                                                </span>
                                            </div>

                                            <div className={styles.eventTimelineRight}>
                                                <div className={styles.eventHeaderRow}>
                                                    <h3 className={styles.eventTitle}>{evt.title}</h3>
                                                    <div style={{ display: 'flex', gap: '8px' }}>
                                                        <a
                                                            href={gCalUrl}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className={styles.gCalExportBtn}
                                                            title="Export to Google Calendar"
                                                        >
                                                            📅 Google Calendar
                                                        </a>
                                                    </div>
                                                </div>

                                                <div className={styles.eventMetaRow}>
                                                    <span>🕒 {eventTimeStr}</span>
                                                    <span>📍 {evt.venue}</span>
                                                </div>

                                                <p className={styles.eventDescText}>{evt.description}</p>

                                                <div className={styles.eventRSVPRow}>
                                                    <button
                                                        className={`${styles.rsvpActionBtn} ${hasRSVPd ? styles.rsvpActionBtnActive : ''}`}
                                                        onClick={() => handleRSVPEvent(evt.id)}
                                                    >
                                                        {hasRSVPd ? '✓ Attending' : 'Count Me In! ⚡'}
                                                    </button>
                                                    
                                                    {evt.attendeeCount > 0 && (
                                                        <div className={styles.attendeeCounterText}>
                                                            🔥 Join {evt.attendeeCount} others attending!
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {/* Event Creation Modal */}
                        {showAddEventModal && (
                            <div className={styles.modalOverlay}>
                                <div className={styles.modalContent}>
                                    <div className={styles.modalHeader}>
                                        <h3>📅 Schedule New Event</h3>
                                        <button
                                            className={styles.closeModalBtn}
                                            onClick={() => setShowAddEventModal(false)}
                                        >
                                            ✕
                                        </button>
                                    </div>
                                    <form onSubmit={handleCreateEvent} className={styles.modalForm}>
                                        <div className={styles.formGroup}>
                                            <label className={styles.label}>Event Title</label>
                                            <input
                                                type="text"
                                                className={styles.input}
                                                required
                                                placeholder="Enter event name..."
                                                value={newEventTitle}
                                                onChange={e => setNewEventTitle(e.target.value)}
                                            />
                                        </div>
                                        <div className={styles.formGroup}>
                                            <label className={styles.label}>Description</label>
                                            <textarea
                                                className={styles.textarea}
                                                required
                                                placeholder="Provide event details, schedule, or prerequisites..."
                                                value={newEventDesc}
                                                onChange={e => setNewEventDesc(e.target.value)}
                                            />
                                        </div>
                                        <div className={styles.formRow}>
                                            <div className={styles.formGroup} style={{ flex: 1 }}>
                                                <label className={styles.label}>Date</label>
                                                <input
                                                    type="date"
                                                    className={styles.input}
                                                    required
                                                    value={newEventDate}
                                                    onChange={e => setNewEventDate(e.target.value)}
                                                />
                                            </div>
                                            <div className={styles.formGroup} style={{ flex: 1 }}>
                                                <label className={styles.label}>Time</label>
                                                <input
                                                    type="time"
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
                    <div className={styles.tabContent}>
                        {/* Showcase Controls */}
                        <div className={styles.eventsHeader}>
                            <div>
                                <span className={styles.membersTitle}>Project Showcase</span>
                                <span className={styles.membersSubtitle}>({projectsList.length} innovations)</span>
                            </div>
                            {joined && (
                                <button
                                    className={styles.postBtn}
                                    onClick={() => setShowAddProjModal(true)}
                                >
                                    🚀 Share Your Project
                                </button>
                            )}
                        </div>

                        {/* Projects Masonry / Grid */}
                        {projectsList.length === 0 ? (
                            <div className={styles.emptyTab}>
                                <div className={styles.emptyTabIcon}>🎨</div>
                                <p>No projects shared yet. {joined ? "Be the first to showcase your work!" : "Join the club to start sharing projects."}</p>
                            </div>
                        ) : (
                            <div className={styles.projectsMasonry}>
                                {projectsList.map((proj, i) => {
                                    const hasLiked = user && proj.likes?.includes(user.uid);
                                    return (
                                        <div key={proj.id} className={styles.projectCard} style={{ animationDelay: `${i * 60}ms` }}>
                                            <div className={styles.projectImageWrap}>
                                                <img
                                                    src={proj.imageUrl}
                                                    alt={proj.title}
                                                    className={styles.projectImage}
                                                    loading="lazy"
                                                />
                                                <div className={styles.projectGlassOverlay}>
                                                    {proj.link && (
                                                        <a
                                                            href={proj.link.startsWith('http') ? proj.link : `https://${proj.link}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className={styles.projLinkBtn}
                                                        >
                                                            🔗 View Project ↗
                                                        </a>
                                                    )}
                                                </div>
                                                <button
                                                    className={`${styles.projLikeBtn} ${hasLiked ? styles.projLikeBtnActive : ''}`}
                                                    onClick={() => handleLikeProject(proj.id)}
                                                    title={hasLiked ? 'Unlike Project' : 'Like Project'}
                                                >
                                                    ❤️ <span className={styles.projLikeCount}>{proj.likeCount || 0}</span>
                                                </button>
                                            </div>

                                            <div className={styles.projectInfo}>
                                                <h4 className={styles.projectTitle}>{proj.title}</h4>
                                                <p className={styles.projectDesc}>{proj.description}</p>
                                                
                                                {proj.tags && proj.tags.length > 0 && (
                                                    <div className={styles.projTags}>
                                                        {proj.tags.map(tag => (
                                                            <span key={tag} className={styles.projTag}>#{tag}</span>
                                                        ))}
                                                    </div>
                                                )}

                                                <div className={styles.projectFooter}>
                                                    <span className={styles.projectCreator}>BY {proj.creatorName.toUpperCase()}</span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {/* Add Project Modal */}
                        {showAddProjModal && (
                            <div className={styles.modalOverlay}>
                                <div className={styles.modalContent}>
                                    <div className={styles.modalHeader}>
                                        <h3>🚀 Share New Project</h3>
                                        <button
                                            className={styles.closeModalBtn}
                                            onClick={() => setShowAddProjModal(false)}
                                        >
                                            ✕
                                        </button>
                                    </div>
                                    <form onSubmit={handleCreateProject} className={styles.modalForm}>
                                        <div className={styles.formGroup}>
                                            <label className={styles.label}>Project Title</label>
                                            <input
                                                type="text"
                                                className={styles.input}
                                                required
                                                placeholder="Enter project name..."
                                                value={newProjTitle}
                                                onChange={e => setNewProjTitle(e.target.value)}
                                            />
                                        </div>
                                        <div className={styles.formGroup}>
                                            <label className={styles.label}>Description</label>
                                            <textarea
                                                className={styles.textarea}
                                                required
                                                placeholder="What did you build? Explain the stack and features..."
                                                value={newProjDesc}
                                                onChange={e => setNewProjDesc(e.target.value)}
                                            />
                                        </div>
                                        <div className={styles.formGroup}>
                                            <label className={styles.label}>Demo / Repository URL</label>
                                            <input
                                                type="url"
                                                className={styles.input}
                                                placeholder="https://github.com/... or live URL"
                                                value={newProjLink}
                                                onChange={e => setNewProjLink(e.target.value)}
                                            />
                                        </div>
                                        <div className={styles.formGroup}>
                                            <label className={styles.label}>Visual Thumbnail Image URL</label>
                                            <input
                                                type="url"
                                                className={styles.input}
                                                placeholder="https://images.unsplash.com/..."
                                                value={newProjImage}
                                                onChange={e => setNewProjImage(e.target.value)}
                                            />
                                        </div>
                                        <div className={styles.formGroup}>
                                            <label className={styles.label}>Tags (comma separated)</label>
                                            <input
                                                type="text"
                                                className={styles.input}
                                                placeholder="react, firebase, ai, robotics"
                                                value={newProjTags}
                                                onChange={e => setNewProjTags(e.target.value)}
                                            />
                                        </div>
                                        <div className={styles.modalFooter}>
                                            <button
                                                type="button"
                                                className={styles.deleteBtn}
                                                style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}
                                                onClick={() => setShowAddProjModal(false)}
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                type="submit"
                                                className={styles.postBtn}
                                                disabled={submittingProj}
                                            >
                                                {submittingProj ? 'Sharing...' : 'Share Project'}
                                            </button>
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
                    <div className={styles.tabContent}>
                        <div className={styles.membersHeader}>
                            <span className={styles.membersTitle}>Members</span>
                            <span className={styles.membersSubtitle}>({club.membersCount || members.length} total)</span>
                        </div>
                        <div className={styles.memberGrid}>
                            {members.slice().sort((a, b) => {
                                // Calculate sort weights
                                const getWeight = (member) => {
                                    if (member.id === club.adminId) return 3;
                                    if (club.memberRoles?.[member.id]) return 2;
                                    return 1;
                                };
                                return getWeight(b) - getWeight(a);
                            }).map((m, i) => {
                                const colors = ['#dc2626','#b91c1c','#22c55e','#10b981','#f59e0b','#15803d'];
                                const bg = colors[i % colors.length];
                                
                                let role = 'Member';
                                if (m.id === club.adminId) role = 'Admin';
                                else if (club.memberRoles?.[m.id]) role = club.memberRoles[m.id];
                                
                                const isAdminRole = role === 'Admin';
                                const isSpecialRole = role !== 'Member' && role !== 'Admin';
                                
                                return (
                                    <div key={m.id} className={styles.memberCard} style={{ animationDelay: `${i * 50}ms` }}>
                                        <div className={styles.memberAvatarWrap}>
                                            <div className={styles.memberAvatar} style={{ background: bg }}>
                                                {m.photoURL
                                                    ? <img src={m.photoURL} alt={m.name} style={{ width: 48, height: 48, borderRadius: '50%', objectFit: 'cover' }} />
                                                    : (m.emoji || m.name?.charAt(0) || '?')}
                                            </div>
                                            {role === 'Admin' && <span className={styles.adminCrown}>👑</span>}
                                        </div>
                                        <div className={styles.memberInfo}>
                                            <div className={styles.memberName}>{m.name || 'Member'}</div>
                                            {m.branch && <div className={styles.memberBranch}>{m.branch} {m.year ? `· ${m.year}` : ''}</div>}
                                            <span className={`${styles.memberRoleBadge} ${isAdminRole ? styles.adminBadge : isSpecialRole ? styles.coreBadge : ''}`}>
                                                {isAdminRole ? '⭐ Admin' : isSpecialRole ? `🔶 ${role}` : '• Member'}
                                            </span>
                                        </div>
                                        {isAdmin && m.id !== club.adminId && (
                                            <button 
                                                className={styles.assignRoleBtn}
                                                onClick={() => handleAssignRole(m.id)}
                                                title="Assign Position Title"
                                            >
                                                ⚡ Assign Role
                                            </button>
                                        )}
                                        <span className={styles.memberArrow}>›</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* ── ABOUT TAB ── */}
                {activeTab === 'about' && (
                    <div className={styles.tabContent}>
                        <div className={styles.aboutGrid}>
                            {/* Description */}
                            <div className={styles.aboutCard} style={{ gridColumn: '1 / -1' }}>
                                <div className={styles.aboutCardIcon} style={{ background: 'linear-gradient(135deg, #dc2626, #15803d)' }}>📖</div>
                                <div className={styles.aboutCardTitle}>About the Club</div>
                                <div className={styles.aboutCardText}>{club.description}</div>
                            </div>

                            {/* Tags */}
                            {club.tags?.length > 0 && (
                                <div className={styles.aboutCard}>
                                    <div className={styles.aboutCardIcon} style={{ background: 'linear-gradient(135deg, #b91c1c, #22c55e)' }}>🏷️</div>
                                    <div className={styles.aboutCardTitle}>Tags & Interests</div>
                                    <div className={styles.aboutTagsRow}>
                                        {club.tags.map(tag => (
                                            <span key={tag} className={styles.aboutTag}>{tag}</span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Meeting schedule */}
                            {club.meetSchedule && (
                                <div className={styles.aboutCard}>
                                    <div className={styles.aboutCardIcon} style={{ background: 'linear-gradient(135deg, #f59e0b, #ef4444)' }}>📍</div>
                                    <div className={styles.aboutCardTitle}>Meeting Schedule</div>
                                    <div className={styles.aboutCardText}>{club.meetSchedule}</div>
                                </div>
                            )}

                            {/* Upcoming event */}
                            {club.upcomingEvent && (
                                <div className={styles.aboutCard}>
                                    <div className={styles.aboutCardIcon} style={{ background: 'linear-gradient(135deg, #10b981, #dc2626)' }}>📅</div>
                                    <div className={styles.aboutCardTitle}>Upcoming Event</div>
                                    <div className={styles.aboutCardText}>{club.upcomingEvent}</div>
                                </div>
                            )}

                            {/* Join / Links */}
                            {(club.joiningLink || club.discord || club.whatsapp) && (
                                <div className={styles.aboutCard}>
                                    <div className={styles.aboutCardIcon} style={{ background: 'linear-gradient(135deg, #5865f2, #15803d)' }}>🔗</div>
                                    <div className={styles.aboutCardTitle}>Join & Connect</div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 8 }}>
                                        {club.joiningLink && (
                                            <a href={club.joiningLink.startsWith('http') ? club.joiningLink : `https://${club.joiningLink}`}
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
                    <div className={styles.tabContent}>
                        <div className={styles.sectionHeaderRow}>
                            <div>
                                <h2 className={styles.sectionTitle}>📸 Event Memories Gallery</h2>
                                <p className={styles.sectionSubtitle}>Highlights, workshops, and milestones captured by our members.</p>
                            </div>
                            {isMemberOrAdmin && (
                                <button 
                                    className={styles.addPhotoBtn}
                                    onClick={() => setShowAddPhotoModal(true)}
                                >
                                    ✨ Add Memory
                                </button>
                            )}
                        </div>

                        {galleryList.length === 0 ? (
                            <div className={styles.emptyGalleryState}>
                                📷 No photos added yet. Click "Add Memory" to share the first club milestone!
                            </div>
                        ) : (
                            <div className={styles.galleryGrid}>
                                {galleryList.map(item => (
                                    <div key={item.id} className={styles.galleryCard}>
                                        <div className={styles.galleryImgWrapper}>
                                            <img src={item.photoUrl} alt={item.caption || 'Memory'} className={styles.galleryImg} />
                                            <div className={styles.galleryOverlay}>
                                                <span className={styles.galleryEventBadge}>📍 {item.eventName}</span>
                                                {item.caption && <p className={styles.galleryCaptionText}>{item.caption}</p>}
                                                <div className={styles.galleryFooter}>
                                                    <span>By {item.uploadedBy}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* ── REAL-TIME MEMBER CHAT LOUNGE TAB ── */}
                {activeTab === 'chat' && isMemberOrAdmin && (
                    <div className={styles.tabContent}>
                        <div className={styles.chatLoungeWrapper}>
                            <div className={styles.chatLoungeHeader}>
                                <span className={styles.chatLoungeBadge}>🔒 MEMBERS ONLY</span>
                                <h2 className={styles.chatLoungeTitle}>💬 Club Chat Lounge</h2>
                                <p className={styles.chatLoungeSubtitle}>Connect in real-time, collaborate, and chat with team members.</p>
                            </div>

                            <div className={styles.chatMessageStream}>
                                {chatMessages.length === 0 ? (
                                    <div className={styles.emptyChatState}>
                                        💬 This channel is quiet. Be the first to say hello!
                                    </div>
                                ) : (
                                    chatMessages.map(msg => (
                                        <div key={msg.id} className={`${styles.chatMsgRow} ${msg.senderId === user?.uid ? styles.chatMsgSelf : ''}`}>
                                            <div className={styles.chatMsgAvatar}>
                                                {msg.senderName.charAt(0).toUpperCase()}
                                            </div>
                                            <div className={styles.chatMsgContentBlock}>
                                                <div className={styles.chatMsgHeader}>
                                                    <span className={styles.chatMsgSender}>{msg.senderName}</span>
                                                    {msg.senderRole && (
                                                        <span className={`${styles.chatMsgRoleTag} ${msg.senderRole === 'Admin' ? styles.roleAdmin : styles.roleMember}`}>
                                                            {msg.senderRole === 'Admin' ? '⭐ Admin' : msg.senderRole}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className={styles.chatMsgText}>{msg.messageText}</div>
                                                
                                                {/* Emojis reactions row */}
                                                <div className={styles.chatMsgReactions}>
                                                    {['👍', '❤️', '🔥', '😂'].map(emoji => {
                                                        const userReactedList = msg.reactions?.[emoji] || [];
                                                        const activeReact = userReactedList.includes(user?.uid);
                                                        return (
                                                            <button 
                                                                key={emoji}
                                                                className={`${styles.reactionBtn} ${activeReact ? styles.reactionActive : ''}`}
                                                                onClick={() => handleReactToMessage(msg.id, emoji)}
                                                            >
                                                                {emoji} {userReactedList.length > 0 && userReactedList.length}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>

                            <form onSubmit={handleSendChatMessage} className={styles.chatInputForm}>
                                <input 
                                    type="text" 
                                    className={styles.chatInputField}
                                    placeholder="Type a message to the club..."
                                    value={newChatMessageText}
                                    onChange={(e) => setNewChatMessageText(e.target.value)}
                                    maxLength={400}
                                />
                                <button type="submit" className={styles.chatSendBtn}>
                                    🚀 Send
                                </button>
                            </form>
                        </div>
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
