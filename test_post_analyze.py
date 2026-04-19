import base64
import requests

png_b64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGMAAQAABQABDQottAAAAABJRU5ErkJggg=='
img_data = base64.b64decode(png_b64)
with open('test_image.png','wb') as f:
    f.write(img_data)

url = 'http://127.0.0.1:8000/analyze'
files = {'file': ('test_image.png', open('test_image.png','rb'), 'image/png')}
try:
    r = requests.post(url, files=files, timeout=30)
    print('STATUS', r.status_code)
    try:
        print(r.json())
    except Exception:
        print(r.text[:500])
except Exception as e:
    print('ERROR', e)
