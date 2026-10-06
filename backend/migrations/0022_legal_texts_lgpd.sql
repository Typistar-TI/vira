-- Política de Privacidade e Termos de Uso alinhados à LGPD (Lei nº 13.709/2018).
-- Preenche apenas se o texto ainda estiver vazio, para não sobrescrever edições do painel.

UPDATE app_settings
SET value = 'Esta Política de Privacidade descreve como o Vira, disponível em vira.ia.br, realiza o tratamento de dados pessoais. Elaborada em conformidade com a Lei nº 13.709/2018 (Lei Geral de Proteção de Dados Pessoais — LGPD), ela explica quais dados coletamos, com quais finalidades, com quem compartilhamos, por quanto tempo guardamos e como você pode exercer os seus direitos.

1. Controlador e encarregado. O controlador dos dados pessoais é o responsável indicado no início desta página. O encarregado pelo tratamento de dados pessoais (DPO) e o canal para exercer os seus direitos funcionam pelo e-mail de contato indicado no início desta página.

2. Dados pessoais que tratamos.
• Cadastro e acesso: e-mail e senha (guardada apenas como hash com salt). Se você entrar com o Google, recebemos o identificador da conta e o e-mail associado.
• Conteúdo da sua página: textos, imagens, logotipo, cores, fontes e demais informações que você cadastrar e publicar.
• Domínio próprio: o endereço informado e os registros técnicos necessários para conectar e validar o domínio.
• Cobrança: identificadores de cliente e de assinatura e o status do pagamento, processados pela Stripe. Não armazenamos o número completo do cartão.
• Uso e segurança: registros de acesso, endereço IP (tratado de forma temporária e/ou pseudonimizada), identificação do navegador e controles de limite de requisições.
• Consentimentos: registro do aceite dos Termos de Uso e desta Política e do aviso de cookies, com data, versão e dados técnicos associados.
• Assistente de IA: mensagens trocadas nas páginas publicadas, vinculadas a um identificador anônimo aleatório guardado no navegador do visitante.
• Estatísticas: contagem de visualizações e cliques por página, sem nomes ou e-mails de visitantes.

3. Finalidades e bases legais (art. 7º da LGPD).
• Execução de contrato ou de procedimentos preliminares: criar e administrar a conta, publicar a página, conectar o domínio, processar o plano e o pagamento e prestar suporte.
• Cumprimento de obrigação legal ou regulatória: guarda de registros fiscais, contábeis e de acesso e atendimento a autoridades competentes.
• Legítimo interesse: segurança da informação, prevenção a fraudes e abusos, melhoria do serviço e produção de estatísticas agregadas, sempre com respeito aos seus direitos e liberdades.
• Consentimento: cookies não essenciais e comunicações opcionais, que você pode revogar a qualquer momento.

4. Cookies e tecnologias semelhantes. Usamos um cookie essencial de sessão (HttpOnly) para manter você conectado e não utilizamos cookies de publicidade. Exibimos um aviso de cookies na primeira visita e registramos o seu consentimento. Você pode bloquear cookies nas configurações do navegador, mas o cookie essencial é necessário para o login.

5. Compartilhamento com terceiros. Não vendemos dados pessoais. Compartilhamos o mínimo necessário com operadores que nos ajudam a operar o serviço:
• Cloudflare: hospedagem, rede de entrega, DNS, banco de dados, armazenamento de imagens, execução da assistente de IA e estatísticas.
• Google: autenticação, quando você escolhe entrar com o Google.
• Resend: envio dos e-mails de acesso e avisos do serviço.
• Stripe: processamento de pagamentos e gestão de assinaturas.

6. Transferência internacional de dados. Os operadores acima podem tratar dados fora do Brasil. Nesses casos, a transferência observa o art. 33 da LGPD e adotamos salvaguardas contratuais e técnicas para proteger os dados.

7. Retenção e eliminação.
• Sessões de acesso expiram em 30 dias.
• Contas expiradas (após o fim do teste ou da assinatura) são eliminadas após 90 dias, incluindo páginas e imagens.
• Mensagens da assistente de IA são removidas após 30 dias.
• Registros de envio de e-mail são removidos após 30 dias.
• Registros de segurança e de limite de requisições são removidos periodicamente.
• Imagens não utilizadas são removidas após 1 dia.
• Registros de eventos de pagamento podem ser mantidos por até 180 dias, além dos prazos exigidos por lei.
Você pode solicitar a exclusão da sua conta a qualquer momento no painel. Imagens públicas podem permanecer em caches de navegadores e da rede por alguns minutos após a exclusão.

8. Seus direitos (art. 18 da LGPD). Você pode solicitar: confirmação da existência de tratamento; acesso aos dados; correção de dados incompletos, inexatos ou desatualizados; anonimização, bloqueio ou eliminação de dados desnecessários, excessivos ou tratados em desconformidade com a lei; portabilidade; eliminação dos dados tratados com base no consentimento; informação sobre as entidades com as quais compartilhamos dados; informação sobre a possibilidade de não fornecer consentimento e suas consequências; e revogação do consentimento. No painel você pode baixar os seus dados e excluir a sua conta. Para as demais solicitações, use o e-mail de contato indicado no início desta página; responderemos nos prazos legais.

9. Segurança. Adotamos medidas técnicas e administrativas para proteger os dados, como criptografia de credenciais de configuração, armazenamento de senha apenas como hash com salt, controle de acesso, uso de HTTPS e limites de requisições. Nenhum sistema é totalmente imune a incidentes; caso ocorra um incidente relevante, comunicaremos os titulares e a Autoridade Nacional de Proteção de Dados (ANPD) conforme a lei.

10. Crianças e adolescentes. O serviço não é direcionado a menores de 18 anos. Menores devem utilizá-lo apenas com o consentimento e a supervisão dos responsáveis legais.

11. Alterações desta Política. Podemos atualizar este documento para refletir mudanças no serviço ou na legislação. A versão vigente é sempre a publicada nesta página, com a data de atualização. O uso continuado após as alterações significa que você concorda com a nova versão.

12. Legislação e foro. Esta Política é regida pelas leis brasileiras, em especial pela LGPD. Eventuais controvérsias serão resolvidas no foro do domicílio do titular, quando aplicável a legislação consumerista, ou no foro do controlador.

Última atualização: outubro de 2026.', updated_at = unixepoch()
WHERE key = 'PRIVACY_POLICY' AND (value IS NULL OR value = '');

UPDATE app_settings
SET value = 'Estes Termos de Uso regulam o acesso e a utilização do Vira, plataforma disponível em vira.ia.br para criar, personalizar e publicar páginas na internet, com uma assistente de inteligência artificial. Ao criar uma conta ou usar o serviço, você declara que leu, entendeu e concorda com estes Termos e com a Política de Privacidade.

1. Definições. Vira: a plataforma e os serviços oferecidos em vira.ia.br. Usuário: a pessoa que cria a conta e utiliza o serviço. Conteúdo: textos, imagens, logotipo e demais informações cadastradas. Página: o site publicado pelo Usuário. Assistente: a ferramenta de inteligência artificial que responde a visitantes com base no Conteúdo publicado.

2. Cadastro e conta. Você deve fornecer informações verdadeiras, completas e atualizadas e manter a segurança das suas credenciais. Você é responsável por toda atividade realizada na sua conta. É necessário ter capacidade legal para contratar; menores de 18 anos devem usar o serviço com consentimento e supervisão dos responsáveis.

3. Planos, teste e pagamento. O Vira oferece um teste gratuito de 1 (um) dia e planos mensal, anual e vitalício, com preços exibidos na página de planos. Os pagamentos são processados pela Stripe. As assinaturas mensal e anual são renovadas automaticamente até o cancelamento. Você pode cancelar a qualquer momento; o acesso permanece até o fim do período já pago. O plano vitalício é pago uma única vez. O não pagamento pode suspender o acesso. Podemos alterar os preços, com aviso prévio, respeitados os períodos já contratados.

4. Uso aceitável. Você concorda em não utilizar o Vira para: publicar conteúdo ilegal, ofensivo, difamatório, discriminatório, violento ou que viole direitos de terceiros; divulgar malware, spam ou golpes (phishing); explorar ou expor menores de forma inadequada; violar direitos autorais, marcas ou a privacidade de terceiros; tentar burlar limites, acessar áreas restritas, sobrecarregar a infraestrutura ou fazer engenharia reversa; e praticar qualquer ato contrário à lei ou a estes Termos.

5. Conteúdo do Usuário. O Conteúdo é de sua responsabilidade e você declara possuir os direitos necessários para publicá-lo. Ao publicar, você concede ao Vira uma licença limitada, não exclusiva e gratuita para hospedar, armazenar, exibir, processar e transmitir o Conteúdo com a finalidade de operar e divulgar o serviço, inclusive para alimentar a Assistente da sua Página. Você pode remover o Conteúdo a qualquer momento, encerrando essa licença, ressalvadas as cópias de segurança e os prazos de retenção legais.

6. Assistente de inteligência artificial. A Assistente gera respostas automáticas com base no Conteúdo publicado e pode conter imprecisões ou erros. As respostas não constituem aconselhamento jurídico, médico, financeiro ou profissional. Você é responsável por revisar o Conteúdo e por orientar o uso da Assistente em sua Página.

7. Propriedade intelectual. A marca, o código, o layout e os demais elementos do Vira pertencem ao controlador e são protegidos por lei. Estes Termos não transferem a você qualquer direito sobre eles. O Conteúdo do Usuário permanece de titularidade do Usuário.

8. Domínios próprios. A conexão de um domínio próprio depende de configuração de DNS feita por você e da validação técnica do certificado de segurança. O Vira não garante a disponibilidade de domínios de terceiros e eventuais custos de registro ou renovação são de sua responsabilidade.

9. Privacidade. O tratamento de dados pessoais é descrito na Política de Privacidade, que integra estes Termos, e observa a LGPD. Ao aceitar estes Termos, você também declara ter lido a Política de Privacidade.

10. Disponibilidade e limitação de responsabilidade. O serviço é fornecido no estado em que se encontra. Podemos suspender o acesso para manutenção, atualizações ou por motivos de segurança e não garantimos operação ininterrupta ou livre de erros. Na máxima extensão permitida pela lei, não respondemos por lucros cessantes, perda de oportunidade ou danos indiretos. Nada nestes Termos afasta os direitos previstos no Código de Defesa do Consumidor.

11. Suspensão e encerramento. Podemos suspender ou encerrar contas que violem estes Termos, a lei ou direitos de terceiros, com aviso quando possível. Você pode excluir a sua conta e o seu Conteúdo a qualquer momento no painel.

12. Alterações destes Termos. Podemos atualizar estes Termos para refletir mudanças no serviço ou na lei. A versão vigente é sempre a publicada nesta página. O uso continuado após as alterações significa que você concorda com a nova versão.

13. Legislação e foro. Estes Termos são regidos pelas leis brasileiras. Eventuais controvérsias serão resolvidas no foro do domicílio do consumidor, quando aplicável o Código de Defesa do Consumidor, ou no foro do controlador.

Última atualização: outubro de 2026.', updated_at = unixepoch()
WHERE key = 'TERMS_OF_USE' AND (value IS NULL OR value = '');
