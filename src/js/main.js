import iframeMessenger from 'guardian/iframe-messenger'
import reqwest from 'reqwest'
import doT from 'olado/doT'
import share from './lib/share'
import madlib from './lib/madlib'
import geocode from './lib/geocode'

import eventsHTML from './text/events.html!text'

var eventsTemplateFn = doT.template(eventsHTML);

const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

function init(el) {
    iframeMessenger.enableAutoResize();

    var eventsEl = el.querySelector('.js-events');

    function getEvents(lat, lng) {
        reqwest({
            'url': `https://secure.avaaz.org/act/events.php?resource=event&action=getAllNearbyEvents&calendar_id=3&partners[]=350.org&partners[]=WordPress&unit=km&lat=${lat}&lng=${lng}&limit=10`,
            'type': 'jsonp',
            'jsonpCallback': 'jsonp',
            'crossOrigin': true
        }).then(resp => {
            var urls = resp.events.map(e => e.rsvp_url);
            var events = resp.events.filter((e, i) => urls.indexOf(e.rsvp_url) === i);
            events.forEach(evt => {
                if (evt.event_date) {
                    let [year, month, day] = evt.event_date.split('-');
                    let date = new Date(year, month - 1, day);
                    evt.event_date = days[date.getDay()] + ' ' + day + ' ' + months[month - 1];
                }

                if (evt.start_time) {
                    let [hours, mins, secs] = evt.start_time.split(':');
                    evt.start_time = hours + ':' + mins;
                }

                evt.desc = [[evt.event_date, evt.start_time].filter(s=>s).join(' '), evt.city].filter(s => s).join(', ');
            });
            eventsEl.innerHTML = eventsTemplateFn({events});
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
                userLocationEl.setAttribute('data-has-error', '');
            });

            userLocationEl.blur();
        });
    }
}

init(document.body);
