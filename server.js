'use strict';
let weatherArray = [];
const express = require('express');
require('dotenv').config();

const cors = require('cors');
const superagent = require('superagent');

const server = express();
server.use(cors());

const PORT = process.env.PORT || 3000;

server.get('/', (req, res) => {
    res.send('home route');
})


//Route Definitions
server.get('/location', locationHandler);
server.get('/weather', weatherHandler);

//Functions
function locationHandler(request, response) {
    const city = request.query.city;
    getLocation(city)
        .then(locationData => {
            response.status(200).json(locationData);
        })
}
function getLocation(city) {
    let key = process.env.LOCATIONKEY;
    let url = `https://eu1.locationiq.com/v1/search.php?key=${key}&q=${city}&format=json`;
    return superagent.get(url)
        .then(locData => {
            const locationData = new Location(city, locData.body[0]);
            return locationData;
        })
        .catch(() => {
            errorHandler('Error in getting data from locationiq', req, res)
        })
}


function Location(city, geoData) {
    this.search_query = city;
    this.formatted_query = geoData.display_name;
    this.latitude = geoData.lat;
    this.longitude = geoData.lon;

}
function weatherHandler(request, response) {
    const city = request.query.search_query;
    getWeather(city)
        .then(weatherData => {
            console.log(weatherData)
            response.status(200).json(weatherData);
        })
}
function getWeather(city) {
    let key = process.env.WEATHERKEY;
    //https://api.weatherbit.io/v2.0/forecast/daily?city=${city},NC&key=${key}&format=json
    //https://api.weatherbit.io/v2.0/forecast/daily?city=Raleigh,NC&key=API_KEY

    let url = `https://api.weatherbit.io/v2.0/forecast/daily?city=${city}&key=${key}&format=json`;
    return superagent.get(url)
        .then(locData => {
            // const locationData = new Location(city, locData.body[0]);
            // return locationData;
            // console.log(locData);
            let weatherArray = locData.body.data.map((element, idx) => {
                // console.log(element)
                const weatherData = new Weather(element);
                return weatherData;
            });
            return weatherArray;
        })

}


function Weather(geoData) {

    this.forecast = geoData.weather.description;
    this.time = geoData.valid_date;
    weatherArray.push(this);
}

server.use('*', (req, res) => {
    res.status(404).send('route not found')
})

function handleError(err, res) {
    console.log(error);
    if (res) res.status(500).send('Something Error');
}
server.listen(PORT, () => {
    console.log(`Listening on PORT ${PORT}`);
})