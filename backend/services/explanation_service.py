QUESTIONS = ['Why was this flagged?', 'Show strongest evidence', 'Is this an official asset?', 'Why is the publisher suspicious?', 'What should I investigate next?', 'What is this connected to?']


def answer(finding, question, campaigns):
    if question == QUESTIONS[0]:
        return finding['explanation']
    if question == QUESTIONS[1]:
        positive = [s for s in finding['signals'] if s['points'] > 0]
        return '\n'.join(f'{s["label"]}: +{s["points"]}. {s["detail"]}' for s in sorted(positive, key=lambda x:-x['points'])[:3]) or finding['explanation']
    if question == QUESTIONS[2]:
        return 'Exact registered identity match. Verified against Trusted Digital Twin.' if finding['status'] == 'TRUSTED' else 'This is not an exact registered official asset. An absence from the registry alone does not establish malicious intent.'
    if question == QUESTIONS[3]:
        return next((s['detail'] for s in finding['signals'] if s['key'] == 'publisher'), 'No publisher-mismatch evidence was used in this finding.')
    if question == QUESTIONS[4]:
        return finding['action']
    return next((c['evidence'] for c in campaigns if c['id'] == finding['campaign_id']), 'No evidenced campaign relationship was found. Similar names alone do not create graph edges.')
