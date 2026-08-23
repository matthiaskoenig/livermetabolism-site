source "https://rubygems.org"
ruby RUBY_VERSION

gem "jekyll", "4.4.1"

# kramdown 2.x split its GitHub-Flavored-Markdown input parser out into its
# own gem; Jekyll's default `markdown: kramdown` config expects it present.
gem "kramdown-parser-gfm"

# to use GitHub Pages
# gem "github-pages", group: :jekyll_plugins

# If you have any plugins, put them here!
group :jekyll_plugins do
   gem "jekyll-feed"
   gem "jekyll-sitemap"
   gem "jekyll-redirect-from"
   gem "jekyll-seo-tag"
end

# Windows does not include zoneinfo files, so bundle the tzinfo-data gem
gem 'tzinfo-data', platforms: [:mingw, :mswin, :x64_mingw, :jruby]
