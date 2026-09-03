// Cookie-consent banner (#cookie-consent-banner in cookie_consent.html)
// gating Google Analytics: the gtag.js script is only ever requested from
// Google after the visitor accepts, never on page load. The choice is
// remembered in localStorage so the banner only shows once per browser.
(function () {
    var STORAGE_KEY = 'cookie_consent';

    function getConsent() {
        try {
            return localStorage.getItem(STORAGE_KEY);
        } catch (e) {
            return null;
        }
    }

    function setConsent(value) {
        try {
            localStorage.setItem(STORAGE_KEY, value);
        } catch (e) {
            // storage unavailable (e.g. blocked in private mode) - the
            // banner will just show again on the next visit
        }
    }

    function clearConsent() {
        try {
            localStorage.removeItem(STORAGE_KEY);
        } catch (e) {
            // ignore
        }
    }

    function deleteGoogleAnalyticsCookies() {
        document.cookie.split(';').forEach(function (cookie) {
            var name = cookie.split('=')[0].trim();
            if (/^_ga/.test(name)) {
                document.cookie = name + '=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
            }
        });
    }

    function loadGoogleAnalytics(gaId) {
        if (!gaId || window.gaLoaded) return;
        window.gaLoaded = true;

        window.dataLayer = window.dataLayer || [];
        function gtag() { window.dataLayer.push(arguments); }
        window.gtag = gtag;
        gtag('js', new Date());
        gtag('config', gaId);

        var script = document.createElement('script');
        script.async = true;
        script.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(gaId);
        document.head.appendChild(script);
    }

    document.addEventListener('DOMContentLoaded', function () {
        var banner = document.getElementById('cookie-consent-banner');
        if (!banner) return;

        var gaId = banner.getAttribute('data-ga-id');
        var consent = getConsent();

        if (consent === 'accepted') {
            loadGoogleAnalytics(gaId);
        } else if (consent !== 'declined') {
            banner.hidden = false;
        }

        var acceptBtn = document.getElementById('cookie-consent-accept');
        var declineBtn = document.getElementById('cookie-consent-decline');
        var resetBtn = document.getElementById('cookie-consent-reset');

        if (acceptBtn) {
            acceptBtn.addEventListener('click', function () {
                setConsent('accepted');
                loadGoogleAnalytics(gaId);
                banner.hidden = true;
            });
        }
        if (declineBtn) {
            declineBtn.addEventListener('click', function () {
                setConsent('declined');
                deleteGoogleAnalyticsCookies();
                banner.hidden = true;
            });
        }
        // lets a visitor revisit their choice later, e.g. from the
        // privacy page - withdrawing consent must be as easy as giving it
        if (resetBtn) {
            resetBtn.addEventListener('click', function () {
                clearConsent();
                deleteGoogleAnalyticsCookies();
                window.gaLoaded = false;
                banner.hidden = false;
            });
        }
    });
})();
