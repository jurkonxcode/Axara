// ============================================================
// KONFIGURASI FIREBASE — GANTI DENGAN DATA ANDA!
// Cara dapat: Firebase Console → Project Axara → Web App → Config
// ============================================================
const firebaseConfig = {
  apiKey: "GANTI_DENGAN_API_KEY_ANDA",
  authDomain: "GANTI_DENGAN_AUTH_DOMAIN.firebaseapp.com",
  projectId: "GANTI_DENGAN_PROJECT_ID",
  storageBucket: "GANTI_DENGAN_STORAGE_BUCKET",
  messagingSenderId: "GANTI_DENGAN_SENDER_ID",
  appId: "GANTI_DENGAN_APP_ID"
};

const configReady = firebaseConfig.apiKey !== "GANTI_DENGAN_API_KEY_ANDA";
if (configReady && !firebase.apps.length) firebase.initializeApp(firebaseConfig);
const auth = configReady ? firebase.auth() : null;
const db = configReady ? firebase.firestore() : null;

// ============================================================
// STATE
// ============================================================
let currentUser = null;
let currentUserData = null;
let feedUnsubscribe = null;
let profileUnsubscribe = null;
let viewingUid = null;
let exploreTab = 'trending';

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
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: d.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined });
}

function escapeHtml(t) {
  const d = document.createElement('div');
  d.textContent = t || '';
  return d.innerHTML;
}

function linkify(text) {
  let html = escapeHtml(text);
  html = html.replace(/#(\w+)/g, '<span class="hashtag">#$1</span>');
  html = html.replace(/@(\w+)/g, '<span class="mention">@$1</span>');
  return html;
}

function getInitial(name) { return (name || '?').charAt(0).toUpperCase(); }
function getHandle(email) { return '@' + (email || 'user').split('@')[0].toLowerCase(); }
function colorForUid(uid) {
  if (!uid) return 0;
  let sum = 0;
  for (let i = 0; i < uid.length; i++) sum += uid.charCodeAt(i);
  return sum % 5;
}

function extractHashtags(text) {
  const matches = text.match(/#(\w+)/g) || [];
  return matches.map(m => m.toLowerCase().replace('#', ''));
}

function toast(msg, type = '') {
  const el = document.createElement('div');
  el.className = 'toast ' + type;
  el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(() => el.classList.add('show'), 10);
  setTimeout(() => {
    el.classList.remove('show');
    setTimeout(() => el.remove(), 400);
  }, 2500);
}

// ============================================================
// KOMPONEN: SIDEBAR & BOTTOM NAV
// ============================================================
function renderSidebar() {
  const el = document.getElementById('sidebarLeft');
  if (!el) return;
  const page = document.body.dataset.page;
  el.innerHTML = `
    <a href="index.html" class="logo">
      <span class="logo-mark">A</span>
      <span class="logo-text">Axara<em>.app</em></span>
    </a>
    <nav class="nav-menu">
      <a href="index.html" class="nav-item ${page === 'home' ? 'active' : ''}">
        <span class="icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12l9-9 9 9"/><path d="M5 10v10h5v-6h4v6h5V10"/></svg></span> Beranda
      </a>
      <a href="explore.html" class="nav-item ${page === 'explore' ? 'active' : ''}">
        <span class="icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.35-4.35"/></svg></span> Jelajah
      </a>
      <a href="profile.html" class="nav-item ${page === 'profile' ? 'active' : ''}">
        <span class="icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-7 8-7s8 3 8 7"/></svg></span> Profil
      </a>
      <a href="settings.html" class="nav-item ${page === 'settings' ? 'active' : ''}">
        <span class="icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg></span> Pengaturan
      </a>
    </nav>
    <button class="btn btn-primary btn-post" onclick="window.location.href='index.html'">+ Posting</button>
    <div class="sidebar-user" onclick="window.location.href='profile.html'">
      <div class="avatar sm" id="sidebarAvatar">?</div>
      <div class="sidebar-user-info">
        <div class="sidebar-user-name" id="sidebarName">Memuat...</div>
        <div class="sidebar-user-handle" id="sidebarHandle">@memuat</div>
      </div>
    </div>
  `;
}

function renderMobileHeader() {
  const el = document.getElementById('mobileHeader');
  if (!el) return;
  el.innerHTML = `
    <a href="index.html" class="logo"><span class="logo-mark">A</span></a>
    <div class="mobile-header-actions">
      <a href="explore.html" class="avatar-btn" style="background: var(--surface-2);">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:18px;height:18px;"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.35-4.35"/></svg>
      </a>
      <a href="settings.html" class="avatar-btn" id="mobileAvatar">?</a>
    </div>
  `;
}

function renderBottomNav() {
  const el = document.getElementById('bottomNav');
  if (!el) return;
  const page = document.body.dataset.page;
  el.innerHTML = `
    <a href="index.html" class="bottom-nav-item ${page === 'home' ? 'active' : ''}">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12l9-9 9 9"/><path d="M5 10v10h5v-6h4v6h5V10"/></svg> Beranda
    </a>
    <a href="explore.html" class="bottom-nav-item ${page === 'explore' ? 'active' : ''}">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.35-4.35"/></svg> Jelajah
    </a>
    <a href="profile.html" class="bottom-nav-item ${page === 'profile' ? 'active' : ''}">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-7 8-7s8 3 8 7"/></svg> Profil
    </a>
    <a href="settings.html" class="bottom-nav-item ${page === 'settings' ? 'active' : ''}">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg> Pengaturan
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
// KOMPONEN: POST CARD
// ============================================================
function renderPostCard(post, index = 0, showDelete = false) {
  const isLiked = currentUser && post.likes?.includes(currentUser.uid);
  const isReposted = currentUser && post.reposts?.includes(currentUser.uid);
  const initial = getInitial(post.displayName);
  const color = colorForUid(post.uid);
  const time = timeAgo(post.createdAt);
  const isOwner = currentUser && post.uid === currentUser.uid;
  
  return `
    <article class="post-card" style="animation-delay: ${index * 0.03}s" data-post-id="${post.id}" onclick="if(event.target.closest('.action-btn'))return;window.location.href='post.html?id=${post.id}'">
      <div class="avatar" data-color="${color}">${initial}</div>
      <div class="post-body">
        <div class="post-header">
          <span class="post-name">${escapeHtml(post.displayName)}</span>
          <span class="post-handle">${escapeHtml(post.handle || '@user')}</span>
          <span class="post-time">· ${time}</span>
        </div>
        <div class="post-content">${linkify(post.content)}</div>
        <div class="post-actions">
          <button class="action-btn like-btn ${isLiked ? 'liked' : ''}" data-post-id="${post.id}">
            <svg viewBox="0 0 24 24" fill="${isLiked ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
            <span>${post.likes?.length || 0}</span>
          </button>
          <button class="action-btn repost-btn ${isReposted ? 'reposted' : ''}" data-post-id="${post.id}">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M17 1l4 4-4 4"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/>
              <path d="M7 23l-4-4 4-4"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/>
            </svg>
            <span>${post.reposts?.length || 0}</span>
          </button>
          <button class="action-btn reply-btn" data-post-id="${post.id}">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
            <span>${post.replyCount || 0}</span>
          </button>
          ${(showDelete && isOwner) ? `
            <button class="action-btn delete delete-btn" data-post-id="${post.id}">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/>
              </svg>
            </button>` : ''}
        </div>
      </div>
    </article>
  `;
}

function attachPostActions(container) {
  container.querySelectorAll('.like-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      if (!currentUser || !db) return;
      const id = btn.dataset.postId;
      const ref = db.collection('posts').doc(id);
      try {
        const doc = await ref.get();
        const likes = doc.data().likes || [];
        const liked = likes.includes(currentUser.uid);
        await ref.update({
          likes: liked ? firebase.firestore.FieldValue.arrayRemove(currentUser.uid) : firebase.firestore.FieldValue.arrayUnion(currentUser.uid)
        });
      } catch (err) { toast('Gagal: ' + err.message, 'error'); }
    });
  });
  
  container.querySelectorAll('.repost-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      if (!currentUser || !db) return;
      const id = btn.dataset.postId;
      const ref = db.collection('posts').doc(id);
      try {
        const doc = await ref.get();
        const reposts = doc.data().reposts || [];
        const reposted = reposts.includes(currentUser.uid);
        await ref.update({
          reposts: reposted ? firebase.firestore.FieldValue.arrayRemove(currentUser.uid) : firebase.firestore.FieldValue.arrayUnion(currentUser.uid)
        });
      } catch (err) { toast('Gagal: ' + err.message, 'error'); }
    });
  });
  
  container.querySelectorAll('.reply-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      window.location.href = 'post.html?id=' + btn.dataset.postId;
    });
  });
  
  container.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      if (!confirm('Hapus postingan ini?')) return;
      try {
        await db.collection('posts').doc(btn.dataset.postId).delete();
        toast('Postingan dihapus', 'success');
      } catch (err) { toast('Gagal: ' + err.message, 'error'); }
    });
  });
}

// ============================================================
// HALAMAN: HOME
// ============================================================
function initHomePage() {
  const input = document.getElementById('postInput');
  const counter = document.getElementById('charCounter');
  const btn = document.getElementById('btnPost');
  const feed = document.getElementById('feed');

  input.addEventListener('input', () => {
    const len = input.value.length;
    counter.textContent = `${len}/500`;
    counter.className = 'char-counter' + (len > 450 ? ' warn' : '') + (len > 480 ? ' danger' : '');
    btn.disabled = len === 0 || len > 500;
  });

  btn.addEventListener('click', async () => {
    const content = input.value.trim();
    if (!content || !currentUser) return;
    btn.disabled = true; btn.textContent = 'Mengirim...';
    try {
      await db.collection('posts').add({
        uid: currentUser.uid,
        displayName: currentUserData?.displayName || currentUser.email,
        handle: currentUserData?.handle || getHandle(currentUser.email),
        content,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        likes: [], reposts: [], parentId: '', replyCount: 0,
        hashtags: extractHashtags(content)
      });
      await db.collection('users').doc(currentUser.uid).update({
        postCount: firebase.firestore.FieldValue.increment(1)
      }).catch(() => {});
      input.value = '';
      counter.textContent = '0/500';
      counter.className = 'char-counter';
      toast('Postingan terkirim!', 'success');
    } catch (err) { toast('Gagal: ' + err.message, 'error'); }
    finally { btn.textContent = 'Posting'; btn.disabled = true; }
  });

  if (!db) {
    feed.innerHTML = `<div class="empty-state"><span class="emoji">⚠️</span><h3>Firebase belum dikonfigurasi</h3></div>`;
    return;
  }

  feedUnsubscribe = db.collection('posts').orderBy('createdAt', 'desc').limit(50).onSnapshot(snap => {
    const posts = [];
    snap.forEach(d => { const data = d.data(); if (!data.parentId) posts.push({ id: d.id, ...data }); });
    if (posts.length === 0) {
      feed.innerHTML = `<div class="empty-state"><span class="emoji">✨</span><h3>Belum ada postingan</h3><p>Jadilah yang pertama bicara!</p></div>`;
    } else {
      feed.innerHTML = posts.map((p, i) => renderPostCard(p, i, true)).join('');
      attachPostActions(feed);
    }
    renderTrending(posts);
  }, err => {
    feed.innerHTML = `<div class="empty-state"><span class="emoji">⚠️</span><h3>Gagal memuat feed</h3><p>${err.message}</p></div>`;
  });
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
  el.innerHTML = sorted.map(([tag, count], i) => `
    <div class="trend-item" onclick="window.location.href='explore.html?q=%23${tag}'">
      <div class="trend-rank">#${i + 1} Trending</div>
      <div class="trend-name">#${escapeHtml(tag)}</div>
      <div class="trend-count">${count} postingan</div>
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

  // Cek query parameter
  const params = new URLSearchParams(window.location.search);
  const q = params.get('q');
  if (q) input.value = q;

  tabs.forEach(t => t.addEventListener('click', () => {
    tabs.forEach(x => x.classList.remove('active'));
    t.classList.add('active');
    exploreTab = t.dataset.tab;
    doSearch(input.value.trim());
  }));

  let debounce;
  input.addEventListener('input', () => {
    clearTimeout(debounce);
    debounce = setTimeout(() => doSearch(input.value.trim()), 400);
  });

  async function doSearch(query) {
    if (!query) { showTrending(); return; }
    
    if (exploreTab === 'trending') {
      // Trending = cari postingan dengan hashtag
      const tag = query.replace('#', '').toLowerCase();
      content.innerHTML = `<div class="skeleton"><div class="skeleton-avatar"></div><div class="skeleton-lines"><div class="skeleton-line short"></div><div class="skeleton-line long"></div></div></div>`;
      try {
        const snap = await db.collection('posts').orderBy('createdAt', 'desc').limit(100).get();
        const posts = [];
        snap.forEach(d => {
          const data = d.data();
          if (!data.parentId && (data.hashtags || []).includes(tag)) posts.push({ id: d.id, ...data });
        });
        if (posts.length === 0) content.innerHTML = `<div class="empty-state"><span class="emoji">🔎</span><h3>Tidak ada hasil</h3><p>Tidak ada postingan dengan #${escapeHtml(tag)}</p></div>`;
        else {
          content.innerHTML = posts.map((p, i) => renderPostCard(p, i)).join('');
          attachPostActions(content);
        }
      } catch (err) { content.innerHTML = `<div class="empty-state">Error: ${err.message}</div>`; }
      return;
    }
    
    if (exploreTab === 'users') {
      content.innerHTML = `<div class="skeleton"><div class="skeleton-avatar"></div><div class="skeleton-lines"><div class="skeleton-line short"></div><div class="skeleton-line long"></div></div></div>`;
      try {
        const q2 = query.toLowerCase();
        const snap = await db.collection('users').limit(50).get();
        const users = [];
        snap.forEach(d => {
          const data = d.data();
          if ((data.displayName || '').toLowerCase().includes(q2) || (data.handle || '').toLowerCase().includes(q2)) {
            users.push({ id: d.id, ...data });
          }
        });
        if (users.length === 0) content.innerHTML = `<div class="empty-state"><span class="emoji">👥</span><h3>Tidak ada pengguna</h3><p>Coba kata kunci lain.</p></div>`;
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
        snap.forEach(d => {
          const data = d.data();
          if (!data.parentId && (data.content || '').toLowerCase().includes(q2)) posts.push({ id: d.id, ...data });
        });
        if (posts.length === 0) content.innerHTML = `<div class="empty-state"><span class="emoji">📝</span><h3>Tidak ada postingan</h3><p>Coba kata kunci lain.</p></div>`;
        else {
          content.innerHTML = posts.map((p, i) => renderPostCard(p, i)).join('');
          attachPostActions(content);
        }
      } catch (err) { content.innerHTML = `<div class="empty-state">Error: ${err.message}</div>`; }
      return;
    }
  }

  async function showTrending() {
    content.innerHTML = `<div class="skeleton"><div class="skeleton-avatar"></div><div class="skeleton-lines"><div class="skeleton-line short"></div><div class="skeleton-line long"></div></div></div>`;
    try {
      const snap = await db.collection('posts').orderBy('createdAt', 'desc').limit(100).get();
      const posts = [];
      snap.forEach(d => { const data = d.data(); if (!data.parentId) posts.push({ id: d.id, ...data }); });
      
      const counts = {};
      posts.forEach(p => (p.hashtags || []).forEach(t => counts[t] = (counts[t] || 0) + 1));
      const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 20);
      
      if (sorted.length === 0) {
        content.innerHTML = `<div class="empty-state"><span class="emoji">🔥</span><h3>Belum ada trending</h3><p>Mulai posting dengan #hashtag untuk memulai!</p></div>`;
        return;
      }
      
      content.innerHTML = `<div style="padding: 20px;">${sorted.map(([tag, count], i) => `
        <div class="trend-item" onclick="document.getElementById('searchInput').value='#${tag}';document.getElementById('searchInput').dispatchEvent(new Event('input'));">
          <div class="trend-rank">#${i + 1} Trending</div>
          <div class="trend-name">#${escapeHtml(tag)}</div>
          <div class="trend-count">${count} postingan</div>
        </div>
      `).join('')}</div>`;
    } catch (err) { content.innerHTML = `<div class="empty-state">Error: ${err.message}</div>`; }
  }

  doSearch(input.value.trim());
}

function renderUserCard(user) {
  const initial = getInitial(user.displayName);
  const color = colorForUid(user.id);
  return `
    <div class="user-card" onclick="window.location.href='profile.html?uid=${user.id}'">
      <div class="avatar" data-color="${color}">${initial}</div>
      <div class="user-card-body">
        <div class="user-card-name">${escapeHtml(user.displayName || 'Tanpa Nama')}</div>
        <div class="user-card-handle">${escapeHtml(user.handle || '@user')}</div>
        ${user.bio ? `<div class="user-card-bio">${escapeHtml(user.bio)}</div>` : ''}
      </div>
    </div>
  `;
}

// ============================================================
// HALAMAN: PROFILE
// ============================================================
async function initProfilePage() {
  const params = new URLSearchParams(window.location.search);
  viewingUid = params.get('uid') || currentUser.uid;
  const isOwn = viewingUid === currentUser.uid;
  
  document.getElementById('pageTitle').textContent = isOwn ? 'Profil Saya' : 'Profil';

  // Load user data
  let userData;
  try {
    const doc = await db.collection('users').doc(viewingUid).get();
    if (!doc.exists) {
      document.getElementById('profileFeed').innerHTML = `<div class="empty-state"><span class="emoji">❌</span><h3>Pengguna tidak ditemukan</h3></div>`;
      return;
    }
    userData = doc.data();
  } catch (err) {
    document.getElementById('profileFeed').innerHTML = `<div class="empty-state">Error: ${err.message}</div>`;
    return;
  }

  // Update header
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

  // Stats
  const followers = userData.followers || [];
  const following = userData.following || [];
  document.getElementById('statFollowers').textContent = followers.length;
  document.getElementById('statFollowing').textContent = following.length;

  // Action button
  const actionEl = document.getElementById('profileActionBtn');
  if (isOwn) {
    actionEl.innerHTML = `<a href="settings.html" class="btn btn-outline btn-sm">Edit Profil</a>`;
  } else {
    const isFollowing = following.includes(currentUser.uid);
    actionEl.innerHTML = `<button class="btn ${isFollowing ? 'btn-outline' : 'btn-primary'} btn-sm" id="btnFollow">${isFollowing ? 'Mengikuti' : 'Ikuti'}</button>`;
    document.getElementById('btnFollow').addEventListener('click', async () => {
      const btn = document.getElementById('btnFollow');
      btn.disabled = true;
      try {
        const myRef = db.collection('users').doc(currentUser.uid);
        const theirRef = db.collection('users').doc(viewingUid);
        if (isFollowing) {
          await myRef.update({ following: firebase.firestore.FieldValue.arrayRemove(viewingUid) });
          await theirRef.update({ followers: firebase.firestore.FieldValue.arrayRemove(currentUser.uid) });
          toast('Berhenti mengikuti', 'success');
        } else {
          await myRef.update({ following: firebase.firestore.FieldValue.arrayUnion(viewingUid) });
          await theirRef.update({ followers: firebase.firestore.FieldValue.arrayUnion(currentUser.uid) });
          toast('Mulai mengikuti', 'success');
        }
        setTimeout(() => location.reload(), 600);
      } catch (err) { toast('Gagal: ' + err.message, 'error'); btn.disabled = false; }
    });
  }

  // Tabs
  const tabs = document.querySelectorAll('.profile-tab');
  tabs.forEach(t => t.addEventListener('click', () => {
    tabs.forEach(x => x.classList.remove('active'));
    t.classList.add('active');
    loadFeed(t.dataset.tab);
  }));

  function loadFeed(tab) {
    if (profileUnsubscribe) profileUnsubscribe();
    const feedEl = document.getElementById('profileFeed');
    feedEl.innerHTML = `<div class="skeleton"><div class="skeleton-avatar"></div><div class="skeleton-lines"><div class="skeleton-line short"></div><div class="skeleton-line long"></div></div></div>`;
    
    if (tab === 'likes') {
      // Posts yang di-like user ini (client-side filter karena Firestore array-contains)
      db.collection('posts').orderBy('createdAt', 'desc').limit(100).onSnapshot(snap => {
        const posts = [];
        snap.forEach(d => {
          const data = d.data();
          if (!data.parentId && (data.likes || []).includes(viewingUid)) posts.push({ id: d.id, ...data });
        });
        document.getElementById('statPosts').textContent = '—';
        if (posts.length === 0) feedEl.innerHTML = `<div class="empty-state"><span class="emoji">❤️</span><h3>Belum ada suka</h3></div>`;
        else {
          feedEl.innerHTML = posts.map((p, i) => renderPostCard(p, i)).join('');
          attachPostActions(feedEl);
        }
      });
    } else {
      profileUnsubscribe = db.collection('posts')
        .where('uid', '==', viewingUid)
        .orderBy('createdAt', 'desc')
        .limit(50)
        .onSnapshot(snap => {
          const posts = [];
          snap.forEach(d => { const data = d.data(); if (!data.parentId) posts.push({ id: d.id, ...data }); });
          document.getElementById('statPosts').textContent = posts.length;
          if (posts.length === 0) feedEl.innerHTML = `<div class="empty-state"><span class="emoji">📝</span><h3>Belum ada postingan</h3></div>`;
          else {
            feedEl.innerHTML = posts.map((p, i) => renderPostCard(p, i, isOwn)).join('');
            attachPostActions(feedEl);
          }
        }, err => { feedEl.innerHTML = `<div class="empty-state">Error: ${err.message}</div>`; });
    }
  }

  loadFeed('posts');
}

async function showFollowModal(type) {
  toast('Fitur daftar ' + type + ' akan datang', '');
}

// ============================================================
// HALAMAN: POST DETAIL
// ============================================================
async function initPostPage() {
  const params = new URLSearchParams(window.location.search);
  const postId = params.get('id');
  if (!postId) { window.location.href = 'index.html'; return; }
  
  const detailEl = document.getElementById('postDetail');
  const repliesEl = document.getElementById('repliesList');
  const replyInput = document.getElementById('replyInput');
  const replyCounter = document.getElementById('replyCharCounter');
  const btnReply = document.getElementById('btnReply');
  
  // Load post
  db.collection('posts').doc(postId).onSnapshot(doc => {
    if (!doc.exists) {
      detailEl.innerHTML = `<div class="empty-state"><span class="emoji">❌</span><h3>Postingan tidak ditemukan</h3></div>`;
      return;
    }
    const post = { id: doc.id, ...doc.data() };
    const isLiked = currentUser && post.likes?.includes(currentUser.uid);
    const isReposted = currentUser && post.reposts?.includes(currentUser.uid);
    const color = colorForUid(post.uid);
    const initial = getInitial(post.displayName);
    
    detailEl.innerHTML = `
      <div class="post-detail">
        <div class="avatar" data-color="${color}">${initial}</div>
        <div style="flex:1;min-width:0;">
          <div class="post-header">
            <span class="post-name">${escapeHtml(post.displayName)}</span>
            <span class="post-handle">${escapeHtml(post.handle || '@user')}</span>
          </div>
          <div class="post-detail-content">${linkify(post.content)}</div>
          <div class="post-detail-meta">${timeAgo(post.createdAt)}</div>
          <div class="post-detail-stats">
            <span><strong>${post.likes?.length || 0}</strong> Suka</span>
            <span><strong>${post.reposts?.length || 0}</strong> Repost</span>
            <span><strong>${post.replyCount || 0}</strong> Balasan</span>
          </div>
          <div class="post-detail-actions">
            <button class="action-btn like-btn ${isLiked ? 'liked' : ''}" data-post-id="${post.id}">
              <svg viewBox="0 0 24 24" fill="${isLiked ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
            </button>
            <button class="action-btn repost-btn ${isReposted ? 'reposted' : ''}" data-post-id="${post.id}">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 1l4 4-4 4"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><path d="M7 23l-4-4 4-4"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>
            </button>
          </div>
        </div>
      </div>
    `;
    attachPostActions(detailEl);
  });
  
  // Reply counter
  replyInput.addEventListener('input', () => {
    const len = replyInput.value.length;
    replyCounter.textContent = `${len}/500`;
    replyCounter.className = 'char-counter' + (len > 450 ? ' warn' : '');
    btnReply.disabled = len === 0;
  });
  
  // Send reply
  btnReply.addEventListener('click', async () => {
    const content = replyInput.value.trim();
    if (!content) return;
    btnReply.disabled = true; btnReply.textContent = 'Mengirim...';
    try {
      await db.collection('posts').add({
        uid: currentUser.uid,
        displayName: currentUserData?.displayName || currentUser.email,
        handle: currentUserData?.handle || getHandle(currentUser.email),
        content,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        likes: [], reposts: [], parentId: postId, replyCount: 0,
        hashtags: extractHashtags(content)
      });
      await db.collection('posts').doc(postId).update({
        replyCount: firebase.firestore.FieldValue.increment(1)
      });
      replyInput.value = '';
      replyCounter.textContent = '0/500';
      toast('Balasan terkirim!', 'success');
    } catch (err) { toast('Gagal: ' + err.message, 'error'); }
    finally { btnReply.textContent = 'Balas'; btnReply.disabled = true; }
  });
  
  // Load replies
  db.collection('posts').where('parentId', '==', postId).orderBy('createdAt', 'asc').limit(100)
    .onSnapshot(snap => {
      const replies = [];
      snap.forEach(d => replies.push({ id: d.id, ...d.data() }));
      if (replies.length === 0) {
        repliesEl.innerHTML = `<div class="empty-state"><span class="emoji">💬</span><h3>Belum ada balasan</h3><p>Jadilah yang pertama membalas!</p></div>`;
      } else {
        repliesEl.innerHTML = replies.map((p, i) => renderPostCard(p, i)).join('');
        attachPostActions(repliesEl);
      }
    });
}

// ============================================================
// HALAMAN: SETTINGS
// ============================================================
function initSettingsPage() {
  const editModal = document.getElementById('editProfileModal');
  
  // Edit Profil
  document.getElementById('itemEditProfile').addEventListener('click', () => {
    document.getElementById('editName').value = currentUserData?.displayName || '';
    document.getElementById('editBio').value = currentUserData?.bio || '';
    document.getElementById('editLocation').value = currentUserData?.location || '';
    document.getElementById('editWebsite').value = currentUserData?.website || '';
    editModal.classList.add('active');
  });
  
  document.querySelectorAll('[data-close]').forEach(el => {
    el.addEventListener('click', () => document.getElementById(el.dataset.close).classList.remove('active'));
  });
  
  editModal.addEventListener('click', (e) => {
    if (e.target === editModal) editModal.classList.remove('active');
  });
  
  document.getElementById('btnSaveProfile').addEventListener('click', async () => {
    const name = document.getElementById('editName').value.trim();
    const bio = document.getElementById('editBio').value.trim();
    const location = document.getElementById('editLocation').value.trim();
    const website = document.getElementById('editWebsite').value.trim();
    
    if (name.length < 2) { toast('Nama minimal 2 karakter', 'error'); return; }
    
    const btn = document.getElementById('btnSaveProfile');
    btn.disabled = true; btn.textContent = 'Menyimpan...';
    try {
      await db.collection('users').doc(currentUser.uid).update({
        displayName: name, bio, location, website
      });
      toast('Profil disimpan!', 'success');
      editModal.classList.remove('active');
      setTimeout(() => location.reload(), 700);
    } catch (err) { toast('Gagal: ' + err.message, 'error'); }
    finally { btn.textContent = 'Simpan'; btn.disabled = false; }
  });
  
  // Ganti password
  document.getElementById('itemChangePassword').addEventListener('click', async () => {
    if (!confirm(`Kirim email reset kata sandi ke ${currentUser.email}?`)) return;
    try {
      await auth.sendPasswordResetEmail(currentUser.email);
      toast('Email reset terkirim. Cek inbox Anda.', 'success');
    } catch (err) { toast('Gagal: ' + err.message, 'error'); }
  });
  
  // Logout
  document.getElementById('itemLogout').addEventListener('click', async () => {
    if (!confirm('Keluar dari akun?')) return;
    await auth.signOut();
    window.location.href = 'login.html';
  });
  
  document.getElementById('itemTheme').addEventListener('click', () => {
    toast('Fitur tema akan datang', '');
  });
}

// ============================================================
// TRANSLATE ERROR
// ============================================================
function translateError(code) {
  const errors = {
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
    'permission-denied': 'Akses database ditolak. Cek Firestore Rules.'
  };
  return errors[code] || code || 'Terjadi kesalahan.';
}

// ============================================================
// AUTH PAGES
// ============================================================
function initLoginPage() {
  const form = document.getElementById('loginForm');
  const message = document.getElementById('message');
  const btn = document.getElementById('btnSubmit');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!auth) { message.textContent = '⚠️ Firebase belum dikonfigurasi.'; message.style.color = '#f43f5e'; return; }
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    btn.disabled = true; btn.textContent = 'Memproses...';
    message.textContent = 'Sedang masuk...';
    try {
      await auth.signInWithEmailAndPassword(email, password);
      window.location.href = 'index.html';
    } catch (err) {
      message.textContent = '❌ ' + translateError(err.code);
      message.style.color = '#f43f5e';
      btn.disabled = false; btn.textContent = 'Masuk';
    }
  });
}

function initRegisterPage() {
  const form = document.getElementById('registerForm');
  const message = document.getElementById('message');
  const btn = document.getElementById('btnSubmit');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!auth || !db) { message.textContent = '⚠️ Firebase belum dikonfigurasi.'; message.style.color = '#f43f5e'; return; }
    const displayName = document.getElementById('displayName').value.trim();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    if (displayName.length < 2) { message.textContent = 'Nama minimal 2 karakter.'; message.style.color = '#f43f5e'; return; }
    btn.disabled = true; btn.textContent = 'Membuat akun...';
    try {
      const cred = await auth.createUserWithEmailAndPassword(email, password);
      await db.collection('users').doc(cred.user.uid).set({
        displayName,
        handle: '@' + email.split('@')[0].toLowerCase(),
        email,
        bio: '',
        location: '',
        website: '',
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        followers: [],
        following: [],
        postCount: 0
      });
      window.location.href = 'index.html';
    } catch (err) {
      message.textContent = '❌ ' + translateError(err.code);
      message.style.color = '#f43f5e';
      btn.disabled = false; btn.textContent = 'Daftar';
    }
  });
}

// ============================================================
// INIT
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
  const page = document.body.dataset.page;

  if (!auth) {
    if (page === 'home' || page === 'profile' || page === 'explore' || page === 'post' || page === 'settings') {
      renderSidebar(); renderMobileHeader(); renderBottomNav();
      const target = document.getElementById('feed') || document.getElementById('exploreContent') || document.getElementById('profileFeed') || document.getElementById('postDetail');
      if (target) target.innerHTML = `<div class="empty-state"><span class="emoji">⚠️</span><h3>Firebase belum dikonfigurasi</h3><p>Isi firebaseConfig di script.js</p></div>`;
    }
    if (page === 'login') initLoginPage();
    if (page === 'register') initRegisterPage();
    return;
  }

  auth.onAuthStateChanged(async (user) => {
    const publicPages = ['login', 'register'];
    
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

    renderSidebar(); renderMobileHeader(); renderBottomNav();
    updateUserUI();

    if (page === 'home') initHomePage();
    else if (page === 'explore') initExplorePage();
    else if (page === 'profile') initProfilePage();
    else if (page === 'post') initPostPage();
    else if (page === 'settings') initSettingsPage();
  });

  if (page === 'login') initLoginPage();
  if (page === 'register') initRegisterPage();
});
