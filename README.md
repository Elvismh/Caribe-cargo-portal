# Portal de Reportes de Seguridad — Caribe Cargo S.R.L.

Portal público de una sola función: un visitante escribe un código de reporte
(formato `ESTACION-DDMMYYYYHHMM`, ej. `PUJ-020820251835`) y ve su estatus
actual. Los datos viven en Airtable (base "SAFETY"); esta app solo lee un
subconjunto de campos no sensibles — nunca expone identidad del reportante,
evidencias, causa raíz ni responsables.

## Desarrollo local

```bash
npm install
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000).

## Variables de entorno

Copia `.env.example` a `.env.local` y complétalo:

- `AIRTABLE_TOKEN` (requerido): Personal Access Token de Airtable con alcance
  de **solo lectura** (`data.records:read`) sobre la base SAFETY únicamente.
  Créalo en https://airtable.com/create/tokens. Nunca lo subas a git.
- `AIRTABLE_BASE_ID` / `AIRTABLE_TABLE_ID` (opcionales): ya tienen valores por
  defecto correctos en `src/lib/airtable.ts`; solo hace falta definirlos si la
  base o tabla cambian de ubicación.

En producción (Vercel), estas variables se configuran en Project Settings →
Environment Variables — nunca en el código.

## Despliegue

Este repo está conectado a un proyecto de Vercel; cada push a `main` dispara
un despliegue automático.
