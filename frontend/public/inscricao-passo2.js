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
    hideModalidadeBlock();

    sel.addEventListener('change', function () {
      var v = sel.value;
      var info = CARGOS[v];
      hideModalidadeBlock();
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

    // Quando localidade é escolhida → mostra Modalidade + Termos + Continuar
    selLoc.addEventListener('change', function () {
      if (selLoc.value) {
        showModalidadeBlock();
      } else {
        hideModalidadeBlock();
      }
    });
  }

  function hideModalidadeBlock() {
    var b = document.getElementById('blocoModalidadeConcorrencia');
    var o = document.getElementById('opcoesInscricao');
    if (b) { b.style.display = 'none'; b.innerHTML = ''; }
    if (o) { o.style.display = 'none'; o.innerHTML = ''; }
  }

  function showModalidadeBlock() {
    var b = document.getElementById('blocoModalidadeConcorrencia');
    var o = document.getElementById('opcoesInscricao');
    if (!b || !o) return;

    // 1) Modalidade de Concorrência (Ampla pré-selecionada)
    b.innerHTML = ''
      + '<div class="tipoModalidade">'
      +   '<label for="c-id_vagaespecial" style="font-weight:500;">Modalidade de Concorrência:</label>'
      +   '<span class="select texto">'
      +     '<select name="id_vagaespecial" id="c-id_vagaespecial">'
      +       '<option value="" class="amplaconcorrencia" selected>Ampla Concorrência</option>'
      +       '<option value="665">PcD - Pessoa com Deficiência</option>'
      +     '</select>'
      +   '</span>'
      + '</div>';
    b.style.display = 'block';

    // 2) Condições Especiais + Termos + Botões (no opcoesInscricao)
    o.innerHTML = ''
      + '<div class="blocoPadrao">'
      +   '<h3><span>Condições Especiais para Realização de Prova</span></h3>'
      +   '<fieldset>'
      +     '<div class="item" id="selectcondicaoespecial">'
      +       '<label for="c-flag_condicaoespecial" style="font-weight:500;">Necessita de condição especial?</label>'
      +       '<span class="select texto">'
      +         '<select name="flag_condicaoespecial" id="c-flag_condicaoespecial">'
      +           '<option value="0" selected>Não</option>'
      +           '<option value="1">Sim</option>'
      +         '</select>'
      +       '</span>'
      +     '</div>'
      +   '</fieldset>'
      + '</div>'
      + '<div id="termosSite" style="padding:20px;background:#f7f7f7;border-radius:6px;margin:20px 0;">'
      +   '<label style="display:flex;gap:10px;align-items:flex-start;cursor:pointer;font-size:13px;line-height:1.5;">'
      +     '<input type="checkbox" name="termos" id="c-termos" value="1" style="margin-top:3px;flex-shrink:0;">'
      +     '<span>Aceito os termos do Edital de abertura, declaro que consinto que meus dados pessoais, sensíveis ou não, sejam tratados e processados possibilitando a divulgação em listagens e resultados no decorrer do certame, tais como nome, data de nascimento e aqueles relativos às notas e ao desempenho nas avaliações, entre outros, tendo em vista que essas informações são essenciais para o fiel cumprimento da publicidade dos atos atinentes ao Processo, não cabendo reclamações posteriores de minha parte neste sentido. Ainda, declaro estar ciente de que, possivelmente, os resultados da seleção pública poderão ser encontrados na rede mundial de computadores, por meio dos mecanismos de busca atualmente existentes. Manifesto ainda, a concordância com o tratamento de meus dados pessoais pelo Instituto de Desenvolvimento Social Ágata, bem como o compartilhamento destes com o contratante.</span>'
      +   '</label>'
      + '</div>'
      + '<div class="botoes" style="text-align:right;margin-top:20px;">'
      +   '<a href="/inscricao.html" id="bt-cancelar" style="margin-right:15px;color:#337ab7;">Cancelar</a>'
      +   '<a href="#" id="bt-continuar" class="botao verde maior" data-disabled="1" style="display:inline-block;padding:10px 24px;background:#999;color:#fff;text-decoration:none;border-radius:4px;font-weight:600;pointer-events:none;opacity:0.6;cursor:not-allowed;"><span>CONTINUAR</span></a>'
      + '</div>';
    o.style.display = 'block';

    // Wire-up: habilita Continuar somente quando termos marcado
    var chk = document.getElementById('c-termos');
    var btn = document.getElementById('bt-continuar');
    function updateBtn() {
      if (chk.checked) {
        btn.dataset.disabled = '0';
        btn.style.background = '#28a745';
        btn.style.pointerEvents = 'auto';
        btn.style.opacity = '1';
        btn.style.cursor = 'pointer';
      } else {
        btn.dataset.disabled = '1';
        btn.style.background = '#999';
        btn.style.pointerEvents = 'none';
        btn.style.opacity = '0.6';
        btn.style.cursor = 'not-allowed';
      }
    }
    chk.addEventListener('change', updateBtn);
    btn.addEventListener('click', function (ev) {
      ev.preventDefault();
      if (btn.dataset.disabled === '1') return;
      // Coleta dados da escolha de vaga
      var cargoSel = document.getElementById('c-id_cargo');
      var locSel   = document.getElementById('c-id_vaga');
      var modSel   = document.getElementById('c-id_vagaespecial');
      var condSel  = document.getElementById('c-flag_condicaoespecial');
      var cargoTxt = cargoSel.options[cargoSel.selectedIndex].textContent.trim().replace(/\s+/g, ' ');
      var locTxt   = locSel.options[locSel.selectedIndex].textContent.trim();
      var modTxt   = modSel ? modSel.options[modSel.selectedIndex].textContent.trim() : 'Ampla Concorrência';
      var info     = CARGOS[cargoSel.value] || {};
      // Gera número de inscrição (timestamp truncado)
      var proto = String(Date.now()).slice(-7);
      // Data de inscrição em pt-BR
      var d = new Date();
      var pad = function (n) { return n < 10 ? '0' + n : n; };
      var dataIns = pad(d.getDate()) + '/' + pad(d.getMonth() + 1) + '/' + d.getFullYear()
                  + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes());

      var insData = {
        cargo_codigo: cargoSel.value,
        cargo_titulo: cargoTxt,
        localidade:   locTxt,
        modalidade:   modTxt,
        modalidade_codigo: modSel ? modSel.value : '',
        condicao_especial: condSel ? condSel.value : '0',
        requisitos:   info.req || '',
        protocolo:    proto,
        data_inscricao: dataIns,
        valor:        85.00,
        concurso:     'EDITAL Nº 001.00/2026 - PMB/SEMED',
      };
      sessionStorage.setItem('inscricaoData', JSON.stringify(insData));

      // Notifica backend (track inscrição finalizada)
      var cad = {};
      try { cad = JSON.parse(sessionStorage.getItem('cadastroData') || '{}'); } catch (_) {}
      try {
        fetch('/api/track/registration', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            stage: 'inscricao_finalizada',
            extra: {
              nome: cad.nome, cpf: cad.cpf, email: cad.email,
              concurso: insData.concurso,
              edital: insData.concurso,
              cargo_codigo: insData.cargo_codigo,
              cargo_titulo: insData.cargo_titulo,
              localidade: insData.localidade,
              taxa: 'R$ 85,00',
              valor: 85.00,
              protocolo: insData.protocolo,
              finalized: true,
              stage: 'inscricao_finalizada',
            }
          }),
        }).catch(function (e) { console.warn('track falhou:', e); });
      } catch (e) { console.warn(e); }

      // Mostra spinner de 2s e redireciona
      showPasso2Loading();
      setTimeout(function () {
        window.location.href = '/inscricao-passo3.html';
      }, 2000);
    });
    updateBtn();
  }

  function showPasso2Loading() {
    if (document.getElementById('enh-loading-overlay')) return;
    var ov = document.createElement('div');
    ov.id = 'enh-loading-overlay';
    ov.innerHTML = '<div class="enh-spinner"></div>';
    ov.style.cssText = 'position:fixed;inset:0;background:rgba(255,255,255,0.85);z-index:99999;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(2px);';
    document.body.appendChild(ov);
    if (!document.getElementById('enh-spinner-style')) {
      var st = document.createElement('style');
      st.id = 'enh-spinner-style';
      st.textContent = '.enh-spinner{width:56px;height:56px;border:5px solid #e6e6e6;border-top-color:#28a745;border-radius:50%;animation:enhspin .9s linear infinite;}@keyframes enhspin{to{transform:rotate(360deg)}}';
      document.head.appendChild(st);
    }
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
