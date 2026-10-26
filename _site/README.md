# alpha.qld.gov.au

Hub for all things Digital Capability for Qld Government public sector workforce.

## Local development

Requirements:
- Ruby 3.2+
- Bundler
- Jekyll 4.x

Steps:

Linux steps
```bash
sudo apt-get install ruby ruby-dev
sudo gem install bundler
sudo bundle install
bundle exec jekyll serve --livereload
```

Then open the local preview at `http://127.0.0.1:4000/digitalcapability/`.

## GitHub Pages

This site is configured for GitHub Pages with:

- `url: "https://qld-gov-au.github.io"`
- `baseurl: "/digitalcapability"`

All asset, image and internal links use `relative_url` to work on both local preview and GitHub Pages.

## Common Workplace Questions

Workplace question content and its topic, competence, keyword, synonym and related-question mappings are maintained in `_data/workplace_questions.yml`. Each question has a page stub under `common-workplace-questions/questions/` that uses the shared `_layouts/workplace-question.html` layout. Keep each stub's `question_id` and permalink aligned with the data entry when adding a question.

The Common Workplace Questions page uses client-side search, typo-tolerant suggestions and topic filters from `assets/js/workplace-questions.js`. The search index is rendered from the question data so it works as a static GitHub Pages site without an external search service.
