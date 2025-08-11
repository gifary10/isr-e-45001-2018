// auth.js - Tempatkan di link tujuan
document.addEventListener('DOMContentLoaded', async function() {
  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get('token');
  const user = urlParams.get('user');
  const email = urlParams.get('email');
  const produk = urlParams.get('produk');

  if (!token || !user || !email || !produk) {
    redirectToLogin();
    return;
  }

  try {
    const response = await fetch(`https://script.google.com/macros/s/AKfycbyqYUZwWgD2hqLf12tdrcwoJtNl8EPGej1RgrFXJtlP5Z_GshzRqNOfVufROGcEJ1bvSA/exec?action=verifyToken&token=${token}&user=${user}&email=${email}&produk=${produk}`);
    const data = await response.json();

    if (data.status !== "success") {
      redirectToLogin();
    }
  } catch (error) {
    console.error('Error verifying token:', error);
    redirectToLogin();
  }
});

function redirectToLogin() {
  // Simpan URL saat ini untuk redirect kembali setelah login
  sessionStorage.setItem('redirectUrl', window.location.href);
  window.location.href = 'https://your-login-app-url.com';
}

// Untuk logout
function logout() {
  // Hapus token dari sessionStorage
  sessionStorage.removeItem('authToken');
  sessionStorage.removeItem('authUser');
  sessionStorage.removeItem('authEmail');
  sessionStorage.removeItem('authProduk');
  redirectToLogin();
}

// Tambahkan event listener untuk logout button jika ada
document.getElementById('logoutBtn')?.addEventListener('click', logout);
