# Dashboard · Mueblería Compra con Fefa

CRM en tiempo real de los leads de Meta (formulario) + panel de métricas de campañas.
**LIVE:** https://dash-fefa.vercel.app · contraseña: `fefa2026`

## Cómo fluye un lead
```
Anuncio Meta (formulario) → Google Sheet "Leads Compra con Fefa"
   → Apps Script (apps-script/Codigo.gs, Web App)
   → /api/leads (proxy Vercel)  → dashboard
```
El anuncio ya viene con nombre-slug (`fefa_leads_sofa_img_jul26`), así cada lead muestra **de qué anuncio/mueble vino** + su **preview real**.

## Funciones
- **CRM por tipo de mueble** (Sofás/Salas · Camas · Comedores) — deriva del campo `tipo_mueble`.
- **Preview del anuncio por lead** (clic en el nombre del anuncio → render real desde Meta).
- **Reparto 50/50 entre los 2 asesores (Mili / Oscar)** por orden de llegada, reasignable + filtro por asesor.
- **Estados del lead** (created → contacted → qualified → converted / disqualified), se guardan en el Sheet.
- **Métricas** (gasto, leads, CPL, CTR, audiencia) — **solo de nuestras campañas** (`filtering: campaign.name CONTAIN "Fefa"`), ignora las viejas del cliente.

## Variables de entorno (Vercel · proyecto dash-fefa)
| Variable | Valor |
|---|---|
| `DASHBOARD_PASSWORD` | `fefa2026` |
| `APPS_SCRIPT_URL` | URL `/exec` del Web App de Apps Script |
| `APPS_SCRIPT_KEY` | `fefa2026` (debe coincidir con `KEY` en Codigo.gs) |
| `META_TOKEN` | token de la cuenta de Fefa (solo para métricas) |
| `META_ACCOUNT_ID` | `act_1795776247808784` |
| `META_API_VERSION` | `v25.0` |

## Apps Script (una sola vez)
1. En el Google Sheet → **Extensiones → Apps Script** → pegar `apps-script/Codigo.gs`.
2. Ejecutar la función **`setup`** (crea columnas `lead_status` y `asesor` con dropdowns).
3. **Implementar → App web** (*Ejecutar como:* Yo · *Acceso:* Cualquiera) → copiar la URL `/exec` → ponerla en `APPS_SCRIPT_URL` en Vercel.

## Desplegar
El auto-deploy desde GitHub **no está activo**. Para publicar cambios:
```bash
vercel deploy --prod --yes --token=<TOKEN_VERCEL>
```
(o reconectar el repo en Vercel → Settings → Git para auto-deploy).

## Stack
HTML estático + Chart.js · 2 funciones serverless en Vercel (`api/leads.js` proxy al Apps Script, `api/insights.js` proxy a la Meta Marketing API) · Apps Script sobre Google Sheet.
