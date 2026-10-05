# Pages and visual components

- Route files perform access checks and select page views.
- `_views/` contains page-specific server orchestration and rendering. Astro excludes underscore directories from routing.
- `_scripts/` contains page behavior and API interactions (login, account menu, chat and preview studio).
- `../components/` contains reusable visual elements: markup, styles, presentation props and visual-only interactions. It must not perform session checks, database queries or feature API requests.

Interactive previews are temporary: changing controls renders a preview without saving or publishing. Save and publish remain explicit actions. Image files are uploaded when saving.
