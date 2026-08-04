'use client';

import { Skeleton } from '@/frontend/components/ui/Skeleton/Skeleton';
import styles from '../page.module.css';

export default function ClassroomTab({
    user,
    activeLiveSession,
    hasCheckedIn,
    triggerQRScan,
    triggerVerification,
    sppuSummary,
    currentSGPA,
    monthlyReports,
    deadlines,
    now,
    formatCountdown,
    mySubmissions,
    submittingAssignment,
    submissionProgress,
    handleAssignmentSubmit,
    setSubmissionFile,
    mcqTests,
    myMcqSubmissions,
    attendanceStats,
    ringColor,
    currentStreak,
    attendanceHistory,
    setLeaveModalOpen,
    myLeaveRequests,
    announcements,
    loadingClassData
}) {
    return (
        <div className={styles.tabClassroomLayout}>
            {/* CLASS HUB TILE */}
            <div className={`${styles.bentoTile} ${styles.classHubTile} glass-panel`}>
                <div className={styles.hubHeader}>
                    <div>
                        <h2 className={styles.sectionTitle} style={{margin:0}}>Class Hub</h2>
                        <p style={{color:'var(--text-secondary)', fontSize:'0.9rem'}}>{user.classId} Dashboard</p>
                    </div>
                </div>

                <div className={styles.hubGrid}>
                    {loadingClassData ? <>
                            <div style={{ gridColumn: '1 / -1' }}>
                                <Skeleton width="100%" height="200px" borderRadius="16px" />
                            </div>
                            <div style={{ gridColumn: '1 / -1' }}>
                                <Skeleton width="100%" height="300px" borderRadius="16px" />
                            </div>
                        </>
                     : <>
                            {activeLiveSession && (
                                <div className={styles.liveSessionBanner} style={{ gridColumn: '1 / -1' }}>
                            <div className={styles.livePulseGeo}></div>
                            <div>
                                <h3 style={{margin:0, color:'var(--neo)'}}>Live Radar Check-In Active</h3>
                                <p style={{margin:0, fontSize:'0.85rem', opacity:0.8}}>Teacher is broadcasting within 15m.</p>
                            </div>
                            {hasCheckedIn ? (
                                <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--success)', fontWeight: 'bold' }}>
                                    ✅ Secured
                                </div>
                            ) : (
                                <div style={{ marginLeft: 'auto', display: 'flex', gap: '12px' }}>
                                    <button onClick={triggerQRScan} className={styles.btnSecondary} style={{padding: '8px 16px', background: 'transparent', border: '1px solid var(--primary)', color: 'var(--primary)'}}>📷 Scan QR</button>
                                    <button onClick={triggerVerification} className={styles.btnVerifyGeo}>Bio-Verify</button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* SPPU GRADES MARKSHEET */}
                    {sppuSummary.length > 0 && (
                        <div style={{gridColumn: '1 / -1', marginTop: '16px'}}>
                            <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-end', marginBottom:'12px'}}>
                                <h3 className={styles.sectionTitle} style={{fontSize:'1.1rem', color:'var(--primary-light)', margin:0}}>🎓 SPPU Grade Card</h3>
                                <div style={{background:'rgba(59, 130, 246, 0.1)', border:'1px solid var(--primary)', padding:'6px 12px', borderRadius:'8px', color:'var(--primary-light)', fontWeight:'bold'}}>
                                    Estimated SGPA: {currentSGPA.toFixed(2)}
                                </div>
                            </div>
                            <div style={{overflowX: 'auto'}}>
                                <table style={{width:'100%', minWidth:'600px', borderCollapse:'collapse', background:'rgba(30, 30, 40, 0.4)', borderRadius:'8px', overflow:'hidden', border:'1px solid var(--border)'}}>
                                    <thead>
                                        <tr style={{background:'rgba(0,0,0,0.3)', borderBottom:'1px solid var(--border)', textAlign:'left'}}>
                                            <th style={{padding:'12px 16px', color:'var(--text-secondary)', fontWeight:600}}>Subject</th>
                                            <th style={{padding:'12px 16px', color:'var(--text-secondary)', fontWeight:600}}>Breakdown</th>
                                            <th style={{padding:'12px 16px', color:'var(--text-secondary)', fontWeight:600}}>Total</th>
                                            <th style={{padding:'12px 16px', color:'var(--text-secondary)', fontWeight:600}}>Grade</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {sppuSummary.map((sub, idx) => (
                                            <tr key={idx} style={{borderBottom:'1px solid rgba(255,255,255,0.05)'}}>
                                                <td style={{padding:'16px', fontWeight:'bold', color:'#fff'}}>{sub.subject}</td>
                                                <td style={{padding:'16px'}}>
                                                    <div style={{display:'flex', gap:'8px', flexWrap:'wrap'}}>
                                                        {sub.components.map((comp, cIdx) => (
                                                            <span key={cIdx} style={{background:'rgba(0,0,0,0.3)', padding:'4px 8px', borderRadius:'4px', fontSize:'0.8rem', border:'1px solid rgba(255,255,255,0.1)'}}>
                                                                <span style={{color:'var(--text-secondary)'}}>{comp.type}:</span> {comp.obtained}/{comp.max}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </td>
                                                <td style={{padding:'16px'}}>
                                                    {sub.totalObtained} / {sub.totalMax}
                                                </td>
                                                <td style={{padding:'16px'}}>
                                                    <div style={{display:'inline-flex', alignItems:'center', justifyContent:'center', width:'36px', height:'36px', borderRadius:'8px', background:`${sub.gradeInfo.color}22`, color:sub.gradeInfo.color, fontWeight:'bold', border:`1px solid ${sub.gradeInfo.color}55`}}>
                                                        {sub.gradeInfo.grade}
                                                    </div>
                                                    <span style={{marginLeft:'8px', fontSize:'0.85rem', color:'var(--text-secondary)'}}>{sub.gradeInfo.points} pts</span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* OFFICIAL MONTHLY REPORTS */}
                    {monthlyReports.length > 0 && (
                        <div style={{gridColumn: '1 / -1', marginTop: '16px'}}>
                            <h3 className={styles.sectionTitle} style={{fontSize:'1rem', color:'var(--text-secondary)', marginBottom: '12px'}}>📜 Official Grade Reports</h3>
                            <div style={{display:'flex', gap:'16px', overflowX:'auto', paddingBottom:'8px'}}>
                                {monthlyReports.map(report => {
                                    const myStats = report.studentStats[user.email];
                                    if (!myStats) return null;

                                    return (
                                        <div key={report.id} style={{minWidth:'200px', background:'rgba(0,0,0,0.3)', border:'1px solid var(--border-color)', borderRadius:'12px', padding:'16px'}}>
                                            <h4 style={{margin:0, color:'var(--primary)'}}>{report.month}</h4>
                                            <p style={{margin:'4px 0 12px', fontSize:'0.8rem', color:'var(--text-secondary)'}}>Published by {report.teacherName}</p>

                                            <div style={{display:'flex', alignItems:'flex-end', gap:'8px'}}>
                                                <span style={{fontSize:'2rem', fontWeight:'900', color: myStats.percentage >= 75 ? 'var(--success)' : myStats.percentage >= 50 ? 'var(--warning)' : 'var(--error)'}}>{myStats.percentage}%</span>
                                                <span style={{fontSize:'0.8rem', color:'var(--text-secondary)', marginBottom:'6px'}}>Attendance</span>
                                            </div>
                                            <div style={{fontSize:'0.8rem', color:'var(--text-secondary)', marginTop:'8px'}}>
                                                Present: {myStats.present}/{myStats.totalClasses}
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    )}

                    {/* ACADEMIC DEADLINES WIDGET */}
                    {deadlines.length > 0 && (
                        <div style={{gridColumn: '1 / -1', marginTop: '16px'}}>
                            <h3 className={styles.sectionTitle} style={{fontSize:'1rem', color:'var(--text-secondary)', marginBottom: '12px'}}>📅 Urgent Deadlines & Missions</h3>
                            <div style={{display:'flex', gap:'16px', overflowX:'auto', paddingBottom:'8px'}}>
                                {deadlines.map(d => {
                                    const diff = new Date(d.dueDate) - now;
                                    const isCritical = diff < (1000 * 60 * 60 * 24);

                                    return (
                                        <div key={d.id} className="glass-panel" style={{
                                            minWidth: '280px',
                                            padding: '16px',
                                            borderLeft: isCritical ? '4px solid var(--error)' : '4px solid var(--warning)'
                                        }}>
                                            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start'}}>
                                                <h4 style={{margin:0, color:'var(--primary-light)', fontSize: '1.1rem'}}>{d.title}</h4>
                                                <div style={{
                                                    background: isCritical ? 'rgba(255,0,0,0.1)' : 'rgba(255, 165, 0, 0.1)',
                                                    color: isCritical ? 'var(--error)' : 'var(--warning)',
                                                    padding: '4px 8px', borderRadius: '4px', fontSize: '0.85rem', fontWeight: 'bold'
                                                }}>
                                                    {formatCountdown(d.dueDate)}
                                                </div>
                                            </div>
                                            <p style={{margin:'8px 0', fontSize:'0.9rem', color:'var(--text-secondary)'}}>{d.description}</p>
                                            <div style={{fontSize:'0.8rem', color:'var(--text-secondary)', marginTop:'12px', borderTop: '1px solid var(--border)', paddingTop: '8px'}}>
                                                Due limit: {new Date(d.dueDate).toLocaleString()}
                                            </div>
                                            {d.maxMarks && (
                                                <div style={{marginTop: '12px', paddingTop: '12px', borderTop: '1px solid var(--border)'}}>
                                                    <h5 style={{margin: '0 0 8px 0'}}>Assignment (Max {d.maxMarks})</h5>
                                                    {(() => {
                                                        const mySub = mySubmissions.find(s => s.deadlineId === d.id);
                                                        if (mySub) {
                                                            if (mySub.marks !== undefined) {
                                                                return <div style={{color: 'var(--success)', fontWeight:'bold'}}>✨ Graded: {mySub.marks} / {d.maxMarks}</div>;
                                                            }
                                                            return <div style={{color: 'var(--primary)', fontSize:'0.9rem'}}>✅ Submitted. Pending grading.</div>;
                                                        }
                                                        if (diff < 0) {
                                                            return <div style={{color: 'var(--error)'}}>Deadline Missed</div>;
                                                        }
                                                        if (submittingAssignment === d.id) {
                                                            return <div style={{fontSize:'0.85rem'}}>Uploading: {submissionProgress}%</div>;
                                                        }
                                                        return (
                                                            <form onSubmit={(e) => handleAssignmentSubmit(e, d)} style={{display: 'flex', flexDirection:'column', gap: '8px'}}>
                                                                <input type="file" onChange={(e) => setSubmissionFile(e.target.files[0])} accept=".pdf,.doc,.docx,.zip,.png,.jpg" style={{fontSize: '0.8rem'}} required />
                                                                <button type="submit" className={styles.saveBtn} style={{padding: '4px 8px', fontSize: '0.8rem', width: 'fit-content'}}>Submit File</button>
                                                            </form>
                                                        );
                                                    })()}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* MCQ TESTS WIDGET */}
                    {mcqTests.length > 0 && (
                        <div style={{gridColumn: '1 / -1', marginTop: '16px'}}>
                            <h3 className={styles.sectionTitle} style={{fontSize:'1rem', color:'var(--text-secondary)', marginBottom: '12px'}}>📝 MCQ Tests</h3>
                            <div style={{display:'flex', gap:'16px', overflowX:'auto', paddingBottom:'8px'}}>
                                {mcqTests.map(test => {
                                    const mySub = myMcqSubmissions.find(s => s.testId === test.id);
                                    const diff = new Date(test.dueDate) - now;
                                    const isCritical = diff < (1000 * 60 * 60 * 24);

                                    return (
                                        <div key={test.id} className="glass-panel" style={{
                                            minWidth: '280px',
                                            padding: '16px',
                                            borderLeft: mySub ? '4px solid #22c55e' : isCritical ? '4px solid #ef4444' : '4px solid #3b82f6'
                                        }}>
                                            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start'}}>
                                                <h4 style={{margin:0, color:'#f8fafc', fontSize: '1.1rem'}}>{test.title}</h4>
                                                <div style={{
                                                    background: isCritical ? 'rgba(239,68,68,0.15)' : 'rgba(59,130,246,0.15)',
                                                    color: isCritical ? '#ef4444' : '#3b82f6',
                                                    padding: '4px 8px', borderRadius: '4px', fontSize: '0.85rem', fontWeight: 'bold'
                                                }}>
                                                    {formatCountdown(test.dueDate)}
                                                </div>
                                            </div>
                                            <p style={{margin:'8px 0', fontSize:'0.9rem', color:'#94a3b8'}}>{test.questions?.length} Questions</p>
                                            <div style={{fontSize:'0.8rem', color:'#64748b', borderTop: '1px solid var(--border)', paddingTop: '8px', marginTop: '8px'}}>
                                                Due: {new Date(test.dueDate).toLocaleString()}
                                            </div>
                                            <div style={{marginTop: '12px'}}>
                                                {mySub ? (
                                                    <div style={{color: '#22c55e', fontWeight:'bold', fontSize: '1rem'}}>
                                                        ✅ Score: {mySub.score} / {mySub.totalQuestions}
                                                    </div>
                                                ) : diff < 0 ? (
                                                    <div style={{color: '#ef4444'}}>Test Expired</div>
                                                ) : (
                                                    <a href={`/dashboard/mcq/${test.id}`} style={{
                                                        display: 'inline-block',
                                                        background: '#3b82f6',
                                                        color: '#fff',
                                                        padding: '8px 16px',
                                                        borderRadius: '6px',
                                                        textDecoration: 'none',
                                                        fontSize: '0.9rem',
                                                        fontWeight: 600
                                                    }}>Start Test →</a>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Attendance Ring */}
                    <div className={styles.attendanceBox}>
                        <h3>Live Attendance</h3>
                        <div className={styles.ringWrapper}>
                            <svg viewBox="0 0 36 36" className={styles.circularChart}>
                                <path className={styles.circleBg}
                                    d="M18 2.0845
                                    a 15.9155 15.9155 0 0 1 0 31.831
                                    a 15.9155 15.9155 0 0 1 0 -31.831"
                                />
                                {attendanceStats.total > 0 && (
                                    <path className={styles.circleFill}
                                        strokeDasharray={`${attendanceStats.percentage}, 100`}
                                        style={{ stroke: ringColor }}
                                        d="M18 2.0845
                                        a 15.9155 15.9155 0 0 1 0 31.831
                                        a 15.9155 15.9155 0 0 1 0 -31.831"
                                    />
                                )}
                            </svg>
                            <div className={styles.ringText}>
                                <span className={styles.ringPercent}>{attendanceStats.percentage}%</span>
                            </div>
                        </div>
                        <div className={styles.attStatsRow}>
                            <div className={styles.attStat}><span style={{color:'var(--success)'}}>P:</span> {attendanceStats.present}</div>
                            <div className={styles.attStat}><span style={{color:'var(--error)'}}>A:</span> {attendanceStats.absent}</div>
                            <div className={styles.attStat}><span style={{color:'var(--warning)'}}>L:</span> {attendanceStats.late}</div>
                            <div className={styles.attStat}><span style={{color:'var(--primary-light)'}}>E:</span> {attendanceStats.excused}</div>
                        </div>

                        {/* Timeline & Streak Module */}
                        <div className={styles.streakModule}>
                            <div className={styles.streakBadge}>
                                🔥 {currentStreak} Day Streak
                            </div>
                            {attendanceHistory.length > 0 && (
                                <div className={styles.timeline}>
                                    {attendanceHistory.slice().reverse().map((rec, i) => (
                                        <div
                                            key={i}
                                            className={`${styles.timelineDot} ${styles[`dot_${rec.status}`]}`}
                                            title={`${rec.date}: ${rec.status}`}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>

                        {attendanceStats.percentage < 75 && attendanceStats.total > 0 && (
                            <p className={styles.attWarning}>⚠️ Warning: Attendance is below 75%.</p>
                        )}

                        <button className={styles.btnSecondary} onClick={() => setLeaveModalOpen(true)} style={{ width: '100%', marginTop: '16px' }}>
                            ✉️ Request Leave
                        </button>
                    </div>

                    {/* Inbox & Announcements Box */}
                    <div className={styles.announcementsBox}>
                        <div className={styles.boxTabsContainer}>
                            <h3>Class Updates</h3>
                        </div>

                        <div className={styles.announcementList}>
                            {myLeaveRequests.length > 0 && (
                                <div className={styles.leaveRequestsList}>
                                    {myLeaveRequests.map(req => (
                                        <div key={req.id} className={`${styles.announcementCard} ${styles[`request_${req.status}`]}`}>
                                            <div className={styles.annMeta}>
                                                <span className={styles.annTeacher}>Leave Request ({req.date})</span>
                                                <span className={`${styles.statusPill} ${styles[`pill_${req.status}`]}`}>
                                                    {req.status}
                                                </span>
                                            </div>
                                            <p className={styles.annMessage}>{req.reason}</p>
                                        </div>
                                    ))}
                                </div>
                            )}
                            {announcements.length > 0 ? announcements.map(ann => (
                                <div key={ann.id} className={styles.announcementCard}>
                                    <div className={styles.annMeta}>
                                        <span className={styles.annTeacher}>{ann.teacherName}</span>
                                        <span className={styles.annDate}>
                                            {new Date(ann.timestamp).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <p className={styles.annMessage}>{ann.message}</p>
                                </div>
                            )) : (
                                <div className={styles.emptyAnnouncements}>No announcements yet.</div>
                            )}
                        </div>
                    </div>
                </>
            }
                </div>
            </div>
        </div>
    );
}
