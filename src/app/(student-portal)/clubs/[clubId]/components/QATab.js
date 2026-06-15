'use client';

import Link from 'next/link';
import styles from '../page.module.css';

export default function QATab({
    user,
    newQuestion,
    setNewQuestion,
    handlePostQuestion,
    submittingQA,
    qaList,
    handleUpvoteQuestion,
    newReply,
    setNewReply,
    handlePostReply,
    formatDate,
    club
}) {
    return (
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
                                            {qa.replies.map((reply, rIdx) => {
                                                const isReplyAdmin = reply.authorRole === 'Admin';
                                                return (
                                                    <div key={rIdx} className={`${styles.qaReplyItem} ${isReplyAdmin ? styles.qaReplyAdmin : ''}`}>
                                                        <div className={styles.qaReplyHeader}>
                                                            <span className={styles.qaReplyAuthor}>
                                                                {reply.authorName}
                                                                {isReplyAdmin && <span className={styles.adminBadge}>Admin</span>}
                                                            </span>
                                                            <span className={styles.qaReplyTime}>{formatDate(reply.createdAt)}</span>
                                                        </div>
                                                        <div className={styles.qaReplyText}>{reply.text}</div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}

                                    {/* Reply Input */}
                                    {user && (
                                        <div className={styles.qaReplyInputBox}>
                                            <input
                                                type="text"
                                                className={styles.qaReplyInput}
                                                placeholder="Write a reply..."
                                                value={newReply[qa.id] || ''}
                                                onChange={e => setNewReply({...newReply, [qa.id]: e.target.value})}
                                                onKeyDown={e => e.key === 'Enter' && handlePostReply(qa.id)}
                                            />
                                            <button
                                                className={styles.qaReplyBtn}
                                                onClick={() => handlePostReply(qa.id)}
                                                disabled={!newReply[qa.id]?.trim()}
                                            >
                                                Reply
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
    );
}
