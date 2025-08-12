// auth.js - File untuk verifikasi token di aplikasi tujuan
document.addEventListener('DOMContentLoaded', async function() {
  // Ambil data autentikasi dari sessionStorage
  const token = sessionStorage.getItem('authToken');
  const user = sessionStorage.getItem('authUser');
  const email = sessionStorage.getItem('authEmail');
  const produk = sessionStorage.getItem('authProduk');

  // Jika ada data yang kosong, redirect ke halaman login
  if (!token || !user || !email || !produk) {
    redirectToLogin('missing_credentials');
    return;
  }

  try {
    // Verifikasi token ke backend
    const response = await fetch(
      'https://script.google.com/macros/s/AKfycbz1NUWREhzzRaEiU50CDzx5i9ksu_cJQYoHDgnsGfyOWrXv8Bwp853i4GhZZezDD5OcXg/exec',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ 
          action: 'verifyToken', 
          token, 
          user, 
          email, 
          produk 
        })
      }
    );

    const data = await response.json();

    // Jika verifikasi gagal, redirect ke login
    if (data.status !== 'success') {
      redirectToLogin('invalid_token');
    }
  } catch (error) {
    console.error('Error verifying token:', error);
    redirectToLogin('verify_error');
  }
});

// Fungsi untuk redirect ke halaman login
function redirectToLogin(reason) {
  // Simpan URL saat ini untuk redirect kembali setelah login
  sessionStorage.setItem('redirectUrl', window.location.href);
  window.location.href = `https://gifary10.github.io/isr-login-access/?reason=${encodeURIComponent(reason)}`;
}

// Fungsi logout
function logout() {
  // Hapus semua data session
  sessionStorage.clear();
  redirectToLogin('logout');
}

// Tambahkan event listener untuk tombol logout jika ada
document.getElementById('logoutBtn')?.addEventListener('click', logout);
