import axios from 'axios';
window.axios = axios;

// Set default headers
axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';
axios.defaults.withCredentials = true;
axios.defaults.withXSRFToken = true;

// Set up CSRF token for axios
const token = document.head.querySelector('meta[name="csrf-token"]');
if (token) {
    axios.defaults.headers.common['X-CSRF-TOKEN'] = (token as HTMLMetaElement).content;
} else {
    console.error('CSRF token not found');
}

// Refresh CSRF token on 419 error
axios.interceptors.response.use(
    (response) => response,
    async (error) => {
        if (error.response?.status === 419) {
            // CSRF token expired, reload the page to get a new token
            console.warn('CSRF token expired, reloading page...');
            window.location.reload();
            return Promise.reject(error);
        }
        return Promise.reject(error);
    }
);
