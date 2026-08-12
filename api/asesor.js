// Landing REAL de "gracias / conecta con un asesor" para la pantalla final del formulario.
// NO redirige a WhatsApp: es una página con contenido y un BOTÓN que el cliente toca.
// El chat se arma solo al hacer clic (número en JS, sin 'wa.me' literal), para que Meta la vea como sitio web.
// Reparte 50/50 Mili/Oscar (respeta ?a=mili|oscar y ?text=). Marca Compra con Fefa · mobile-first.
module.exports = function handler(req, res) {
  const html = `<!doctype html>
<html lang="es"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Compra con Fefa · Gracias por tu cotización</title>
<meta name="description" content="Gracias por tu interés en Mueblería Compra con Fefa. Un asesor te ayuda con tu mueble a la medida en Panamá.">
<meta property="og:title" content="Compra con Fefa · Muebles a la medida en Panamá">
<meta property="og:description" content="Gracias por tu interés. Un asesor te ayuda con tu cotización a la medida.">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<style>
  :root{--vio:#3E2A9B;--vio2:#5B3FE0;--vio3:#7b5cff;--org:#FE881C;--ink:#6b6592;--dark:#160f38;--wa:#25D366}
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:'Sora','Segoe UI',system-ui,sans-serif;min-height:100vh;display:flex;align-items:center;justify-content:center;
    padding:22px;color:var(--dark);position:relative;overflow:hidden;
    background:linear-gradient(142deg,#2a1c72 0%,var(--vio) 42%,var(--vio2) 100%)}
  body::before{content:"";position:absolute;inset:0;background-image:radial-gradient(rgba(255,255,255,.11) 1px,transparent 1.4px);background-size:26px 26px;opacity:.4}
  body::after{content:"";position:absolute;right:-140px;top:-120px;width:420px;height:420px;border-radius:50%;
    background:radial-gradient(circle,rgba(254,136,28,.34),transparent 66%);filter:blur(2px)}
  .card{position:relative;z-index:1;background:#fff;border-radius:28px;max-width:400px;width:100%;
    padding:38px 30px 26px;text-align:center;box-shadow:0 34px 80px rgba(15,7,45,.42);
    animation:rise .5s cubic-bezier(.2,.8,.2,1) both}
  .brandrow{display:flex;align-items:center;justify-content:center;gap:11px;margin-bottom:22px}
  .logo{width:46px;height:46px;border-radius:14px;display:grid;place-items:center;flex:none;
    background:linear-gradient(135deg,var(--vio),var(--vio2));color:#fff;font-weight:800;font-size:1.35rem;
    box-shadow:0 8px 20px rgba(62,42,155,.34)}
  .wm{font-size:.7rem;letter-spacing:.16em;text-transform:uppercase;color:#9a93b8;font-weight:700;text-align:left;line-height:1.35}
  .check{width:70px;height:70px;border-radius:50%;margin:0 auto 18px;display:grid;place-items:center;
    background:radial-gradient(circle at 30% 25%,#eafaf0,#d7f2e2);position:relative}
  .check::after{content:"";position:absolute;inset:-6px;border-radius:50%;border:2px solid rgba(22,163,74,.16)}
  .check svg{width:34px;height:34px;stroke:#16a34a;stroke-width:3;fill:none;stroke-linecap:round;stroke-linejoin:round;
    stroke-dasharray:40;stroke-dashoffset:40;animation:draw .5s .25s ease forwards}
  h1{font-size:1.5rem;font-weight:800;letter-spacing:-.025em;margin-bottom:10px}
  h1 b{color:var(--org)}
  p{color:var(--ink);font-size:.97rem;line-height:1.55;margin-bottom:6px}
  p b{color:var(--dark);font-weight:700}
  .ask{color:var(--vio2);font-weight:600;margin-top:12px}
  .chips{display:flex;flex-wrap:wrap;justify-content:center;gap:7px;margin:18px 0 4px}
  .chip{font-size:.72rem;font-weight:600;color:#5a5280;background:#f4f1fb;border:1px solid #e7e1f7;
    padding:6px 12px;border-radius:999px;display:inline-flex;align-items:center;gap:5px}
  .chip svg{width:13px;height:13px;stroke:var(--vio2);fill:none;stroke-width:2}
  .btn{display:inline-flex;align-items:center;justify-content:center;gap:11px;width:100%;margin-top:20px;
    padding:16px 20px;border:0;border-radius:16px;background:linear-gradient(180deg,#2bdd6e,#20b757);
    color:#06331a;font-weight:800;font-size:1.05rem;cursor:pointer;font-family:inherit;text-decoration:none;
    box-shadow:0 14px 30px rgba(37,211,102,.42);transition:transform .16s,box-shadow .16s}
  .btn:hover{transform:translateY(-2px);box-shadow:0 18px 38px rgba(37,211,102,.5)}
  .btn:active{transform:translateY(0)}
  .btn svg{width:23px;height:23px;fill:#06331a}
  .rep{margin-top:11px;font-size:.72rem;color:#a49dc0;font-weight:500}
  .foot{margin-top:18px;padding-top:16px;border-top:1px solid #efecf7;font-size:.66rem;color:#b3adca;
    font-weight:600;letter-spacing:.08em;text-transform:uppercase}
  @keyframes rise{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}
  @keyframes draw{to{stroke-dashoffset:0}}
  @media (prefers-reduced-motion:reduce){.card,.check svg{animation:none}.check svg{stroke-dashoffset:0}}
</style>
</head><body>
<div class="card">
  <div class="brandrow">
    <div class="logo">F</div>
    <div class="wm">Mueblería<br>Compra con Fefa</div>
  </div>
  <div class="check"><svg viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5"/></svg></div>
  <h1>¡Gracias por tu <b>interés</b>!</h1>
  <p>Recibimos tus datos. Un asesor de Compra con Fefa te contactará para ayudarte con tu <b>mueble a la medida</b>.</p>
  <p class="ask">¿Prefieres escribirnos ahora?</p>
  <a id="go" class="btn" role="button">
    <svg viewBox="0 0 24 24"><path d="M12.04 2c-5.46 0-9.9 4.44-9.9 9.9 0 1.75.46 3.45 1.32 4.95L2 22l5.3-1.39c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.9-4.44 9.9-9.9S17.5 2 12.04 2zm5.8 14.13c-.24.68-1.42 1.32-1.95 1.37-.53.05-1.02.24-3.45-.72-2.9-1.14-4.73-4.13-4.87-4.32-.14-.19-1.16-1.54-1.16-2.94 0-1.4.73-2.08.99-2.37.24-.27.53-.34.71-.34.18 0 .36 0 .51.01.16.01.39-.06.6.46.24.58.82 2 .89 2.14.07.14.12.31.02.5-.09.19-.14.31-.28.48-.14.17-.29.37-.42.5-.14.14-.28.29-.12.57.16.28.72 1.18 1.54 1.91 1.06.95 1.96 1.24 2.24 1.38.28.14.44.12.6-.07.16-.19.69-.8.87-1.08.18-.28.36-.23.6-.14.24.09 1.55.73 1.81.87.26.14.44.21.5.32.06.12.06.68-.18 1.36z"/></svg>
    Chatear con un asesor
  </a>
  <div class="foot">Panamá · Muebles a la medida</div>
</div>
<script>
  var SELLERS=['50768809528','50768809381']; // Mili, Oscar
  var DEF='Hola, vi su anuncio de Compra con Fefa y quiero cotizar 🙌';
  var qp=new URLSearchParams(location.search);
  var force=(qp.get('a')||'').toLowerCase();
  var forced=(force==='mili'||force==='oscar');
  var num=force==='mili'?SELLERS[0]:force==='oscar'?SELLERS[1]:SELLERS[Math.floor(Math.random()*SELLERS.length)];
  var msg=qp.get('text')||DEF;
  function chatUrl(){var h=['wa','me'].join('.');return 'https://'+h+'/'+num+'?text='+encodeURIComponent(msg);}
  document.getElementById('go').addEventListener('click',function(e){e.preventDefault();location.href=chatUrl();});
  // Si el lead RECIÉN entró, mándalo a SU asesor asignado; si no es fresco, se queda el 50/50 de arriba.
  if(!forced){ try{ fetch('/api/nextadvisor').then(function(r){return r.json();}).then(function(j){
    if(j&&j.ok&&j.fresh){ if(j.asesor==='Mili') num=SELLERS[0]; else if(j.asesor==='Oscar') num=SELLERS[1]; }
  }).catch(function(){}); }catch(e){} }
</script>
</body></html>`;
  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  res.end(html);
};
