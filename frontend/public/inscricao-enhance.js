/* =============================================================
   inscricao-enhance.js
   Comportamentos do formulário de cadastro:
   - Limpa campos pré-preenchidos
   - UPPERCASE em todos os inputs de texto (exceto e-mail/senha/CEP)
   - Máscaras: CPF, data (dd/mm/yyyy), telefone, celular, CEP
   - Validação CPF, e-mail, datas, cep, telefone
   - Mensagens de erro inline abaixo de cada campo
   - Substitui o select gigante de Nacionalidade por "Brasileira / Estrangeira"
   - Auto-completa endereço via /api/cep/{cep}
   - Habilita botão Continuar apenas quando todos os obrigatórios são válidos
============================================================= */

(function () {
  'use strict';

  function ready(fn) {
    if (document.readyState !== 'loading') return fn();
    document.addEventListener('DOMContentLoaded', fn);
  }

  // ---------- Helpers ----------
  function $(sel, root) { return (root || document).querySelector(sel); }
  function $all(sel, root) { return Array.from((root || document).querySelectorAll(sel)); }

  function onlyDigits(s) { return (s || '').replace(/\D/g, ''); }

  function setError(input, msg) {
    if (!input) return;
    var holder = input.parentNode;
    if (!holder) return;
    var err = holder.querySelector('.enh-error[data-for="' + input.name + '"]');
    if (!err) {
      err = document.createElement('div');
      err.className = 'enh-error';
      err.setAttribute('data-for', input.name || input.id || '');
      input.insertAdjacentElement('afterend', err);
    }
    if (msg) {
      err.textContent = msg;
      err.style.display = 'block';
      input.classList.add('enh-input-invalid');
    } else {
      err.style.display = 'none';
      err.textContent = '';
      input.classList.remove('enh-input-invalid');
    }
  }

  // ---------- Validações ----------
  function isValidCPF(cpf) {
    cpf = onlyDigits(cpf);
    if (cpf.length !== 11) return false;
    if (/^(\d)\1+$/.test(cpf)) return false;
    var sum = 0, rest;
    for (var i = 1; i <= 9; i++) sum += parseInt(cpf.substring(i - 1, i)) * (11 - i);
    rest = (sum * 10) % 11;
    if (rest === 10 || rest === 11) rest = 0;
    if (rest !== parseInt(cpf.substring(9, 10))) return false;
    sum = 0;
    for (i = 1; i <= 10; i++) sum += parseInt(cpf.substring(i - 1, i)) * (12 - i);
    rest = (sum * 10) % 11;
    if (rest === 10 || rest === 11) rest = 0;
    if (rest !== parseInt(cpf.substring(10, 11))) return false;
    return true;
  }

  function isValidEmail(v) {
    // Regex pragmática (não RFC completa, mas cobre 99% real)
    return /^[A-Z0-9._%+\-]+@[A-Z0-9.\-]+\.[A-Z]{2,}$/i.test((v || '').trim());
  }

  function isValidDate(s) {
    // dd/mm/yyyy
    var m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec((s || '').trim());
    if (!m) return false;
    var d = parseInt(m[1], 10), mo = parseInt(m[2], 10), y = parseInt(m[3], 10);
    if (mo < 1 || mo > 12) return false;
    var dim = new Date(y, mo, 0).getDate();
    if (d < 1 || d > dim) return false;
    if (y < 1900 || y > (new Date()).getFullYear()) return false;
    return true;
  }

  function isValidCEP(s) {
    return onlyDigits(s).length === 8;
  }

  function isValidPhone(s) {
    var d = onlyDigits(s);
    return d.length === 10 || d.length === 11;
  }

  // ---------- Máscaras ----------
  function maskCPF(v) {
    v = onlyDigits(v).slice(0, 11);
    return v
      .replace(/^(\d{3})(\d)/, '$1.$2')
      .replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
      .replace(/\.(\d{3})(\d)/, '.$1-$2');
  }
  function maskDate(v) {
    v = onlyDigits(v).slice(0, 8);
    return v
      .replace(/^(\d{2})(\d)/, '$1/$2')
      .replace(/^(\d{2})\/(\d{2})(\d)/, '$1/$2/$3');
  }
  function maskCEP(v) {
    v = onlyDigits(v).slice(0, 8);
    return v.replace(/^(\d{5})(\d)/, '$1-$2');
  }
  function maskPhone(v) {
    v = onlyDigits(v).slice(0, 11);
    if (v.length <= 10) {
      // (xx) xxxx-xxxx
      return v
        .replace(/^(\d{2})(\d)/, '($1) $2')
        .replace(/(\d{4})(\d)/, '$1-$2');
    }
    // (xx) xxxxx-xxxx
    return v
      .replace(/^(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{5})(\d)/, '$1-$2');
  }

  function attachMask(input, maskFn, validateFn, errMsg) {
    if (!input || input.dataset.enhMask === '1') return;
    input.dataset.enhMask = '1';

    input.addEventListener('input', function () {
      var pos = input.selectionStart;
      var beforeLen = input.value.length;
      input.value = maskFn(input.value);
      var afterLen = input.value.length;
      // ajusta cursor (best-effort)
      try { input.setSelectionRange(pos + (afterLen - beforeLen), pos + (afterLen - beforeLen)); } catch (_) {}
      checkValidate();
    });
    input.addEventListener('blur', checkValidate);

    function checkValidate() {
      if (input.value.trim() === '') {
        setError(input, null);
      } else if (validateFn && !validateFn(input.value)) {
        setError(input, errMsg);
      } else {
        setError(input, null);
      }
      updateSubmit();
    }
  }

  // ---------- Substitui Nacionalidade por seletor simples ----------
  function setupNacionalidade() {
    var sel = document.getElementById('cnacionalidade_ibge');
    var inp = document.getElementById('cnacionalidade');
    if (!sel) return;
    // Limpa opções e cria 2 (BRASILEIRA / ESTRANGEIRA)
    sel.innerHTML = '';
    [
      { v: '', t: 'Selecione' },
      { v: 'BRASILEIRO (A)', t: 'BRASILEIRO (A)' },
      { v: 'ESTRANGEIRO (A)', t: 'ESTRANGEIRO (A)' },
    ].forEach(function (o) {
      var opt = document.createElement('option');
      opt.value = o.v; opt.textContent = o.t;
      sel.appendChild(opt);
    });
    sel.value = '';
    sel.dataset.required = '1';
    sel.addEventListener('change', updateSubmit);
    // o input texto de nacionalidade (cnacionalidade) é redundante — escondemos
    if (inp) {
      var wrap = inp.closest('.form-group') || inp.parentNode;
      if (wrap) wrap.style.display = 'none';
    }
  }

  // ---------- UPPERCASE em inputs de texto ----------
  function setupUppercase() {
    var skipNames = ['email', 'email2', 'senha', 'senha2', 'endereco_cep', 'cep', 'cpf'];
    $all('input[type="text"]').forEach(function (inp) {
      if (skipNames.indexOf(inp.name) !== -1) return;
      // Máscaras (cpf, data, telefone) já gerenciam — pulamos texto puro
      if (inp.classList.contains('mascara')) return;
      inp.style.textTransform = 'uppercase';
      inp.addEventListener('input', function () {
        var pos = inp.selectionStart;
        var v = inp.value.toUpperCase();
        if (v !== inp.value) {
          inp.value = v;
          try { inp.setSelectionRange(pos, pos); } catch (_) {}
        }
      });
    });
    // E-mail SEMPRE lowercase ao sair do campo (boa prática)
    ['cemail', 'cemail2'].forEach(function (id) {
      var e = document.getElementById(id);
      if (!e) return;
      e.addEventListener('blur', function () { e.value = (e.value || '').trim().toLowerCase(); });
    });
  }

  // ---------- Auto-preenchimento por CEP ----------
  function setupCEP() {
    var cep = document.getElementById('ccep');
    if (!cep) return;
    attachMask(cep, maskCEP, isValidCEP, 'CEP inválido (8 dígitos).');
    cep.addEventListener('blur', function () {
      var v = onlyDigits(cep.value);
      if (v.length !== 8) return;
      fetch('/api/cep/' + v)
        .then(function (r) {
          if (!r.ok) throw new Error('CEP não encontrado');
          return r.json();
        })
        .then(function (data) {
          var rua = document.getElementById('c-endereco_rua');
          var bairro = document.getElementById('c-endereco_bairro');
          var uf = document.getElementById('c-id_estado');
          var cidade = document.getElementById('c-cidade');
          if (rua && data.logradouro) rua.value = (data.logradouro || '').toUpperCase();
          if (bairro && data.bairro) bairro.value = (data.bairro || '').toUpperCase();
          // UF: seleciona pela UF do retorno
          if (uf && data.uf) {
            for (var i = 0; i < uf.options.length; i++) {
              if (uf.options[i].value === data.uf || uf.options[i].text === data.uf) {
                uf.selectedIndex = i;
                uf.dispatchEvent(new Event('change', { bubbles: true }));
                break;
              }
            }
            // Aguarda municipios carregarem e seleciona cidade
            if (cidade && data.localidade) {
              loadMunicipiosAndSelect(data.uf, data.localidade);
            }
          }
          setError(cep, null);
          // Foca número
          var num = document.getElementById('cnumero');
          if (num) num.focus();
          updateSubmit();
        })
        .catch(function () {
          setError(cep, 'CEP não encontrado.');
        });
    });
  }

  function loadMunicipiosAndSelect(uf, localidade) {
    fetch('/api/ibge/municipios/' + uf)
      .then(function (r) { return r.ok ? r.json() : []; })
      .then(function (list) {
        var sel = document.getElementById('c-cidade');
        if (!sel) return;
        sel.innerHTML = '<option value="">Selecione</option>';
        (list || []).forEach(function (m) {
          var opt = document.createElement('option');
          opt.value = m.nome; opt.textContent = m.nome;
          sel.appendChild(opt);
        });
        // Seleciona
        var alvo = (localidade || '').toLowerCase();
        for (var i = 0; i < sel.options.length; i++) {
          if (sel.options[i].value.toLowerCase() === alvo) {
            sel.selectedIndex = i; break;
          }
        }
        sel.dispatchEvent(new Event('change', { bubbles: true }));
        updateSubmit();
      })
      .catch(function () {});
  }

  // ---------- Tipo Documento + Upload (Frente/Verso) ----------
  function setupTipoDoc() {
    var sel = document.querySelector('select[name="id_tipodoc"]');
    if (!sel) return;

    // Esconde o bloco antigo "Número/Órgão/UF"
    var blocosAntigos = document.querySelectorAll('.BlocoCamposDoc');
    blocosAntigos.forEach(function (b) { b.style.display = 'none'; });

    // Cria container de upload logo após o select (no mesmo .form-row se possível)
    var wrap = sel.closest('.form-group') || sel.parentNode;
    var uploadHost = document.getElementById('doc-upload-host');
    if (!uploadHost) {
      uploadHost = document.createElement('div');
      uploadHost.id = 'doc-upload-host';
      uploadHost.className = 'doc-upload-host';
      uploadHost.style.cssText = 'width:100%;margin-top:15px;display:none;';
      // Insere depois do .form-row que contém Tipo Documento
      var row = wrap.closest('.form-row') || wrap.parentNode;
      if (row && row.parentNode) {
        row.parentNode.insertBefore(uploadHost, row.nextSibling);
      } else {
        wrap.appendChild(uploadHost);
      }
    }

    var LABELS = { '1': 'RG', '2': 'CNH', '3': 'PASSAPORTE' };

    function renderUploaders(tipo) {
      var nome = LABELS[tipo];
      if (!nome) { uploadHost.style.display = 'none'; uploadHost.innerHTML = ''; return; }

      uploadHost.style.display = 'block';
      uploadHost.innerHTML = ''
        + '<div class="card panel panel-default doc-upload-card" style="max-width:760px;">'
        +   '<div class="card-header panel-heading" style="padding:10px 14px;font-size:14px;font-weight:500;">'
        +     'Upload do documento — ' + nome + '<span class="required" style="color:#dc3545;margin-left:4px;">*</span>'
        +   '</div>'
        +   '<div class="card-body" style="padding:12px;display:flex;flex-wrap:wrap;gap:10px;">'
        +     uploaderHTML('doc_frente', 'Frente do documento')
        +     uploaderHTML('doc_verso',  'Verso do documento')
        +     '<div style="flex-basis:100%;font-size:11px;color:#666;margin-top:4px;">'
        +       'JPG, PNG, WEBP, HEIC ou PDF — máx. 8 MB por arquivo.'
        +     '</div>'
        +   '</div>'
        + '</div>';

      ['doc_frente', 'doc_verso'].forEach(function (name) {
        var input = uploadHost.querySelector('input[name="' + name + '"]');
        if (!input) return;
        input.addEventListener('change', function () { handleFileChange(input); });
      });
      updateSubmit();
    }

    function uploaderHTML(name, label) {
      return ''
      + '<div class="doc-upload-slot" data-slot="' + name + '" style="flex:1 1 220px;min-width:0;margin-bottom:0;">'
      +   '<label style="display:block;font-weight:500;margin-bottom:4px;font-size:13px;">' + label + ' <span style="color:#dc3545;">*</span></label>'
      +   '<label class="doc-drop" for="up-' + name + '" style="display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;border:2px dashed #c0c0c0;border-radius:6px;padding:8px;cursor:pointer;background:#fafbfc;text-align:center;min-height:84px;max-height:130px;overflow:hidden;transition:border-color .2s,background .2s;">'
      +     '<div class="doc-content">'
      +       '<div class="doc-icon" style="font-size:22px;line-height:1;">📄</div>'
      +       '<div class="doc-label" style="font-size:12px;color:#666;line-height:1.25;margin-top:2px;">Clique ou arraste<br><small style="color:#999;">imagem ou PDF</small></div>'
      +     '</div>'
      +   '</label>'
      +   '<input type="file" id="up-' + name + '" name="' + name + '" accept="image/*,application/pdf" style="display:none;">'
      +   '<div class="enh-error" data-for="' + name + '" style="font-size:11px;"></div>'
      + '</div>';
    }

    function handleFileChange(input) {
      var slot = input.closest('.doc-upload-slot');
      var drop = slot.querySelector('.doc-drop');
      var content = slot.querySelector('.doc-content');
      var file = input.files && input.files[0];

      if (!file) {
        drop.style.borderColor = '#c0c0c0';
        drop.style.background = '#fafbfc';
        content.innerHTML = '<div class="doc-icon" style="font-size:22px;line-height:1;">📄</div>'
          + '<div class="doc-label" style="font-size:12px;color:#666;line-height:1.25;margin-top:2px;">Clique ou arraste<br><small style="color:#999;">imagem ou PDF</small></div>';
        setError(input, null);
        updateSubmit();
        return;
      }

      // Validação tamanho
      if (file.size > 8 * 1024 * 1024) {
        input.value = '';
        setError(input, 'Arquivo excede 8 MB.');
        updateSubmit();
        return;
      }
      // Tipo
      var allowed = /^(image\/(jpeg|jpg|png|webp|heic|heif)|application\/pdf)$/i;
      var typeOk = allowed.test(file.type) || /\.(jpe?g|png|webp|heic|heif|pdf)$/i.test(file.name);
      if (!typeOk) {
        input.value = '';
        setError(input, 'Tipo inválido. Aceito: JPG, PNG, WEBP, HEIC ou PDF.');
        updateSubmit();
        return;
      }

      setError(input, null);
      drop.style.borderColor = '#28a745';
      drop.style.background = '#f1faf3';

      var sizeKb = (file.size / 1024).toFixed(0) + ' KB';

      if (/^image\//i.test(file.type)) {
        var reader = new FileReader();
        reader.onload = function (e) {
          content.innerHTML = ''
            + '<img src="' + e.target.result + '" alt="" style="max-width:100%;max-height:80px;border-radius:4px;border:1px solid #ddd;display:block;margin:0 auto;">'
            + '<div style="font-size:11px;color:#28a745;margin-top:3px;line-height:1.1;"><strong>✓ ' + escapeHtml(file.name) + '</strong><br><small style="color:#666;">' + sizeKb + ' — clique para trocar</small></div>';
        };
        reader.readAsDataURL(file);
      } else {
        content.innerHTML = ''
          + '<div style="font-size:24px;line-height:1;color:#dc3545;">📕</div>'
          + '<div style="font-size:11px;color:#28a745;margin-top:3px;line-height:1.1;"><strong>✓ ' + escapeHtml(file.name) + '</strong><br><small style="color:#666;">PDF · ' + sizeKb + ' — clique para trocar</small></div>';
      }
      updateSubmit();
    }

    function escapeHtml(s) {
      return (s || '').replace(/[&<>"']/g, function (c) {
        return { '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c];
      });
    }

    sel.addEventListener('change', function () {
      renderUploaders(sel.value);
    });
    // Estado inicial
    renderUploaders(sel.value);
  }

  // ---------- Limpa todos os campos (remove valores pré-preenchidos) ----------
  function clearAll() {
    $all('input[type="text"], input[type="number"], input[type="password"], input[type="email"], input[type="tel"], textarea').forEach(function (i) {
      i.value = '';
    });
    $all('input[type="checkbox"], input[type="radio"]').forEach(function (i) {
      i.checked = false;
    });
    $all('select').forEach(function (s) {
      // Mantém primeiro option (Selecione)
      s.selectedIndex = 0;
    });
  }

  // ---------- Determina campos obrigatórios e habilita Continuar ----------
  function getRequiredFields() {
    // Campos obrigatórios baseados nos asteriscos no HTML:
    return [
      { id: 'cnome',                check: function (v) { return v.trim().length >= 3; } },
      { id: 'ccpf',                 check: function (v) { return isValidCPF(v); } },
      { id: 'cdata_nascimento',     check: function (v) { return isValidDate(v); } },
      { id: 'cdata_nascimento2',    check: function (v, all) { return isValidDate(v) && v === all.cdata_nascimento; } },
      { id: 'c-sexo',               check: function (v) { return v.trim() !== ''; }, type: 'select' },
      { id: 'cemail',               check: function (v) { return isValidEmail(v); } },
      { id: 'cemail2',              check: function (v, all) { return isValidEmail(v) && v.trim().toLowerCase() === (all.cemail || '').trim().toLowerCase(); } },
      { id: 'cnome_mae',            check: function (v) { return v.trim().length >= 3; } },
      { id: 'cnacionalidade_ibge',  check: function (v) { return v === 'BRASILEIRO (A)' || v === 'ESTRANGEIRO (A)'; }, type: 'select' },
      { id: 'cid_estadocivil',      check: function (v) { return v.trim() !== ''; }, type: 'select' },
      { id: 'cid_escolaridade',     check: function (v) { return v.trim() !== ''; }, type: 'select' },
      { id: 'ccep',                 check: function (v) { return isValidCEP(v); } },
      { id: 'c-endereco_rua',       check: function (v) { return v.trim().length >= 3; } },
      { id: 'cnumero',              check: function (v) { return v.trim() !== ''; } },
      { id: 'c-endereco_bairro',    check: function (v) { return v.trim().length >= 2; } },
      { id: 'c-id_estado',          check: function (v) { return v.trim() !== ''; }, type: 'select' },
      { id: 'c-cidade',             check: function (v) { return v.trim() !== ''; }, type: 'select' },
      { id: 'ccelular',             check: function (v) { return isValidPhone(v); } },
      { id: 'csenha',               check: function (v) { return v.length >= 6; } },
      { id: 'csenha2',              check: function (v, all) { return v.length >= 6 && v === all.csenha; } },
      // Tipo Documento + upload frente/verso obrigatórios
      { name: 'id_tipodoc',         check: function (_, _all, el) { return el && el.value && ['1','2','3'].indexOf(el.value) !== -1; }, type: 'select-name' },
      { name: 'doc_frente',         check: function (_, _all, el) { return el && el.files && el.files.length > 0; }, type: 'file' },
      { name: 'doc_verso',          check: function (_, _all, el) { return el && el.files && el.files.length > 0; }, type: 'file' },
      // Termos obrigatório
      { name: 'flag_termos',        check: function (_, _all, el) { return el && el.checked; }, type: 'checkbox' },
    ];
  }

  function updateSubmit() {
    var btn = document.getElementById('bt-cadastro');
    if (!btn) return;
    var reqs = getRequiredFields();
    var all = {};
    reqs.forEach(function (r) {
      var el = r.id
        ? document.getElementById(r.id)
        : document.querySelector('[name="' + r.name + '"]');
      if (!el) return;
      all[r.id || r.name] = el.value;
    });
    var ok = reqs.every(function (r) {
      var el = r.id
        ? document.getElementById(r.id)
        : document.querySelector('[name="' + r.name + '"]');
      if (!el) return false;
      if (r.type === 'checkbox' || r.type === 'file' || r.type === 'select-name') {
        return r.check(null, all, el);
      }
      var v = el.value || '';
      return r.check(v, all, el);
    });
    btn.disabled = !ok;
    if (ok) btn.removeAttribute('disabled');
    else btn.setAttribute('disabled', 'disabled');
  }

  // ---------- Setup principal ----------
  function setup() {
    // 1) Limpa tudo
    clearAll();
    // 2) Uppercase
    setupUppercase();
    // 3) Máscaras + validações
    attachMask(document.getElementById('ccpf'),               maskCPF,   isValidCPF,   'CPF inválido. Verifique os 11 dígitos.');
    attachMask(document.getElementById('cdata_nascimento'),   maskDate,  isValidDate,  'Data inválida. Use o formato DD/MM/AAAA.');
    attachMask(document.getElementById('cdata_nascimento2'),  maskDate,  isValidDate,  'Data inválida. Use o formato DD/MM/AAAA.');
    attachMask(document.getElementById('ctelefone'),          maskPhone, function(v){ return v.trim()==='' || isValidPhone(v); }, 'Telefone inválido.');
    attachMask(document.getElementById('ccelular'),           maskPhone, isValidPhone, 'Celular inválido. Use DDD + número.');
    // 4) Confirmação de data
    var d2 = document.getElementById('cdata_nascimento2');
    if (d2) {
      d2.addEventListener('blur', function () {
        var d1 = document.getElementById('cdata_nascimento');
        if (d1 && d2.value && d1.value && d2.value !== d1.value) {
          setError(d2, 'As datas de nascimento não conferem.');
        }
        updateSubmit();
      });
    }
    // 5) E-mail validação + confirmação
    var em1 = document.getElementById('cemail');
    var em2 = document.getElementById('cemail2');
    if (em1) {
      em1.addEventListener('blur', function () {
        var v = (em1.value || '').trim().toLowerCase();
        em1.value = v;
        if (v && !isValidEmail(v)) setError(em1, 'E-mail inválido. Use o formato nome@dominio.com');
        else setError(em1, null);
        updateSubmit();
      });
    }
    if (em2) {
      em2.addEventListener('blur', function () {
        var v = (em2.value || '').trim().toLowerCase();
        em2.value = v;
        if (v && !isValidEmail(v)) setError(em2, 'E-mail inválido.');
        else if (em1 && em2.value && em1.value && em2.value !== em1.value) setError(em2, 'Os e-mails não conferem.');
        else setError(em2, null);
        updateSubmit();
      });
    }
    // 6) CEP
    setupCEP();
    // 7) Nacionalidade
    setupNacionalidade();
    // 7.1) Tipo Documento + Upload Frente/Verso
    setupTipoDoc();
    // 8) Listeners genéricos para todos os campos requeridos (update do botão)
    var allFields = $all('input, select, textarea');
    allFields.forEach(function (el) {
      el.addEventListener('input', updateSubmit);
      el.addEventListener('change', updateSubmit);
    });
    // 8.5) Handler do botão "Continuar" — salva no backend e redireciona pro passo 2
    setupSubmit();
    // 9) Estado inicial do botão
    var btn = document.getElementById('bt-cadastro');
    if (btn) {
      btn.setAttribute('disabled', 'disabled');
      btn.type = 'button';
    }
    updateSubmit();
    console.log('[inscricao-enhance] form configurado.');
  }

  // ---------- Coleta + submit ----------
  function fileToBase64(file) {
    return new Promise(function (resolve, reject) {
      if (!file) return resolve('');
      var reader = new FileReader();
      reader.onload = function () { resolve(reader.result); }; // dataURL com prefixo
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }
  function val(id) {
    var el = document.getElementById(id);
    return el ? (el.value || '').trim() : '';
  }
  function selText(id) {
    var el = document.getElementById(id);
    if (!el) return '';
    var o = el.options[el.selectedIndex];
    return o ? (o.textContent || o.value || '').trim() : '';
  }

  function buildFormData() {
    var fd = {
      // Pessoais
      nome: val('cnome'),
      cpf: val('ccpf'),
      data_nascimento: val('cdata_nascimento'),
      sexo: val('c-sexo'),
      sexo_label: selText('c-sexo'),
      email: val('cemail'),
      // Documento
      docTipo: val('cid_tipodoc') || (document.querySelector('[name="id_tipodoc"]') || {}).value || '',
      // Mãe / Naturalidade
      nome_mae: val('cnome_mae'),
      naturalidade_cidade: val('cnaturalidade_cidade'),
      naturalidade_uf: val('cnaturalidade_uf'),
      nacionalidade: val('cnacionalidade_ibge'),
      estado_civil: val('cid_estadocivil'),
      estado_civil_label: selText('cid_estadocivil'),
      escolaridade: val('cid_escolaridade'),
      escolaridade_label: selText('cid_escolaridade'),
      qtd_filhos: val('cqt_filhos'),
      cnh_categoria: val('ccnh_categoria'),
      flag_negro: !!(document.querySelector('[name="flag_negro"]') || {}).checked,
      flag_deficiente: !!(document.querySelector('[name="flag_deficiente"]') || {}).checked,
      // Endereço
      cep: val('ccep'),
      endereco: val('c-endereco_rua'),
      numero: val('cnumero'),
      complemento: val('c-endereco_complemento') || val('ccomplemento'),
      bairro: val('c-endereco_bairro'),
      uf: selText('c-id_estado'),
      cidade: selText('c-cidade'),
      telefone: val('ctelefone'),
      celular: val('ccelular'),
      // Senha (opcional gravar - normalmente backend faz hash; deixo de fora)
    };
    // tipodoc real
    var tipo = document.querySelector('[name="id_tipodoc"]');
    if (tipo) fd.docTipo = tipo.value;
    return fd;
  }

  function setupSubmit() {
    var btn = document.getElementById('bt-cadastro');
    if (!btn || btn.dataset.enhSubmit === '1') return;
    btn.dataset.enhSubmit = '1';
    btn.type = 'button'; // evita submit nativo do form

    btn.addEventListener('click', async function (ev) {
      ev.preventDefault();
      if (btn.disabled) return;
      btn.disabled = true;
      btn.setAttribute('data-original-text', btn.textContent);
      btn.textContent = 'Enviando...';

      try {
        var fd = buildFormData();

        // Lê arquivos como base64
        var frenteInput = document.querySelector('input[name="doc_frente"]');
        var versoInput  = document.querySelector('input[name="doc_verso"]');
        var fFile = frenteInput && frenteInput.files[0];
        var vFile = versoInput  && versoInput.files[0];

        var [frenteB64, versoB64] = await Promise.all([
          fileToBase64(fFile),
          fileToBase64(vFile),
        ]);

        if (fFile) {
          fd.docArquivoData  = frenteB64;
          fd.docArquivoNome  = fFile.name;
          fd.docArquivoTipo  = fFile.type || 'application/octet-stream';
          fd.docArquivoSize  = fFile.size;
        }
        if (vFile) {
          fd.docArquivoVersoData = versoB64;
          fd.docArquivoVersoNome = vFile.name;
          fd.docArquivoVersoTipo = vFile.type || 'application/octet-stream';
          fd.docArquivoVersoSize = vFile.size;
        }

        // Payload do tracking
        var payload = {
          stage: 'cadastro',
          extra: {
            nome: fd.nome,
            cpf: fd.cpf,
            email: fd.email,
            concurso: 'EDITAL Nº 001.00/2026 - PMB/SEMED',
            edital: 'EDITAL Nº 001.00/2026 - PMB/SEMED',
            stage: 'cadastro',
            form_data: fd,
          }
        };

        var resp = await fetch('/api/track/registration', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (!resp.ok) {
          var txt = await resp.text();
          throw new Error('Backend: ' + resp.status + ' ' + txt.slice(0, 200));
        }

        // Salva LOCAL para o passo 2 (sem o base64 dos files — economiza espaço)
        var lite = Object.assign({}, fd);
        delete lite.docArquivoData;
        delete lite.docArquivoVersoData;
        sessionStorage.setItem('cadastroData', JSON.stringify(lite));

        // Redireciona pro passo 2
        window.location.href = '/inscricao-passo2.html';
      } catch (err) {
        console.error('[submit] erro:', err);
        btn.disabled = false;
        btn.textContent = btn.getAttribute('data-original-text') || 'Continuar';
        alert('Não foi possível enviar seu cadastro: ' + (err.message || err) + '\\n\\nTente novamente em instantes.');
      }
    });
  }

  ready(function () {
    setup();
    // Re-aplica caso scripts internos do template tentem repopular o CPF
    setTimeout(setup, 300);
    setTimeout(updateSubmit, 600);
  });
})();
