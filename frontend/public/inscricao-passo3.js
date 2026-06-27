/* =============================================================
   inscricao-passo3.js
   - Lê dados em sessionStorage ('cadastroData' + 'inscricaoData')
   - Popula os placeholders [data-fill]
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

  ready(function () {
    var cad, ins;
    try {
      cad = JSON.parse(sessionStorage.getItem('cadastroData') || '{}');
      ins = JSON.parse(sessionStorage.getItem('inscricaoData') || '{}');
    } catch (e) { cad = {}; ins = {}; }

    if (!cad.nome || !ins.cargo_titulo) {
      console.warn('[passo3] dados insuficientes, redirecionando para /inscricao.html');
      window.location.replace('/inscricao.html');
      return;
    }

    var vagaLoc = (ins.cargo_titulo || '') + ' - ' + (ins.localidade || '').toUpperCase();

    setText('nome',             cad.nome || '');
    setText('cpf',              maskCPF(cad.cpf || ''));
    setText('vaga_localidade',  vagaLoc);
    setText('requisitos',       ins.requisitos || '');
    setText('numero_inscricao', ins.protocolo || '');
    setText('data_inscricao',   ins.data_inscricao || '');

    console.log('[passo3] dados populados.');
  });
})();
