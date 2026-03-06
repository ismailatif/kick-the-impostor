import fs from 'node:fs';
import https from 'node:https';

const downloadFile = (url, path) => {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(path);
        https.get(url, (response) => {
            response.pipe(file);
            file.on('finish', () => {
                file.close(resolve);
            });
        }).on('error', (err) => {
            fs.unlink(path, () => { });
            reject(err);
        });
    });
};

const run = async () => {
    try {
        // We'll use very lightweight, safe Google Action ambient sounds as they are CC0 and reliable.
        // Lobby music: a gentle ambient sound
        await downloadFile('https://actions.google.com/sounds/v1/water/waves_crashing_on_rock_beach.ogg', './public/lobby.ogg');
        // Suspense music: tension ambient/drone
        await downloadFile('https://actions.google.com/sounds/v1/science_fiction/scifi_drone_sub_bass.ogg', './public/suspense.ogg');
        console.log('BGM Tracks Downloaded.');
    } catch (e) {
        console.error('Download failed', e);
    }
};

run();
