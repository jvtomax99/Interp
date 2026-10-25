# Cut the drawn poses (docs/art/dr-smiley-body/{wave,fist-pump,think,shrug,thumbs-up,crouch,jump}.png, Jose, 2026-10-23)
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
def fillsmall(m, most=1500):
    # holes filled only up to `most` px: a bigger enclosed pool is wall (between a
    # raised arm and his head, wave-in, 2026-10-24)
    h=ndi.binary_fill_holes(m)&~m; lab,n=ndi.label(h); sz=ndi.sum(h,lab,range(1,n+1))
    return m|np.isin(lab,[i+1 for i,v in enumerate(sz) if v<=most])
def key(rgb, near=20):
    bg=np.median(rgb[20:120,20:120].reshape(-1,3),0)
    if near>=20: return matte(rgb,bg)
    # a tighter key (a sleeve shaded close to the wall's grey): patches of wall then
    # read as figure, so only the one big shape, him, is kept, holes filled
    a=matte(rgb,bg,lo=near-4,hi=24,near=near); lab,n=ndi.label(a>0.5); sz=ndi.sum(a>0.5,lab,range(1,n+1))
    him=ndi.binary_fill_holes(lab==int(np.argmax(sz))+1); return np.where(him,np.maximum(a,ndi.binary_erosion(him,iterations=2)),0)
alphaM=key(M)
# What stays on screen while a drawn arm is up: the armless body and the head
# (drsmiley/body/, at rest on the master grid). Both are drawn over the back
# layer, so a back arm frame may run under them; anywhere else the frame
# itself must be solid.
def onscreen(name, box, scale=1):
    im=Image.open(OUT+name+'.webp').convert('RGBA')
    if scale!=1: im=im.resize((round(im.width*scale),round(im.height*scale)),Image.LANCZOS)
    a=np.zeros((H,W)); x,y=round(box[0]),round(box[1]); A=np.asarray(im)[...,3]/255.
    a[y:y+A.shape[0],x:x+A.shape[1]]=A[:H-y,:W-x]; return a
_rig=json.load(open(OUT+'rig.json'))
bodyA=onscreen('body',_rig['bbox']['body'])
headA=onscreen('head',_rig['head']['at'],_rig['head']['scale'])
# region: which part of the picture a pose's arms may occupy; head box excluded unless allowed
POSES={
 'wave':      dict(region=lambda: (xx<450)&(yy>300)&(yy<1100)&~((yy<578)&(xx>318)), offset=(0,0)),
 'fist-pump': dict(region=lambda: (xx<450)&(yy>300)&(yy<1100)&~((yy<578)&(xx>318)), offset=(0,0)),
 'think':     dict(region=lambda: (xx>280)&(xx<800)&(yy>488)&(yy<1000), offset=(4,0)),
 'shrug':     dict(region=lambda: (yy>540)&(yy<1100), offset=(4,0)),
 # made from the jump picture, so the legs are tucked: only the arm's band is read
 # made from the jump picture, so the legs are tucked: only the arm's band is read; its
 # sleeve lies over the coat, so coat over coat is kept here and the band kept narrow
 # (band: everything of the figure inside it, feathered, since colour cannot tell that sleeve from the coat)
 'thumbs-up': dict(region=lambda: (xx>196)&(xx<420)&(yy>496)&(yy<850)&~((yy<578)&(xx>365)), offset=(6,0), band=True, near=12),   # its sleeve is shaded nearly the wall's grey
 # both hands on a clipboard at the chest (2026-10-23, late): the clipboard is near coat-white and
 # lies over the coat, and both sleeves bend forward over it, so the whole band of the figure is
 # taken, feathered, from the collar to below the hands; it stands in for both cutout arms
 'clipboard': dict(region=lambda: (xx>262)&(xx<812)&(yy>582)&(yy<905), offset=(0,0), band=True),
 # the pointing arm (2026-10-24): straight out to the picture's left at shoulder height, the index finger out
 'point':     dict(region=lambda: (xx<445)&(yy>530)&(yy<780)&~((yy<578)&(xx>318)), offset=(0,0)),
 # the hello wave's breakdowns (2026-10-24, prompts-animation.md): the arm on its way up, elbow
 # leading and the hand trailing; then the hand tipped in toward his head and tipped out, the
 # wave's two extremes. The hand by his ear reaches nearer the head than the wave's does.
 # joint: around the shoulder everything of the figure is taken, feathered, so the raised
 # sleeve grows out of the coat instead of ending in a ragged cut where coat meets coat
 'wave-rise': dict(region=lambda: (xx<460)&(yy>520)&(yy<900)&~((yy<578)&(xx>318)), offset=(0,0), joint=(353,630,62)),
 'wave-in':   dict(region=lambda: (xx<460)&(yy>250)&(yy<1100)&~((yy<578)&(xx>318)), offset=(0,0), joint=(353,630,62)),
 'wave-out':  dict(region=lambda: (xx<460)&(yy>250)&(yy<1100)&~((yy<578)&(xx>318)), offset=(0,0), joint=(353,630,62)),
}
# A frame swung far by fsw leaves out the coat's top beside his neck and the
# shoulder's cap above the body's shoulder line, past the joint it turns about
# (`anchor`, 353,630): swung, they lifted above his shoulder as a white flap. Beside
# the body, below that line, the frame stays.
_top=np.full(W,H)
for x in range(362,556):
    y=np.argmax(bodyA[:660,x]>.5) if (bodyA[:660,x]>.5).any() else 0
    _top[x]=y if y else 0
_x0=int(np.argmax(_top[362:556]>0))+362; _top[362:_x0]=_top[_x0]   # left of the body's shoulder: its height
SHOULDER=(xx>362)&(xx<556)&(yy<_top[None,:]-3)&(yy>500)
# Only the frames swung far (fist-pump, point: about 50 and 78 degrees) lose the cap;
# the wave's frames swing 12 at most and keep the drawing's own shoulder.
ARM=lambda: (xx<556)&(yy>240)&(yy<1058)
ARMSWUNG=lambda: ARM()&~((yy<590)&(xx>385)&(xx<727))&~SHOULDER
for k in ['wave','fist-pump','point','wave-rise','wave-in','wave-out']: POSES[k]=dict(region=ARMSWUNG if k in ('fist-pump','point') else ARM, offset=POSES[k]['offset'], arm=True)
for k in ['wave','fist-pump','point','wave-rise','wave-in','wave-out']: POSES[k]['single']=True
POSES['shrug']=dict(region=lambda: (yy>240)&(yy<1058)&~((yy<590)&(xx>385)&(xx<727)), offset=POSES['shrug']['offset'], arm=True)   # both arms, the same way
# The cheer's three drawings (2026-10-24, prompts-animation.md): both arms, the load
# (fists low by his hips), the rise (fists at shoulder height) and the V (fists above
# his head, level with his hair, so the region starts higher). 1 to 2 px off the master.
for k,off in (('cheer-load',(1,0)),('cheer-mid',(2,1)),('cheer-up',(2,1))):
    POSES[k]=dict(region=lambda: (yy>150)&(yy<1058)&~((yy<590)&(xx>385)&(xx<727)), offset=off, arm=True)
POSES['cheer-up']['skinabove']=400
# The point's two drawings (2026-10-25, prompts-animation.md): the load (arm bent and
# pulled back, the hand by his shoulder, finger already out) and the reach (arm
# stretched out past the shoulder's height). Drawn in place, never swung, so each
# keeps the drawing's own shoulder, like the wave's. 4 px right and 1 down of the master.
for k in ('point-load','point-reach'): POSES[k]=dict(region=ARM, offset=(4,1), arm=True, near=12, single=True)   # the sleeve's shaded underside is nearly the wall's grey
POSES['point-reach'].update(wallleft=120, below=668)
# python3 -I cutframes.py point-load point-reach: cut only those (the others' boxes kept from poses.json)
ONLY=sys.argv[1:]
res={k:v for k,v in json.load(open(OUT+'poses.json')).items() if k not in ONLY} if ONLY else {}
for name,cfg in POSES.items():
    if ONLY and name not in ONLY: continue
    im=Image.open(D+name+'.png').convert('RGB')
    dx,dy=cfg['offset']
    fill=tuple(int(v) for v in np.median(np.asarray(im)[20:120,20:120].reshape(-1,3),0))
    if dx or dy: im=im.transform(im.size, Image.AFFINE, (1,0,-dx,0,1,-dy), Image.BICUBIC, fillcolor=fill)  # shift by (dx,dy) so it lands on the master; the edge filled with background
    P=np.asarray(im).astype(float); aP=key(P,cfg.get('near',20))
    diff=np.abs(P-M).sum(2)
    white=lambda A: (A.min(2)>140)&((A.max(2)-A.min(2))<22)   # the coat, lit or shaded (skin, scrubs and hair are coloured or dark)
    coatM=white(M)&(alphaM>0.5); coatP=white(P)&(aP>0.5)
    # content changes only: coat-white over coat-white is the same coat, shaded a little differently
    if cfg.get('arm'):
        # A single arm drawn behind the coat (2026-10-24, the navy review): the
        # sleeve and hand whole, everything of the figure on his side that the
        # body and head do not cover. The old rule (keep only what differs from
        # the master) dropped sleeve lying where the master's hanging sleeve
        # was, and that sleeve is hidden while the frame shows: holes, torn
        # edges and a notch at the shoulder, invisible on white, plain on the
        # photo. Under the body's soft edge the frame runs on (no seam); thin
        # slivers (the coat's edge a pixel past the body piece) and hair or ear
        # past the head piece are dropped: they would stay put or swing loose.
        rgbP=P; skin=(rgbP[...,0]>150)&(rgbP[...,0]>rgbP[...,1]+25)&(rgbP[...,1]>rgbP[...,2]-5)
        under=(bodyA>.9)|(headA>.35)|(ndi.binary_dilation(headA>.35,iterations=16)&~skin&(yy<590))
        under|=ndi.binary_dilation(bodyA>.5,iterations=5)&(yy>690)   # below the armpit the coat's edge is the body piece's, not the drawing's
        if cfg.get('single'):
            # a one-arm frame is also shown mirrored, on his other side, and the body is
            # not symmetric: his left shoulder edge sits 7 to 23 px further in than the
            # mirror of his right, and the mirrored frame left that sliver open, a navy
            # line along the coat from collar to armpit (2026-10-25, the point review).
            # So the frame runs on 26 px under the body's edge there: hidden on its own
            # side, filling the gap on the other.
            inner=bodyA>.9; xl=np.where(inner.any(1),inner.argmax(1),W)   # each row's outer (left) edge
            seam=inner&(xx<xl[:,None]+26)&(yy>540)&(yy<700)
            under&=~seam
        # a sleeve's shaded underside is near the wall's grey, and the key can crack
        # it open to the outside (wave-rise): narrow cracks are bridged, away from
        # the hand only (between the fingers is wall)
        fig=(aP>0.5)&cfg['region']()
        if cfg.get('skinabove'):
            # above this line the drawing has only fists, forearms and hair: anything
            # pale and colourless there is wall (cheer-up: the wall the fists shade
            # reads 30 levels darker than the rest, too far for any key)
            sat=P.max(2)-P.min(2); fig&=~((yy<cfg['skinabove'])&(sat<16)&(P.mean(2)>140))
        if cfg.get('wallleft'):
            # left of this line the drawing has only his finger: pale and colourless there is
            # wall (point-reach: the wall darkens toward the picture's edge, past the key)
            sat=P.max(2)-P.min(2); fig&=~((xx<cfg['wallleft'])&(sat<16)&(P.mean(2)>140))
        if cfg.get('below'):
            # below this line on his side is only the coat's flank the raised arm
            # uncovers, shaded too near the wall to cut clean; the body piece draws it
            fig&=~((yy>cfg['below'])&(xx<420))
        nearhand=ndi.binary_dilation(skin&fig,iterations=24)
        fig|=ndi.binary_closing(fig,iterations=5)&~nearhand&cfg['region']()
        aP=np.where(fig,np.maximum(aP,ndi.binary_erosion(fig,iterations=1)),aP)
        mask=fillsmall(fig)&~under
        mask=ndi.binary_opening(mask,iterations=3)
        lab,n=ndi.label(mask); sizes=ndi.sum(mask,lab,range(1,n+1))
        # only what joins him: the wall darkens toward a picture's edge (the cheer's), and
        # a patch of it read as figure would float beside him
        joins=np.unique(lab[ndi.binary_dilation(bodyA>.5,iterations=8)])
        mask=np.isin(lab,[i for i in np.unique(lab[620:1058]) if i and sizes[i-1]>2000 and i in joins])
        mask=ndi.binary_dilation(mask,iterations=1)&(aP>0.02)|fillsmall(mask)
        aP=np.maximum(aP,ndi.binary_erosion(mask,iterations=1))   # what was filled is solid
        soft=ndi.gaussian_filter(mask.astype(float),0.8)
    elif cfg.get('band'):
        # (holes filled: the clipboard's grey face is close enough to the wall's
        # grey that the key took its middle for background, and his scrubs showed
        # through it, 2026-10-24)
        mask=ndi.binary_fill_holes((aP>0.5)&cfg['region']())
        aP=np.maximum(aP,ndi.binary_erosion(mask,iterations=2))
        soft=ndi.gaussian_filter(mask.astype(float),6)   # a wide feather: the band's edge melts into the coat beneath
        # past the body piece nothing lies beneath to melt into: there the figure is
        # taken solid (the thumbs-up sleeve showed the background through its feather)
        solid=ndi.binary_fill_holes((aP>0.5)&cfg['region']())&(bodyA<.5)&(headA<.35)
        soft=np.maximum(soft,ndi.gaussian_filter(solid.astype(float),.8)); mask|=solid
    else:
        mask=(diff>60)&(aP>0.5)&cfg['region']()&~(coatM&coatP)
        mask=ndi.binary_opening(mask,iterations=2)
        lab,n=ndi.label(mask); sizes=ndi.sum(mask,lab,range(1,n+1))
        keep=np.isin(lab,[i+1 for i,s in enumerate(sizes) if s>1500]); mask=keep
        mask=ndi.binary_closing(mask,iterations=3)
        holes=ndi.binary_fill_holes(mask)&~mask; mask|=holes&~coatM
        mask=ndi.binary_dilation(mask,iterations=2)
        soft=ndi.gaussian_filter(mask.astype(float),1.5)
        if cfg.get('joint'):
            cx,cy,r=cfg['joint']; j=(aP>0.5)&((xx-cx)**2+(yy-cy)**2<r*r)&cfg['region']()
            mask|=j; soft=np.maximum(soft,ndi.gaussian_filter(j.astype(float),6))
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
    if ONLY and name not in ONLY: continue
    im=Image.open(D+name+'.png').convert('RGB')
    fill=tuple(int(v) for v in np.median(np.asarray(im)[20:120,20:120].reshape(-1,3),0))
    if dx or dy: im=im.transform(im.size, Image.AFFINE, (1,0,-dx,0,1,-dy), Image.BICUBIC, fillcolor=fill)
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
HIDES={'cheer-load':['l','r'],'cheer-mid':['l','r'],'cheer-up':['l','r'],'wave':['l'],'wave-rise':['l'],'wave-in':['l'],'wave-out':['l'],'fist-pump':['l'],'point-load':['l'],'point-reach':['l'],'think':['l','r'],'shrug':['l','r'],'thumbs-up':['l']}
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
names=['rest','cheer-load','cheer-mid','cheer-up','wave-rise','wave-in','wave','wave-out','fist-pump','point-load','point-reach','think','shrug','thumbs-up','crouch','jump']
sheet=Image.new('RGB',(len(names)*470,780),(255,255,255)); d=ImageDraw.Draw(sheet)
for i,n in enumerate(names):
    sheet.paste(compose(None if n=='rest' else n).convert('RGB').crop((60,0,1040,1470)).resize((460,690),Image.LANCZOS),(i*470+5,4)); d.text((i*470+200,740),n,fill=(21,28,44))
sheet.save(D+'preview-frames.png'); print('sheet',sheet.size)
