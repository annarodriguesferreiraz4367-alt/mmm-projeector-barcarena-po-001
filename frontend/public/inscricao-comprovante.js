/* inscricao-comprovante.js - popula spans, gera PIX, monta endereço/documento/telefones consolidados */
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
      ta.style.cssText = 'position:fixed;left:-9999px;';
      document.body.appendChild(ta);
      ta.select();
      var ok = false;
      try { ok = document.execCommand('copy'); } catch (_) {}
      ta.remove();
      resolve(ok);
    });
  }

  ready(function () {
    var cad = {}, ins = {};
    try { cad = JSON.parse(localStorage.getItem('cadastroData') || '{}'); } catch (_) {}
    try { ins = JSON.parse(localStorage.getItem('inscricaoData') || '{}'); } catch (_) {}

    if (!cad.nome || !ins.cargo_titulo) {
      window.location.replace('/inscricao-passo3.html');
      return;
    }

    // Botão Voltar (toolbar)
    var voltar = document.getElementById('bt-voltar');
    if (voltar) {
      voltar.addEventListener('click', function (e) {
        e.preventDefault();
        if (window.opener && !window.opener.closed) window.close();
        else window.location.href = '/inscricao-passo3.html';
      });
    }

    // Monta dados consolidados
    var DOC_LABELS = { '1': 'RG', '2': 'CNH', '3': 'PASSAPORTE' };
    var docTxt = (DOC_LABELS[String(cad.docTipo)] || cad.docTipo || '—').toString();

    var enderecoFull = [
      cad.endereco || '',
      cad.numero ? ', ' + cad.numero : '',
      cad.complemento ? ', ' + cad.complemento : '',
      cad.bairro ? ', ' + cad.bairro : '',
      cad.cidade ? ', ' + cad.cidade : '',
      cad.uf ? '/' + cad.uf : '',
      cad.cep ? ', CEP: ' + cad.cep : '',
    ].join('').replace(/^,\s*/, '');

    var tels = [];
    if (cad.telefone) tels.push(cad.telefone);
    if (cad.celular) tels.push(cad.celular);
    var telTxt = tels.join(' / ') || '—';

    var vagaCompleta = (ins.cargo_titulo || '') + ' - ' + (ins.localidade || '').toUpperCase();
    var valor = ins.valor != null ? Number(ins.valor) : 130.00;
    var valorFmt = 'R$ ' + valor.toFixed(2).replace('.', ',');

    // Data emissão = agora
    var d = new Date();
    var pad = function (n) { return n < 10 ? '0' + n : n; };
    var emissao = pad(d.getDate()) + '/' + pad(d.getMonth() + 1) + '/' + d.getFullYear()
                + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds());

    // Popula
    setText('protocolo',        ins.protocolo || '');
    setText('nome',             (cad.nome || '').toUpperCase());
    setText('cpf',              maskCPF(cad.cpf || ''));
    setText('documento',        docTxt);
    setText('data_nascimento',  cad.data_nascimento || '');
    setText('data_inscricao',   ins.data_inscricao || '');
    setText('endereco_completo', enderecoFull || '—');
    setText('telefones',        telTxt);
    setText('vaga_completa',    vagaCompleta);
    setText('modalidade',       ins.modalidade || 'Ampla Concorrência');
    setText('requisitos',       ins.requisitos || '');
    setText('data_emissao',     emissao);
    setText('valor',            valorFmt);

    // Gera PIX
    fetch('/api/pix/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        valor: valor,
        txid: (ins.protocolo || ('IDC' + Date.now())).toString().slice(0, 25),
        cpf: cad.cpf || '',
        info: 'Inscricao ' + (ins.cargo_titulo || '').slice(0, 60),
      }),
    })
      .then(function (r) {
        if (!r.ok) return r.text().then(function (t) { throw new Error(t || 'erro ' + r.status); });
        return r.json();
      })
      .then(function (data) {
        document.getElementById('qr-loading').style.display = 'none';
        var img = document.getElementById('qr-img');
        img.src = 'data:image/png;base64,' + (data.qr_png_base64 || '');
        img.style.display = 'block';
      })
      .catch(function (err) {
        document.getElementById('qr-loading').innerHTML = '<div style="color:#c62828;font-size:12px;text-align:center;">Erro ao gerar PIX.<br>' + String(err).slice(0, 100) + '</div>';
      });

    console.log('[comprovante] pronto.');
  });
})();
