# Apps Script de Fefa — 3 pasos para dejarlo automático (CAPI + valor de venta)

Tu `Code.gs` en vivo está en la versión **vieja** (`DATASET_ID = ''`, sin la parte de venta).
Hay que reemplazarlo por el actualizado. Son 3 pasos, ~2 minutos.

---

## Paso 1 — Reemplazar el código
1. En el editor de Apps Script (donde estás), clic en **`Code.gs`** (panel izquierdo).
2. **Selecciona TODO** (Ctrl+A) y **bórralo**.
3. Abre el archivo actualizado y copia TODO su contenido:
   `\\wsl.localhost\Ubuntu\home\daniel\clientes\ECUS\dash-fefa\apps-script\Codigo.gs`
   *(Ctrl+A → Ctrl+C ahí, y Ctrl+V en el editor.)*
4. **Guardar** (💾 o Ctrl+S).

> Verifica que arriba diga: `const DATASET_ID = '1965221274196004';` (ya NO vacío).

## Paso 2 — Poner el token
1. Menú izquierdo: **⚙️ Configuración del proyecto** (Project Settings).
2. Baja a **Propiedades del script** (Script properties) → **Agregar propiedad**.
3. Propiedad: `META_TOKEN`
   Valor: *(el token de Fefa — está en tu archivo `~/clientes/ECUS/.meta/tefa.env`, la línea `META_SYSTEM_USER_TOKEN=...`; copia solo el valor. NO lo pegues en ningún chat.)*
4. **Guardar**.

## Paso 3 — Re-implementar (para que tome los cambios)
1. Arriba a la derecha: **Deploy → Administrar implementaciones** (Manage deployments).
2. En la implementación activa, clic en el **✏️ (Editar)**.
3. En **Versión**, elige **Versión nueva** → **Implementar**.

*(La URL `/exec` NO cambia si editas la implementación existente — no hay que tocar Vercel.)*

---

## Cómo confirmar que quedó
- En el dashboard, a un lead escríbele un **`$ vendió`** (ej. 850) y Enter.
- El lead pasa a **converted**, y en **Administrador de eventos → dataset Fefa** aparece un evento **`converted` con valor** (hasta 30 min de demora).
- Los KPIs de **retorno (ROAS)** empiezan a aparecer en el dash.

## Lo que logras
Cada cambio de estado (calificado / vendido con $) que marquen Mili/Oscar **se manda solo a Meta** →
la campaña optimiza por **calidad y por dinero**, y calculas **ROAS real**.
