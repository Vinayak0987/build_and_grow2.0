"""Simple test for advanced features"""
import requests

BASE = 'http://localhost:5000'

# Login
r = requests.post(f'{BASE}/api/auth/login', json={'email': 'demo@inferx.ml', 'password': 'demo123'})
token = r.json().get('access_token')
print(f'[1] LOGIN: {"PASS" if token else "FAIL"}')

if token:
    h = {'Authorization': f'Bearer {token}', 'Content-Type': 'application/json'}
    
    # Get datasets
    ds = requests.get(f'{BASE}/api/datasets', headers=h).json().get('datasets', [])
    print(f'[2] DATASETS: Found {len(ds)} datasets')
    
    # Test Chat (only if datasets exist)
    if ds:
        did = ds[0]['id']
        print(f'    Using dataset: {ds[0]["name"]} (ID: {did})')
        chat = requests.post(f'{BASE}/api/datasets/{did}/chat', json={'question': 'Summarize this dataset'}, headers=h)
        print(f'[3] CHAT: Status {chat.status_code}')
        cr = chat.json()
        if cr.get('answer'):
            print(f'    Answer: {cr["answer"][:150]}...')
        elif cr.get('success'):
            print(f'    Success: True')
        else:
            print(f'    Response: {cr}')
    
    # Test Synthetic
    synth = requests.post(f'{BASE}/api/synthetic/generate', json={
        'mode': 'custom',
        'custom_schema': 'customer: name, email, age, city',
        'num_rows': 50,
        'quality': 'fast'
    }, headers=h)
    print(f'[4] SYNTHETIC: Status {synth.status_code}')
    sr = synth.json()
    if sr.get('success'):
        print(f'    Generated: {sr.get("rows_generated")} rows, {sr.get("columns_count")} columns')
        if sr.get('preview', {}).get('rows'):
            print(f'    Sample: {sr["preview"]["rows"][0]}')
    else:
        print(f'    Error: {sr}')

print('\n=== TESTS COMPLETE ===')
