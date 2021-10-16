let express = require('express');
let logger = require('morgan');
let routes = require('./routes.js')

let app = express();

app.use(logger('dev'));

app.set('view engine', 'hbs');

app.get('/', routes.index);

app.get('/api', routes.apiIndex);

//Rakendusekeskuse teekonnad
// 0-9ni voivad numbrid olla ja teda 1,9 voib korduda kuni 9 korda
// app.get('/api/users/:id([0-9]{1,9})?', routes.usersByID);
// app.get('/api/users/:username?', routes.users);

app.get('/api/users/:id?', routes.users);

app.get('/api/frontpage/', routes.frontpage);
app.get('/api/profile/:id', routes.profilePage);
app.get('/api/posts/:id', routes.postDetails);
app.get('/api/stats/', routes.statistics);
app.get('/api/stats/top10/followedusers', routes.top10followedUsers);
app.get('/api/stats/registrations/', routes.userRegistrations);
app.get('/api/stats/genderdivison/', routes.genderDivision);

app.get('*', routes.default);


let server = app.listen(3000, function(){
    console.log('Listening on port 3000');
});