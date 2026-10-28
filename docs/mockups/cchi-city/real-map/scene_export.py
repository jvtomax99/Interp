# Step 2: osm.json to scene.json, the back of the campus in the live diorama's own units, fitted to its hand-built front.
#   python3 scene_export.py   (needs shapely: pip install shapely; writes scene.json and scene-check.png beside it)
# The fit: the map is turned 112 deg so Prospect Ave runs across the front, 9 m to a unit, then scaled 2.1 and moved so the
# drive's mouth, Jurist and Medical Plaza land on the diorama's (about 4.3 m to a diorama unit). FRONT is what the diorama
# already builds by hand: map buildings and streets inside it are clipped away.
import json, math, os, random
HERE = os.path.dirname(os.path.abspath(__file__))
from shapely.geometry import Polygon, LineString, Point, box as sbox, MultiPolygon
from shapely.ops import unary_union
d=json.load(open(os.path.join(HERE, 'osm.json')))
th=math.radians(112); S9=1/9.0; s=2.1
def R(p):  # map meters -> real-layout units (9 m) -> live diorama units
    x,y=p; X=(x*math.cos(th)-y*math.sin(th))*S9; Z=-(x*math.sin(th)+y*math.cos(th))*S9
    return (round((X-0.55)*s-0.1,2), round(15-(22-Z)*s,2))
X0,X1,Z0,Z1=-43.0,41.0,-77.0,19.3
BOARD=sbox(X0,Z0,X1,Z1)
# the live front: what it already builds (its own buildings, street, drive, lot, lawns, entrance plaza), kept as is
FRONT=unary_union([
  sbox(-20,12.0,20,19.3),                 # street, sidewalk, verge (across the old board's width)
  sbox(-6,-9.0,6,13),                     # the drive and its medians
  sbox(-13.2,-9.2,13.2,-6.0),             # the drop-off in front of Ethics
  sbox(-6.2,-17.2,6.2,-9.6),              # Ethics (Link Pavilion, the live one)
  sbox(-12.8,-3.4,-5.6,6.6),              # US Systems (Jurist)
  sbox(5.6,-4.0,19.2,8.2),                # Culture (Medical Plaza) and its colonnade
  sbox(-19.2,6.0,-5.4,13.2),              # the surface lot and lawn on the left
  sbox(5.4,7.6,18.6,13.0),                # the café lawn on the right
  sbox(6.0,-12.6,8.8,-9.8),               # the ambulance bay
]).buffer(0.4)
LIVE_KEYS={'8887','8884','8885'}           # built by the live front
DOM={'8888':('t',9),'8895':('n',5)}
FLOORS={'8905':5,'8907':3,'8902':4,'8899':6,'8894':4,'8889':3,'8890':2,'8891':2,'8892':3,'8914':6,'8886':5,'8893':6}
blds=[]
for b in d['buildings']:
    sid=b['id'][-4:]
    if sid in LIVE_KEYS: continue
    P=[R(p) for p in b['pts']]
    if P[0]==P[-1]: P=P[:-1]
    pg=Polygon(P).buffer(0)
    if not BOARD.intersects(pg) or BOARD.intersection(pg).area<0.6*pg.area: continue
    q=pg.difference(FRONT)
    if q.is_empty: continue
    parts=list(q.geoms) if isinstance(q,MultiPolygon) else [q]
    parts=[p for p in parts if p.area>3.0]
    if not parts: continue
    p=max(parts,key=lambda g:g.area).simplify(0.05)
    if p.area<0.5*pg.area and sid not in DOM: 
        if p.area<8: continue
    garage=b['b']=='parking' or 'Parking' in (b['name'] or ''); hosp=b['b']=='hospital'
    key,fl=DOM.get(sid,('x'+sid,FLOORS.get(sid,3 if hosp else 2)))
    if not hosp and not garage: fl=3 if pg.area>100 else 2
    pts=[[round(x,2),round(z,2)] for x,z in list(p.exterior.coords)[:-1]]
    a=sum(pts[i][0]*pts[(i+1)%len(pts)][1]-pts[(i+1)%len(pts)][0]*pts[i][1] for i in range(len(pts)))
    if a<0: pts=pts[::-1]
    blds.append(dict(id=sid,key=key,name=b['name'],kind='garage' if garage else 'hosp' if hosp else 'house',floors=fl,pts=pts,poly=Polygon(pts),clipped=round(1-p.area/pg.area,2)))
for b in blds:
    if b['clipped']>0.02: print('clipped',b['id'],b['name'],b['clipped'])
allU=unary_union([b['poly'] for b in blds])
for b in blds:
    others=unary_union([o['poly'] for o in blds if o is not b]+[FRONT.buffer(-0.4)])
    P=b['pts'];fl=[]
    for i in range(len(P)):
        ax,az=P[i];bx,bz=P[(i+1)%len(P)];L=math.hypot(bx-ax,bz-az)
        if L<1.2: fl.append(0);continue
        nx,nz=(bz-az)/L,-(bx-ax)/L
        if b['poly'].contains(Point((ax+bx)/2+nx*.3,(az+bz)/2+nz*.3)): nx,nz=-nx,-nz
        fl.append(0 if others.contains(Point((ax+bx)/2+nx*.3,(az+bz)/2+nz*.3)) else 1)
    b['win']=fl
    rp=b['poly'].representative_point(); b['lab']=[round(rp.x,2),round(rp.y,2)]
    if b['key'][0]!='x':
        o=b['poly'].buffer(0.9,join_style=1).simplify(0.05); i=b['poly'].buffer(0.45,join_style=1).simplify(0.05)
        b['halo']=[[[round(x,2),round(z,2)] for x,z in list(g.exterior.coords)[:-1]] for g in (o,i)]
# roads: the real ones, minus Prospect (the live street runs across the front) and anything inside the live front
W={'secondary':3.0,'tertiary':2.6,'residential':2.0,'service':1.25,'footway':0.6}
roads=[]
for r in d['roads']:
    if r['hw'] not in W or r['name']=='Prospect Avenue': continue
    ls=LineString([R(p) for p in r['pts']]).intersection(BOARD).difference(FRONT)
    parts=[ls] if ls.geom_type=='LineString' else list(getattr(ls,'geoms',[]))
    for g in parts:
        if g.is_empty or g.length<1.0 or g.geom_type!='LineString': continue
        roads.append(dict(name=r['name'],hw=r['hw'],w=W[r['hw']],pts=[[round(x,2),round(z,2)] for x,z in g.coords]))
roadU=unary_union([LineString(r['pts']).buffer(r['w']/2) for r in roads if r['hw']!='footway'])
# lots
lots=[]
for a in d['areas']:
    t=a['tags']
    if t.get('amenity')=='parking' and t.get('parking')!='multi-storey':
        pg=Polygon([R(p) for p in a['pts']]).buffer(0)
        q=pg.intersection(BOARD).difference(FRONT)
        if q.geom_type=='Polygon' and q.area>8 and not any(b['poly'].intersection(q).area>0.5*q.area for b in blds):
            lots.append([[round(x,2),round(z,2)] for x,z in list(q.exterior.coords)[:-1]])
# aprons (paving round the hospital buildings), kept off the live front
B=[b for b in blds if b['kind']!='house']
ap=unary_union([b['poly'].buffer(1.5,join_style=2) for b in B]).difference(FRONT).intersection(BOARD.buffer(-0.3)).simplify(0.08)
geoms=[g for g in (ap.geoms if isinstance(ap,MultiPolygon) else [ap]) if g.area>2]
R2=lambda a:[[round(x,2),round(z,2)] for x,z in a]
aprons=[[R2(list(g.exterior.coords)[:-1])]+[R2(list(h.coords)[:-1]) for h in g.interiors] for g in geoms]
# trees: street trees along the back roads, lawn trees in the open, none in the live front
random.seed(7); pts=[]
taken=unary_union([allU.buffer(1.4),roadU.buffer(0.7),FRONT.buffer(0.6),sbox(-60,12.2,60,16.6)]+[Polygon(l).buffer(1) for l in lots])
inner=BOARD.buffer(-1.6)
def free(c,sep): return inner.contains(c) and not taken.contains(c) and all(c.distance(o)>sep for o in pts)
for r in roads:
    if r['hw'] in('footway','service'): continue
    ls=LineString(r['pts']); k=1.0
    while k<ls.length:
        p=ls.interpolate(k); q=ls.interpolate(min(ls.length,k+0.2)); dx,dz=q.x-p.x,q.y-p.y; L=math.hypot(dx,dz) or 1
        for sg in(-1,1):
            c=Point(p.x-dz/L*(r['w']/2+1.6)*sg,p.y+dx/L*(r['w']/2+1.6)*sg)
            if free(c,3.6): pts.append(c)
        k+=4.6
street=len(pts)
grid=[(X0+i*3.2+random.uniform(-1,1),Z0+j*3.2+random.uniform(-1,1)) for i in range(int((X1-X0)/3.2)) for j in range(int((Z1-Z0)/3.2))]
random.shuffle(grid)
for x,z in grid:
    c=Point(x,z)
    if free(c,3.4) and random.random()<0.8: pts.append(c)
# the verge along Prospect beyond the live front's ends
for x in [v/10 for v in range(-415,400,45)]:
    if -21<x<21 or abs(x+35.5)<3 or abs(x-32.5)<3: continue
    c=Point(x,17.4)
    if not taken.contains(c): pts.append(c)
trees=[]
for c in pts:
    r=random.random(); trees.append([round(c.x,2),round(c.y,2),round(1.0+random.random()*0.5,2),'round' if r<.5 else 'red' if r<.7 else 'cone' if r<.88 else 'blossom'])
print('trees street',street,'total',len(trees))
# paths: back traffic lanes and sidewalks (Atlantic, 2nd Street, Essex)
RD=roads
def chain(name):
    segs=[LineString(r['pts']) for r in RD if r['name']==name]
    from shapely.ops import linemerge
    m=linemerge(segs); 
    return list(max(m.geoms,key=lambda g:g.length).coords) if m.geom_type=='MultiLineString' else list(m.coords)
def lane(pts,off):
    g=LineString(pts).offset_curve(off); c=list(g.coords) if g.geom_type=='LineString' else list(max(g.geoms,key=lambda q:q.length).coords)
    return R2(c)
paths={};walks={}
for nm,key in [('2nd Street','second'),('Atlantic Street','atl'),('Essex Street','essex')]:
    c=chain(nm); print(nm,len(c),c[0],c[-1])
    paths[key+'A']=lane(c,0.65); paths[key+'B']=lane(c[::-1],0.65)
    walks[key+'L']=lane(c,-2.1); walks[key+'R']=lane(c,2.1)
# open spots for the garden
free_area=inner.difference(unary_union([taken]))
spots=[]
for x in range(int(X0),int(X1)):
    for z in range(int(Z0),int(Z1)):
        c=Point(x+.5,z+.5)
        if free_area.contains(c): spots.append((free_area.boundary.distance(c),x+.5,z+.5))
spots.sort(reverse=True); top=[]
for sp in spots:
    if all(math.hypot(sp[1]-t[1],sp[2]-t[2])>10 for t in top): top.append(sp)
    if len(top)>=5: break
print('spots',top)
cars={'lots':[],'roofs':{}}
def rows(poly,gap=1.25,row=2.7,margin=0.8):
    pg=Polygon(poly).buffer(-margin)
    if pg.is_empty: return []
    c=list(pg.minimum_rotated_rectangle.exterior.coords); e1=(c[1][0]-c[0][0],c[1][1]-c[0][1]); e2=(c[2][0]-c[1][0],c[2][1]-c[1][1])
    if math.hypot(*e1)<math.hypot(*e2): e1,e2=e2,e1
    L1=math.hypot(*e1); u=(e1[0]/L1,e1[1]/L1); v=(-u[1],u[0]); ang=math.atan2(v[0],v[1]); cx,cz=pg.centroid.x,pg.centroid.y; out=[]
    for j in range(-30,31):
        for i in range(-80,81):
            x=cx+u[0]*i*gap+v[0]*j*row; z=cz+u[1]*i*gap+v[1]*j*row
            if pg.contains(Point(x,z).buffer(0.6)) and (i*7+j*3)%5!=0: out.append([round(x,2),round(z,2),round(ang,3)])
    return out
for l in lots: cars['lots']+=rows(l)
for b in blds:
    if b['kind']=='garage': cars['roofs'][b['key']]=rows(b['pts'],margin=1.0)
print('cars',len(cars['lots']),{k:len(v) for k,v in cars['roofs'].items()})
out=dict(board=[X0,X1,Z0,Z1],blds=[{k:v for k,v in b.items() if k!='poly'} for b in blds],roads=roads,lots=lots,aprons=aprons,trees=trees,paths=paths,walks=walks,spots=[t[1:] for t in top],cars=cars)
json.dump(out,open(os.path.join(HERE, 'scene.json'),'w'),separators=(',',':'))
print(len(blds),'buildings',len(roads),'roads',len(json.dumps(out,separators=(',',':')))//1024,'KB')
for b in blds:
    if b['kind']!='house': print(b['key'],b['name'],b['floors'],'lab',b['lab'])
# picture for a sanity check
import matplotlib; matplotlib.use('Agg'); import matplotlib.pyplot as plt
fig,ax=plt.subplots(figsize=(10,11))
for g in (FRONT.geoms if hasattr(FRONT,'geoms') else [FRONT]): ax.fill(*g.exterior.xy,color='#7fb3ff',alpha=.4)
for b in blds:
    x,z=b['poly'].exterior.xy; ax.fill(x,z,'#c0504d' if b['kind']=='hosp' else '#999' if b['kind']=='garage' else '#d9b38c',alpha=.7,ec='k',lw=.4)
    if b['kind']!='house': ax.text(*b['lab'],(b['name'] or b['id'])[:18],fontsize=6,ha='center')
for r in roads: ax.plot([p[0] for p in r['pts']],[p[1] for p in r['pts']],'-',color='#335' if r['hw']!='footway' else '#aaa',lw=r['w']*1.2)
ax.plot([c[0] for c in trees],[c[1] for c in trees],'g.',ms=4)
ax.add_patch(plt.Rectangle((X0,Z0),X1-X0,Z1-Z0,fill=False,ec='r'))
ax.set_aspect('equal'); ax.invert_yaxis(); plt.savefig(os.path.join(HERE, 'scene-check.png'),dpi=90,bbox_inches='tight')
