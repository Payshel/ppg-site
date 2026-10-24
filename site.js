(function () {
  var ADDRESS = 'payshel@poojapropertiesgroup.com';
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

  // Property form
  var form = document.getElementById('offer-form'), st = document.getElementById('form-status');
  if (form) form.addEventListener('submit', function (e) {
    e.preventDefault();
    st.className = 'status';
    var missing = [];
    ['f-address', 'f-name', 'f-contact'].forEach(function (id) {
      var el = document.getElementById(id);
      var bad = !el.value.trim();
      el.setAttribute('aria-invalid', bad ? 'true' : 'false');
      if (bad) missing.push(el.labels[0].textContent.replace(/\s*\(optional\)/, ''));
    });
    if (missing.length) {
      st.className = 'status err';
      st.textContent = 'Please fill in: ' + missing.join(', ') + '.';
      document.getElementById(['f-address','f-name','f-contact'].filter(function(id){return !document.getElementById(id).value.trim();})[0]).focus();
      return;
    }
    var d = new FormData(form);
    if (d.get('_gotcha')) return;
    if (FORM_ENDPOINT) {
      st.textContent = 'Sending...';
      fetch(FORM_ENDPOINT, { method: 'POST', body: d, headers: { Accept: 'application/json' } })
        .then(function (r) {
          if (!r.ok) throw new Error();
          form.reset();
          st.textContent = 'Application received. You\'ll get your offer within 24 hours.';
        })
        .catch(function () {
          st.className = 'status err';
          st.textContent = 'That didn\'t go through. Please email ' + ADDRESS + ' instead.';
        });
    } else {
      var body = 'Property address: ' + d.get('address') + '\nProperty type: ' + d.get('type') +
        '\nCondition: ' + d.get('condition') + '\nTimeline: ' + d.get('timeline') +
        '\nName: ' + d.get('name') + '\nPhone or email: ' + d.get('contact') +
        '\n\nNotes:\n' + (d.get('notes') || '');
      window.location.href = 'mailto:' + ADDRESS + '?subject=' + encodeURIComponent('Property details: ' + d.get('address')) + '&body=' + encodeURIComponent(body);
      st.textContent = 'Your email app should open with the details filled in. Press send to finish.';
    }
  });

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
    var fa = document.getElementById('f-address');
    if (a && fa) { fa.value = a; var nx = document.getElementById('f-type'); if (nx) nx.focus(); }
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
