-- Troca o símbolo antigo (V 2D) pelo novo símbolo 3D usado no hero, nos e-mails de marca.
UPDATE email_templates
SET html = replace(html, '/vira-mark-amber.png', '/vira-mark-3d.png'),
    updated_at = unixepoch()
WHERE instr(html, '/vira-mark-amber.png') > 0;
