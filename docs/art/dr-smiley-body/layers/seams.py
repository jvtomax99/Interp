from PIL import Image, ImageFilter
import numpy as np
SRC='/home/user/Interp/docs/art/dr-smiley-body/body-master.png'
rgb=np.array(Image.open(SRC).convert('RGB')).astype(float)
H,W,_=rgb.shape
gray=rgb.mean(2)
bg=np.array([210,209,211.])
d=np.abs(rgb-bg).sum(2)
alpha=np.clip((d-8)/24,0,1)
fig=alpha>0.5
skin=(rgb[:,:,0]>rgb[:,:,1]+18)&(rgb[:,:,0]>rgb[:,:,2]+30)&(rgb[:,:,0]>150)

def track(seedx, seedy, y0, y1, side):
    """follow the dark seam valley row by row; side=-1 left arm (arm is x<seam), +1 right"""
    xs={}
    x=seedx
    for y in list(range(seedy, y1+1))+list(range(seedy-1, y0-1, -1)):
        if y==seedy-1: x=xs[seedy]
        lo,hi=x-10,x+10
        seg=gray[y,lo:hi+1]
        # smooth a bit
        k=np.convolve(seg,[.25,.5,.25],'same')
        nx=lo+int(np.argmin(k[1:-1]))+1
        x=int(round(0.6*x+0.4*nx))
        xs[y]=x
    return xs

CUFF={'L':928,'R':928}
SEAM_TOP={'L':612,'R':612}
seamL=track(392,780,SEAM_TOP['L'],CUFF['L'],-1)
seamR=track(700,780,SEAM_TOP['R'],CUFF['R'],+1)
# smooth seams
def smooth(xs):
    ys=sorted(xs); v=np.array([xs[y] for y in ys],float)
    v=np.convolve(np.pad(v,8,'edge'),np.ones(17)/17,'valid')
    return dict(zip(ys,v))
seamL=smooth(seamL); seamR=smooth(seamR)
print('seamL', {y:round(seamL[y]) for y in range(612,929,40)})
print('seamR', {y:round(seamR[y]) for y in range(612,929,40)})

armL=np.zeros((H,W),bool); armR=np.zeros((H,W),bool)
INSET=3  # keep the shadow valley with the arm side? no: push cut toward torso by INSET so the valley goes with the arm
for y in range(SEAM_TOP['L'], 1075):
    row=fig[y]
    if y<=CUFF['L']:
        xl=int(seamL[y])+INSET; xr=int(seamR[y])-INSET
    else:
        # below the cuff: the hand. inner edge of skin on each side
        sk=np.nonzero(skin[y]&row)[0]
        left=sk[sk<W//2]; right=sk[sk>W//2]
        xl=left.max()+1 if len(left) else 0
        xr=right.min()-1 if len(right) else W
    armL[y,:xl]=row[:xl]; armR[y,xr+1:]=row[xr+1:]
np.save('alpha.npy',alpha); np.save('armL.npy',armL); np.save('armR.npy',armR)
import json; json.dump({'seamL':{str(k):v for k,v in seamL.items()},'seamR':{str(k):v for k,v in seamR.items()}},open('seams.json','w'))
# visualise
vis=rgb.copy()
vis[armL]=vis[armL]*[1,.6,.6]; vis[armR]=vis[armR]*[.6,.6,1]
Image.fromarray(vis.astype(np.uint8)).crop((200,540,880,1100)).resize((510,420)).save('vis-arms.png')
