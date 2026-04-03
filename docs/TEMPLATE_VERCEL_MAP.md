# Template folders ↔ showcase names ↔ Vercel

Use this when connecting a Vercel project to the monorepo: set **Root Directory** to the path in the third column.

| Showcase (marketing) | Template key (`storeTemplates`) | Repo folder | Vercel Root Directory |
|---------------------|----------------------------------|-------------|------------------------|
| Classic | `default` | `esimlaunch-template` | `esimlaunch-template/apps/web` |
| Revolut | `minimal` | `esimlaunch-template-2` | `esimlaunch-template-2/apps/web` |
| **Midnight** | `bold` | **`esimlaunch-template-3`** | **`esimlaunch-template-3/apps/web`** |
| Apple | `travel` | `esimlaunch-template-4` | `esimlaunch-template-4/apps/web` |

Preview URLs (from `esim-connect-hub/src/lib/storeTemplates.ts`):

- Classic — `esimlaunch-classic.vercel.app`
- Revolut — `esimlaunch-revolut.vercel.app`
- Midnight — `esimlaunch-midnight.vercel.app`
- Apple — `esimlaunch-apple.vercel.app`

**Note:** `esimlaunch-midnight` must build from **`esimlaunch-template-3/apps/web`**, not `esimlaunch-template-2` (that is Revolut).
