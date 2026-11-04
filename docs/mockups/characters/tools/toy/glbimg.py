import json, struct, sys, io
from PIL import Image
b = open(sys.argv[1], 'rb').read(); n = struct.unpack_from('<I', b, 12)[0]
j = json.loads(b[20:20 + n]); bin0 = 20 + n + 8
for i, im in enumerate(j['images']):
    bv = j['bufferViews'][im['bufferView']]; data = b[bin0 + bv.get('byteOffset', 0): bin0 + bv.get('byteOffset', 0) + bv['byteLength']]
    Image.open(io.BytesIO(data)).convert('RGB').resize((2048, 2048), Image.LANCZOS).save(f"{sys.argv[2]}/img{i}.png"); print(i, im.get('name'), im.get('mimeType'))
