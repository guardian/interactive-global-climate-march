import iframeMessenger from 'guardian/iframe-messenger'
import reqwest from 'reqwest'
import doT from 'olado/doT'
import share from './lib/share'
import madlib from './lib/madlib'
import geocode from './lib/geocode'

import eventsHTML from './text/events.html!text'

var eventsTemplateFn = doT.template(eventsHTML);

function init(el) {
    iframeMessenger.enableAutoResize();

    var eventsEl = el.querySelector('.js-events');

    function getEvents(lat, lng) {
        reqwest({
            'url': `https://secure.avaaz.org/act/events.php?resource=event&action=getAllNearbyEvents&calendar_id=3&partners[]=350.org&partners[]=WordPress&unit=km&lat=${lat}&lng=${lng}&limit=10`,
            'type': 'json',
            'crossOrigin': true
        }).then(resp => {
            console.log(resp);
            eventsEl.innerHTML = eventsHTML(resp);
        });
    }

    madlib(el.querySelector('.js-location'), loc => {
        geocode(loc, (err, resp) => {
            if (!err) {
                var center = resp.features[0].center;
                getEvents(center[1], center[0]);
            }
        });
    });

    if ('geolocation' in navigator) {
        let userLocationEl = el.querySelector('.js-gps');
        userLocationEl.style.display = 'block';
        userLocationEl.addEventListener('click', () => {
            userLocationEl.removeAttribute('data-has-error');
            userLocationEl.setAttribute('data-is-loading', '');

            navigator.geolocation.getCurrentPosition(function (position) {
                getEvents(position.coords.latitude, position.coords.longitude);
                userLocationEl.removeAttribute('data-is-loading');
            }, function (err) {
                console.log(err);
                userLocationEl.removeAttribute('data-is-loading');
                userLocationEl.addAttribute('data-has-error', '');
            });

            userLocationEl.blur();
        });
    }
}

init(document.body);
