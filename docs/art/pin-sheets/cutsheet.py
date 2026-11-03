import sys, numpy as np
from PIL import Image, ImageFilter
src, cols, rows, keys, outdir = sys.argv[1], int(sys.argv[2]), int(sys.argv[3]), sys.argv[4].split(','), sys.argv[5]
im=Image.open(src).convert('RGBA'); W,H=im.size; cw,ch=W/cols,H/rows
A=np.asarray(im).astype(float)
a=A[...,3]
m=np.clip((a-150)/(235-150),0,1)          # drop the haze, keep the solid pin
mask=Image.fromarray((m*255).astype('uint8')).filter(ImageFilter.MinFilter(3)).filter(ImageFilter.GaussianBlur(.7))
rgb=Image.fromarray(A[...,:3].astype('uint8'))
cut=rgb.convert('RGBA'); cut.putalpha(mask)
# Each solid part goes to the cell holding its centre, so a part that pokes
# over a cell line stays with its own icon and slivers of neighbours drop out.
from PIL import ImageDraw
bm=mask.point(lambda v:255 if v>60 else 0).convert('RGB'); arr=np.asarray(bm)[...,0]
owner=np.full(arr.shape,-1,int); n=0; parts={}
todo=np.argwhere(arr>0)
seen=np.zeros(arr.shape,bool)
for y,x in todo:
    if seen[y,x]: continue
    n+=1; col=(n%250+1,(n//250)%250+1,7)
    ImageDraw.floodfill(bm,(int(x),int(y)),col,thresh=0)
    a2=np.asarray(bm); m=(a2[...,0]==col[0])&(a2[...,1]==col[1])&(a2[...,2]==7)
    seen|=m; ys,xs=np.nonzero(m)
    if len(ys)<150: continue
    cell=int(xs.mean()//cw)+cols*int(ys.mean()//ch)
    parts.setdefault(cell,np.zeros(arr.shape,bool)); parts[cell]|=m
full=np.asarray(mask)
for i,k in enumerate(keys):
    if not k or k=='-' or i not in parts: continue
    keep=Image.fromarray((np.where(parts[i],255,0)).astype('uint8')).filter(ImageFilter.MaxFilter(5))
    al=Image.fromarray(np.minimum(full,np.asarray(keep)).astype('uint8'))
    one=rgb.convert('RGBA'); one.putalpha(al)
    p=one.crop(al.point(lambda v:255 if v>60 else 0).getbbox())
    s=176/max(p.size); p=p.resize((max(1,round(p.size[0]*s)),max(1,round(p.size[1]*s))),Image.LANCZOS)
    out=Image.new('RGBA',(192,192)); x=(192-p.size[0])//2; y=(192-p.size[1])//2-3
    sh=Image.new('RGBA',(192,192),(22,55,90,0)); al2=Image.new('L',(192,192)); al2.paste(p.split()[3].point(lambda v:int(v*.20)),(x,y+4))
    sh.putalpha(al2.filter(ImageFilter.GaussianBlur(3.5))); out.alpha_composite(sh); out.alpha_composite(p,(x,y))
    out.save(f'{outdir}/{k}.png'); out.save(f'{outdir}/{k}.webp',quality=92,method=6)
    print(k, p.size)
