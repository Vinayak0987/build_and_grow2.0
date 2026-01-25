"""Test the new schema suggestion feature"""
import requests
import json

BASE = 'http://localhost:5000'

# Login
r = requests.post(f'{BASE}/api/auth/login', json={'email': 'demo@inferx.ml', 'password': 'demo123'})
token = r.json().get('access_token')
print(f'[1] LOGIN: {"PASS" if token else "FAIL"}')

if token:
    h = {'Authorization': f'Bearer {token}', 'Content-Type': 'application/json'}
    
    # Test Schema Suggestion
    print('\n[2] SCHEMA SUGGESTION TEST')
    print('=' * 40)
    desc = 'sales data for a grocery store with products, quantity, price, and date'
    suggest = requests.post(f'{BASE}/api/synthetic/suggest-schema', json={'description': desc}, headers=h)
    print(f'Status: {suggest.status_code}')
    sr = suggest.json()
    print(f'Success: {sr.get("success")}')
    print(f'Description: {sr.get("description")}')
    print('Generated Schema:')
    for field in sr.get('schema', []):
        print(f'  - {field["name"]}: {field["type"]}', end='')
        if 'min' in field:
            print(f' (min: {field["min"]}, max: {field["max"]})', end='')
        if 'values' in field:
            print(f' (values: {field["values"][:3]}...)', end='')
        print()
    
    # Test generating with parsed schema
    print('\n[3] GENERATE WITH PARSED SCHEMA')
    print('=' * 40)
    config = {
        'mode': 'custom',
        'num_rows': 50,
        'quality': 'balanced',
        'parsed_schema': sr.get('schema')
    }
    gen = requests.post(f'{BASE}/api/synthetic/generate', json=config, headers=h)
    print(f'Status: {gen.status_code}')
    gr = gen.json()
    print(f'Success: {gr.get("success")}')
    print(f'Rows: {gr.get("rows_generated")}')
    print(f'Columns: {gr.get("columns_count")}')
    print(f'Quality Score: {gr.get("quality_score")}%')
    if gr.get('preview', {}).get('rows'):
        print(f'Sample Row: {gr["preview"]["rows"][0]}')
    
print('\n=== TESTS COMPLETE ===')
