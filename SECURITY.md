# Revisão de segurança

Revisão de código e testes locais em 5 de outubro de 2026. Não é um pentest nem uma garantia de ausência de vulnerabilidades. Nenhuma configuração de produção foi alterada nesta revisão.

## Proteções verificadas

- Sessões: tokens aleatórios de 256 bits, somente hashes no D1; cookies `__Host-`, `HttpOnly`, `Secure`, `SameSite=Lax`, `Path=/`, sem `Domain`. Validade de 30 dias, revogação no logout e ao redefinir senha. Sessões administrativas separadas e vinculadas à allowlist.
- Autenticação: códigos HMAC, finalidade vinculada, expiração de dez minutos, até cinco tentativas e resgate único mesmo sob concorrência. Senhas com salt e PBKDF2-SHA256; respostas uniformes para credenciais incorretas. Google verifica assinatura, issuer, audience, algoritmo e e-mail verificado; usa double-submit CSRF.
- CSRF: mutações dos painéis e login por código/senha exigem Origin exato. Webhook Stripe não usa cookies e exige assinatura/timestamp. Leituras do histórico aceitam Origin ou Fetch Metadata de navegador same-origin, não de cross-site.
- Rate limit: contadores D1 atômicos, limites por conta/IP/rota e orçamento global da IA; limites agregados por conta evitam distribuir o abuso entre rotas. As quotas de upload são reservadas atomicamente antes de escrever no R2.
- HTTP: APIs e páginas privadas sem cache; `nosniff`, política de referência, restrição de enquadramento e HSTS em HTTPS. CSP de API com `default-src 'none'`; páginas bloqueiam objetos e bases externas.
- Isolamento: identidade vem da sessão, não de IDs enviados pelo cliente. Imagens do rascunho precisam pertencer ao site; mídia de sites expirados só é acessível ao dono. Conversas são consultadas por site e UUID.
- Entrada: limites de bytes durante leitura, inclusive sem Content-Length; JSON raiz precisa ser objeto. URLs do site são validadas; uploads aceitam tipos/tamanhos limitados e verificam a assinatura do contêiner. E-mails escapam variáveis e rejeitam HTML ativo.
- Integrações: configurações secretas com AES-GCM; assinaturas Stripe reais exercitadas nos testes, inclusive payload alterado, timestamp antigo, checkout não pago e reembolso de pagamento diferente.
- Dependências: `npm audit` sem alertas após atualização. Overrides atualizam workerd/Miniflare do pool de testes e dependências transitivas corrigidas; revisar esses pins nas próximas atualizações.

## Limites e recomendações

- Rate limits na aplicação não substituem WAF/limites na borda: requisições ainda podem consumir CPU e operações D1. `CF-Connecting-IP` pressupõe execução atrás do Cloudflare, que deve sobrescrever esse header. Não expor um proxy que confie no valor enviado pelo visitante.
- Não foi verificado o estado de WAF, TLS ou “Always Use HTTPS” da zona em produção. HSTS é entregue apenas em HTTPS; ativar redirecionamento HTTP na borda e usar TLS Full (strict).
- A CSP das páginas ainda não restringe todas as fontes de scripts. Uma política estrita com nonce precisa ser testada com Astro, Google Login e previews antes de ativação.
- O assistente usa guardrails por prompt, não isolamento semântico garantido. O UUID do histórico é um identificador secreto anônimo (capability), não autenticação; não usar o chat para dados sensíveis. O teto de 2.000 perguntas não garante um teto de custo em neurônios.
- Headers de imagem não garantem que um arquivo seja completamente válido. Decodificação/re-encode no servidor seria uma camada adicional; a quota reservada antes do R2 pode ficar ocupada se o Worker for interrompido entre as operações.
- Webhooks possuem deduplicação após processamento e fila de e-mail com chave única; isso não garante execução exatamente uma vez de todos os efeitos externos sob concorrência/interrupção. Eventos Stripe fora de ordem também precisam de reconciliação; não há teste end-to-end com a Stripe real.
- Admin ainda não exige MFA ou reautenticação recente para ações sensíveis. E-mail de confirmação na exclusão é confirmação de intenção, não segundo fator.
- Testes não cobrem o handshake real com Google/Resend, TLS no navegador ou políticas reais da zona. Provedores externos são bloqueados/substituídos nos testes.

## Executar

`npm ci`, `npm test`, `npm run check`, `npm run build`, `npm audit`.

Os testes usam fixtures aleatórias, migrações reais e armazenamento descartável no workerd. Nenhum segredo de produção é necessário. O workflow bloqueia migrações/deploy se qualquer teste falhar.
