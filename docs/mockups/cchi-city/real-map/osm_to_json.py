# Step 1: the OpenStreetMap export (map.osm.xml) to plain outlines in meters around the map's centre: osm.json.
#   python3 osm_to_json.py   (run from this folder; writes osm.json and osm-check.png beside it)
import sys, os, json, math, xml.etree.ElementTree as ET
import matplotlib; matplotlib.use('Agg'); import matplotlib.pyplot as plt
HERE = os.path.dirname(os.path.abspath(__file__))
r=ET.parse(os.path.join(HERE, 'map.osm.xml')).getroot()
b=r.find('bounds'); lat0=(float(b.get('minlat'))+float(b.get('maxlat')))/2; lon0=(float(b.get('minlon'))+float(b.get('maxlon')))/2
N={n.get('id'):(float(n.get('lon')),float(n.get('lat'))) for n in r.findall('node')}
k=111320*math.cos(math.radians(lat0))
xy=lambda p:((p[0]-lon0)*k,(p[1]-lat0)*110540)
W={}
for w in r.findall('way'):
    t={x.get('k'):x.get('v') for x in w.findall('tag')}
    pts=[xy(N[nd.get('ref')]) for nd in w.findall('nd') if nd.get('ref') in N]
    W[w.get('id')]=(t,pts)
fig,ax=plt.subplots(figsize=(14,14))
out={'buildings':[],'roads':[],'areas':[]}
for wid,(t,pts) in W.items():
    if not pts: continue
    xs=[p[0] for p in pts]; ys=[p[1] for p in pts]
    if 'building' in t:
        c='#c0504d' if t['building']=='hospital' else ('#888' if t.get('amenity')=='parking' or t['building']=='parking' else '#d9b38c')
        ax.fill(xs,ys,c,alpha=.6,ec='k',lw=.5)
        cx=sum(xs)/len(xs); cy=sum(ys)/len(ys)
        ax.text(cx,cy,(t.get('name','')[:28]+'\n' if t.get('name') else '')+wid[-4:],fontsize=6,ha='center')
        out['buildings'].append({'id':wid,'name':t.get('name'),'b':t['building'],'lv':t.get('building:levels'),'h':t.get('height'),'pts':[[round(x,1),round(y,1)] for x,y in pts]})
    elif 'highway' in t:
        ax.plot(xs,ys,'-',lw={'secondary':4,'tertiary':3,'residential':2}.get(t['highway'],1),color='#335' if t['highway'] not in('footway','service') else '#99a')
        if t.get('name'): ax.text(xs[len(xs)//2],ys[len(ys)//2],t['name'],fontsize=7,color='blue')
        out['roads'].append({'id':wid,'name':t.get('name'),'hw':t['highway'],'oneway':t.get('oneway')=='yes','pts':[[round(x,1),round(y,1)] for x,y in pts]})
    elif t:
        ax.plot(xs,ys,':',lw=1,color='g')
        if t.get('name'): ax.text(sum(xs)/len(xs),sum(ys)/len(ys),t['name'],fontsize=6,color='g')
        out['areas'].append({'id':wid,'tags':t,'pts':[[round(x,1),round(y,1)] for x,y in pts]})
bx=[(float(b.get('minlon'))-lon0)*k,(float(b.get('maxlon'))-lon0)*k]; by=[(float(b.get('minlat'))-lat0)*110540,(float(b.get('maxlat'))-lat0)*110540]
ax.plot([bx[0],bx[1],bx[1],bx[0],bx[0]],[by[0],by[0],by[1],by[1],by[0]],'r--')
ax.set_aspect('equal'); ax.grid(alpha=.3); ax.set_xlim(bx[0]-60,bx[1]+60); ax.set_ylim(by[0]-60,by[1]+60)
plt.savefig(os.path.join(HERE, 'osm-check.png'),dpi=110,bbox_inches='tight')
json.dump(out,open(os.path.join(HERE, 'osm.json'),'w'))
print(bx,by)
