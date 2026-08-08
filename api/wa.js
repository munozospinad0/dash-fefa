// Link inteligente de WhatsApp para Fefa: reparte a los clientes 50/50 entre los 2 vendedores.
// Úsalo en la pantalla final del formulario ("Escríbenos por WhatsApp") y/o en la bio.
// Cada click redirige alternando a Mili u Oscar, con mensaje pre-cargado.
// wa.me funciona con cualquier número (no necesita estar "enlazado" para CTWA).

const SELLERS = [
  { name: 'Mili',  num: '50768809528' },
  { name: 'Oscar', num: '50768809381' }
];
const DEFAULT_MSG = 'Hola, vi su anuncio de Compra con Fefa y quiero cotizar 🙌';

module.exports = function handler(req, res) {
  // reparto 50/50 (por click); opcional forzar con ?a=mili / ?a=oscar
  let s;
  const force = String(req.query.a || '').toLowerCase();
  if (force === 'mili')  s = SELLERS[0];
  else if (force === 'oscar') s = SELLERS[1];
  else s = SELLERS[Math.floor(Math.random() * SELLERS.length)];

  const text = encodeURIComponent(req.query.text || DEFAULT_MSG);
  const url = `https://wa.me/${s.num}?text=${text}`;
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  res.writeHead(302, { Location: url });
  res.end();
};
