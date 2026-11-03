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
for i,k in enumerate(keys):
    if not k or k=='-': continue
    c,r=i%cols,i//cols
    cell=cut.crop((int(c*cw),int(r*ch),int((c+1)*cw),int((r+1)*ch)))
    # keep only the biggest blob's box (ignore stray bits from neighbours)
    bb=cell.split()[3].point(lambda v:255 if v>60 else 0).getbbox()
    p=cell.crop(bb); s=176/max(p.size); p=p.resize((max(1,round(p.size[0]*s)),max(1,round(p.size[1]*s))),Image.LANCZOS)
    out=Image.new('RGBA',(192,192)); x=(192-p.size[0])//2; y=(192-p.size[1])//2-3
    sh=Image.new('RGBA',(192,192),(22,55,90,0)); al=Image.new('L',(192,192)); al.paste(p.split()[3].point(lambda v:int(v*.20)),(x,y+4))
    sh.putalpha(al.filter(ImageFilter.GaussianBlur(3.5))); out.alpha_composite(sh); out.alpha_composite(p,(x,y))
    out.save(f'{outdir}/{k}.png'); out.save(f'{outdir}/{k}.webp',quality=92,method=6)
    print(k, p.size)
