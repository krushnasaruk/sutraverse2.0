'use client';

import { useState, useEffect } from 'react';
import { useTeacher } from '../layout';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, doc, setDoc } from 'firebase/firestore';
import { getSPPUGrade } from '@/lib/sppuGrading';
import styles from './page.module.css';

const EXAM_TYPES = [
    { id: 'In-Sem', label: 'In-Sem Examination', defaultMax: 30 },
    { id: 'End-Sem', label: 'End-Sem Examination', defaultMax: 70 },
    { id: 'TW', label: 'Term Work (TW)', defaultMax: 25 },
    { id: 'PR', label: 'Practical (PR)', defaultMax: 25 },
    { id: 'OR', label: 'Oral (OR)', defaultMax: 25 },
    { id: 'Assignment', label: 'Assignment', defaultMax: 10 }
];

export default function GradesPage() {
    const { selectedClass, user } = useTeacher();
    const [students, setStudents] = useState([]);
    const [examType, setExamType] = useState('In-Sem');
    const [maxMarks, setMaxMarks] = useState(30);
    const [marks, setMarks] = useState({});
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [status, setStatus] = useState({ text: '', type: '' });

    // When class or examType changes, fetch roster and existing grades
    useEffect(() => {
        if (!selectedClass) return;

        const fetchData = async () => {
            setLoading(true);
            try {
                // 1. Fetch roster
                const rosterQ = query(
                    collection(db, 'roster'), 
                    where('classId', '==', selectedClass.classId),
                    where('role', '==', 'student')
                );
                const rosterSnap = await getDocs(rosterQ);
                const studentList = rosterSnap.docs.map(d => ({ id: d.id, ...d.data() }));
                studentList.sort((a, b) => a.name?.localeCompare(b.name));
                setStudents(studentList);

                // 2. Fetch existing grades for this examType and subject
                const gradesQ = query(
                    collection(db, 'sppuGrades'),
                    where('classId', '==', selectedClass.classId),
                    where('subject', '==', selectedClass.subject),
                    where('examType', '==', examType)
                );
                const gradesSnap = await getDocs(gradesQ);
                
                const existingMarks = {};
                let fetchedMaxMarks = null;

                gradesSnap.forEach(docSnap => {
                    const data = docSnap.data();
                    existingMarks[data.studentEmail] = data.marksObtained;
                    if (!fetchedMaxMarks) fetchedMaxMarks = data.maxMarks;
                });

                setMarks(existingMarks);
                
                // Set max marks: if we fetched existing grades, use that max, else use default
                if (fetchedMaxMarks) {
                    setMaxMarks(fetchedMaxMarks);
                } else {
                    const defaultMax = EXAM_TYPES.find(t => t.id === examType)?.defaultMax || 100;
                    setMaxMarks(defaultMax);
                }

            } catch (err) {
                console.error("Error fetching grading data:", err);
            }
            setLoading(false);
        };

        fetchData();
    }, [selectedClass, examType]);

    const handleExamTypeChange = (e) => {
        const type = e.target.value;
        setExamType(type);
    };

    const handleMarkChange = (email, value) => {
        setMarks(prev => ({ ...prev, [email]: value }));
    };

    const handleSaveGrades = async () => {
        if (!selectedClass) return;
        setSaving(true);
        setStatus({ text: 'Saving grades...', type: '' });
        
        try {
            const batchPromises = [];
            
            for (const student of students) {
                const studentMarks = marks[student.email];
                if (studentMarks === undefined || studentMarks === '') continue; // Skip empty

                const numericMarks = Number(studentMarks);
                
                // Document ID: Class_Subject_ExamType_Email (Sanitized for safety)
                const docId = `${selectedClass.classId}_${selectedClass.subject}_${examType}_${student.email}`.replace(/[\/\s]/g, '_');
                
                const gradeData = {
                    studentEmail: student.email,
                    studentName: student.name || 'Unknown',
                    classId: selectedClass.classId,
                    subject: selectedClass.subject,
                    teacherId: user.uid,
                    teacherName: user.name || '',
                    examType: examType,
                    marksObtained: numericMarks,
                    maxMarks: Number(maxMarks),
                    dateRecorded: new Date().toISOString()
                };

                batchPromises.push(setDoc(doc(db, 'sppuGrades', docId), gradeData));
            }

            if (batchPromises.length === 0) {
                setStatus({ text: 'No marks entered to save.', type: 'error' });
                setSaving(false);
                return;
            }

            await Promise.all(batchPromises);
            setStatus({ text: `Successfully saved grades for ${batchPromises.length} students!`, type: 'success' });
            
            // Clear status after 3 seconds
            setTimeout(() => setStatus({ text: '', type: '' }), 3000);

        } catch (error) {
            console.error("Error saving grades:", error);
            setStatus({ text: 'Failed to save grades. Try again.', type: 'error' });
        }
        
        setSaving(false);
    };

    if (!selectedClass) {
        return (
            <div className={styles.emptyState}>
                <p>Select a class from the sidebar to manage grades.</p>
            </div>
        );
    }

    return (
        <div className={styles.gradesPage}>
            <header className={styles.pageHeader}>
                <h1 className={styles.pageTitle}>SPPU Grade Manager</h1>
                <p className={styles.pageSubtitle}>{selectedClass.classId} — {selectedClass.subject}</p>
            </header>

            <div className={styles.controlsCard}>
                <div className={styles.controlsRow}>
                    <div className={styles.controlGroup}>
                        <label>Exam Type</label>
                        <select className={styles.select} value={examType} onChange={handleExamTypeChange} disabled={saving || loading}>
                            {EXAM_TYPES.map(t => (
                                <option key={t.id} value={t.id}>{t.label}</option>
                            ))}
                        </select>
                    </div>
                    
                    <div className={styles.controlGroup}>
                        <label>Max Marks</label>
                        <input 
                            type="number" 
                            className={styles.input} 
                            value={maxMarks} 
                            onChange={(e) => setMaxMarks(e.target.value)}
                            disabled={saving || loading}
                        />
                    </div>

                    <div style={{ flexGrow: 1 }}></div>

                    <div className={styles.controlGroup} style={{ flex: '0 0 auto', alignItems: 'flex-end' }}>
                        {status.text && (
                            <div className={`${styles.statusMsg} ${status.type === 'error' ? styles.statusError : styles.statusSuccess}`}>
                                {status.text}
                            </div>
                        )}
                        <button 
                            className={styles.btnPrimary} 
                            onClick={handleSaveGrades}
                            disabled={loading || saving || students.length === 0}
                        >
                            {saving ? 'Saving...' : 'Save All Grades'}
                        </button>
                    </div>
                </div>
            </div>

            <div className={styles.tableCard}>
                <div className={styles.tableHeader}>
                    <h3 className={styles.tableTitle}>Class Roster ({students.length} Students)</h3>
                </div>
                
                {loading ? (
                    <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading roster...</div>
                ) : students.length === 0 ? (
                    <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>No students found in this class.</div>
                ) : (
                    <div className={styles.tableWrapper}>
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    <th>Student</th>
                                    <th style={{ width: '200px' }}>Marks Obtained</th>
                                    <th>SPPU Grade (Est.)</th>
                                </tr>
                            </thead>
                            <tbody>
                                {students.map(student => {
                                    const val = marks[student.email] || '';
                                    const numVal = Number(val);
                                    let gradeInfo = null;
                                    
                                    if (val !== '' && !isNaN(numVal)) {
                                        gradeInfo = getSPPUGrade(numVal, Number(maxMarks));
                                    }

                                    return (
                                        <tr key={student.email}>
                                            <td>
                                                <div className={styles.studentInfo}>
                                                    <span className={styles.studentName}>{student.name || 'Unknown'}</span>
                                                    <span className={styles.studentEmail}>{student.email}</span>
                                                </div>
                                            </td>
                                            <td>
                                                <div className={styles.markInputWrapper}>
                                                    <input 
                                                        type="number" 
                                                        className={styles.markInput}
                                                        value={val}
                                                        onChange={(e) => handleMarkChange(student.email, e.target.value)}
                                                        min={0}
                                                        max={maxMarks}
                                                        placeholder="-"
                                                    />
                                                    <span className={styles.markMax}>/ {maxMarks}</span>
                                                </div>
                                            </td>
                                            <td>
                                                {gradeInfo ? (
                                                    <span style={{ color: gradeInfo.color, fontWeight: 'bold' }}>
                                                        {gradeInfo.grade} ({gradeInfo.points} pts)
                                                    </span>
                                                ) : (
                                                    <span style={{ color: 'var(--text-muted)' }}>-</span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
