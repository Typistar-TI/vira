# Vira

O Vira é uma plataforma para criar e publicar páginas de vendas. O mesmo projeto reúne o site de apresentação, a autenticação, o painel de edição e as páginas públicas dos clientes.

## O que a aplicação oferece

- Página de apresentação em português e inglês.
- Acesso por link enviado ao e-mail ou com uma conta Google, sem senha própria.
- Edição, prévia e publicação de uma página de vendas por conta, com três opções de layout.
- Teste gratuito de sete dias e planos mensal, anual e vitalício.
- Publicação em subdomínio da plataforma ou em domínio próprio.
- Upload de imagens, métricas básicas e gerenciamento da conta.
- Painel administrativo separado para acompanhar clientes, domínios e assinaturas e configurar preços e integrações.

## Tecnologias

| Camada                    | Tecnologia                                                                                   | Função                                                                         |
| ------------------------- | -------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| Interface e servidor      | [Astro](https://astro.build/) e TypeScript                                                   | Páginas renderizadas no servidor, componentes e rotas de API no mesmo projeto. |
| Hospedagem                | [Cloudflare Workers](https://developers.cloudflare.com/workers/)                             | Execução da aplicação e das páginas publicadas.                                |
| Dados                     | [Cloudflare D1](https://developers.cloudflare.com/d1/)                                       | Contas, sessões, páginas, domínios, planos e configurações.                    |
| Imagens                   | [Cloudflare R2](https://developers.cloudflare.com/r2/)                                       | Armazenamento dos arquivos enviados pelos clientes.                            |
| Métricas                  | [Cloudflare Analytics Engine](https://developers.cloudflare.com/analytics/analytics-engine/) | Contagem de visualizações e interações nas páginas.                            |
| Estilos e componentes     | [Tailwind CSS](https://tailwindcss.com/) e [daisyUI](https://daisyui.com/)                   | Estilos e componentes de interface sem React.                                  |
| Estado de dados no painel | [TanStack Query Core](https://tanstack.com/query/latest/docs/framework/vanilla/overview)     | Cache e atualização de dados carregados pelas APIs.                            |
| Acesso                    | [Google Identity Services](https://developers.google.com/identity/gsi/web/guides/overview)   | Entrada com a conta Google, com validação do token no servidor.                |
| Envio de acesso           | [Resend](https://resend.com/docs)                                                            | Links de acesso por e-mail, válidos por 15 minutos e uma vez.                  |
| Pagamentos                | [Stripe](https://docs.stripe.com/)                                                           | Checkout, assinaturas e portal de cobrança.                                    |

O Astro renderiza o conteúdo público no servidor, inclusive metadados e rotas de sitemap. A interface interativa do painel usa TypeScript no navegador. Não há dependência de React.

## Arquitetura

```mermaid
flowchart LR
    A[Visitante ou cliente] --> B[Astro no Cloudflare Worker]
    B --> C[Site e painel]
    B --> D[Página pública do cliente]
    B --> E[Rotas de API]
    E --> F[(D1)]
    E --> G[(R2)]
    E --> H[Google Identity Services e Resend]
    E --> I[Stripe]
    D --> J[Analytics Engine]
```

O middleware identifica o hostname da requisição e encaminha domínios dos clientes para as rotas públicas. O conteúdo editado fica como rascunho no D1; a publicação cria uma versão separada para os visitantes. A prévia e a página publicada usam o mesmo componente Astro, para manter o resultado visual consistente.

O servidor valida as operações dos painéis e mantém a sessão em cookie `HttpOnly`, `Secure` e `SameSite=Lax`. No login com Google, verifica a assinatura e as declarações do token. No login por e-mail, gera um link aleatório de uso único, armazena apenas seu hash e exige confirmação por POST para evitar que prévias automáticas de e-mail consumam o link. O acesso administrativo exige que o e-mail esteja autorizado em `admin_accounts` no D1. As rotas administrativas verificam a permissão em cada requisição e registram mudanças em `admin_audit`.

As integrações externas são chamadas pelas rotas de API; suas credenciais não são enviadas ao navegador. Segredos cadastrados no painel são criptografados antes de serem armazenados no D1 e não são devolvidos pelas APIs. Preços ativos são validados na Stripe antes de serem publicados. Os bindings da infraestrutura permanecem na configuração do Worker.

## Organização do projeto

| Caminho                      | Responsabilidade                                                     |
| ---------------------------- | -------------------------------------------------------------------- |
| `frontend/src/pages/`        | Páginas Astro e entradas curtas das rotas da API.                    |
| `frontend/src/components/`   | Componentes de apresentação e renderização das páginas.              |
| `backend/api/`               | Implementação das rotas da API.                                      |
| `backend/`                   | Autenticação, cobrança, domínios, dados, contas e entrada do Worker. |
| `shared/`                    | Tipos e validação do conteúdo das páginas.                           |
| `frontend/src/middleware.ts` | Roteamento por hostname.                                             |
| `migrations/`                | Evolução do esquema do D1.                                           |
| `scripts/`                   | Comandos de apoio ao desenvolvimento e à configuração.               |

## Desenvolvimento local

Requer Node.js 22.12 ou superior. Após instalar as dependências, aplique as migrações locais e inicie o servidor:

```sh
npm install
npm run db:local
npx astro dev --background
```

Use `npx astro dev status`, `npx astro dev logs` e `npx astro dev stop` para acompanhar ou encerrar o servidor. Para verificar o projeto:

```sh
npm run check
npm run build
npm run format:check
```

Use `npm run format` para aplicar o padrão de formatação antes de enviar alterações.

Os fluxos que usam autenticação, pagamentos e domínios próprios dependem da configuração dos serviços externos no ambiente de execução.

## Configurar acesso com Google

Crie um cliente OAuth do tipo **Aplicativo da Web** no Google Cloud Console. Adicione `https://vira.ia.br` às origens JavaScript autorizadas e `https://vira.ia.br/api/auth/google` aos URIs de redirecionamento autorizados. Configure a tela de consentimento para usuários externos e publique o aplicativo quando estiver pronto para receber clientes. Se também usar `www.vira.ia.br`, adicione a origem e o URI equivalentes.

Grave o Client ID público no D1 com `npm run config:remote -- GOOGLE_CLIENT_ID`, enviando o valor pela entrada padrão. O Google é opcional quando o acesso por e-mail está configurado. Para autorizar a primeira conta administrativa, use `npm run admin:remote` e envie o e-mail escolhido pela entrada padrão. O script escreve o e-mail apenas no banco, sem incluí-lo no histórico do Git. Se o administrador usar Google, o primeiro login vincula seu identificador estável à autorização.

No deploy pelo GitHub Actions, a variável de repositório `GOOGLE_CLIENT_ID` e o segredo `ADMIN_EMAIL` são gravados no D1 após as migrações, quando definidos. O e-mail administrativo pode entrar por link, mesmo sem configurar Google. Novos deploys preservam a configuração sem colocar os valores no código.

## Configurar acesso por e-mail

Crie uma conta na Resend, cadastre `vira.ia.br` e conclua a verificação dos registros DNS mostrados no painel. Crie uma chave de API com permissão apenas para envio. Cadastre a chave como segredo `RESEND_API_KEY` no repositório GitHub e um endereço do domínio verificado, como `acesso@vira.ia.br`, como variável `AUTH_EMAIL_FROM`. O deploy grava a chave criptografada no D1 e o remetente em configuração comum. O formulário de e-mail fica disponível quando os dois valores estiverem configurados.
