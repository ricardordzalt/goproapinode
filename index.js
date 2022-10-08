const axios = require('axios');
const express = require('express');
const { JSDOM } = require('jsdom');
const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true, insecureHTTPParser: true, }));
let counterPhoto = 462;
let isPhotoMode = true;

app.get('/goprohero4/shot', async (req, res) => {
    try {
        if (isPhotoMode) {
            counterPhoto++;
        }
        const { data } = await axios.get('http://10.5.5.9/gp/gpControl/command/shutter?p=1');
        console.log("data", data);
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

app.get('/goprohero4/mode/video', async (req, res) => {
    try {
        isPhotoMode = false;
        const { data } = await axios.get('http://10.5.5.9/gp/gpControl/command/mode?p=0');
        console.log("data", data);
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
        console.log("data", data);
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
        console.log("err", error)
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
        const links = document?.getElementsByTagName("a");
        const photo = [...links]?.find(link => {
            const rawLink = link?.getAttribute?.("href");
            const isLastPhoto = rawLink.replace(".JPG", "").endsWith(`${counterPhoto}`);
            return isLastPhoto;
        })?.getAttribute?.("href");
        if (photo) {
            const blob = await fetch(`http://10.5.5.9/videos/DCIM/100GOPRO/${photo}`);
            const photoResponse = await blob.blob();
            const URLBlob = URL.createObjectURL(photoResponse);
            return res.sendFile(URLBlob);
        }
        return res.json({
            status: 404,
        });
    } catch (error) {
        console.log("err", error)
        return res.status(500).json({
            error,
        });
    };
});

app.get('/goprohero4/photos/all', async (req, res) => {
    try {
        const { data } = await axios.get('http://10.5.5.9/videos/DCIM/100GOPRO/');
        const dom = new JSDOM(data);
        const { document } = dom?.window;
        const links = document?.getElementsByTagName("a");
        const urls = [...links]?.reduce((acc, value) => (["?order=N", "?order=s"].includes(value?.getAttribute?.("href")) ? acc : [...acc, value?.getAttribute?.("href")]), [])
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

app.listen(port, () => {
    console.log('listening on port ' + port);
});