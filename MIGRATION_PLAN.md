# Migração: mover lógica de `orion-api` para `orion-frontend`

Este documento descreve um plano passo-a-passo para migrar toda a lógica de API do repositório `orion-api` para o Next.js em `orion-frontend`. O objetivo é consolidar o backend dentro do Next para reduzir latência e simplificar o desenvolvimento.

Resumo das ações
- Mapear e copiar bibliotecas centrais: `lib/db.ts`, `lib/auth.ts`, `lib/route-guards.ts`.
- Mover / gerar o client Prisma e `prisma/schema.prisma` para o frontend.
- Reimplementar rotas Fastify como rotas Next em `app/api/*` (Route Handlers no app directory).
- Adaptar validação Zod, autenticação `better-auth` e guards para o ambiente Next.
- Atualizar `package.json` do `orion-frontend` com dependências necessárias e comandos `prisma generate`.

1) Mapeamento de arquivos (origem -> destino sugerido)

- `orion-api/src/lib/db.ts` -> `orion-frontend/src/server/lib/db.ts`
- `orion-api/src/lib/auth.ts` -> `orion-frontend/src/server/lib/auth.ts`
- `orion-api/src/lib/route-guards.ts` -> `orion-frontend/src/server/lib/route-guards.ts`
- `orion-api/src/usecases/*` -> `orion-frontend/src/server/usecases/*`
- `orion-api/src/routes/*` (handlers Fastify) -> reescrever como `orion-frontend/app/api/<resource>/route.ts`
- `orion-api/src/generated/prisma/*` e `orion-api/prisma/schema.prisma` -> mover para `orion-frontend/prisma/` e gerar client dentro do frontend

2) Dependências a adicionar em `orion-frontend/package.json`

- `@prisma/client` (ou usar o client gerado em `src/server/generated/prisma`)
- `prisma` (dev dependency)
- `@prisma/adapter-neon` (se estiver usando Neon)
- `better-auth` e `better-auth/adapters/prisma` e `better-auth/plugins`
- `zod` já presente no frontend — reusar para validação

Exemplo de trecho `devDependencies` / `dependencies`:

```json
{
  "dependencies": {
    "@prisma/client": "^5.0.0",
    "better-auth": "^x.x.x",
    "@prisma/adapter-neon": "^x.x.x"
  },
  "devDependencies": {
    "prisma": "^5.0.0"
  }
}
```

3) Estrutura recomendada no frontend

- `src/server/lib` — helpers (`db.ts`, `auth.ts`, `route-guards.ts`)
- `src/server/usecases` — classes de negócio copiadas/adaptadas
- `src/server/generated/prisma` — (opcional) client Prisma gerado
- `app/api/*/route.ts` — rotas HTTP (ex.: `app/api/events/route.ts`)

4) Exemplo de conversão de rota (Fastify -> Next app route)

- Fastify (exemplo): `POST /create-event` em `manage-events.ts` -> Next handler:

`app/api/events/route.ts` (exemplo minimal):

```ts
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { CreateEvent } from '@/server/usecases/CreateEvent'

const BodySchema = z.object({
  name: z.string(),
  date: z.string(),
  location: z.string(),
  grupoId: z.string().optional(),
})

export async function POST(request: Request) {
  const body = await request.json()
  const parsed = BodySchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid body', details: parsed.error }, { status: 400 })

  const usecase = new CreateEvent()
  try {
    const result = await usecase.execute(parsed.data)
    return NextResponse.json(result, { status: 201 })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 400 })
  }
}
```

Observações:
- Use a API Web `Request`/`Response` do Next (Route Handlers) em `app/api` para compatibilidade com o restante do projeto.
- Para rotas que precisam de sessão/guards, crie helpers em `src/server/lib/route-guards.ts` que aceitem `Request` e retornem o `session.user.id`.

5) Como adaptar `better-auth`

- `better-auth` já é usado no backend. No Next, mantenha a mesma inicialização em `src/server/lib/auth.ts`.
- Exponha endpoints `/api/auth/*` localmente: em vez de proxy Fastify, crie `app/api/auth/[...slug]/route.ts` que repasse para o handler `auth.handler` usando `Request`.
- Exemplo mínimo de proxy para o handler do `better-auth`:

```ts
import { auth } from '@/server/lib/auth'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const url = new URL(request.url)
  const proxied = new Request(url.toString(), { method: request.method, headers: request.headers })
  const res = await auth.handler(proxied)
  const body = await res.text()
  return new Response(body, { status: res.status, headers: res.headers })
}
```

6) Prisma: mover/gerar client

- Copie `prisma/schema.prisma` para `orion-frontend/prisma/schema.prisma`.
- Ajuste `datasource` e `generator` se necessário.
- No `orion-frontend` rode:

```bash
pnpm install
pnpm prisma generate
```

Se preferir usar o client gerado atualmente em `orion-api/src/generated/prisma`, prefira regenerar no frontend para evitar caminhos relativos estranhos.

7) Variáveis de ambiente importantes

- `DATABASE_URL` — string de conexão do Prisma
- `API_BASE_URL`, `WEB_APP_BASE_URL` — ajustar caso `better-auth` use
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` — provider social
- `NODE_ENV` — produção/desenvolvimento

8) Testes locais e verificação

1. Instale dependências: `pnpm install` no `orion-frontend`.
2. Gere Prisma: `pnpm prisma generate`.
3. Rode o Next: `pnpm dev`.
4. Teste rotas com `curl` ou Postman, por exemplo:

```bash
curl -X POST http://localhost:3000/api/events -H 'Content-Type: application/json' -d '{"name":"Teste","date":"2026-05-20T10:00:00.000Z","location":"Sala"}'
```

9) Pontos de atenção / riscos

- Algumas funcionalidades do Fastify (plugins de swagger, fastify-type-provider-zod) não serão migradas tal‑qual; remova ou substitua por alternativas Next-friendly.
- Certifique-se de que as políticas de CORS e domínios confiáveis para `better-auth` estejam configuradas para apontar para o domínio do Next.
- Teste cuidadosamente flows de autenticação (login, logout, social auth) após migração — sessões/cookies cross-domain podem precisar ajustes.

10) Checklist de revisão (manual)

- [ ] Copiar `prisma/schema.prisma` e gerar client no frontend
- [ ] Copiar `src/lib/*` e adaptar imports/paths
- [ ] Copiar `usecases/*`
- [ ] Implementar rotas `app/api/*` correspondentes
- [ ] Atualizar `package.json` e instalar dependências
- [ ] Testar endpoints principais (events, groups, daily-check, users)
- [ ] Testar autenticação social e sessões

Se quiser, eu gero um patch automatizado que cria a estrutura vazia em `orion-frontend/src/server/` com stubs para cada rota e arquivos copiados parcialmente (sem tocar `prisma`), ou posso gerar um PR com os arquivos prontos para você revisar antes de rodar `pnpm prisma generate`.

---
Arquivo criado automaticamente pelo assistente como plano; me diga se quer que eu gere os stubs agora (copiar arquivos automaticamente) ou prefere revisar o plano primeiro.
