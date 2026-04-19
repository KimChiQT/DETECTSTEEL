import urllib.request

urls = [
    'http://127.0.0.1:8000/docs',
    'http://127.0.0.1:8000/analyze',
    'http://localhost:5173/'
]

for u in urls:
    try:
        req = urllib.request.Request(u, method='GET')
        with urllib.request.urlopen(req, timeout=5) as r:
            print(u)
            print('STATUS', r.status)
            data = r.read(200)
            print(data.decode('utf-8', errors='replace')[:200])
    except Exception as e:
        print(u)
        print('ERROR', repr(e))
