import os
import json
import yaml

def extract_prompts():
    repos_dir = 'prompt-lab/repos'
    raw_prompts_dir = 'prompts/raw'
    os.makedirs(raw_prompts_dir, exist_ok=True)

    for repo_name in os.listdir(repos_dir):
        repo_path = os.path.join(repos_dir, repo_name)
        if not os.path.isdir(repo_path):
            continue

        for root, _, files in os.walk(repo_path):
            for file in files:
                if file.endswith(('.txt', '.md', '.json')):
                    file_path = os.path.join(root, file)
                    with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                        content = f.read()

                    prompt_data = {
                        'source_repo': repo_name,
                        'original_path': file_path,
                        'line_count': len(content.splitlines()),
                        'content': content,
                    }

                    output_filename = f"{repo_name}_{os.path.splitext(file)[0]}.yaml"
                    output_path = os.path.join(raw_prompts_dir, output_filename)
                    with open(output_path, 'w', encoding='utf-8') as f:
                        yaml.dump(prompt_data, f)

if __name__ == '__main__':
    extract_prompts()
