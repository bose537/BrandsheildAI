import hashlib
from collections import defaultdict
from .trusted_asset_service import official_domain


def correlate(findings, brand):
    groups = defaultdict(list)
    for finding in findings:
        finding['campaign_id'] = None
        if finding['status'] == 'SUSPICIOUS' and finding['domain'] and not official_domain(finding['domain'], brand):
            groups[finding['domain']].append(finding)
    campaigns = []
    for host, members in sorted(groups.items()):
        if len(members) < 2:
            continue
        cid = hashlib.sha256((brand['id'] + host).encode()).hexdigest()[:16]
        campaigns.append({'id':cid, 'brand_id':brand['id'], 'domain':host, 'name':'Possible coordinated impersonation', 'finding_ids':[m['id'] for m in members], 'evidence':f'{len(members)} suspicious assets targeting the same brand reference the exact hostname {host}. Shared infrastructure suggests a connection, not proven common ownership.'})
        for member in members:
            member['campaign_id'] = cid
            if member['priority'] == 'P3':
                member['priority'] = 'P2'
    return campaigns
