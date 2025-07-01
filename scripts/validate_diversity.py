import json
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import os

def validate_diversity():
    index_path = 'prompts/index.json'
    with open(index_path, 'r', encoding='utf-8') as f:
        index = json.load(f)

    prompts = [entry['prompt_id'] for entry in index]
    corpus = []
    for entry in index:
        raw_prompt_path = os.path.join('prompts/raw', f"{entry['prompt_id']}.yaml")
        with open(raw_prompt_path, 'r', encoding='utf-8') as f:
            import yaml
            prompt_data = yaml.safe_load(f)
            corpus.append(prompt_data.get('content', ''))

    vectorizer = TfidfVectorizer()
    tfidf_matrix = vectorizer.fit_transform(corpus)
    cosine_sim = cosine_similarity(tfidf_matrix, tfidf_matrix)

    flagged_for_review = set()
    for i in range(len(cosine_sim)):
        for j in range(i + 1, len(cosine_sim)):
            if cosine_sim[i][j] > 0.9:
                flagged_for_review.add(prompts[i])
                flagged_for_review.add(prompts[j])

    report = {
        'total_prompts': len(prompts),
        'flagged_for_review': len(flagged_for_review),
        'flagged_prompts': list(flagged_for_review),
    }

    os.makedirs('logs/metrics', exist_ok=True)
    report_path = 'logs/metrics/diversity_audit.json'
    with open(report_path, 'w', encoding='utf-8') as f:
        json.dump(report, f, indent=2)

if __name__ == '__main__':
    validate_diversity()
