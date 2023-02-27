const fs = require('fs');

function getPlaylist(response) {
    let playlist = [];
    fs.readdirSync('./public/audio').forEach(file => {
        playlist.push(`./audio/${file}`);
    });
    response.send(playlist);
}

module.exports = { getPlaylist };