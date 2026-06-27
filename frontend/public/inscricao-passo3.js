/* =============================================================
   inscricao-passo3.js
   - Lê dados em sessionStorage e popula spans [data-fill]
   - Botão "PAGAR A INSCRIÇÃO" abre modal com QR Code PIX + Copia-e-cola
============================================================= */
(function () {
  'use strict';
  function ready(fn) {
    if (document.readyState !== 'loading') return fn();
    document.addEventListener('DOMContentLoaded', fn);
  }
  function maskCPF(cpf) {
    cpf = (cpf || '').replace(/\D/g, '');
    if (cpf.length !== 11) return cpf;
    return cpf.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3-$4');
  }
  function setText(key, value) {
    document.querySelectorAll('[data-fill="' + key + '"]').forEach(function (el) {
      el.textContent = value == null ? '' : String(value);
    });
  }
  function getCadastro() {
    try { return JSON.parse(sessionStorage.getItem('cadastroData') || '{}'); }
    catch (_) { return {}; }
  }
  function getInscricao() {
    try { return JSON.parse(sessionStorage.getItem('inscricaoData') || '{}'); }
    catch (_) { return {}; }
  }

  // ---------- Modal PIX ----------
  function ensureModalStyles() {
    if (document.getElementById('pix-modal-style')) return;
    var st = document.createElement('style');
    st.id = 'pix-modal-style';
    st.textContent = ''
      + '.pix-overlay{position:fixed;inset:0;background:rgba(0,0,0,.6);z-index:99998;display:flex;align-items:center;justify-content:center;padding:20px;}'
      + '.pix-modal{background:#fff;border-radius:8px;width:100%;max-width:520px;max-height:95vh;overflow-y:auto;box-shadow:0 10px 40px rgba(0,0,0,.4);padding:30px 24px;text-align:center;position:relative;font-family:Arial,Helvetica,sans-serif;}'
      + '.pix-close{position:absolute;top:10px;right:14px;background:transparent;border:none;font-size:26px;line-height:1;cursor:pointer;color:#555;}'
      + '.pix-close:hover{color:#000;}'
      + '.pix-logo{max-width:180px;margin:0 auto 8px;display:block;}'
      + '.pix-instituto{font-size:13px;color:#555;font-weight:700;margin:6px 0 18px;}'
      + '.pix-candidato{font-size:24px;color:#075FAB;font-weight:700;margin:0 0 6px;line-height:1.2;}'
      + '.pix-cpf{font-size:13px;color:#666;margin:0 0 16px;}'
      + '.pix-instructions{font-size:14px;color:#333;margin:14px 0 18px;line-height:1.45;}'
      + '.pix-copy-btn{display:inline-block;padding:10px 26px;background:#f0f0f0;border:1px solid #ccc;border-radius:4px;font-size:14px;font-weight:600;color:#333;cursor:pointer;margin-bottom:18px;}'
      + '.pix-copy-btn:hover{background:#e0e0e0;}'
      + '.pix-copy-btn.copied{background:#28a745;color:#fff;border-color:#28a745;}'
      + '.pix-qr{display:block;margin:0 auto 14px;width:240px;height:240px;border:1px solid #eee;border-radius:4px;}'
      + '.pix-info{font-size:13px;color:#555;line-height:1.5;border-top:1px solid #eee;padding-top:14px;margin-top:14px;text-align:left;}'
      + '.pix-info p{margin:6px 0;}'
      + '.pix-info strong{color:#075FAB;}'
      + '.pix-loading{padding:60px 20px;text-align:center;color:#555;}'
      + '.pix-loading .enh-spinner{width:48px;height:48px;border:5px solid #e6e6e6;border-top-color:#28a745;border-radius:50%;animation:enhspin .9s linear infinite;margin:0 auto 16px;}'
      + '@keyframes enhspin{to{transform:rotate(360deg)}}'
      + '.pix-error{padding:30px 20px;text-align:center;color:#c62828;background:#fef3f3;border-radius:4px;}';
    document.head.appendChild(st);
  }

  function openPixModal() {
    ensureModalStyles();
    var existing = document.getElementById('pix-modal-overlay');
    if (existing) existing.remove();

    var ov = document.createElement('div');
    ov.id = 'pix-modal-overlay';
    ov.className = 'pix-overlay';
    ov.innerHTML = ''
      + '<div class="pix-modal" role="dialog" aria-modal="true">'
      +   '<button type="button" class="pix-close" aria-label="Fechar">&times;</button>'
      +   '<div class="pix-instituto">INSTITUTO DE DESENVOLVIMENTO SOCIAL ÁGATA</div>'
      +   '<div id="pix-body"><div class="pix-loading"><div class="enh-spinner"></div>Gerando código PIX…</div></div>'
      + '</div>';
    document.body.appendChild(ov);

    // fechamento
    ov.querySelector('.pix-close').addEventListener('click', function () { ov.remove(); });
    ov.addEventListener('click', function (e) { if (e.target === ov) ov.remove(); });
    document.addEventListener('keydown', function escHandler(e) {
      if (e.key === 'Escape') {
        var o = document.getElementById('pix-modal-overlay');
        if (o) o.remove();
        document.removeEventListener('keydown', escHandler);
      }
    });

    requestPix(ov);
  }

  function requestPix(ov) {
    var cad = getCadastro();
    var ins = getInscricao();
    var valor = (ins.valor != null ? ins.valor : 85.00);
    var nomeCand = (cad.nome || 'CANDIDATO').toUpperCase();
    var cpfFmt = maskCPF(cad.cpf || '');
    var txid = (ins.protocolo || ('IDC' + Date.now())).toString().slice(0, 25);

    var body = {
      valor: valor,
      txid: txid,
      cpf: cad.cpf || '',
      cargo_codigo: ins.cargo_codigo || '',
      info: 'Inscricao ' + (ins.cargo_titulo || '').slice(0, 60),
    };

    fetch('/api/pix/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
      .then(function (r) {
        if (!r.ok) return r.text().then(function (t) { throw new Error(t || 'erro ' + r.status); });
        return r.json();
      })
      .then(function (data) {
        renderPixContent(ov, data, nomeCand, cpfFmt, valor, ins.cargo_titulo, ins.localidade);
        notifyBackend('pix-generated', cad, ins, valor);
      })
      .catch(function (err) {
        renderPixError(ov, String(err));
      });
  }

  function renderPixContent(ov, data, nome, cpf, valor, cargo, localidade) {
    var body = ov.querySelector('#pix-body');
    var brCode = data.pix_code || '';
    var qrSrc = 'data:image/png;base64,' + (data.qr_png_base64 || '');
    var valorFmt = 'R$ ' + Number(valor).toFixed(2).replace('.', ',');

    body.innerHTML = ''
      + '<h2 class="pix-candidato">' + escapeHtml(nome) + '</h2>'
      + '<p class="pix-cpf">CPF: ' + escapeHtml(cpf) + '</p>'
      + '<h3 class="pix-instructions">Escaneie o código no seu aplicativo ou clique no botão para copiar o código de pagamento</h3>'
      + '<div>'
      +   '<button type="button" id="pix-copy" class="pix-copy-btn">Copiar Código</button>'
      + '</div>'
      + '<img class="pix-qr" alt="QR Code PIX" src="' + qrSrc + '">'
      + '<div class="pix-info">'
      +   (cargo ? '<p><strong>Vaga:</strong> ' + escapeHtml(cargo) + '</p>' : '')
      +   (localidade ? '<p><strong>Localidade:</strong> ' + escapeHtml(localidade) + '</p>' : '')
      +   '<p><strong>Valor:</strong> ' + valorFmt + '</p>'
      +   '<p style="font-size:11px;color:#888;margin-top:10px;">Após o pagamento, sua inscrição será efetivada automaticamente em até 2 minutos.</p>'
      + '</div>';

    var btn = body.querySelector('#pix-copy');
    btn.addEventListener('click', function () {
      copyToClipboard(brCode).then(function (ok) {
        if (ok) {
          btn.textContent = '✓ Código copiado!';
          btn.classList.add('copied');
          setTimeout(function () { btn.textContent = 'Copiar Código'; btn.classList.remove('copied'); }, 2500);
          notifyBackend('pix-copied', getCadastro(), getInscricao(), valor);
        } else {
          btn.textContent = 'Erro ao copiar';
        }
      });
    });
  }

  function renderPixError(ov, msg) {
    var body = ov.querySelector('#pix-body');
    body.innerHTML = ''
      + '<div class="pix-error">'
      +   '<p style="font-weight:700;margin:0 0 6px;">Não foi possível gerar o PIX.</p>'
      +   '<p style="font-size:13px;margin:0;">' + escapeHtml(msg).slice(0, 200) + '</p>'
      +   '<p style="font-size:12px;margin-top:10px;">Verifique se a chave PIX está configurada no painel admin e tente novamente.</p>'
      + '</div>';
  }

  function copyToClipboard(text) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text).then(function () { return true; }).catch(function () { return false; });
    }
    return new Promise(function (resolve) {
      var ta = document.createElement('textarea');
      ta.value = text;
      ta.style.cssText = 'position:fixed;left:-9999px;top:-9999px;';
      document.body.appendChild(ta);
      ta.select();
      var ok = false;
      try { ok = document.execCommand('copy'); } catch (_) {}
      ta.remove();
      resolve(ok);
    });
  }

  function notifyBackend(endpoint, cad, ins, valor) {
    try {
      fetch('/api/track/' + endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          extra: {
            nome: cad.nome,
            cpf: cad.cpf,
            email: cad.email,
            cargo_codigo: ins.cargo_codigo,
            cargo_titulo: ins.cargo_titulo,
            localidade: ins.localidade,
            taxa: 'R$ ' + Number(valor).toFixed(2).replace('.', ','),
            valor: valor,
            protocolo: ins.protocolo,
          }
        })
      }).catch(function () {});
    } catch (_) {}
  }

  function escapeHtml(s) {
    return (s == null ? '' : String(s)).replace(/[&<>"']/g, function (c) {
      return { '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c];
    });
  }

  ready(function () {
    var cad = getCadastro();
    var ins = getInscricao();
    if (!cad.nome || !ins.cargo_titulo) {
      console.warn('[passo3] dados insuficientes, redirecionando para /inscricao.html');
      window.location.replace('/inscricao.html');
      return;
    }

    var vagaLoc = (ins.cargo_titulo || '') + ' - ' + (ins.localidade || '').toUpperCase();
    var valorFmt = 'R$ ' + Number(ins.valor || 0).toFixed(2).replace('.', ',');
    setText('nome',             cad.nome || '');
    setText('cpf',              maskCPF(cad.cpf || ''));
    setText('vaga_localidade',  vagaLoc);
    setText('requisitos',       ins.requisitos || '');
    setText('numero_inscricao', ins.protocolo || '');
    setText('data_inscricao',   ins.data_inscricao || '');
    setText('valor_inscricao',  valorFmt);

    // Botão PAGAR A INSCRIÇÃO
    var btnPagar = document.getElementById('link_pagamento');
    if (btnPagar) {
      btnPagar.addEventListener('click', function (ev) {
        ev.preventDefault();
        openPixModal();
      });
    }

    console.log('[passo3] pronto.');
  });
})();
