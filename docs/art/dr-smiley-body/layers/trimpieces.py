# Fix two pieces of drsmiley/body/ (2026-10-24): the head (below) and the body's loose bits (further down).
# The head below his chin keeps only skin (his jaw and neck). It carried a bit of
# collar, both coat shoulders and grey shaded coat beside the neck (holes where
# export.py took the white out), ragged against anything dark: frayed white bits
# above his shoulders at rest, a torn strip once an arm went up, flecks swinging out
# past the body when his head turned. The body piece draws all the coat there.
# Run after export.py; a second run changes nothing that shows. python3 -I trimpieces.py (scipy).
from PIL import Image
import numpy as np, json
from scipy import ndimage as ndi
OUT='/home/user/Interp/drsmiley/body/'
rig=json.load(open(OUT+'rig.json')); s=rig['head']['scale']; hx,hy=rig['head']['at']; W,H=rig['canvas']
body=np.asarray(Image.open(OUT+'body.webp').convert('RGBA'))[...,3]>127
bx,by=rig['bbox']['body'][:2]
B=np.zeros((H,W),bool); B[by:by+body.shape[0],bx:bx+body.shape[1]]=body
B=ndi.binary_dilation(B,iterations=3)
head=np.array(Image.open(OUT+'head.webp').convert('RGBA'))
gy,gx=np.mgrid[0:head.shape[0],0:head.shape[1]]
mx=np.clip(np.round(hx+gx*s).astype(int),0,W-1); my=np.clip(np.round(hy+gy*s).astype(int),0,H-1)
rgb=head[...,:3].astype(int)
chin=rig['head']['chinY']                 # on the head's own grid
skinH=(rgb[...,0]>rgb[...,1]+18)&(rgb[...,0]>rgb[...,2]+25)
cut=(((gy>chin-40)&~skinH)|((gy>chin+6)&~B[my,mx]))&(head[...,3]>0)
print('trimmed px',int(cut.sum()))
head[cut,3]=0
Image.fromarray(head,'RGBA').save(OUT+'head.webp',quality=92,method=6)

# The body piece's loose bits (2026-10-24): a few small islands apart from the body,
# bits of the right sleeve's cuff and the hand's shading that export.py gave the
# body. At rest they lay over the right forearm and read as part of it; with that
# arm hidden behind a drawn pose (the shrug, the clipboard, a mirrored wave) they
# floated by the coat's hem as a white speck. They belong to the forearm: moved
# into arm-fore-r.webp (same place at rest; now they turn and hide with it).
# Islands on his left or along the hem stay (a pixel or two, none past the coat).
bimg=np.array(Image.open(OUT+'body.webp').convert('RGBA')); ba=bimg[...,3]>20
lab,n=ndi.label(ba); sz=ndi.sum(ba,lab,range(1,n+1)); main=int(np.argmax(sz))+1
fr=np.array(Image.open(OUT+'arm-fore-r.webp').convert('RGBA')); fx,fy=rig['bbox']['arm-fore-r'][:2]
moved=0
for i in range(1,n+1):
    if i==main: continue
    ys,xs=np.where(lab==i); X,Y=xs+bx,ys+by
    if X.min()<590 or Y.min()<760: continue          # only the right forearm's
    ok=(X-fx>=0)&(X-fx<fr.shape[1])&(Y-fy>=0)&(Y-fy<fr.shape[0])
    for y,x,Xx,Yy in zip(ys[ok],xs[ok],X[ok],Y[ok]):
        src=bimg[y,x].astype(float); dst=fr[Yy-fy,Xx-fx].astype(float); a=src[3]/255; da=dst[3]/255
        oa=a+da*(1-a); fr[Yy-fy,Xx-fx,:3]=((src[:3]*a+dst[:3]*da*(1-a))/max(oa,1e-6)).round(); fr[Yy-fy,Xx-fx,3]=round(oa*255)
    bimg[ys,xs,3]=0; moved+=len(ys)
print('moved to the right forearm px',moved)
if moved:
    Image.fromarray(bimg,'RGBA').save(OUT+'body.webp',quality=92,method=6)
    Image.fromarray(fr,'RGBA').save(OUT+'arm-fore-r.webp',quality=92,method=6)
