import base64,re
src=open('/home/user/Interp/docs/mockups/cchi-city/diorama.html').read().split('\n')
cut=next(i for i,l in enumerate(src) if '// ---- capture pipeline ----' in l)
body='\n'.join(src[5:cut])   # from the line after <script type="module">
def rep(a,b):
    global body; assert body.count(a)==1,a; body=body.replace(a,b)
for imp in ["import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';","import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';","import { GTAOPass } from 'three/addons/postprocessing/GTAOPass.js';","import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';","import { SMAAPass } from 'three/addons/postprocessing/SMAAPass.js';","import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';"]:
    rep(imp+'\n','')
rep("import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';","import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';\nimport { OrbitControls } from 'three/addons/controls/OrbitControls.js';\nimport { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';")
rep("document.body.appendChild(renderer.domElement);","document.getElementById('stage').appendChild(renderer.domElement);")
rep("moon.shadow.mapSize.set(8192,8192);","moon.shadow.mapSize.set(2048,2048);")
rep("renderer.setPixelRatio(2); renderer.setSize(W,H);","renderer.setPixelRatio(1); renderer.setSize(W,H);")
mark=base64.b64encode(open('/home/user/Interp/docs/mockups/cchi-city/hmh-mark-square.png','rb').read()).decode()
rt=open(__import__('os').path.join(__import__('os').path.dirname(__file__),'runtime.js')).read()
shell=open(__import__('os').path.join(__import__('os').path.dirname(__file__),'shell.html')).read()
out=shell.replace('/*SCENE*/', "const MARK_URI = 'data:image/png;base64,"+mark+"';\n"+body+"\n"+rt)
open(__import__('sys').argv[1],'w').write(out)
print(len(out))
