from PIL import Image, ImageDraw, ImageFont
fc = Image.open('/home/user/Interp/docs/mockups/characters/nurse-current-face.png').convert('RGB')
W = fc.width // 2; drawing = fc.crop((0, 0, W - 6, fc.height)); before = fc.crop((W + 6, 0, fc.width, fc.height))
now = Image.open(f'{__import__("sys").argv[1]}/v_z_face.png').convert('RGB')
# frame "now" like the others: eyes to shoulders, same aspect
ar = drawing.width / drawing.height; nw = now.width; nh = int(nw / ar); top = int(now.height * 0.30)
now = now.crop((0, top, nw, min(now.height, top + nh)))
H = 420; ims = [i.resize((int(i.width * H / i.height), H), Image.LANCZOS) for i in (drawing, before, now)]
font = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 26)
out = Image.new('RGB', (sum(i.width for i in ims) + 80, H + 60), (236, 232, 248)); dr = ImageDraw.Draw(out); x = 20
for i, lb in zip(ims, ['Your drawing', 'Before', 'Now']):
    out.paste(i, (x, 50)); dr.text((x + 8, 12), lb, fill=(40, 40, 70), font=font); x += i.width + 20
out.save('/home/user/Interp/docs/mockups/characters/nurse-toy-face.png'); print(out.size)
