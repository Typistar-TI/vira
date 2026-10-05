import { it, expect } from 'vitest';
import { renderEmail, validateTemplate } from '../../backend/features/emails/service/emails';

it('escapes dynamic email variables rather than injecting HTML', () => {
  const rendered = renderEmail(
    { key: 'login', enabled: 1, subject: '{{email}}', html: '<p>{{email}}</p>{{login_code}}' },
    { email: '<img src=x onerror=alert(1)>', login_code: '123456' },
  );
  expect(rendered.html).not.toContain('<img');
  expect(rendered.html).toContain('&lt;img');
});
it.each([
  '<script>alert(1)</script>',
  '<img onerror="alert(1)">',
  '<a href="javascript:alert(1)">x</a>',
  '<iframe src="https://evil.test"></iframe>',
])('rejects unsafe email HTML: %s', (html) => {
  expect(validateTemplate('login', 'Code', html + '{{login_code}}')).toBeTruthy();
});
it('requires the login code placeholder and rejects unknown template variables', () => {
  expect(validateTemplate('login', 'Code', '<p>No code</p>')).toBeTruthy();
  expect(validateTemplate('login', 'Code', '{{login_code}}{{private_key}}')).toBeTruthy();
  expect(validateTemplate('login', 'Code', '<p>{{login_code}}</p>')).toBeNull();
});
