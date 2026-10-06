from .lookalike_detector import similarity, brand_used
from .trusted_asset_service import official_match, domain, official_domain
from .visual_detector import compare

WEIGHTS = {'identity': 30, 'brand_usage': 12, 'publisher': 20, 'logo': 18, 'keywords': 10, 'domain': 20}
WORDS = ('official', 'support', 'help', 'verify', 'security', 'customer care', 'reward', 'giveaway', 'claim', 'login', 'payment', 'account')
CREDENTIAL_WORDS = ('password', 'otp', 'verify', 'login', 'credential')


def analyze(candidate, brand, allowlisted=False):
    social = candidate['channel'] == 'social'
    refs = [brand['name']] + brand['variations']
    names = refs + ([a['username'] for a in brand['socials']] if social else [a['name'] for a in brand['apps']])
    identity = max(similarity(candidate['username'] if social else candidate['name'], names), similarity(candidate['name'], refs))
    prose = candidate['bio'] if social else candidate['description']
    text = ' '.join([candidate['username'], candidate['name'], prose]).lower()
    publisher_known = candidate['developer'].casefold() in [p.casefold() for p in brand['publishers']] if not social else False
    visual = compare(candidate['logo'], brand.get('logo', ''))
    host = domain(candidate['url'])
    related = identity >= 72 or brand_used(text, refs) or (visual is not None and visual >= 90)
    trusted = official_match(candidate, brand)
    signals = []

    def add(key, label, points, detail):
        signals.append({'key':key, 'label':label, 'points':points, 'detail':detail})

    if trusted or allowlisted:
        add('trusted', 'Registered official identity' if trusted else 'Analyst allowlist', 0,
            'Verified against Trusted Digital Twin.' if trusted else 'Excluded by stored analyst false-positive feedback for this exact asset.')
    else:
        if identity >= 72:
            add('identity', 'Identity similarity', round(WEIGHTS['identity'] * identity / 100), f'{identity}% normalized similarity. Comparison uses character distance and known service suffixes.')
        if related and brand_used(prose, refs):
            add('brand_usage', 'Brand identity in metadata', WEIGHTS['brand_usage'], 'The bio or description separately contains the brand name or a registered variation.')
        if related and not social and not publisher_known:
            add('publisher', 'Unrecognized publisher', WEIGHTS['publisher'], f'“{candidate["developer"]}” is not in the registered publisher list. This is a mismatch, not proof of fraud.')
        if related and visual is not None and visual >= 90:
            add('logo', 'Similar logo structure', WEIGHTS['logo'], f'{visual}% average-hash bit agreement; a weak visual heuristic, not a probability of copying.')
        hits = [w for w in WORDS if w in text]
        if related and hits:
            add('keywords', 'Support or promotion terminology', min(WEIGHTS['keywords'], len(hits)*5), 'Matched: ' + ', '.join(hits) + '. Keywords only support other evidence.')
        if related and host and not official_domain(host, brand):
            add('domain', 'Non-official linked domain', WEIGHTS['domain'], f'{host} is outside the registered domain boundaries.')
        if len(signals) == 1 and signals[0]['points'] > 19:
            add('single_signal_cap', 'Single-signal safeguard', 19-signals[0]['points'], 'One signal alone is capped at very low risk.')
        total = sum(s['points'] for s in signals)
        if total > 100:
            add('score_cap', 'Maximum score adjustment', 100-total, 'Risk is capped at 100; contributions still sum exactly.')
    risk = sum(s['points'] for s in signals)
    severity = 'Very low' if risk < 20 else 'Low' if risk < 40 else 'Medium' if risk < 60 else 'High' if risk < 80 else 'Critical'
    fields = ['username', 'name', 'bio', 'url', 'logo'] if social else ['name', 'developer', 'description', 'package', 'url', 'logo']
    coverage = sum(bool(candidate.get(f)) for f in fields) / len(fields)
    support = min(1, sum(identity/100 if s['key']=='identity' else visual/100 if s['key']=='logo' else s['points']/WEIGHTS['keywords'] if s['key']=='keywords' else 1 for s in signals if s['points'] > 0)/4)
    confidence = round(100*(.6*coverage + .4*support))
    if trusted:
        confidence = 100
    if allowlisted and not trusted:
        confidence = 100
    status = 'TRUSTED' if trusted else 'ALLOWLISTED' if allowlisted else 'SUSPICIOUS' if risk >= 20 else 'REVIEW' if related else 'NO MATCH'
    credential = related and any(w in text for w in CREDENTIAL_WORDS) and host and not official_domain(host, brand)
    threat = 'Registered official asset' if trusted else 'Analyst false positive' if allowlisted else 'Potential credential lure' if credential and risk >= 40 else 'Potential app impersonation' if not social and risk >= 20 else 'Potential support impersonation' if 'support' in text and risk >= 20 else 'Potential brand impersonation' if risk >= 20 else 'Insufficient evidence' if related else 'No brand match'
    priority = 'P1' if risk >= 80 or (credential and risk >= 60) else 'P2' if risk >= 60 else 'P3' if risk >= 20 else 'P4'
    action = 'Compare the exact platform and handle, preserve profile metadata, and prepare a platform impersonation report if confirmed.' if social else 'Verify the package and publisher against the official store listing; preserve listing metadata and prepare an abuse report if confirmed.'
    if trusted or allowlisted:
        action = 'No threat escalation. Review the registry or analyst decision if the observed identity changes.'
    explanation = 'Verified against Trusted Digital Twin.' if trusted else 'Excluded by analyst feedback; the original incident evidence remains available.' if allowlisted else ' '.join(s['detail'] for s in signals if s['points'] > 0) or 'No sufficiently strong brand-impersonation evidence was found in the supplied metadata.'
    return {'candidate':candidate, 'risk':risk, 'severity':severity, 'status':status, 'confidence':confidence, 'confidence_basis':f'Evidence coverage {coverage:.0%}; strength-weighted signal support {support:.0%}. 60% coverage + 40% signal support. Registry/allowlist matches use 100% match confidence. This is not a calibrated probability.', 'similarity':identity, 'visual_similarity':visual, 'publisher_known':publisher_known, 'signals':signals, 'threat':threat, 'priority':priority, 'explanation':explanation, 'action':action, 'domain':host, 'campaign_id':None}
