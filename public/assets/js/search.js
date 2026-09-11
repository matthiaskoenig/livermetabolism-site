// Full-text search over /search.json (see app/search.json), rendered into
// the #site-search-modal added by _includes/site_search.html. The JSON is
// only fetched once the modal is first opened, and cached for the rest of
// the session.
(function () {
    var modalEl = document.getElementById('site-search-modal');
    if (!modalEl) return;

    var input = document.getElementById('site-search-input');
    var resultsEl = document.getElementById('site-search-results');
    var searchUrl = modalEl.getAttribute('data-search-url');

    var records = null;
    var loadPromise = null;

    var TYPE_ICONS = {
        'Publication': 'fa-file-pdf-o',
        'Presentation': 'fa-desktop',
        'Poster': 'fa-image',
        'Abstract': 'fa-file-text-o',
        'Project': 'fa-cogs',
        'Software': 'fa-code',
        'Funding': 'fa-money',
        'Editorial role': 'fa-pencil',
        'News': 'fa-newspaper-o',
        'Meeting': 'fa-users',
        'Teaching': 'fa-graduation-cap',
        'Person': 'fa-user',
        'Research area': 'fa-flask',
        'Page': 'fa-compass'
    };

    function loadRecords() {
        if (loadPromise) return loadPromise;
        loadPromise = fetch(searchUrl)
            .then(function (res) { return res.json(); })
            .then(function (data) {
                records = data;
                return data;
            })
            .catch(function () {
                resultsEl.innerHTML = '<p class="site-search-empty">Search is temporarily unavailable.</p>';
                return [];
            });
        return loadPromise;
    }

    function escapeHtml(str) {
        var div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    // every query token must appear in the title or text to qualify; a
    // title match (especially at the start of the title) scores higher
    // than a match buried in the body text
    function scoreRecord(record, tokens) {
        var title = record.title.toLowerCase();
        var text = record.text.toLowerCase();
        var total = 0;
        for (var i = 0; i < tokens.length; i++) {
            var token = tokens[i];
            if (title.indexOf(token) === 0) {
                total += 15;
            } else if (title.indexOf(token) !== -1) {
                total += 10;
            } else if (text.indexOf(token) !== -1) {
                total += 1;
            } else {
                return -1;
            }
        }
        return total;
    }

    function render(query) {
        var trimmed = query.trim();
        if (!trimmed) {
            resultsEl.innerHTML = '<p class="site-search-hint">Start typing to search publications, people, projects, software, news, and more.</p>';
            return;
        }

        var tokens = trimmed.toLowerCase().split(/\s+/).filter(Boolean);
        var scored = [];
        (records || []).forEach(function (record) {
            var s = scoreRecord(record, tokens);
            if (s > 0) scored.push({ record: record, score: s });
        });
        scored.sort(function (a, b) { return b.score - a.score; });
        scored = scored.slice(0, 30);

        if (scored.length === 0) {
            resultsEl.innerHTML = '<p class="site-search-empty">No results for &ldquo;' + escapeHtml(trimmed) + '&rdquo;.</p>';
            return;
        }

        resultsEl.innerHTML = scored.map(function (item) {
            var r = item.record;
            var icon = TYPE_ICONS[r.type] || 'fa-file-o';
            return '<a class="site-search-result" href="' + r.url + '">' +
                '<i class="fa ' + icon + '" aria-hidden="true"></i>' +
                '<span class="site-search-result-body">' +
                '<span class="site-search-result-title">' + escapeHtml(r.title) + '</span>' +
                '<span class="site-search-result-type">' + escapeHtml(r.type) + '</span>' +
                '</span>' +
                '</a>';
        }).join('');
    }

    modalEl.addEventListener('shown.bs.modal', function () {
        input.focus();
        loadRecords().then(function () { render(input.value); });
    });

    modalEl.addEventListener('hidden.bs.modal', function () {
        input.value = '';
        render('');
    });

    input.addEventListener('input', function () {
        if (records) render(input.value);
    });

    resultsEl.addEventListener('click', function (e) {
        if (!e.target.closest('.site-search-result')) return;
        var instance = window.bootstrap && bootstrap.Modal.getInstance(modalEl);
        if (instance) instance.hide();
    });

    // "/" (outside a text field) or Cmd/Ctrl+K opens search from anywhere
    document.addEventListener('keydown', function (e) {
        var tag = document.activeElement && document.activeElement.tagName;
        var inField = tag === 'INPUT' || tag === 'TEXTAREA';
        var isSlash = e.key === '/' && !inField;
        var isCtrlK = (e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k';
        if ((isSlash || isCtrlK) && window.bootstrap) {
            e.preventDefault();
            bootstrap.Modal.getOrCreateInstance(modalEl).show();
        }
    });
})();
