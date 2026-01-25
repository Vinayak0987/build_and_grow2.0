"""Test the Chat with Dataset feature"""
import requests
import json

BASE = 'http://localhost:5000'

# Login
r = requests.post(f'{BASE}/api/auth/login', json={'email': 'demo@inferx.ml', 'password': 'demo123'})
token = r.json().get('access_token')
print(f'[1] LOGIN: {"PASS" if token else "FAIL"}')

if token:
    h = {'Authorization': f'Bearer {token}', 'Content-Type': 'application/json'}
    
    # Get datasets
    ds = requests.get(f'{BASE}/api/datasets/', headers=h)
    datasets = ds.json().get('datasets', [])
    print(f'\n[2] Found {len(datasets)} datasets')
    
    if datasets:
        dataset_id = datasets[0]['id']
        print(f'Testing with dataset: {datasets[0]["name"]}')
        
        # Test Questions
        questions = [
            "What are the columns in this dataset?",
            "What is the minimum price?",
            "Show me unique products",
            "Give me a summary of the data"
        ]
        
        for i, q in enumerate(questions):
            print(f'\n[{i+3}] Question: "{q}"')
            print('-' * 50)
            chat = requests.post(
                f'{BASE}/api/datasets/{dataset_id}/chat',
                json={'question': q},
                headers=h
            )
            if chat.status_code == 200:
                result = chat.json()
                answer = result.get('answer', 'No answer')
                # Truncate long answers
                if len(answer) > 300:
                    answer = answer[:300] + '...'
                print(f'Answer: {answer}')
                if result.get('insights'):
                    print(f'Insights: {result["insights"]}')
            else:
                print(f'Error: {chat.status_code} - {chat.text}')
    else:
        print('No datasets found to test with')
        
print('\n=== CHAT TEST COMPLETE ===')
