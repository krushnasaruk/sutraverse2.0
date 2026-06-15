'use client';

import Webcam from 'react-webcam';
import styles from '../page.module.css';

export default function BioScannerModal({
    showScanner,
    setShowScanner,
    webcamRef,
    scanStatus,
    handleFacialScanAndGeo
}) {
    if (!showScanner) return null;

    return (
        <div className={styles.modalOverlay}>
            <div className={`${styles.modalContent} ${styles.scannerModal} glass-panel`}>
                <h2>Bio-Metric Check-In</h2>
                <p style={{marginBottom: '16px', color: 'var(--text-secondary)'}}>Scanning face and triangulating coordinates...</p>

                <div className={styles.webcamWrapper}>
                    <Webcam
                        audio={false}
                        ref={webcamRef}
                        screenshotFormat="image/jpeg"
                        videoConstraints={{ facingMode: "user" }}
                        className={styles.webcamVideo}
                    />
                    <div className={styles.scannerLine}></div>
                </div>

                <div className={styles.scanStatusBox}>
                    {scanStatus === '' && <p>Align face in frame, allow location access, and hold still.</p>}
                    {scanStatus === 'verifying' && <p style={{color: 'var(--warning)'}}>Verifying ML Identity and GPS Math...</p>}
                    {scanStatus === 'success' && <p style={{color: 'var(--success)', fontWeight:'bold'}}>✅ Verified! Lightning Check-In Complete.</p>}
                    {scanStatus.startsWith('loading') && <p style={{color: 'var(--neo)'}}>Downloading Deep Learning weights...</p>}
                    {scanStatus.startsWith('error') && <p style={{color: 'var(--error)'}}>❌ {scanStatus.split('error: ')[1]}</p>}
                </div>

                <div className={styles.modalActions}>
                    <button className={styles.cancelBtn} onClick={() => setShowScanner(false)}>Cancel</button>
                    <button
                        className={styles.saveBtn}
                        onClick={handleFacialScanAndGeo}
                        disabled={scanStatus === 'verifying' || scanStatus === 'success'}
                        style={{ background: 'var(--neo)', color: '#000', fontWeight: '800' }}
                    >
                        {scanStatus === 'verifying' ? 'Extracting Bio-Data...' : 'Extract Bio-Data'}
                    </button>
                </div>
            </div>
        </div>
    );
}
