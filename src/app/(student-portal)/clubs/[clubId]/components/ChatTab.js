'use client';

import styles from '../page.module.css';

export default function ChatTab({
    isMemberOrAdmin,
    chatMessages,
    user,
    handleReactToMessage,
    handleSendChatMessage,
    newChatMessageText,
    setNewChatMessageText
}) {
    if (!isMemberOrAdmin) return null;

    return (
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
    );
}
