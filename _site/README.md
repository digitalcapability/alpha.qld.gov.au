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

Then open the local preview at `http://127.0.0.1:4000/alpha.qld.gov.au/`.

## GitHub Pages

This site is configured for GitHub Pages with:

- `url: "https://qld-gov-au.github.io"`
- `baseurl: "digitalcapability"`

All asset, image and internal links use `relative_url` to work on both local preview and GitHub Pages.
