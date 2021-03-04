'use strict';

const fs = require('fs');
const http = require('http');
const path = require('path');

const STATIC_PATH = path.join(process.cwd(), './static');
const API_PATH = './api/';

const MIME_TYPES = {
    html: 'text/html; charset=UTF-8',
    txt: 'text/plain; charset=UTF-8',
    xml: 'text/xml; charset=UTF-8',
    js: 'application/javascript; charset=UTF-8',
    css: 'text/css',
    png: 'image/png',
    ico: 'image/x-icon',
    json: 'application/json',
    svg: 'image/svg+xml',
};

const serveFile = name => {
    const filePath = path.join(STATIC_PATH, name);

    if (!filePath.startsWith(STATIC_PATH) || !fs.existsSync(filePath)) return null;
    return fs.createReadStream(filePath);
};

const HOSTNAME = process.env.HOSTNAME || '0.0.0.0';
const PORT = process.env.PORT || 8000;

const api = new Map();

const receiveArgs = async req => new Promise(resolve => {
    const body = [];
    req.on('data', chunk => {
        body.push(chunk);
    }).on('end', async () => {
        const data = body.join('');
        const args = JSON.parse(data);
        resolve(args);
    });
});

const cacheFile = name => {
    const filePath = API_PATH + name;

    if (!filePath.endsWith('.js')) return;
    const key = path.basename(filePath, '.js');

    try {
        const libPath = require.resolve(filePath);
        delete require.cache[libPath];
    } catch (e) {
        return;
    }
    try {
        const method = require(filePath);
        api.set(key, method);
    } catch (e) {
        api.delete(name);
    }
};

const cacheFolder = path => {
    fs.readdir(path, (err, files) => {
        if (err) return;
        files.forEach(cacheFile);
    });
};

const watch = path => {
    fs.watch(path, (event, file) => {
        cacheFile(file);
    });
};

cacheFolder(API_PATH);
watch(API_PATH);

const httpError = (res, status, message) => {
    res.statusCode = status;
    res.end(`"${message}"`);
};

function wrappAll(data) {
    return Promise.all(data.map(async element =>
        `<p style="margin-left: 2%">${element}</p>`
    ));
}

const handler = async (req, res) => {
    const url = req.url === '/' || req.url === '/index' ? '/index.html' : req.url;
    const [first, second] = url.substring(1).split('/');
    if (first === 'api') {
        const method = api.get(second);
        const args = await receiveArgs(req);
        try {
            const result = await method(...args);
            if (!result) {
                httpError(res, 500, 'Server error');
                return;
            }
            res.end(JSON.stringify(await wrappAll(result)));
        } catch (err) {
            console.dir({ err });
            httpError(res, 500, 'Server error');
        }
    } else if (first === 'getAllApi') {
        try {
            res.end(JSON.stringify(Array.from(api.keys())));
        } catch (err) {
            console.dir({ err });
            httpError(res, 500, 'Server error');
        }
    } else {
        const fileExt = path.extname(url).substring(1);
        try {
            res.writeHead(200, { 'Content-Type': MIME_TYPES[fileExt] });
            const stream = serveFile(url);
            if (stream) {
                stream.pipe(res);
            } else {
                throw Error('404 Not Found');
            }
        } catch (err) {
            console.dir({ err });
            const url = '/index.html';
            const fileExt = path.extname(url).substring(1);
            res.writeHead(200, { 'Content-Type': MIME_TYPES[fileExt] });
            const stream = serveFile(url);
            stream.pipe(res);
        }
    }
};

const server = http.createServer(handler);

server.listen(PORT, HOSTNAME, () => console.log(`Server running at http://${HOSTNAME}:${PORT}/`));

server.on('error', err => {
    if (err.code === 'EACCES') {
        console.log(`No access to port: ${PORT}`);
    } else {
        console.log(err);
    }
});
