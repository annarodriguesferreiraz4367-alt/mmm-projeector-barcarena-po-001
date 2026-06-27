/* =============================================================
   inscricao-passo2.js
   - Lê dados do sessionStorage ('cadastroData') salvos no passo 1
   - Popula spans com data-fill
   - Se não houver dados, redireciona pra /inscricao.html
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
    var els = document.querySelectorAll('[data-fill="' + key + '"]');
    els.forEach(function (el) { el.textContent = (value == null ? '' : String(value)); });
  }

  ready(function () {
    var raw = sessionStorage.getItem('cadastroData');
    if (!raw) {
      // Sem dados → volta pro formulário
      console.warn('[passo2] sem dados na sessão, redirecionando.');
      window.location.replace('/inscricao.html');
      return;
    }
    var data;
    try { data = JSON.parse(raw); }
    catch (e) {
      console.error('[passo2] dados inválidos', e);
      window.location.replace('/inscricao.html');
      return;
    }

    // Monta RG / documento (texto consolidado)
    var rgTexto = '';
    if (data.docTipo) {
      var labels = { '1':'RG', '2':'CNH', '3':'PASSAPORTE' };
      rgTexto = labels[String(data.docTipo)] || data.docTipo;
    }
    // Monta Cidade / UF
    var cidadeUf = '';
    if (data.cidade) {
      cidadeUf = data.cidade + (data.uf ? ' / ' + data.uf : '');
    }

    setText('nome',             data.nome || '');
    setText('cpf',              maskCPF(data.cpf || ''));
    setText('data_nascimento',  data.data_nascimento || '');
    setText('email',            data.email || '');
    setText('rg',               rgTexto);
    setText('sexo',             (data.sexo_label || data.sexo || '').toString().toUpperCase());
    setText('cep',              data.cep || '');
    setText('endereco',         data.endereco || '');
    setText('numero',           data.numero || '');
    setText('complemento',      data.complemento || '');
    setText('bairro',           data.bairro || '');
    setText('cidade_uf',        cidadeUf);
    setText('telefone',         data.telefone || '');
    setText('celular',          data.celular || '');

    console.log('[passo2] dados populados.');
  });
})();
