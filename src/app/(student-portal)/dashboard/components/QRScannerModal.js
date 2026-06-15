'use client';

import Webcam from 'react-webcam';
import styles from '../page.module.css';

export default function QRScannerModal({
    showQRScanner,
    setShowQRScanner,
    webcamRef,
    qrStatus
}) {
    if (!showQRScanner) return null;

    return (
        <div className={styles.modalOverlay}>
            <div className={`${styles.modalContent} ${styles.scannerModal} glass-panel`}>
                <h2>Scan Teacher's QR</h2>
                <p style={{marginBottom: '16px', color: 'var(--text-secondary)'}}>Point your camera at the dynamic QR code on the board.</p>

                <div className={styles.webcamWrapper}>
                    <Webcam
                        audio={false}
                        ref={webcamRef}
                        screenshotFormat="image/jpeg"
                        videoConstraints={{ facingMode: "environment" }}
                        className={styles.webcamVideo}
                    />
                    {qrStatus === 'scanning' && <div className={styles.scannerLine}></div>}
                </div>

                <div className={styles.scanStatusBox}>
                    {qrStatus === 'scanning' && <p style={{color: 'var(--primary-light)'}}>Locating QR Code...</p>}
                    {qrStatus === 'success' && <p style={{color: 'var(--success)', fontWeight:'bold'}}>✅ QR Verified! Checked In.</p>}
                    {qrStatus.startsWith('error') && <p style={{color: 'var(--error)'}}>❌ {qrStatus.split('error: ')[1]}</p>}
                </div>

                <div className={styles.modalActions}>
                    <button className={styles.cancelBtn} onClick={() => setShowQRScanner(false)} style={{width: '100%'}}>Cancel</button>
                </div>
            </div>
        </div>
    );
}
