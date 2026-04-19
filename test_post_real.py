from PIL import Image, ImageDraw
import requests

# create a 640x480 gray image with a dark rectangle
img = Image.new('RGB', (640,480), color=(220,220,225))
d = ImageDraw.Draw(img)
d.rectangle([150,120,300,200], outline=(30,115,200), width=6)
d.rectangle([320,240,420,330], outline=(6,182,212), width=6)
img.save('test_real.jpg', 'JPEG', quality=85)

url = 'http://127.0.0.1:8000/analyze'
files = {'file': ('test_real.jpg', open('test_real.jpg','rb'), 'image/jpeg')}
try:
    r = requests.post(url, files=files, timeout=60)
    print('STATUS', r.status_code)
    try:
        print(r.json())
    except Exception:
        print(r.text[:1000])
except Exception as e:
    print('ERROR', e)
