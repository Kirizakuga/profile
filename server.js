const http = require('http');
const fs = require('fs');
const path = require('path');
const WebSocket = require('ws');
const chokidar = require('chokidar');
require('dotenv').config();
const PORT = 8000;

const server = http.createServer((req, res) => {
  if (req.url === '/api/wakatime/stats' && req.method === 'GET') {
    const apiKey = process.env.WAKATIME_API_KEY;
    if (!apiKey) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'WakaTime API key not configured' }));
      return;
    }

    const auth = Buffer.from(apiKey).toString('base64');
    const https = require('https');
    
    const options = {
      hostname: 'wakatime.com',
      path: '/api/v1/users/current/stats/last_7_days',
      method: 'GET',
      headers: {
        'Authorization': `Basic ${auth}`
      }
    };

    const wakaRequest = https.request(options, (wakaRes) => {
      let data = '';
      
      wakaRes.on('data', (chunk) => {
        data += chunk;
      });
      
      wakaRes.on('end', () => {
        res.writeHead(wakaRes.statusCode, { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        });
        res.end(data);
      });
    });

    wakaRequest.on('error', (error) => {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: error.message }));
    });

    wakaRequest.end();
    return;
  }

  if (req.url === '/api/github/contributions' && req.method === 'GET') {
    const username = 'Kirizakuga';
    const https = require('https');
    
    const options = {
      hostname: 'github-contributions-api.jogruber.de',
      path: `/v4/${username}`,
      method: 'GET'
    };

    const githubRequest = https.request(options, (githubRes) => {
      let data = '';
      
      githubRes.on('data', (chunk) => {
        data += chunk;
      });
      
      githubRes.on('end', () => {
        res.writeHead(githubRes.statusCode, { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        });
        res.end(data);
      });
    });

    githubRequest.on('error', (error) => {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: error.message }));
    });

    githubRequest.end();
    return;
  }

  let filePath = path.join(__dirname, req.url === '/' ? 'index.html' : req.url);
  
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end('Not Found');
      return;
    }
    const ext = path.extname(filePath);
    let contentType = 'text/html';
    if (ext === '.js') contentType = 'application/javascript';
    if (ext === '.css') contentType = 'text/css';
    if (ext === '.png' || ext === '.jpg' || ext === '.gif') contentType = 'image/' + ext.slice(1);
    
    // Inject live reload script into HTML files
    if (contentType === 'text/html') {
      const reloadScript = `
        <script>
          const ws = new WebSocket('ws://localhost:${PORT}');
          ws.onmessage = () => location.reload();
        </script>
      `;
      data = data.toString().replace('</body>', reloadScript + '</body>');
    }
    
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
  });
});

// WebSocket server for live reload
const wss = new WebSocket.Server({ server });

// Watch files for changes
const watcher = chokidar.watch(['./**/*.html', './**/*.css', './**/*.js'], {
  ignored: /node_modules|server\.js/,
  persistent: true
});

watcher.on('change', (filepath) => {
  console.log(`File changed: ${filepath}`);
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send('reload');
    }
  });
});

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}/`);
  console.log('Live reload enabled - watching for file changes...');
});