import requests
import json

def crawl_huggingface():
    tags = ['jailbreak', 'prompt']
    results = []
    for tag in tags:
        url = f"https://huggingface.co/api/spaces?filter={tag}"
        response = requests.get(url)
        if response.status_code == 200:
            spaces = response.json()
            for space in spaces:
                results.append({
                    'id': space['id'],
                    'url': f"https://huggingface.co/spaces/{space['id']}",
                    'tags': [tag]
                })
    
    with open('huggingface_sources.json', 'w') as f:
        json.dump(results, f, indent=2)

if __name__ == '__main__':
    crawl_huggingface()
