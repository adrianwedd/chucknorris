import os
import json
import yaml
import hashlib

def build_index():
    raw_prompts_dir = 'prompts/raw'
    index_path = 'prompts/index.json'
    index = []

    for filename in os.listdir(raw_prompts_dir):
        if not filename.endswith('.yaml'):
            continue

        file_path = os.path.join(raw_prompts_dir, filename)
        with open(file_path, 'r', encoding='utf-8') as f:
            prompt_data = yaml.safe_load(f)

        prompt_id = os.path.splitext(filename)[0]
        content = prompt_data.get('content', '')
        word_count = len(content.split())
        hash = hashlib.sha256(content.encode('utf-8')).hexdigest()

        index_entry = {
            'prompt_id': prompt_id,
            'repo': prompt_data.get('source_repo'),
            'language': 'en',  # Placeholder
            'tags': [],  # Placeholder
            'word_count': word_count,
            'hash': hash,
        }
        index.append(index_entry)

    with open(index_path, 'w', encoding='utf-8') as f:
        json.dump(index, f, indent=2)

if __name__ == '__main__':
    build_index()
