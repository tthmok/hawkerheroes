const http = require('http'), fs = require('fs'), path = require('path');
const puppeteer = require('puppeteer');
const ROOT = path.join(__dirname, '..', 'deploy');
const TYPES = { '.html':'text/html','.js':'text/javascript','.svg':'image/svg+xml','.png':'image/png' };
const server = http.createServer((req,res)=>{
  let p = decodeURIComponent(req.url.split('?')[0]); if (p.endsWith('/')) p += 'index.html';
  const f = path.join(ROOT,p); if(!f.startsWith(ROOT)){res.writeHead(403);return res.end();}
  fs.readFile(f,(e,d)=>{ if(e){res.writeHead(404);return res.end('404');}
    res.writeHead(200,{'Content-Type':TYPES[path.extname(f)]||'application/octet-stream'}); res.end(d); });
});
server.listen(0, async ()=>{
  const url = `http://127.0.0.1:${server.address().port}/hawkerheroes/`;
  const errors=[];
  const browser = await puppeteer.launch({headless:'new',args:['--no-sandbox','--use-gl=swiftshader']});
  const page = await browser.newPage();
  page.on('pageerror',e=>errors.push('PAGEERROR: '+e.message));
  page.on('console',m=>{ if(m.type()==='error') errors.push('CONSOLE.ERROR: '+m.text()); });
  try {
    await page.goto(url,{waitUntil:'load',timeout:25000});
    // wait for Trystero module to load and HC.Net to appear
    await page.waitForFunction(()=>!!(window.HC && window.HC.Net), {timeout:20000});
    const r = await page.evaluate(()=>{
      const btn = document.querySelector('.hh-online-btn');
      btn && btn.click();
      const modal = document.querySelector('.hh-modal');
      return {
        netReady: !!window.HC.Net,
        buttonPresent: !!btn,
        lobbyOpens: !!modal,
        hasHostBtn: !!(modal && modal.querySelector('#hh-host')),
        hasJoin: !!(modal && modal.querySelector('#hh-join'))
      };
    });
    console.log(JSON.stringify({ ok: errors.length===0, ...r, errors }, null, 2));
  } catch(e){ console.log('EXCEPTION '+e.message+'\n'+JSON.stringify(errors)); }
  finally { await browser.close(); server.close(); }
});
