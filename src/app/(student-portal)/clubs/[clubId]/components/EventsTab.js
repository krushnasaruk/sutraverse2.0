'use client';

import styles from '../page.module.css';

export default function EventsTab({
    isAdmin,
    eventsList,
    setShowAddEventModal,
    user,
    handleRSVPEvent,
    showAddEventModal,
    handleCreateEvent,
    newEventTitle,
    setNewEventTitle,
    newEventDesc,
    setNewEventDesc,
    newEventDate,
    setNewEventDate,
    newEventTime,
    setNewEventTime,
    newEventVenue,
    setNewEventVenue,
    newEventGradient,
    setNewEventGradient,
    submittingEvent
}) {
    return (
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
                        const eventDate = evt.date?.toDate ? evt.date.toDate() : new Date(evt.date);

                        const eventTimeStr = eventDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

                        // Google Calendar link builder
                        const gCalStart = eventDate.toISOString().replace(/-|:|\.\d\d\d/g, "");
                        const endD = new Date(eventDate.getTime() + 2 * 60 * 60 * 1000); // assume 2 hours duration
                        const gCalEnd = endD.toISOString().replace(/-|:|\.\d\d\d/g, "");
                        const gCalUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(evt.title)}&dates=${gCalStart}/${gCalEnd}&details=${encodeURIComponent(evt.description)}&location=${encodeURIComponent(evt.venue)}`;

                        return (
                            <div key={evt.id} className={styles.eventTimelineCard} style={{ animationDelay: `${i * 80}ms` }}>
                                <div className={styles.eventLeftBar} style={{ background: evt.coverGradient || 'var(--gradient-brand)' }}>
                                    <span className={styles.eventLeftDate}>{eventDate.getDate()}</span>
                                    <span className={styles.eventLeftMonth}>{eventDate.toLocaleDateString('en-US', { month: 'short' })}</span>
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
                                <label className={styles.label}>Venue</label>
                                <input
                                    type="text"
                                    className={styles.input}
                                    required
                                    placeholder="e.g. Auditorium / Google Meet"
                                    value={newEventVenue}
                                    onChange={e => setNewEventVenue(e.target.value)}
                                />
                            </div>
                            <div className={styles.modalActions}>
                                <button type="submit" className={styles.saveBrandingBtn} disabled={submittingEvent}>
                                    {submittingEvent ? 'Scheduling...' : 'Create Event'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
