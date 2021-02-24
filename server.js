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
server.get('/parks', parksHandler);




///////////////////
//////Movie///////
/////////////////
function movieHandler(req, res) {
    let cityName = req.query.search_query;
    let moviesKey = process.env.MOVIE_API_KEY;
    let url = `https://api.themoviedb.org/3/movie/550?api_key=${moviesKey}&query=${cityName}`;
    //https://api.themoviedb.org/3/movie/550?api_key=a7c9b8d5803b63186149521fff679fbe&query=${cityName}
    superagent.get(url)
        .then(movieResults => {
            console.log(movieResults.body.results);
            let movieObjects = movieResults.body.results.map(m => {
                let movie = new Movie(m);
                return movie;
            });
            res.status(200).json(movieObjects);
        })
        .catch(() => {
            errorHandler('Movies .. Something went wrong!!', req, res);
        });
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




//Functions
function locationHandler(req, res) {
    let city = req.query.city;
    getLocation(req, res, city)
        .then(locationData => {
            res.status(200).json(locationData);
        })
}
function getLocation(req, res, city) {
    // let key = process.env.LOCATIONKEY;
    // let url = `https://eu1.locationiq.com/v1/search.php?key=${key}&q=${city}&format=json`;
    // return superagent.get(url)
    //     .then(locData => {
    //         const locationData = new Location(city, locData.body[0]);
    //         return locationData;
    //     })
    // .catch(() => {
    //     errorHandler('Error in getting data from locationiq', req, res)
    // })


    //let cityName = req.query.city;
    // let locationToken = process.env.GEO_API_KEY;
    // let url = `https://us1.locationiq.com/v1/search.php?key=${locationToken}&q=${city}&format=json`;
    let save = [city];
    let SQL = `SELECT * FROM locations WHERE search_query = '$1'`;

    return client.query(SQL, save)
        .then(result => {
            if (result.rowCount !== 0) {
                console.log(result);
                res.status(200).json(result.rows[0]);
            } else {
                console.log('inside else');
                callLocationAPI(req, res, city)
                    .then(locData => {

                        res.status(200).json(locData);
                    });
                console.log('after callback function');
            }
        })

    // .catch(error => errorHandler(error, req, res));
}

function callLocationAPI(req, res, city) {
    let locationToken = process.env.LOCATIONKEY;
    let url = `https://us1.locationiq.com/v1/search.php?key=${locationToken}&q=${city}&format=json`;
    return superagent.get(url)
        .then(data => {
            console.log('inside callback function');
            const locationObject = new Location(cityName, data.body);
            let insertSQL = `INSERT INTO locations (search_query,formatted_query, latitude, longitude) VALUES ($1,$2,$3,$4) RETURNING *;`;
            let safeValues = [locationObject.search_query, locationObject.formatted_query, locationObject.latitude, locationObject.longitude];
            client.query(insertSQL, safeValues)
                .then(() => {
                    res.status(200).json(data);
                    console.log('your data has been added successfully!!');
                });
            //return locationObject;
        });
}

/// localhost:3000/addMember?first=lina&last=mashayekh
// server.get('/location', (req, res) => {
//     //console.log(req.query);

//     let searchQuery = req.query.city;
//     console.log(searchQuery);
//     const URL = `https://maps.googleapis.com/maps/api/geocode/json?address=${searchQuery}&key=${process.env.GEOCODE_API_KEY}`;

//     superagent.get(URL)
//         .then(superagentResults => {
//             let locationData = superagentResults.body.results[0];
//             const location = new Location(searchQuery, locationData);
//             latitude = location.latitude;
//             longitude = location.longitude;
//             response.status(200).send(location);
//         })
//         .catch(error => {
//             handleError(error, res);
//         })
//     // let firstName = req.query.first;
//     // let lastName = req.query.last;
//     // let SQL = `INSERT INTO people VALUES ($1,$2) RETURNING *;`;
//     // let safeValues = [firstName, lastName];
//     // client.query(SQL, safeValues)
//     //     .then((result) => {
//     //         res.send(result.rows);
//     //         // res.send('data has been inserted!!');
//     //     })
//     //     .catch((error) => {
//     //         res.send('eeeeeeeeeeee', error.message)
//     //     })

// })
function Location(city, geoData) {
    this.search_query = city;
    this.formatted_query = geoData[0].display_name;
    this.latitude = geoData[0].lat;
    this.longitude = geoData[0].lon;


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


//Parks Here
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



server.use('*', (req, res) => {
    res.status(404).send('route not found')
})

function handleError(err, res) {
    console.log(err);
    if (res) res.status(500).send('Something Error');
}
// server.listen(PORT, () => {
//     console.log(`Listening on PORT ${PORT}`);
// })

client.connect()
    .then(() => {
        server.listen(PORT, () =>
            console.log(`listening on ${PORT}`)
        );
    })
    // .catch((error) => {
    //     res.send('cccccccccccc', error.message)
    // })