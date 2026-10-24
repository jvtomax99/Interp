from PIL import Image, ImageDraw, ImageFilter
import numpy as np, json, os
SRC='/home/user/Interp/docs/art/dr-smiley-body/body-master.png'
rgb=np.array(Image.open(SRC).convert('RGB')).astype(float); H,W,_=rgb.shape
alpha=np.load('alpha.npy'); gray=rgb.mean(2); sat=rgb.max(2)-rgb.min(2)
shadow=(sat<12)&(gray<209)&(gray>170); shadow[:1280,:]=False
alpha=alpha*(~shadow); fig=alpha>0.5
skin=(rgb[:,:,0]>rgb[:,:,1]+18)&(rgb[:,:,0]>rgb[:,:,2]+30)&(rgb[:,:,0]>150)
seams=json.load(open('seams.json'))
def fitseam(s, inset):
    ys=np.array(sorted(int(k) for k in s)); xs=np.array([s[str(y)] for y in ys])
    p=np.polyfit(ys,xs,3); return lambda y: np.polyval(p,y)+inset
TOP,ELBOW,CUFF,BOT,CHIN=612,792,928,1075,578
fL=fitseam(seams['seamL'],+8); fR=fitseam(seams['seamR'],-8)
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
shL=(int(fL(TOP))-30, TOP+18); shR=(int(fR(TOP))+30, TOP+18)
elL=(cLx,ELBOW); elR=(cRx,ELBOW)
yy,xx=np.mgrid[0:H,0:W]
def disc(p,r): return ((xx-p[0])**2+(yy-p[1])**2)<=r*r
upL=armL.copy(); upL[ELBOW:,:]=False; upL|=disc(shL,62)&fig; upL|=disc(elL,wL//2)&armL
foL=armL.copy(); foL[:ELBOW,:]=False; foL|=disc(elL,wL//2)&armL
upR=armR.copy(); upR[ELBOW:,:]=False; upR|=disc(shR,62)&fig; upR|=disc(elR,wR//2)&armR
foR=armR.copy(); foR[:ELBOW,:]=False; foR|=disc(elR,wR//2)&armR
band=np.array(Image.fromarray(((armL|armR)*255).astype(np.uint8)).filter(ImageFilter.MaxFilter(11)))>0
body=fig&~band; body[:CHIN,:]=False
def despeck(m):
    im=Image.fromarray((m*255).astype(np.uint8))
    core=im.filter(ImageFilter.MinFilter(9)).filter(ImageFilter.MaxFilter(9)).filter(ImageFilter.MaxFilter(13))
    return m&(np.array(core)>0)
body=despeck(body); upL=despeck(upL); foL=despeck(foL); upR=despeck(upR); foR=despeck(foR)
relit=rgb.copy()
for y in range(TOP,CUFF+1):
    xl=int(fL(y))+13; xr=int(fR(y))-13
    for k in range(14):
        w=1-k/14
        relit[y,xl+k]=w*rgb[y,xl+22]+(1-w)*rgb[y,xl+k]; relit[y,xr-k]=w*rgb[y,xr-22]+(1-w)*rgb[y,xr-k]
def layer(mask, src=None):
    a=(alpha*mask); return Image.fromarray(np.dstack([rgb if src is None else src, a*255]).astype(np.uint8),'RGBA')
neck_col=tuple(int(c) for c in np.median(rgb[565:580,520:580].reshape(-1,3),0))
tube=Image.new('RGBA',(W,H),(0,0,0,0)); ImageDraw.Draw(tube).rounded_rectangle([490,CHIN-40,606,CHIN+40],radius=30,fill=neck_col+(255,))
masterHead=Image.alpha_composite(tube, layer(fig&(yy<CHIN)))
bodyL=layer(body,relit); L={'upL':layer(upL),'foL':layer(foL),'upR':layer(upR),'foR':layer(foR)}
# the app's head: base.webp above its chin, minus its bit of coat
base=Image.open('/home/user/Interp/drsmiley/base.webp').convert('RGBA'); ba=np.array(base).astype(int)
coat=(ba[:,:,:3].min(2)>190)&((ba[:,:,:3].max(2)-ba[:,:,:3].min(2))<25); coat[:430,:]=False
ba[coat,3]=0; ba[463:,3]=0
bop=ba[:,:,3]>200; bys,bxs=np.nonzero(bop); bw=bxs.max()-bxs.min()
hys,hxs=np.nonzero(fig&(yy<CHIN)); mw=hxs.max()-hxs.min(); s=mw/bw
hb=Image.fromarray(ba.astype(np.uint8),'RGBA').crop((0,0,480,463)).resize((int(480*s),int(463*s)),Image.LANCZOS)
cx=int((hxs.max()+hxs.min())/2-(bxs.min()+bxs.max())/2*s); cy=int(CHIN-463*s)
appHead=Image.new('RGBA',(W,H),(0,0,0,0)); appHead.paste(hb,(cx,cy)); appHead=Image.alpha_composite(tube,appHead)
NECK=(547,585)
def rot(im,p,d): return im.rotate(d,resample=Image.BICUBIC,center=p) if d else im
def pose(head, hd=0, uL=0, fL_=0, uR=0, fR_=0):
    out=Image.new('RGBA',(W,H),(255,255,255,255))
    out=Image.alpha_composite(out, rot(head,NECK,hd))
    # forearm rotates about the elbow, then the whole arm about the shoulder
    for up,fo,sh,el,u,f in ((L['upL'],L['foL'],shL,elL,uL,fL_),(L['upR'],L['foR'],shR,elR,uR,fR_)):
        arm=Image.alpha_composite(rot(fo,el,f), up)
        out=Image.alpha_composite(out, rot(arm,sh,u))
    return Image.alpha_composite(out, bodyL)
poses=[('rest',dict()),('wave',dict(hd=-3,uL=-60,fL_=-95)),('cheer',dict(hd=2,uL=-150,fL_=-15,uR=150,fR_=15)),
       ('fist pump',dict(hd=3,uR=80,fR_=85)),('think',dict(hd=-4,uR=15,fR_=120,uL=10,fL_=70)),('shrug',dict(hd=2,uL=-25,fL_=-95,uR=25,fR_=95))]
sheet=Image.new('RGB',(len(poses)*470,780),(255,255,255)); d=ImageDraw.Draw(sheet)
for i,(name,kw) in enumerate(poses):
    sheet.paste(pose(appHead,**kw).convert('RGB').crop((60,0,1040,1470)).resize((460,690)),(i*470+5,4)); d.text((i*470+200,740),name,fill=(21,28,44))
sheet.save('preview-rig.png')
sheet.crop((0,0,470*3,780)).save('preview-rig-phone.png')
os.makedirs('layers',exist_ok=True)
for n,im in (('head',appHead),('head-master',masterHead),('body',bodyL),('upper-arm-l',L['upL']),('forearm-l',L['foL']),('upper-arm-r',L['upR']),('forearm-r',L['foR'])):
    bb=im.getbbox(); im.crop(bb).save(f'layers/{n}.webp',quality=92); print(n,bb)
json.dump({'canvas':[W,H],'neck':NECK,'shoulderL':shL,'elbowL':elL,'shoulderR':shR,'elbowR':elR,'chin':CHIN,'appHeadScale':round(s,4),'appHeadAt':[cx,cy]},open('layers/rig.json','w'),indent=1)
