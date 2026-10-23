# Cut the drawn poses (docs/art/dr-smiley-body/{wave,fist-pump,think,shrug,crouch,jump}.png, Jose, 2026-10-23)
# into frames on the master grid: drsmiley/body/pose-<name>.webp + poses.json (their boxes), and
# preview-frames.png. Content changes only: coat over coat is the same coat, shaded a little
# differently, so it is left to body.webp. Run from anywhere: python3 -I cutframes.py (needs scipy).
# Cut the drawn arm poses into frames on the master grid.
from PIL import Image, ImageFilter, ImageDraw
import numpy as np, json, sys
from scipy import ndimage as ndi
D='/home/user/Interp/docs/art/dr-smiley-body/'; OUT='/home/user/Interp/drsmiley/body/'
M=np.asarray(Image.open(D+'body-master.png').convert('RGB')).astype(float); H,W,_=M.shape
yy,xx=np.mgrid[0:H,0:W]
def key(rgb):
    bg=np.median(rgb[20:120,20:120].reshape(-1,3),0); d=np.abs(rgb-bg).sum(2); return np.clip((d-8)/24,0,1)
alphaM=key(M)
# region: which part of the picture a pose's arms may occupy; head box excluded unless allowed
POSES={
 'wave':      dict(region=lambda: (xx<450)&(yy>300)&(yy<1100)&~((yy<578)&(xx>318)), offset=(0,0)),
 'fist-pump': dict(region=lambda: (xx<450)&(yy>300)&(yy<1100)&~((yy<578)&(xx>318)), offset=(0,0)),
 'think':     dict(region=lambda: (xx>280)&(xx<800)&(yy>488)&(yy<1000), offset=(4,0)),
 'shrug':     dict(region=lambda: (yy>540)&(yy<1100), offset=(4,0)),
}
res={}
for name,cfg in POSES.items():
    im=Image.open(D+name+'.png').convert('RGB')
    dx,dy=cfg['offset']
    if dx or dy: im=im.transform(im.size, Image.AFFINE, (1,0,-dx,0,1,-dy), Image.BICUBIC)  # shift by (dx,dy) so it lands on the master
    P=np.asarray(im).astype(float); aP=key(P)
    diff=np.abs(P-M).sum(2)
    white=lambda A: (A.min(2)>140)&((A.max(2)-A.min(2))<22)   # the coat, lit or shaded (skin, scrubs and hair are coloured or dark)
    coatM=white(M)&(alphaM>0.5); coatP=white(P)&(aP>0.5)
    # content changes only: coat-white over coat-white is the same coat, shaded a little differently
    mask=(diff>60)&(aP>0.5)&cfg['region']()&~(coatM&coatP)
    mask=ndi.binary_opening(mask,iterations=2)
    lab,n=ndi.label(mask); sizes=ndi.sum(mask,lab,range(1,n+1))
    keep=np.isin(lab,[i+1 for i,s in enumerate(sizes) if s>1500]); mask=keep
    mask=ndi.binary_closing(mask,iterations=3)
    holes=ndi.binary_fill_holes(mask)&~mask; mask|=holes&~coatM
    mask=ndi.binary_dilation(mask,iterations=2)
    soft=ndi.gaussian_filter(mask.astype(float),1.5)
    a=np.clip(soft,0,1)*aP
    rgba=np.dstack([P,a*255]).astype(np.uint8); fr=Image.fromarray(rgba,'RGBA'); bb=fr.getbbox()
    fr.crop(bb).save(OUT+'pose-'+name+'.webp',quality=92,method=6)
    res[name]=dict(box=[bb[0],bb[1],bb[2]-bb[0],bb[3]-bb[1]],px=int(mask.sum()))
    print(name,res[name])
# The leg plates (crouch, jump): both legs whole, pants and shoes below the hip
# line, the floor shadow out, the top row repeated up under the coat as export.py
# does, so a longer or shorter coat in the picture never shows a gap.
LEGS={'crouch':(4,0),'jump':(4,0)}
for name,(dx,dy) in LEGS.items():
    im=Image.open(D+name+'.png').convert('RGB')
    if dx or dy: im=im.transform(im.size, Image.AFFINE, (1,0,-dx,0,1,-dy), Image.BICUBIC)
    P=np.asarray(im).astype(float); aP=key(P)
    sat=P.max(2)-P.min(2); dark=P.max(2)<90
    mask=(aP>0.5)&(yy>=990)&((sat>25)|dark)
    mask=ndi.binary_opening(mask,iterations=2)
    lab,n=ndi.label(mask); sizes=ndi.sum(mask,lab,range(1,n+1))
    mask=np.isin(lab,[i+1 for i,s in enumerate(sizes) if s>3000])
    mask=ndi.binary_fill_holes(ndi.binary_closing(mask,iterations=3))
    # colour: the picture's scrub blue runs brighter than the master's; match the
    # pants' mean per channel so the swap never pops
    blueM=(alphaM>0.5)&(yy>=1080)&((M[:,:,2]-M[:,:,0])>40); blueP=mask&((P[:,:,2]-P[:,:,0])>40)
    shift=M[blueM].mean(0)-P[blueP].mean(0); print('  blue shift',shift.round(1))
    w=ndi.gaussian_filter(blueP.astype(float),2)[...,None]
    src=np.clip(P+shift*w,0,255); a=np.clip(ndi.gaussian_filter(mask.astype(float),1.2),0,1)*aP
    top=int(np.where(mask.any(1))[0].min())
    for y in range(990,top+10): mask[y]=mask[top+10]; src[y]=P[top+10]; a[y]=a[top+10]
    rgba=np.dstack([src,a*mask*255]).astype(np.uint8); fr=Image.fromarray(rgba,'RGBA'); bb=fr.getbbox()
    fr.crop(bb).save(OUT+'pose-'+name+'.webp',quality=92,method=6)
    res[name]=dict(box=[bb[0],bb[1],bb[2]-bb[0],bb[3]-bb[1]],px=int(mask.sum()),legs=True)
    print(name,res[name])
json.dump(res,open(OUT+'poses.json','w'),indent=1)
# preview: the rig at rest from its pieces, the frame on top, the replaced rig arm(s) hidden
rig=json.load(open(OUT+'rig.json')); bx=rig['bbox']
def piece(k):
    im=Image.open(OUT+k+'.webp').convert('RGBA'); return im,bx[k]
head=Image.open(OUT+'head.webp').convert('RGBA'); s=rig['head']['scale']; hx,hy=rig['head']['at']
head=head.resize((round(480*s),round(600*s)),Image.LANCZOS)
HIDES={'wave':['l'],'fist-pump':['l'],'think':['l','r'],'shrug':['l','r']}
def compose(name=None):
    out=Image.new('RGBA',(W,H),(255,255,255,255))
    legs=name in LEGS
    for k in ([] if legs else ['leg-l','leg-r'])+[a for a in ['arm-upper-l','arm-fore-l','arm-upper-r','arm-fore-r'] if not name or legs or a[-1] not in HIDES[name]]:
        im,b=piece(k); out.alpha_composite(im,(b[0],b[1]))
    if legs:
        f=Image.open(OUT+'pose-'+name+'.webp').convert('RGBA'); b=res[name]['box']; out.alpha_composite(f,(b[0],b[1]))
    out.alpha_composite(head,(round(hx),round(hy)))
    im,b=piece('body'); out.alpha_composite(im,(b[0],b[1]))
    if name and not legs:
        f=Image.open(OUT+'pose-'+name+'.webp').convert('RGBA'); b=res[name]['box']; out.alpha_composite(f,(b[0],b[1]))
    return out
names=['rest','wave','fist-pump','think','shrug','crouch','jump']
sheet=Image.new('RGB',(len(names)*470,780),(255,255,255)); d=ImageDraw.Draw(sheet)
for i,n in enumerate(names):
    sheet.paste(compose(None if n=='rest' else n).convert('RGB').crop((60,0,1040,1470)).resize((460,690),Image.LANCZOS),(i*470+5,4)); d.text((i*470+200,740),n,fill=(21,28,44))
sheet.save(D+'preview-frames.png'); print('sheet',sheet.size)
