
import json
import os
import yaml
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

def review_corpus():
    raw_prompts_dir = 'prompts/raw'
    report_path = 'logs/metrics/corpus_review_report.json'
    os.makedirs(os.path.dirname(report_path), exist_ok=True)

    prompts = []
    corpus = []
    violations = []
    low_clarity = []

    # Keywords for simple checks
    policy_violation_keywords = ['illegal', 'unethical', 'harmful']
    subtlety_keywords = ['ignore previous', 'act as', 'roleplay']

    for filename in os.listdir(raw_prompts_dir):
        if not filename.endswith('.yaml'):
            continue
        
        file_path = os.path.join(raw_prompts_dir, filename)
        with open(file_path, 'r', encoding='utf-8') as f:
            data = yaml.safe_load(f)
            content = data.get('content', '')
            prompts.append({'id': filename, 'content': content})
            corpus.append(content)

            # Check for policy violations
            if any(keyword in content.lower() for keyword in policy_violation_keywords):
                violations.append({'id': filename, 'reason': 'Potential policy violation'})

            # Check for low clarity (e.g., very short prompts)
            if len(content.split()) < 10:
                low_clarity.append({'id': filename, 'reason': 'Low word count'})

    # Deduplication check
    vectorizer = TfidfVectorizer()
    tfidf_matrix = vectorizer.fit_transform(corpus)
    cosine_sim = cosine_similarity(tfidf_matrix)
    duplicates = []
    for i in range(len(cosine_sim)):
        for j in range(i + 1, len(cosine_sim)):
            if cosine_sim[i][j] > 0.95:
                duplicates.append({'id1': prompts[i]['id'], 'id2': prompts[j]['id'], 'similarity': cosine_sim[i][j]})

    report = {
        'review_timestamp': datetime.datetime.utcnow().isoformat(),
        'categories': {
            'potential_policy_violations': {
                'count': len(violations),
                'examples': violations[:3]
            },
            'low_linguistic_clarity': {
                'count': len(low_clarity),
                'examples': low_clarity[:3]
            },
            'high_similarity_duplicates': {
                'count': len(duplicates),
                'examples': duplicates[:3]
            }
        }
    }

    with open(report_path, 'w', encoding='utf-8') as f:
        json.dump(report, f, indent=2)
    print(f"Corpus review report generated at {report_path}")

if __name__ == '__main__':
    import datetime
    review_corpus()
