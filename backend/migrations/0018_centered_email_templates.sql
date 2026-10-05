-- Keep activation states and existing content; center logo, body and buttons.
UPDATE email_templates SET html = replace(replace(replace(html,
  '<td style="', '<td align="center" style="text-align: center; '),
  '<td
', '<td align="center"
'),
  '<table role="presentation"', '<table align="center" role="presentation"')
WHERE key IN ('login', 'site_created', 'subscription_created', 'subscription_ending');
