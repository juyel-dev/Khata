/* Khata Admin — home banner manager (pure HTML/CSS/JS, app থেকে বিচ্ছিন্ন) */
(function () {
  'use strict';

  var CFG_KEY = 'khata_admin_cfg';
  var app = null;
  var db = null;
  var auth = null;

  function $(id) { return document.getElementById(id); }

  function status(id, msg, isErr) {
    var el = $(id);
    el.textContent = msg || '';
    el.className = 'status' + (isErr ? ' err' : '');
  }

  function loadCfg() {
    try {
      var raw = localStorage.getItem(CFG_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (e) { return {}; }
  }

  function fillCfgForm() {
    var c = loadCfg();
    $('cfgApiKey').value = c.apiKey || '';
    $('cfgAuthDomain').value = c.authDomain || '';
    $('cfgProjectId').value = c.projectId || '';
    if (c.apiKey && c.projectId) status('cfgStatus', 'সেটিং সেভ আছে।');
  }

  $('cfgSave').addEventListener('click', function () {
    var c = {
      apiKey: $('cfgApiKey').value.trim(),
      authDomain: $('cfgAuthDomain').value.trim(),
      projectId: $('cfgProjectId').value.trim(),
    };
    if (!c.apiKey || !c.projectId) {
      status('cfgStatus', 'API Key আর Project ID লাগবেই।', true);
      return;
    }
    localStorage.setItem(CFG_KEY, JSON.stringify(c));
    status('cfgStatus', 'সেভ হয়েছে। এবার নিচে লগইন করুন।');
    initFirebase();
  });

  function initFirebase() {
    var c = loadCfg();
    if (!c.apiKey || !c.projectId) return;
    try {
      if (app) { try { firebase.app().delete(); } catch (e) {} }
      app = firebase.initializeApp({
        apiKey: c.apiKey,
        authDomain: c.authDomain || undefined,
        projectId: c.projectId,
      });
      auth = firebase.auth();
      db = firebase.firestore();
      auth.onAuthStateChanged(renderAuth);
    } catch (e) {
      status('cfgStatus', 'Firebase চালু হয়নি: ' + e.message, true);
    }
  }

  function renderAuth(user) {
    var logged = !!user;
    $('loggedOut').classList.toggle('hidden', logged);
    $('loggedIn').classList.toggle('hidden', !logged);
    $('bannerCard').classList.toggle('hidden', !logged);
    if (logged) {
      $('who').textContent = user.email || user.uid;
      loadBanners();
    }
  }

  $('loginBtn').addEventListener('click', function () {
    var email = $('email').value.trim();
    var pw = $('password').value;
    if (!auth) { status('authStatus', 'আগে Firebase সেটিং সেভ করুন।', true); return; }
    status('authStatus', 'ঢুকছে…');
    auth.signInWithEmailAndPassword(email, pw).catch(function (e) {
      status('authStatus', 'হয়নি: ' + e.message, true);
    });
  });

  $('logoutBtn').addEventListener('click', function () {
    if (auth) auth.signOut();
  });

  function genId() {
    return 'b' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  }

  function loadBanners() {
    status('bannerStatus', '');
    db.collection('banners').get().then(function (snap) {
      var items = [];
      snap.forEach(function (d) {
        var v = d.data() || {};
        items.push({
          id: d.id,
          imageUrl: v.imageUrl || '',
          linkUrl: v.linkUrl || '',
          title: v.title || '',
          order: typeof v.order === 'number' ? v.order : 999,
          active: v.active !== false,
        });
      });
      items.sort(function (a, b) { return a.order - b.order; });
      renderList(items);
    }).catch(function (e) {
      status('bannerStatus', 'তালিকা আসেনি: ' + e.message, true);
    });
  }

  function esc(s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function renderList(items) {
    var box = $('bannerList');
    if (!items.length) {
      box.innerHTML = '<p class="hint">এখনো কোনো ব্যানার নেই। নিচে যোগ করুন।</p>';
      return;
    }
    box.innerHTML = '';
    items.forEach(function (b, i) {
      var div = document.createElement('div');
      div.className = 'item';
      div.innerHTML =
        '<img src="' + esc(b.imageUrl) + '" alt="" loading="lazy" />' +
        '<div class="meta"><b>' + esc(b.title || ('ছবি ' + (i + 1))) + '</b>' +
        '<span>ক্রম: ' + esc(b.order) + '</span>' +
        (b.active ? '' : '<span class="off">বন্ধ আছে</span>') + '</div>' +
        '<div class="acts">' +
        '<button data-act="toggle">' + (b.active ? 'বন্ধ করুন' : 'চালু করুন') + '</button>' +
        '<button data-act="del" class="del">মুছুন</button>' +
        '</div>';
      div.querySelector('[data-act="toggle"]').addEventListener('click', function () {
        db.collection('banners').doc(b.id).update({ active: !b.active })
          .then(loadBanners)
          .catch(function (e) { status('bannerStatus', 'হয়নি: ' + e.message, true); });
      });
      div.querySelector('[data-act="del"]').addEventListener('click', function () {
        if (!confirm('মুছে ফেলব?')) return;
        db.collection('banners').doc(b.id).delete()
          .then(loadBanners)
          .catch(function (e) { status('bannerStatus', 'হয়নি: ' + e.message, true); });
      });
      box.appendChild(div);
    });
  }

  $('addBtn').addEventListener('click', function () {
    var imageUrl = $('fImage').value.trim();
    var linkUrl = $('fLink').value.trim();
    var title = $('fTitle').value.trim();
    var order = parseInt($('fOrder').value, 10);
    var active = $('fActive').checked;
    if (!imageUrl) { status('bannerStatus', 'ছবির লিংক দিন।', true); return; }
    if (!auth || !auth.currentUser) { status('bannerStatus', 'আগে লগইন করুন।', true); return; }
    var id = genId();
    var data = { id: id, imageUrl: imageUrl, order: isNaN(order) ? 1 : order, active: active };
    if (linkUrl) data.linkUrl = linkUrl;
    if (title) data.title = title;
    status('bannerStatus', 'যোগ হচ্ছে…');
    db.collection('banners').doc(id).set(data).then(function () {
      status('bannerStatus', 'যোগ হয়েছে।');
      $('fImage').value = '';
      $('fLink').value = '';
      $('fTitle').value = '';
      loadBanners();
    }).catch(function (e) {
      status('bannerStatus', 'হয়নি: ' + e.message, true);
    });
  });

  fillCfgForm();
  initFirebase();
})();
