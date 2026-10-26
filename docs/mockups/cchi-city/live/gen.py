# Builds the live 3D campus from the diorama: diorama.html up to its capture pipeline, plus runtime.js, inside a shell.
#   python3 gen.py <out.html>          the iPhone test page (shell.html; three.js from jsDelivr; published as an Artifact)
#   python3 gen.py --app               the app's 3D campus: campus3d/index.html (app-shell.html; three.js vendored in
#                                      campus3d/three/, copied from ../node_modules/three, npm install --no-save three@0.160.0)
import base64, os, shutil, sys
HERE = os.path.dirname(os.path.abspath(__file__)); DIO = os.path.join(HERE, '..'); ROOT = os.path.join(DIO, '..', '..', '..')
APP = '--app' in sys.argv
src = open(os.path.join(DIO, 'diorama.html')).read().split('\n')
cut = next(i for i, l in enumerate(src) if '// ---- capture pipeline ----' in l)
body = '\n'.join(src[5:cut])   # from the line after <script type="module">
def rep(a, b):
    global body; assert body.count(a) == 1, a; body = body.replace(a, b)
for imp in ['EffectComposer', 'RenderPass', 'GTAOPass', 'UnrealBloomPass', 'SMAAPass', 'OutputPass']:
    rep("import { %s } from 'three/addons/postprocessing/%s.js';\n" % (imp, imp), '')
rep("import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';", "import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';\nimport { OrbitControls } from 'three/addons/controls/OrbitControls.js';")
rep("document.body.appendChild(renderer.domElement);", "document.getElementById('stage').appendChild(renderer.domElement);")
rep("moon.shadow.mapSize.set(8192,8192);", "moon.shadow.mapSize.set(2048,2048);")
rep("renderer.setPixelRatio(2); renderer.setSize(W,H);", "renderer.setPixelRatio(1); renderer.setSize(W,H);")
body = 'window.__LITE = true;\n' + body
mark = base64.b64encode(open(os.path.join(DIO, 'hmh-mark-square.png'), 'rb').read()).decode()
rt = open(os.path.join(HERE, 'runtime.js')).read()
shell = open(os.path.join(HERE, 'app-shell.html' if APP else 'shell.html')).read()
out = shell.replace('/*SCENE*/', "const MARK_URI = 'data:image/png;base64," + mark + "';\n" + body + "\n" + rt)
if APP:
    dst = os.path.join(ROOT, 'campus3d'); T = os.path.join(DIO, 'node_modules', 'three')
    os.makedirs(os.path.join(dst, 'three', 'addons'), exist_ok=True)
    shutil.copy(os.path.join(T, 'build', 'three.module.min.js'), os.path.join(dst, 'three', 'three.module.min.js'))
    for f in ['geometries/RoundedBoxGeometry.js', 'environments/RoomEnvironment.js', 'controls/OrbitControls.js', 'utils/BufferGeometryUtils.js']:
        os.makedirs(os.path.join(dst, 'three', 'addons', os.path.dirname(f)), exist_ok=True)
        shutil.copy(os.path.join(T, 'examples', 'jsm', f), os.path.join(dst, 'three', 'addons', f))
    shutil.copy(os.path.join(T, 'LICENSE'), os.path.join(dst, 'three', 'LICENSE'))
    path = os.path.join(dst, 'index.html')
else:
    path = sys.argv[1]
open(path, 'w').write(out)
print(path, len(out))
