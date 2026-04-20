import '../css/app.css';
import './bootstrap';

import { createInertiaApp, router } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot } from 'react-dom/client';

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

// Handle global Inertia errors (419 session expired, 500 server errors)
router.on('invalid', (event) => {
    const status = event.detail.response.status;

    if (status === 419) {
        // Session expired / CSRF mismatch — prevent Inertia's default modal
        event.preventDefault();

        // Show user-friendly message instead of "Page Expired"
        const confirmed = window.confirm(
            'Your session has expired. Click OK to refresh the page.\n\nDon\'t worry — if you were editing a quotation, your data has been auto-saved and will be restored.'
        );
        if (confirmed) {
            window.location.reload();
        }
    }
});

createInertiaApp({
    title: (title) => `${title} - ${appName}`,
    resolve: (name) =>
        resolvePageComponent(
            `./Pages/${name}.tsx`,
            import.meta.glob('./Pages/**/*.tsx'),
        ),
    setup({ el, App, props }) {
        const root = createRoot(el);

        root.render(<App {...props} />);
    },
    progress: {
        color: '#7c3aed',
        showSpinner: true,
    },
});
