$(function() {

    // $('.collapse').collapse('hide');
    $('.list-group-item.active').parent().parent('.collapse').collapse('show');


    var pages = new Bloodhound({
        datumTokenizer: Bloodhound.tokenizers.obj.whitespace('title'),
        // datumTokenizer: Bloodhound.tokenizers.whitespace,
        queryTokenizer: Bloodhound.tokenizers.whitespace,

        prefetch: baseurl + '/search.json'
    });

    $('#search-box').typeahead({
        minLength: 0,
        highlight: true
    }, {
        name: 'pages',
        display: 'title',
        source: pages
    });

    $('#search-box').bind('typeahead:select', function(ev, suggestion) {
        window.location.href = suggestion.url;
    });

    $("#hide").click(function(){
      $("p").hide();
    });

    $("#show").click(function(){
      $("p").show();
    });


    // Markdown plain out to bootstrap style
    $('#markdown-content-container table').addClass('table');
    $('#markdown-content-container img').addClass('img-responsive');


});

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
