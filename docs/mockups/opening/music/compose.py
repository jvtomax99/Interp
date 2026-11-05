# Draft 2: softer, warmer. Harp rolling arpeggios, soft piano, solo violin, warm low strings. Original. Seamless loop.
# Renders opening/music-1.m4a (docs/features/opening.md, "Music"): python3 -I compose.py loop.wav,
# then ffmpeg -i loop.wav -af volume=<to -16 LUFS> -c:a aac -b:a 96k music-1.m4a. Pure numpy, no samples.
import numpy as np, wave, sys
SR=44100; BPM=68; BEAT=60/BPM; BARS=8; L=BARS*4*BEAT
rng=np.random.default_rng(11)
N=lambda s: {'C':0,'C#':1,'D':2,'D#':3,'E':4,'F':5,'F#':6,'G':7,'G#':8,'A':9,'A#':10,'B':11}[s[:-1]]+12*(int(s[-1])+1)
hz=lambda m: 440*2**((m-69)/12)
T=int(L*SR); buf=np.zeros((2,T*3))
def put(sig,t,pan):
  i=int(t*SR)%T+T
  for off in (-T,0,T):
    j=i+off; a=max(0,j); b=min(buf.shape[1],j+len(sig))
    if b<=a: continue
    s=sig[a-j:b-j]; buf[0,a:b]+=s*np.cos((pan+1)*np.pi/4); buf[1,a:b]+=s*np.sin((pan+1)*np.pi/4)
def piano(m,dur,vel):
  f=hz(m); n=int((dur+3)*SR); t=np.arange(n)/SR; s=np.zeros(n)
  for k in range(1,9):
    fk=f*k*np.sqrt(1+0.0003*k*k)
    if fk>5000: break
    s+=np.sin(2*np.pi*fk*t+rng.random())*np.exp(-t*(0.5+0.6*k)*(f/260)**0.3)/k**2.0
  env=np.minimum(1,t/0.010); rel=np.clip(1-(t-dur)/0.6,0,1)
  return s*env*np.maximum(rel,0.15*np.exp(-np.maximum(t-dur,0)*1.5))*vel*0.30
def harp(m,vel):
  f=hz(m); n=int(3.5*SR); t=np.arange(n)/SR; s=np.zeros(n)
  for k,a in ((1,1),(2,.45),(3,.18),(4,.08),(5,.04)):
    s+=a*np.sin(2*np.pi*f*k*t+rng.random())*np.exp(-t*(1.1+1.4*(k-1)))
  return s*np.minimum(1,t/0.003)*vel*0.16
def pad(m,dur,vel):  # warm low strings (viola/cello section)
  f=hz(m); n=int((dur+2)*SR); t=np.arange(n)/SR; s=np.zeros(n)
  for d in (-6,-2,3,7):
    ff=f*2**(d/1200)*(1+0.002*np.sin(2*np.pi*4.7*t+rng.random()*6)); ph=2*np.pi*np.cumsum(ff)/SR
    for k in range(1,7):
      if f*k>2500: break
      s+=np.sin(k*ph+rng.random()*6)/k**2.2
  att=np.clip(t/1.6,0,1)**2; rel=np.clip(1-(t-dur)/1.8,0,1)
  return s*att*rel*vel*0.020
def violin(notes,t0,vel):
  # one legato bowed line: notes=[(midi,beats)], glides between notes, delayed vibrato, body resonances
  durs=[d*BEAT for _,d in notes]; tot=sum(durs)+1.2; n=int(tot*SR); t=np.arange(n)/SR
  f=np.zeros(n); amp=np.zeros(n); vibd=np.zeros(n); pos=0
  for (m,_),d in zip(notes,durs):
    a=int(pos*SR); b=int((pos+d)*SR); f[a:b]=hz(m)
    lt=np.arange(b-a)/SR
    amp[a:b]=np.minimum(1,lt/0.18)*(0.85+0.15*np.sin(np.pi*np.minimum(lt/d,1)))  # bow swell
    vibd[a:b]=np.clip((lt-0.25)/0.4,0,1)
    pos+=d
  e=int(pos*SR); f[e:]=f[e-1]; amp[e:]=amp[e-1]*np.exp(-np.arange(n-e)/SR/0.25)
  k=int(0.06*SR); f=np.convolve(np.log(f),np.ones(k)/k,'same'); f=np.exp(f); f[:k]=f[k]; f[-k:]=f[-k-1]  # portamento
  amp=np.convolve(amp,np.ones(k)/k,'same')
  f=f*(1+0.0045*vibd*np.sin(2*np.pi*5.4*t))
  ph=2*np.pi*np.cumsum(f)/SR; s=np.zeros(n)
  body=lambda x: 1/(1+((x-480)/250)**2)+0.7/(1+((x-1000)/350)**2)+0.35/(1+((x-2600)/700)**2)
  for kk in range(1,14):
    fk=f*kk; w=body(fk)/kk**0.9; w[fk>7000]=0
    s+=np.sin(kk*ph)*w
  s+=rng.normal(0,0.02,n)*amp  # a breath of bow noise
  return s*amp*vel*0.07
hum=lambda: rng.normal(0,0.008)
chords=[('E2',['E3','B3','G#4']),('C#2',['C#3','G#3','E4']),('A1',['A2','E3','C#4']),('B1',['B2','F#3','D#4']),
        ('G#1',['G#2','D#3','B3']),('C#2',['C#3','G#3','E4']),('F#1',['F#2','C#3','A3']),('B1',['B2','F#3','A3'])]
mel=[[('G#5',2),('F#5',1),('E5',1)],[('B4',3),('C#5',1)],[('E5',1.5),('F#5',.5),('G#5',1),('B5',1)],[('A5',2),('G#5',1),('F#5',1)],
     [('D#5',2),('E5',1),('F#5',1)],[('G#5',1.5),('F#5',.5),('E5',2)],[('C#5',1),('E5',1),('A5',2)],[('G#5',2),('F#5',2)]]
for b,(root,ch) in enumerate(chords):
  t0=b*4*BEAT
  put(pad(N(root)+12,4*BEAT,0.9),t0,-0.2); put(pad(N(ch[1]),4*BEAT,0.6),t0+0.05,0.3); put(pad(N(ch[2]),4*BEAT,0.45),t0+0.1,-0.4)
  # harp: a rolling arpeggio up and back in eighths, over two octaves
  up=[N(ch[0]),N(ch[1]),N(ch[2]),N(ch[0])+12,N(ch[1])+12,N(ch[2])+12,N(ch[1])+12,N(ch[0])+12]
  for k,m in enumerate(up): put(harp(m,0.55+0.1*(k==0)+rng.normal(0,.04)),t0+k*BEAT/2+hum(),-0.5+0.12*k)
  if b<4:
    tt=t0
    for nm,d in mel[b]: put(piano(N(nm),d*BEAT,0.5+rng.normal(0,.03)),tt+hum(),0.15); tt+=d*BEAT
  else:  # soft piano answers under the violin, an octave down, on the downbeats
    put(piano(N(ch[2])+12,2*BEAT,0.32),t0+hum(),0.2); put(piano(N(ch[1])+12,2*BEAT,0.26),t0+2*BEAT+hum(),0.2)
put(violin([(N(n),d) for bb in mel[4:] for n,d in bb],4*16*BEAT/4,0.9),16*BEAT,0.1)
# the violin enters a bar early with a pickup, holding B4 under the piano
put(violin([(N('B4'),1),(N('C#5'),0.9)],0,0.5),14*BEAT,0.1)
ir_n=int(3.6*SR); ti=np.arange(ir_n)/SR
def ir():
  x=rng.normal(0,1,ir_n)*np.exp(-ti*1.9); k=np.ones(13)/13
  for _ in range(3): x=np.convolve(x,k,'same')
  x[:int(0.025*SR)]=0; return x/np.sqrt((x**2).sum())
from numpy.fft import rfft, irfft
def conv(a,h):
  n=len(a)+len(h); n2=1<<(n-1).bit_length(); return irfft(rfft(a,n2)*rfft(h,n2),n2)[:len(a)]
wet=np.stack([conv(buf[0],ir()),conv(buf[1],ir())]); out=(0.65*buf+0.6*wet)[:,T:2*T]
out=np.tanh(out/np.abs(out).max()*1.1)/np.tanh(1.1)*0.70
w=wave.open(sys.argv[1],'wb'); w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((out.T*32767).astype(np.int16).tobytes()); w.close()
print('loop seconds',round(L,2))
