import React, { useEffect, useCallback, Fragment } from 'react';

export default function Modal({ children, show = false, maxWidth = '2xl', closeable = true, onClose = () => {} }) {
    // Prevent background scroll when modal is open
    useEffect(() => {
        if (show) {
            document.body.classList.add('overflow-hidden');
        } else {
            document.body.classList.remove('overflow-hidden');
        }
        return () => {
            document.body.classList.remove('overflow-hidden');
        };
    }, [show]);

    // Handle Escape key to close modal
    const handleKeyDown = useCallback(
        (e) => {
            if (e.key === 'Escape' && closeable && show) {
                onClose();
            }
        },
        [closeable, show, onClose]
    );

    useEffect(() => {
        if (show) {
            window.addEventListener('keydown', handleKeyDown);
        } else {
            window.removeEventListener('keydown', handleKeyDown);
        }
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [show, handleKeyDown]);

    if (!show) return null;

    const maxWidthClass = {
        sm: 'sm:max-w-sm',
        md: 'sm:max-w-md',
        lg: 'sm:max-w-lg',
        xl: 'sm:max-w-xl',
        '2xl': 'sm:max-w-2xl',
    }[maxWidth];

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center">
            {/* Overlay */}
            <div
                className="fixed inset-0 bg-gray-500/75 dark:bg-gray-900/75 transition-opacity"
                onClick={closeable ? onClose : undefined}
                aria-hidden="true"
            />
            {/* Modal content */}
            <div
                className={`relative bg-white dark:bg-gray-800 rounded-lg shadow-xl overflow-hidden w-full ${maxWidthClass}`}
                style={{ zIndex: 10000 }}
                role="dialog"
                aria-modal="true"
            >
                {children}
            </div>
        </div>
    );
}