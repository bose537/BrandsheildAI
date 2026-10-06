from urllib.parse import urlsplit


def domain(url):
    try:
        return (urlsplit(url).hostname or '').lower().rstrip('.')
    except ValueError:
        return ''


def official_domain(host, brand):
    return bool(host) and any(host == d or host.endswith('.' + d) for d in brand['domains'])


def official_match(candidate, brand):
    # Trust keys use exact identifiers, never look-alike normalization.
    if candidate['channel'] == 'social':
        return any(candidate['platform'] == a['platform'] and candidate['username'].lstrip('@').casefold() == a['username'].casefold() for a in brand['socials'])
    return any(candidate['store'] == a['store'] and candidate['package'].casefold() == a['package'].casefold() and candidate['developer'].casefold() == a['developer'].casefold() for a in brand['apps'])
