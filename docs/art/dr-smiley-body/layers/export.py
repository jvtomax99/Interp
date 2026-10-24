# Final layer export for drsmiley/body/: everything in master pixels (1070 x 1470)
# except the head, which stays on base.webp's 480 x 600 grid so the app's face
# window and brows fit it unchanged.
from PIL import Image, ImageDraw, ImageFilter
import numpy as np, json, os
OUT='/home/user/Interp/drsmiley/body'; os.makedirs(OUT,exist_ok=True)
SRC='/home/user/Interp/docs/art/dr-smiley-body/body-master.png'
rgb=np.array(Image.open(SRC).convert('RGB')).astype(float); H,W,_=rgb.shape
# The figure as one solid shape (2026-10-24). Keying by colour distance alone
# left the coat porous: shading close to the grey background went transparent,
# and on Home the photo showed through him. Background is what reaches the
# picture's edge at the background colour (or a large enclosed pool of it);
# everything else is opaque inside, with the colour key kept for the edge's
# anti-aliasing only.
def matte(rgb, bg, lo=8, hi=24, near=20):
    from scipy import ndimage as ndi
    d=np.abs(rgb-bg).sum(2); soft=np.clip((d-lo)/hi,0,1)
    bgm=d<near; lab,n=ndi.label(bgm)
    edge=set(np.unique(np.concatenate([lab[0],lab[-1],lab[:,0],lab[:,-1]])))-{0}
    sizes=ndi.sum(bgm,lab,range(1,n+1)); big={i+1 for i,s in enumerate(sizes) if s>8000}   # an enclosed pool this big is background (between the legs); the coat's grey streaks are smaller
    outside=np.isin(lab,list(edge|big))
    inner=ndi.binary_erosion(~outside,iterations=2)
    return np.where(inner,1.0,soft)*(~outside)
bg=np.array([210,209,211.]); alpha=matte(rgb,bg)
gray=rgb.mean(2); sat=rgb.max(2)-rgb.min(2)
shadow=(sat<12)&(gray<209)&(gray>170); shadow[:1280,:]=False
alpha=alpha*(~shadow); fig=alpha>0.5
skin=(rgb[:,:,0]>rgb[:,:,1]+18)&(rgb[:,:,0]>rgb[:,:,2]+30)&(rgb[:,:,0]>150)
seams=json.load(open('seams.json'))
def fitseam(s, inset):
    ys=np.array(sorted(int(k) for k in s)); xs=np.array([s[str(y)] for y in ys])
    p=np.polyfit(ys,xs,3); return lambda y: np.polyval(p,y)+inset
TOP,ELBOW,CUFF,BOT,CHIN,HEM,SPLIT,HIPY=612,792,928,1075,578,1066,545,1040
fL=fitseam(seams['seamL'],+8); fR=fitseam(seams['seamR'],-8)
yy,xx=np.mgrid[0:H,0:W]
def disc(p,r): return ((xx-p[0])**2+(yy-p[1])**2)<=r*r
def despeck(m):
    im=Image.fromarray((m*255).astype(np.uint8))
    core=im.filter(ImageFilter.MinFilter(9)).filter(ImageFilter.MaxFilter(9)).filter(ImageFilter.MaxFilter(13))
    return m&(np.array(core)>0)
armL=np.zeros((H,W),bool); armR=np.zeros((H,W),bool)
for y in range(TOP,BOT):
    row=fig[y]
    if y<=CUFF: xl=int(fL(y)); xr=int(fR(y))
    else:
        sk=np.nonzero(skin[y]&row)[0]; left=sk[sk<W//2]; right=sk[sk>W//2]
        xl=left.max()+1 if len(left) else 0; xr=right.min()-1 if len(right) else W
    armL[y,:xl]=row[:xl]; armR[y,xr+1:]=row[xr+1:]
def centre(mask,y):
    xs=np.nonzero(mask[y])[0]; return int((xs.min()+xs.max())/2), int(xs.max()-xs.min())
cLx,wL=centre(armL,ELBOW); cRx,wR=centre(armR,ELBOW)
shL=(int(fL(TOP))-30, TOP+18); shR=(int(fR(TOP))+30, TOP+18); elL=(cLx,ELBOW); elR=(cRx,ELBOW)
upL=armL.copy(); upL[ELBOW:,:]=False; upL|=disc(shL,62)&fig; upL|=disc(elL,wL//2)&armL
foL=armL.copy(); foL[:ELBOW,:]=False; foL|=disc(elL,wL//2)&armL
upR=armR.copy(); upR[ELBOW:,:]=False; upR|=disc(shR,62)&fig; upR|=disc(elR,wR//2)&armR
foR=armR.copy(); foR[:ELBOW,:]=False; foR|=disc(elR,wR//2)&armR
# The body and the legs are cut against the arms with no gap (2026-10-24): the
# body overlaps each arm's inner edge by 4 px (the arms less that strip), the
# legs end exactly at the hands. A 5 px band carved out around the arms used to
# leave a seam that showed the page through him over a dark background.
arms=armL|armR
inner=np.zeros((H,W),bool)            # the 4 px of each arm just inside its seam with the coat
for y in range(TOP,CUFF+1):
    xl=int(fL(y)); xr=int(fR(y)); inner[y,max(0,xl-4):xl+1]=True; inner[y,xr:xr+5]=True
core=arms&~inner
# legs: below the hem, split at the gap; each leg's top repeated upward behind the coat
legs=fig&~arms&(yy>=HEM)
legL=legs&(xx<SPLIT); legR=legs&(xx>=SPLIT)
body=fig&~core&~legs; body[:CHIN,:]=False
body=despeck(body); upL,foL,upR,foR,legL,legR=map(despeck,(upL,foL,upR,foR,legL,legR))
src=rgb.copy()
for y in range(TOP,CUFF+1):   # relight the coat edge under each sleeve (from the body's edge, 4 px inside the arm, inward)
    xl=int(fL(y))-4; xr=int(fR(y))+4
    for k in range(14):
        w=1-k/14; src[y,xl+k]=w*rgb[y,xl+22]+(1-w)*rgb[y,xl+k]; src[y,xr-k]=w*rgb[y,xr-22]+(1-w)*rgb[y,xr-k]
legsrc=rgb.copy(); lega=alpha.copy()
for m in (legL,legR):
    band_rows=slice(HEM+6,HEM+16)
    for y in range(HIPY-50,HEM+6):      # the pant leg continues up under the coat
        m[y]=m[HEM+10]; legsrc[y]=rgb[HEM+10]; lega[y]=np.maximum(lega[y], alpha[HEM+10])
hipL=(centre(legL,HEM+10)[0],HIPY); hipR=(centre(legR,HEM+10)[0],HIPY)
def save(name,mask,colour,a):
    im=Image.fromarray(np.dstack([colour,a*mask*255]).astype(np.uint8),'RGBA'); bb=im.getbbox()
    im.crop(bb).save(f'{OUT}/{name}.webp',quality=92,method=6); return [int(v) for v in bb]
bbox={}
bbox['body']=save('body',body,src,alpha)
bbox['arm-upper-l']=save('arm-upper-l',upL,rgb,alpha); bbox['arm-fore-l']=save('arm-fore-l',foL,rgb,alpha)
bbox['arm-upper-r']=save('arm-upper-r',upR,rgb,alpha); bbox['arm-fore-r']=save('arm-fore-r',foR,rgb,alpha)
bbox['leg-l']=save('leg-l',legL,legsrc,lega); bbox['leg-r']=save('leg-r',legR,legsrc,lega)
# the head: base.webp's grid, its coat removed, nothing below the chin, a neck tube behind
base=Image.open('/home/user/Interp/drsmiley/base.webp').convert('RGBA'); ba=np.array(base).astype(int)
coat=(ba[:,:,:3].min(2)>190)&((ba[:,:,:3].max(2)-ba[:,:,:3].min(2))<25); coat[:430,:]=False
BCHIN=463; ba[coat,3]=0; ba[BCHIN:,3]=0
bop=ba[:,:,3]>200; bys,bxs=np.nonzero(bop); bw=bxs.max()-bxs.min()
hys,hxs=np.nonzero(fig&(yy<CHIN)); mw=hxs.max()-hxs.min(); s=mw/bw
cx=(hxs.max()+hxs.min())/2-(bxs.min()+bxs.max())/2*s; cy=CHIN-BCHIN*s
neck_col=tuple(int(c) for c in np.median(rgb[565:580,520:580].reshape(-1,3),0))
tube=Image.new('RGBA',(480,600),(0,0,0,0))
tx0,ty0,tx1,ty1=[(v-cx)/s for v in (490,606)][0],(CHIN-40-cy)/s,[(v-cx)/s for v in (490,606)][1],(CHIN+40-cy)/s
ImageDraw.Draw(tube).rounded_rectangle([tx0,ty0,tx1,ty1],radius=28,fill=neck_col+(255,))
head=Image.alpha_composite(tube,Image.fromarray(ba.astype(np.uint8),'RGBA')); head.save(f'{OUT}/head.webp',quality=92,method=6)
rig={'canvas':[W,H],'head':{'scale':round(s,4),'at':[round(cx,1),round(cy,1)],'grid':[480,600],'chinY':BCHIN},
     'neck':[547,585],'shoulderL':list(shL),'elbowL':list(elL),'shoulderR':list(shR),'elbowR':list(elR),'hipL':list(hipL),'hipR':list(hipR),
     'feetY':1427,'bbox':bbox}
json.dump(rig,open(f'{OUT}/rig.json','w'),indent=1); print(json.dumps(rig))
os.system(f'du -sh {OUT}; ls -la {OUT}')
