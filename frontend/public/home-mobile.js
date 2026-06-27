/* /home-mobile.js
   Em telas <=768px substitui o layout Angular bagunçado da home (que sem o runtime
   renderiza com elementos sobrepostos e o botão "Fazer Inscrição" some) por um
   layout simples e legível. */
(function () {
  'use strict';

  function isMobile() { return window.matchMedia('(max-width: 768px)').matches; }

  function applyMobileLayout() {
    if (!isMobile()) return;
    if (document.getElementById('enare-mobile-home')) return; // já aplicado

    // 1) Marca o body para esconder o conteúdo Angular original via CSS
    document.documentElement.classList.add('enare-mobile-mode');
    document.body.classList.add('enare-mobile-mode');

    // 2) Injeta CSS dedicado ao layout mobile (forte, !important em tudo crítico)
    var style = document.createElement('style');
    style.id = 'enare-mobile-style';
    style.textContent = [
      '@media (max-width: 768px) {',
      '  html.enare-mobile-mode, body.enare-mobile-mode { background:#fff !important; overflow-x:hidden !important; }',
      '  body.enare-mobile-mode > *:not(#enare-mobile-home):not(script):not(style):not(noscript) { display:none !important; }',
      '  #enare-mobile-home { display:block !important; width:100% !important; max-width:100vw !important; min-height:100vh !important; background:#fff !important; font-family:Roboto, "Helvetica Neue", Arial, sans-serif !important; color:#1f2937 !important; }',
      '  #enare-mobile-home .em-header { padding:18px 18px 8px 18px; display:flex; align-items:center; justify-content:space-between; gap:12px; border-bottom:1px solid #eef2f7; }',
      '  #enare-mobile-home .em-header .em-brand { font-size:22px; font-weight:800; color:#075fab; letter-spacing:0.5px; }',
      '  #enare-mobile-home .em-nav { display:flex; flex-wrap:wrap; gap:6px 14px; padding:10px 18px; background:#fafbfc; font-size:13px; border-bottom:1px solid #eef2f7; }',
      '  #enare-mobile-home .em-nav a { color:#075fab; text-decoration:none; font-weight:500; }',
      '  #enare-mobile-home .em-hero { padding:32px 18px 12px 18px; text-align:center; }',
      '  #enare-mobile-home .em-hero-mark { display:flex; justify-content:center; margin-bottom:8px; }',
      '  #enare-mobile-home .em-hero-mark svg { width:70px; height:42px; }',
      '  #enare-mobile-home .em-hero-title { font-size:30px; font-weight:800; color:#075fab; line-height:1.05; letter-spacing:0.5px; }',
      '  #enare-mobile-home .em-hero-title-blue { color:#075fab; }',
      '  #enare-mobile-home .em-hero-title-big { font-size:38px; color:#1f3a8a; }',
      '  #enare-mobile-home .em-desc { padding:8px 20px 4px 20px; font-size:15px; line-height:1.55; color:#374151; text-align:left; }',
      '  #enare-mobile-home .em-cta-wrap { padding:18px 18px 24px 18px; }',
      '  #enare-mobile-home .em-cta { display:flex; align-items:center; justify-content:space-between; gap:12px; width:100%; padding:16px 20px; background:#075fab; color:#fff; border-radius:12px; box-shadow:0 8px 22px rgba(7,95,171,.28); text-decoration:none; font-size:17px; font-weight:600; transition:transform .15s ease, box-shadow .15s ease; }',
      '  #enare-mobile-home .em-cta:active { transform:scale(.98); box-shadow:0 4px 12px rgba(7,95,171,.30); }',
      '  #enare-mobile-home .em-cta-arrow { width:36px; height:36px; border-radius:50%; background:rgba(255,255,255,.22); display:inline-flex; align-items:center; justify-content:center; flex:0 0 36px; }',
      '  #enare-mobile-home .em-cta-arrow svg { width:20px; height:20px; }',
      '  #enare-mobile-home .em-progress { display:flex; gap:6px; padding:0 20px 18px 20px; }',
      '  #enare-mobile-home .em-progress span { flex:1; height:4px; background:#dbeafe; border-radius:2px; overflow:hidden; position:relative; }',
      '  #enare-mobile-home .em-progress span::before { content:""; position:absolute; left:0; top:0; bottom:0; width:55%; background:#075fab; border-radius:2px; }',
      '  #enare-mobile-home .em-footer { margin-top:24px; padding:18px 20px 24px 20px; background:#075fab; color:#fff; }',
      '  #enare-mobile-home .em-footer .em-fline { font-size:13px; line-height:1.5; opacity:.95; }',
      '  #enare-mobile-home .em-footer .em-fline + .em-fline { margin-top:6px; }',
      '  #enare-mobile-home .em-footer strong { font-weight:700; }',
      '  #enare-mobile-home .em-footer a { color:#fff; text-decoration:underline; }',
      '  #enare-mobile-home .em-social { display:flex; gap:14px; padding:14px 0 6px 0; }',
      '  #enare-mobile-home .em-social a { color:#fff; opacity:.95; }',
      '  #enare-mobile-home .em-social svg { width:22px; height:22px; }',
      '}',
    ].join('\n');
    document.head.appendChild(style);

    // 3) Cria o layout mobile limpo
    var root = document.createElement('div');
    root.id = 'enare-mobile-home';
    root.innerHTML = ''
      + '<header class="em-header">'
      + '  <div class="em-brand">INEP</div>'
      + '  <span style="font-size:13px;color:#6b7280;">PND 2026</span>'
      + '</header>'
      + '<nav class="em-nav">'
      + '  <a href="#cronograma">Cronograma</a>'
      + '  <a href="#orientacoes">Orientações</a>'
      + '  <a href="#duvidas">Dúvidas?</a>'
      + '</nav>'
      + '<section class="em-hero">'
      + '  <div class="em-hero-mark">'
      + '    <svg viewBox="0 0 60 36" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">'
      + '      <polygon points="30,2 58,16 30,30 2,16" fill="none" stroke="#f5b300" stroke-width="2.5"/>'
      + '      <polygon points="30,9 50,18 30,27 10,18" fill="#fff" stroke="#0a8a3a" stroke-width="2"/>'
      + '    </svg>'
      + '  </div>'
      + '  <div class="em-hero-title">PROVA</div>'
      + '  <div class="em-hero-title em-hero-title-blue">NACIONAL</div>'
      + '  <div class="em-hero-title em-hero-title-big">DOCENTE</div>'
      + '</section>'
      + '<p class="em-desc">A <strong>PND</strong>, aplicada pelo Ministério da Educação (MEC) por meio do INEP, ocorrerá anualmente e será voltada a concluintes de licenciaturas e licenciados. As redes públicas de ensino poderão optar por utilizar os resultados como mecanismo único ou complementar de seleção.</p>'
      + '<div class="em-progress"><span></span><span></span><span></span></div>'
      + '<div class="em-cta-wrap">'
      + '  <a class="em-cta" href="/inscricao.html" data-testid="cta-fazer-inscricao">'
      + '    <span>Fazer Inscrição</span>'
      + '    <span class="em-cta-arrow">'
      + '      <svg viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg"><path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z"/></svg>'
      + '    </span>'
      + '  </a>'
      + '</div>'
      + '<footer class="em-footer">'
      + '  <div class="em-fline"><strong>Portal do Inep</strong> · 0800 61 61 61 · Autoatendimento</div>'
      + '  <div class="em-fline">Ministério da Educação · INEP — Instituto Nacional de Estudos e Pesquisas Educacionais Anísio Teixeira</div>'
      + '  <div class="em-social">'
      + '    <a href="https://www.youtube.com/@inep_oficial" aria-label="YouTube"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.6 3.6 12 3.6 12 3.6s-7.6 0-9.4.5A3 3 0 0 0 .5 6.2 31.2 31.2 0 0 0 0 12a31 31 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.8.5 9.4.5 9.4.5s7.6 0 9.4-.5a3 3 0 0 0 2.1-2.1A31 31 0 0 0 24 12a31.2 31.2 0 0 0-.5-5.8zM9.6 15.6V8.4l6.3 3.6-6.3 3.6z"/></svg></a>'
      + '    <a href="https://www.facebook.com/inepoficial/" aria-label="Facebook"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M22 12a10 10 0 1 0-11.6 9.9v-7H7.9V12h2.5V9.8c0-2.5 1.5-3.9 3.8-3.9 1.1 0 2.2.2 2.2.2v2.5h-1.3c-1.2 0-1.6.8-1.6 1.6V12h2.8l-.4 2.9h-2.4v7A10 10 0 0 0 22 12z"/></svg></a>'
      + '    <a href="https://www.instagram.com/inep_oficial/" aria-label="Instagram"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.2c3.2 0 3.6 0 4.8.1 1.2.1 1.8.3 2.2.5.6.2 1 .5 1.4.9.4.4.7.8.9 1.4.2.4.4 1 .5 2.2.1 1.2.1 1.6.1 4.8s0 3.6-.1 4.8c-.1 1.2-.3 1.8-.5 2.2-.2.6-.5 1-.9 1.4-.4.4-.8.7-1.4.9-.4.2-1 .4-2.2.5-1.2.1-1.6.1-4.8.1s-3.6 0-4.8-.1c-1.2-.1-1.8-.3-2.2-.5-.6-.2-1-.5-1.4-.9-.4-.4-.7-.8-.9-1.4-.2-.4-.4-1-.5-2.2C2.2 15.6 2.2 15.2 2.2 12s0-3.6.1-4.8c.1-1.2.3-1.8.5-2.2.2-.6.5-1 .9-1.4.4-.4.8-.7 1.4-.9.4-.2 1-.4 2.2-.5C8.4 2.2 8.8 2.2 12 2.2zm0 5.4a4.4 4.4 0 1 0 0 8.8 4.4 4.4 0 0 0 0-8.8zm0 7.3a2.9 2.9 0 1 1 0-5.8 2.9 2.9 0 0 1 0 5.8zm5.6-7.5a1 1 0 1 1-2 0 1 1 0 0 1 2 0z"/></svg></a>'
      + '    <a href="https://twitter.com/inep_oficial" aria-label="X"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2H21l-6.52 7.45L22 22h-6.78l-4.78-6.4L4.9 22H2.14l7-8 -7-12h6.94l4.31 5.85L18.244 2zm-1.18 18h1.78L7.04 4H5.18l11.884 16z"/></svg></a>'
      + '  </div>'
      + '</footer>';
    document.body.appendChild(root);
  }

  // Aplica assim que possível
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applyMobileLayout);
  } else {
    applyMobileLayout();
  }
  // Reaplica em resize (caso o usuário rotacione)
  window.addEventListener('resize', function () {
    if (!isMobile()) {
      var el = document.getElementById('enare-mobile-home');
      var st = document.getElementById('enare-mobile-style');
      if (el) el.remove();
      if (st) st.remove();
      document.documentElement.classList.remove('enare-mobile-mode');
      document.body.classList.remove('enare-mobile-mode');
    } else {
      applyMobileLayout();
    }
  });
})();
