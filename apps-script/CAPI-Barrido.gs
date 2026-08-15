/*** Fefa · Barrido de eventos a Meta — ARCHIVO SUELTO, NO TOCA TU Codigo.gs ***
 *
 * PARA QUÉ
 *   Hoy el evento solo sale a Meta cuando alguien marca el estado DESDE EL
 *   DASHBOARD. Si lo escriben directo en la hoja (pasa: hay celdas en MAYÚSCULAS,
 *   que el dashboard nunca escribe así), Meta no se entera nunca.
 *   Esto recorre la hoja cada 10 minutos y manda lo que falte, marquen donde marquen.
 *
 * INSTALACIÓN — una sola vez, NO hay que republicar el Web App
 *   1. Hoja de Fefa -> Extensiones -> Apps Script
 *   2. Botón "+" (arriba izquierda) -> Script -> nómbralo  CAPI-Barrido
 *      -> borra el ejemplo, pega TODO esto -> Guardar
 *   3. En el selector de función elige  barridoInstalar  -> Run
 *      (pide permisos la primera vez: acéptalos)
 *
 * PROBAR ANTES:   barridoSimular    (dice qué mandaría, sin mandar nada)
 * VER / QUITAR:   barridoDesinstalar
 ***************************************************************************/

const BAR_DATASET  = '1965221274196004';   // conjunto de datos de Fefa
const BAR_APIVER   = 'v25.0';
const BAR_CADA_MIN = 10;
const BAR_COL_LOG  = 'capi_enviado';       // columna de control; se crea sola
const BAR_DIAS     = 7;                    // Meta rechaza eventos más viejos que esto

/* QUÉ HACER CON LO MARCADO HACE MÁS DE 7 DÍAS
   Meta rechaza en seco el event_time real (error 2804003 "la fecha del evento es
   demasiado antigua"). La única forma de aprovechar esa data es mandarla con la
   fecha de HOY. Eso sirve muy bien para PÚBLICOS —excluir a los descalificados,
   armar similares de los que sí califican— pero NO para optimizar, porque Meta
   creería que pasó hoy.
   Por eso 'qualified' queda excluido: es el evento con el que optimiza la campaña
   activa, y meterle fechas falsas ensuciaría justo la señal que acabamos de
   arreglar. Si algún día quieres mandarlo igual, quítalo de la lista de abajo. */
const BAR_VIEJOS_ENVIAR  = true;
const BAR_VIEJOS_EXCLUIR = ['qualified'];   // estados que NO se reenvían con fecha de hoy

/* Los nombres DEBEN coincidir con los del Codigo.gs y con el custom_event_str
   del ad set. 'qualified' va tal cual porque así lo espera la campaña
   "Fefa | Leads | Sofás Salas Camas". Si cambias uno, cambia los tres sitios. */
const BAR_EVENTOS = {
  contacted:    'Contact',
  qualified:    'qualified',
  disqualified: 'Lead_Descalificado',
  converted:    'Purchase'
};

const BAR_COLS = {
  id:     ['id','lead_id'],
  email:  ['email','correo','correo_electronico'],
  phone:  ['phone_number','numero_de_whatsapp','whatsapp','telefono','celular','numero_de_telefono'],
  status: ['lead_status','status','estado','lead_estado'],
  fecha:  ['created_time','fecha_de_creacion','hora_de_creacion','fecha','created'],
  monto:  ['monto_venta','monto','valor_venta','venta','valor','importe','total']
};

/* ───────────────────────── instalación ───────────────────────── */

function barridoInstalar(){
  barridoDesinstalar();
  ScriptApp.newTrigger('barridoCorrer').timeBased().everyMinutes(BAR_CADA_MIN).create();
  const r = barridoCorrer();
  Logger.log('Instalado. Revisa cada ' + BAR_CADA_MIN + ' min. Primera pasada: ' + r);
  return r;
}
function barridoDesinstalar(){
  let n = 0;
  ScriptApp.getProjectTriggers().forEach(function(t){
    if (t.getHandlerFunction() === 'barridoCorrer'){ ScriptApp.deleteTrigger(t); n++; }
  });
  Logger.log('triggers eliminados: ' + n); return n;
}
function barridoSimular(){ return barridoCorrer(true); }

/* ───────────────────────── utilidades ───────────────────────── */

function barTok_(){ return PropertiesService.getScriptProperties().getProperty('META_TOKEN') || ''; }
function barNorm_(s){
  return String(s == null ? '' : s).toLowerCase().normalize('NFD')
    .replace(/[̀-ͯ]/g,'').replace(/[^a-z0-9]+/g,'_').replace(/^_|_$/g,'');
}
function barMapa_(sh){
  const h = sh.getRange(1,1,1,sh.getLastColumn()).getValues()[0], m = {};
  h.forEach(function(x,i){ const k = barNorm_(x); if (k && !m[k]) m[k] = i+1; });
  return m;
}
function barCol_(m,al){ for (const a of al){ const c = m[barNorm_(a)]; if (c) return c; } return 0; }
function barSha_(s){
  const b = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, String(s), Utilities.Charset.UTF_8);
  return b.map(function(x){ return ('0'+(x & 0xFF).toString(16)).slice(-2); }).join('');
}
function barFecha_(v){
  if (v instanceof Date) return Math.floor(v.getTime()/1000);
  const s = String(v||'').slice(0,16).replace('T',' ');
  const m = s.match(/(\d{4})-(\d{2})-(\d{2})[ ]?(\d{2})?:?(\d{2})?/);
  if (!m) return 0;
  return Math.floor(new Date(+m[1], +m[2]-1, +m[3], +(m[4]||12), +(m[5]||0)).getTime()/1000);
}

/* ───────────────────────── barrido ───────────────────────── */

function barridoCorrer(soloSimular){
  if (!barTok_()) { Logger.log('FALTA META_TOKEN en Propiedades del script'); return 'falta META_TOKEN'; }
  const ahora = Math.floor(Date.now()/1000), limite = BAR_DIAS*24*3600;
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let enviados = 0, repetidos = 0, viejos = 0, errores = 0, recuperados = 0;

  ss.getSheets().forEach(function(sh){
    if (sh.getLastRow() < 2) return;
    let m = barMapa_(sh);
    const ci = barCol_(m, BAR_COLS.id), cs = barCol_(m, BAR_COLS.status);
    if (!ci || !cs) return;

    let cl = barCol_(m, [BAR_COL_LOG]);
    if (!cl){
      if (soloSimular){ Logger.log('(simulacion) crearia la columna ' + BAR_COL_LOG); }
      else { sh.getRange(1, sh.getLastColumn()+1).setValue(BAR_COL_LOG); m = barMapa_(sh); cl = barCol_(m,[BAR_COL_LOG]); }
    }
    const ce = barCol_(m, BAR_COLS.email), cp = barCol_(m, BAR_COLS.phone),
          cf = barCol_(m, BAR_COLS.fecha), cm = barCol_(m, BAR_COLS.monto);

    const data = sh.getRange(2,1,sh.getLastRow()-1,sh.getLastColumn()).getValues();
    const logs = [];

    for (let i = 0; i < data.length; i++){
      const row = data[i];
      const estado = barNorm_(row[cs-1]);
      const evento = BAR_EVENTOS[estado];
      const ya = cl ? String(row[cl-1]||'').trim() : '';

      if (!evento)      { logs.push([ya]); continue; }
      if (ya === estado){ logs.push([ya]); repetidos++; continue; }

      // Fecha a usar. Si el lead es viejo, Meta no acepta su fecha real: o se manda
      // con la de hoy (sirve para públicos) o no se manda.
      let ts = cf ? barFecha_(row[cf-1]) : 0;
      if (!ts) ts = ahora;
      if (ahora - ts > limite){
        if (!BAR_VIEJOS_ENVIAR || BAR_VIEJOS_EXCLUIR.indexOf(estado) >= 0){
          logs.push([ya]); viejos++; continue;
        }
        ts = ahora;            // se reetiqueta con hoy para que Meta lo acepte
        recuperados++;
      }

      if (soloSimular){ logs.push([ya]); enviados++; continue; }

      const monto = cm ? Number(String(row[cm-1]||'').replace(/[^0-9.\-]/g,'')) : 0;
      const res = barPost_(evento, {
        id:    row[ci-1],
        email: ce ? row[ce-1] : '',
        phone: cp ? row[cp-1] : '',
        monto: isFinite(monto) ? monto : 0,
        ts:    ts || ahora
      });
      if (res.ok){ logs.push([estado]); enviados++; } else { logs.push([ya]); errores++; }
      Utilities.sleep(120);
    }
    if (!soloSimular && cl && logs.length) sh.getRange(2, cl, logs.length, 1).setValues(logs);
  });

  const r = (soloSimular ? '(SIMULACION, no se envio nada) ' : '') +
            'enviados ' + enviados + ' · de esos, viejos reetiquetados con hoy ' + recuperados +
            ' · ya estaban ' + repetidos + ' · omitidos por viejos ' + viejos +
            ' · con error ' + errores;
  Logger.log(r);
  return r;
}

function barPost_(nombre, lead){
  const ud = {};
  const lid = String(lead.id||'').replace(/[^0-9]/g,'');
  if (lid) ud.lead_id = Number(lid);
  if (lead.email) ud.em = [barSha_(String(lead.email).trim().toLowerCase())];
  if (lead.phone){ const p = String(lead.phone).replace(/[^0-9]/g,''); if (p) ud.ph = [barSha_(p)]; }
  if (!ud.lead_id && !ud.em && !ud.ph) return { ok:false, code:'sin_identificador' };

  const cd = { event_source: 'crm' };
  if (nombre === 'Purchase' && Number(lead.monto) > 0){ cd.value = Number(lead.monto); cd.currency = 'USD'; }

  const evt = {
    event_name: nombre,
    event_time: lead.ts,
    action_source: 'system_generated',
    event_id: 'fefa-' + (lid || 'x') + '-' + nombre,   // estable: Meta deduplica si se repite
    user_data: ud,
    custom_data: cd
  };
  const url = 'https://graph.facebook.com/' + BAR_APIVER + '/' + BAR_DATASET +
              '/events?access_token=' + encodeURIComponent(barTok_());
  const resp = UrlFetchApp.fetch(url, { method:'post', contentType:'application/json',
                 payload: JSON.stringify({ data:[evt] }), muteHttpExceptions:true });
  const code = resp.getResponseCode();
  if (code < 200 || code >= 300) Logger.log('CAPI ' + code + ': ' + resp.getContentText().slice(0,200));
  return { ok: code >= 200 && code < 300, code: code };
}
