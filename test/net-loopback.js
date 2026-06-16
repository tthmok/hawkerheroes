const http=require('http'),fs=require('fs'),path=require('path'),puppeteer=require('puppeteer');
const ROOT=path.join(__dirname,'..','deploy');
const TYPES={'.html':'text/html','.js':'text/javascript','.svg':'image/svg+xml','.png':'image/png'};
const server=http.createServer((req,res)=>{let p=decodeURIComponent(req.url.split('?')[0]);if(p.endsWith('/'))p+='index.html';const f=path.join(ROOT,p);if(!f.startsWith(ROOT)){res.writeHead(403);return res.end();}fs.readFile(f,(e,d)=>{if(e){res.writeHead(404);return res.end();}res.writeHead(200,{'Content-Type':TYPES[path.extname(f)]||'application/octet-stream'});res.end(d);});});
const log=(...a)=>console.log(new Date().toISOString().slice(14,19),...a);
const ARGS=['--no-sandbox','--use-gl=swiftshader','--autoplay-policy=no-user-gesture-required'];
server.listen(0, async()=>{
  const url=`http://127.0.0.1:${server.address().port}/hawkerheroes/`;
  const bH=await puppeteer.launch({headless:'new',args:ARGS});
  const bG=await puppeteer.launch({headless:'new',args:ARGS});
  const host=await bH.newPage(), guest=await bG.newPage();
  [['HOST',host],['GUEST',guest]].forEach(([n,pg])=>pg.on('pageerror',e=>log(n+'.err',e.message)));
  const open=async(pg,n)=>{await pg.goto(url,{waitUntil:'load',timeout:25000});await pg.waitForFunction(()=>!!(window.HC&&window.HC.Net),{timeout:40000});log(n,'ready');};
  try{
    await Promise.all([open(host,'host'),open(guest,'guest')]);
    await host.evaluate(()=>{document.querySelector('.hh-online-btn').click();document.querySelector('#hh-host').click();});
    await host.waitForFunction(()=>document.querySelector('.hh-code-big'),{timeout:10000});
    const code=await host.evaluate(()=>document.querySelector('.hh-code-big').textContent.trim());
    log('host code =', code);
    await guest.evaluate((c)=>{document.querySelector('.hh-online-btn').click();document.querySelector('#hh-code').value=c;document.querySelector('#hh-join').click();},code);
    log('guest joining; waiting for P2P connect (up to 60s)...');
    await host.waitForFunction(()=>{const g=window.HC.game.scene.getScene('Game');return g&&g.scene.isActive()&&g.online==='host';},{timeout:60000});
    log('>>> PEER CONNECTED (host started the game)');
    // guest starts its renderer scene on the first snapshot
    await guest.waitForFunction(()=>{const g=window.HC.game.scene.getScene('Game');return g&&g.scene.isActive()&&g.online==='guest'&&!!window.HC.Net.snapshot;},{timeout:25000});
    log('>>> guest received first snapshot and started its render-only scene');
    // grab the guest's P2 x before/after holding ArrowRight (P2 = netPlayers[1])
    const before=await guest.evaluate(()=>window.HC.game.scene.getScene('Game').netPlayers[1].sprite.x);
    await guest.evaluate(()=>window.dispatchEvent(new KeyboardEvent('keydown',{key:'ArrowRight'})));
    await new Promise(r=>setTimeout(r,2000));
    await guest.evaluate(()=>window.dispatchEvent(new KeyboardEvent('keyup',{key:'ArrowRight'})));
    const after=await guest.evaluate(()=>window.HC.game.scene.getScene('Game').netPlayers[1].sprite.x);
    const got=await host.evaluate(()=>window.HC.Net.guestInput);
    const snap=await guest.evaluate(()=>{const s=window.HC.Net.snapshot;return {phase:s.ph, players:s.pl.length, p2x:s.pl[1]&&s.pl[1].x};});
    log('>>> RESULT '+JSON.stringify({
      hostSeesGuestInput:got, inputWorks:got.x>0,
      guestP2MovedRight:(after-before)>4, before:Math.round(before), after:Math.round(after),
      snapshot:snap
    }));
  }catch(e){log('FAILED: '+e.message);}
  finally{await bH.close();await bG.close();server.close();}
});
