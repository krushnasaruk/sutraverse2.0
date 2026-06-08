'use client';

import { useCollege } from '@/context/CollegeContext';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import styles from './MaintenanceGuard.module.css';

export default function MaintenanceGuard({ children }) {
    const { branding, loaded } = useCollege();
    const { user } = useAuth();

    if (!loaded) {
        return null;
    }

    const isAdmin = user && (user.isAdmin || ['sutraverse11@gmail.com'].includes(user.email));
    const isMaintenance = branding?.maintenanceMode;

    if (isMaintenance && !isAdmin) {
        return (
            <div className={styles.container}>
                <div className={styles.card}>
                    <div className={styles.icon}>⚙️</div>
                    <h1 className={styles.title}>System Maintenance</h1>
                    <p className={styles.message}>
                        {branding.maintenanceMessage || 'We are performing scheduled updates and will be back online shortly.'}
                    </p>
                    <div className={styles.divider} />
                    <div className={styles.footer}>
                        {user ? (
                            <span className={styles.signedIn}>Signed in as: <strong>{user.email}</strong> (Non-Admin)</span>
                        ) : (
                            <Link href="/login" className={styles.adminLink}>
                                Admin Sign In
                            </Link>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    return children;
}
