import https from 'node:https';
import fs from 'node:fs';

const url = 'https://actions.google.com/sounds/v1/alarms/alarm_clock_ticking.ogg';
const file = fs.createWriteStream('./public/timer.ogg');

https.get(url, (response) => {
    response.pipe(file);
    file.on('finish', () => {
        file.close();
        console.log('Download complete.');
    });
}).on('error', (err) => {
    fs.unlink('./public/timer.ogg', () => { });
    console.error('Error:', err.message);
});
