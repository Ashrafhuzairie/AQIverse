import http from 'node:http';
import {readFile} from 'node:fs/promises';
import worker from '../worker/index.js';
const env={...process.env};
try{for(const line of (await readFile('.dev.vars','utf8')).split(/\r?\n/)){const match=line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);if(match)env[match[1]]=match[2].trim().replace(/^['"]|['"]$/g,'');}}catch{}
const port=Number(process.env.PORT||8080);
http.createServer(async(req,res)=>{
 try{const response=await worker.fetch(new Request(`http://localhost:${port}${req.url}`,{method:req.method}),env,{waitUntil:p=>p.catch(()=>{})});res.writeHead(response.status,Object.fromEntries(response.headers));res.end(Buffer.from(await response.arrayBuffer()));}catch{res.writeHead(500,{'Content-Type':'text/plain'});res.end('Local server error.');}
}).listen(port,'127.0.0.1',()=>process.stdout.write(`AQIverse is available at http://127.0.0.1:${port}\n`));
