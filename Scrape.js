// import bypass from './captcha/captchaBypasser.js';

// import {createRequire} from "module";
// const require = createRequire(import.meta.url);

const puppeteer = require('puppeteer-extra');
// const hidden = require('puppeteer-extra-plugin-stealth')
const {executablePath} = require('puppeteer')
const url =
  "https://www.eventbrite.com/d/tx--college-station/all-events/";
  
  
async function StartScraping() {
    await puppeteer
    .launch({
        headless: false,
        ignoreHTTPSErrors: true,
        executablePath: executablePath(),
    })
    .then(async (browser) => {
        const page = await browser.newPage();

        await page.setViewport({
            width: 1366,
            height: 768,
        });

        page.on("response", async (response) => {
            if (response.url().includes("?event_ids")){
                const json = await response.json() 
                const events = json.events
                var eventObjs = [{}]
                for (let i = 0; i < events.length; i++) {
                    var event = json.events[i]
                    var model = { 
                        id: "",
                        imageURL: "",
                        title: "",
                        description: "",
                        longitude: 0.0,
                        latitude: 0.0,
                        geoHash: "",
                        locationName: "",
                        startsAt: 0,
                        endsAt: 0,
                        type: "",
                        colors: [{r: 0, g: 0, b: 0}],
                        hostId: "",
                        isSoldOut: false,
                        ticketURL: "",
                        minPrice: 0,
                        maxPrice: 0,
                        hostImageURL: "",
                    }

                    var eventType = ""
                    if (event.ticket_availability.is_free){
                        eventType = "free"
                    }else{
                        eventType = "paid"
                    }
                    console.log(event)

                    model.id = event.eventbrite_event_id
                    model.imageURL = event.image.url
                    model.title = event.name
                    model.description = event.summary
                    model.latitude = Number(event.primary_venue.address.latitude)
                    model.longitude = Number(event.primary_venue.address.longitude)
                    model.geoHash = encode(event.primary_venue.address.latitude, event.primary_venue.address.longitude, 4)
                    model.locationName = event.primary_venue.address.city + ", " + event.primary_venue.address.region
                    model.startsAt = Date.parse(event.start_date + " " + event.start_time)
                    model.endsAt = Date.parse(event.end_date + " " + event.end_time)
                    model.type = eventType
                    model.colors = [{r: 1, g: 0.647, b: 0}, {r: 1, g: 0.647, b: 0}, {r: 1, g: 0.647, b: 0}]
                    model.hostId = "EB" + event.primary_organizer.id
                    model.isSoldOut = event.ticket_availability.is_sold_out
                    model.minPrice = Number(event.ticket_availability.minimum_ticket_price.major_value)
                    model.maxPrice = Number(event.ticket_availability.maximum_ticket_price.major_value)
                    model.ticketURL = event.tickets_url
                    eventObjs[i] = model

                }
                console.log(eventObjs)
            }
        });
        
        await page.goto(url, {
        waitUntil: "load",
        timeout: 0,
      });

    });
}

StartScraping()

///Creates geohash from cordinates
function encode(latitude, longitude, numberOfChars) {
    var BASE32_CODES = "0123456789bcdefghjkmnpqrstuvwxyz";
    var BASE32_CODES_DICT = {};
    for (var i = 0; i < BASE32_CODES.length; i++) {
    BASE32_CODES_DICT[BASE32_CODES.charAt(i)] = i;
    }

    var MIN_LAT = -90;
    var MAX_LAT = 90;
    var MIN_LON = -180;
    var MAX_LON = 180;

    if (numberOfChars === 'auto') {
      if (typeof(latitude) === 'number' || typeof(longitude) === 'number') {
        throw new Error('string notation required for auto precision.');
      }
      var decSigFigsLat = latitude.split('.')[1].length;
      var decSigFigsLong = longitude.split('.')[1].length;
      var numberOfSigFigs = Math.max(decSigFigsLat, decSigFigsLong);
      numberOfChars = SIGFIG_HASH_LENGTH[numberOfSigFigs];
    } else if (numberOfChars === undefined) {
      numberOfChars = 9;
    }
  
    var chars = [],
    bits = 0,
    bitsTotal = 0,
    hash_value = 0,
    maxLat = MAX_LAT,
    minLat = MIN_LAT,
    maxLon = MAX_LON,
    minLon = MIN_LON,
    mid;
    while (chars.length < numberOfChars) {
      if (bitsTotal % 2 === 0) {
        mid = (maxLon + minLon) / 2;
        if (longitude > mid) {
          hash_value = (hash_value << 1) + 1;
          minLon = mid;
        } else {
          hash_value = (hash_value << 1) + 0;
          maxLon = mid;
        }
      } else {
        mid = (maxLat + minLat) / 2;
        if (latitude > mid) {
          hash_value = (hash_value << 1) + 1;
          minLat = mid;
        } else {
          hash_value = (hash_value << 1) + 0;
          maxLat = mid;
        }
      }
  
      bits++;
      bitsTotal++;
      if (bits === 5) {
        var code = BASE32_CODES[hash_value];
        chars.push(code);
        bits = 0;
        hash_value = 0;
      }
    }
    return chars.join('');
  };
  