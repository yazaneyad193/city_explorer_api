'use strict';
let weatherArray = [];
let parkArray = [];
const express = require('express');
require('dotenv').config();

const cors = require('cors');
const pg = require('pg');
const superagent = require('superagent');

const server = express();
server.use(cors());

const PORT = process.env.PORT || 3030;
const client = new pg.Client(process.env.DATABASE_URL);
//const client = new pg.Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });


server.get('/', (req, res) => {
    res.send('home route');
})


//Route Definitions
server.get('/location', locationHandler);
server.get('/weather', weatherHandler);
server.get('/movies', movieHandler);
server.get('/yelp', yelpHandler);
server.get('/parks', parksHandler);
function locationHandler(req, res) {
    let city = req.query.city;
    CheckDB(city)
        .then((result) => {
            //console.log(result);
            if (result.rowCount > 0) {
                //
                res.json(result.rows[0]);
            } else {
                callLocationAPI(req, res, city).then((data) => {
                    res.json(data);
                })
            }
        })
}
function CheckDB(city) {
    let save = [city];
    let SQL = `SELECT * FROM locations WHERE search_query=$1;`;
    return client.query(SQL, save)
        .then((resultFromDB) => {
            // console.log(resultFromDB);
            return resultFromDB;

        })
}

function callLocationAPI(req, res, city) {
    let locationToken = process.env.LOCATIONKEY;
    let url = `https://us1.locationiq.com/v1/search.php?key=${locationToken}&q=${city}&format=json`;
    return superagent.get(url)
        .then(data => {
            // console.log('inside callback function');
            const locationObject = new Location(city, data.body);
            res.json(locationObject);

            let insertSQL = `INSERT INTO locations (search_query,formatted_query, latitude, longitude) VALUES ($1,$2,$3,$4) RETURNING *;`;
            let safeValues = [locationObject.search_query, locationObject.formatted_query, locationObject.latitude, locationObject.longitude];
            return client.query(insertSQL, safeValues)
                .then((dataFromDba) => {
                    console.log(dataFromDba.rows);
                    return dataFromDba.rows;
                    //res.json(dataFromDba.rows);
                    // console.log('your data has been added successfully!!');
                });
            // return locationObject;
        });
}

function Location(city, geoData) {
    this.search_query = city;
    this.formatted_query = geoData[0].display_name;
    this.latitude = geoData[0].lat;
    this.longitude = geoData[0].lon;


}

///////////////////
//////Movie///////
/////////////////
function movieHandler(req, res) {
    let cityName = req.query.search_query;
    let moviesKey = process.env.MOVIE_API_KEY;
    let url = `https://api.themoviedb.org/3/search/movie?api_key=${moviesKey}&query=${cityName}`;
    //https://api.themoviedb.org/3/search/movie?api_key=a7c9b8d5803b63186149521fff679fbe&language=en-US&query=cat&page=1&include_adult=false

    superagent.get(url)
        .then(movieResults => {
            //console.log(movieResults.body.results);
            let movieObjects = movieResults.body.results.map(m => {
                let movie = new Movie(m);
                return movie;
            });
            res.status(200).json(movieObjects);
        })
    // .catch(() => {
    //     errorHandler('Movies .. Something went wrong!!', req, res);
    // });
}


function Movie(movieData) {
    this.title = movieData.title;
    this.overview = movieData.overview;
    this.average_votes = movieData.vote_average;
    this.total_votes = movieData.vote_count;
    this.image_url = `https://image.tmdb.org/t/p/w500/${movieData.poster_path}`;
    this.popularity = movieData.popularity;
    this.released_on = movieData.release_date;
}
//////////////
////Yelp/////
////////////

function yelpHandler(req, res) {
    let cityName = req.query.search_query;
    let page = req.query.page;
    let lat = req.query.latitude;
    let lon = req.query.longitude;
    const numberPerPages = 5;
    let start = ((page - 1) * numberPerPages + 1);
    let url = `https://api.yelp.com/v3/businesses/search?term="restaurants"&latitude="${lat}"&longitude=${lon}&limit=5&offset=${start}`;
    let yelpKey = process.env.YELP_API_KEY;

    return superagent.get(url)
        .set('Authorization', `Bearer ${yelpKey}`)
        .then(yelpData => {
            //console.log('sssssssssss' + yelpData);
            let yelpObjects = yelpData.body.businesses.map(y => {
                let yelp = new Yelp(y);
                return yelp;
            });
            res.status(200).json(yelpObjects);
        })
    // .catch(() => {
    //     errorHandler('Movies .. Something went wrong!!', req, res);
    // });
}
function Yelp(yelpData) {
    this.name = yelpData.name;
    this.image_url = yelpData.image_url;
    this.price = yelpData.price;
    this.rating = yelpData.rating;
    this.url = yelpData.url;
}

function parksHandler(request, response) {
    const parkCode = request.query.latitude + ',' + request.query.longitude;
    // const parkCode = request.query.search_query;
    // console.log(request.query);
    // console.log(parkCode);
    getPark(parkCode)
        .then(parkData => {
            // console.log(parkData)
            response.status(200).json(parkData);
        })
}

function getPark(parkCode) {
    let key = process.env.PARKS_API_KEY;
    //https://developer.nps.gov/api/v1/parks?parkCode=acad&api_key=hyovLCymxl3JZWFhTo2LmY1Sqhmah882h1gZYgH2
    let url = `https://developer.nps.gov/api/v1/parks?parkCode=${parkCode}&api_key=${key}&format=json`;
    return superagent.get(url)
        .then(locData => {
            // const locationData = new Location(city, locData.body[0]);
            // return locationData;
            // console.log(locData);
            let parkArray = locData.body.data.map((element, idx) => {
                // console.log(element)
                const parkData = new park(element);
                return parkData;
            });
            return parkArray;
        })

}
function park(geoData) {

    this.name = geoData.fullName;
    this.address = geoData.addresses[0].city;
    this.fee = geoData.fees;
    this.description = geoData.description;
    this.url = geoData.url;

    parkArray.push(this);
}
function weatherHandler(request, response) {
    const city = request.query.search_query;
    getWeather(city)
        .then(weatherData => {
            // console.log(weatherData)
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
});

client.connect()
    .then(() => {
        server.listen(PORT, () =>
            console.log(`listening on ${PORT}`)
        );
    });