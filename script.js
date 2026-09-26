// ============================================================
// KONFIGURASI FIREBASE
// ============================================================
const firebaseConfig = {
  apiKey: "AIzaSyBbYYDPV8EsshS6koEvhNRshBSJZUhkXXg",
  authDomain: "axara-c406d.firebaseapp.com",
  projectId: "axara-c406d",
  storageBucket: "axara-c406d.firebasestorage.app",
  messagingSenderId: "926033991824",
  appId: "1:926033991824:web:2faa43cf7bdd722cb1a015",
  measurementId: "G-5ZTCWP9BES"
};

if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();

// ============================================================
// STATE
// ============================================================
let currentUser = null;
let currentUserData = null;
let feedUnsubscribe = null;
let profileUnsubscribe = null;
let viewingUid = null;
let exploreTab = 'trending';
let currentFeed = 'foryou';
let selectedImageFile = null;

// Bot config
const BOT_UID = 'axara-bot-ai';
const BOT_NAME = 'Axara Bot';
const BOT_HANDLE = '@axarabot';
const BOT_API = 'https://text.pollinations.ai/';

// ============================================================
// UTIL
// ============================================================
function timeAgo(ts) {
  if (!ts) return 'baru saja';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  const s = Math.floor((new Date() - d) / 1000);
  if (s < 60) return 'baru saja';
  if (s < 3600) return Math.floor(s / 60) + 'm';
  if (s < 86400) return Math.floor(s / 3600) + 'j';
  if (s < 604800) return Math.floor(s / 86400) + 'h';
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
}
function escapeHtml(t) { const d = document.createElement('div'); d.textContent = t || ''; return d.innerHTML; }
function linkify(text) {
  let h = escapeHtml(text);
  h = h.replace(/#(\w+)/g, '<span class="hashtag">#$1</span>');
  h = h.replace(/@(\w+)/g, '<span class="mention">@$1</span>');
  return h;
}
function getInitial(n) { return (n || '?').charAt(0).toUpperCase(); }
function getHandle(e) { return '@' + (e || 'user').split('@')[0].toLowerCase(); }
function colorForUid(uid) {
  if (!uid) return 0;
  if (uid === BOT_UID) return 3;
  let s = 0;
  for (let i = 0; i < uid.length; i++) s += uid.charCodeAt(i);
  return s % 5;
}
function extractHashtags(t) {
  const m = t.match(/#(\w+)/g) || [];
  return m.map(x => x.toLowerCase().replace('#', ''));
}
function toast(msg, type = '') {
  const el = document.createElement('div');
  el.className = 'toast ' + type;
  el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(() => el.classList.add('show'), 10);
  setTimeout(() => { el.classList.remove('show'); setTimeout(() => el.remove(), 400); }, 2500);
}
function translateError(code) {
  const e = {
    'auth/invalid-email': 'Format email tidak valid.',
    'auth/user-not-found': 'Akun tidak ditemukan.',
    'auth/wrong-password': 'Kata sandi salah.',
    'auth/invalid-credential': 'Email atau kata sandi salah.',
    'auth/email-already-in-use': 'Email sudah terdaftar.',
    'auth/weak-password': 'Kata sandi minimal 6 karakter.',
    'auth/too-many-requests': 'Terlalu banyak percobaan.',
    'auth/network-request-failed': 'Koneksi internet bermasalah.',
    'auth/operation-not-allowed': 'Email/Password belum aktif di Firebase.',
    'auth/unauthorized-domain': 'Domain belum didaftarkan di Firebase.',
    'permission-denied': 'Akses database ditolak.',
    'storage/unauthorized': 'Akses Storage ditolak.',
    'storage/canceled': 'Upload dibatalkan.'
  };
  return e[code] || code || 'Terjadi kesalahan.';
}

// ============================================================
// KOMPONEN NAVIGASI
// ============================================================
function renderSidebar() {
  const el = document.getElementById('sidebarLeft');
  if (!el) return;
  const p = document.body.dataset.page;
  el.innerHTML = `
    <a href="index.html" class="logo-x">
      <span class="logo-mark">A</span>
    </a>
    <nav class="nav-menu">
      <a href="index.html" class="nav-item ${p === 'home' ? 'active' : ''}">
        <span class="icon"><svg viewBox="0 0 24 24"><path d="M3 12l9-9 9 9"/><path d="M5 10v10h5v-6h4v6h5V10"/></svg></span> Beranda
      </a>
      <a href="explore.html" class="nav-item ${p === 'explore' ? 'active' : ''}">
        <span class="icon"><svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.35-4.35"/></svg></span> Jelajah
      </a>
      <a href="#" class="nav-item" onclick="toast('Fitur Notifikasi akan datang','');return false;">
        <span class="icon"><svg viewBox="0 0 24 24"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg><span class="badge">3</span></span> Notifikasi
      </a>
      <a href="#" class="nav-item" onclick="toast('Fitur Pesan akan datang','');return false;">
        <span class="icon"><svg viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg></span> Pesan
      </a>
      <a href="#" class="nav-item" onclick="toast('Fitur Bookmark akan datang','');return false;">
        <span class="icon"><svg viewBox="0 0 24 24"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg></span> Bookmark
      </a>
      <a href="profile.html" class="nav-item ${p === 'profile' ? 'active' : ''}">
        <span class="icon"><svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-7 8-7s8 3 8 7"/></svg></span> Profil
      </a>
      <a href="settings.html" class="nav-item ${p === 'settings' ? 'active' : ''}">
        <span class="icon"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg></span> Pengaturan
      </a>
    </nav>
    <button class="btn-post-x" onclick="window.location.href='index.html'">Posting</button>
    <div class="sidebar-user" onclick="window.location.href='profile.html'">
      <div class="avatar sm" id="sidebarAvatar">?</div>
      <div class="sidebar-user-info">
        <div class="sidebar-user-name" id="sidebarName">Memuat...</div>
        <div class="sidebar-user-handle" id="sidebarHandle">@memuat</div>
      </div>
      <span style="color:var(--text-muted);font-size:18px;">···</span>
    </div>
  `;
}
function renderMobileHeader() {
  const el = document.getElementById('mobileHeader');
  if (!el) return;
  el.innerHTML = `
    <div class="avatar sm" id="mobileAvatar" onclick="window.location.href='settings.html'">?</div>
    <span class="logo-mark">A</span>
    <div style="width:32px;"></div>
  `;
}
function renderBottomNav() {
  const el = document.getElementById('bottomNav');
  if (!el) return;
  const p = document.body.dataset.page;
  el.innerHTML = `
    <a href="index.html" class="bottom-nav-item ${p === 'home' ? 'active' : ''}">
      <svg viewBox="0 0 24 24"><path d="M3 12l9-9 9 9"/><path d="M5 10v10h5v-6h4v6h5V10"/></svg>
    </a>
    <a href="explore.html" class="bottom-nav-item ${p === 'explore' ? 'active' : ''}">
      <svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.35-4.35"/></svg>
    </a>
    <a href="#" class="bottom-nav-item" onclick="toast('Fitur Notifikasi akan datang','');return false;">
      <svg viewBox="0 0 24 24"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
    </a>
    <a href="profile.html" class="bottom-nav-item ${p === 'profile' ? 'active' : ''}">
      <svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-7 8-7s8 3 8 7"/></svg>
    </a>
    <a href="settings.html" class="bottom-nav-item ${p === 'settings' ? 'active' : ''}">
      <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg>
    </a>
  `;
}
function updateUserUI() {
  const name = currentUserData?.displayName || currentUser?.email || '?';
  const handle = currentUserData?.handle || getHandle(currentUser?.email);
  const initial = getInitial(name);
  const color = colorForUid(currentUser?.uid);
  ['mobileAvatar', 'desktopAvatar', 'composerAvatar', 'replyAvatar', 'sidebarAvatar'].forEach(id => {
    const el = document.getElementById(id);
    if (el) { el.textContent = initial; el.setAttribute('data-color', color); }
  });
  const sn = document.getElementById('sidebarName');
  const sh = document.getElementById('sidebarHandle');
  if (sn) sn.textContent = name;
  if (sh) sh.textContent = handle;
}

// ============================================================
// POST CARD (X-Style dengan Foto + Bot Badge)
// ============================================================
function renderPostCard(post, index = 0, showDelete = false) {
  const isLiked = currentUser && post.likes?.includes(currentUser.uid);
  const isReposted = currentUser && post.reposts?.includes(currentUser.uid);
  const isBot = post.uid === BOT_UID;
  const initial = getInitial(post.displayName);
  const color = colorForUid(post.uid);
  const time = timeAgo(post.createdAt);
  const isOwner = currentUser && post.uid === currentUser.uid;
  const imageHtml = post.imageUrl ? `<div class="post-image"><img src="${post.imageUrl}" loading="lazy" alt=""></div>` : '';
  const botBadge = isBot ? `<span class="bot-badge">🤖 BOT</span>` : '';

  return `
    <article class="post-card" style="animation-delay:${index * 0.03}s" data-post-id="${post.id}" onclick="if(event.target.closest('.action-btn')||event.target.closest('.post-menu'))return;window.location.href='post.html?id=${post.id}'">
      <div class="avatar" data-color="${color}">${initial}</div>
      <div class="post-body">
        <div class="post-header">
          <div class="post-header-main">
            <div class="post-name-row">
              <span class="post-name">${escapeHtml(post.displayName)}</span>
              ${botBadge}
              ${!isBot ? `<svg class="post-verified" viewBox="0 0 24 24" fill="currentColor"><path d="M22.5 12.5c0-1.58-.875-2.95-2.148-3.6.154-.435.238-.905.238-1.4 0-2.21-1.71-3.998-3.818-3.998-.47 0-.92.084-1.336.25C14.818 2.415 13.51 1.5 12 1.5s-2.816.917-3.437 2.25c-.415-.165-.866-.25-1.336-.25-2.11 0-3.818 1.79-3.818 4 0 .495.083.965.238 1.4-1.272.65-2.147 2.018-2.147 3.6 0 1.495.782 2.798 1.942 3.486-.02.17-.032.34-.032.514 0 2.21 1.708 4 3.818 4 .47 0 .92-.086 1.335-.25.62 1.334 1.926 2.25 3.437 2.25 1.512 0 2.818-.916 3.437-2.25.415.163.865.248 1.336.248 2.11 0 3.818-1.79 3.818-4 0-.174-.012-.344-.033-.513 1.158-.687 1.943-1.99 1.943-3.484zm-6.616-3.334l-4.334 6.5c-.145.217-.382.334-.625.334-.143 0-.288-.04-.416-.126l-.115-.094-2.415-2.415c-.293-.293-.293-.768 0-1.06s.768-.294 1.06 0l1.77 1.767 3.825-5.74c.23-.345.696-.436 1.04-.207.346.23.44.696.21 1.04z"/></svg>` : ''}
              <span class="post-handle">${escapeHtml(post.handle || '@user')}</span>
              <span class="post-time">· ${time}</span>
            </div>
          </div>
          <button class="post-menu" onclick="event.stopPropagation();">
            <svg viewBox="0 0 24 24" fill="currentColor" style="width:18px;height:18px;"><circle cx="5" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/></svg>
          </button>
        </div>
        ${post.content ? `<div class="post-content">${linkify(post.content)}</div>` : ''}
        ${imageHtml}
        <div class="post-actions">
          <button class="action-btn reply-btn" data-post-id="${post.id}">
            <svg viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            <span>${post.replyCount || 0}</span>
          </button>
          <button class="action-btn repost-btn ${isReposted ? 'reposted' : ''}" data-post-id="${post.id}">
            <svg viewBox="0 0 24 24"><path d="M17 1l4 4-4 4"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><path d="M7 23l-4-4 4-4"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>
            <span>${post.reposts?.length || 0}</span>
          </button>
          <button class="action-btn like-btn ${isLiked ? 'liked' : ''}" data-post-id="${post.id}">
            <svg viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
            <span>${post.likes?.length || 0}</span>
          </button>
          <button class="action-btn" onclick="event.stopPropagation();navigator.share&&navigator.share({title:'Axara',text:'${escapeHtml(post.content).substring(0,80)}'}).catch(()=>{});">
            <svg viewBox="0 0 24 24"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><path d="M16 6l-4-4-4 4"/><path d="M12 2v13"/></svg>
          </button>
          ${(showDelete && isOwner) ? `
          <button class="action-btn delete-btn" data-post-id="${post.id}">
            <svg viewBox="0 0 24 24"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/></svg>
          </button>` : ''}
        </div>
      </div>
    </article>
  `;
}

function attachPostActions(container) {
  container.querySelectorAll('.like-btn').forEach(btn => btn.addEventListener('click', async e => {
    e.stopPropagation(); if (!currentUser) return;
    const ref = db.collection('posts').doc(btn.dataset.postId);
    try {
      const d = await ref.get();
      const likes = d.data().likes || [];
      const liked = likes.includes(currentUser.uid);
      await ref.update({
        likes: liked ? firebase.firestore.FieldValue.arrayRemove(currentUser.uid) : firebase.firestore.FieldValue.arrayUnion(currentUser.uid)
      });
    } catch (err) { toast('Gagal: ' + err.message, 'error'); }
  }));
  container.querySelectorAll('.repost-btn').forEach(btn => btn.addEventListener('click', async e => {
    e.stopPropagation(); if (!currentUser) return;
    const ref = db.collection('posts').doc(btn.dataset.postId);
    try {
      const d = await ref.get();
      const reposts = d.data().reposts || [];
      const r = reposts.includes(currentUser.uid);
      await ref.update({
        reposts: r ? firebase.firestore.FieldValue.arrayRemove(currentUser.uid) : firebase.firestore.FieldValue.arrayUnion(currentUser.uid)
      });
      toast(r ? 'Repost dibatalkan' : 'Berhasil di-repost!', 'success');
    } catch (err) { toast('Gagal: ' + err.message, 'error'); }
  }));
  container.querySelectorAll('.reply-btn').forEach(btn => btn.addEventListener('click', e => {
    e.stopPropagation();
    window.location.href = 'post.html?id=' + btn.dataset.postId;
  }));
  container.querySelectorAll('.delete-btn').forEach(btn => btn.addEventListener('click', async e => {
    e.stopPropagation();
    if (!confirm('Hapus postingan ini?')) return;
    try {
      await db.collection('posts').doc(btn.dataset.postId).delete();
      toast('Postingan dihapus', 'success');
    } catch (err) { toast('Gagal: ' + err.message, 'error'); }
  }));
}

// ============================================================
// AI BOT — Auto Reply
// ============================================================
async function botReply(postId, postContent, postAuthor) {
  try {
    const prompt = `Kamu adalah Axara Bot, bot AI ramah di sosial media bernama Axara. Berikan komentar singkat (maksimal 2 kalimat, bahasa Indonesia santai, boleh emoji) untuk postingan berikut dari ${postAuthor}: "${postContent}". Jangan sebut kamu AI. Langsung beri komentar saja.`;
    const url = BOT_API + encodeURIComponent(prompt);
    const res = await fetch(url);
    if (!res.ok) throw new Error('Bot API error');
    let reply = await res.text();
    reply = reply.trim().substring(0, 280);
    if (!reply) return;

    await db.collection('posts').add({
      uid: BOT_UID,
      displayName: BOT_NAME,
      handle: BOT_HANDLE,
      content: reply,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      likes: [], reposts: [], parentId: postId, replyCount: 0,
      hashtags: [], isBot: true
    });
    await db.collection('posts').doc(postId).update({
      replyCount: firebase.firestore.FieldValue.increment(1)
    });
  } catch (err) {
    console.error('Bot error:', err);
  }
}

// ============================================================
// HALAMAN: HOME
// ============================================================
function initHomePage() {
  const input = document.getElementById('postInput');
  const counter = document.getElementById('charCounter');
  const btn = document.getElementById('btnPost');
  const feed = document.getElementById('feed');
  const imageInput = document.getElementById('imageInput');
  const previewContainer = document.getElementById('imagePreviewContainer');

  input.addEventListener('input', () => {
    const l = input.value.length;
    counter.textContent = `${l}/500`;
    counter.className = 'char-counter' + (l > 450 ? ' warn' : '') + (l > 480 ? ' danger' : '');
    btn.disabled = (l === 0 && !selectedImageFile) || l > 500;
  });

  imageInput.addEventListener('change', e => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast('Foto maksimal 5MB', 'error'); imageInput.value = ''; return; }
    selectedImageFile = file;
    const reader = new FileReader();
    reader.onload = ev => {
      previewContainer.innerHTML = `<div class="image-preview"><img src="${ev.target.result}" alt=""><button class="remove-img" onclick="removeSelectedImage()">×</button></div>`;
      btn.disabled = input.value.length > 500;
    };
    reader.readAsDataURL(file);
  });

  window.removeSelectedImage = function() {
    selectedImageFile = null;
    imageInput.value = '';
    previewContainer.innerHTML = '';
    btn.disabled = input.value.trim().length === 0;
  };

  btn.addEventListener('click', async () => {
    const content = input.value.trim();
    if ((!content && !selectedImageFile) || !currentUser) return;
    btn.disabled = true; btn.textContent = selectedImageFile ? 'Mengunggah...' : 'Mengirim...';

    try {
      let imageUrl = '';
      if (selectedImageFile) {
        const path = `posts/${currentUser.uid}/${Date.now()}_${selectedImageFile.name}`;
        const snap = await storage.ref(path).put(selectedImageFile);
        imageUrl = await snap.ref.getDownloadURL();
      }

      const postRef = await db.collection('posts').add({
        uid: currentUser.uid,
        displayName: currentUserData?.displayName || currentUser.email,
        handle: currentUserData?.handle || getHandle(currentUser.email),
        content,
        imageUrl,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        likes: [], reposts: [], parentId: '', replyCount: 0,
        hashtags: extractHashtags(content)
      });

      input.value = '';
      counter.textContent = '0/500';
      counter.className = 'char-counter';
      selectedImageFile = null;
      imageInput.value = '';
      previewContainer.innerHTML = '';
      toast('Postingan terkirim!', 'success');

      // Bot auto-reply (delay 2 detik)
      if (content) {
        setTimeout(() => botReply(postRef.id, content, currentUserData?.displayName || 'pengguna'), 2500);
      }
    } catch (err) { toast('Gagal: ' + err.message, 'error'); }
    finally { btn.textContent = 'Posting'; btn.disabled = true; }
  });

  // Feed tabs
  document.querySelectorAll('.header-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.header-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      currentFeed = tab.dataset.feed;
      loadFeed();
    });
  });

  function loadFeed() {
    if (feedUnsubscribe) feedUnsubscribe();
    feed.innerHTML = `<div class="skeleton"><div class="skeleton-avatar"></div><div class="skeleton-lines"><div class="skeleton-line short"></div><div class="skeleton-line long"></div></div></div>`;

    feedUnsubscribe = db.collection('posts').orderBy('createdAt', 'desc').limit(50).onSnapshot(snap => {
      const posts = [];
      snap.forEach(d => { const data = d.data(); if (!data.parentId) posts.push({ id: d.id, ...data }); });
      if (posts.length === 0) {
        feed.innerHTML = `<div class="empty-state"><span class="emoji">✨</span><h3>Selamat datang di Axara!</h3><p>Jadilah yang pertama bicara. Posting sesuatu dengan #hashtag, dan Axara Bot akan mengomentari!</p></div>`;
      } else {
        feed.innerHTML = posts.map((p, i) => renderPostCard(p, i, true)).join('');
        attachPostActions(feed);
      }
      renderTrending(posts);
    }, err => {
      feed.innerHTML = `<div class="empty-state"><span class="emoji">⚠️</span><h3>Gagal memuat feed</h3><p>${err.message}</p></div>`;
    });
  }
  loadFeed();
}

function renderTrending(posts) {
  const el = document.getElementById('trendingList');
  if (!el) return;
  const counts = {};
  posts.forEach(p => (p.hashtags || []).forEach(t => counts[t] = (counts[t] || 0) + 1));
  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 5);
  if (sorted.length === 0) {
    el.innerHTML = `<p style="font-size:14px;color:var(--text-muted);">Belum ada trending. Posting dengan <strong>#hashtag</strong> untuk memulai!</p>`;
    return;
  }
  el.innerHTML = sorted.map(([tag, c], i) => `
    <div class="trend-item" onclick="window.location.href='explore.html?q=%23${tag}'">
      <div class="trend-meta">#${i + 1} · Trending</div>
      <div class="trend-name">#${escapeHtml(tag)}</div>
      <div class="trend-count">${c} postingan</div>
    </div>
  `).join('');
}

// ============================================================
// HALAMAN: EXPLORE
// ============================================================
async function initExplorePage() {
  const input = document.getElementById('searchInput');
  const content = document.getElementById('exploreContent');
  const tabs = document.querySelectorAll('.profile-tab');
  const params = new URLSearchParams(window.location.search);
  const q = params.get('q'); if (q) input.value = q;
  tabs.forEach(t => t.addEventListener('click', () => {
    tabs.forEach(x => x.classList.remove('active')); t.classList.add('active');
    exploreTab = t.dataset.tab; doSearch(input.value.trim());
  }));
  let debounce;
  input.addEventListener('input', () => { clearTimeout(debounce); debounce = setTimeout(() => doSearch(input.value.trim()), 400); });

  async function doSearch(query) {
    if (!query) { showTrending(); return; }
    if (exploreTab === 'trending') {
      const tag = query.replace('#', '').toLowerCase();
      content.innerHTML = `<div class="skeleton"><div class="skeleton-avatar"></div><div class="skeleton-lines"><div class="skeleton-line short"></div><div class="skeleton-line long"></div></div></div>`;
      try {
        const snap = await db.collection('posts').orderBy('createdAt', 'desc').limit(100).get();
        const posts = [];
        snap.forEach(d => { const data = d.data(); if (!data.parentId && (data.hashtags || []).includes(tag)) posts.push({ id: d.id, ...data }); });
        if (posts.length === 0) content.innerHTML = `<div class="empty-state"><span class="emoji">🔎</span><h3>Tidak ada hasil</h3><p>Tidak ada postingan dengan #${escapeHtml(tag)}</p></div>`;
        else { content.innerHTML = posts.map((p, i) => renderPostCard(p, i)).join(''); attachPostActions(content); }
      } catch (err) { content.innerHTML = `<div class="empty-state">Error: ${err.message}</div>`; }
      return;
    }
    if (exploreTab === 'users') {
      content.innerHTML = `<div class="skeleton"><div class="skeleton-avatar"></div><div class="skeleton-lines"><div class="skeleton-line short"></div><div class="skeleton-line long"></div></div></div>`;
      try {
        const q2 = query.toLowerCase();
        const snap = await db.collection('users').limit(50).get();
        const users = [];
        snap.forEach(d => { const data = d.data(); if ((data.displayName || '').toLowerCase().includes(q2) || (data.handle || '').toLowerCase().includes(q2)) users.push({ id: d.id, ...data }); });
        if (users.length === 0) content.innerHTML = `<div class="empty-state"><span class="emoji">👥</span><h3>Tidak ada pengguna</h3></div>`;
        else content.innerHTML = users.map(u => renderUserCard(u)).join('');
      } catch (err) { content.innerHTML = `<div class="empty-state">Error: ${err.message}</div>`; }
      return;
    }
    if (exploreTab === 'posts') {
      content.innerHTML = `<div class="skeleton"><div class="skeleton-avatar"></div><div class="skeleton-lines"><div class="skeleton-line short"></div><div class="skeleton-line long"></div></div></div>`;
      try {
        const q2 = query.toLowerCase();
        const snap = await db.collection('posts').orderBy('createdAt', 'desc').limit(100).get();
        const posts = [];
        snap.forEach(d => { const data = d.data(); if (!data.parentId && (data.content || '').toLowerCase().includes(q2)) posts.push({ id: d.id, ...data }); });
        if (posts.length === 0) content.innerHTML = `<div class="empty-state"><span class="emoji">📝</span><h3>Tidak ada postingan</h3></div>`;
        else { content.innerHTML = posts.map((p, i) => renderPostCard(p, i)).join(''); attachPostActions(content); }
      } catch (err) { content.innerHTML = `<div class="empty-state">Error: ${err.message}</div>`; }
      return;
    }
  }
  async function showTrending() {
    content.innerHTML = `<div class="skeleton"><div class="skeleton-avatar"></div><div class="skeleton-lines"><div class="skeleton-line short"></div><div class="skeleton-line long"></div></div></div>`;
    try {
      const snap = await db.collection('posts').orderBy('createdAt', 'desc').limit(100).get();
      const posts = []; snap.forEach(d => { const data = d.data(); if (!data.parentId) posts.push({ id: d.id, ...data }); });
      const counts = {}; posts.forEach(p => (p.hashtags || []).forEach(t => counts[t] = (counts[t] || 0) + 1));
      const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 20);
      if (sorted.length === 0) { content.innerHTML = `<div class="empty-state"><span class="emoji">🔥</span><h3>Belum ada trending</h3><p>Mulai posting dengan #hashtag untuk memulai!</p></div>`; return; }
      content.innerHTML = `<div style="padding:8px 0;">${sorted.map(([tag, c], i) => `
        <div class="trend-item" onclick="document.getElementById('searchInput').value='#${tag}';document.getElementById('searchInput').dispatchEvent(new Event('input'));">
          <div class="trend-meta">#${i + 1} · Trending</div>
          <div class="trend-name">#${escapeHtml(tag)}</div>
          <div class="trend-count">${c} postingan</div>
        </div>`).join('')}</div>`;
    } catch (err) { content.innerHTML = `<div class="empty-state">Error: ${err.message}</div>`; }
  }
  doSearch(input.value.trim());
}
function renderUserCard(user) {
  const initial = getInitial(user.displayName);
  const color = colorForUid(user.id);
  return `<div class="user-card" onclick="window.location.href='profile.html?uid=${user.id}'">
    <div class="avatar" data-color="${color}">${initial}</div>
    <div class="user-card-body">
      <div class="user-card-name">${escapeHtml(user.displayName || 'Tanpa Nama')}</div>
      <div class="user-card-handle">${escapeHtml(user.handle || '@user')}</div>
      ${user.bio ? `<div class="user-card-bio">${escapeHtml(user.bio)}</div>` : ''}
    </div>
  </div>`;
}

// ============================================================
// HALAMAN: PROFILE
// ============================================================
async function initProfilePage() {
  const params = new URLSearchParams(window.location.search);
  viewingUid = params.get('uid') || currentUser.uid;
  const isOwn = viewingUid === currentUser.uid;
  document.getElementById('pageTitle').textContent = isOwn ? 'Profil Saya' : 'Profil';
  let userData;
  try {
    const doc = await db.collection('users').doc(viewingUid).get();
    if (!doc.exists) { document.getElementById('profileFeed').innerHTML = `<div class="empty-state"><span class="emoji">❌</span><h3>Pengguna tidak ditemukan</h3></div>`; return; }
    userData = doc.data();
  } catch (err) { document.getElementById('profileFeed').innerHTML = `<div class="empty-state">Error: ${err.message}</div>`; return; }
  document.getElementById('profileAvatar').textContent = getInitial(userData.displayName);
  document.getElementById('profileAvatar').setAttribute('data-color', colorForUid(viewingUid));
  document.getElementById('profileName').textContent = userData.displayName || 'Tanpa Nama';
  document.getElementById('profileHandle').textContent = userData.handle || '@user';
  document.getElementById('profileBio').textContent = userData.bio || '';
  document.getElementById('profileBio').style.display = userData.bio ? 'block' : 'none';
  const meta = [];
  if (userData.location) meta.push(`📍 ${escapeHtml(userData.location)}`);
  if (userData.website) meta.push(`🔗 ${escapeHtml(userData.website)}`);
  if (userData.createdAt) meta.push(`📅 Bergabung ${timeAgo(userData.createdAt)}`);
  document.getElementById('profileMeta').innerHTML = meta.map(m => `<span>${m}</span>`).join('');
  const followers = userData.followers || []; const following = userData.following || [];
  document.getElementById('statFollowers').textContent = followers.length;
  document.getElementById('statFollowing').textContent = following.length;
  const actionEl = document.getElementById('profileActionBtn');
  if (isOwn) { actionEl.innerHTML = `<a href="settings.html" class="btn btn-outline btn-sm">Edit Profil</a>`; }
  else {
    const isFollowing = following.includes(currentUser.uid);
    actionEl.innerHTML = `<button class="btn ${isFollowing ? 'btn-outline' : 'btn-primary'} btn-sm" id="btnFollow">${isFollowing ? 'Mengikuti' : 'Ikuti'}</button>`;
    document.getElementById('btnFollow').addEventListener('click', async () => {
      const btn = document.getElementById('btnFollow'); btn.disabled = true;
      try {
        const myRef = db.collection('users').doc(currentUser.uid);
        const theirRef = db.collection('users').doc(viewingUid);
        if (isFollowing) { await myRef.update({ following: firebase.firestore.FieldValue.arrayRemove(viewingUid) }); await theirRef.update({ followers: firebase.firestore.FieldValue.arrayRemove(currentUser.uid) }); toast('Berhenti mengikuti', 'success'); }
        else { await myRef.update({ following: firebase.firestore.FieldValue.arrayUnion(viewingUid) }); await theirRef.update({ followers: firebase.firestore.FieldValue.arrayUnion(currentUser.uid) }); toast('Mulai mengikuti', 'success'); }
        setTimeout(() => location.reload(), 600);
      } catch (err) { toast('Gagal: ' + err.message, 'error'); btn.disabled = false; }
    });
  }
  const tabs = document.querySelectorAll('.profile-tab');
  tabs.forEach(t => t.addEventListener('click', () => { tabs.forEach(x => x.classList.remove('active')); t.classList.add('active'); loadFeed(t.dataset.tab); }));
  function loadFeed(tab) {
    if (profileUnsubscribe) profileUnsubscribe();
    const feedEl = document.getElementById('profileFeed');
    feedEl.innerHTML = `<div class="skeleton"><div class="skeleton-avatar"></div><div class="skeleton-lines"><div class="skeleton-line short"></div><div class="skeleton-line long"></div></div></div>`;
    if (tab === 'likes') {
      db.collection('posts').orderBy('createdAt', 'desc').limit(100).onSnapshot(snap => {
        const posts = []; snap.forEach(d => { const data = d.data(); if (!data.parentId && (data.likes || []).includes(viewingUid)) posts.push({ id: d.id, ...data }); });
        document.getElementById('statPosts').textContent = '—';
        if (posts.length === 0) feedEl.innerHTML = `<div class="empty-state"><span class="emoji">❤️</span><h3>Belum ada suka</h3></div>`;
        else { feedEl.innerHTML = posts.map((p, i) => renderPostCard(p, i)).join(''); attachPostActions(feedEl); }
      });
    } else {
      profileUnsubscribe = db.collection('posts').where('uid', '==', viewingUid).orderBy('createdAt', 'desc').limit(50).onSnapshot(snap => {
        const posts = []; snap.forEach(d => { const data = d.data(); if (!data.parentId) posts.push({ id: d.id, ...data }); });
        document.getElementById('statPosts').textContent = posts.length;
        if (posts.length === 0) feedEl.innerHTML = `<div class="empty-state"><span class="emoji">📝</span><h3>Belum ada postingan</h3></div>`;
        else { feedEl.innerHTML = posts.map((p, i) => renderPostCard(p, i, isOwn)).join(''); attachPostActions(feedEl); }
      }, err => { feedEl.innerHTML = `<div class="empty-state">Error: ${err.message}</div>`; });
    }
  }
  loadFeed('posts');
}

// ============================================================
// HALAMAN: POST DETAIL
// ============================================================
async function initPostPage() {
  const params = new URLSearchParams(window.location.search);
  const postId = params.get('id'); if (!postId) { window.location.href = 'index.html'; return; }
  const detailEl = document.getElementById('postDetail');
  const repliesEl = document.getElementById('repliesList');
  const replyInput = document.getElementById('replyInput');
  const replyCounter = document.getElementById('replyCharCounter');
  const btnReply = document.getElementById('btnReply');
  db.collection('posts').doc(postId).onSnapshot(doc => {
    if (!doc.exists) { detailEl.innerHTML = `<div class="empty-state"><span class="emoji">❌</span><h3>Postingan tidak ditemukan</h3></div>`; return; }
    const post = { id: doc.id, ...doc.data() };
    const isLiked = currentUser && post.likes?.includes(currentUser.uid);
    const isReposted = currentUser && post.reposts?.includes(currentUser.uid);
    const isBot = post.uid === BOT_UID;
    const color = colorForUid(post.uid);
    const initial = getInitial(post.displayName);
    const imageHtml = post.imageUrl ? `<div class="post-detail-image"><img src="${post.imageUrl}" alt=""></div>` : '';
    detailEl.innerHTML = `
      <div class="post-detail">
        <div class="post-detail-header">
          <div class="avatar" data-color="${color}">${initial}</div>
          <div style="flex:1;">
            <div style="font-weight:700;font-size:15px;">${escapeHtml(post.displayName)} ${isBot ? '<span class="bot-badge">🤖 BOT</span>' : ''}</div>
            <div style="color:var(--text-muted);font-size:14px;">${escapeHtml(post.handle || '@user')}</div>
          </div>
        </div>
        ${post.content ? `<div class="post-detail-content">${linkify(post.content)}</div>` : ''}
        ${imageHtml}
        <div class="post-detail-meta">${timeAgo(post.createdAt)}</div>
        <div class="post-detail-stats">
          <span><strong>${post.likes?.length || 0}</strong> Suka</span>
          <span><strong>${post.reposts?.length || 0}</strong> Repost</span>
          <span><strong>${post.replyCount || 0}</strong> Balasan</span>
        </div>
        <div class="post-detail-actions">
          <button class="action-btn reply-btn" data-post-id="${post.id}"><svg viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg></button>
          <button class="action-btn repost-btn ${isReposted ? 'reposted' : ''}" data-post-id="${post.id}"><svg viewBox="0 0 24 24"><path d="M17 1l4 4-4 4"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><path d="M7 23l-4-4 4-4"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg></button>
          <button class="action-btn like-btn ${isLiked ? 'liked' : ''}" data-post-id="${post.id}"><svg viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg></button>
        </div>
      </div>`;
    attachPostActions(detailEl);
  });
  replyInput.addEventListener('input', () => {
    const l = replyInput.value.length;
    replyCounter.textContent = `${l}/500`;
    replyCounter.className = 'char-counter' + (l > 450 ? ' warn' : '');
    btnReply.disabled = l === 0;
  });
  btnReply.addEventListener('click', async () => {
    const content = replyInput.value.trim(); if (!content) return;
    btnReply.disabled = true; btnReply.textContent = 'Mengirim...';
    try {
      await db.collection('posts').add({
        uid: currentUser.uid,
        displayName: currentUserData?.displayName || currentUser.email,
        handle: currentUserData?.handle || getHandle(currentUser.email),
        content,
        imageUrl: '',
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        likes: [], reposts: [], parentId: postId, replyCount: 0,
        hashtags: extractHashtags(content)
      });
      await db.collection('posts').doc(postId).update({ replyCount: firebase.firestore.FieldValue.increment(1) });
      replyInput.value = ''; replyCounter.textContent = '0/500'; toast('Balasan terkirim!', 'success');
    } catch (err) { toast('Gagal: ' + err.message, 'error'); }
    finally { btnReply.textContent = 'Balas'; btnReply.disabled = true; }
  });
  db.collection('posts').where('parentId', '==', postId).orderBy('createdAt', 'asc').limit(100).onSnapshot(snap => {
    const replies = []; snap.forEach(d => replies.push({ id: d.id, ...d.data() }));
    if (replies.length === 0) repliesEl.innerHTML = `<div class="empty-state"><span class="emoji">💬</span><h3>Belum ada balasan</h3><p>Jadilah yang pertama membalas!</p></div>`;
    else { repliesEl.innerHTML = replies.map((p, i) => renderPostCard(p, i)).join(''); attachPostActions(repliesEl); }
  });
}

// ============================================================
// HALAMAN: SETTINGS
// ============================================================
function initSettingsPage() {
  const editModal = document.getElementById('editProfileModal');
  document.getElementById('itemEditProfile').addEventListener('click', () => {
    document.getElementById('editName').value = currentUserData?.displayName || '';
    document.getElementById('editBio').value = currentUserData?.bio || '';
    document.getElementById('editLocation').value = currentUserData?.location || '';
    document.getElementById('editWebsite').value = currentUserData?.website || '';
    editModal.classList.add('active');
  });
  document.querySelectorAll('[data-close]').forEach(el => el.addEventListener('click', () => document.getElementById(el.dataset.close).classList.remove('active')));
  editModal.addEventListener('click', e => { if (e.target === editModal) editModal.classList.remove('active'); });
  document.getElementById('btnSaveProfile').addEventListener('click', async () => {
    const name = document.getElementById('editName').value.trim();
    const bio = document.getElementById('editBio').value.trim();
    const location = document.getElementById('editLocation').value.trim();
    const website = document.getElementById('editWebsite').value.trim();
    if (name.length < 2) { toast('Nama minimal 2 karakter', 'error'); return; }
    const btn = document.getElementById('btnSaveProfile'); btn.disabled = true; btn.textContent = 'Menyimpan...';
    try {
      await db.collection('users').doc(currentUser.uid).update({ displayName: name, bio, location, website });
      toast('Profil disimpan!', 'success');
      editModal.classList.remove('active');
      setTimeout(() => location.reload(), 700);
    } catch (err) { toast('Gagal: ' + err.message, 'error'); }
    finally { btn.textContent = 'Simpan'; btn.disabled = false; }
  });
  document.getElementById('itemChangePassword').addEventListener('click', async () => {
    if (!confirm(`Kirim email reset kata sandi ke ${currentUser.email}?`)) return;
    try { await auth.sendPasswordResetEmail(currentUser.email); toast('Email reset terkirim.', 'success'); } catch (err) { toast('Gagal: ' + err.message, 'error'); }
  });
  document.getElementById('itemLogout').addEventListener('click', async () => {
    if (!confirm('Keluar dari akun?')) return;
    await auth.signOut();
    window.location.href = 'login.html';
  });
  document.getElementById('itemTheme').addEventListener('click', () => toast('Fitur tema akan datang', ''));
}

// ============================================================
// AUTH
// ============================================================
function initLoginPage() {
  const form = document.getElementById('loginForm');
  const message = document.getElementById('message');
  const btn = document.getElementById('btnSubmit');
  form.addEventListener('submit', async e => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    btn.disabled = true; btn.textContent = 'Memproses...'; message.textContent = 'Sedang masuk...'; message.style.color = '#8a8a94';
    try { await auth.signInWithEmailAndPassword(email, password); window.location.href = 'index.html'; }
    catch (err) { message.textContent = '❌ ' + translateError(err.code); message.style.color = '#f43f5e'; btn.disabled = false; btn.textContent = 'Masuk'; }
  });
}
function initRegisterPage() {
  const form = document.getElementById('registerForm');
  const message = document.getElementById('message');
  const btn = document.getElementById('btnSubmit');
  form.addEventListener('submit', async e => {
    e.preventDefault();
    const displayName = document.getElementById('displayName').value.trim();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    if (displayName.length < 2) { message.textContent = 'Nama minimal 2 karakter.'; message.style.color = '#f43f5e'; return; }
    btn.disabled = true; btn.textContent = 'Membuat akun...'; message.textContent = 'Memproses...'; message.style.color = '#8a8a94';
    try {
      const cred = await auth.createUserWithEmailAndPassword(email, password);
      await db.collection('users').doc(cred.user.uid).set({
        displayName,
        handle: '@' + email.split('@')[0].toLowerCase(),
        email, bio: '', location: '', website: '',
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        followers: [], following: [], postCount: 0
      });
      window.location.href = 'index.html';
    } catch (err) { message.textContent = '❌ ' + translateError(err.code); message.style.color = '#f43f5e'; btn.disabled = false; btn.textContent = 'Daftar'; }
  });
}

// ============================================================
// INIT
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
  const page = document.body.dataset.page;
  const publicPages = ['login', 'register'];
  auth.onAuthStateChanged(async user => {
    if (user) {
      currentUser = user;
      try {
        const doc = await db.collection('users').doc(user.uid).get();
        currentUserData = doc.exists ? doc.data() : { displayName: user.email, handle: getHandle(user.email) };
      } catch { currentUserData = { displayName: user.email, handle: getHandle(user.email) }; }
      if (publicPages.includes(page)) { window.location.href = 'index.html'; return; }
    } else {
      currentUser = null; currentUserData = null;
      if (!publicPages.includes(page)) { window.location.href = 'login.html'; return; }
    }
    renderSidebar(); renderMobileHeader(); renderBottomNav(); updateUserUI();
    if (page === 'home') initHomePage();
    else if (page === 'explore') initExplorePage();
    else if (page === 'profile') initProfilePage();
    else if (page === 'post') initPostPage();
    else if (page === 'settings') initSettingsPage();
  });
  if (page === 'login') initLoginPage();
  if (page === 'register') initRegisterPage();
});
