-- Remove o plano vitalício da oferta (Stripe já será desativado à parte).

DELETE FROM plan_prices WHERE plan = 'lifetime';
DELETE FROM stripe_price_catalog WHERE plan = 'lifetime';

-- Ajusta os Termos de Uso (PT) para citar apenas mensal e anual.
UPDATE app_settings
SET value = replace(
    replace(
      replace(value, 'planos mensal, anual e vitalício', 'planos mensal e anual'),
      'As assinaturas mensal e anual são renovadas',
      'As assinaturas são renovadas'
    ),
    'O plano vitalício é pago uma única vez. ',
    ''
  ),
  updated_at = unixepoch()
WHERE key = 'TERMS_OF_USE';

-- Ajusta os Termos de Uso (EN) para citar apenas mensal e anual.
UPDATE app_settings
SET value = replace(
    replace(
      replace(value, 'monthly, yearly and lifetime plans', 'monthly and yearly plans'),
      'Monthly and yearly subscriptions renew',
      'Subscriptions renew'
    ),
    'The lifetime plan is paid once. ',
    ''
  ),
  updated_at = unixepoch()
WHERE key = 'TERMS_OF_USE_EN';
