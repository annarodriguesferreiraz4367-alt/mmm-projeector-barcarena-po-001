/* notice.js — Diálogos simples baseados em Promise para o painel admin
   Expõe window.IdecanConfirm(message, opts) e window.IdecanNotice(message, opts).
   Ambas resolvem uma Promise (true/false para confirm, true para notice).
*/
(function () {
  if (window.IdecanConfirm && window.IdecanNotice) return;

  function injectStyles() {
    if (document.getElementById('idecan-notice-css')) return;
    var s = document.createElement('style');
    s.id = 'idecan-notice-css';
    s.textContent = ''
      + '.idecan-back{position:fixed;inset:0;background:rgba(8,16,32,.55);'
      + 'display:flex;align-items:center;justify-content:center;z-index:2147483647;'
      + 'padding:16px;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Arial,sans-serif;'
      + 'opacity:0;transition:opacity .18s ease}'
      + '.idecan-back.show{opacity:1}'
      + '.idecan-box{background:#fff;border-radius:14px;max-width:440px;width:100%;'
      + 'box-shadow:0 24px 60px rgba(0,0,0,.35);overflow:hidden;'
      + 'transform:translateY(8px) scale(.98);transition:transform .22s cubic-bezier(.2,.8,.2,1)}'
      + '.idecan-back.show .idecan-box{transform:translateY(0) scale(1)}'
      + '.idecan-head{padding:18px 22px;background:linear-gradient(135deg,#5b21b6,#7c3aed);color:#fff}'
      + '.idecan-head h3{margin:0;font-size:16px;font-weight:700}'
      + '.idecan-body{padding:18px 22px 4px;color:#1f2937;font-size:14.5px;line-height:1.5}'
      + '.idecan-actions{padding:14px 22px 18px;display:flex;justify-content:flex-end;gap:10px;flex-wrap:wrap}'
      + '.idecan-btn{padding:10px 18px;border-radius:8px;border:0;font-weight:600;font-size:14px;'
      + 'cursor:pointer;font-family:inherit;transition:transform .1s, box-shadow .1s}'
      + '.idecan-btn:hover{transform:translateY(-1px)}'
      + '.idecan-btn-cancel{background:#e5e7eb;color:#1f2937}'
      + '.idecan-btn-ok{background:linear-gradient(180deg,#ef4444,#b91c1c);color:#fff;'
      + 'box-shadow:0 4px 12px rgba(220,38,38,.35)}'
      + '.idecan-btn-ok.neutral{background:linear-gradient(180deg,#7c3aed,#5b21b6);'
      + 'box-shadow:0 4px 12px rgba(124,58,237,.35)}';
    document.head.appendChild(s);
  }

  function build(message, opts, isConfirm) {
    opts = opts || {};
    injectStyles();
    return new Promise(function (resolve) {
      var back = document.createElement('div');
      back.className = 'idecan-back';
      var box = document.createElement('div');
      box.className = 'idecan-box';
      var head = document.createElement('div');
      head.className = 'idecan-head';
      var h3 = document.createElement('h3');
      h3.textContent = opts.title || (isConfirm ? 'Confirmação' : 'Aviso');
      head.appendChild(h3);
      var body = document.createElement('div');
      body.className = 'idecan-body';
      body.textContent = message || '';
      var actions = document.createElement('div');
      actions.className = 'idecan-actions';

      function close(val) {
        back.classList.remove('show');
        setTimeout(function () {
          if (back.parentNode) back.parentNode.removeChild(back);
          resolve(val);
        }, 180);
      }

      if (isConfirm) {
        var btnCancel = document.createElement('button');
        btnCancel.className = 'idecan-btn idecan-btn-cancel';
        btnCancel.type = 'button';
        btnCancel.textContent = opts.cancelLabel || 'Cancelar';
        btnCancel.addEventListener('click', function () { close(false); });
        actions.appendChild(btnCancel);
      }
      var btnOk = document.createElement('button');
      btnOk.className = 'idecan-btn idecan-btn-ok' + (isConfirm ? '' : ' neutral');
      btnOk.type = 'button';
      btnOk.textContent = opts.okLabel || (isConfirm ? 'Confirmar' : 'OK');
      btnOk.addEventListener('click', function () { close(true); });
      actions.appendChild(btnOk);

      box.appendChild(head);
      box.appendChild(body);
      box.appendChild(actions);
      back.appendChild(box);
      back.addEventListener('click', function (ev) {
        if (ev.target === back) close(isConfirm ? false : true);
      });
      document.body.appendChild(back);
      requestAnimationFrame(function () { back.classList.add('show'); btnOk.focus(); });
      document.addEventListener('keydown', function esc(e) {
        if (e.key === 'Escape') { close(isConfirm ? false : true); document.removeEventListener('keydown', esc); }
        if (e.key === 'Enter')  { close(true);  document.removeEventListener('keydown', esc); }
      }, { once: false });
    });
  }

  window.IdecanConfirm = function (msg, opts) { return build(msg, opts, true); };
  window.IdecanNotice  = function (msg, opts) { return build(msg, opts, false); };
})();
