/* =============================================================
   inscricao-passo2.js
   - Lê dados do sessionStorage e popula spans (data-fill)
   - Quando user escolhe uma Vaga: mostra aviso de requisito + select Localidade
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

  // ---------- Catálogo de Cargos (requisitos + localidades) ----------
  // Localidades do edital PMB/SEMED — mesmas para todos os cargos por enquanto.
  var LOCALIDADES_PADRAO = [
    { v: '2666', t: 'Polo: ESTRADA 1' },
    { v: '2667', t: 'Polo: ESTRADA 2' },
    { v: '2668', t: 'Polo: ESTRADA 3' },
    { v: '2669', t: 'Polo: ESTRADA 4' },
    { v: '2670', t: 'Polo: ILHA 1' },
    { v: '2671', t: 'Polo: SÃO FRANCISCO' },
    { v: '2674', t: 'Polo: SEDE' },
    { v: '2672', t: 'Polo: VILA DO CONDE' },
    { v: '2673', t: 'Polo: VILA DOS CABANOS' },
  ];

  var REQ_AUX_TURMA = 'O candidato(a) deve possuir Conhecimentos relacionados aos trabalhos inerentes à categoria e Certificado de conclusão de Ensino Médio ou equivalente.';
  var REQ_LICENCIATURA = function (area) {
    return 'O candidato(a) deverá possuir Graduação em Licenciatura em ' + area + '.';
  };
  var REQ_ESPECIALISTA = 'O candidato(a) deverá possuir Graduação em Licenciatura em Pedagogia.';
  var REQ_PROFESSOR_BASICO = 'O candidato(a) deverá possuir Graduação em Licenciatura em Pedagogia.';
  var REQ_APOIO = 'O candidato(a) deverá possuir o Certificado de conclusão de Ensino Médio ou equivalente.';

  // Mapeia value do <option> → { requisito, localidades }
  var CARGOS = {
    '1708': { req: REQ_AUX_TURMA,                            locs: LOCALIDADES_PADRAO }, // AUXILIAR DE TURMA
    '1709': { req: REQ_APOIO,                                locs: LOCALIDADES_PADRAO }, // PROFISSIONAL DE APOIO ESCOLAR
    '1710': { req: REQ_ESPECIALISTA,                         locs: LOCALIDADES_PADRAO }, // ESPECIALISTA EM EDUCAÇÃO
    '1711': { req: REQ_PROFESSOR_BASICO,                     locs: LOCALIDADES_PADRAO }, // PROFESSOR DE EDUCAÇÃO BÁSICA
    '1712': { req: REQ_LICENCIATURA('Artes'),                locs: LOCALIDADES_PADRAO },
    '1713': { req: REQ_LICENCIATURA('Ciências'),             locs: LOCALIDADES_PADRAO },
    '1714': { req: REQ_LICENCIATURA('Educação Física'),      locs: LOCALIDADES_PADRAO },
    '1715': { req: REQ_LICENCIATURA('Ensino Religioso'),     locs: LOCALIDADES_PADRAO },
    '1716': { req: REQ_LICENCIATURA('Geografia'),            locs: LOCALIDADES_PADRAO },
    '1717': { req: REQ_LICENCIATURA('História'),             locs: LOCALIDADES_PADRAO },
    '1718': { req: REQ_LICENCIATURA('Letras'),               locs: LOCALIDADES_PADRAO },
    '1719': { req: REQ_LICENCIATURA('Letras'),               locs: LOCALIDADES_PADRAO },
    '1720': { req: REQ_LICENCIATURA('Matemática'),           locs: LOCALIDADES_PADRAO },
  };

  function setupCargoSelector() {
    var sel = document.getElementById('c-id_cargo');
    var aviso = document.getElementById('avisoRequisitoCargo');
    var blocoLoc = document.getElementById('blocoLocalidadeVaga');
    var selLoc = document.getElementById('c-id_vaga');
    if (!sel || !aviso || !blocoLoc || !selLoc) {
      console.warn('[passo2] cargo selector elements missing');
      return;
    }

    // Reseta seleção default
    sel.selectedIndex = 0;
    aviso.style.display = 'none';
    blocoLoc.style.display = 'none';

    sel.addEventListener('change', function () {
      var v = sel.value;
      var info = CARGOS[v];
      if (!info) {
        aviso.style.display = 'none';
        aviso.innerHTML = '';
        blocoLoc.style.display = 'none';
        return;
      }
      // Aviso de requisito
      aviso.innerHTML = '<p style="margin:0;"><strong>' + info.req + '</strong></p>';
      aviso.style.display = 'block';

      // Popula localidades
      selLoc.innerHTML = '<option value="" class="selecione" selected>Selecione</option>';
      info.locs.forEach(function (o) {
        var opt = document.createElement('option');
        opt.value = o.v;
        opt.textContent = o.t;
        opt.setAttribute('label', o.t);
        selLoc.appendChild(opt);
      });
      blocoLoc.style.display = 'block';
    });
  }

  ready(function () {
    var raw = sessionStorage.getItem('cadastroData');
    if (!raw) {
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

    var rgTexto = '';
    if (data.docTipo) {
      var labels = { '1': 'RG', '2': 'CNH', '3': 'PASSAPORTE' };
      rgTexto = labels[String(data.docTipo)] || data.docTipo;
    }
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

    setupCargoSelector();

    console.log('[passo2] dados populados.');
  });
})();
