'use client';

import { useEffect, useRef } from 'react';

/**
 * ScrollReveal — Device-aware: nice fade+slide on desktop, instant on mobile.
 */
export function ScrollReveal({ children, delay = 0, className = '', style = {} }) {
    const ref = useRef(null);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;

        // Skip animation on mobile or reduced-motion
        const isMobile = window.innerWidth <= 768;
        const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        if (isMobile || prefersReduced) {
            el.style.opacity = '1';
            el.style.transform = 'none';
            return;
        }

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    el.style.opacity = '1';
                    el.style.transform = 'translateY(0)';
                    observer.unobserve(el);
                }
            },
            { threshold: 0.1 }
        );

        observer.observe(el);
        return () => observer.disconnect();
    }, []);

    return (
        <div
            ref={ref}
            className={className}
            style={{
                opacity: 0,
                transform: 'translateY(12px)',
                transition: `opacity 0.4s ease ${delay}ms, transform 0.4s ease ${delay}ms`,
                willChange: 'auto',
                ...style
            }}
        >
            {children}
        </div>
    );
}

/**
 * TextReveal — Renders text directly (no stagger animation).
 */
export function TextReveal({ text, className = '', tag: Tag = 'span' }) {
    return <Tag className={className}>{text}</Tag>;
}

/**
 * CountUp — Shows number directly on mobile, animates on desktop.
 */
export function CountUp({ end, duration = 1200, suffix = '', className = '' }) {
    const ref = useRef(null);
    const counted = useRef(false);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;

        const isMobile = window.innerWidth <= 768;
        if (isMobile) {
            el.textContent = end + suffix;
            return;
        }

        counted.current = false;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting && !counted.current) {
                    counted.current = true;
                    animateCount();
                    observer.unobserve(el);
                }
            },
            { threshold: 0.5 }
        );

        const animateCount = () => {
            const numericEnd = parseInt(end.toString().replace(/[^0-9]/g, ''));
            const startTime = performance.now();

            const tick = (now) => {
                const elapsed = now - startTime;
                const progress = Math.min(elapsed / duration, 1);
                const eased = 1 - Math.pow(1 - progress, 3);
                const current = Math.round(numericEnd * eased);

                if (el) {
                    el.textContent = current.toLocaleString() + suffix;
                }

                if (progress < 1) {
                    requestAnimationFrame(tick);
                }
            };

            requestAnimationFrame(tick);
        };

        observer.observe(el);
        return () => observer.disconnect();
    }, [end, duration, suffix]);

    return <span ref={ref} className={className}>0{suffix}</span>;
}
