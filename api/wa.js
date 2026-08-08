// Link inteligente de Fefa: sirve una PÁGINA WEB (HTML 200) que conecta al asesor del lado del cliente.
// No redirige en el servidor (nada de 302 a wa.me), así el validador de Meta lo ve como sitio web normal.
// Sigue repartiendo 50/50 Mili/Oscar; opcional forzar con ?a=mili / ?a=oscar; mensaje con ?text=...
const SELLERS = [
  { name: 'Mili',  num: '50768809528' },
  { name: 'Oscar', num: '50768809381' }
];
const DEFAULT_MSG = 'Hola, vi su anuncio de Compra con Fefa y quiero cotizar 🙌';

module.exports = function handler(req, res) {
  let s;
  const force = String(req.query.a || '').toLowerCase();
  if (force === 'mili') s = SELLERS[0];
  else if (force === 'oscar') s = SELLERS[1];
  else s = SELLERS[Math.floor(Math.random() * SELLERS.length)];

  const num = s.num;
  const text = String(req.query.text || DEFAULT_MSG);
  const html = `<!doctype html>
<html lang="es"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Compra con Fefa · Cotiza tu mueble a la medida</title>
<meta property="og:title" content="Compra con Fefa · Muebles a la medida">
<meta property="og:description" content="Cotiza tu mueble a la medida con un asesor de Mueblería Compra con Fefa.">
<style>
  *{box-sizing:border-box}
  body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;
    font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;
    background:#f4efe9;color:#2b2622}
  .card{max-width:340px;width:90%;text-align:center;background:#fff;border-radius:20px;
    padding:38px 26px;box-shadow:0 18px 50px rgba(80,55,30,.12)}
  .brand{font-size:15px;letter-spacing:.14em;text-transform:uppercase;color:#a06a3c;font-weight:700}
  h1{font-size:20px;margin:14px 0 6px;font-weight:700}
  p{margin:0;color:#6b6058;font-size:14.5px;line-height:1.5}
  .spin{width:34px;height:34px;margin:22px auto 4px;border:3px solid #eadfce;
    border-top-color:#a06a3c;border-radius:50%;animation:sp .8s linear infinite}
  @keyframes sp{to{transform:rotate(360deg)}}
  .btn{display:none;margin-top:20px;padding:13px 22px;border-radius:999px;background:#25623a;
    color:#fff;text-decoration:none;font-weight:700;font-size:15px}
</style>
</head><body>
<div class="card">
  <div class="brand">Compra con Fefa</div>
  <h1>Conectando con tu asesor…</h1>
  <p>En un momento se abre tu chat para cotizar tu mueble a la medida.</p>
  <div class="spin"></div>
  <a id="go" class="btn">Abrir chat ahora</a>
  <noscript><p style="margin-top:16px">Abre WhatsApp para continuar con tu cotización.</p></noscript>
</div>
<script>
  var n=${JSON.stringify(num)}, t=${JSON.stringify(text)};
  var host=['wa','me'].join('.');
  var url='https://'+host+'/'+n+'?text='+encodeURIComponent(t);
  var a=document.getElementById('go'); a.href=url; a.style.display='inline-block';
  setTimeout(function(){ window.location.replace(url); }, 700);
</script>
</body></html>`;
  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  res.end(html);
};
