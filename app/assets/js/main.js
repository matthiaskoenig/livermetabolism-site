// generic tag-filter bar: any `.tag-filter` wires its `.tag-filter-btn`
// buttons to show/hide the matching items (by `data-tags`) inside the
// element named by its `data-filter-target`; used by news/projects/
// research/publications, each pointing at its own grid or table
(function () {
    document.querySelectorAll('.tag-filter[data-filter-target]').forEach(function (filterBar) {
        var target = document.getElementById(filterBar.getAttribute('data-filter-target'));
        if (!target) return;

        var buttons = filterBar.querySelectorAll('.tag-filter-btn');
        var items = target.querySelectorAll('[data-tags]');
        var yearGroups = target.querySelectorAll('.pub-year-group');

        function updateYearGroups() {
            yearGroups.forEach(function (group) {
                var visible = group.querySelectorAll('[data-tags]:not([style*="display: none"])').length;
                group.style.display = visible > 0 ? '' : 'none';
            });
        }

        buttons.forEach(function (btn) {
            btn.addEventListener('click', function () {
                buttons.forEach(function (b) { b.classList.remove('active'); });
                btn.classList.add('active');

                var tag = btn.getAttribute('data-tag');
                items.forEach(function (item) {
                    if (tag === 'all') {
                        item.style.display = '';
                        return;
                    }
                    var tags = (item.getAttribute('data-tags') || '').split('|');
                    item.style.display = tags.indexOf(tag) !== -1 ? '' : 'none';
                });
                updateYearGroups();
            });
        });
    });
})();

// hover/focus/click info card for person thumbnails (.person-avatar /
// .person-card), shared by the homepage people-strip and the alumni
// timeline on the Team page
(function () {
    var avatars = document.querySelectorAll('.person-avatar');
    if (!avatars.length) return;

    function getCard(avatar) {
        return avatar.querySelector('.person-card');
    }

    function closeCard(avatar) {
        var card = getCard(avatar);
        if (!card) return;
        card.classList.remove('is-visible');
        card.style.transform = '';
        card.style.removeProperty('--arrow-shift');
    }

    function closeAll(except) {
        avatars.forEach(function (avatar) {
            if (avatar !== except) closeCard(avatar);
        });
    }

    // keep the card fully within the visible viewport by shifting it
    // horizontally off its default centered position when it would
    // otherwise overflow the left or right edge
    function positionCard(card) {
        var margin = 8;
        card.style.transform = 'translateX(-50%)';
        var rect = card.getBoundingClientRect();
        var shift = 0;
        if (rect.left < margin) {
            shift = margin - rect.left;
        } else if (rect.right > window.innerWidth - margin) {
            shift = (window.innerWidth - margin) - rect.right;
        }
        if (shift !== 0) {
            card.style.transform = 'translateX(calc(-50% + ' + shift + 'px))';
            card.style.setProperty('--arrow-shift', (-shift) + 'px');
        }
    }

    function openCard(avatar) {
        closeAll(avatar);
        var card = getCard(avatar);
        if (!card) return;
        card.classList.add('is-visible');
        positionCard(card);
    }

    avatars.forEach(function (avatar) {
        avatar.addEventListener('mouseenter', function () { openCard(avatar); });
        avatar.addEventListener('mouseleave', function () { closeCard(avatar); });
        avatar.addEventListener('focus', function () { openCard(avatar); });
        avatar.addEventListener('blur', function () { closeCard(avatar); });
        avatar.addEventListener('click', function () {
            var card = getCard(avatar);
            var wasOpen = card && card.classList.contains('is-visible');
            closeAll();
            if (!wasOpen) openCard(avatar);
        });
    });

    document.addEventListener('click', function (e) {
        if (!e.target.closest('.person-avatar')) {
            closeAll();
        }
    });
})();
