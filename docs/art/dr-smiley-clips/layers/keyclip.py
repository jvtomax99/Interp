# python3 -I keyclip.py <folder of f0001.png...> <out folder>   (frames from: ffmpeg -i clip.mp4 f%04d.png)
# Key a clip's frames (grey wall) to see-through webp at 320 x 440: the master's matte, the
# floor shadow dropped (below the shoes' top only blue stays), the wall blended out of the
# soft edge pixels (or the hair's top wears a light fringe on navy).
import numpy as np, glob, os, sys
from PIL import Image
from scipy import ndimage as ndi
SRC, OUT = sys.argv[1], sys.argv[2]; os.makedirs(OUT, exist_ok=True)
W,H=1070,1470; yy,xx=np.mgrid[0:H,0:W]
def fit(im):
    im=im.resize((round(im.size[0]*H/im.size[1]), H), Image.LANCZOS); off=(im.size[0]-W)//2; return im.crop((off,0,off+W,H))
def matte(rgb,bg,lo=8,hi=24,near=20):
    d=np.abs(rgb-bg).sum(2); soft=np.clip((d-lo)/hi,0,1); bgm=d<near; lab,n=ndi.label(bgm)
    edge=set(np.unique(np.concatenate([lab[0],lab[-1],lab[:,0],lab[:,-1]])))-{0}
    sizes=ndi.sum(bgm,lab,range(1,n+1)); big={i+1 for i,s in enumerate(sizes) if s>8000}
    outside=np.isin(lab,list(edge|big)); inner=ndi.binary_erosion(~outside,iterations=2); return np.where(inner,1.0,soft)*(~outside)
sizes=[]
for i,f in enumerate(sorted(glob.glob(SRC+'/f*.png'))):
    P=np.asarray(fit(Image.open(f).convert('RGB')),dtype=float); P[:, :4]=P[:, 4:5]; P[:, -4:]=P[:, -5:-4]
    bg=np.median(P[20:120,20:120].reshape(-1,3),0); a=matte(P,bg)
    blue=(P[...,2]-P[...,0])>22
    a[(yy>1150)&~ndi.binary_dilation(blue&(yy>1150),iterations=3)]=0      # the wall's shadow behind his calves: below the coat's hem only blue (trousers, shoes)
    hair=(yy<440)&(a>0); er=ndi.gaussian_filter(ndi.binary_erosion(a>.5,iterations=2).astype(float),.8)
    a=np.where(hair,np.minimum(a,er),a)                                     # the clip paints a light rim on the hair: its outline loses 2 px
    m=a>.5; lab,n=ndi.label(m); sz=ndi.sum(m,lab,range(1,n+1)); keep=lab==int(np.argmax(sz))+1
    a=np.where(ndi.binary_dilation(keep,iterations=2),a,0)
    soft=(a>0.02)&(a<0.98); aa=np.clip(a[...,None],0.02,1)
    P=np.where(soft[...,None], np.clip((P-bg*(1-aa))/aa,0,255), P)         # the wall blended out of the edge
    im=Image.fromarray(np.dstack([P,a*255]).astype(np.uint8),'RGBA').resize((320,440),Image.LANCZOS)
    out=f'{OUT}/{i:04d}.webp'; im.save(out,quality=88,method=6); sizes.append(os.path.getsize(out))
print('frames',len(sizes),'30 fps %.2f MB'%(sum(sizes)/1e6),'15 fps %.2f MB'%(sum(sizes[::2])/1e6))
