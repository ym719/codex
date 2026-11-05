"""Generate original vector paintings for the studio; no external image assets."""
from pathlib import Path
import random

OUT = Path(__file__).resolve().parent.parent / 'public' / 'studio'
OUT.mkdir(exist_ok=True)

def painting(name, night=False):
    rng = random.Random(216 if night else 81)
    colors = (['#28385f','#556298','#9b87b1','#d6b2a2','#697eac'] if night else ['#efba79','#f4d69a','#f6dba8','#e39f85','#edc68d'])
    parts=['<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="900" viewBox="0 0 1200 900"><defs><filter id="canvas"><feTurbulence type="fractalNoise" baseFrequency=".65" numOctaves="3" stitchTiles="stitch"/><feColorMatrix type="saturate" values="0"/><feComponentTransfer><feFuncA type="linear" slope=".17"/></feComponentTransfer><feBlend in="SourceGraphic" mode="multiply"/></filter></defs><g filter="url(#canvas)">']
    def area(idx,path,base,palette,count,bounds):
        parts.append(f'<defs><clipPath id="p{idx}"><path d="{path}"/></clipPath></defs><path d="{path}" fill="{base}"/><g clip-path="url(#p{idx})">')
        x0,y0,x1,y1=bounds
        for i in range(count):
            x=rng.uniform(x0,x1);y=rng.uniform(y0,y1);w=rng.uniform(9,56);h=rng.uniform(3,13)
            color=rng.choice(palette)
            parts.append(f'<path d="M{x:.0f} {y:.0f}q{w/2:.0f} {-h:.0f} {w:.0f} {-h/3:.0f}" fill="none" stroke="{color}" stroke-width="{h:.1f}" stroke-linecap="square" opacity="{rng.uniform(.25,.85):.2f}"/>')
        parts.append('</g>')
    area(0,'M0 0H1200V900H0Z', colors[0], colors, 700,(0,0,1200,650))
    parts.append(f'<circle cx="{880 if night else 890}" cy="{170 if night else 180}" r="{65 if night else 77}" fill="{"#f7dba0" if night else "#f4df93"}"/>')
    area(1,'M0 410Q100 300 280 380L410 295L585 375L745 300L910 340L1055 263L1200 310V700H0Z','#667a99' if night else '#718ba3',['#566d9d','#8c9faf','#8594af','#a08dab'],390,(0,290,1200,650))
    area(2,'M0 475Q280 390 480 465T880 460T1200 430V900H0Z','#3d7886' if night else '#67a5a1',['#3f878c','#7fb7a3','#488f9a','#9fc1ad','#ddc18d'],500,(0,440,1200,900))
    area(3,'M0 580Q220 538 460 666T840 691Q1010 616 1200 690V900H0Z','#c46b5d' if night else '#d9884f',['#dd9f55','#e4b15b','#c86a49','#e3a277','#efbb80','#af6a58'],360,(0,560,1200,900))
    area(4,'M0 718Q240 625 466 760T860 773T1200 734V900H0Z','#6a684a' if night else '#879451',['#556b51','#818644','#b2a655','#9eaa67','#5b8260'],320,(0,660,1200,900))
    # Cypress trees and pine crowns form the energetic foreground.
    parts.append('<path d="M139 900L178 570L190 224Q219 336 224 485L257 716L236 900Z" fill="#253d4c"/><path d="M185 890L206 480L201 310" stroke="#576a5d" stroke-width="12" fill="none"/>')
    for i in range(130):
        y=rng.uniform(350,890); center=196+(y-350)*.01; x=rng.uniform(center-(y-250)*.065,center+(y-250)*.065)
        parts.append(f'<path d="M{x:.0f} {y:.0f}l{rng.randint(-9,9)} -{rng.randint(12,38)}" stroke="{rng.choice(["#334d55","#456253","#3b5970","#627b65"])}" stroke-width="{rng.randint(3,8)}"/>')
    parts.append('<path d="M1010 900Q1001 650 1054 465M1040 665L940 526M1023 738L1134 608" stroke="#384e4d" stroke-width="23" fill="none"/>')
    for cx,cy,rx,ry in [(1040,435,145,100),(920,500,100,85),(1120,560,135,87),(1000,570,110,100)]:
        parts.append(f'<ellipse cx="{cx}" cy="{cy}" rx="{rx}" ry="{ry}" fill="#355b5c"/>')
        for i in range(115):
            dx=rng.uniform(-rx,rx);dy=rng.uniform(-ry,ry)
            if (dx/rx)**2+(dy/ry)**2>1: continue
            parts.append(f'<path d="M{cx+dx:.0f} {cy+dy:.0f}l{rng.randint(8,30)} -{rng.randint(2,13)}" stroke="{rng.choice(["#416f60","#6d8c68","#527e6e","#8d9e71","#345a64"])}" stroke-width="{rng.randint(5,15)}"/>')
    # Loose flowers and signature color accents.
    for i in range(65):
        x=rng.randint(290,930); y=rng.randint(770,900)
        parts.append(f'<path d="M{x} {y}l-3 -14" stroke="#485e49" stroke-width="3"/><ellipse cx="{x-3}" cy="{y-14}" rx="{rng.randint(3,7)}" ry="4" fill="{rng.choice(["#b7443d","#edc65d","#e39976","#e9c195"])}"/>')
    parts.append('</g></svg>')
    (OUT/name).write_text(''.join(parts))

painting('sunlit-garden.svg')
painting('moonlit-garden.svg',True)
# A second, more graphic Fauvist still life balances the landscape.
(OUT/'wild-flowers.svg').write_text('''<svg xmlns="http://www.w3.org/2000/svg" width="650" height="820" viewBox="0 0 650 820"><defs><filter id="paper"><feTurbulence type="fractalNoise" baseFrequency=".6" numOctaves="3" stitchTiles="stitch"/><feColorMatrix type="saturate" values="0"/><feComponentTransfer><feFuncA type="linear" slope=".2"/></feComponentTransfer><feBlend in="SourceGraphic" mode="multiply"/></filter></defs><g filter="url(#paper)"><path fill="#e68c68" d="M0 0h650v820H0z"/><path d="M0 0H90V820H0Z" fill="#d06857"/><path d="M485 0H650V820H485Z" fill="#ebaa76"/><path d="M0 620L650 575V820H0Z" fill="#d9b154"/><ellipse cx="324" cy="732" rx="182" ry="28" fill="#9b6a50"/><path d="M233 499Q327 474 412 499L392 704Q321 758 256 705Z" fill="#335688"/><path d="M251 504Q271 622 277 716" stroke="#577fa5" stroke-width="20" fill="none"/><ellipse cx="323" cy="499" rx="91" ry="25" fill="#203f66"/><g fill="none" stroke="#315448" stroke-width="10"><path d="M325 503Q276 337 185 204M320 505Q352 304 395 132M340 500Q389 351 485 278M310 502Q204 397 136 404M334 499Q260 226 289 145"/></g><g fill="#507953"><path d="M303 437Q207 420 196 335Q293 339 303 437Z"/><path d="M338 410Q330 309 419 325Q409 383 338 410Z"/><path d="M270 333Q200 325 221 249Q266 264 270 333Z"/><path d="M354 311Q309 250 347 213Q380 259 354 311Z"/></g><g fill="#c93f37" stroke="#ac3a39" stroke-width="3"><path d="M185 204Q114 218 118 167Q114 116 165 142Q196 80 223 129Q283 111 263 159Q274 217 218 208Q204 250 185 204Z"/><path d="M394 147Q343 161 339 119Q331 81 374 91Q399 38 421 83Q469 66 460 108Q475 146 432 160Q408 188 394 147Z"/></g><g fill="#edc44b"><path d="M474 282Q429 300 427 259Q411 225 452 226Q463 179 488 215Q528 195 527 233Q563 257 524 281Q506 321 474 282Z"/><path d="M279 157Q244 170 239 139Q221 108 255 102Q263 60 290 86Q323 66 331 104Q364 123 331 143Q315 182 279 157Z"/></g><g fill="#443746"><circle cx="194" cy="166" r="23"/><circle cx="401" cy="118" r="20"/><circle cx="482" cy="251" r="18"/><circle cx="284" cy="126" r="16"/></g><path d="M127 410Q78 406 93 373Q99 344 127 358Q158 330 168 365Q198 383 171 406Q154 437 127 410Z" fill="#eee0b3"/><circle cx="142" cy="387" r="13" fill="#c28047"/></g></svg>''')
print('Original studio illustrations generated.')
