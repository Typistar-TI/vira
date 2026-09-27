-- Substitui os modelos iniciais pelos e-mails da marca Vira.

-- O estado de ativação de cada modelo permanece como está.

UPDATE email_templates SET subject = 'Seu link para entrar no Vira / Your sign-in link', html = '<!doctype html>
<html lang="pt">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Seu link para entrar no Vira / Your sign-in link</title>
  </head>
  <body
    style="
      margin: 0;
      padding: 0;
      background-color: #f8f7f4;
      color: #17130d;
      font-family: Arial, Helvetica, sans-serif;
    "
  >
    <table
      role="presentation"
      cellpadding="0"
      cellspacing="0"
      border="0"
      width="100%"
      style="border-collapse: collapse; background-color: #f8f7f4"
    >
      <tr>
        <td align="center" style="padding: 32px 16px">
          <table
            role="presentation"
            cellpadding="0"
            cellspacing="0"
            border="0"
            width="600"
            style="
              width: 100%;
              max-width: 600px;
              border-collapse: separate;
              background-color: #ffffff;
              border: 1px solid #e8d6b9;
              border-radius: 16px;
              overflow: hidden;
            "
          >
            <tr>
              <td style="height: 5px; background-color: #b88333; font-size: 1px; line-height: 1px">
                &nbsp;
              </td>
            </tr>
            <tr>
              <td style="padding: 28px 34px 20px">
                <a
                  href="https://vira.ia.br"
                  style="display: inline-block; text-decoration: none; white-space: nowrap"
                  aria-label="Vira"
                >
                  <img
                    src="https://vira.ia.br/vira-mark-amber.png"
                    width="42"
                    height="42"
                    alt=""
                    style="
                      display: inline-block;
                      vertical-align: middle;
                      border: 0;
                      width: 42px;
                      height: 42px;
                    "
                  />
                  <img
                    src="https://vira.ia.br/vira-wordmark-amber.png"
                    width="102"
                    height="42"
                    alt="Vira"
                    style="
                      display: inline-block;
                      vertical-align: middle;
                      border: 0;
                      width: 102px;
                      height: 42px;
                    "
                  />
                </a>
              </td>
            </tr>
            <tr>
              <td style="padding: 10px 34px 38px">
                <p
                  style="
                    margin: 0 0 15px;
                    color: #925b1a;
                    font-size: 11px;
                    font-weight: 700;
                    letter-spacing: 2px;
                    line-height: 16px;
                  "
                >
                  ACESSO À CONTA / SIGN IN
                </p>
                <h1
                  style="
                    margin: 0;
                    color: #17130d;
                    font-size: 30px;
                    font-weight: 700;
                    line-height: 38px;
                  "
                >
                  Seu acesso está aqui.
                </h1>
                <p
                  lang="en"
                  style="
                    margin: 7px 0 26px;
                    color: #9b6823;
                    font-size: 16px;
                    font-weight: 700;
                    line-height: 24px;
                  "
                >
                  Your sign-in link is here.
                </p>
                <p style="margin: 0 0 8px; color: #4f473e; font-size: 16px; line-height: 25px">
                  Toque no botão para entrar no Vira. É rápido e você não precisa de senha.
                </p>
                <p
                  lang="en"
                  style="margin: 0 0 27px; color: #625a51; font-size: 14px; line-height: 23px"
                >
                  Tap the button to sign in to Vira. No password needed.
                </p>
                <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td bgcolor="#a86c24" style="border-radius: 9px; background-color: #a86c24">
                      <a
                        href="{{login_url}}"
                        style="
                          display: inline-block;
                          padding: 15px 22px;
                          color: #ffffff;
                          font-size: 15px;
                          font-weight: 700;
                          line-height: 20px;
                          text-decoration: none;
                        "
                        >Entrar no Vira / Sign in</a
                      >
                    </td>
                  </tr>
                </table>

                <table
                  role="presentation"
                  cellpadding="0"
                  cellspacing="0"
                  border="0"
                  width="100%"
                  style="margin-top: 28px; border-collapse: collapse"
                >
                  <tr>
                    <td
                      style="
                        padding: 16px 18px;
                        background-color: #fff9f0;
                        border-left: 3px solid #b88333;
                      "
                    >
                      <p
                        style="margin: 0 0 6px; color: #4f473e; font-size: 14px; line-height: 22px"
                      >
                        Este link funciona uma vez e expira em 15 minutos.
                      </p>
                      <p
                        lang="en"
                        style="margin: 0; color: #625a51; font-size: 13px; line-height: 21px"
                      >
                        This link works once and expires in 15 minutes.
                      </p>
                    </td>
                  </tr>
                </table>
                <p style="margin: 24px 0 5px; color: #625a51; font-size: 13px; line-height: 21px">
                  Não pediu este acesso? Pode ignorar esta mensagem.
                </p>
                <p lang="en" style="margin: 0; color: #766e63; font-size: 12px; line-height: 19px">
                  Did not request this link? You can ignore this email.
                </p>
              </td>
            </tr>
            <tr>
              <td
                style="
                  padding: 23px 34px 26px;
                  border-top: 1px solid #ead9bd;
                  background-color: #fffaf2;
                "
              >
                <p
                  style="
                    margin: 0 0 8px;
                    color: #9b6823;
                    font-size: 13px;
                    font-weight: 700;
                    letter-spacing: 1px;
                    line-height: 19px;
                  "
                >
                  VIRA
                </p>
                <p style="margin: 0 0 12px; color: #625a51; font-size: 12px; line-height: 19px">
                  Enviado para / Sent to: {{email}}
                </p>
                <p style="margin: 0; color: #6f5840; font-size: 12px; line-height: 20px">
                  <a href="https://vira.ia.br" style="color: #925b1a; text-decoration: underline"
                    >vira.ia.br</a
                  >
                  &nbsp;&nbsp;·&nbsp;&nbsp;
                  <a
                    href="https://vira.ia.br/privacidade"
                    style="color: #925b1a; text-decoration: underline"
                    >Privacidade / Privacy</a
                  >
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
', updated_at = unixepoch() WHERE key = 'login';

UPDATE email_templates SET subject = 'Seu site já está no ar / Your site is live', html = '<!doctype html>
<html lang="pt">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Seu site já está no ar / Your site is live</title>
  </head>
  <body
    style="
      margin: 0;
      padding: 0;
      background-color: #f8f7f4;
      color: #17130d;
      font-family: Arial, Helvetica, sans-serif;
    "
  >
    <table
      role="presentation"
      cellpadding="0"
      cellspacing="0"
      border="0"
      width="100%"
      style="border-collapse: collapse; background-color: #f8f7f4"
    >
      <tr>
        <td align="center" style="padding: 32px 16px">
          <table
            role="presentation"
            cellpadding="0"
            cellspacing="0"
            border="0"
            width="600"
            style="
              width: 100%;
              max-width: 600px;
              border-collapse: separate;
              background-color: #ffffff;
              border: 1px solid #e8d6b9;
              border-radius: 16px;
              overflow: hidden;
            "
          >
            <tr>
              <td style="height: 5px; background-color: #b88333; font-size: 1px; line-height: 1px">
                &nbsp;
              </td>
            </tr>
            <tr>
              <td style="padding: 28px 34px 20px">
                <a
                  href="https://vira.ia.br"
                  style="display: inline-block; text-decoration: none; white-space: nowrap"
                  aria-label="Vira"
                >
                  <img
                    src="https://vira.ia.br/vira-mark-amber.png"
                    width="42"
                    height="42"
                    alt=""
                    style="
                      display: inline-block;
                      vertical-align: middle;
                      border: 0;
                      width: 42px;
                      height: 42px;
                    "
                  />
                  <img
                    src="https://vira.ia.br/vira-wordmark-amber.png"
                    width="102"
                    height="42"
                    alt="Vira"
                    style="
                      display: inline-block;
                      vertical-align: middle;
                      border: 0;
                      width: 102px;
                      height: 42px;
                    "
                  />
                </a>
              </td>
            </tr>
            <tr>
              <td style="padding: 10px 34px 38px">
                <p
                  style="
                    margin: 0 0 15px;
                    color: #925b1a;
                    font-size: 11px;
                    font-weight: 700;
                    letter-spacing: 2px;
                    line-height: 16px;
                  "
                >
                  SEU NOVO SITE / YOUR NEW SITE
                </p>
                <h1
                  style="
                    margin: 0;
                    color: #17130d;
                    font-size: 30px;
                    font-weight: 700;
                    line-height: 38px;
                  "
                >
                  Seu site já está no ar.
                </h1>
                <p
                  lang="en"
                  style="
                    margin: 7px 0 26px;
                    color: #9b6823;
                    font-size: 16px;
                    font-weight: 700;
                    line-height: 24px;
                  "
                >
                  Your site is live.
                </p>
                <p style="margin: 0 0 8px; color: #4f473e; font-size: 16px; line-height: 25px">
                  Criamos uma página inicial no seu endereço. Agora é só colocar suas informações e
                  publicar as mudanças.
                </p>
                <p
                  lang="en"
                  style="margin: 0 0 27px; color: #625a51; font-size: 14px; line-height: 23px"
                >
                  Your starter page is live. Add your details in the dashboard and publish your
                  changes.
                </p>
                <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td bgcolor="#a86c24" style="border-radius: 9px; background-color: #a86c24">
                      <a
                        href="{{site_url}}"
                        style="
                          display: inline-block;
                          padding: 15px 22px;
                          color: #ffffff;
                          font-size: 15px;
                          font-weight: 700;
                          line-height: 20px;
                          text-decoration: none;
                        "
                        >Ver meu site / View my site</a
                      >
                    </td>
                  </tr>
                </table>
                <p style="margin: 18px 0 0; font-size: 14px; line-height: 22px">
                  <a href="{{dashboard_url}}" style="color: #925b1a; text-decoration: underline"
                    >Editar no painel / Edit in dashboard</a
                  >
                </p>
                <table
                  role="presentation"
                  cellpadding="0"
                  cellspacing="0"
                  border="0"
                  width="100%"
                  style="margin-top: 28px; border-collapse: collapse"
                >
                  <tr>
                    <td
                      style="
                        padding: 16px 18px;
                        background-color: #fff9f0;
                        border-left: 3px solid #b88333;
                      "
                    >
                      <p
                        style="margin: 0 0 6px; color: #4f473e; font-size: 14px; line-height: 22px"
                      >
                        Seu teste grátis vai até <strong>{{end_date_pt}}</strong>.
                      </p>
                      <p
                        lang="en"
                        style="margin: 0; color: #625a51; font-size: 13px; line-height: 21px"
                      >
                        Your free trial runs until <strong>{{end_date_en}}</strong>.
                      </p>
                    </td>
                  </tr>
                </table>
                <p style="margin: 24px 0 5px; color: #625a51; font-size: 13px; line-height: 21px">
                  A página inicial é simples para você personalizar do seu jeito.
                </p>
                <p lang="en" style="margin: 0; color: #766e63; font-size: 12px; line-height: 19px">
                  The starter page is ready for you to make it your own.
                </p>
              </td>
            </tr>
            <tr>
              <td
                style="
                  padding: 23px 34px 26px;
                  border-top: 1px solid #ead9bd;
                  background-color: #fffaf2;
                "
              >
                <p
                  style="
                    margin: 0 0 8px;
                    color: #9b6823;
                    font-size: 13px;
                    font-weight: 700;
                    letter-spacing: 1px;
                    line-height: 19px;
                  "
                >
                  VIRA
                </p>
                <p style="margin: 0 0 12px; color: #625a51; font-size: 12px; line-height: 19px">
                  Enviado para / Sent to: {{email}}
                </p>
                <p style="margin: 0; color: #6f5840; font-size: 12px; line-height: 20px">
                  <a href="https://vira.ia.br" style="color: #925b1a; text-decoration: underline"
                    >vira.ia.br</a
                  >
                  &nbsp;&nbsp;·&nbsp;&nbsp;
                  <a
                    href="https://vira.ia.br/privacidade"
                    style="color: #925b1a; text-decoration: underline"
                    >Privacidade / Privacy</a
                  >
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
', updated_at = unixepoch() WHERE key = 'site_created';

UPDATE email_templates SET subject = 'Sua assinatura está confirmada / Subscription confirmed', html = '<!doctype html>
<html lang="pt">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Sua assinatura está confirmada / Subscription confirmed</title>
  </head>
  <body
    style="
      margin: 0;
      padding: 0;
      background-color: #f8f7f4;
      color: #17130d;
      font-family: Arial, Helvetica, sans-serif;
    "
  >
    <table
      role="presentation"
      cellpadding="0"
      cellspacing="0"
      border="0"
      width="100%"
      style="border-collapse: collapse; background-color: #f8f7f4"
    >
      <tr>
        <td align="center" style="padding: 32px 16px">
          <table
            role="presentation"
            cellpadding="0"
            cellspacing="0"
            border="0"
            width="600"
            style="
              width: 100%;
              max-width: 600px;
              border-collapse: separate;
              background-color: #ffffff;
              border: 1px solid #e8d6b9;
              border-radius: 16px;
              overflow: hidden;
            "
          >
            <tr>
              <td style="height: 5px; background-color: #b88333; font-size: 1px; line-height: 1px">
                &nbsp;
              </td>
            </tr>
            <tr>
              <td style="padding: 28px 34px 20px">
                <a
                  href="https://vira.ia.br"
                  style="display: inline-block; text-decoration: none; white-space: nowrap"
                  aria-label="Vira"
                >
                  <img
                    src="https://vira.ia.br/vira-mark-amber.png"
                    width="42"
                    height="42"
                    alt=""
                    style="
                      display: inline-block;
                      vertical-align: middle;
                      border: 0;
                      width: 42px;
                      height: 42px;
                    "
                  />
                  <img
                    src="https://vira.ia.br/vira-wordmark-amber.png"
                    width="102"
                    height="42"
                    alt="Vira"
                    style="
                      display: inline-block;
                      vertical-align: middle;
                      border: 0;
                      width: 102px;
                      height: 42px;
                    "
                  />
                </a>
              </td>
            </tr>
            <tr>
              <td style="padding: 10px 34px 38px">
                <p
                  style="
                    margin: 0 0 15px;
                    color: #925b1a;
                    font-size: 11px;
                    font-weight: 700;
                    letter-spacing: 2px;
                    line-height: 16px;
                  "
                >
                  PLANO ATIVO / ACTIVE PLAN
                </p>
                <h1
                  style="
                    margin: 0;
                    color: #17130d;
                    font-size: 30px;
                    font-weight: 700;
                    line-height: 38px;
                  "
                >
                  Tudo certo com seu plano.
                </h1>
                <p
                  lang="en"
                  style="
                    margin: 7px 0 26px;
                    color: #9b6823;
                    font-size: 16px;
                    font-weight: 700;
                    line-height: 24px;
                  "
                >
                  Your plan is ready.
                </p>
                <p style="margin: 0 0 8px; color: #4f473e; font-size: 16px; line-height: 25px">
                  Sua assinatura do Vira foi confirmada. Seu plano <strong>{{plan_pt}}</strong> já
                  está ativo.
                </p>
                <p
                  lang="en"
                  style="margin: 0 0 27px; color: #625a51; font-size: 14px; line-height: 23px"
                >
                  Your Vira subscription is confirmed. Your <strong>{{plan_en}}</strong> plan is
                  active.
                </p>
                <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td bgcolor="#a86c24" style="border-radius: 9px; background-color: #a86c24">
                      <a
                        href="{{dashboard_url}}"
                        style="
                          display: inline-block;
                          padding: 15px 22px;
                          color: #ffffff;
                          font-size: 15px;
                          font-weight: 700;
                          line-height: 20px;
                          text-decoration: none;
                        "
                        >Abrir meu painel / Open dashboard</a
                      >
                    </td>
                  </tr>
                </table>
                <p style="margin: 18px 0 0; font-size: 14px; line-height: 22px">
                  <a href="{{site_url}}" style="color: #925b1a; text-decoration: underline"
                    >Ver meu site / View my site</a
                  >
                </p>
                <table
                  role="presentation"
                  cellpadding="0"
                  cellspacing="0"
                  border="0"
                  width="100%"
                  style="margin-top: 28px; border-collapse: collapse"
                >
                  <tr>
                    <td
                      style="
                        padding: 16px 18px;
                        background-color: #fff9f0;
                        border-left: 3px solid #b88333;
                      "
                    >
                      <p
                        style="margin: 0 0 6px; color: #4f473e; font-size: 14px; line-height: 22px"
                      >
                        Você pode continuar editando e publicando seu site normalmente.
                      </p>
                      <p
                        lang="en"
                        style="margin: 0; color: #625a51; font-size: 13px; line-height: 21px"
                      >
                        You can keep editing and publishing your site as usual.
                      </p>
                    </td>
                  </tr>
                </table>
                <p style="margin: 24px 0 5px; color: #625a51; font-size: 13px; line-height: 21px">
                  Obrigado por criar com o Vira.
                </p>
                <p lang="en" style="margin: 0; color: #766e63; font-size: 12px; line-height: 19px">
                  Thank you for creating with Vira.
                </p>
              </td>
            </tr>
            <tr>
              <td
                style="
                  padding: 23px 34px 26px;
                  border-top: 1px solid #ead9bd;
                  background-color: #fffaf2;
                "
              >
                <p
                  style="
                    margin: 0 0 8px;
                    color: #9b6823;
                    font-size: 13px;
                    font-weight: 700;
                    letter-spacing: 1px;
                    line-height: 19px;
                  "
                >
                  VIRA
                </p>
                <p style="margin: 0 0 12px; color: #625a51; font-size: 12px; line-height: 19px">
                  Enviado para / Sent to: {{email}}
                </p>
                <p style="margin: 0; color: #6f5840; font-size: 12px; line-height: 20px">
                  <a href="https://vira.ia.br" style="color: #925b1a; text-decoration: underline"
                    >vira.ia.br</a
                  >
                  &nbsp;&nbsp;·&nbsp;&nbsp;
                  <a
                    href="https://vira.ia.br/privacidade"
                    style="color: #925b1a; text-decoration: underline"
                    >Privacidade / Privacy</a
                  >
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
', updated_at = unixepoch() WHERE key = 'subscription_created';

UPDATE email_templates SET subject = 'Seu acesso termina em breve / Your access ends soon', html = '<!doctype html>
<html lang="pt">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Seu acesso termina em breve / Your access ends soon</title>
  </head>
  <body
    style="
      margin: 0;
      padding: 0;
      background-color: #f8f7f4;
      color: #17130d;
      font-family: Arial, Helvetica, sans-serif;
    "
  >
    <table
      role="presentation"
      cellpadding="0"
      cellspacing="0"
      border="0"
      width="100%"
      style="border-collapse: collapse; background-color: #f8f7f4"
    >
      <tr>
        <td align="center" style="padding: 32px 16px">
          <table
            role="presentation"
            cellpadding="0"
            cellspacing="0"
            border="0"
            width="600"
            style="
              width: 100%;
              max-width: 600px;
              border-collapse: separate;
              background-color: #ffffff;
              border: 1px solid #e8d6b9;
              border-radius: 16px;
              overflow: hidden;
            "
          >
            <tr>
              <td style="height: 5px; background-color: #b88333; font-size: 1px; line-height: 1px">
                &nbsp;
              </td>
            </tr>
            <tr>
              <td style="padding: 28px 34px 20px">
                <a
                  href="https://vira.ia.br"
                  style="display: inline-block; text-decoration: none; white-space: nowrap"
                  aria-label="Vira"
                >
                  <img
                    src="https://vira.ia.br/vira-mark-amber.png"
                    width="42"
                    height="42"
                    alt=""
                    style="
                      display: inline-block;
                      vertical-align: middle;
                      border: 0;
                      width: 42px;
                      height: 42px;
                    "
                  />
                  <img
                    src="https://vira.ia.br/vira-wordmark-amber.png"
                    width="102"
                    height="42"
                    alt="Vira"
                    style="
                      display: inline-block;
                      vertical-align: middle;
                      border: 0;
                      width: 102px;
                      height: 42px;
                    "
                  />
                </a>
              </td>
            </tr>
            <tr>
              <td style="padding: 10px 34px 38px">
                <p
                  style="
                    margin: 0 0 15px;
                    color: #925b1a;
                    font-size: 11px;
                    font-weight: 700;
                    letter-spacing: 2px;
                    line-height: 16px;
                  "
                >
                  AVISO DE ACESSO / ACCESS NOTICE
                </p>
                <h1
                  style="
                    margin: 0;
                    color: #17130d;
                    font-size: 30px;
                    font-weight: 700;
                    line-height: 38px;
                  "
                >
                  Seu acesso termina em breve.
                </h1>
                <p
                  lang="en"
                  style="
                    margin: 7px 0 26px;
                    color: #9b6823;
                    font-size: 16px;
                    font-weight: 700;
                    line-height: 24px;
                  "
                >
                  Your access ends soon.
                </p>
                <p style="margin: 0 0 8px; color: #4f473e; font-size: 16px; line-height: 25px">
                  O acesso do seu plano <strong>{{plan_pt}}</strong> está previsto para terminar em
                  <strong>{{end_date_pt}}</strong>.
                </p>
                <p
                  lang="en"
                  style="margin: 0 0 27px; color: #625a51; font-size: 14px; line-height: 23px"
                >
                  Access to your <strong>{{plan_en}}</strong> plan is scheduled to end on
                  <strong>{{end_date_en}}</strong>.
                </p>
                <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td bgcolor="#a86c24" style="border-radius: 9px; background-color: #a86c24">
                      <a
                        href="{{dashboard_url}}"
                        style="
                          display: inline-block;
                          padding: 15px 22px;
                          color: #ffffff;
                          font-size: 15px;
                          font-weight: 700;
                          line-height: 20px;
                          text-decoration: none;
                        "
                        >Abrir painel / Open dashboard</a
                      >
                    </td>
                  </tr>
                </table>

                <table
                  role="presentation"
                  cellpadding="0"
                  cellspacing="0"
                  border="0"
                  width="100%"
                  style="margin-top: 28px; border-collapse: collapse"
                >
                  <tr>
                    <td
                      style="
                        padding: 16px 18px;
                        background-color: #fff9f0;
                        border-left: 3px solid #b88333;
                      "
                    >
                      <p
                        style="margin: 0 0 6px; color: #4f473e; font-size: 14px; line-height: 22px"
                      >
                        Para manter o site no ar, abra o painel e veja as opções disponíveis.
                      </p>
                      <p
                        lang="en"
                        style="margin: 0; color: #625a51; font-size: 13px; line-height: 21px"
                      >
                        To keep your site online, open your dashboard and review your options.
                      </p>
                    </td>
                  </tr>
                </table>
                <p style="margin: 24px 0 5px; color: #625a51; font-size: 13px; line-height: 21px">
                  Se você já resolveu isso, não precisa fazer mais nada.
                </p>
                <p lang="en" style="margin: 0; color: #766e63; font-size: 12px; line-height: 19px">
                  If you have already taken care of this, there is nothing else to do.
                </p>
              </td>
            </tr>
            <tr>
              <td
                style="
                  padding: 23px 34px 26px;
                  border-top: 1px solid #ead9bd;
                  background-color: #fffaf2;
                "
              >
                <p
                  style="
                    margin: 0 0 8px;
                    color: #9b6823;
                    font-size: 13px;
                    font-weight: 700;
                    letter-spacing: 1px;
                    line-height: 19px;
                  "
                >
                  VIRA
                </p>
                <p style="margin: 0 0 12px; color: #625a51; font-size: 12px; line-height: 19px">
                  Enviado para / Sent to: {{email}}
                </p>
                <p style="margin: 0; color: #6f5840; font-size: 12px; line-height: 20px">
                  <a href="https://vira.ia.br" style="color: #925b1a; text-decoration: underline"
                    >vira.ia.br</a
                  >
                  &nbsp;&nbsp;·&nbsp;&nbsp;
                  <a
                    href="https://vira.ia.br/privacidade"
                    style="color: #925b1a; text-decoration: underline"
                    >Privacidade / Privacy</a
                  >
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
', updated_at = unixepoch() WHERE key = 'subscription_ending';
