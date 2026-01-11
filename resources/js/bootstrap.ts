import axios from 'axios';
window.axios = axios;

window.axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';

// Set up CSRF token for axios
const token = document.head.querySelector('meta[name="csrf-token"]');
if (token) {
    window.axios.defaults.headers.common['X-CSRF-TOKEN'] = (token as HTMLMetaElement).content;
} else {
    console.error('CSRF token not found');
}

// Also read from Laravel's XSRF-TOKEN cookie (for Sanctum)
window.axios.defaults.withCredentials = true;
window.axios.defaults.withXSRFToken = true;
