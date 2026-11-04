import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import fs from 'fs';
const [mode, inGlb, a, b] = process.argv.slice(2);
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
const doc = await io.read(inGlb);
const mat = doc.getRoot().listMaterials()[0], tex = mat.getBaseColorTexture();
if (mode === 'get') { fs.writeFileSync(a, Buffer.from(tex.getImage())); console.log(tex.getMimeType(), tex.getSize()); }
else { tex.setImage(new Uint8Array(fs.readFileSync(a))).setMimeType('image/png'); await io.write(b, doc); console.log('written', b); }
