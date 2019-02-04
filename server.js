const express    = require('express');
const Promise    = require('bluebird');
const hbs        = require('hbs');
const fs         = Promise.promisifyAll(require('fs'));
const path       = require('path');
const bodyParser = require('body-parser');
const api_routes = require('./routes/api_routes');
const morgan     = require('morgan');

const PORT       = process.env.PORT || 3000;
const app        = express();
const api        = express();

hbs.registerPartials(__dirname + '/partials');
hbs.registerHelper('currentYear', function (){
    return new Date().getFullYear();
});

app.set('view engine', 'hbs');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, '/public')));
app.use(morgan('combined'));
// app.use((req, res, next) => {
//     var now = new Date().toString();
//     var log = `${now}: ${req.method} ${req.url}\n`;
//     fs.appendFileAsync('log.txt', log)
//     .then(()=>{
//         console.log(log);
//     })
//     next();
// });

app.listen(PORT, ()=>{
    console.log(`Listening on port ${PORT}...`);
});

// API Endpoints
app.use('/api', api);
api.use(api_routes);