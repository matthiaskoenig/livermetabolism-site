source "https://rubygems.org"
ruby RUBY_VERSION

gem "jekyll", "3.8.6"
# Fix for mismatched deps: https://github.com/ffi/ffi/issues/1103
gem "ffi", "< 1.17.0"

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
