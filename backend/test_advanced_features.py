"""
Test script for Chat with Dataset and Synthetic Data features
"""
import requests
import json

BASE_URL = 'http://localhost:5000'

def test_features():
    # First login to get a token
    login_url = f'{BASE_URL}/api/auth/login'
    login_data = {'email': 'demo@inferx.ml', 'password': 'demo123'}

    try:
        login_resp = requests.post(login_url, json=login_data)
        print('=== LOGIN TEST ===')
        print(f'Status: {login_resp.status_code}')
        login_result = login_resp.json()
        token = login_result.get('access_token')
        print(f'Token obtained: {"Yes" if token else "No"}')
        
        if not token:
            print(f'Login failed: {login_result}')
            return
        
        headers = {'Authorization': f'Bearer {token}', 'Content-Type': 'application/json'}
        
        # Get datasets first
        print('\n=== GETTING DATASETS ===')
        datasets_resp = requests.get(f'{BASE_URL}/api/datasets', headers=headers)
        datasets = datasets_resp.json().get('datasets', [])
        print(f'Found {len(datasets)} datasets')
        
        if datasets:
            dataset_id = datasets[0]['id']
            print(f'Using dataset ID: {dataset_id} ({datasets[0]["name"]})')
            
            # Test Chat with Dataset
            print('\n=== CHAT WITH DATASET TEST ===')
            chat_url = f'{BASE_URL}/api/datasets/{dataset_id}/chat'
            chat_data = {'question': 'What are the main trends in this dataset?'}
            chat_resp = requests.post(chat_url, json=chat_data, headers=headers)
            print(f'Status: {chat_resp.status_code}')
            chat_result = chat_resp.json()
            print(f'Success: {chat_result.get("success", False)}')
            if chat_result.get('answer'):
                answer = chat_result['answer']
                print(f'Answer (first 300 chars): {answer[:300]}...' if len(answer) > 300 else f'Answer: {answer}')
            else:
                print(f'Response: {json.dumps(chat_result, indent=2)[:500]}')
        else:
            print('No datasets found, skipping chat test')
        
        # Test Synthetic Data Generation
        print('\n=== SYNTHETIC DATA TEST ===')
        synth_url = f'{BASE_URL}/api/synthetic/generate'
        synth_data = {
            'mode': 'custom',
            'custom_schema': 'Generate customer data with: name, email, age (18-65), city, purchase_amount',
            'num_rows': 100,
            'quality': 'balanced'
        }
        synth_resp = requests.post(synth_url, json=synth_data, headers=headers)
        print(f'Status: {synth_resp.status_code}')
        synth_result = synth_resp.json()
        print(f'Success: {synth_result.get("success", False)}')
        print(f'Rows Generated: {synth_result.get("rows_generated", 0)}')
        print(f'Columns: {synth_result.get("columns_count", 0)}')
        print(f'Quality Score: {synth_result.get("quality_score", 0)}%')
        if synth_result.get('preview'):
            print(f'Preview Columns: {synth_result["preview"].get("columns", [])}')
            rows = synth_result["preview"].get("rows", [[]])
            if rows:
                print(f'Sample Row (first 5 values): {rows[0][:5]}')
        
        print('\n' + '='*50)
        print('=== TEST SUMMARY ===')
        print('='*50)
        print('✓ Login: SUCCESS')
        print(f'✓ Chat with Dataset: Status {chat_resp.status_code}')
        print(f'✓ Synthetic Data: Status {synth_resp.status_code}')
        print(f'  - Generated {synth_result.get("rows_generated", 0)} rows')
        print(f'  - Quality Score: {synth_result.get("quality_score", 0)}%')
        print('='*50)
        
    except Exception as e:
        print(f'Error: {e}')
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    test_features()
