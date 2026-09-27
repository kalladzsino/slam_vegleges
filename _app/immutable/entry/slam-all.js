/* =========================================================
   SLAM — összefűzött scriptek egyetlen fájlban
   Betöltési sorrend (a fájlok saját kommentjei alapján):
   1. slam-player-config.js
   2. slam-modern-nav.js
   3. slam-player-engine.js
   4. slam-player-minimal.js
   5. slam-mono-hero.js
   6. slam-live-hero.js
   7. slam-footer-reimagined.js
   8. slam-reorder.js
   9. slam-article.js
   10. slam-depth-background.js
   ========================================================= */


/* ===== slam-player-config.js ===== */
/* =========================================================
   SLAM — lejátszó-konfiguráció.

   EZT AZ EGY (aktív) SORT KELL CSERÉLNED, ha változik a
   rádió stream URL-je — máshol a kódban nem kell semmit
   keresgélni.

   FONTOS — https:// szükséges! Ha az oldal https-en fut
   (ez a legtöbb mai tárhelynél alapértelmezett), a stream
   URL-nek is https://-nek kell lennie, különben a böngésző
   némán letiltja a lejátszást ("mixed content" hiba — ez a
   Console-ban jelenik meg, F12). Ha a szolgáltatód csak
   http://-t ad, kérdezd meg náluk, van-e https változat
   (a legtöbb icecast/shoutcast szolgáltatónál van).
   ========================================================= */
window.SLAM_STREAM_URL = "https://freestream.hu:8340/slamhu";

/* ---------------------------------------------------------
   OPCIONÁLIS: "Most szól" (cím / előadó) adat.
   Ha a szolgáltatódnál van egy JSON-végpont, ami visszaadja
   az aktuálisan szóló szám adatait, írd ide az URL-jét — a
   player 30 másodpercenként lekérdezi, és frissíti vele a
   lejátszó-sávon a cím/előadó szöveget.
   A várt JSON formátum: { "title": "...", "artist": "..." }
   Ha nincs ilyen végpontod, hagyd null-on — ekkor a "SLAM" /
   "WE. LOVE. SUMMER" statikus szöveg marad.
   --------------------------------------------------------- */
window.SLAM_NOWPLAYING_URL = null;


/* ===== slam-modern-nav.js ===== */
/* =========================================================
   SLAM — teljesen új navigáció felépítése (vanilla JS).
   A régi fejlécet, tabbar-t és oldalsáv-lejátszót a CSS
   elrejti; ez a script helyettük épít fel egy lebegő
   kapszula-fejlécet (csúszó aktív-jelzővel), egy lenyíló
   mobil menüt (staggerelt animációval), egy dokkoló alsó
   navigációt (csúszó jelölő-pillával) és egy teljes
   szélességű, sötét lejátszó-sávot (a referencia-dizájnhoz
   igazítva), ami a meglévő stream-lejátszóhoz (a box-player
   szkript `audio` objektumához) kapcsolódik.
   ========================================================= */
(function () {
  function ready(fn) {
    if (document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
  }

  var prefersReducedMotion = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---- base path automatikus felismerése ----
     Ha az oldal egy almappában van (pl. /artikelen/cikk.html,
     /shows/musor.html), a gyökérhez képesti relatív linkek és
     a logó-útvonal elé "../"-t kell tenni. A meglévő <link rel="canonical">
     tag-et használjuk referenciának: az ő href-je MINDIG a gyökérhez
     képesti útvonal (pl. "index.html" vagy "../index.html") — ebből
     számoljuk ki, hány szinttel vagyunk mélyebben a gyökérnél. */
  var BASE = (function () {
    var canonical = document.querySelector('link[rel="canonical"]');
    if (canonical) {
      var href = canonical.getAttribute('href') || '';
      var match = href.match(/^(\.\.\/)+/);
      if (match) return match[0];
    }
    /* tartalék: az URL mélysége alapján becslés (gyökér index.html
       kivételével minden .html fájl 1 mappa-szinttel mélyebbnek
       számít, ha a path 2+ szegmensből áll) */
    var segments = window.location.pathname.split('/').filter(Boolean);
    var depth = Math.max(0, segments.length - 1);
    return depth > 0 ? new Array(depth + 1).join('../') : '';
  })();

  /* A "Kapcsolat" link a lábléc(footer)ben már elérhető, ezért az új
     menüdizájn (uj-menu.html) mintáját követve itt csak a 3 fő pont
     szerepel a fejlécben/menüben. */
  var NAV_LINKS = [
    { href: BASE + 'index.html', label: 'Kezdőlap' },
    { href: BASE + 'ontdek.html', label: 'Blogjaink' },
    { href: BASE + 'programmering.html', label: 'Rádió' }
  ];

  ready(function () {
    var path = window.location.pathname.split('/').slice(-1)[0] || 'index.html';
    if (window.location.pathname.indexOf('artikelen/') !== -1) {
      path = 'artikelen/' + path;
    }

    var navLinks = NAV_LINKS.slice(0, 3);

    function isActive(l) { return l.href === path; }

    function navLinksHtml(cls) {
      return navLinks.map(function (l) {
        return '<a href="' + l.href + '"' + (isActive(l) ? ' class="active"' : '') +
          (cls ? ' data-row="' + cls + '"' : '') + '>' + l.label + '</a>';
      }).join('');
    }

    var chevronSvg = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';

    var navWrap = document.createElement('div');
    navWrap.className = 'slam-nav-wrap';
    navWrap.innerHTML =
      '<nav class="slam-nav">' +
        '<div class="slam-nav-left">' +
          '<button class="slam-nav-burger" id="slamNavBurger" aria-label="Menü" aria-expanded="false"><span></span><span></span><span></span></button>' +
          '<div class="slam-nav-links">' + navLinksHtml() + '</div>' +
        '</div>' +
        '<a class="slam-nav-logo" href="' + BASE + 'index.html">' +
          '<img src="' + BASE + 'img/01/logos.png" alt="SLAM Rádió" class="logo-img">' +
        '</a>' +
        '<div class="slam-nav-right">' +
          '<button type="button" class="slam-nav-search" aria-label="Keresés">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.35-4.35"/></svg>' +
            '<span class="label">Keresés</span>' +
          '</button>' +
          '<a class="slam-nav-account" href="#">' +
            '<span class="avatar"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 12a5 5 0 1 0 0-10 5 5 0 0 0 0 10Zm0 2c-4 0-9 2-9 6v2h18v-2c0-4-5-6-9-6Z"/></svg></span>' +
            '<span class="label">Fiókom</span>' +
          '</a>' +
        '</div>' +
      '</nav>' +
      '<div class="slam-nav-links-row2">' + navLinksHtml('row2') + '</div>';
    document.body.appendChild(navWrap);

    /* ---- 2) teljes képernyős lenyíló mobil/tablet menü (drawer) ---- */
    var backdrop = document.createElement('div');
    backdrop.className = 'slam-drawer-backdrop';
    document.body.appendChild(backdrop);

    var drawer = document.createElement('div');
    drawer.className = 'slam-drawer';
    var drawerLinksHtml = NAV_LINKS.map(function (l) {
      var active = isActive(l) ? ' class="active"' : '';
      return '<li><a href="' + l.href + '"' + active + '>' + l.label + chevronSvg + '</a></li>';
    }).join('');
    drawer.innerHTML =
      '<div class="slam-drawer-top">' +
        '<button class="slam-drawer-close" id="slamDrawerClose" aria-label="Bezárás">' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M6 6l12 12M18 6 6 18"/></svg>' +
        '</button>' +
      '</div>' +
      '<ul class="slam-drawer-list">' +
        drawerLinksHtml +
        '<li><a href="https://www.twitch.tv/slamhu" target="_blank" rel="noopener">Webkamera' + chevronSvg + '</a></li>' +
      '</ul>' +
      '<div class="slam-drawer-social-label">Kövess minket</div>' +
      '<div class="slam-drawer-socials">' +
        '<a href="#" aria-label="Facebook"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M13.5 21v-8h2.7l.4-3.1h-3.1V8c0-.9.25-1.5 1.55-1.5H17V3.6C16.7 3.55 15.7 3.5 14.6 3.5c-2.3 0-3.9 1.4-3.9 4v2.4H8v3.1h2.7V21h2.8Z"/></svg></a>' +
        '<a href="#" aria-label="Instagram"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.2" cy="6.8" r="1"/></svg></a>' +
        '<a href="#" aria-label="YouTube"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M21.6 7.2s-.2-1.5-.8-2.1c-.8-.8-1.7-.8-2.1-.9C15.9 4 12 4 12 4h0s-3.9 0-6.7.2c-.4 0-1.3.1-2.1.9-.6.6-.8 2.1-.8 2.1S2.2 9 2.2 10.7v1.6c0 1.8.2 3.5.2 3.5s.2 1.5.8 2.1c.8.8 1.8.8 2.3.9 1.7.1 6.5.2 6.5.2s3.9 0 6.7-.2c.4 0 1.3-.1 2.1-.9.6-.6.8-2.1.8-2.1s.2-1.7.2-3.5v-1.6c0-1.7-.2-3.5-.2-3.5ZM9.9 14.6V8.9l5.4 2.9-5.4 2.8Z"/></svg></a>' +
        '<a href="#" aria-label="TikTok"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M16.6 3c.3 2 1.6 3.6 3.5 4v2.7c-1.4 0-2.7-.4-3.8-1.2v6.4c0 3.3-2.7 6-6 6a6 6 0 0 1-1.8-11.7v2.9a3 3 0 1 0 4 2.8V3h4.1Z"/></svg></a>' +
      '</div>' +
      '<div class="slam-drawer-brand">' +
        '<img src="' + BASE + 'img/01/logos.png" alt="SLAM Rádió" class="logo-img">' +
      '</div>';
    document.body.appendChild(drawer);

    var hamburger = document.getElementById('slamNavBurger');
    var drawerCloseBtn = document.getElementById('slamDrawerClose');

    function openMenu() {
      hamburger.classList.add('is-open');
      drawer.classList.add('is-open');
      backdrop.classList.add('is-open');
      hamburger.setAttribute('aria-expanded', 'true');
      document.body.classList.add('slam-nav-no-scroll');
    }

    function closeMenu() {
      hamburger.classList.remove('is-open');
      drawer.classList.remove('is-open');
      backdrop.classList.remove('is-open');
      hamburger.setAttribute('aria-expanded', 'false');
      document.body.classList.remove('slam-nav-no-scroll');
    }

    hamburger.addEventListener('click', function (e) {
      e.stopPropagation();
      if (drawer.classList.contains('is-open')) closeMenu();
      else openMenu();
    });
    drawerCloseBtn.addEventListener('click', closeMenu);
    backdrop.addEventListener('click', closeMenu);
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeMenu();
    });

    /* ---- 3) dokkoló alsó navigáció — eltávolítva, nem kell mobilon sem ---- */

    /* ---- 4) sticky lejátszó-sáv, a referenciaképhez igazítva ---- */
    var miniPlayer = document.createElement('div');
    miniPlayer.className = 'slam-mini-player';
    miniPlayer.innerHTML =
      '<div class="slam-mini-main">' +
        '<div class="slam-mini-art">' +
          '<div class="slam-eq"><span></span><span></span><span></span><span></span></div>' +
        '</div>' +
        '<div class="slam-mini-info">' +
          '<span class="slam-live-badge"><span class="slam-live-dot"></span>ÉLŐ ADÁS</span>' +
          '<div class="slam-track">SLAM</div>' +
          '<div class="slam-artist">WE. LOVE. MUSIC</div>' +
        '</div>' +
        '<button class="slam-mini-play" type="button" aria-label="Lejátszás / Szünet">' +
          '<svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"></path></svg>' +
        '</button>' +
        '<div class="slam-mini-progress">' +
          '<svg class="slam-mini-vol-icon" viewBox="0 0 24 24"><path d="M3 9v6h4l5 5V4L7 9H3z"></path><path d="M16 8a5 5 0 0 1 0 8"></path></svg>' +
          '<input type="range" class="slam-volume-slider" min="0" max="1" step="0.01" value="1" aria-label="Hangerő">' +
        '</div>' +
        '<button class="slam-mini-share" type="button" aria-label="Adás linkjének másolása">' +
          '<svg viewBox="0 0 24 24"><path d="M12 3v12"></path><path d="M7 8l5-5 5 5"></path><path d="M5 13v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6"></path></svg>' +
        '</button>' +
      '</div>';
    document.body.appendChild(miniPlayer);

    var miniBtn = miniPlayer.querySelector('.slam-mini-play');
    var miniIcon = miniBtn.querySelector('svg');
    var volumeSlider = miniPlayer.querySelector('.slam-volume-slider');
    var shareBtn = miniPlayer.querySelector('.slam-mini-share');

    /* ---- 4a) teljes képernyős lejátszó (a mini-sávra kattintva nyílik) ---- */
    var fullBackdrop = document.createElement('div');
    fullBackdrop.className = 'slam-full-backdrop';

    var fullPlayer = document.createElement('div');
    fullPlayer.className = 'slam-full-player';
    fullPlayer.setAttribute('role', 'dialog');
    fullPlayer.setAttribute('aria-modal', 'true');
    fullPlayer.setAttribute('aria-label', 'SLAM lejátszó');
    fullPlayer.innerHTML =
      '<div class="slam-full-ambient" aria-hidden="true"></div>' +
      '<div class="slam-full-handle" aria-hidden="true"></div>' +
      '<div class="slam-full-topbar">' +
        '<button class="slam-full-close" type="button" aria-label="Bezárás">' +
          '<svg viewBox="0 0 24 24"><path d="M6 9l6 6 6-6"></path></svg>' +
        '</button>' +
        '<button class="slam-full-share" type="button" aria-label="Adás linkjének másolása">' +
          '<svg viewBox="0 0 24 24"><path d="M12 3v12"></path><path d="M7 8l5-5 5 5"></path><path d="M5 13v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6"></path></svg>' +
        '</button>' +
      '</div>' +
      '<div class="slam-full-columns">' +
        '<div class="slam-full-art">' +
          '<div class="slam-eq"><span></span><span></span><span></span><span></span></div>' +
          '<img class="slam-full-logo" src="./img/01/logos.png" alt="SLAM logó">' +
          '<img class="slam-full-photo" alt="" hidden>' +
          '<img class="slam-full-watermark" src="./img/01/logos.png" alt="" hidden aria-hidden="true">' +
        '</div>' +
        '<div class="slam-full-body">' +
          '<div class="slam-full-meta">' +
            '<span class="slam-full-badge"><span class="slam-live-dot"></span><span class="slam-full-badge-text">ÉLŐ ADÁS</span></span>' +
            '<div class="slam-full-track">SLAM</div>' +
            '<div class="slam-full-artist">WE. LOVE. MUSIC</div>' +
          '</div>' +
          '<div class="slam-full-volume">' +
            '<button type="button" class="slam-full-vol-icon" aria-label="Némítás">' +
              '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9v6h4l5 5V4L7 9H3z"></path><path d="M16 8a5 5 0 0 1 0 8"></path></svg>' +
            '</button>' +
            '<input type="range" class="slam-full-vol-range" min="0" max="1" step="0.01" value="1" aria-label="Hangerő">' +
            '<span class="slam-full-vol-icon slam-full-vol-icon--max" aria-hidden="true">' +
              '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9v6h4l5 5V4L7 9H3z"></path><path d="M16 8a5 5 0 0 1 0 8"></path><path d="M19 5a9 9 0 0 1 0 14"></path></svg>' +
            '</span>' +
          '</div>' +
          '<div class="slam-full-progress" hidden>' +
            '<div class="slam-full-progress-track"><div class="slam-full-progress-fill"></div></div>' +
            '<div class="slam-full-progress-text"></div>' +
          '</div>' +
          '<div class="slam-full-next" hidden>' +
            '<svg class="slam-full-next-arrow" viewBox="0 0 24 24"><path d="M13 5l7 7-7 7M5 12h15"></path></svg>' +
            '<span class="slam-full-next-text"></span>' +
            '<button type="button" class="slam-full-remind" aria-label="Emlékeztess a következő műsorra">' +
              '<svg viewBox="0 0 24 24"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>' +
            '</button>' +
          '</div>' +
          '<div class="slam-full-actions">' +
            '<button type="button" data-action="playlist">' +
              '<svg viewBox="0 0 24 24"><path d="M4 6h16M4 12h10M4 18h10"></path></svg>' +
              '<span>Playlist</span>' +
            '</button>' +
            '<button class="slam-full-play" type="button" aria-label="Lejátszás / Szünet">' +
              '<svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"></path></svg>' +
            '</button>' +
            '<button type="button" data-action="live">' +
              '<svg viewBox="0 0 24 24"><rect x="2" y="6" width="14" height="12" rx="2"></rect><path d="M16 10l6-4v12l-6-4"></path></svg>' +
              '<span>Nézd élőben</span>' +
            '</button>' +
          '</div>' +
        '</div>' +
      '</div>' +
      '<div class="slam-full-schedule" hidden>' +
        '<div class="slam-full-schedule-title">Mai műsorrend</div>' +
        '<div class="slam-full-schedule-list"></div>' +
      '</div>';

    document.body.appendChild(fullBackdrop);
    document.body.appendChild(fullPlayer);

    var fullPlayBtn = fullPlayer.querySelector('.slam-full-play');
    var fullPlayIcon = fullPlayBtn.querySelector('svg');
    var fullTrackEl = fullPlayer.querySelector('.slam-full-track');
    var fullArtistEl = fullPlayer.querySelector('.slam-full-artist');
    var closeBtn = fullPlayer.querySelector('.slam-full-close');
    var fullShareBtn = fullPlayer.querySelector('.slam-full-share');
    var trackEl = miniPlayer.querySelector('.slam-track');
    var artistEl = miniPlayer.querySelector('.slam-artist');
    var miniArtEl = miniPlayer.querySelector('.slam-mini-art');
    var ambientEl = fullPlayer.querySelector('.slam-full-ambient');
    var fullLogoImg = fullPlayer.querySelector('.slam-full-logo');
    var fullPhotoImg = fullPlayer.querySelector('.slam-full-photo');
    var fullWatermarkImg = fullPlayer.querySelector('.slam-full-watermark');
    var badgeTextEl = fullPlayer.querySelector('.slam-full-badge-text');
    var progressWrap = fullPlayer.querySelector('.slam-full-progress');
    var progressFill = fullPlayer.querySelector('.slam-full-progress-fill');
    var progressText = fullPlayer.querySelector('.slam-full-progress-text');
    var nextWrap = fullPlayer.querySelector('.slam-full-next');
    var nextText = fullPlayer.querySelector('.slam-full-next-text');

    /* a cím/előadó szinkronban tartása a mini-sávval (most és a jövőbeli
       "most szól" integrációval is működik, mert a DOM-változást figyeli) */
    function syncMeta() {
      fullTrackEl.textContent = trackEl.textContent;
      fullArtistEl.textContent = artistEl.textContent;
    }
    syncMeta();
    if ('MutationObserver' in window) {
      var metaObserver = new MutationObserver(syncMeta);
      metaObserver.observe(trackEl, { childList: true, characterData: true, subtree: true });
      metaObserver.observe(artistEl, { childList: true, characterData: true, subtree: true });
    }

    /* ---- élő "most szól" adatok fogadása (slam-live-hero.js küldi) ----
       valódi műsorképet tesz a borító helyére, elmosott ambient hátteret
       ad a panel mögé, és megmutatja, hol tart a műsor / mi jön ezután */
    document.addEventListener('slam:now-playing', function (e) {
      var d = e.detail || {};

      trackEl.textContent = d.name || 'SLAM';
      artistEl.textContent = d.dj || 'SLAM Radio';
      badgeTextEl.textContent = d.current ? 'ÉLŐ ADÁS' : 'MOST SZÓL';

      if (d.photo) {
        fullPhotoImg.src = d.photo;
        fullPhotoImg.hidden = false;
        fullLogoImg.hidden = true;
        if (fullWatermarkImg) fullWatermarkImg.hidden = false;
        ambientEl.style.backgroundImage = 'url("' + d.photo + '")';
        ambientEl.classList.add('visible');
        miniArtEl.style.backgroundImage =
          'linear-gradient(0deg, rgba(0,0,0,.15), rgba(0,0,0,.15)), url("' + d.photo + '")';
        miniArtEl.style.backgroundSize = 'cover';
        miniArtEl.style.backgroundPosition = 'center';
      } else {
        fullPhotoImg.hidden = true;
        fullLogoImg.hidden = false;
        if (fullWatermarkImg) fullWatermarkImg.hidden = true;
        ambientEl.classList.remove('visible');
        miniArtEl.style.backgroundImage = '';
      }

      if (d.progressPct != null) {
        progressWrap.hidden = false;
        progressFill.style.width = d.progressPct + '%';
        progressText.textContent = d.remainMin != null
          ? (d.remainMin <= 1 ? 'Mindjárt vége' : 'Még ' + d.remainMin + ' perc ebből a műsorból')
          : '';
      } else {
        progressWrap.hidden = true;
      }

      if (d.next && d.next.name) {
        nextWrap.hidden = false;
        nextText.textContent = 'Következik: ' + d.next.name +
          (d.next.time ? ' \u00b7 ' + d.next.time : '');
      } else {
        nextWrap.hidden = true;
      }
    });

    var fullPlayerOpen = false;
    function openFullPlayer() {
      if (fullPlayerOpen) return;
      fullPlayerOpen = true;
      syncMeta();
      fullBackdrop.classList.add('open');
      fullPlayer.classList.add('open');
      document.body.classList.add('slam-scroll-lock');
      closeBtn.focus();
    }
    function closeFullPlayer() {
      if (!fullPlayerOpen) return;
      fullPlayerOpen = false;
      fullBackdrop.classList.remove('open');
      fullPlayer.classList.remove('open');
      fullPlayer.style.transform = '';
      document.body.classList.remove('slam-scroll-lock');
      if (typeof window.__slamCloseSleepView === 'function') window.__slamCloseSleepView();
    }

    /* a mini-sáv fő területére kattintva nyílik meg — a gombokon/csúszkán
       történő kattintás nem indítja el (ott saját funkciójuk fut) */
    miniPlayer.querySelector('.slam-mini-main').addEventListener('click', function (e) {
      if (e.target.closest('.slam-mini-play, .slam-mini-share, .slam-mini-progress')) return;
      openFullPlayer();
    });

    closeBtn.addEventListener('click', closeFullPlayer);
    fullBackdrop.addEventListener('click', closeFullPlayer);
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && fullPlayerOpen) closeFullPlayer();
    });

    fullPlayBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      if (typeof window.playPause === 'function') {
        window.playPause();
      } else if (window.audio) {
        window.audio.paused ? window.audio.play() : window.audio.pause();
      }
    });

    fullShareBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      shareBtn.click();
      fullShareBtn.classList.add('copied');
      setTimeout(function () { fullShareBtn.classList.remove('copied'); }, 1800);
    });

    /* -- lehúzással bezárás (drag-to-dismiss) a felső fogantyún -- */
    var handle = fullPlayer.querySelector('.slam-full-handle');
    var dragStartY = null, dragCurrentY = 0, dragging = false;

    function onDragStart(e) {
      dragging = true;
      dragStartY = (e.touches ? e.touches[0].clientY : e.clientY);
      fullPlayer.style.transition = 'none';
    }
    function onDragMove(e) {
      if (!dragging) return;
      var y = (e.touches ? e.touches[0].clientY : e.clientY);
      dragCurrentY = Math.max(0, y - dragStartY);
      fullPlayer.style.transform = 'translateY(' + dragCurrentY + 'px)';
    }
    function onDragEnd() {
      if (!dragging) return;
      dragging = false;
      fullPlayer.style.transition = '';
      if (dragCurrentY > 120) {
        closeFullPlayer();
      } else {
        fullPlayer.style.transform = '';
      }
      dragCurrentY = 0;
    }
    handle.addEventListener('touchstart', onDragStart, { passive: true });
    handle.addEventListener('touchmove', onDragMove, { passive: true });
    handle.addEventListener('touchend', onDragEnd);
    handle.addEventListener('pointerdown', onDragStart);
    window.addEventListener('pointermove', function (e) { if (dragging) onDragMove(e); });
    window.addEventListener('pointerup', onDragEnd);

    /* -- alsó gombsor: playlisthez ugrás / élő videó (vizuális, logika később) -- */
    var playlistBtn = fullPlayer.querySelector('[data-action="playlist"]');

    playlistBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      closeFullPlayer();
      var target = document.querySelector('.playlist-detail') || document.querySelector('#slam-prog-track');
      if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });

    function setIcon(playing) {
      var iconHtml = playing
        ? '<rect x="6" y="5" width="4" height="14"></rect><rect x="14" y="5" width="4" height="14"></rect>'
        : '<path d="M8 5v14l11-7z"></path>';
      miniIcon.innerHTML = iconHtml;
      fullPlayIcon.innerHTML = iconHtml;
      miniPlayer.classList.toggle('playing', playing);
      fullPlayer.classList.toggle('playing', playing);
    }

    miniBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      if (typeof window.playPause === 'function') {
        window.playPause();
      } else if (window.audio) {
        window.audio.paused ? window.audio.play() : window.audio.pause();
      }
    });

    volumeSlider.addEventListener('click', function (e) { e.stopPropagation(); });
    volumeSlider.addEventListener('input', function () {
      if (window.audio) {
        window.audio.volume = parseFloat(volumeSlider.value);
      }
      fullVolumeSlider.value = volumeSlider.value;
    });

    var fullVolumeSlider = fullPlayer.querySelector('.slam-full-vol-range');
    var fullVolIcon = fullPlayer.querySelector('.slam-full-vol-icon');
    var fullVolIconMax = fullPlayer.querySelector('.slam-full-vol-icon--max');

    /* a csúszka bal oldalát (a beállított hangerőig) világosabbra
       színezi, a jobb oldalát pedig sötétebben hagyja — ez adja a
       referenciaképen látható kétszínű sávot */
    function updateFullVolFill() {
      var pct = Math.round(parseFloat(fullVolumeSlider.value || 0) * 100);
      fullVolumeSlider.style.setProperty('--slamf-vol-fill', pct + '%');
      if (fullVolIconMax) fullVolIconMax.style.opacity = pct <= 1 ? '.4' : '1';
    }
    updateFullVolFill();

    fullVolumeSlider.addEventListener('click', function (e) { e.stopPropagation(); });
    fullVolumeSlider.addEventListener('input', function () {
      if (window.audio) {
        window.audio.volume = parseFloat(fullVolumeSlider.value);
        window.audio.muted = false;
      }
      volumeSlider.value = fullVolumeSlider.value;
      fullVolIcon.style.opacity = '1';
      updateFullVolFill();
    });
    fullVolIcon.addEventListener('click', function (e) {
      e.stopPropagation();
      if (!window.audio) return;
      window.audio.muted = !window.audio.muted;
      fullVolIcon.style.opacity = window.audio.muted ? '.4' : '1';
    });

    /* extra funkció: az élő adás linkjének egy kattintással
       történő vágólapra másolása, gyors megosztáshoz */
    var shareResetTimer = null;
    shareBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      var url = window.location.origin + window.location.pathname;
      function showCopied() {
        shareBtn.classList.add('copied');
        shareBtn.setAttribute('aria-label', 'Link másolva!');
        clearTimeout(shareResetTimer);
        shareResetTimer = setTimeout(function () {
          shareBtn.classList.remove('copied');
          shareBtn.setAttribute('aria-label', 'Adás linkjének másolása');
        }, 1800);
      }
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(url).then(showCopied).catch(function () {});
      } else {
        var tmp = document.createElement('input');
        tmp.value = url;
        document.body.appendChild(tmp);
        tmp.select();
        try { document.execCommand('copy'); showCopied(); } catch (err) {}
        document.body.removeChild(tmp);
      }
    });

    function bindAudio() {
      if (!window.audio) return false;
      window.audio.addEventListener('play', function () { setIcon(true); });
      window.audio.addEventListener('pause', function () { setIcon(false); });
      setIcon(!window.audio.paused);
      volumeSlider.value = window.audio.volume;
      fullVolumeSlider.value = window.audio.volume;
      if (typeof updateFullVolFill === 'function') updateFullVolFill();
      return true;
    }

    if (!bindAudio()) {
      var tries = 0;
      var iv = setInterval(function () {
        tries += 1;
        if (bindAudio() || tries > 20) clearInterval(iv);
      }, 250);
    }

    /* megjelenés görgetésre */
    var lastShow = false;
    window.addEventListener('scroll', function () {
      var show = window.scrollY > 280;
      if (show !== lastShow) {
        miniPlayer.classList.toggle('visible', show);
        lastShow = show;
      }
    }, { passive: true });

    /* ---- 5) finom megjelenési animáció a tartalmi szekciókhoz ---- */
    if (!prefersReducedMotion && 'IntersectionObserver' in window) {
      var revealTargets = document.querySelectorAll(
        '.hero, .content > .section, .swimlane-module, footer.footer'
      );
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('slam-reveal-in');
            io.unobserve(entry.target);
          }
        });
      }, { threshold: .12, rootMargin: '0px 0px -8% 0px' });

      revealTargets.forEach(function (el, i) {
        el.classList.add('slam-reveal');
        el.style.transitionDelay = (Math.min(i, 4) * 60) + 'ms';
        io.observe(el);
      });
    }
  });
})();


/* ===== slam-player-engine.js ===== */
/* =========================================================
   SLAM — valódi audio-motor.

   Ez hozza létre a TÉNYLEGES <audio> lejátszót a
   slam-player-config.js-ben megadott stream URL-ből, és
   köti a globális window.audio / window.playPause hookokra
   — ezekre épül MINDEN meglévő UI-elem (a mini-lejátszó
   play-gombja, a hero nagy play-gombja stb.), tehát ennek
   a fájlnak a betöltésével AZONNAL életre kel az összes már
   megépített felület, kód-módosítás nélkül.

   Amit csinál:
   - valódi lejátszás/szünet (window.playPause)
   - automatikus ÚJRACSATLAKOZÁS, ha a stream megszakad
     (növekvő várakozási idővel, hogy ne "püföljön" egy rossz
     kapcsolatot)
   - hangerő megjegyzése (localStorage), alapérték 90%
   - Media Session API — zárolt telefon-képernyőn / böngésző-
     fülön is meg tudod állítani/indítani
   - szóköz billentyű = lejátszás/szünet (ha nem beviteli
     mezőben állsz)
   - (opcionális) "Most szól" cím/előadó lekérdezése, ha be
     van állítva a SLAM_NOWPLAYING_URL

   A slam-player-config.js UTÁN, a slam-modern-nav.js UTÁN,
   de a slam-player-minimal.js ELŐTT töltődik be (hogy mire
   az a felületet felépíti, már létezzen window.audio).
   ========================================================= */
(function () {
  function ready(fn) {
    if (document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
  }

  var STREAM_URL = window.SLAM_STREAM_URL || '';
  var NOWPLAYING_URL = window.SLAM_NOWPLAYING_URL || null;
  var VOLUME_KEY = 'slam_volume';
  var RECONNECT_DELAY_START = 3000;
  var RECONNECT_DELAY_MAX = 20000;

  ready(function () {
    if (!STREAM_URL || STREAM_URL.indexOf('ide-jon-a-te-stream-url') !== -1) {
      console.warn('[SLAM player] Nincs beállítva valódi stream URL a slam-player-config.js-ben (window.SLAM_STREAM_URL) — a lejátszó gombjai egyelőre nem fognak hangot adni.');
      return;
    }

    var audio = new Audio();
    audio.preload = 'none';
    audio.src = STREAM_URL;

    /* hangerő visszaállítása / alapérték */
    var savedVolume = parseFloat(localStorage.getItem(VOLUME_KEY));
    audio.volume = isNaN(savedVolume) ? 0.9 : savedVolume;

    window.audio = audio;

    var reconnectTimer = null;
    var reconnectDelay = RECONNECT_DELAY_START;
    var userWantsPlaying = false;

    function setStatus(status) {
      /* status: 'connecting' | 'live' | 'offline' — más
         scriptek erre feliratkozhatnak, ha szükséges */
      document.dispatchEvent(new CustomEvent('slam:stream-status', { detail: { status: status } }));
      document.body.classList.remove('slam-stream-connecting', 'slam-stream-live', 'slam-stream-offline');
      document.body.classList.add('slam-stream-' + status);
    }

    function clearReconnect() {
      if (reconnectTimer) { clearTimeout(reconnectTimer); reconnectTimer = null; }
    }

    function scheduleReconnect() {
      if (!userWantsPlaying) return;
      clearReconnect();
      setStatus('connecting');
      reconnectTimer = setTimeout(function () {
        /* a src frissen való beállítása kényszeríti ki az
           icecast-kapcsolat valódi újraépítését (egy sima
           .play() sokszor nem elég egy megszakadt streamnél) */
        audio.src = STREAM_URL + (STREAM_URL.indexOf('?') > -1 ? '&' : '?') + '_r=' + Date.now();
        audio.load();
        audio.play().catch(function () { scheduleReconnect(); });
        reconnectDelay = Math.min(reconnectDelay * 1.5, RECONNECT_DELAY_MAX);
      }, reconnectDelay);
    }

    audio.addEventListener('playing', function () {
      reconnectDelay = RECONNECT_DELAY_START;
      clearReconnect();
      setStatus('live');
    });

    audio.addEventListener('waiting', function () { if (userWantsPlaying) setStatus('connecting'); });
    audio.addEventListener('stalled', function () { scheduleReconnect(); });
    audio.addEventListener('error', function () { scheduleReconnect(); });

    audio.addEventListener('pause', function () {
      if (!userWantsPlaying) setStatus('offline');
    });

    audio.addEventListener('volumechange', function () {
      try { localStorage.setItem(VOLUME_KEY, audio.volume); } catch (e) {}
    });

    window.playPause = function () {
      if (audio.paused) {
        userWantsPlaying = true;
        setStatus('connecting');
        audio.play().catch(function () { scheduleReconnect(); });
      } else {
        userWantsPlaying = false;
        clearReconnect();
        audio.pause();
      }
    };

    /* ---- Media Session API: zárolt képernyő / böngésző-fül ---- */
    if ('mediaSession' in navigator) {
      try {
        navigator.mediaSession.metadata = new MediaMetadata({
          title: 'SLAM',
          artist: 'WE. LOVE. MUSIC',
          album: 'Élő adás'
        });
        navigator.mediaSession.setActionHandler('play', function () { window.playPause(); });
        navigator.mediaSession.setActionHandler('pause', function () { window.playPause(); });
      } catch (e) {}
    }

    /* ---- szóköz = lejátszás/szünet, ha nem beviteli mezőben állunk ---- */
    document.addEventListener('keydown', function (e) {
      if (e.code !== 'Space' && e.key !== ' ') return;
      var el = document.activeElement;
      var tag = el ? el.tagName : '';
      if (tag === 'INPUT' || tag === 'TEXTAREA' || (el && el.isContentEditable)) return;
      e.preventDefault();
      window.playPause();
    });

    /* ---- opcionális "Most szól" cím/előadó lekérdezése ---- */
    function updateNowPlaying() {
      if (!NOWPLAYING_URL) return;
      fetch(NOWPLAYING_URL)
        .then(function (r) { return r.json(); })
        .then(function (data) {
          var titleEl = document.querySelector('.slamp-meta-title');
          var subEl = document.querySelector('.slamp-meta-sub');
          if (data && data.title && titleEl) titleEl.textContent = data.title;
          if (data && data.artist && subEl) subEl.textContent = data.artist;
        })
        .catch(function () {});
    }
    if (NOWPLAYING_URL) {
      updateNowPlaying();
      setInterval(updateNowPlaying, 30000);
    }
  });
})();


/* ===== slam-player-minimal.js ===== */
/* =========================================================
   SLAM — minimál lejátszó-sáv felépítése.

   A slam-modern-nav.js már létrehozza a .slam-mini-player /
   .slam-mini-main vázat (és a görgetésre való meg-/eltűnés
   logikáját) — ez a script a BELSEJÉT cseréli le az új,
   letisztult (slamp-*) felületre, és a play/hangerő/megosztás
   interakciókat ÚJRA bekapcsolja (a régi belső elemekhez kötött
   eseménykezelők a csere után elárvulnának, hiszen a régi
   elemek kikerülnek a DOM-ból).

   A play/pause és a hangerő továbbra is ugyanazokra a globális
   hookokra épül, amiket a többi UI-elem (élő hero play-gombja
   stb.) is használ: window.audio / window.playPause — tehát
   amint elkészül a tényleges audio-motor (a stream URL-lel),
   ez a felület módosítás nélkül működni fog vele.

   A slam-modern-nav.js UTÁN töltődik be.
   ========================================================= */
(function () {
  function ready(fn) {
    if (document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
  }

  function init(attempt) {
    attempt = attempt || 0;
    var wrap = document.querySelector('.slam-mini-player');
    var main = wrap && wrap.querySelector('.slam-mini-main');
    if (!main) {
      if (attempt < 20) { setTimeout(function () { init(attempt + 1); }, 150); }
      return;
    }
    if (main.classList.contains('slamp-bar')) return; // idempotens védelem

    main.classList.add('slamp-bar');
    main.innerHTML =
      '<div class="slamp-art" aria-hidden="true">' +
        '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M9 18V6l11-2v12"></path><circle cx="6" cy="18" r="3"></circle><circle cx="17" cy="16" r="3"></circle></svg>' +
      '</div>' +
      '<div class="slamp-info">' +
        '<span class="slamp-status">' +
          '<span class="slamp-status-dot"></span>' +
          '<span class="slamp-status-label">Élő adás</span>' +
        '</span>' +
        '<span class="slamp-meta-title">SLAM</span>' +
        '<span class="slamp-meta-sub">WE. LOVE. SUMMER</span>' +
      '</div>' +
      '<button type="button" class="slamp-play" aria-label="Lejátszás / Szünet">' +
        '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"></path></svg>' +
      '</button>' +
      '<div class="slamp-volume">' +
        '<button type="button" class="slamp-vol-icon" aria-label="Némítás">' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9v6h4l5 5V4L7 9H3z"></path><path d="M16 8a5 5 0 0 1 0 8"></path></svg>' +
        '</button>' +
        '<input type="range" class="slamp-vol-range" min="0" max="1" step="0.01" value="1" aria-label="Hangerő">' +
      '</div>';

    var playBtn = main.querySelector('.slamp-play');
    var playIcon = playBtn.querySelector('svg');
    var volRange = main.querySelector('.slamp-vol-range');
    var volIcon = main.querySelector('.slamp-vol-icon');

    function setIcon(playing) {
      playIcon.innerHTML = playing
        ? '<rect x="6" y="5" width="4" height="14"></rect><rect x="14" y="5" width="4" height="14"></rect>'
        : '<path d="M8 5v14l11-7z"></path>';
      wrap.classList.toggle('playing', playing);
    }

    playBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      if (typeof window.playPause === 'function') {
        window.playPause();
      } else if (window.audio) {
        window.audio.paused ? window.audio.play() : window.audio.pause();
      }
    });

    volRange.addEventListener('click', function (e) { e.stopPropagation(); });
    volRange.addEventListener('input', function () {
      if (window.audio) window.audio.volume = parseFloat(volRange.value);
    });

    volIcon.addEventListener('click', function (e) {
      e.stopPropagation();
      if (!window.audio) return;
      window.audio.muted = !window.audio.muted;
      volIcon.style.opacity = window.audio.muted ? '.4' : '1';
    });

    function bindAudio() {
      if (!window.audio) return false;
      window.audio.addEventListener('play', function () { setIcon(true); });
      window.audio.addEventListener('pause', function () { setIcon(false); });
      setIcon(!window.audio.paused);
      volRange.value = window.audio.volume;
      return true;
    }
    if (!bindAudio()) {
      var tries = 0;
      var iv = setInterval(function () {
        tries += 1;
        if (bindAudio() || tries > 40) clearInterval(iv);
      }, 250);
    }
  }

  ready(function () { init(0); });
})();


/* ===== slam-mono-hero.js ===== */
/* =========================================================
   SLAM — minimál, prémium hero-banner beszúrása.
   Lecseréli a régi, Svelte build-elt .hero.svelte-12521vr
   szekciót a "MONO AI"-stílusú minimál bannerre: badge, nagy
   "WE. LOVE. MUSIC." címsor dőlt kiemeléssel, alcím, két CTA
   gomb, és egy "Trusted by" stílusú sáv alul.
   A lebegő kapszula-navigáció (slam-header) ettől függetlenül
   változatlanul fent marad.
   ========================================================= */
// (function () {
//   function ready(fn) {
//     if (document.readyState !== 'loading') fn();
//     else document.addEventListener('DOMContentLoaded', fn);
//   }

//   /* ---- ide írd a saját szövegedet / linkjeidet, ha mást szeretnél ---- */
//   var BADGE_TEXT = 'Élő Adás';
//   var TITLE_PLAIN_1 = 'WE. LOVE.';
//   var TITLE_ACCENT = '';
//   var TITLE_PLAIN_2 = 'MUSIC.';
//   var SUBTITLE = 'A SLAM 7/24-ben szól: élő DJ-k, friss zenék, és egy közösség, ami egy hullámhosszon van veled.';
//   var CTA_PRIMARY_TEXT = 'Hallgasd élőben';
//   var CTA_PRIMARY_HREF = '#';
//   var CTA_SECONDARY_TEXT = 'Tovább a műsorrendhez';
//   var CTA_SECONDARY_HREF = 'programmering.html';
//   var TRUSTED_LABEL = '';
//   var TRUSTED_ITEMS = [''];

//   ready(function () {
//     var oldHero = document.querySelector('.hero');
//     if (!oldHero) return;
//     if (document.querySelector('.slam-mono-hero')) return;

//     var trustedHtml = TRUSTED_ITEMS.map(function (t) {
//       return '<span>' + t + '</span>';
//     }).join('');

//     var hero = document.createElement('div');
//     hero.className = 'slam-mono-hero';
//     hero.innerHTML =
//       '<div class="slam-mono-hero-content">' +
//         '<span class="slam-mono-hero-badge">' +
//           '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l1.8 6.2L20 10l-6.2 1.8L12 18l-1.8-6.2L4 10l6.2-1.8L12 2z"></path></svg>' +
//           BADGE_TEXT +
//         '</span>' +
//         '<h1 class="slam-mono-hero-title">' + TITLE_PLAIN_1 + ' <em>' + TITLE_ACCENT + '</em> ' + TITLE_PLAIN_2 + '</h1>' +
//         '<p class="slam-mono-hero-subtitle">' + SUBTITLE + '</p>' +
//         '<div class="slam-mono-hero-ctas">' +
//           '<a class="slam-mono-hero-cta primary" href="' + CTA_PRIMARY_HREF + '">' +
//             '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"></path></svg>' +
//             CTA_PRIMARY_TEXT +
//           '</a>' +
//           '<a class="slam-mono-hero-cta secondary" href="' + CTA_SECONDARY_HREF + '">' + CTA_SECONDARY_TEXT + '</a>' +
//         '</div>' +
//       '</div>' +
//       '<div class="slam-mono-hero-trusted">' +
//         '<span class="slam-mono-hero-trusted-label">' + TRUSTED_LABEL + '</span>' +
//         '<div class="slam-mono-hero-trusted-row">' + trustedHtml + '</div>' +
//       '</div>';

//     oldHero.replaceWith(hero);

//     /* ---- "Hallgasd élőben" gomb a meglévő stream-lejátszóhoz kötve ---- */
//     var primaryCta = hero.querySelector('.slam-mono-hero-cta.primary');
//     primaryCta.addEventListener('click', function (e) {
//       if (typeof window.playPause === 'function' || window.audio) {
//         e.preventDefault();
//         if (typeof window.playPause === 'function') {
//           window.playPause();
//         } else if (window.audio) {
//           window.audio.paused ? window.audio.play() : window.audio.pause();
//         }
//       }
//     });
//   });
// })();


/* ===== slam-live-hero.js ===== */
/* =========================================================
   SLAM — élő hero (újragondolt dizájn), vanilla JS.
   Nagy kártyás elrendezés: bal sötét panel (monogram/fotó
   + glow), jobb panel (Hackney cím, DJ, következő, play).
   ========================================================= */
(function () {
  function ready(fn) {
    if (document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
  }


  function toMins(t) {
    var p = t.split(':').map(Number); return p[0]*60 + p[1];
  }

  function findCurrentShow(shows) {
    var jsDay = new Date().getDay();
    var idx = jsDay === 0 ? 6 : jsDay - 1;
    var list = shows[idx] || [];
    var now = new Date();
    var nowM = now.getHours()*60 + now.getMinutes();
    for (var i=0; i<list.length; i++) {
      var s = list[i], start = toMins(s.time), end = toMins(s.end);
      if (end < start) end += 1440;
      var nowA = nowM;
      if (end > 1440 && nowM < start) nowA += 1440;
      if (nowA >= start && nowA < end) return s;
    }
    return null;
  }

  function findNextShow(shows) {
    var jsDay = new Date().getDay();
    var idx = jsDay === 0 ? 6 : jsDay - 1;
    var list = shows[idx] || [];
    var now = new Date();
    var nowM = now.getHours()*60 + now.getMinutes();
    for (var i=0; i<list.length; i++) {
      if (toMins(list[i].time) > nowM) return list[i];
    }
    return (shows[(idx+1)%7] || [])[0] || null;
  }

  function esc(str) {
    return String(str||'').replace(/[&<>"']/g, function(c) {
      return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];
    });
  }

  ready(function () {
    var oldHero = document.querySelector('.hero, .slam-mono-hero');
    if (!oldHero) return;
    if (document.querySelector('.slam-live-hero')) return;

    var shows = window.SHOWS || FALLBACK_SHOWS;
    var current = findCurrentShow(shows);
    var next = findNextShow(shows);

    var name    = current ? current.name   : 'SLAM Non-Stop';
    var dj      = current && current.dj ? current.dj : 'SLAM Radio';
    var timeStr = current ? current.time + '–' + current.end : '';
    var photo   = current && current.photo;
    var initial = (current && current.initial) || name.charAt(0);

    /* ---- a most szóló műsor adatainak továbbadása a mini- és a
       teljes képernyős lejátszónak (slam-modern-nav.js hallgatja) ---- */
    (function broadcastNowPlaying() {
      var progressPct = null, remainMin = null;
      if (current) {
        var startM = toMins(current.time), endM = toMins(current.end);
        if (endM < startM) endM += 1440;
        var nowM = new Date().getHours() * 60 + new Date().getMinutes();
        if (endM > 1440 && nowM < startM) nowM += 1440;
        progressPct = Math.max(0, Math.min(100, ((nowM - startM) / (endM - startM)) * 100));
        remainMin = Math.max(0, Math.round(endM - nowM));
      }
      document.dispatchEvent(new CustomEvent('slam:now-playing', {
        detail: {
          current: !!current,
          name: name,
          dj: dj,
          photo: photo || null,
          initial: initial,
          progressPct: progressPct,
          remainMin: remainMin,
          next: next ? { name: next.name, dj: next.dj, time: next.time } : null
        }
      }));
    })();

    /* bal panel: fotó vagy monogram */
    var artHtml = photo
      ? '<img src="' + esc(photo) + '" alt="' + esc(dj) + '">'
      : '<div class="slam-live-monogram">' + esc(initial) + '</div>';

    /* DJ avatar monogram (első betű) */
    var djInitial = dj ? dj.charAt(0) : 'S';

    /* következő műsor */
    var nextHtml = '';
    if (next) {
      nextHtml =
        '<div class="slam-live-next-block">' +
          '<span class="slam-live-next-label">Következik</span>' +
          '<div class="slam-live-next-info">' +
            '<span class="slam-live-next-name">' + esc(next.name) + '</span>' +
            '<span class="slam-live-next-time">' +
              (next.dj ? esc(next.dj) + ' · ' : '') + esc(next.time) +
            '</span>' +
          '</div>' +
        '</div>';
    }

    var djRowHtml = dj
      ? '<div class="slam-live-dj-row">' +
          '<div class="slam-live-dj-avatar">' + esc(djInitial) + '</div>' +
          '<span class="slam-live-dj-name">' + esc(dj) + '</span>' +
        '</div>'
      : '';

    var timeHtml = timeStr
      ? '<span class="slam-live-time-pill">' + esc(timeStr) + '</span>'
      : '';

    var hero = document.createElement('div');
    hero.className = 'slam-live-hero' + (current ? '' : ' is-offline');
    hero.innerHTML =
      '<div class="slam-live-card">' +
        /* bal panel */
        '<div class="slam-live-left">' +
          '<span class="slam-live-badge">' +
            '<span class="slam-live-badge-dot"></span>' +
            (current ? 'Élőben' : 'Most szól') +
          '</span>' +
          '<div class="slam-live-art-wrap">' + artHtml + '</div>' +
        '</div>' +
        /* jobb panel */
        '<div class="slam-live-right">' +
          '<div class="slam-live-eyebrow">' +
            '<span class="slam-live-eyebrow-label">Most szól</span>' +
            timeHtml +
          '</div>' +
          '<h2 class="slam-live-show-title">' + esc(name) + '</h2>' +
          djRowHtml +
          '<div class="slam-live-sep"></div>' +
          '<div class="slam-live-track">' +
            '<span class="slam-live-track-label">Nu</span>' +
            '<div class="slam-live-track-art">' +
              '<span class="slam-live-track-art-placeholder">♪</span>' +
            '</div>' +
            '<div class="slam-live-track-info">' +
              '<span class="slam-live-track-title" id="slam-track-title">—</span>' +
              '<span class="slam-live-track-artist" id="slam-track-artist">SLAM Radio</span>' +
            '</div>' +
          '</div>' +
          '<div class="slam-live-bottom">' +
            nextHtml +
            '<div class="slam-live-actions">' +
              '<button type="button" class="slam-live-play" aria-label="Lejátszás / Szünet">' +
                '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"></path></svg>' +
              '</button>' +
              '<a class="slam-live-more" href="programmering.html">' +
                'Műsorrend' +
                '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"></path></svg>' +
              '</a>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>';

    oldHero.replaceWith(hero);

    /* play/pause logika */
    var playBtn = hero.querySelector('.slam-live-play');
    var playIcon = playBtn.querySelector('svg');

    function setIcon(playing) {
      playIcon.innerHTML = playing
        ? '<rect x="6" y="5" width="4" height="14"></rect><rect x="14" y="5" width="4" height="14"></rect>'
        : '<path d="M8 5v14l11-7z"></path>';
      playBtn.classList.toggle('playing', playing);
    }

    playBtn.addEventListener('click', function() {
      if (typeof window.playPause === 'function') window.playPause();
      else if (window.audio) { window.audio.paused ? window.audio.play() : window.audio.pause(); }
    });

    function bindAudio() {
      if (!window.audio) return false;
      window.audio.addEventListener('play',  function() { setIcon(true); });
      window.audio.addEventListener('pause', function() { setIcon(false); });
      setIcon(!window.audio.paused);
      return true;
    }
    if (!bindAudio()) {
      var tries = 0;
      var iv = setInterval(function() { if (bindAudio() || ++tries > 20) clearInterval(iv); }, 250);
    }

    /* percenként auto-refresh sávváltásra */
    setInterval(function() {
      var fresh = findCurrentShow(shows);
      if (!fresh || !current) return;
      if (fresh.name === current.name && fresh.time === current.time) return;
      window.location.reload();
    }, 60000);
  });
})();


/* ===== slam-footer-reimagined.js ===== */
/* =========================================================
   SLAM — footer újragondolása: tartalmasabb, "teljes weboldalas"
   footer felépítése (vanilla JS).

   A statikus mentés footere csak két link-oszlopot és egy
   copyright-sort tartalmaz, miközben a build-elt CSS
   (0_b9ef364e.css) már kész, csak üresen maradt osztályokat is
   tartalmaz egy jogi-linksorhoz (.footer-legal / .link-legal-item)
   — ezeket itt töltjük fel valódi tartalommal, ahelyett hogy új,
   saját osztályokat találnánk ki rájuk (így automatikusan
   öröklik a már meglévő stílust).

   Emellett beszúr egy "signature" CTA/hírlevél-panelt a footer
   tetejére (a hero nagy, színes WE.LOVE.MUSIC-típusú tipográfiáját
   idézve), egy harmadik sitemap-oszlopot, és egy jogi linksort.

   A "vissza a tetejére" gomb NEM a footerhez van kötve — egy
   fix pozíciós, az egész oldalon (minden aloldalon, görgetési
   pozíciótól függetlenül felbukkanó) gomb, ezért a footertől
   függetlenül, a fájl elején jön létre.

   A slam-modern-nav.js UTÁN futhat le bármikor (nem függ tőle),
   de a footernek már a DOM-ban kell lennie a footer-specifikus
   résznél — ezért DOMContentLoaded után fut.
   ========================================================= */
(function () {
  function ready(fn) {
    if (document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
  }

  var prefersReducedMotion = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  ready(function () {
    /* ---- globális "vissza a tetejére" gomb — minden aloldalon
       működik, görgetésre jelenik meg, nem köthető a footerhez ---- */
    if (!document.querySelector('.slam-backtotop')) {
      var backToTop = document.createElement('button');
      backToTop.type = 'button';
      backToTop.className = 'slam-backtotop';
      backToTop.setAttribute('aria-label', 'Vissza a tetejére');
      backToTop.innerHTML =
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19V5"></path><path d="M5 12l7-7 7 7"></path></svg>';
      document.body.appendChild(backToTop);

      backToTop.addEventListener('click', function () {
        window.scrollTo({ top: 0, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
      });

      var lastBackToTopState = false;
      function updateBackToTopVisibility() {
        var show = window.scrollY > 480;
        if (show !== lastBackToTopState) {
          backToTop.classList.toggle('visible', show);
          lastBackToTopState = show;
        }
      }
      window.addEventListener('scroll', updateBackToTopVisibility, { passive: true });
      updateBackToTopVisibility();
    }

    /* ---- footer-kiegészítés (CTA/hírlevél + extra oszlop + jogi linkek) ----
       FONTOS: a footer maga csak KÉSŐBB, JS-ből kerül be a DOM-ba
       (lásd a fájl végén a #slam-footer-mount-ot lecserélő kód) — ha ez
       a rész (ami DOMContentLoaded-re fut) HAMARABB lefut, mint ahogy a
       footer ténylegesen a DOM-ba kerül, a régi "if (!footer) return;"
       egyszeri próbálkozás után simán feladta, és a CTA-sáv sosem került
       be. Itt is ugyanaz az újrapróbálkozós mintát használjuk, mint a
       footer-mountolásnál: legfeljebb 30 × 200ms-enként (6 mp) újra
       megnézzük, amíg a footer meg nem jelenik. */
    function augmentFooter() {
      var footer = document.querySelector('.footer.svelte-tk8rio');
      if (!footer) return false;
      if (footer.querySelector('.slam-footer-cta')) return true; // idempotens védelem

      var footerMain = footer.querySelector('.footer-main.svelte-tk8rio');

      /* ---- 1) CTA / hírlevél panel a footer tetején ---- */
      var cta = document.createElement('div');
      cta.className = 'slam-footer-cta';
      cta.innerHTML =
        '<div class="slam-footer-cta-text">' +
          '<h2 class="slam-footer-cta-title">' +
            '<span class="blue">NE.</span> <span class="green">MARADJ.</span> <span>LE.</span>' +
          '</h2>' +
          '<p class="slam-footer-cta-subtitle">' +
            'Iratkozz fel a SLAM hírlevélre, és elsőként értesülsz az új ' +
            'műsorokról, élő eseményekről és DJ-felállásokról.' +
          '</p>' +
        '</div>' +
        '<form class="slam-footer-newsletter" novalidate>' +
          '<label class="slam-footer-newsletter-label" for="slam-footer-email">E-mail cím</label>' +
          '<div class="slam-footer-newsletter-field">' +
            '<input id="slam-footer-email" type="email" name="email" placeholder="te@email.hu" autocomplete="email" required>' +
            '<button type="submit">' +
              'Feliratkozom' +
              '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"></path><path d="M13 6l6 6-6 6"></path></svg>' +
            '</button>' +
          '</div>' +
          '<p class="slam-footer-newsletter-note" aria-live="polite"></p>' +
        '</form>';

      if (footerMain) {
        footer.insertBefore(cta, footerMain);
      } else {
        footer.insertBefore(cta, footer.firstChild);
      }

      /* ---- a feliratkozás-form kezelése ----
         MEGJEGYZÉS: itt nincs valódi hírlevél-backend, csak vizuális
         visszajelzést adunk. Cseréld le a saját hírlevél-szolgáltatód
         (pl. Mailchimp, Brevo, MailerLite) végpontjára / API-hívására. */
      var form = cta.querySelector('.slam-footer-newsletter');
      var note = form.querySelector('.slam-footer-newsletter-note');
      var emailInput = form.querySelector('input[type="email"]');

      form.addEventListener('submit', function (e) {
        e.preventDefault();
        if (!emailInput.value || !emailInput.checkValidity()) {
          note.textContent = 'Adj meg egy érvényes e-mail címet.';
          note.classList.remove('success');
          note.classList.add('error');
          return;
        }
        note.textContent = 'Köszönjük! Hamarosan jelentkezünk.';
        note.classList.remove('error');
        note.classList.add('success');
        form.reset();
      });

      /* ---- 2) harmadik sitemap-oszlop, a meglévő link-table
         osztályokkal (így automatikusan öröklik a meglévő stílust) ---- */
      var footerRight = footer.querySelector('.footer-right.svelte-tk8rio');
      if (footerRight) {
        var extraColumn = document.createElement('div');
        extraColumn.className = 'links-table svelte-tk8rio';
        extraColumn.innerHTML =
          '<div class="link-header svelte-tk8rio">Egyéb</div>' +
          '<a class="link-item svelte-tk8rio" href="#">GYIK</a>' +
          '<a class="link-item svelte-tk8rio" href="#">Médiaajánlat</a>' +
          '<a class="link-item svelte-tk8rio" href="#">Karrier</a>' +
          '<a class="link-item svelte-tk8rio" href="#">Sajtószoba</a>';
        footerRight.appendChild(extraColumn);
      }

      /* ---- 3) jogi linksor a footer alján, a build-ben már kész
         (de eddig üres) .footer-legal / .link-legal-item osztályokkal ---- */
      var footerBottom = footer.querySelector('.footer-bottom.svelte-tk8rio');
      if (footerBottom && !footerBottom.querySelector('.footer-legal')) {
        var legal = document.createElement('div');
        legal.className = 'footer-legal svelte-tk8rio';
        legal.innerHTML =
          '<a class="link-legal-item svelte-tk8rio" href="#">Adatvédelem</a>' +
          '<a class="link-legal-item svelte-tk8rio" href="#">ÁSZF</a>' +
          '<a class="link-legal-item svelte-tk8rio" href="#">Cookie-beállítások</a>';
        footerBottom.appendChild(legal);
      }
      return true;
    }

    if (!augmentFooter()) {
      var footerTries = 0;
      var footerIv = setInterval(function () {
        footerTries += 1;
        if (augmentFooter() || footerTries > 30) clearInterval(footerIv);
      }, 200);
    }
  });
})();


/* ===== slam-reorder.js ===== */
/* =========================================================
   SLAM — tartalom-átrendezési eszköztár (JS-es technikák).
   Ez a fájl a DOM-ban TÉNYLEGESEN mozgatja az elemeket
   (insertBefore / before / after), nem csak vizuálisan —
   ez a biztos megoldás akkor, ha a CSS "order" nem elég
   (pl. eltérő szülő, vagy a tabsorrendnek is követnie kell
   a vizuális sorrendet).

   A szekciókat NEM pozíció (nth-child), hanem a látható
   CÍMSZÖVEGÜK alapján azonosítja — így akkor is jól működik,
   ha a build változik és a sorrend/számuk módosul.

   A slam-modern-nav.js UTÁN töltődik be (a fejléc/dock/mini-player
   beszúrása után), hogy biztosan a végleges DOM-on dolgozzon.
   ========================================================= */
(function () {
  function ready(fn) {
    if (document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
  }

  /* ---------------------------------------------------------
     1) FŐ SZEKCIÓK SORRENDJE cím szerint
     Írd ide a kívánt sorrendet a szekciók látható
     cím-szövegével (ahogy a `<h2>`/`.title`-ben megjelenik) —
     pontos egyezés nem kell, kis/nagybetű és részleges
     egyezés is elég (pl. "műsor" megtalálja a "Műsorok"-at).
     --------------------------------------------------------- */
  var DESIRED_SECTION_ORDER = [
    'trending',   // "Trending" karuszel — legelöl
    'action',     // "Actions" — legelöl
    'műsor',      // "Műsorok"
    'dj',         // "DJ's"
    'állomás'     // "Állomások"
  ];

  /* NEM köti meg, melyik konkrét szülőben vannak a szekciók —
     bárhol megtalálja őket a dokumentumban, a tényleges közös
     szülőjük szerint csoportosítva rendezi át (úgy is működik,
     ha több, eltérő szülőjű csoport van a lapon). Ha a tartalom
     még nincs betöltve (késleltetett/CSR render), néhányszor
     újra próbálkozik. A konzolba kiírja, mit talált — ezzel
     könnyű ellenőrizni a böngésző DevTools-ában (F12 → Console),
     hogy a szelektorok illeszkednek-e. */
  function reorderSectionsByTitle(sectionSelector, titleSelector, order, attempt) {
    attempt = attempt || 0;
    var sections = Array.prototype.slice.call(
      document.querySelectorAll(sectionSelector)
    );

    if (!sections.length) {
      if (attempt < 20) {
        setTimeout(function () {
          reorderSectionsByTitle(sectionSelector, titleSelector, order, attempt + 1);
        }, 250);
      } else {
        console.warn('[slam-reorder] nem található szekció ezzel a szelektorral:', sectionSelector);
      }
      return;
    }

    var groups = [];
    sections.forEach(function (el) {
      var parent = el.parentElement;
      if (!parent) return;
      var group = groups.filter(function (g) { return g.parent === parent; })[0];
      if (!group) {
        group = { parent: parent, items: [] };
        groups.push(group);
      }
      group.items.push(el);
    });

    groups.forEach(function (group) {
      var ranked = group.items.map(function (el, i) {
        var titleEl = el.querySelector(titleSelector);
        var text = (titleEl ? titleEl.textContent : '').trim().toLowerCase();
        var r = order.length;
        for (var j = 0; j < order.length; j++) {
          if (text.indexOf(order[j].toLowerCase()) !== -1) { r = j; break; }
        }
        return { el: el, r: r, i: i, text: text };
      });

      console.log('[slam-reorder] talált szekciók (' + ranked.length + '):',
        ranked.map(function (item) { return '"' + item.text + '" -> rang ' + item.r; }));

      ranked.sort(function (a, b) { return a.r - b.r || a.i - b.i; });
      ranked.forEach(function (item) { group.parent.appendChild(item.el); });
    });
  }

  /* ---------------------------------------------------------
     2) OLDALSÁV (cikk-lista) mozgatása mobilon a tartalom ELÉ
     --------------------------------------------------------- */
  function moveSidebarBeforeContentOnMobile() {
    var wrap = document.querySelector('.content-with-sidebar.svelte-g95ik7');
    if (!wrap) return;
    var main = wrap.querySelector('.content.svelte-g95ik7');
    var sidebar = wrap.querySelector('.sidebar.svelte-g95ik7');
    if (!main || !sidebar) return;

    function applyForViewport() {
      if (window.innerWidth <= 1200) {
        wrap.insertBefore(sidebar, main); // sidebar előre
      } else {
        wrap.insertBefore(main, sidebar); // visszaállítás desktopon
      }
    }
    applyForViewport();
    window.addEventListener('resize', applyForViewport);
  }

  /* ---------------------------------------------------------
     3) MOBIL DOKK / MENÜ LINKEK SORRENDJE
     A dokk és a lenyíló mobilmenü a slam-modern-nav.js-ben épül
     fel a NAV_LINKS tömbből — ha CSAK a sorrendet akarod
     módosítani, a legegyszerűbb ott a tömb átírása. Ha mégis
     futásidőben (ettől a fájltól) akarod átrendezni:
     --------------------------------------------------------- */
  function reorderNavLinksByHref(navSelector, linkSelector, hrefOrder) {
    var nav = document.querySelector(navSelector);
    if (!nav) return;
    var links = Array.prototype.slice.call(nav.querySelectorAll(linkSelector));
    links
      .map(function (a, i) {
        var idx = hrefOrder.indexOf(a.getAttribute('href'));
        return { el: a, r: idx === -1 ? hrefOrder.length : idx, i: i };
      })
      .sort(function (a, b) { return a.r - b.r || a.i - b.i; })
      .forEach(function (item) { nav.appendChild(item.el); });
  }

  /* ---------------------------------------------------------
     4) HERO MOZGATÁSA máshová (pl. az al-navigáció UTÁNRA)
     --------------------------------------------------------- */
  function moveHeroAfter(selector) {
    var hero = document.querySelector('.hero');
    var target = document.querySelector(selector);
    if (!hero || !target) return;
    target.insertAdjacentElement('afterend', hero);
  }

  ready(function () {
    /* --- kapcsold be / módosítsd azokat a sorokat, amikre szükséged van --- */

    reorderSectionsByTitle(
      '.section, .swimlane-module, .carousel-section, [class*="section"], [class*="swimlane"]',
      'h2, .title',
      DESIRED_SECTION_ORDER
    );

    moveSidebarBeforeContentOnMobile();

    // Példa: a "Kapcsolat" link kerüljön a dokkban előre
    // reorderNavLinksByHref('.slam-dock', 'a', [
    //   'artikelen/contact.html', 'index.html', 'ontdek.html', 'programmering.html'
    // ]);

    // Példa: a hero kerüljön az al-navigáció (subnavigation) UTÁN
    // moveHeroAfter('.subnavigation');
  });
})();


/* ===== slam-article.js ===== */
/* =========================================================
   SLAM — cikk-oldal: Spotify-embedek automatikus becsomagolása
   sorszámozott "track-row" konténerekbe (lásd slam-article.css).
   Mivel a statikus, Mirror-elt cikk-markup az iframe-eket
   közvetlenül a .prose div-be ágyazza (wrapper nélkül), ez a
   script fut le elsőként és csomagolja be őket — utána a CSS
   már csak a kész struktúrát stílusozza.
   A slam-modern-nav.js UTÁN bárhol betölthető.
   ========================================================= */
(function () {
  function ready(fn) {
    if (document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
  }

  ready(function () {
    var prose = document.querySelector('.article .prose');
    if (!prose) return;
    if (prose.querySelector('.slam-track-row')) return; // idempotens védelem

    var iframes = Array.prototype.slice.call(
      prose.querySelectorAll('iframe[src*="open.spotify.com"]')
    );
    if (!iframes.length) return;

    iframes.forEach(function (iframe, i) {
      var row = document.createElement('div');
      row.className = 'slam-track-row';
      row.setAttribute('data-track-num', i + 1);
      iframe.parentNode.insertBefore(row, iframe);
      row.appendChild(iframe);
    });

    /* a régi <br> elválasztók már feleslegesek a sorközök
       miatt — eltávolítjuk a DOM-ból is, nem csak vizuálisan */
    prose.querySelectorAll('br').forEach(function (br) {
      br.remove();
    });
  });
})();


/* ===== slam-depth-background.js ===== */
/* =========================================================
   SLAM — aurora mesh-gradient háttérréteg beszúrása.
   A slam-depth-background.css ehhez az elemhez animálja a
   két konikus-gradiens "napot" és a rácsmintát.
   ========================================================= */
(function () {
  function ready(fn) {
    if (document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
  }

  ready(function () {
    if (document.querySelector('.slam-aurora')) return;
    var aurora = document.createElement('div');
    aurora.className = 'slam-aurora';
    aurora.setAttribute('aria-hidden', 'true');
    aurora.innerHTML = '<div class="slam-grid"></div>';
    document.body.insertBefore(aurora, document.body.firstChild);
  });
})();

(function () {

  var CSS = ""
  + "@import url('https://fonts.googleapis.com/css2?family=Inter:wght@700;900&display=swap');"
  + ":root{--slam-green:#11E281;--slam-green-2:#27dc54;--slam-blue:#0260F0;--ink:#050708;--ink-2:#0c0f10;}"
  + ".slam-nav{position:relative;background:var(--ink);color:#fff;display:flex;align-items:center;gap:25.6px;padding:0 25.6px;height:70.4px;box-sizing:border-box;}"
  + ".slam-nav-left{display:flex;align-items:center;gap:30.4px;z-index:1;}"
  + ".slam-nav-burger{flex-shrink:0;width:35.2px;height:35.2px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:5.44px;background:none;border:none;cursor:pointer;padding:0;}"
  + ".slam-nav-burger span{display:block;width:100%;height:3.4px;background:#fff;border-radius:2px;transition:transform .25s ease,opacity .2s ease;}"
  + ".slam-nav-burger.is-open span:nth-child(1){transform:translateY(7.4px) rotate(45deg);}"
  + ".slam-nav-burger.is-open span:nth-child(2){opacity:0;}"
  + ".slam-nav-burger.is-open span:nth-child(3){transform:translateY(-7.4px) rotate(-45deg);}"
  + ".slam-nav-logo{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);display:flex;align-items:center;justify-content:center;height:70px;max-width:44%;text-decoration:none;}"
  + ".slam-nav-logo .logo-img{max-height:100%;max-width:100%;width:auto;height:auto;display:block;}"
  + ".slam-nav-links{display:flex;align-items:center;gap:33.6px;}"
  + ".slam-nav-links a{color:#fff;text-decoration:none;font:800 15.2px/1 'Inter',sans-serif;text-transform:uppercase;letter-spacing:.05em;white-space:nowrap;transition:opacity .15s ease;}"
  + ".slam-nav-links a:hover{opacity:.75;}"
  + ".slam-nav-right{display:flex;align-items:center;gap:22.4px;margin-left:auto;z-index:1;}"
  + ".slam-nav-search{display:flex;flex-direction:row-reverse;align-items:center;gap:8px;background:none;border:none;color:#fff;cursor:pointer;font:800 13.12px/1 'Inter',sans-serif;text-transform:uppercase;letter-spacing:.04em;}"
  + ".slam-nav-search svg{width:18.4px;height:18.4px;}"
  + ".slam-nav-account{display:flex;align-items:center;gap:9.6px;color:var(--ink);text-decoration:none;background:#ffffff;padding:8px 24px 9.6px 11.2px;border-radius:1000px 0px 0px 1000px;font:800 16px/1 'Inter',sans-serif;text-transform:uppercase;letter-spacing:.02em;white-space:nowrap;margin-right:-25.6px;transition:background .2s ease,padding .2s ease;}"
  + ".slam-nav-account:hover{background:#d5d5d8;}"
  + ".slam-nav-account .avatar{width:32px;height:32px;display:flex;align-items:center;justify-content:center;flex-shrink:0;}"
  + ".slam-nav-account .avatar svg{width:100%;height:100%;color:var(--ink);}"
  + ".slam-nav-links-row2{display:none;background:var(--ink-2);border-bottom:1px solid rgba(255,255,255,.08);padding:12.8px 25.6px;gap:27.2px;}"
  + ".slam-nav-links-row2 a{color:#fff;text-decoration:none;font:800 14.08px/1 'Inter',sans-serif;text-transform:uppercase;letter-spacing:.04em;white-space:nowrap;transition:opacity .15s ease;}"
  + ".slam-nav-links-row2 a:hover{opacity:.75;}"
  + "@media (max-width:900px){.slam-nav-links{display:none;}.slam-nav-links-row2{display:flex;}}"
  + "@media (max-width:560px){.slam-nav{height:62.4px;padding:0 17.6px;gap:16px;}.slam-nav-logo{height:35.2px;max-width:46%;}.slam-nav-right{gap:12.8px;}.slam-nav-search span.label{display:none;}.slam-nav-account .label{display:none;}.slam-nav-account{padding:7.2px;margin-right:-17.6px;}.slam-nav-links-row2{overflow-x:auto;padding:11.2px 17.6px;}.slam-nav-links-row2::-webkit-scrollbar{display:none;}}"
  + ".slam-drawer-backdrop{position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:998;opacity:0;pointer-events:none;transition:opacity .3s ease;}"
  + ".slam-drawer-backdrop.is-open{opacity:1;pointer-events:auto;}"
  + ".slam-drawer{position:fixed;top:0;bottom:0;left:0;width:100%;max-width:340px;background:var(--ink-2);color:#fff;z-index:999;display:flex;flex-direction:column;padding:22.4px 25.6px 32px;transform:translateX(-100%);transition:transform .32s cubic-bezier(.4,0,.2,1);overflow-y:auto;box-shadow:18px 0 40px -20px rgba(0,0,0,.6);}"
  + ".slam-drawer.is-open{transform:translateX(0);}"
  + ".slam-drawer-top{display:flex;justify-content:flex-end;margin-bottom:25.6px;}"
  + ".slam-drawer-close{width:35.2px;height:35.2px;background:none;border:none;color:#fff;cursor:pointer;display:flex;align-items:center;justify-content:center;}"
  + ".slam-drawer-close svg{width:22.4px;height:22.4px;}"
  + ".slam-drawer-list{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;}"
  + ".slam-drawer-list li{border-bottom:1px solid rgba(255,255,255,.08);}"
  + ".slam-drawer-list a{display:flex;align-items:center;justify-content:space-between;gap:16px;padding:18.4px 0;color:#fff;text-decoration:none;font:800 16.8px/1 'Inter',sans-serif;text-transform:uppercase;letter-spacing:.02em;}"
  + ".slam-drawer-list a svg{width:18.4px;height:18.4px;flex-shrink:0;color:var(--slam-green);}"
  + ".slam-drawer-list li.is-sub a{font-size:15.2px;color:rgba(255,255,255,.85);padding-left:3.2px;}"
  + ".slam-drawer-social-label{margin-top:32px;font:800 12.8px/1 'Inter',sans-serif;text-transform:uppercase;letter-spacing:.04em;color:rgba(255,255,255,.55);}"
  + ".slam-drawer-socials{display:flex;gap:11.2px;margin-top:12.8px;flex-wrap:wrap;}"
  + ".slam-drawer-socials a{width:41.6px;height:41.6px;border-radius:9px;background:var(--slam-green);display:flex;align-items:center;justify-content:center;color:var(--ink);}"
  + ".slam-drawer-socials a svg{width:20px;height:20px;}"
  + ".slam-drawer-brand{margin-top:35.2px;display:flex;align-items:center;}"
  + ".slam-drawer-brand .logo-img{height:25.6px;width:auto;opacity:.8;}"
  + "body.no-scroll{overflow:hidden;}";

  var HTML = ''
  + '<nav class="slam-nav">'
  +   '<div class="slam-nav-left">'
  +     '<button class="slam-nav-burger" id="scBurgerBtn" aria-label="Menü"><span></span><span></span><span></span></button>'
  +     '<div class="slam-nav-links">'
  +       '<a href="index.html" class="active">Kezdőlap</a>'
  +       '<a href="ontdek.html">Blogjaink</a>'
  +       '<a href="programmering.html">Rádió</a>'
  +     '</div>'
  +   '</div>'
  +   '<a class="slam-nav-logo" href="index.html">'
  +     '<img src="img/01/logomenuhoz.png" alt="SLAM Rádió" class="logo-img">'
  +   '</a>'
  +   '<div class="slam-nav-right">'
  +     '<a class="slam-nav-account" href="#">'
  +       '<span class="avatar"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 12a5 5 0 1 0 0-10 5 5 0 0 0 0 10Zm0 2c-4 0-9 2-9 6v2h18v-2c0-4-5-6-9-6Z"/></svg></span>'
  +       '<span class="label">Fiókom</span>'
  +     '</a>'
  +   '</div>'
  + '</nav>'
  + '<div class="slam-nav-links-row2">'
  +   '<a href="index.html" class="active">Kezdőlap</a>'
  +   '<a href="ontdek.html">Blogjaink</a>'
  +   '<a href="programmering.html">Rádió</a>'
  + '</div>'
  + '<div class="slam-drawer-backdrop" id="scBackdrop"></div>'
  + '<div class="slam-drawer" id="scDrawer">'
  +   '<div class="slam-drawer-top">'
  +     '<button class="slam-drawer-close" id="scDrawerClose" aria-label="Bezárás">'
  +       '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M6 6l12 12M18 6 6 18"/></svg>'
  +     '</button>'
  +   '</div>'
  +   '<ul class="slam-drawer-list">'
  +     '<li><a href="index.html">Kezdőlap</a></li>'
  +     '<li><a href="ontdek.html">Blogjaink <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M5 12h14M13 6l6 6-6 6"/></svg></a></li>'
  +     '<li><a href="programmering.html">Rádió <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M5 12h14M13 6l6 6-6 6"/></svg></a></li>'
  +     '<li><a href="https://www.twitch.tv/slamhu" target="_blank">SLAM TV <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M5 12h14M13 6l6 6-6 6"/></svg></a></li>'
  +   '</ul>'
  +   '<div class="slam-drawer-social-label">Kövess minket!</div>'
  +   '<div class="slam-drawer-socials">'
  +     '<a href="https://www.facebook.com/slamwelovemusic" aria-label="Facebook"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M13.5 21v-8h2.7l.4-3.1h-3.1V8c0-.9.25-1.5 1.55-1.5H17V3.6C16.7 3.55 15.7 3.5 14.6 3.5c-2.3 0-3.9 1.4-3.9 4v2.4H8v3.1h2.7V21h2.8Z"/></svg></a>'
  +     '<a href="https://www.instagram.com/slamwelovemusic/" aria-label="Instagram"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.2" cy="6.8" r="1"/></svg></a>'
  +     '<a href="https://www.youtube.com/@slamhu" aria-label="YouTube"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M21.6 7.2s-.2-1.5-.8-2.1c-.8-.8-1.7-.8-2.1-.9C15.9 4 12 4 12 4h0s-3.9 0-6.7.2c-.4 0-1.3.1-2.1.9-.6.6-.8 2.1-.8 2.1S2.2 9 2.2 10.7v1.6c0 1.8.2 3.5.2 3.5s.2 1.5.8 2.1c.8.8 1.8.8 2.3.9 1.7.1 6.5.2 6.5.2s3.9 0 6.7-.2c.4 0 1.3-.1 2.1-.9.6-.6.8-2.1.8-2.1s.2-1.7.2-3.5v-1.6c0-1.7-.2-3.5-.2-3.5ZM9.9 14.6V8.9l5.4 2.9-5.4 2.8Z"/></svg></a>'
  // +     '<a href="#" aria-label="TikTok"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M16.6 3c.3 2 1.6 3.6 3.5 4v2.7c-1.4 0-2.7-.4-3.8-1.2v6.4c0 3.3-2.7 6-6 6a6 6 0 0 1-1.8-11.7v2.9a3 3 0 1 0 4 2.8V3h4.1Z"/></svg></a>'
  +   '</div>'
  + '</div>';

  function wireBurger(burgerId, drawerId, closeId, backdropId){
    var burger = document.getElementById(burgerId);
    var drawer = drawerId ? document.getElementById(drawerId) : null;
    var closeBtn = closeId ? document.getElementById(closeId) : null;
    var backdrop = backdropId ? document.getElementById(backdropId) : null;
    if(!burger) return;
    function close(){
      burger.classList.remove('is-open');
      if(drawer) drawer.classList.remove('is-open');
      if(backdrop) backdrop.classList.remove('is-open');
      document.body.classList.remove('no-scroll');
    }
    burger.addEventListener('click', function(){
      var open = burger.classList.toggle('is-open');
      if(drawer){
        drawer.classList.toggle('is-open', open);
        document.body.classList.toggle('no-scroll', open);
      }
      if(backdrop) backdrop.classList.toggle('is-open', open);
    });
    if(closeBtn) closeBtn.addEventListener('click', close);
    if(backdrop) backdrop.addEventListener('click', close);
  }

  function inject() {
    if (document.getElementById('slam-custom-header')) return; // ne szúrja be kétszer

    var style = document.createElement('style');
    style.id = 'slam-custom-header-style';
    style.textContent = CSS;
    document.head.appendChild(style);

    var wrap = document.createElement('div');
    wrap.id = 'slam-custom-header';
    wrap.innerHTML = HTML;

    // A body LEGELEJÉRE szúrjuk be, a Svelte-app DOM-fáján KÍVÜLRE,
    // hogy az app újrarenderelése soha ne tudja eltávolítani/felülírni.
    document.body.insertBefore(wrap, document.body.firstChild);

    wireBurger('scBurgerBtn', 'scDrawer', 'scDrawerClose', 'scBackdrop');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inject);
  } else {
    inject();
  }

})();

/* =========================================================
   SLAM — TELJES KÉPERNYŐS LEJÁTSZÓ: ÚJ BŐR (skin)

   A slam-all.js-ben lévő .slam-full-player panelt öltözteti át
   a referencia-képek alapján:

     - az eredeti kék player-bg.png HÁTTÉR MARAD (ezt nem
       vesszük ki, csak a felette lévő elemeket öltöztetjük)
     - a teljes tartalom (borító + szöveg + hangerő + gombsor +
       alsó két kör gomb) EGYBEN, kompaktan van középre igazítva,
       nincs nagy üres hely a hangerő-sáv és a Playlist/Play/Nézd
       élőben sor között
     - nagy, négyzetes borító lágy árnyékkal, középen
     - nagy zöld kör play-gomb alul
     - fent két szürke kör gomb, ÁTHELYEZVE alulra: bezárás
       (chevron) és Alvásidő (hold ikon) — az Alvásidő gombot
       ez a script teszi be, a megosztás gomb mellé; kattintásra
       egy kis felugró panelt nyit (15 / 30 / 45 / 60 perc /
       kikapcsolva), a kiválasztott idő lejártakor megállítja
       a lejátszást
     - a badge ("ÉLŐ ADÁS"), a haladás-sáv, a "Következik" sor
       és a Playlist / Nézd élőben gombok EL VANNAK REJTVE, hogy
       a felület a referenciának megfelelően letisztult legyen
       (csak borító + cím/alcím + hangerő + play gomb marad)

   A DOM-ot csak az Alvásidő gombbal és a hozzá tartozó panellel
   egészíti ki. Az audio motorhoz csak a lejátszás megállításához
   nyúl az időzítő lejártakor (window.playPause / window.audio).

   Beillesztés az index.html-be, a slam-all.js UTÁN:

       <script src="_app/immutable/entry/slam-all.js"></script>
       <script src="slam-full-player-skin.js"></script>

   FONTOS: a korábbi slam-player-cover.js-t vedd ki, mert az
   elrejti az alsó mini sávot és egy másik lejátszót rajzol.
   ========================================================= */
(function () {
  'use strict';

  var CSS = [
    /* ---------- színek ----------
       a háttér (player-bg.png) MARAD, ezért a szöveg és a vezérlők
       világos színt kapnak, függetlenül a sötét/világos kapcsolótól */
    ':root{',
    '  --slamf-ink:#ffffff;',
    '  --slamf-muted:rgba(255,255,255,.62);',
    '  --slamf-line:rgba(255,255,255,.22);',
    '  --slamf-round:rgba(30,36,50,.55);',
    '  --slamf-green:#23d05f;',
    '  --slamf-green-ink:#06230f;',
    '  --slamf-art-shadow:0 4rem 8rem -3rem rgba(3,8,25,.55);',
    '}',

    /* ---------- panel: az eredeti player-bg.png HÁTTÉR MARAD,
       csak a benne lévő elemeket öltöztetjük át ---------- */
    '.slam-full-player{',
    '  padding:calc(2rem + env(safe-area-inset-top,0px)) 2.4rem calc(3.2rem + env(safe-area-inset-bottom,0px)) !important;',
    '  justify-content:center !important;',
    '}',
    '.slam-full-ambient{display:none !important;}',
    '.slam-full-handle{display:none !important;}',
    /* a borító+szöveg+gombok blokk ne nyúljon szét a teljes
       magasságra — csak annyi helyet foglaljon, amennyi kell,
       hogy a fenti gombsor és a Playlist/Play/Nézd élőben sor
       között ne maradjon nagy üres tér */
    '.slam-full-columns,',
    '.slam-full-body{',
    '  flex:0 0 auto !important;',
    '}',

    /* ---------- felesleges elemek elrejtése: a megosztás gombot
       elrejtjük, a Playlist / Nézd élőben gombok viszont MOST
       LÁTHATÓK (2. referenciakép szerint) ---------- */
    '.slam-full-badge,',
    '.slam-full-progress,',
    '.slam-full-next,',
    '.slam-full-share,',
    '.slam-full-schedule{',
    '  display:none !important;',
    '}',

    /* ---------- alsó gombsor: Playlist — Play — Nézd élőben,
       egyenletesen szétosztva, a Playlist/Live gombok ikon+felirat
       formában ---------- */
    '.slam-full-actions{',
    '  display:flex !important;',
    '  align-items:center !important;',
    '  justify-content:space-between !important;',
    '  gap:2rem !important;',
    '  width:100% !important;',
    '  max-width:38rem !important;',
    '  margin-top:2.2rem !important;',
    '  padding-top:0 !important;',
    '}',
    '.slam-full-actions [data-action]{',
    '  display:flex !important;',
    '  flex-direction:column;',
    '  align-items:center;',
    '  gap:.6rem;',
    '  background:none !important;',
    '  border:none !important;',
    '  color:var(--slamf-muted) !important;',
    '  font:800 1.05rem/1 var(--font-primary,sans-serif);',
    '  letter-spacing:.05em;',
    '  text-transform:uppercase;',
    '  cursor:pointer;',
    '  transition:color .18s ease,transform .18s ease;',
    '}',
    '.slam-full-actions [data-action]:hover{color:var(--slamf-ink) !important;transform:translateY(-2px);}',
    '.slam-full-actions [data-action] svg{',
    '  width:2.4rem;height:2.4rem;',
    '  stroke:currentColor;fill:none;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round;',
    '}',

    /* ---------- fejléc: két szürke kör gomb — ÁTHELYEZVE a panel
       ALJÁRA (a 2. referenciakép szerint a bezárás/chevron és az
       Alvásidő gomb alul, középen van, a megosztás gomb rejtve) ---------- */
    '.slam-full-topbar{',
    '  max-width:none !important;',
    '  margin:2.2rem 0 0 !important;',
    '  justify-content:center !important;',
    '  gap:1.2rem !important;',
    '  order:99;',
    '}',
    '.slam-full-close,.slam-full-share,.slam-full-sleep{',
    '  width:4.6rem !important;height:4.6rem !important;',
    '  border:none !important;',
    '  border-radius:50% !important;',
    '  background:var(--slamf-round) !important;',
    '  color:#fff !important;',
    '  display:flex;align-items:center;justify-content:center;',
    '  cursor:pointer;',
    '  transition:transform .18s ease,filter .18s ease,background .18s ease;',
    '}',
    '.slam-full-close:hover,.slam-full-share:hover,.slam-full-sleep:hover{filter:brightness(1.12);transform:scale(1.05);}',
    '.slam-full-close:active,.slam-full-share:active,.slam-full-sleep:active{transform:scale(.93);}',
    '.slam-full-close svg,.slam-full-share svg,.slam-full-sleep svg{',
    '  width:2.2rem;height:2.2rem;stroke:currentColor;fill:none;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;',
    '}',
    '.slam-full-sleep.active{background:rgba(35,208,95,.32) !important;}',
    '.slam-full-sleep{position:relative;}',
    '.slam-full-sleep-badge{',
    '  position:absolute;top:-.2rem;right:-.2rem;z-index:2;',
    '  min-width:1.7rem;height:1.7rem;padding:0 .3rem;',
    '  border-radius:1rem;background:var(--slamf-green);color:#06230f;',
    '  font:800 .76rem/1.7rem var(--font-primary,sans-serif);text-align:center;',
    '  box-shadow:0 2px 6px rgba(0,0,0,.4);',
    '}',
    '.slam-full-topbar-right{position:relative;display:flex;align-items:center;gap:1rem;}',

    /* ---------- Alvásidő: külön, teljes képernyős nézet a hold
       gombra kattintva — cím + leírás, nagy kör alakú kijelző,
       húzható/kattintható perc-vonalzó és egy nagy indító gomb ---------- */
    '.slam-sleep-backdrop{',
    '  position:fixed;inset:0;z-index:259;',
    '  background:rgba(3,5,14,.6);opacity:0;pointer-events:none;',
    '  transition:opacity .3s ease;',
    '}',
    '.slam-sleep-backdrop.open{opacity:1;pointer-events:auto;}',
    '.slam-sleep-view{',
    '  position:fixed;inset:0;z-index:260;',
    '  display:flex;flex-direction:column;align-items:center;justify-content:center;',
    '  padding:calc(2.2rem + env(safe-area-inset-top,0px)) 2.4rem calc(2.8rem + env(safe-area-inset-bottom,0px));',
    '  background-color:#0a1f5c;',
    '  background-image:',
    '    radial-gradient(120% 85% at 50% -12%,rgba(60,120,255,.55) 0%,rgba(20,60,180,0) 60%),',
    '    radial-gradient(140% 110% at 8% 108%,rgba(15,45,150,.9) 0%,rgba(10,25,90,0) 55%),',
    '    linear-gradient(160deg,#123a9e 0%,#0a1f5c 55%,#050e30 100%);',
    '  color:#fff;overflow-y:auto;text-align:center;',
    '  transform:translateY(100%);',
    '  transition:transform .38s cubic-bezier(.32,.9,.35,1);',
    '  pointer-events:none;',
    '}',
    '.slam-sleep-view.open{transform:translateY(0);pointer-events:auto;}',
    '.slam-sleep-close{',
    '  align-self:center;flex-shrink:0;',
    '  width:4.6rem;height:4.6rem;margin-bottom:1.2rem;',
    '  border:none;border-radius:50%;background:var(--slamf-round);color:#fff;',
    '  display:flex;align-items:center;justify-content:center;cursor:pointer;',
    '  transition:transform .15s ease,filter .15s ease;',
    '}',
    '.slam-sleep-close:hover{filter:brightness(1.12);}',
    '.slam-sleep-close:active{transform:scale(.92);}',
    '.slam-sleep-close svg{width:2rem;height:2rem;stroke:currentColor;fill:none;stroke-width:2;}',
    '.slam-sleep-title{',
    '  margin:0;font:900 2.6rem/1.2 var(--font-primary,sans-serif);',
    '  letter-spacing:.01em;text-transform:uppercase;',
    '}',
    '.slam-sleep-desc{',
    '  max-width:38rem;margin:1rem auto 0;color:var(--slamf-muted);',
    '  font:600 1.2rem/1.55 var(--font-primary,sans-serif);',
    '}',
    '.slam-sleep-clock{',
    '  position:relative;flex-shrink:0;',
    '  width:min(26rem,64vw);aspect-ratio:1/1;margin:3rem auto 3.2rem;',
    '  border-radius:50%;',
    '  box-shadow:0 0 3.2rem rgba(35,208,95,.35);',
    '  display:flex;align-items:center;justify-content:center;',
    '  transition:box-shadow .3s ease;',
    '}',
    '.slam-sleep-view.is-running .slam-sleep-clock{box-shadow:0 0 3.2rem rgba(46,139,255,.35);}',
    '.slam-sleep-clock svg{position:absolute;inset:0;width:100%;height:100%;transform:rotate(-90deg);}',
    '.slam-sleep-clock .track{fill:none;stroke:rgba(255,255,255,.14);stroke-width:4.5;}',
    '.slam-sleep-clock .ring{',
    '  fill:none;stroke:var(--slamf-green);stroke-width:4.5;stroke-linecap:round;',
    '  transition:stroke-dashoffset .4s ease,stroke .25s ease;',
    '}',
    '.slam-sleep-view.is-running .slam-sleep-clock .ring{stroke:#2e8bff;}',
    '.slam-sleep-time{font:900 4rem/1 var(--font-primary,sans-serif);letter-spacing:.01em;}',
    '.slam-sleep-bottom{',
    '  width:100%;max-width:40rem;margin-top:2.2rem;',
    '  display:flex;flex-direction:column;align-items:center;gap:2.6rem;',
    '}',
    '.slam-sleep-ruler-wrap{width:100%;position:relative;padding-top:2.8rem;}',
    '.slam-sleep-ruler-label{',
    '  position:absolute;top:0;left:0;transform:translateX(-50%);',
    '  font:800 1.25rem/1.2 var(--font-primary,sans-serif);color:var(--slamf-green);',
    '  white-space:nowrap;transition:left .15s ease;',
    '}',
    '.slam-sleep-ruler{',
    '  position:relative;display:flex;align-items:flex-end;justify-content:space-between;',
    '  height:3.4rem;padding:0 .2rem;touch-action:pan-y;cursor:pointer;',
    '}',
    '.slam-sleep-tick{',
    '  position:relative;flex:1 1 0;height:100%;',
    '  display:flex;align-items:flex-end;justify-content:center;',
    '  background:none;border:none;padding:0;cursor:pointer;',
    '}',
    '.slam-sleep-tick::before{',
    '  content:"";display:block;width:3px;height:1.4rem;border-radius:2px;',
    '  background:rgba(255,255,255,.3);transition:height .15s ease,background .15s ease;',
    '}',
    '.slam-sleep-tick.selected::before{height:2.3rem;background:var(--slamf-green);box-shadow:0 0 .8rem rgba(35,208,95,.7);}',
    '.slam-sleep-tick-num{',
    '  position:absolute;top:calc(100% + .7rem);left:50%;transform:translateX(-50%);',
    '  font:700 .92rem/1 var(--font-primary,sans-serif);color:var(--slamf-muted);white-space:nowrap;',
    '}',
    '.slam-sleep-cta{',
    '  width:100%;padding:1.6rem 1.8rem;border:none;border-radius:1.8rem;',
    '  background:var(--slamf-green);color:#06230f;',
    '  font:800 1.25rem/1 var(--font-primary,sans-serif);letter-spacing:.04em;text-transform:uppercase;',
    '  cursor:pointer;box-shadow:0 1.4rem 3rem -1rem rgba(35,208,95,.6);',
    '  transition:transform .15s ease,background .18s ease,box-shadow .18s ease;',
    '}',
    '.slam-sleep-cta:hover{transform:translateY(-2px);}',
    '.slam-sleep-cta:active{transform:scale(.98);}',
    '.slam-sleep-view.is-running .slam-sleep-cta{',
    '  background:rgba(255,255,255,.1);color:#fff;',
    '  box-shadow:none;border:1px solid rgba(255,255,255,.18);',
    '}',
    '.slam-sleep-view.is-running .slam-sleep-ruler-wrap{opacity:.35;filter:grayscale(.4);pointer-events:none;}',

    /* ---------- borító ---------- */
    '.slam-full-art{',
    '  width:min(42rem,78vw) !important;',
    '  margin:1.2rem 0 2.8rem !important;',
    '  border:none !important;',
    '  border-radius:2rem !important;',
    '  background:#0b1220 !important;',
    '  backdrop-filter:none !important;-webkit-backdrop-filter:none !important;',
    '  box-shadow:var(--slamf-art-shadow) !important;',
    '}',
    '.slam-full-player.playing .slam-full-art{animation:none !important;box-shadow:var(--slamf-art-shadow) !important;}',
    '.slam-full-logo{max-width:52%;opacity:.95;}',
    '.slam-full-watermark{',
    '  position:absolute;top:1.4rem;right:1.4rem;z-index:2;',
    '  width:2.8rem;height:auto;opacity:.9;',
    '  filter:drop-shadow(0 2px 8px rgba(0,0,0,.45));',
    '}',

    /* ---------- szöveg ---------- */
    '.slam-full-meta{align-items:center;text-align:center;gap:.4rem !important;}',
    '.slam-full-track{color:var(--slamf-ink) !important;letter-spacing:-.01em !important;}',
    '.slam-full-artist{color:var(--slamf-muted) !important;}',

    /* ---------- hangerő ---------- */
    '.slam-full-volume{max-width:34rem;}',
    '.slam-full-vol-icon{color:var(--slamf-muted) !important;opacity:.6;transition:opacity .18s ease,color .18s ease;}',
    '.slam-full-vol-icon:hover{color:var(--slamf-ink) !important;}',
    '.slam-full-vol-icon--max{pointer-events:none;cursor:default;opacity:1;}',
    '.slam-full-vol-range{',
    '  --slamf-vol-fill:100%;',
    '  background:linear-gradient(to right,var(--slamf-ink) 0%,var(--slamf-ink) var(--slamf-vol-fill),var(--slamf-line) var(--slamf-vol-fill),var(--slamf-line) 100%) !important;',
    '}',
    '.slam-full-vol-range::-webkit-slider-thumb{background:var(--slamf-ink) !important;border:none !important;box-shadow:0 0 0 4px rgba(255,255,255,.18) !important;}',
    '.slam-full-vol-range::-moz-range-thumb{background:var(--slamf-ink) !important;border:none !important;}',
    '.slam-full-vol-range::-moz-range-progress{background:var(--slamf-ink) !important;}',

    /* ---------- play gomb ---------- */
    '.slam-full-play,.slam-full-actions .slam-full-play{',
    '  width:8.8rem !important;height:8.8rem !important;',
    '  background:var(--slamf-green) !important;',
    '  color:#0a0d12 !important;',
    '  border:none !important;',
    '  box-shadow:0 1.6rem 3.6rem -1rem rgba(35,208,95,.6) !important;',
    '  transition:transform .22s cubic-bezier(.34,1.56,.64,1) !important;',
    '}',
    '.slam-full-play:hover{transform:scale(1.05) !important;}',
    '.slam-full-play:active{transform:scale(.94) !important;}',
    '.slam-full-play svg{width:3.4rem !important;height:3.4rem !important;fill:currentColor !important;stroke:none !important;}',
    '.slam-full-player.playing .slam-full-play{background:var(--slamf-green) !important;color:#0a0d12 !important;}',

    '.slam-full-player :focus-visible{outline:3px solid var(--slamf-green);outline-offset:3px;}',

    '@media (min-width:700.02px){',
    '  .slam-full-art{width:min(38rem,42vh) !important;}',
    '  .slam-full-play,.slam-full-actions .slam-full-play{width:9.6rem !important;height:9.6rem !important;}',
    '  .slam-sleep-title{font-size:3.2rem;}',
    '  .slam-sleep-desc{font-size:1.3rem;max-width:44rem;}',
    '  .slam-sleep-clock{width:min(30rem,40vh);}',
    '  .slam-sleep-time{font-size:4.6rem;}',
    '  .slam-sleep-bottom{max-width:46rem;}',
    '}'
  ].join('\n');

  var ICON_MOON = '<svg viewBox="0 0 24 24"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"></path></svg>';
  var ICON_X = '<svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"></path></svg>';

  /* 5 perctől 180 percig — a rövidebb idejéknél sűrűbb, hosszabbnál
     ritkább lépésekkel, ahogy a legtöbb alvásidő-időzítőnél szokás */
  var TICK_MINS = [5, 15, 30, 45, 60, 75, 90, 105, 120, 135, 150, 165, 180];
  /* csak minden másodikra kerül szám alá, hogy ne legyen zsúfolt */
  var LABEL_MINS = [5, 30, 60, 90, 120, 150, 180];

  var RING_R = 54; /* a kör alakú kijelző SVG-jében használt sugár */
  var RING_CIRC = 2 * Math.PI * RING_R;

  function injectStyle() {
    if (document.getElementById('slam-full-player-skin')) return;
    var style = document.createElement('style');
    style.id = 'slam-full-player-skin';
    style.textContent = CSS;
    document.head.appendChild(style);
  }

  /* ==============================================================
     Alvásidő (sleep timer): a hold gombra kattintva egy önálló,
     teljes képernyős nézet nyílik (cím + leírás, nagy kör kijelző,
     húzható perc-vonalzó, nagy indító gomb) — a kiválasztott idő
     lejártakor automatikusan megáll a lejátszás.
     Nem localStorage-ol semmit — minden lejátszás-indításkor
     nulláról indul, ahogy egy hagyományos rádió-alvásidő is szokott.
     ============================================================== */
  var sleepTimeoutId = null;
  var badgeTickId = null;
  var viewTickId = null;
  var sleepEndsAt = 0;   /* !=0, amíg fut az időzítő */
  var sleepMins = 0;     /* az elindított időtartam, percben */
  var selectedMins = 30; /* a vonalzón kiválasztott, még el nem indított érték */

  var sleepBtn = null;
  var sleepBackdrop = null;
  var sleepView = null;
  var sleepTimeEl = null;
  var sleepRingEl = null;
  var sleepRulerEl = null;
  var sleepRulerLabelEl = null;
  var sleepCtaBtn = null;

  function formatClock(ms) {
    var totalSec = Math.max(0, Math.round(ms / 1000));
    var m = Math.floor(totalSec / 60);
    var s = totalSec % 60;
    return (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s;
  }

  function stopPlaybackForSleep() {
    if (window.audio && !window.audio.paused) {
      if (typeof window.playPause === 'function') window.playPause();
      else window.audio.pause();
    }
  }

  function clearSleepTimer() {
    if (sleepTimeoutId) { clearTimeout(sleepTimeoutId); sleepTimeoutId = null; }
    if (badgeTickId) { clearInterval(badgeTickId); badgeTickId = null; }
    stopViewTicking();
    sleepEndsAt = 0;
    sleepMins = 0;
  }

  /* ---- kis jelvény a hold gombon, amíg fut az időzítő (akkor is
     látszik, ha a nagy nézet be van csukva) ---- */
  function updateSleepBadge() {
    if (!sleepBtn) return;
    var badge = sleepBtn.querySelector('.slam-full-sleep-badge');
    if (!sleepEndsAt) {
      sleepBtn.classList.remove('active');
      sleepBtn.removeAttribute('aria-pressed');
      sleepBtn.setAttribute('aria-label', 'Alvásidő beállítása');
      if (badge) badge.remove();
      return;
    }
    sleepBtn.classList.add('active');
    sleepBtn.setAttribute('aria-pressed', 'true');
    var minsLeft = Math.max(1, Math.ceil((sleepEndsAt - Date.now()) / 60000));
    sleepBtn.setAttribute('aria-label', 'Alvásidő: még ' + minsLeft + ' perc, koppints a módosításhoz');
    if (!badge) {
      badge = document.createElement('span');
      badge.className = 'slam-full-sleep-badge';
      sleepBtn.appendChild(badge);
    }
    badge.textContent = minsLeft;
  }

  function startSleepTimer(mins) {
    clearSleepTimer();
    sleepMins = mins;
    sleepEndsAt = Date.now() + mins * 60000;
    sleepTimeoutId = setTimeout(function () {
      stopPlaybackForSleep();
      clearSleepTimer();
      updateSleepBadge();
      renderSleepView();
    }, mins * 60000);
    badgeTickId = setInterval(updateSleepBadge, 15000);
    updateSleepBadge();
    startViewTicking();
    renderSleepView();
  }

  function cancelSleepTimer() {
    clearSleepTimer();
    updateSleepBadge();
    renderSleepView();
  }

  function startViewTicking() {
    stopViewTicking();
    if (!sleepView || !sleepView.classList.contains('open')) return;
    viewTickId = setInterval(renderSleepView, 1000);
  }
  function stopViewTicking() {
    if (viewTickId) { clearInterval(viewTickId); viewTickId = null; }
  }

  /* ---- vonalzó felépítése (5–90 perc, 5 perces lépésekben),
     kattintással VAGY húzással is választható ---- */
  function buildRuler() {
    var wrap = document.createElement('div');
    wrap.className = 'slam-sleep-ruler';
    wrap.setAttribute('role', 'slider');
    wrap.setAttribute('aria-label', 'Alvásidő hossza percben');
    wrap.setAttribute('aria-valuemin', '5');
    wrap.setAttribute('aria-valuemax', '180');

    TICK_MINS.forEach(function (mins) {
      var tick = document.createElement('button');
      tick.type = 'button';
      tick.className = 'slam-sleep-tick';
      tick.setAttribute('data-mins', mins);
      tick.setAttribute('aria-label', mins + ' perc');
      if (LABEL_MINS.indexOf(mins) !== -1) {
        var num = document.createElement('span');
        num.className = 'slam-sleep-tick-num';
        num.textContent = mins;
        tick.appendChild(num);
      }
      tick.addEventListener('click', function (e) {
        e.stopPropagation();
        if (sleepEndsAt) return; /* futó időzítőnél a vonalzó inaktív */
        selectedMins = mins;
        renderSleepView();
      });
      wrap.appendChild(tick);
    });

    function pickFromClientX(clientX) {
      if (sleepEndsAt) return;
      var rect = wrap.getBoundingClientRect();
      if (!rect.width) return;
      var ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
      var idx = Math.round(ratio * (TICK_MINS.length - 1));
      selectedMins = TICK_MINS[idx];
      renderSleepView();
    }

    var dragging = false;
    wrap.addEventListener('pointerdown', function (e) {
      if (sleepEndsAt) return;
      dragging = true;
      if (wrap.setPointerCapture) { try { wrap.setPointerCapture(e.pointerId); } catch (err) {} }
      pickFromClientX(e.clientX);
    });
    wrap.addEventListener('pointermove', function (e) {
      if (!dragging) return;
      pickFromClientX(e.clientX);
    });
    wrap.addEventListener('pointerup', function () { dragging = false; });
    wrap.addEventListener('pointercancel', function () { dragging = false; });

    return wrap;
  }

  /* ---- a nézet aktuális állapotának (választás vagy visszaszámlálás)
     megjelenítése: kijelző, vonalzó, gomb felirata ---- */
  function renderSleepView() {
    if (!sleepView) return;
    var running = !!sleepEndsAt;
    sleepView.classList.toggle('is-running', running);

    var activeMins = running ? sleepMins : selectedMins;
    var remainMs = running ? Math.max(0, sleepEndsAt - Date.now()) : selectedMins * 60000;

    if (sleepTimeEl) sleepTimeEl.textContent = formatClock(remainMs);
    if (sleepCtaBtn) sleepCtaBtn.textContent = running ? 'Alvásidő leállítása' : 'Indítás';

    if (sleepRingEl) {
      var totalMs = running ? sleepMins * 60000 : selectedMins * 60000;
      var fraction = totalMs > 0 ? Math.max(0, Math.min(1, remainMs / totalMs)) : 1;
      sleepRingEl.style.strokeDasharray = RING_CIRC.toFixed(1);
      sleepRingEl.style.strokeDashoffset = (RING_CIRC * (1 - fraction)).toFixed(1);
    }

    if (sleepRulerEl) {
      var ticks = sleepRulerEl.querySelectorAll('.slam-sleep-tick');
      var activeTick = null;
      for (var i = 0; i < ticks.length; i++) {
        var m = parseInt(ticks[i].getAttribute('data-mins'), 10);
        var isSel = m === activeMins;
        ticks[i].classList.toggle('selected', isSel);
        if (isSel) activeTick = ticks[i];
      }
      if (sleepRulerLabelEl) {
        sleepRulerLabelEl.textContent = activeMins + ' perc';
        if (activeTick) {
          var wrapRect = sleepRulerEl.getBoundingClientRect();
          var tickRect = activeTick.getBoundingClientRect();
          if (wrapRect.width) {
            var centerX = tickRect.left + tickRect.width / 2 - wrapRect.left;
            sleepRulerLabelEl.style.left = Math.round(centerX) + 'px';
          }
        }
      }
    }
    wrapAriaValue(activeMins);
  }

  function wrapAriaValue(mins) {
    if (sleepRulerEl) sleepRulerEl.setAttribute('aria-valuenow', mins);
  }

  /* ---- a teljes képernyős Alvásidő nézet felépítése (egyszer,
     az első megnyitáskor) ---- */
  function buildSleepView() {
    sleepBackdrop = document.createElement('div');
    sleepBackdrop.className = 'slam-sleep-backdrop';

    sleepView = document.createElement('div');
    sleepView.className = 'slam-sleep-view';
    sleepView.setAttribute('role', 'dialog');
    sleepView.setAttribute('aria-modal', 'true');
    sleepView.setAttribute('aria-label', 'Alvásidő');

    var closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.className = 'slam-sleep-close';
    closeBtn.setAttribute('aria-label', 'Bezárás');
    closeBtn.innerHTML = ICON_X;
    closeBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      closeSleepView();
    });

    var title = document.createElement('h2');
    title.className = 'slam-sleep-title';
    title.textContent = 'Alvásidő';

    var desc = document.createElement('p');
    desc.className = 'slam-sleep-desc';
    desc.textContent = 'Nyugodtan elalvás közben? Állítsd be az időzítőt, és a rádió automatikusan leáll, amikor letelik.';

    var clock = document.createElement('div');
    clock.className = 'slam-sleep-clock';
    clock.innerHTML =
      '<svg viewBox="0 0 120 120">' +
        '<circle class="track" cx="60" cy="60" r="' + RING_R + '"></circle>' +
        '<circle class="ring" cx="60" cy="60" r="' + RING_R + '"></circle>' +
      '</svg>' +
      '<div class="slam-sleep-time">05:00</div>';
    sleepTimeEl = clock.querySelector('.slam-sleep-time');
    sleepRingEl = clock.querySelector('.ring');

    var bottom = document.createElement('div');
    bottom.className = 'slam-sleep-bottom';

    var rulerWrap = document.createElement('div');
    rulerWrap.className = 'slam-sleep-ruler-wrap';

    sleepRulerLabelEl = document.createElement('div');
    sleepRulerLabelEl.className = 'slam-sleep-ruler-label';
    sleepRulerLabelEl.textContent = selectedMins + ' perc';

    sleepRulerEl = buildRuler();

    rulerWrap.appendChild(sleepRulerLabelEl);
    rulerWrap.appendChild(sleepRulerEl);

    sleepCtaBtn = document.createElement('button');
    sleepCtaBtn.type = 'button';
    sleepCtaBtn.className = 'slam-sleep-cta';
    sleepCtaBtn.textContent = 'Indítás';
    sleepCtaBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      if (sleepEndsAt) {
        cancelSleepTimer();
      } else {
        startSleepTimer(selectedMins);
      }
    });

    bottom.appendChild(rulerWrap);
    bottom.appendChild(sleepCtaBtn);

    sleepView.appendChild(closeBtn);
    sleepView.appendChild(title);
    sleepView.appendChild(desc);
    sleepView.appendChild(clock);
    sleepView.appendChild(bottom);

    sleepBackdrop.addEventListener('click', closeSleepView);
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && sleepView.classList.contains('open')) closeSleepView();
    });

    document.body.appendChild(sleepBackdrop);
    document.body.appendChild(sleepView);
  }

  function openSleepView() {
    if (!sleepView) buildSleepView();
    renderSleepView();
    sleepBackdrop.classList.add('open');
    sleepView.classList.add('open');
    if (sleepEndsAt) startViewTicking();
  }

  function closeSleepView() {
    if (!sleepView) return;
    sleepBackdrop.classList.remove('open');
    sleepView.classList.remove('open');
    stopViewTicking();
  }
  window.__slamCloseSleepView = closeSleepView;

  /* a hold gomb (Alvásidő) beszúrása a fejlécbe, a megosztás mellé */
  function addSleepButton(attempt) {
    attempt = attempt || 0;
    var topbar = document.querySelector('.slam-full-player .slam-full-topbar');
    if (!topbar) {
      if (attempt < 30) setTimeout(function () { addSleepButton(attempt + 1); }, 150);
      return;
    }
    if (topbar.querySelector('.slam-full-sleep')) return;

    var share = topbar.querySelector('.slam-full-share');
    var right = document.createElement('div');
    right.className = 'slam-full-topbar-right';

    sleepBtn = document.createElement('button');
    sleepBtn.type = 'button';
    sleepBtn.className = 'slam-full-sleep';
    sleepBtn.innerHTML = ICON_MOON;
    sleepBtn.setAttribute('aria-haspopup', 'dialog');
    sleepBtn.setAttribute('aria-label', 'Alvásidő beállítása');

    if (share && share.parentNode === topbar) {
      topbar.replaceChild(right, share);
      right.appendChild(sleepBtn);
      right.appendChild(share);
    } else {
      topbar.appendChild(right);
      right.appendChild(sleepBtn);
    }

    sleepBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      openSleepView();
    });
  }

  injectStyle();

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { addSleepButton(0); });
  } else {
    addSleepButton(0);
  }
})();


/* KERESÉS gomb a Fiókom elé + teljes képernyős kereső (Radio 538 "Zoeken" minta).
      A menüt a slam-all.js építi, ezért megvárjuk. Az overlay az első megnyitáskor
      épül fel, és ekkor olvassa be az adatot:
        - GYORS ELÉRÉS: a schedule-data.js DJ_PHOTOS + SHOWS változóiból (DJ → műsora)
        - TRENDING: az oldalon lévő .slam-trending-grid cikk-kártyákból */
    (function () {
      var ARROW = '<svg viewBox="0 0 30 26" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M28.5 13H2M12.5 2.5L2 13l10.5 10.5"/></svg>';
      var LENS  = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7.5"/><path d="m20.5 20.5-4.2-4.2"/></svg>';

      var btn, overlay, input, body, secDj, gridDj, secArt, gridArt, emptyEl, DJS, ARTS;

      function esc(s) {
        return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
          return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
        });
      }
      /* ékezet- és kisbetű-független összehasonlításhoz */
      function norm(s) {
        return String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      }
      /* műsor-slug a musor-reszlet.html?nev=... linkhez */
      function slug(s) {
        return norm(s).replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
      }

      function collectDjs() {
        var out = [];
        var photos = (typeof DJ_PHOTOS !== 'undefined') ? DJ_PHOTOS : {};
        var shows  = (typeof SHOWS !== 'undefined') ? SHOWS : {};
        Object.keys(photos).forEach(function (name) {
          var photo = photos[name];
          if (!name || name === '.' || name === 'SLAM' || !photo) return; /* nem DJ / nincs fotó */
          var names = [], href = '';
          Object.keys(shows).forEach(function (d) {
            (shows[d] || []).forEach(function (s) {
              if (s.dj !== name) return;
              if (names.indexOf(s.name) < 0) names.push(s.name);
              if (!href) href = (s.url && s.url !== '.') ? s.url : 'musor-reszlet.html?nev=' + encodeURIComponent(slug(s.name));
            });
          });
          out.push({ name: name, photo: photo, shows: names, href: href || 'musorrend.html' });
        });
        return out;
      }

      function collectArticles() {
        var out = [];
        var list = document.querySelectorAll('.slam-trending-grid a.teaser');
        for (var i = 0; i < list.length; i++) {
          var a = list[i];
          var img = a.querySelector('img');
          var t = a.querySelector('.body .title, h3');
          var c = a.querySelector('.category-phone, .badge');
          if (!t) continue;
          out.push({
            href: a.getAttribute('href') || '#',
            img: img ? img.getAttribute('src') : '',
            cat: c ? c.textContent.trim() : '',
            title: t.textContent.replace(/\s+/g, ' ').trim()
          });
        }
        return out;
      }

      function render(q) {
        q = norm(q).trim();
        var djs = DJS.filter(function (d) { return !q || norm(d.name + ' ' + d.shows.join(' ')).indexOf(q) > -1; });
        var arts = ARTS.filter(function (a) { return !q || norm(a.title + ' ' + a.cat).indexOf(q) > -1; });

        gridDj.innerHTML = djs.map(function (d) {
          return '<a class="slam-so-dj" href="' + esc(d.href) + '"><img src="' + esc(d.photo) + '" alt="" loading="lazy"><span>' + esc(d.name) + '</span></a>';
        }).join('');
        gridArt.innerHTML = arts.map(function (a) {
          return '<a class="slam-so-art" href="' + esc(a.href) + '"><span class="slam-so-art-img">' +
            (a.img ? '<img src="' + esc(a.img) + '" alt="" loading="lazy">' : '') + '</span>' +
            (a.cat ? '<span class="slam-so-art-cat">' + esc(a.cat) + '</span>' : '') +
            '<span class="slam-so-art-title">' + esc(a.title) + '</span></a>';
        }).join('');

        secDj.hidden = !djs.length;
        secArt.hidden = !arts.length;
        emptyEl.hidden = !!(djs.length || arts.length);
      }

      function ensureOverlay() {
        if (overlay) return;
        overlay = document.createElement('div');
        overlay.className = 'slam-so';
        overlay.setAttribute('role', 'dialog');
        overlay.setAttribute('aria-modal', 'true');
        overlay.setAttribute('aria-label', 'Keresés');
        overlay.innerHTML =
          '<div class="slam-so-bar"><div class="slam-so-in">' +
            '<button type="button" class="slam-so-back" aria-label="Vissza">' + ARROW + '</button>' +
            '<label class="slam-so-field">' + LENS +
              '<input type="search" placeholder="Keresés" aria-label="Keresés" autocomplete="off" autocapitalize="off" spellcheck="false" enterkeyhint="search">' +
            '</label>' +
          '</div></div>' +
          '<div class="slam-so-body"><div class="slam-so-wrap">' +
            '<section class="slam-so-sec"><h2 class="slam-so-h">MŰSORVEZETŐINK / DJ-INK</h2><div class="slam-so-grid4"></div></section>' +
            '<section class="slam-so-sec"><h2 class="slam-so-h">TRENDING</h2><div class="slam-so-grid3"></div></section>' +
            '<p class="slam-so-empty" hidden>Nincs találat</p>' +
          '</div></div>';
        document.body.appendChild(overlay);

        input   = overlay.querySelector('input');
        body    = overlay.querySelector('.slam-so-body');
        var secs = overlay.querySelectorAll('.slam-so-sec');
        secDj = secs[0]; secArt = secs[1];
        gridDj = secDj.querySelector('.slam-so-grid4');
        gridArt = secArt.querySelector('.slam-so-grid3');
        emptyEl = overlay.querySelector('.slam-so-empty');

        DJS = collectDjs();
        ARTS = collectArticles();

        overlay.querySelector('.slam-so-back').addEventListener('click', function () { toggle(false); });
        input.addEventListener('input', function () { render(input.value); body.scrollTop = 0; });
        input.addEventListener('keydown', function (e) { if (e.key === 'Enter') input.blur(); });
        /* ha egy fotó nem töltődik be, marad a kártya háttere */
        gridDj.addEventListener('error', function (e) { if (e.target && e.target.tagName === 'IMG') e.target.style.display = 'none'; }, true);
        document.addEventListener('keydown', function (e) { if (e.key === 'Escape') toggle(false); });
      }

      function toggle(open) {
        if (open) {
          ensureOverlay();
          input.value = '';
          render('');
          body.scrollTop = 0;
          overlay.classList.add('is-open');
          document.body.classList.add('slam-so-lock');
          btn.setAttribute('aria-expanded', 'true');
          setTimeout(function () { input.focus(); }, 30);
        } else if (overlay && overlay.classList.contains('is-open')) {
          overlay.classList.remove('is-open');
          document.body.classList.remove('slam-so-lock');
          btn.setAttribute('aria-expanded', 'false');
          btn.focus();
        }
      }

      function build() {
        var right = document.querySelector('#slam-custom-header .slam-nav-right');
        if (!right || right.querySelector('.slam-nav-searchbtn')) return !!right;
        btn = document.createElement('button');
        btn.type = 'button'; btn.className = 'slam-nav-searchbtn';
        btn.setAttribute('aria-label', 'Keresés'); btn.setAttribute('aria-expanded', 'false');
        btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><circle cx="11" cy="11" r="7"></circle><path d="m21 21-4.35-4.35"></path></svg><span>Keresés</span>';
        right.insertBefore(btn, right.firstChild);
        btn.addEventListener('click', function (e) { e.stopPropagation(); toggle(true); });
        return true;
      }
      function start() {
        if (build()) return;
        var mo = new MutationObserver(function () { if (build()) mo.disconnect(); });
        mo.observe(document.body, { childList: true, subtree: true });
      }
      if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
    })();

    /* FIÓKOM gomb → teljes képernyős bejelentkezés/regisztráció overlay,
      pontosan a KERESÉS overlay (.slam-so) mintájára építve: ugyanaz a
      nyitás/zárás animáció, bar + görgethető body szerkezet, ESC-cel és
      a vissza-nyíllal zárható. A Fiókom gombot a custom-header.js építi
      be (#slam-custom-header .slam-nav-account), ezért — ugyanúgy, mint
      a keresés gombnál — MutationObserver-rel várjuk meg, amíg megjelenik. */
    (function () {
      var ARROW = '<svg viewBox="0 0 30 26" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M28.5 13H2M12.5 2.5L2 13l10.5 10.5"/></svg>';

      var EMAIL_ICO = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2.5" y="4.5" width="19" height="15" rx="3"/><path d="m3 6.5 9 6.2 9-6.2"/></svg>';
      var LOCK_ICO  = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4.5" y="10.5" width="15" height="10" rx="2.5"/><path d="M7.5 10.5V7.8a4.5 4.5 0 0 1 9 0v2.7"/></svg>';
      var USER_ICO  = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="3.6"/><path d="M4.5 20c0-4 3.4-6.5 7.5-6.5s7.5 2.5 7.5 6.5"/></svg>';
      var GO_ICO    = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12h16M14 6l6 6-6 6"/></svg>';

      var link, overlay, tabs, tabIndicator, forms, formsWrap, switches;

      function setFormsHeight(animate) {
        var active = overlay.querySelector('.slam-ao-form.is-active');
        if (!active) return;
        var h = active.scrollHeight;
        if (!animate) formsWrap.style.transition = 'none';
        formsWrap.style.height = h + 'px';
        if (!animate) {
          /* force reflow, majd visszakapcsoljuk az átmenetet a következő váltáshoz */
          void formsWrap.offsetHeight;
          formsWrap.style.transition = '';
        }
      }

      function activate(name, animateHeight) {
        tabs.forEach(function (t) { t.classList.toggle('is-active', t.dataset.tab === name); });
        tabIndicator.style.transform = 'translateX(' + (name === 'register' ? '100%' : '0') + ')';
        forms.forEach(function (f) {
          var on = f.dataset.form === name;
          f.classList.toggle('is-active', on);
          f.setAttribute('aria-hidden', on ? 'false' : 'true');
        });
        switches.forEach(function (s) { s.hidden = s.dataset.switch !== name; });
        setFormsHeight(animateHeight !== false);
      }

      function ensureOverlay() {
        if (overlay) return;
        overlay = document.createElement('div');
        overlay.className = 'slam-ao';
        overlay.setAttribute('role', 'dialog');
        overlay.setAttribute('aria-modal', 'true');
        overlay.setAttribute('aria-label', 'Fiókom');
        overlay.innerHTML =
          '<div class="slam-ao-bar"><div class="slam-ao-in">' +
            '<button type="button" class="slam-ao-back" aria-label="Vissza">' + ARROW + '</button>' +
            '<span class="slam-ao-bar-title">Fiókom</span>' +
          '</div></div>' +
          '<div class="slam-ao-body">' +
            '<div class="slam-ao-card">' +
              '<h2 class="slam-ao-heading">Üdvözlünk a <span>SLAM</span>-en!</h2>' +
              '<div class="slam-ao-tabs">' +
                '<span class="slam-ao-tab-indicator"></span>' +
                '<button type="button" class="slam-ao-tab is-active" data-tab="login">Bejelentkezés</button>' +
                '<button type="button" class="slam-ao-tab" data-tab="register">Regisztráció</button>' +
              '</div>' +
              '<div class="slam-ao-forms">' +
                '<form class="slam-ao-form is-active" data-form="login">' +
                  '<label class="slam-ao-field"><span>E-mail cím</span><span class="slam-ao-input-wrap">' + EMAIL_ICO + '<input type="email" name="email" autocomplete="email" placeholder="nev@example.com" required></span></label>' +
                  '<label class="slam-ao-field"><span>Jelszó</span><span class="slam-ao-input-wrap">' + LOCK_ICO + '<input type="password" name="password" autocomplete="current-password" placeholder="••••••••" required></span></label>' +
                  '<div class="slam-ao-row">' +
                    '<label class="slam-ao-check"><input type="checkbox" name="remember"><span>Emlékezz rám</span></label>' +
                    '<a href="#" class="slam-ao-link">Elfelejtett jelszó?</a>' +
                  '</div>' +
                  '<button type="submit" class="slam-ao-submit"><span>Bejelentkezés</span>' + GO_ICO + '</button>' +
                '</form>' +
                '<form class="slam-ao-form" data-form="register" aria-hidden="true">' +
                  '<label class="slam-ao-field"><span>Teljes név</span><span class="slam-ao-input-wrap">' + USER_ICO + '<input type="text" name="name" autocomplete="name" placeholder="Kovács Anna" required></span></label>' +
                  '<label class="slam-ao-field"><span>E-mail cím</span><span class="slam-ao-input-wrap">' + EMAIL_ICO + '<input type="email" name="email" autocomplete="email" placeholder="nev@example.com" required></span></label>' +
                  '<label class="slam-ao-field"><span>Jelszó</span><span class="slam-ao-input-wrap">' + LOCK_ICO + '<input type="password" name="password" autocomplete="new-password" placeholder="••••••••" required></span></label>' +
                  '<label class="slam-ao-field"><span>Jelszó megerősítése</span><span class="slam-ao-input-wrap">' + LOCK_ICO + '<input type="password" name="password2" autocomplete="new-password" placeholder="••••••••" required></span></label>' +
                  '<button type="submit" class="slam-ao-submit"><span>Fiók létrehozása</span>' + GO_ICO + '</button>' +
                '</form>' +
              '</div>' +
              '<p class="slam-ao-switch" data-switch="login">Még nincs fiókod?<button type="button" data-goto="register">Regisztrálj</button></p>' +
              '<p class="slam-ao-switch" data-switch="register" hidden>Már van fiókod?<button type="button" data-goto="login">Jelentkezz be</button></p>' +
            '</div>' +
          '</div>';
        document.body.appendChild(overlay);

        tabs = Array.prototype.slice.call(overlay.querySelectorAll('.slam-ao-tab'));
        tabIndicator = overlay.querySelector('.slam-ao-tab-indicator');
        forms = Array.prototype.slice.call(overlay.querySelectorAll('.slam-ao-form'));
        formsWrap = overlay.querySelector('.slam-ao-forms');
        switches = Array.prototype.slice.call(overlay.querySelectorAll('.slam-ao-switch'));

        tabs.forEach(function (t) { t.addEventListener('click', function () { activate(t.dataset.tab); }); });
        overlay.querySelectorAll('[data-goto]').forEach(function (b) {
          b.addEventListener('click', function () { activate(b.dataset.goto); });
        });
        forms.forEach(function (f) { f.addEventListener('submit', function (e) { e.preventDefault(); }); });

        overlay.querySelector('.slam-ao-back').addEventListener('click', function () { toggle(false); });
        document.addEventListener('keydown', function (e) { if (e.key === 'Escape') toggle(false); });
        window.addEventListener('resize', function () { if (overlay.classList.contains('is-open')) setFormsHeight(false); });

        activate('login', false);
      }

      function toggle(open) {
        if (open) {
          ensureOverlay();
          overlay.classList.add('is-open');
          document.body.classList.add('slam-so-lock');
          setTimeout(function () {
            var first = overlay.querySelector('.slam-ao-form:not([hidden]) input');
            if (first) first.focus();
          }, 30);
        } else if (overlay && overlay.classList.contains('is-open')) {
          overlay.classList.remove('is-open');
          document.body.classList.remove('slam-so-lock');
          if (link) link.focus();
        }
      }

      /* A gombot esemény-delegálással kapjuk el a document-en, capture
        fázisban — ez attól függetlenül működik, hogy a Fiókom gombot
        pontosan melyik szelektor/osztály építi fel, és akkor is, ha a
        SvelteKit router újra lerendereli az elemet. A capture fázis
        biztosítja, hogy a mi kezelőnk fusson le előbb, mint a keret
        saját (nem-capture) navigációs kattintás-figyelője. */
      document.addEventListener('click', function (e) {
        if (e.target.closest('.slam-ao')) return; /* a felugró ablakon belüli kattintásokat a saját gombjai kezelik */
        var el = e.target.closest(
          '#slam-custom-header .slam-nav-account, .slamp-account-pill, [aria-label="Fiókom"], [aria-label="Fiók"], [aria-label="fiókom"]'
        );
        if (!el) {
          /* utolsó mentsvár: ha a fenti szelektorok egyike sem talál (pl. a
            custom-header.js más osztálynevet/struktúrát épít), próbáljuk
            a látható "Fiókom" feliratú gomb/link szövege alapján. */
          var cand = e.target.closest('a, button');
          if (cand && cand.textContent.replace(/\s+/g, ' ').trim().toLowerCase() === 'fiókom') el = cand;
        }
        if (!el) return;
        console.log('[SLAM fiókom-overlay] gombra kattintva, overlay nyitása:', el);
        e.preventDefault();
        e.stopPropagation();
        link = el;
        toggle(true);
      }, true);
      console.log('[SLAM fiókom-overlay] script betöltve és figyel a kattintásra');
    })();

  /* =========================================================
    SLAM — a mini lejátszó borítójának összekötése a most szóló
    műsorral.

    Az oldal maga ('updateLiveHero') már kibocsát egy
    'slam:now-playing' eseményt a mai műsorrend (SHOWS/DJ_PHOTOS)
    alapján — ebben benne van a most élő műsor fotója is
    (d.photo), ha van neki. Ezt eddig csak a TELJES képernyős
    lejátszó használta fel; ez a script ugyanezt köti be az ÚJ
    (slamp-*) mini-sávba is:

      - ha van fotó a mai műsorhoz (pl. PROTOKOL BY WEEKENDER
        DJ-fotója) -> az jelenik meg a borító-négyzetben, kitöltve
      - ha nincs   -> a nagy, a sáv teteje fölé kilógó SLAM-logó
        (img/01/logos.png, a két pöttyös verzió)

    Az esemény percenként újra lefut, tehát műsorváltáskor a
    borító is automatikusan frissül/vált.
    ========================================================= */
  (function () {
    var FALLBACK_ART = '/img/01/logos.png';
    var lastPhoto = null;

    function applyArt(photoUrl) {
      var artEl = document.querySelector('.slamp-art');
      if (!artEl) return false;

      var img = artEl.querySelector('img.slamp-art-img');
      if (!img) {
        artEl.innerHTML = '';
        img = document.createElement('img');
        img.className = 'slamp-art-img';
        img.alt = '';
        artEl.appendChild(img);
      }

      var src = photoUrl || FALLBACK_ART;
      if (img.getAttribute('src') !== src) img.src = src;
      artEl.classList.toggle('has-photo', !!photoUrl);
      artEl.classList.toggle('has-logo', !photoUrl);
      return true;
    }

    document.addEventListener('slam:now-playing', function (e) {
      var d = e.detail || {};
      lastPhoto = d.photo || null;
      applyArt(lastPhoto);

      var titleEl = document.querySelector('.slamp-meta-title');
      var subEl = document.querySelector('.slamp-meta-sub');
      var statusEl = document.querySelector('.slamp-status-label');
      if (titleEl) titleEl.textContent = d.name || 'SLAM';
      if (subEl) subEl.textContent = d.dj || 'Élő adás';
      if (statusEl) {
        statusEl.textContent = (d.time && d.end)
          ? (d.time + ' - ' + d.end)
          : (d.current ? 'Élő adás' : 'Most szól');
      }
    });

    /* a slamp-art elem (és az első 'slam:now-playing' esemény) csak
      kis késéssel épül fel/fut le -> néhányszor újrapróbáljuk, hogy
      biztosan legyen kép (valódi fotó VAGY a logó-fallback) akkor is,
      ha ez a script hamarabb töltődött be, mint a lejátszó DOM-ja */
    var tries = 0;
    var iv = setInterval(function () {
      tries += 1;
      if (applyArt(lastPhoto) || tries > 30) clearInterval(iv);
    }, 200);
  })();

  /* =========================================================
    SLAM — a hangerő-ikon most már követi a csúszka állását:
    néma / halk / hangos ikon a slamp-vol-range értéke (és a
    némítás gomb) alapján, ugyanazon a slamp-vol-icon SVG-n belül.
    ========================================================= */
  (function () {
    var ICONS = {
      muted: '<path d="M3 9v6h4l5 5V4L7 9H3z"></path>' +
            '<line x1="22" y1="9" x2="16" y2="15"></line>' +
            '<line x1="16" y1="9" x2="22" y2="15"></line>',
      low:   '<path d="M3 9v6h4l5 5V4L7 9H3z"></path>' +
            '<path d="M16 8a5 5 0 0 1 0 8"></path>',
      high:  '<path d="M3 9v6h4l5 5V4L7 9H3z"></path>' +
            '<path d="M16 8a5 5 0 0 1 0 8"></path>' +
            '<path d="M19.5 5a9 9 0 0 1 0 14"></path>'
    };

    function wire() {
      var range = document.querySelector('.slamp-vol-range');
      var icon = document.querySelector('.slamp-vol-icon');
      var svg = icon && icon.querySelector('svg');
      if (!range || !icon || !svg) return false;
      if (icon.dataset.iconSynced) return true; /* ne kössük be kétszer */
      icon.dataset.iconSynced = '1';

      function update() {
        var muted = !!(window.audio && window.audio.muted);
        var vol = parseFloat(range.value);
        var key = (muted || vol <= 0) ? 'muted' : (vol <= 0.5 ? 'low' : 'high');
        if (svg.getAttribute('data-state') !== key) {
          svg.setAttribute('data-state', key);
          svg.innerHTML = ICONS[key];
        }
      }

      range.addEventListener('input', update);
      icon.addEventListener('click', function () {
        /* a meglévő némítás-kapcsoló után frissítjük az ikont */
        setTimeout(update, 0);
      });
      if (window.audio) {
        window.audio.addEventListener('volumechange', update);
      }
      update();
      return true;
    }

    if (!wire()) {
      var t = 0;
      var iv2 = setInterval(function () {
        t += 1;
        if (wire() || t > 40) clearInterval(iv2);
      }, 200);
    }
  })();


/* ============================================================
  SLAM — közös FOOTER injektálása minden oldalon.
  A footer HTML-je (index.html-ről emelve ki) itt van EGY helyen;
  minden oldal csak egy <div id="slam-footer-mount"></div> elemet
  tesz ki magának, ide kerül be ugyanaz a footer.
  ============================================================ */
(function () {
  var FOOTER_HTML = `            <footer class="footer svelte-tk8rio">
              <div class="footer-main svelte-tk8rio">
                <div class="footer-left svelte-tk8rio">
                  <!-- <div style="display: contents; --width:6.5rem;"><img
                      class="umbraco-image svelte-1k6vkv6" alt="SLAM! Logo RGB Wit"
                      src="slam/slam-logo.png"
                      loading="lazy"></div> -->
                  <div style="display: contents; --width:35rem;"><img
                      class="umbraco-image svelte-1k6vkv6" alt="SLAM! We. Love. Music." sizes="2000px" src="/img/01/logo.png"
                      loading="lazy" style=""></div>
                  <div class="socials svelte-tk8rio">
                    <div class="socials-title svelte-tk8rio" data-svelte-h="svelte-qyha62">Kövess minket a neten!</div>
                    <div class="socials-list svelte-tk8rio"> <a class="button rounded   svelte-3awqp0"
                        data-variant="primary" href="https://www.instagram.com/slamwelovemusic/"
                        target="_blank" type="button">
                        <div class="social-icon svelte-tk8rio">
                          <div style="display: contents; --size:2rem;"><svg
                              style="width: var(--size, 2.4rem); height: var(--size, 2.4rem)"
                              viewBox="0 0 17 16" fill="none">
                              <path
                                d="M8.71158 2.53448C10.4917 2.53448 10.7025 2.54125 11.4055 2.57333C12.0555 2.60299 12.4085 2.7116 12.6434 2.80287C12.9546 2.92381 13.1767 3.0683 13.4099 3.30157C13.6432 3.53485 13.7877 3.75695 13.9086 4.06811C13.9999 4.30305 14.1085 4.65605 14.1382 5.30601C14.1703 6.00901 14.177 6.21985 14.177 7.99993C14.177 9.78002 14.1703 9.99085 14.1382 10.6938C14.1085 11.3438 13.9999 11.6968 13.9086 11.9318C13.7877 12.2429 13.6432 12.465 13.4099 12.6983C13.1767 12.9316 12.9546 13.0761 12.6434 13.197C12.4085 13.2883 12.0555 13.3969 11.4055 13.4265C10.7026 13.4586 10.4918 13.4654 8.71158 13.4654C6.93138 13.4654 6.72055 13.4586 6.01768 13.4265C5.36769 13.3969 5.01469 13.2883 4.77978 13.197C4.4686 13.0761 4.24649 12.9316 4.01321 12.6983C3.77994 12.465 3.63545 12.2429 3.51454 11.9318C3.42324 11.6968 3.31463 11.3438 3.28497 10.6939C3.2529 9.99085 3.24612 9.78002 3.24612 7.99993C3.24612 6.21985 3.2529 6.00901 3.28497 5.30604C3.31463 4.65605 3.42324 4.30305 3.51454 4.06811C3.63545 3.75695 3.77994 3.53485 4.01321 3.30157C4.24649 3.0683 4.4686 2.92381 4.77978 2.80287C5.01469 2.7116 5.36769 2.60299 6.01766 2.57333C6.72066 2.54125 6.93149 2.53448 8.71158 2.53448ZM8.71158 1.33325C6.901 1.33325 6.674 1.34093 5.96293 1.37337C5.25331 1.40576 4.76872 1.51844 4.34464 1.68326C3.90625 1.85363 3.53447 2.08158 3.16385 2.4522C2.79323 2.82282 2.56527 3.19461 2.3949 3.633C2.23009 4.05707 2.11741 4.54167 2.08501 5.25129C2.05257 5.96233 2.04492 6.18936 2.04492 7.99993C2.04492 9.8105 2.05257 10.0375 2.08501 10.7486C2.11741 11.4582 2.23009 11.9428 2.3949 12.3669C2.56527 12.8052 2.79323 13.177 3.16385 13.5477C3.53447 13.9183 3.90625 14.1462 4.34464 14.3166C4.76872 14.4814 5.25331 14.5941 5.96293 14.6265C6.674 14.6589 6.901 14.6666 8.71158 14.6666C10.5221 14.6666 10.7492 14.6589 11.4602 14.6265C12.1698 14.5941 12.6544 14.4814 13.0785 14.3166C13.5169 14.1462 13.8887 13.9183 14.2593 13.5477C14.6299 13.177 14.8579 12.8053 15.0283 12.3669C15.1931 11.9428 15.3057 11.4582 15.3381 10.7486C15.3706 10.0375 15.3783 9.8105 15.3783 7.99993C15.3783 6.18936 15.3706 5.96233 15.3381 5.25129C15.3057 4.54167 15.1931 4.05707 15.0283 3.633C14.8579 3.19461 14.6299 2.82282 14.2593 2.4522C13.8887 2.08158 13.5169 1.85363 13.0785 1.68326C12.6544 1.51844 12.1698 1.40576 11.4602 1.37337C10.7492 1.34093 10.5221 1.33325 8.71158 1.33325ZM8.71158 4.5765C6.82087 4.5765 5.28814 6.10923 5.28814 7.99993C5.28814 9.89063 6.82087 11.4234 8.71158 11.4234C10.6023 11.4234 12.135 9.89063 12.135 7.99993C12.135 6.10923 10.6023 4.5765 8.71158 4.5765ZM8.71158 10.2222C7.48428 10.2222 6.48934 9.22722 6.48934 7.99993C6.48934 6.77264 7.48428 5.7777 8.71158 5.7777C9.93887 5.7777 10.9338 6.77264 10.9338 7.99993C10.9338 9.22722 9.93887 10.2222 8.71158 10.2222ZM13.0703 4.44124C13.0703 4.88308 12.7121 5.24126 12.2703 5.24126C11.8284 5.24126 11.4703 4.88308 11.4703 4.44124C11.4703 3.99941 11.8284 3.64126 12.2703 3.64126C12.7121 3.64126 13.0703 3.99941 13.0703 4.44124Z"
                                fill="currentColor"></path>
                            </svg></div>
                        </div>
                      </a> <a class="button rounded   svelte-3awqp0" data-variant="primary"
                        href="https://www.facebook.com/slamwelovemusic/" target="_blank" type="button">
                        <div class="social-icon svelte-tk8rio">
                          <div style="display: contents; --size:2rem;"><svg
                              style="width: var(--size, 2.4rem); height: var(--size, 2.4rem)"
                              viewBox="0 0 24 24" fill="none">
                              <path
                                d="M13.4186 22V13.0697H16.2326L16.8081 9.58706H13.4186V7.16169C13.4186 6.16667 13.8023 5.4204 15.3372 5.4204H17V2.24876C16.1047 2.12438 15.0814 2 14.186 2C11.2442 2 9.19767 3.74129 9.19767 6.85075V9.58706H6V13.0697H9.19767V22H13.4186Z"
                                fill="currentColor"></path>
                            </svg></div>
                        </div>
                      </a> <a class="button rounded   svelte-3awqp0" data-variant="primary"
                        href="https://www.youtube.com/@slamhu" target="_blank" type="button">
                        <div class="social-icon svelte-tk8rio">
                          <div style="display: contents; --size:2rem;"><svg
                              style="width: var(--size, 2.4rem); height: var(--size, 2.4rem)"
                              viewBox="0 0 17 16" fill="none">
                              <path fill-rule="evenodd" clip-rule="evenodd"
                                d="M14.1032 2.96546C14.7183 3.13011 15.2017 3.61347 15.3663 4.22854C15.6638 5.34225 15.665 7.66729 15.665 7.66729C15.665 7.66729 15.665 9.99234 15.3663 11.1061C15.2017 11.7211 14.7183 12.2045 14.1032 12.3691C12.9895 12.6678 8.52169 12.6678 8.52169 12.6678C8.52169 12.6678 4.05392 12.6678 2.9402 12.3691C2.32514 12.2045 1.84178 11.7211 1.67713 11.1061C1.37842 9.99234 1.37842 7.66729 1.37842 7.66729C1.37842 7.66729 1.37842 5.34225 1.67713 4.22854C1.84178 3.61347 2.32514 3.13011 2.9402 2.96546C4.05392 2.66675 8.52169 2.66675 8.52169 2.66675C8.52169 2.66675 12.9895 2.66675 14.1032 2.96546ZM10.8033 7.66751L7.09169 9.81024V5.52474L10.8033 7.66751Z"
                                fill="currentColor"></path>
                            </svg></div>
                        </div>
                      </a></div>
                  </div>
                </div>
                <div class="footer-right svelte-tk8rio">
                  <div class="links-table svelte-tk8rio">
                    <div class="link-header svelte-tk8rio">SLAM!</div> <a
                      class="link-item svelte-tk8rio" href="index.html">Kezdőlap</a> <a
                      class="link-item svelte-tk8rio" href="musorrend.html">Műsorrend</a> <a
                      class="link-item svelte-tk8rio" href="ontdek.html">Blog</a> <a
                      class="link-item svelte-tk8rio" href="artikelen/slam-events.html">Események</a>
                  </div>
                  <div class="links-table svelte-tk8rio">
                    <div class="link-header svelte-tk8rio">Általános linkek</div> <a
                      class="link-item svelte-tk8rio" href="hallgatas.html">Hallgatás</a> <a
                      class="link-item svelte-tk8rio" href="programmas.html">Műsorok</a> <a
                      class="link-item svelte-tk8rio" href="djs.html">DJ's</a> <a
                      class="link-item svelte-tk8rio" href="artikelen/contact.html">Kapcsolat</a>
                  </div>
                </div>
              </div>
              <div class="footer-bottom svelte-tk8rio">
                <p>© SLAM 2026 - Minden jog fenntartva!</p>
              </div>
            </footer>`;

  function mountFooter() {
    var mount = document.getElementById('slam-footer-mount');
    if (!mount) return false;
    mount.outerHTML = FOOTER_HTML;
    return true;
  }

  if (!mountFooter()) {
    var tries = 0;
    var iv = setInterval(function () {
      tries += 1;
      if (mountFooter() || tries > 30) clearInterval(iv);
    }, 200);
  }
})();