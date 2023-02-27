const { response } = require('express');
const express = require('express');
const { render } = require('pug');
const getData = require('./get_data');

let app = express();

app.use(express.static('public'));
app.use(express.urlencoded({extended: false}));
app.use(express.json());

app.set('view engine', 'pug');

app.get('/', (req, res) => { 
    let code = '1234';
    if (!req.query.login) {
        res.render('login');
        return;
    }

    let password = req.query.login.toLowerCase();
    console.log(password);
    if (password == code) res.render('home');
    else res.render('login'); 
});

app.get('/getPlaylist', (req, res) => { getData.getPlaylist(res); });

app.set('port', process.env.PORT || 7100);  

app.listen(app.get('port'), () => {
    console.log(`Listening on port ${app.get('port')}.`);
});