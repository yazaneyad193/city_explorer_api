'use strict';
let weatherArray = [];
const express = require('express');
require('dotenv').config();

const cors = require('cors');

const server = express();
server.use(cors());

const PORT = process.env.PORT || 3000;

server.get('/', (req, res) => {
    res.send('home route');
})

// location route
// localhost:3000/location
server.get('/location', (req, res) => {
    const locData = require('./data/location.json');
    const locObj = new Location(locData);
    //console.log(locObj)
    res.send(locObj);
})

function Location(geoData) {
    this.search_query = 'Lynnwood';
    this.formatted_query = geoData[0].display_name;
    this.latitude = geoData[0].lat;
    this.longitude = geoData[0].lon;

}

server.get('/weather', (req, res) => {

    const weatherData = require('./data/weather.json')
    weatherData.data.forEach(element => {
        const locObj = new Weather(element);


    });
    res.send(weatherArray);

})

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