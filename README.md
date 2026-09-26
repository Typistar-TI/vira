# Vira

SaaS de páginas de vendas feito apenas com Astro e TypeScript. Roda em Cloudflare Workers, com D1 para dados e configuração, R2 para imagens e Analytics Engine para métricas. Interface com Tailwind CSS e daisyUI, sem React.

## Recursos

- Site comercial em português e inglês, com preços lidos do D1 e URLs de idioma marcadas com `hreflang`.
- Login por celular do Brasil ou dos EUA, código via SMS ou WhatsApp no Twilio Verify, Turnstile e limites de tentativas.
- Teste de sete dias sem cartão, uma página por conta, rascunho, publicação e três layouts que usam o mesmo componente na prévia e no site público.
- Editor de capa, apresentação, benefícios, números, depoimentos, catálogo e links externos; imagens no R2.
- Planos mensal, anual e vitalício em BRL e USD, checkout e portal Stripe, webhook e suspensão ao expirar o acesso.
- Subdomínio `cliente.vira.ia.br` e domínio próprio `www` via Cloudflare for SaaS para planos pagos.
- Limpeza diária de contas 90 dias após expiração, sessões antigas e imagens não usadas.
- Sessão em cookie `__Host-` HttpOnly, Secure e SameSite=Lax; sem armazenamento de credenciais no navegador. Exportação e exclusão da conta no painel.

## Configuração no banco

A migração `0004_config_and_prices.sql` cria `app_settings` e `plan_prices` e inicia `ROOT_DOMAIN` com `vira.ia.br`. Os preços começam vazios e inativos. Não há preços inventados no código. O valor exibido no site e no painel vem de `plan_prices.amount_minor`; o checkout confere valor, moeda e periodicidade com o preço real do Stripe. `stripe_price_catalog` preserva o vínculo de assinaturas antigas ao trocar um preço.

As configurações que podem mudar sem novo deploy ficam no D1:

| Configuração | Armazenamento |
| --- | --- |
| `ROOT_DOMAIN`, `PUBLIC_TURNSTILE_SITE_KEY`, `CLOUDFLARE_ZONE_ID`, `CLOUDFLARE_ACCOUNT_ID` | Texto no D1 |
| `PRIVACY_CONTROLLER_NAME`, `PRIVACY_CONTACT_EMAIL` | Texto no D1; necessários antes do lançamento público |
| `TWILIO_API_KEY`, `TWILIO_API_SECRET`, `TWILIO_VERIFY_SERVICE_SID`, `TURNSTILE_SECRET` | Criptografado no D1 |
| `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ANALYTICS_TOKEN` | Criptografado no D1 |
| Seis combinações de plano e moeda, com valor em centavos e ID `price_...` | Tabela `plan_prices` no D1 |

Só `CONFIG_ENCRYPTION_KEY` fica como segredo do Worker: 32 bytes em base64. Ela protege as credenciais no D1. Guarde a chave fora do projeto; se a perder, precisará cadastrar novamente as credenciais. Os bindings `DB`, `MEDIA`, `METRICS` e os identificadores dos recursos no `wrangler.jsonc` precisam continuar na configuração da Cloudflare porque são necessários antes que o Worker acesse o banco.

Para cadastrar uma configuração, passe o valor pela entrada padrão. O comando não recebe o valor como argumento. Credenciais são criptografadas antes de serem gravadas no D1:

```sh
printf %s 'vira.ia.br' | npm run config:local -- ROOT_DOMAIN
printf %s 'CHAVE_PUBLICA' | npm run config:local -- PUBLIC_TURNSTILE_SITE_KEY
printf %s 'SEGREDO' | npm run config:local -- STRIPE_SECRET_KEY
```

Para o banco de produção, troque `config:local` por `config:remote`. Para cadastrar um preço de exemplo de R$ 29,90 mensais após criá-lo no Stripe:

```sh
npm run price:local -- monthly brl 2990 price_ID_DO_STRIPE
```

Use `price:remote` em produção. Os seis preços devem ser cadastrados individualmente. Valores são unidades mínimas da moeda: centavos para BRL e USD. Preços ausentes aparecem como “Valor no checkout” no site e o checkout correspondente não inicia.

## Desenvolvimento local

Requer Node.js 22.12 ou superior:

```sh
npm install
cp .dev.vars.example .dev.vars
npm run db:local
npx astro dev --background
```

Gere a chave mestra uma vez com `openssl rand -base64 32`. Coloque-a em `.dev.vars` como `CONFIG_ENCRYPTION_KEY=...` e exporte o mesmo valor no terminal ao usar `config:local` para credenciais criptografadas. `npx astro dev status`, `npx astro dev logs` e `npx astro dev stop` gerenciam o servidor. O arquivo `.dev.vars` é ignorado pelo Git.

```sh
npm run check
npm run build
npx wrangler deploy --dry-run
```

## Cloudflare e domínio

1. Adicione a zona `vira.ia.br` à Cloudflare e aponte os nameservers no Registro.br. Crie o D1 `vira` e o bucket R2 `vira-media`; copie o ID real do D1 para `wrangler.jsonc` e aplique `npm run db:remote`.
2. Configure DNS proxied para `vira.ia.br`, `*.vira.ia.br` e `connect.vira.ia.br`. Use uma rota Worker que cubra os hostnames da zona e também os custom hostnames do Cloudflare for SaaS. A [documentação de Worker como fallback origin](https://developers.cloudflare.com/cloudflare-for-platforms/cloudflare-for-saas/start/advanced-settings/worker-as-origin/) descreve a rota `*/*` para isso.
3. Ative Cloudflare for SaaS e configure `connect.vira.ia.br` como fallback origin. O cliente cria somente o CNAME `www` para `connect.vira.ia.br`; o painel cadastra e acompanha o hostname e o SSL. O domínio continua sob controle do cliente. O site no domínio raiz (`exemplo.com`) e registros de e-mail não são alterados pelo Vira; se desejar, o cliente pode redirecionar o domínio raiz para `www` no provedor DNS dele.
4. Cadastre `CLOUDFLARE_ZONE_ID`, `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_API_TOKEN` e `CLOUDFLARE_ANALYTICS_TOKEN` no D1. Configure um widget Turnstile e cadastre as chaves pública e secreta no D1.
5. No Twilio Verify, crie um serviço com SMS e WhatsApp e configure o remetente WhatsApp para produção. Cadastre suas três credenciais no D1.
6. No Stripe, crie os seis preços e cadastre cada valor e ID no D1. Ative o Customer Portal e configure o webhook `https://vira.ia.br/api/billing/webhook` para `checkout.session.completed`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted` e `charge.refunded`. Cadastre as chaves do Stripe no D1.
7. Defina a mesma `CONFIG_ENCRYPTION_KEY` como segredo do Worker com `npx wrangler secret put CONFIG_ENCRYPTION_KEY`. Depois de preencher os recursos e o banco, publique com `npm run deploy`.

Teste autenticação, cobrança e domínio próprio com credenciais de teste antes de usar chaves de produção. Ainda não há credenciais reais nem deploy neste repositório.

## Privacidade e revisão antes do lançamento

A página `/privacidade` explica os dados tratados, fornecedores, cookie essencial e retenção. Enquanto `PRIVACY_CONTROLLER_NAME` e `PRIVACY_CONTACT_EMAIL` estiverem vazios, ela mostra que é um rascunho, recebe `noindex` e o envio de códigos de cadastro fica indisponível. Cadastre o responsável legal e um e-mail de atendimento antes de lançar o serviço. O painel permite baixar os dados da conta em JSON ou excluí-la. A exclusão remove dados do D1 e R2, cancela uma assinatura ativa, remove o domínio conectado e solicita a exclusão do cliente Stripe; registros que o processador de pagamentos precisa manter podem permanecer sob as regras dele.

Medidas técnicas implementadas: comparação exata de origem nas ações autenticadas, limites de tentativas por telefone e IP no código de acesso, limites por usuário e rota nas APIs, limite de tamanho das requisições, respostas privadas sem cache e cabeçalhos de segurança. As métricas próprias contam eventos por ID da página, sem gravar o IP do visitante no Analytics Engine. A conformidade com a LGPD ainda exige validação do aviso e das bases legais pelo responsável pelo serviço, contratos e transferências internacionais com fornecedores, e um processo de atendimento a pedidos e incidentes. O código não substitui essas decisões operacionais.
