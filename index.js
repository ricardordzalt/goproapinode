const axios = require('axios');
const express = require('express');
const path = require('path');
const fs = require('fs').promises;
const { JSDOM } = require('jsdom');
const app = express();
const port = process.env.PORT || 3000;
app.use(express.json());
app.use(express.urlencoded({ extended: true, insecureHTTPParser: true, }));
app.use(express.static(path.join(__dirname, 'public')));

let counterPhoto = 462;
let isPhotoMode = true;

const getUrlsElementFromDocument = (document) => {
    const links = document?.getElementsByTagName("a");
//  (["?order=N", "?order=s"].includes(value?.getAttribute?.("href")) ? acc : [...acc, value?.getAttribute?.("href")])
    let urls = [];
    for(let i=0;i<links?.length;i++){
        const value = links[i];
        if(!["?order=N", "?order=s"].includes(value?.getAttribute?.("href"))){
            urls.push(value);
        };
    };
    return urls;
};

app.get('/goprohero4/shot', async (req, res) => {
    try {
        if (isPhotoMode) {
            counterPhoto++;
        }
        const { data } = await axios.get('http://10.5.5.9/gp/gpControl/command/shutter?p=1');
        return res.json({
            status: 200,
            data,
        });
    } catch (error) {
        return res.status(500).json({
            error,
        });
    };
});

app.get('/goprohero4/mode/video', async (req, res) => {
    try {
        isPhotoMode = false;
        const { data } = await axios.get('http://10.5.5.9/gp/gpControl/command/mode?p=0');
        return res.json({
            status: 200,
            data,
        });
    } catch (error) {
        console.log("err", error)
        return res.status(500).json({
            error,
        });
    };
});

app.get('/goprohero4/mode/photo', async (req, res) => {
    try {
        isPhotoMode = true;
        const { data } = await axios.get('http://10.5.5.9/gp/gpControl/command/mode?p=1');
        return res.json({
            status: 200,
            data,
        });
    } catch (error) {
        console.log("err", error)
        return res.status(500).json({
            error,
        });
    };
});

app.get('/goprohero4/files', async (req, res) => {
    try {
        const { data } = await axios.get('http://10.5.5.9/videos/DCIM/100GOPRO/');
        return res.json({
            status: 200,
            data,
        });
    } catch (error) {
        return res.status(500).json({
            error,
        });
    };
});

app.get('/goprohero4/photos/last', async (req, res) => {
    try {
        const { data } = await axios.get('http://10.5.5.9/videos/DCIM/100GOPRO/');
        const dom = new JSDOM(data);
        const { document } = dom?.window;
        const urls = getUrlsElementFromDocument(document);
        const _photos = urls?.sort((a, b) => {
            return a?.getAttribute?.("href") > b?.getAttribute?.("href") ? -1 : 1;
        });
        const photo = _photos?.find(url => {
            const isLastPhoto = url?.getAttribute?.("href")?.endsWith('.JPG');
            return isLastPhoto;
        })?.getAttribute?.("href");
        console.log(photo);
        if (photo) {
            const photoRes = await fetch(`http://10.5.5.9/videos/DCIM/100GOPRO/${photo}`);
            const photoBlob = await photoRes.blob();
            const photoBuffer = Buffer.from(await photoBlob.arrayBuffer());
            await fs.writeFile(__dirname+'/public/photo.jpg', photoBuffer);
            return res.sendFile(__dirname+`/public/photo.jpg`);
        }
        return res.json({
            status: 404,
        });
    } catch (error) {
        console.log("error", error)
        return res.status(500).json({
            error,
        });
    };
});

app.get('/goprohero4/photos/all', async (req, res) => {
    try {
        const {path='videos/DCIM/100GOPRO/'} = req.query;
        const { data } = await axios.get(`http://10.5.5.9/${path}/`);
        const dom = new JSDOM(data);
        const { document } = dom?.window;
        const urls = getUrlsElementFromDocument(document).map(url => url?.getAttribute?.("href"));
        return res.json({
            status: 200,
            data,
            urls,
        });
    } catch (error) {
        console.log("error", error);
        return res.status(500).json({
            error,
        });
    };
});

app.listen(port, () => {
    console.log('listening on port ' + port);
});