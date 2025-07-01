import json
import hashlib
import os

def verify_prompts():
    index_path = 'prompts/index.json'
    with open(index_path, 'r', encoding='utf-8') as f:
        index = json.load(f)

    for entry in index:
        prompt_id = entry['prompt_id']
        raw_prompt_path = os.path.join('prompts/raw', f"{prompt_id}.yaml")
        with open(raw_prompt_path, 'r', encoding='utf-8') as f:
            import yaml
            prompt_data = yaml.safe_load(f)
            content = prompt_data.get('content', '')
            hash = hashlib.sha256(content.encode('utf-8')).hexdigest()
            if hash != entry['hash']:
                print(f"Verification failed for prompt: {prompt_id}")

if __name__ == '__main__':
    verify_prompts()
