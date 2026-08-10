/*** Mueblería Compra con Fefa · Dashboard API (leads del Google Sheet + métricas) ***/
/*** Apps Script SOBRE el Google Sheet "Leads Fefa" (el que conecta el form de Meta).       ***/
/*** Token de Meta (opcional, solo métricas): Configuración del proyecto > Propiedades del script > META_TOKEN ***/
/*** Detecta las columnas sin importar idioma/acentos (nombre_completo o full_name, etc.).   ***/

const AD_ACCOUNT = 'act_1795776247808784';   // cuenta de Fefa
const API_VER    = 'v25.0';
const KEY        = 'fefa2026';               // = APPS_SCRIPT_KEY en Vercel
const DATASET_ID = '1965221274196004';       // conjunto de datos de Fefa (CAPI: eventos de calidad al marcar en el dash)
const STATUSES   = ['created','contacted','qualified','disqualified','converted'];
const CAPI_STAGES= ['contacted','qualified','disqualified','converted'];

/* Cómo se llama cada etapa DENTRO de Meta.
   'Contact' y 'Purchase' son eventos ESTÁNDAR: Meta los entiende de fábrica, salen en
   el Administrador de eventos con su propia tarjeta y permiten pujar por VALOR.
   El de calificado va personalizado porque Meta no tiene un estándar para
   "lead que al vendedor le sirvió" — ese es el patrón de conversion leads.
   Para cambiarlos, se toca SOLO esta tabla. */
const EVENT_MAP = {
  contacted:    'Contact',
  qualified:    'Lead_Calificado',
  disqualified: 'Lead_Descalificado',
  converted:    'Purchase'
};
function metaEvent_(status){ return EVENT_MAP[status] || status; }
const STATUS_DEFAULT = 'lead_status';
const ASESOR_DEFAULT = 'asesor';
const MONTO_DEFAULT  = 'monto_venta';   // cuánto se vendió; lo escribe el vendedor desde el dashboard
const PRODUCTO_DEFAULT = 'producto_venta'; // qué producto compró; lo escribe el vendedor desde el dashboard
const ADVISORS   = ['Mili','Oscar'];   // los 2 asesores; los leads se reparten 50/50 y se pueden reasignar

// alias de columnas (se comparan normalizados: minúsculas, sin acentos, _)
const A = {
  id:      ['id','lead_id'],
  created: ['created_time','created','fecha_de_creacion','hora_de_creacion','fecha'],
  full:    ['full_name','nombre_completo','nombre_y_apellido','nombre_apellido','name'],
  first:   ['first_name','nombre','nombres'],
  last:    ['last_name','apellido','apellidos'],
  email:   ['email','correo','correo_electronico','e_mail'],
  phone:   ['phone_number','numero_de_telefono','telefono','celular','phone','numero_de_celular','whatsapp','numero_de_whatsapp','whatsapp_number','num_whatsapp'],
  campaign:['campaign_name','nombre_de_la_campana','campana','campaign'],
  ad_id:   ['ad_id','id_del_anuncio','adid'],
  ad:      ['ad_name','nombre_del_anuncio','anuncio','ad'],
  status:  ['lead_status','status','estado','lead_estado'],
  asesor:  ['asesor','advisor','vendedor','assigned','asignado'],
  monto:   ['monto_venta','monto','valor_venta','venta','valor','importe','total','monto_de_venta'],
  producto:['producto_venta','producto','producto_vendido','que_compro','articulo','producto_comprado']
};

function META_TOKEN(){ return PropertiesService.getScriptProperties().getProperty('META_TOKEN') || ''; }
function norm_(s){ return String(s==null?'':s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/[^a-z0-9]+/g,'_').replace(/^_|_$/g,''); }
function nmap_(sh){ const h=sh.getRange(1,1,1,sh.getLastColumn()).getValues()[0]; const m={}; h.forEach((x,i)=>{ const k=norm_(x); if(k&&!m[k]) m[k]=i+1; }); return m; }
function col_(nm,aliases){ for(const a of aliases){ const c=nm[norm_(a)]; if(c) return c; } return 0; }
function get_(row,nm,aliases){ const c=col_(nm,aliases); return c?row[c-1]:''; }
function muebleCol_(nm){ const k=Object.keys(nm).find(x=>/mueble|que_busca/.test(x)); return k?nm[k]:0; }
/* El teléfono es lo único sin lo cual el vendedor no puede trabajar el lead, y Meta
   le cambia el nombre al campo cada vez que se toca el formulario (pasó: el form
   nuevo trae "número_de_whatsapp" y el dashboard dejó de mostrarlo). Por eso, si
   ningún alias coincide, se busca CUALQUIER columna que parezca un teléfono. */
function phoneCol_(nm){
  const c=col_(nm,A.phone); if(c) return c;
  const k=Object.keys(nm).find(x=>/whats|telef|celul|phone|movil|numero/.test(x));
  return k?nm[k]:0;
}
function phoneOf_(row,nm){ const c=phoneCol_(nm); return c?row[c-1]:''; }
function isLeadSheet_(nm){ return !!(col_(nm,A.id)||col_(nm,A.email)||col_(nm,A.full)||col_(nm,A.first)||phoneCol_(nm)); }
function clean_(v){ return String(v==null?'':v).replace(/^[a-zA-Z]+:\s*/,'').trim(); }
function isTest_(a,b){ return /test lead|dummy data|test@meta\.com/i.test(String(a)+' '+String(b)); }

// Corre 1 vez: agrega la columna de estado + dropdown en la(s) hoja(s) de leads
function setup(){
  const ss=SpreadsheetApp.getActiveSpreadsheet(); let n=0;
  ss.getSheets().forEach(sh=>{
    if(sh.getLastRow()<1) return; const nm=nmap_(sh); if(!isLeadSheet_(nm)) return;
    let sc=col_(nm,A.status);
    if(!sc){ sh.getRange(1,sh.getLastColumn()+1).setValue(STATUS_DEFAULT); sc=sh.getLastColumn(); }
    const rule=SpreadsheetApp.newDataValidation().requireValueInList(STATUSES,true).build();
    sh.getRange(2,sc,Math.max(1,sh.getMaxRows()-1),1).setDataValidation(rule);
    let ac=col_(nm,A.asesor);
    if(!ac){ sh.getRange(1,sh.getLastColumn()+1).setValue(ASESOR_DEFAULT); ac=sh.getLastColumn(); }
    const rule2=SpreadsheetApp.newDataValidation().requireValueInList(ADVISORS,true).build();
    sh.getRange(2,ac,Math.max(1,sh.getMaxRows()-1),1).setDataValidation(rule2); n++;
  });
  return 'Listo en '+n+' hoja(s) · estados: '+STATUSES.join('/')+' · asesores: '+ADVISORS.join('/');
}

function doGet(e){
  const p=(e&&e.parameter)||{};
  if(p.key!==KEY) return out_(p.callback,{error:'unauthorized'});
  try{
    if(p.action==='update')  return out_(p.callback, updateLead_(p.id,p.status));
    if(p.action==='assign')  return out_(p.callback, setAsesor_(p.id,p.asesor));
    if(p.action==='venta')   return out_(p.callback, setMonto_(p.id,p.monto,p.producto));
    if(p.action==='metrics') return out_(p.callback, getMetrics_());
    return out_(p.callback, getLeads_());   // action 'leads' o vacío
  }catch(err){ return out_(p.callback,{error:String(err)}); }
}

function getLeads_(){
  const ss=SpreadsheetApp.getActiveSpreadsheet(); const rows=[];
  ss.getSheets().forEach(sh=>{
    if(sh.getLastRow()<2) return; const nm=nmap_(sh); if(!isLeadSheet_(nm)) return;
    const sc=col_(nm,A.status), mc=muebleCol_(nm); const data=sh.getDataRange().getValues();
    for(let r=1;r<data.length;r++){
      const row=data[r];
      const id=get_(row,nm,A.id), email=get_(row,nm,A.email);
      const full=get_(row,nm,A.full), fn=get_(row,nm,A.first), ln=get_(row,nm,A.last);
      const nombre=String(full||fn||'').trim(), apellido=String(full?'':(ln||'')).trim();
      const phone=clean_(phoneOf_(row,nm));
      if(!id && !email && !phone) continue;
      if(isTest_(nombre+' '+apellido, email)) continue;
      const st=String(sc?row[sc-1]:'').toLowerCase().trim();
      rows.push({ _row:r+1, id:id,
        fecha:String(get_(row,nm,A.created)||'').slice(0,16).replace('T',' '),
        nombre:nombre, apellido:apellido, correo:email, celular:phone,
        tipo_mueble: mc?String(row[mc-1]||'').trim():'',
        campana:get_(row,nm,A.campaign), anuncio:get_(row,nm,A.ad), ad_id:String(get_(row,nm,A.ad_id)||'').replace(/^[a-z]+:/i,'').trim(),
        asesor: String(get_(row,nm,A.asesor)||'').trim(),
        monto: Number(String(get_(row,nm,A.monto)||'').replace(/[^0-9.\-]/g,''))||0,
        producto: String(get_(row,nm,A.producto)||'').trim(),
        status: STATUSES.indexOf(st)>=0?st:'created' });
    }
  });
  // reparto 50/50 entre asesores: por orden de llegada (fecha), salvo los ya asignados a mano
  rows.sort((a,b)=>String(a.fecha).localeCompare(String(b.fecha)));
  rows.forEach((l,i)=>{ if(ADVISORS.indexOf(l.asesor)<0) l.asesor=ADVISORS[i%ADVISORS.length]; });
  return {rows:rows,statuses:STATUSES,advisors:ADVISORS,ts:new Date().toLocaleString('es-PA')};
}

function updateLead_(id,status){
  status=String(status||'').toLowerCase().trim();
  if(STATUSES.indexOf(status)<0) return {ok:false,error:'status invalido'};
  const ss=SpreadsheetApp.getActiveSpreadsheet();
  for(const sh of ss.getSheets()){
    if(sh.getLastRow()<2) continue; const nm=nmap_(sh); const idc=col_(nm,A.id); if(!idc) continue;
    let sc=col_(nm,A.status); if(!sc){ sh.getRange(1,sh.getLastColumn()+1).setValue(STATUS_DEFAULT); sc=sh.getLastColumn(); }
    const ids=sh.getRange(2,idc,Math.max(1,sh.getLastRow()-1),1).getValues();
    for(let i=0;i<ids.length;i++){
      if(String(ids[i][0])===String(id)){
        const row=i+2; sh.getRange(row,sc).setValue(status);
        let capi='';
        if(DATASET_ID && CAPI_STAGES.indexOf(status)>=0){
          const full=sh.getRange(row,1,1,sh.getLastColumn()).getValues()[0];
          const res=sendCapi_(status,{lead_id:get_(full,nm,A.id),email:get_(full,nm,A.email),phone:phoneOf_(full,nm)});
          capi=status+(res.ok?' - enviado a Meta':' - error '+res.code);
        }
        return {ok:true,status:status,capi:capi};
      }
    }
  }
  return {ok:false,error:'lead no encontrado'};
}

// Registrar CUÁNTO se vendió a ese lead; escribe en la columna 'monto_venta' (la crea si falta).
// Es lo que permite saber qué anuncio trajo dinero, no solo cuál trajo formularios.
function setMonto_(id,monto,producto){
  const v=Number(String(monto==null?'':monto).replace(/[^0-9.\-]/g,''));
  if(!isFinite(v)||v<0) return {ok:false,error:'monto invalido'};
  const prod=String(producto==null?'':producto).trim();
  const ss=SpreadsheetApp.getActiveSpreadsheet();
  for(const sh of ss.getSheets()){
    if(sh.getLastRow()<2) continue; const nm=nmap_(sh); const idc=col_(nm,A.id); if(!idc) continue;
    let mc=col_(nm,A.monto); if(!mc){ sh.getRange(1,sh.getLastColumn()+1).setValue(MONTO_DEFAULT); mc=sh.getLastColumn(); }
    let pc=col_(nm,A.producto); if(!pc){ sh.getRange(1,sh.getLastColumn()+1).setValue(PRODUCTO_DEFAULT); pc=sh.getLastColumn(); }
    const ids=sh.getRange(2,idc,Math.max(1,sh.getLastRow()-1),1).getValues();
    for(let i=0;i<ids.length;i++){
      if(String(ids[i][0])===String(id)){
        const row=i+2;
        sh.getRange(row,mc).setValue(v);
        if(pc) sh.getRange(row,pc).setValue(v>0?prod:'');   // qué producto se vendió (vacío si se borra el monto)
        // registrar una venta implica que el lead se convirtió: se sube el estado solo
        let sc=col_(nm,A.status);
        if(v>0 && sc) sh.getRange(row,sc).setValue('converted');
        // y se le avisa a Meta CON el valor, para que pueda optimizar por dinero
        let capi='';
        if(v>0 && DATASET_ID){
          const full=sh.getRange(row,1,1,sh.getLastColumn()).getValues()[0];
          const res=sendCapi_('converted',{lead_id:get_(full,nm,A.id),email:get_(full,nm,A.email),phone:phoneOf_(full,nm),monto:v});
          capi='converted '+money_(v)+(res.ok?' - enviado a Meta':' - error '+res.code);
        }
        return {ok:true,monto:v,producto:v>0?prod:'',status:v>0?'converted':undefined,capi:capi};
      }
    }
  }
  return {ok:false,error:'lead no encontrado'};
}

// Reasignar un lead a un asesor (Mili/Oscar); escribe en la columna 'asesor' (la crea si falta)
function setAsesor_(id,asesor){
  asesor=String(asesor||'').trim();
  if(ADVISORS.indexOf(asesor)<0) return {ok:false,error:'asesor invalido'};
  const ss=SpreadsheetApp.getActiveSpreadsheet();
  for(const sh of ss.getSheets()){
    if(sh.getLastRow()<2) continue; const nm=nmap_(sh); const idc=col_(nm,A.id); if(!idc) continue;
    let ac=col_(nm,A.asesor); if(!ac){ sh.getRange(1,sh.getLastColumn()+1).setValue(ASESOR_DEFAULT); ac=sh.getLastColumn(); }
    const ids=sh.getRange(2,idc,Math.max(1,sh.getLastRow()-1),1).getValues();
    for(let i=0;i<ids.length;i++){
      if(String(ids[i][0])===String(id)){ sh.getRange(i+2,ac).setValue(asesor); return {ok:true,asesor:asesor}; }
    }
  }
  return {ok:false,error:'lead no encontrado'};
}

// Métricas de campañas desde la Marketing API (cacheadas 10 min). Opcional: requiere META_TOKEN.
function getMetrics_(){
  const cache=CacheService.getScriptCache(); const c=cache.get('metrics'); if(c) return JSON.parse(c);
  const token=META_TOKEN(); if(!token) return {error:'sin_token',campaigns:[],totals:{}};
  const fields='campaign_name,spend,impressions,clicks,ctr,actions';
  const url='https://graph.facebook.com/'+API_VER+'/'+AD_ACCOUNT+'/insights?level=campaign&date_preset=maximum&fields='+encodeURIComponent(fields)+'&limit=50&access_token='+encodeURIComponent(token);
  const resp=UrlFetchApp.fetch(url,{muteHttpExceptions:true}); const j=JSON.parse(resp.getContentText());
  if(j.error) return {error:j.error.message,campaigns:[],totals:{}};
  const camps=(j.data||[]).map(c=>{
    let leads=0; (c.actions||[]).forEach(a=>{ if(String(a.action_type).indexOf('lead')>=0) leads+=Number(a.value)||0; });
    const spend=Number(c.spend)||0, imp=Number(c.impressions)||0;
    return {name:c.campaign_name, spend:spend, impressions:imp, clicks:Number(c.clicks)||0, ctr:Number(c.ctr)||0, leads:leads, cpl:leads?spend/leads:0};
  });
  const totals={ spend:camps.reduce((s,c)=>s+c.spend,0), leads:camps.reduce((s,c)=>s+c.leads,0), impressions:camps.reduce((s,c)=>s+c.impressions,0), clicks:camps.reduce((s,c)=>s+c.clicks,0) };
  totals.cpl=totals.leads?totals.spend/totals.leads:0;
  const out={campaigns:camps,totals:totals,ts:new Date().toLocaleString('es-PA')};
  cache.put('metrics',JSON.stringify(out),600); return out;
}

function sendCapi_(eventName,lead){
  if(!DATASET_ID) return {ok:false,code:'sin_dataset'};
  const token=META_TOKEN(); if(!token) return {ok:false,code:'sin_token'};
  eventName=metaEvent_(eventName);   // etapa interna -> nombre que ve Meta
  const ud={}; const lid=String(lead.lead_id||'').replace(/[^0-9]/g,''); if(lid) ud.lead_id=Number(lid);
  if(lead.email) ud.em=[sha256_(String(lead.email).trim().toLowerCase())];
  if(lead.phone){ const p=String(lead.phone).replace(/[^0-9]/g,''); if(p) ud.ph=[sha256_(p)]; }
  // Con el monto de venta, Meta puede optimizar por VALOR y no solo por conteo.
  const cd={event_source:'crm'};
  const val=Number(lead.monto)||0;
  if(val>0){ cd.value=val; cd.currency='USD'; }
  const evt={event_name:eventName,event_time:Math.floor(Date.now()/1000),action_source:'system_generated',event_id:'fefa-'+lid+'-'+eventName+'-'+Date.now(),user_data:ud,custom_data:cd};
  const url='https://graph.facebook.com/'+API_VER+'/'+DATASET_ID+'/events?access_token='+encodeURIComponent(token);
  const resp=UrlFetchApp.fetch(url,{method:'post',contentType:'application/json',payload:JSON.stringify({data:[evt]}),muteHttpExceptions:true});
  const code=resp.getResponseCode(); return {ok:code>=200&&code<300,code:code};
}

function money_(v){ return '$'+Number(v||0).toFixed(2).replace(/\.00$/,''); }
function sha256_(s){ const b=Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256,s,Utilities.Charset.UTF_8); return b.map(x=>('0'+(x&0xFF).toString(16)).slice(-2)).join(''); }
function out_(cb,obj){ const j=JSON.stringify(obj); return cb?ContentService.createTextOutput(cb+'('+j+')').setMimeType(ContentService.MimeType.JAVASCRIPT):ContentService.createTextOutput(j).setMimeType(ContentService.MimeType.JSON); }
