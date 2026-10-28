const fs=require('fs'),http=require('http'),{chromium}=require('playwright');
const S=process.argv[2];
let html=fs.readFileSync(S+'/campus.html','utf8').replace(/https:\/\/cdn\.jsdelivr\.net\/npm\/three@0\.160\.0\//g,'/three/');
html=html.replace("const scene = new THREE.Scene();","const scene = new THREE.Scene(); window.__scene = scene; window.__T = THREE;");
const T='/home/user/Interp/docs/mockups/cchi-city/node_modules/three/';
const srv=http.createServer((q,r)=>{const u=q.url;if(u.split('?')[0]==='/'){r.setHeader('Content-Type','text/html');return r.end(html);}
 if(u.startsWith('/three/')){const f=T+u.slice(7);if(fs.existsSync(f)){r.setHeader('Content-Type','text/javascript');return fs.createReadStream(f).pipe(r);}}r.statusCode=404;r.end();}).listen(0,async()=>{
 const b=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const p=await b.newPage({viewport:{width:400,height:400}}); p.on('pageerror',e=>console.log('ERR',e.message));
 await p.goto(`http://localhost:${srv.address().port}/?fov=30`);
 await p.waitForFunction(()=>document.body.classList.contains('ready'),null,{timeout:240000});
 await p.evaluate(()=>{ window.__built({c:1,e:1,n:1,s:1,t:1}); const e=document.getElementById('hour'); e.value=15; e.dispatchEvent(new Event('input',{bubbles:true})); });
 const n=await p.evaluate(async()=>{
   const { GLTFExporter } = await import('three/addons/exporters/GLTFExporter.js');
   const T=window.__T, scene=window.__scene, root=new T.Group(); let count=0;
   scene.updateMatrixWorld(true);
   scene.traverse(o=>{ if(!o.isMesh||!o.visible) return; let vis=true; for(let q=o;q;q=q.parent) if(!q.visible) vis=false; if(!vis) return;
     const m=[].concat(o.material)[0]; if(!m||m.isShaderMaterial||m.blending===T.AdditiveBlending) return;
     const g=o.geometry.clone(); const mesh=new T.Mesh(g,m); o.matrixWorld.decompose(mesh.position,mesh.quaternion,mesh.scale); mesh.name=(o.parent&&o.parent.userData.key||'_')+'_'+count; root.add(mesh); count++; });
   const out=await new GLTFExporter().parseAsync(root,{binary:true,maxTextureSize:1024});
   const bytes=new Uint8Array(out); let s=''; for(let i=0;i<bytes.length;i+=32768) s+=String.fromCharCode.apply(null,bytes.subarray(i,i+32768));
   window.__glb=btoa(s); return count; });
 const b64=await p.evaluate(()=>window.__glb); fs.writeFileSync(S+'/campus.glb',Buffer.from(b64,'base64'));
 const cam=await p.evaluate(()=>{ const c=[...document.querySelectorAll('canvas')]; return c.length; });
 console.log('meshes',n,'bytes',fs.statSync(S+'/campus.glb').size);
 await b.close();srv.close();});
