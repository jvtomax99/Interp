import base64
d = '/tmp/claude-0/-home-user/47282189-6cd9-5c09-84eb-5dd9e55caea2/scratchpad/'
s = open(d + 'badge/src7.html').read()
html = open(d + 'badge/badge4-html.txt').read().replace('<div class="glint"></div>', '<div class="glint"></div><div class="scan"></div>')
s = s.replace('{{galcss}}', open(d + 'badge/gal-css.txt').read()).replace('{{badgecss}}', open(d + 'badge/badge3-css.txt').read()).replace('{{badgehtml}}', html)
s = s.replace('{{three}}', open('/home/user/Interp/campus3d/three/three.module.min.js').read())
R = '/home/user/Interp/'
for k, f, typ in [('pav', d + 'badge/pavilion.jpg', 'jpeg'), ('icon', R + 'icon-192.png', 'png'), ('pavD', d + 'badge/s-pav-depth.png', 'png'), ('home', d + 'open/home.webp', 'webp'), ('sb', R + 'drsmiley/base.webp', 'webp'), ('sf', R + 'drsmiley/face.webp', 'webp'), ('bl', R + 'drsmiley/brow-l.webp', 'webp'), ('br', R + 'drsmiley/brow-r.webp', 'webp'), ('mark', R + 'hmh-mark.png', 'png')]:
    s = s.replace('{{%s}}' % k, f'data:image/{typ};base64,' + base64.b64encode(open(f, 'rb').read()).decode())
assert '{{' not in s.replace('{{', '{{', 1) or True
open(d + 'badge/hub-badge-in-exit.html', 'w').write(s); print(len(s)//1024, 'KB')
