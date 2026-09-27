# Vira

O Vira é uma plataforma para criar e publicar páginas de vendas. O mesmo projeto reúne o site de apresentação, a autenticação, o painel de edição e as páginas públicas dos clientes.

## O que a aplicação oferece

- Página de apresentação em português e inglês.
- Acesso por link enviado ao e-mail ou com uma conta Google, sem senha própria.
- Edição, prévia e publicação de uma página de vendas por conta, com três opções de layout.
- Teste gratuito de sete dias e planos mensal, anual e vitalício.
- Publicação em subdomínio da plataforma ou em domínio próprio.
- Upload de imagens, métricas básicas e gerenciamento da conta.
- Instalação como PWA da plataforma, dos painéis e de cada página pública, inclusive em domínio próprio. Cada cliente pode configurar nome do aplicativo, favicon, ícone e cores do seu site.
- Painel administrativo separado para acompanhar clientes, domínios e assinaturas e configurar preços, integrações e e-mails automáticos.

## Tecnologias

| Camada                | Tecnologia                                                                                   | Função                                                          |
| --------------------- | -------------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| Interface             | [Astro](https://astro.build/) e TypeScript                                                   | Páginas renderizadas no servidor e componentes da interface.    |
| API                   | [Hono](https://hono.dev/) e TypeScript                                                       | Roteamento e execução das rotas `/api/*` no Worker.             |
| Hospedagem            | [Cloudflare Workers](https://developers.cloudflare.com/workers/)                             | Execução da aplicação e das páginas publicadas.                 |
| Dados                 | [Cloudflare D1](https://developers.cloudflare.com/d1/)                                       | Contas, sessões, páginas, domínios, planos e configurações.     |
| Imagens               | [Cloudflare R2](https://developers.cloudflare.com/r2/)                                       | Armazenamento dos arquivos enviados pelos clientes.             |
| Métricas              | [Cloudflare Analytics Engine](https://developers.cloudflare.com/analytics/analytics-engine/) | Contagem de visualizações e interações nas páginas.             |
| Estilos e componentes | [Tailwind CSS](https://tailwindcss.com/) e [daisyUI](https://daisyui.com/)                   | Estilos e componentes de interface sem React.                   |
| Dados no navegador    | [TanStack Query Core](https://tanstack.com/query/latest/docs/framework/vanilla/overview)     | Consultas, mutações, cache e atualização das chamadas de API.   |
| Acesso                | [Google Identity Services](https://developers.google.com/identity/gsi/web/guides/overview)   | Entrada com a conta Google, com validação do token no servidor. |
| E-mails               | [Resend](https://resend.com/docs)                                                            | Links de acesso e avisos de site, assinatura e término.         |
| Pagamentos            | [Stripe](https://docs.stripe.com/)                                                           | Checkout, assinaturas e portal de cobrança.                     |

O Astro renderiza o conteúdo público no servidor, inclusive metadados e rotas de sitemap. A interface interativa do painel usa TypeScript no navegador. Não há dependência de React.

## Arquitetura

```mermaid
flowchart LR
    A[Visitante ou cliente] --> B[Cloudflare Worker]
    B --> C[Astro: site e painéis]
    B --> D[Hono: API]
    D --> E[(D1)]
    D --> F[(R2)]
    D --> G[Google, Resend e Stripe]
    C --> H[Analytics Engine]
```

O middleware identifica o hostname da requisição e encaminha domínios dos clientes para as rotas públicas. O cadastro cria e publica imediatamente uma página inicial neutra no subdomínio do cliente. Ela fica fora dos mecanismos de busca até o cliente publicar sua primeira edição. Depois disso, o conteúdo editado fica como rascunho no D1; a publicação atualiza uma versão separada para os visitantes. A prévia e a página publicada usam o mesmo componente Astro, para manter o resultado visual consistente.

Os manifests PWA da plataforma, do painel do cliente, do painel administrativo e dos sites publicados têm escopos próprios. Nos sites dos clientes, o manifest usa a versão publicada no domínio em que foi solicitado. Os ícones enviados são convertidos em PNG nos tamanhos necessários e armazenados no R2. O service worker oferece uma mensagem ao ficar sem conexão, sem guardar páginas privadas, APIs ou conteúdo de assinaturas no navegador.

O Worker entrega as requisições `/api/*` ao Hono e as demais ao Astro. As páginas e os componentes Astro acessam o backend apenas por módulos em `frontend/src/api/`, organizados por funcionalidade e chamada. No navegador, esses módulos usam TanStack Query Core para consultas, mutações e cache. Durante a renderização no servidor, os módulos chamam as funções necessárias no mesmo Worker. O backend Hono organiza rotas, regras e consultas por funcionalidade em `backend/features/`.

O servidor valida as operações dos painéis e mantém a sessão em cookie `HttpOnly`, `Secure` e `SameSite=Lax`. No login com Google, verifica a assinatura e as declarações do token. No login por e-mail, gera um link aleatório de uso único, armazena apenas seu hash e exige confirmação por POST para evitar que prévias automáticas de e-mail consumam o link. O acesso administrativo exige que o e-mail esteja autorizado em `admin_accounts` no D1. As rotas administrativas verificam a permissão em cada requisição e registram mudanças em `admin_audit`.

As integrações externas são chamadas pelas rotas de API; suas credenciais não são enviadas ao navegador. Segredos cadastrados no painel são criptografados antes de serem armazenados no D1 e não são devolvidos pelas APIs. Preços ativos são validados na Stripe antes de serem publicados. Os bindings da infraestrutura permanecem na configuração do Worker.

Cada cadastro cria e publica a página inicial e inicia o teste de sete dias na mesma operação do D1. O painel administrativo permite editar assunto e HTML e ativar ou desativar os quatro tipos de e-mail. Os avisos de site criado e assinatura confirmada entram em uma fila no D1 e são enviados pelo Worker, com novas tentativas e chave de idempotência na Resend. A fila e os lembretes são processados a cada quinze minutos. O aviso de término só é agendado para o fim do teste ou para uma assinatura com cancelamento programado; assinaturas com renovação automática não recebem esse aviso.

## Organização do projeto

| Caminho                      | Responsabilidade                                                |
| ---------------------------- | --------------------------------------------------------------- |
| `frontend/src/pages/`        | Rotas Astro e verificação inicial de acesso.                    |
| `frontend/src/components/`   | Toda a interface, inclusive os painéis e as páginas publicadas. |
| `frontend/src/api/`          | Uma chamada por arquivo, agrupada por funcionalidade.           |
| `frontend/src/styles/`       | Entrada do Tailwind e configuração do tema daisyUI.             |
| `backend/app.ts`             | Middleware da API e montagem das rotas Hono.                    |
| `backend/features/`          | Rotas, regras e consultas de cada funcionalidade.               |
| `backend/platform/`          | Configuração e utilitários HTTP comuns.                         |
| `backend/jobs/`              | Tarefas agendadas pelo Worker.                                  |
| `backend/worker.ts`          | Entrada única do Worker para Hono, Astro e tarefas agendadas.   |
| `backend/migrations/`        | Evolução do esquema do D1.                                      |
| `frontend/src/middleware.ts` | Roteamento por hostname.                                        |
| `frontend/wrangler.jsonc`    | Configuração do Worker e dos serviços Cloudflare.               |

## Desenvolvimento local

Requer Node.js 22.12 ou superior. Após instalar as dependências, aplique as migrações locais e inicie o servidor:

```sh
npm install
npm run db:local
npm run dev -- --background
```

Use `npm run astro -- dev status`, `npm run astro -- dev logs` e `npm run astro -- dev stop` para acompanhar ou encerrar o servidor. Para verificar o projeto:

```sh
npm run check
npm run build
npm run format:check
```

Use `npm run format` para aplicar o padrão de formatação antes de enviar alterações.

Os fluxos que usam autenticação, pagamentos e domínios próprios dependem da configuração dos serviços externos no ambiente de execução.

## Configurar acesso com Google

Crie um cliente OAuth do tipo **Aplicativo da Web** no Google Cloud Console. Adicione `https://vira.ia.br` às origens JavaScript autorizadas e `https://vira.ia.br/api/auth/google` aos URIs de redirecionamento autorizados. Configure a tela de consentimento para usuários externos e publique o aplicativo quando estiver pronto para receber clientes. Se também usar `www.vira.ia.br`, adicione a origem e o URI equivalentes.

Cadastre o Client ID público no painel administrativo, em **Configurações**. O Google é opcional quando o acesso por e-mail está configurado. Os administradores autorizados ficam na tabela `admin_accounts`; uma instalação nova precisa cadastrar o primeiro e-mail nessa tabela antes do primeiro acesso. O deploy não altera essa autorização.

## Configurar acesso por e-mail

Crie uma conta na Resend, cadastre o domínio de envio e conclua a verificação dos registros DNS mostrados no painel. Crie uma chave de API com permissão apenas para envio. No painel administrativo, em **Configurações**, cadastre a chave `RESEND_API_KEY` e um remetente do domínio verificado em `AUTH_EMAIL_FROM`. O painel criptografa a chave antes de gravá-la no D1. O formulário de e-mail fica disponível quando os dois valores estiverem configurados e o modelo de acesso estiver ativo. Em **E-mails**, personalize os modelos e confira o histórico de envios. Os quatro HTMLs padrão ficam em `backend/features/emails/templates/`; a migração `0014_branded_email_templates.sql` os instala no D1 uma vez, preservando o estado de ativação. Ajustes posteriores feitos no painel permanecem no banco durante os próximos deploys.
