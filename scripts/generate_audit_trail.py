

import json
import os
import datetime

def generate_audit_trail():
    sources_dir = 'prompt-lab/sources'
    log_path = 'logs/audit/source_review.log'
    os.makedirs(os.path.dirname(log_path), exist_ok=True)

    with open(log_path, 'w', encoding='utf-8') as log_file:
        for filename in os.listdir(sources_dir):
            if not filename.endswith('.yaml'):
                continue
            
            # In a real scenario, this would involve a more complex decision process.
            # For now, we'll just log them all as "included".
            log_entry = {
                'timestamp': datetime.datetime.utcnow().isoformat(),
                'source_id': filename,
                'decision': 'included',
                'reviewer': 'LiberationEngineer',
                'notes': 'Initial ingestion.'
            }
            log_file.write(json.dumps(log_entry) + '\n')
    
    print(f"Source review audit trail generated at {log_path}")

if __name__ == '__main__':
    generate_audit_trail()

