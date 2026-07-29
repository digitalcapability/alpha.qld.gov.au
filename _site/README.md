# qld.gov.au

Hub for all things Digital Capability for Qld Government public sector workforce.

## Local development

Requirements:
- Ruby 3.2+
- Bundler
- Jekyll 4.x

Steps:

```bash
bundle install
bundle exec jekyll serve --livereload
```

Then open the local preview at `http://127.0.0.1:4000/qld.gov.au/`.

## GitHub Pages

This site is configured for GitHub Pages with:

- `url: "https://digitalcapability.github.io"`
- `baseurl: "/qld.gov.au"`

All asset, image and internal links use `relative_url` to work on both local preview and GitHub Pages.
