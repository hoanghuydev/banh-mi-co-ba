"""Ghép dải 4 ô từ ô của nhiều dải (chuẩn hoá chiều cao): ghep-o.py ra.png a.png:1 b.png:2 a.png:3 b.png:4"""
import sys
import numpy as np
from PIL import Image
def cells(im):
    a=np.asarray(im.convert('L'))<240
    cols=a.any(axis=0); xs=[]; x=0; W=len(cols)
    while x<W:
        if cols[x]:
            s=x
            while x<W and cols[x]: x+=1
            if x-s>15: xs.append((s,x))
        else: x+=1
    # merge tiny gaps until 4
    while len(xs)>4:
        g=[xs[i+1][0]-xs[i][1] for i in range(len(xs)-1)]; i=int(np.argmin(g)); xs[i:i+2]=[(xs[i][0],xs[i+1][1])]
    assert len(xs)==4, xs
    return xs
out=sys.argv[1]; parts=[]
for spec in sys.argv[2:]:
    p,i=spec.rsplit(':',1); im=Image.open(p).convert('RGB'); xs=cells(im); s,e=xs[int(i)-1]
    parts.append(im.crop((max(0,s-10),0,min(im.width,e+10),im.height)))
def fig(p):
    a=np.asarray(p.convert('L'))<240; ys=np.nonzero(a.any(axis=1))[0]; xs=np.nonzero(a.any(axis=0))[0]
    return p.crop((xs[0],ys[0],xs[-1]+1,ys[-1]+1))
parts=[fig(p) for p in parts]
th=int(np.median([p.height for p in parts]))
parts=[p.resize((round(p.width*th/p.height),th),Image.LANCZOS) for p in parts]
H=th+40; cw=max(p.width for p in parts)+40
c=Image.new('RGB',(cw*4,H),'white')
for k,p in enumerate(parts): c.paste(p,(k*cw+(cw-p.width)//2,H-20-p.height))
c.save(out); print(c.size,[Image.open(s.rsplit(':',1)[0]).size for s in sys.argv[2:]])
