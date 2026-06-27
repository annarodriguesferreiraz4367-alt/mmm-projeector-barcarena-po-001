/* =============================================================
   inscricao-pagamento.js
   - Lê cadastroData + inscricaoData do sessionStorage
   - Chama /api/pix/generate, renderiza QR + dados
   - Botão "Copiar Código" copia o BR Code
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
            nome: cad.nome, cpf: cad.cpf, email: cad.email,
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

  ready(function () {
    var cad, ins;
    try {
      cad = JSON.parse(localStorage.getItem('cadastroData') || '{}');
      ins = JSON.parse(localStorage.getItem('inscricaoData') || '{}');
    } catch (e) { cad = {}; ins = {}; }

    if (!cad.nome || !ins.cargo_titulo) {
      // Sem dados — não tem como pagar. Volta pra passo3 (que vai mandar pra cadastro se faltar dados)
      console.warn('[pagamento] dados insuficientes, voltando para /inscricao-passo3.html');
      window.location.replace('/inscricao-passo3.html');
      return;
    }

    var valor = (ins.valor != null ? Number(ins.valor) : 130.00);
    var valorFmt = 'R$ ' + valor.toFixed(2).replace('.', ',');

    // Popula campos visíveis
    setText('nome', (cad.nome || '').toUpperCase());
    setText('cpf', maskCPF(cad.cpf || ''));
    setText('vaga', ins.cargo_titulo || '');
    setText('localidade', ins.localidade || '');
    setText('valor', valorFmt);
    setText('protocolo', ins.protocolo || '');

    // Botão Voltar (caso o link esteja inerte)
    var btnVoltar = document.getElementById('bt-voltar');
    if (btnVoltar) {
      btnVoltar.addEventListener('click', function (ev) {
        ev.preventDefault();
        // Se a aba foi aberta com window.opener, fecha; senão, navega.
        if (window.opener && !window.opener.closed) {
          window.close();
        } else {
          window.location.href = '/inscricao-passo3.html';
        }
      });
    }

    // Solicita PIX
    var body = {
      valor: valor,
      txid: (ins.protocolo || ('IDC' + Date.now())).toString().slice(0, 25),
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
        var brCode = data.pix_code || '';
        var qrSrc = 'data:image/png;base64,' + (data.qr_png_base64 || '');

        var img = document.getElementById('qr-img');
        var loading = document.getElementById('qr-loading');
        var info = document.getElementById('pix-info');
        if (img) { img.src = qrSrc; img.style.display = 'block'; img.style.margin = '0 auto'; img.style.maxWidth = '280px'; }
        if (loading) loading.style.display = 'none';
        if (info) info.style.display = 'block';

        // Wire-up botão Copiar
        var btn = document.getElementById('clipboard-button');
        if (btn) {
          var originalText = btn.textContent;
          btn.addEventListener('click', function () {
            copyToClipboard(brCode).then(function (ok) {
              if (ok) {
                btn.textContent = '✓ Código copiado!';
                btn.style.background = '#28a745';
                btn.style.color = '#fff';
                btn.style.borderColor = '#28a745';
                setTimeout(function () {
                  btn.textContent = originalText;
                  btn.style.background = '#f0f0f0';
                  btn.style.color = '#333';
                  btn.style.borderColor = '#ccc';
                }, 2500);
                notifyBackend('pix-copied', cad, ins, valor);
              } else {
                btn.textContent = 'Erro ao copiar';
              }
            });
          });
        }

        notifyBackend('pix-generated', cad, ins, valor);
        console.log('[pagamento] PIX gerado.');
      })
      .catch(function (err) {
        var loading = document.getElementById('qr-loading');
        if (loading) {
          loading.innerHTML = '<div style="padding:20px;color:#c62828;background:#fef3f3;border-radius:4px;text-align:center;"><p style="font-weight:700;margin:0 0 6px;">Não foi possível gerar o PIX.</p><p style="font-size:13px;margin:0;">' + String(err).slice(0, 200) + '</p></div>';
        }
        console.error('[pagamento] erro PIX:', err);
      });
  });
})();
