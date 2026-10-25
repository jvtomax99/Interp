# The pieces' edges (2026-10-25), plain on navy at rest: export.py cut the body at
# HEM (y 1066) but the coat's hem runs on to about y 1080, so its last rows were in the
# legs (a light strip under the hem), and each leg's top, repeated up from y 1076, was
# coat white behind the coat (it shows once a leg swings). And the key's soft edge kept
# the wall's pale grey mixed into the trousers' and shoes' outer pixels (a white fringe).
# Here: the hem strip moves from the legs into the body piece, each leg's top becomes
# its trousers' blue from the first trouser row up, and every edge pixel of the legs
# takes the colour of the nearest pixel well inside. Run after export.py and
# trimpieces.py; a second run changes nothing. python3 -I trimedges.py (scipy).
# The hands had the same pale fringe, and the right forearm a sliver of shaded wall
# beside the coat (grey on navy): both at the end.
from PIL import Image
import numpy as np, json
from scipy import ndimage as ndi
OUT='/home/user/Interp/drsmiley/body/'
SRC='/home/user/Interp/docs/art/dr-smiley-body/body-master.png'
rig=json.load(open(OUT+'rig.json')); W,H=rig['canvas']; HEM=1066; END=HEM+16   # the coat's real hem, about y 1080
rgb=np.array(Image.open(SRC).convert('RGB')).astype(int)
def full(name):
    a=np.array(Image.open(OUT+name+'.webp').convert('RGBA')); x,y,x1,y1=rig['bbox'][name]
    F=np.zeros((H,W,4),np.uint8); F[y:y+a.shape[0],x:x+a.shape[1]]=a; return F
def decontam(F,below=0):
    A=F[...,3]>0; D=ndi.distance_transform_edt(A)
    inner=D>4; _,(iy,ix)=ndi.distance_transform_edt(~inner,return_indices=True)
    band=A&~inner; band[:below]=False
    F[band,:3]=F[iy[band],ix[band],:3]; return int(band.sum())
def save(name,F):
    im=Image.fromarray(F,'RGBA'); bb=im.getbbox(); im.crop(bb).save(OUT+name+'.webp',quality=92,method=6)
    rig['bbox'][name]=[int(v) for v in bb]; return bb
coat=(rgb.min(2)>140)&((rgb.max(2)-rgb.min(2))<30)     # the coat's white and grey
pants=~coat
yy,xx=np.mgrid[0:H,0:W]
# the floor's shadow on the wall beside the shoes (grey, a little blue, kept by the key)
floor=((rgb.max(2)-rgb.min(2))<20)&(rgb.mean(2)>140)&(rgb.mean(2)<205)&(rgb[...,2]-rgb[...,0]<20)&(yy>1280)
# between the trouser legs under the coat the picture shows the wall in shadow, a grey
# violet that reads pale on navy: out of the body and the legs
gap=(rgb[...,2]-rgb[...,0]<40)&(rgb.mean(2)>50)&(rgb.mean(2)<150); gap[:990]=False; gap[HEM:]=False; gap[:,:520]=False; gap[:,575:]=False
body=full('body'); moved=0; body[gap,3]=0
for name in ('leg-l','leg-r'):
    L=full(name); L[gap|floor,3]=0; A=L[...,3]
    cols=set(np.nonzero(A[HEM+40]>0)[0].tolist())                    # the trouser leg's columns, below the hem
    for x in range(W):
        if not A[:,x].any(): continue
        ys=np.nonzero(pants[HEM:END,x]&(A[HEM:END,x]>0))[0]   # the first trouser row below the hem
        yp=HEM+ys[0] if len(ys) and x in cols else H
        strip=np.arange(HEM,min(yp,END))
        strip=strip[(A[strip,x]>0)&coat[strip,x]]
        if len(strip):                                 # the coat's last rows: into the body
            body[strip,x,:3]=rgb[strip,x]; body[strip,x,3]=np.maximum(body[strip,x,3],A[strip,x]); moved+=len(strip)
        if yp<H:                                       # the leg's top, under the coat: its trousers' blue
            top=np.arange(0,yp); top=top[A[top,x]>0]
            L[top,x,:3]=L[yp+3,x,:3]; L[top,x,3]=L[yp+3,x,3]
        else: L[:HEM,x,3]=0; L[strip,x,3]=0              # a column past the trousers: its coat moved, its hidden top gone
    lab,n=ndi.label(L[...,3]>0,np.ones((3,3)))           # loose specks beside the shoes: gone
    if n>1: sz=ndi.sum(L[...,3]>0,lab,range(1,n+1)); L[(lab>0)&(lab!=1+int(np.argmax(sz))),3]=0
    n=decontam(L); print(name,'edge px recoloured',n,'box',save(name,L))
# the coat's corners below HEM, lost in export.py's cut (squared off): back from the picture
d=np.abs(rgb-np.array([210,209,211])).sum(2); ab=body[HEM-1,:,3]>0; x0,x1=np.nonzero(ab)[0][[0,-1]]
for y in range(HEM,END):
    for x in range(x0-2,x1+3):
        if coat[y,x] and d[y,x]>12 and body[y,x,3]==0:
            body[y,x,:3]=rgb[y,x]; body[y,x,3]=int(255*min(1,(d[y,x]-8)/24)); moved+=1
# the wall's grey that came along at the hem's corners and between the legs (pale on navy)
wall=((rgb.max(2)-rgb.min(2))<14)&(rgb.mean(2)>205)&(rgb.mean(2)<222); wall[:1040]=False
wall&=(body[...,3]<250)|((xx>=520)&(xx<575))
wall|=(rgb[...,2]-rgb[...,0]<40)&(xx>=528)&(xx<561)&(yy>=1050)   # the crotch: only trousers' blue stays
body[wall,3]=0
thin=(body[...,3]>0)&~ndi.binary_opening(body[...,3]>0,np.ones((3,3))); thin[:HEM-2]=False
body[thin,3]=0                                         # 1 px slivers past the hem's corners
lab,n=ndi.label(body[...,3]>0,np.ones((3,3)))
if n>1: sz=ndi.sum(body[...,3]>0,lab,range(1,n+1)); body[(lab>0)&(lab!=1+int(np.argmax(sz))),3]=0
print('hem px into the body',moved,'body box',save('body',body))
skin=(rgb[...,0]>rgb[...,1]+18)&(rgb[...,0]>rgb[...,2]+30)
for name in ('arm-fore-l','arm-fore-r'):                # the hands, below the cuffs
    F=full(name); grey=((F[...,:3].max(2).astype(int)-F[...,:3].min(2))<16)&~skin&(yy>960); F[grey,3]=0
    n=decontam(F,below=940); print(name,'wall px',int((grey&(full(name)[...,3]>0)).sum()),'edge px recoloured',n,'box',save(name,F))
json.dump(rig,open(OUT+'rig.json','w'),indent=1)
# body-trim.webp (2026-10-25): the body piece with its shoulder stubs cut back, where each cutout
# upper arm joins it at rest. Shown in place of body.webp while a front drawing stands in for both
# arms (the wince's, the thinking and clipboard drawings): their shoulders are drawn narrower and
# the stub poked out past the right one as a white wedge on navy. Right: no further out than x 705
# from y 614 to 660; left: no further in than x 386 over the same rows.
B=full('body'); rows=(yy>=614)&(yy<660)
B[rows&(xx>705),3]=0; B[rows&(xx<386),3]=0
im=Image.fromarray(B,'RGBA').crop(tuple(rig['bbox']['body'])); im.save(OUT+'body-trim.webp',quality=92,method=6)
print('body-trim px cut',int(((full('body')[...,3]>0)&(B[...,3]==0)).sum()))
