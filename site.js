(function () {
  var ADDRESS = 'payshelsharma@poojapropertiesgroup.com';
  // Paste a Formspree endpoint here (e.g. https://formspree.io/f/abcdwxyz) to receive submissions by email.
  // Until then, the form opens the visitor's email app with the details filled in.
  var FORM_ENDPOINT = '';

  // Copy email
  var btn = document.getElementById('copy-btn'), cs = document.getElementById('copy-status');
  if (btn) btn.addEventListener('click', function () {
    function fallback() {
      var r = document.createRange(); r.selectNodeContents(document.getElementById('email'));
      var s = window.getSelection(); s.removeAllRanges(); s.addRange(r);
      cs.textContent = 'Address selected. Press Cmd+C or Ctrl+C to copy.';
    }
    try { navigator.clipboard.writeText(ADDRESS).then(function () { cs.textContent = 'Copied.'; }, fallback); } catch (e) { fallback(); }
  });

  // Offer application
  var form = document.getElementById('offer-form'), st = document.getElementById('form-status');
  if (form) {
    // Photos upload only works through a form service; otherwise ask for photos by email.
    var pf = document.getElementById('photo-field'), pe = document.getElementById('photo-email');
    if (pf && pe && !FORM_ENDPOINT) { pf.hidden = true; pf.querySelector('input').disabled = true; pe.hidden = false; }
    var files = document.getElementById('ph-files'), cnt = document.getElementById('ph-count');
    if (files) files.addEventListener('change', function () {
      var n = files.files.length, big = 0;
      for (var i = 0; i < n; i++) if (files.files[i].size > 25 * 1024 * 1024) big++;
      cnt.textContent = n > 10 ? 'Please choose 10 photos or fewer.' : big ? 'Each photo must be under 25 MB.' : n ? n + ' photo' + (n > 1 ? 's' : '') + ' selected.' : '';
    });

    // Show follow-up questions only when they apply
    var conds = form.querySelectorAll('.cond[data-show]');
    function syncConds() {
      Array.prototype.forEach.call(conds, function (c) {
        var parts = c.getAttribute('data-show').split('='), on = false;
        Array.prototype.forEach.call(form.querySelectorAll('[name="' + parts[0] + '"]'), function (i) { if (i.checked && i.value === parts[1]) on = true; });
        c.hidden = !on;
        Array.prototype.forEach.call(c.querySelectorAll('input, select, textarea'), function (i) { i.disabled = !on; });
      });
    }
    form.addEventListener('change', syncConds); syncConds();

    function label(el) {
      if (el.dataset && el.dataset.label) return el.dataset.label;
      var g = el.closest('[role="group"]');
      if (g) return g.querySelector('.glabel').childNodes[0].textContent.trim();
      if (el.labels && el.labels[0]) return el.labels[0].childNodes[0].textContent.trim();
      return el.name;
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      st.className = 'status';
      Array.prototype.forEach.call(form.querySelectorAll('[aria-invalid], .choices.invalid'), function (x) { x.removeAttribute('aria-invalid'); x.classList.remove('invalid'); });
      var bad = [], seen = {};
      Array.prototype.forEach.call(form.querySelectorAll('[required]'), function (el) {
        if (el.disabled || el.closest('[hidden]')) return;
        var ok;
        if (el.type === 'radio') {
          if (seen[el.name]) return; seen[el.name] = 1;
          ok = !!form.querySelector('[name="' + el.name + '"]:checked');
          if (!ok) el.closest('.choices').classList.add('invalid');
        } else if (el.type === 'checkbox') { ok = el.checked; }
        else { ok = el.value.trim() !== '' && el.checkValidity(); if (!ok) el.setAttribute('aria-invalid', 'true'); }
        if (!ok) bad.push(el);
      });
      if (files && files.files.length > 10) bad.push(files);
      if (bad.length) {
        st.className = 'status err';
        st.textContent = 'Please complete: ' + bad.map(label).join(', ') + '.';
        bad[0].focus();
        return;
      }
      var d = new FormData(form);
      if (d.get('_gotcha')) return;
      var addr = [d.get('Street address'), d.get('Unit'), d.get('City or town'), d.get('ZIP code')].filter(Boolean).join(', ');
      if (FORM_ENDPOINT) {
        d.append('_subject', 'Offer application: ' + addr);
        st.textContent = 'Sending...';
        fetch(FORM_ENDPOINT, { method: 'POST', body: d, headers: { Accept: 'application/json' } })
          .then(function (r) {
            if (!r.ok) throw new Error();
            form.reset(); syncConds(); if (cnt) cnt.textContent = '';
            st.textContent = 'Application received. You\'ll get your offer within 24 hours.';
          })
          .catch(function () {
            st.className = 'status err';
            st.textContent = 'That didn\'t go through. Please try again or email ' + ADDRESS + '.';
          });
      } else {
        var lines = [], last = '';
        d.forEach(function (v, k) {
          if (k === '_gotcha' || typeof v !== 'string' || !v) return;
          if (k === last) { lines[lines.length - 1] += ', ' + v; return; }
          lines.push(k + ': ' + v); last = k;
        });
        window.location.href = 'mailto:' + ADDRESS + '?subject=' + encodeURIComponent('Offer application: ' + addr) + '&body=' + encodeURIComponent(lines.join('\n') + '\n\n(Attach your property photos to this email.)');
        st.textContent = 'Your email app should open with your answers filled in. Attach your photos and press send to finish.';
      }
    });
  }

  // Hide the pinned mobile button while the form is on screen
  var pin = document.getElementById('pin');
  if (pin && 'IntersectionObserver' in window) {
    var visible = new Set();
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { en.isIntersecting ? visible.add(en.target) : visible.delete(en.target); });
      pin.classList.toggle('hide', visible.size > 0);
    }, { threshold: 0.15 });
    [document.getElementById('offer'), document.querySelector('footer'), document.querySelector('.hero'), document.querySelector('.page-hero')].forEach(function (el) { if (el) io.observe(el); });
  }

  // Prefill address from the home page
  try {
    var a = new URLSearchParams(location.search).get('address');
    var fa = document.getElementById('p-street');
    if (a && fa) { fa.value = a; var nx = document.getElementById('p-unit'); if (nx) nx.focus(); }
  } catch (e) {}

  // Team "Learn more" dialogs
  Array.prototype.forEach.call(document.querySelectorAll('[data-open]'), function (b) {
    var d = document.getElementById(b.getAttribute('data-open'));
    if (!d || typeof d.showModal !== 'function') { b.hidden = true; return; }
    b.addEventListener('click', function () { d.showModal(); });
    d.addEventListener('click', function (e) { if (e.target === d) d.close(); });
    d.addEventListener('close', function () { b.focus(); });
  });

  // Mobile menu
  var head = document.querySelector('.site-head'), mb = document.getElementById('menu-btn');
  if (mb) {
    mb.addEventListener('click', function () {
      var open = head.classList.toggle('open');
      mb.setAttribute('aria-expanded', open ? 'true' : 'false');
      mb.querySelector('.label').textContent = open ? 'Close' : 'Menu';
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && head.classList.contains('open')) { mb.click(); mb.focus(); }
    });
  }
})();
