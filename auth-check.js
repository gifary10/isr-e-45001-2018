// auth-check.js - Prevent access to index.html before login

// Check authentication status
function checkAuth() {
    // Check if user is authenticated (you can use localStorage, sessionStorage, or cookies)
    const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
    
    // If not authenticated and not on the login page, redirect to login
    if (!isAuthenticated && !window.location.href.includes('isr-login-access')) {
        // Store the original intended URL for redirect after login
        sessionStorage.setItem('redirectUrl', window.location.href);
        
        // Redirect to login page
        window.location.href = 'https://gifary10.github.io/isr-login-access/';
    }
}

// Handle login callback (to be called from the login page after successful login)
function handleLoginCallback() {
    // Set authentication flag
    localStorage.setItem('isAuthenticated', 'true');
    
    // Get the original URL to redirect back to
    const redirectUrl = sessionStorage.getItem('redirectUrl') || 'index.html';
    
    // Clear the redirect URL from storage
    sessionStorage.removeItem('redirectUrl');
    
    // Redirect back to the original page
    window.location.href = redirectUrl;
}

// Check authentication when page loads
document.addEventListener('DOMContentLoaded', checkAuth);

// Export functions for testing/modularization
export { checkAuth, handleLoginCallback };