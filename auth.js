document.addEventListener('DOMContentLoaded', async function() {
  const token = sessionStorage.getItem('authToken');
  const user = sessionStorage.getItem('authUser');
  const email = sessionStorage.getItem('authEmail');
  const produk = sessionStorage.getItem('authProduk');

  if (!token || !user || !email || !produk) {
    redirectToLogin('missing_credentials');
    return;
  }

  try {
    const response = await fetch(
      'https://script.google.com/macros/s/AKfycbz1NUWREhzzRaEiU50CDzx5i9ksu_cJQYoHDgnsGfyOWrXv8Bwp853i4GhZZezDD5OcXg/exec',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ action: 'verifyToken', token, user, email, produk })
      }
    );

    const data = await response.json();

    if (data.status !== 'success') {
      redirectToLogin('invalid_token');
    }
  } catch (error) {
    console.error('Error verifying token:', error);
    redirectToLogin('verify_error');
  }
});

function redirectToLogin(reason) {
  sessionStorage.setItem('redirectUrl', window.location.href);
  window.location.href = `https://gifary10.github.io/isr-login-access/?reason=${encodeURIComponent(reason)}`;
}

function logout() {
  sessionStorage.clear();
  redirectToLogin('logout');
}

document.getElementById('logoutBtn')?.addEventListener('click', logout);
