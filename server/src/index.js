import http from 'node:http';

const port = Number(process.env.PORT || 3000);

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({
    ok: true,
    service: 'fungi-hackaton-server',
    path: req.url
  }));
});

server.listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`);
});

