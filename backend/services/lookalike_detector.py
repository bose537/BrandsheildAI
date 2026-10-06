import re
import unicodedata
from rapidfuzz.fuzz import ratio

# A small, inspectable mapping; not a complete Unicode spoofing detector.
SUBSTITUTIONS = str.maketrans({'0':'o','1':'i','3':'e','4':'a','5':'s','7':'t','а':'a','е':'e','о':'o','р':'p','с':'c','х':'x','і':'i'})
ADDITIONS = ('official', 'support', 'help', 'verify', 'security', 'customercare', 'reward', 'rewards', 'giveaway', 'claim', 'login', 'payment', 'account', 'pro', 'plus', 'app', 'store', 'team')


def normalize(value):
    value = unicodedata.normalize('NFKC', value).casefold().translate(SUBSTITUTIONS)
    return ''.join(c for c in value if c.isalnum())


def similarity(value, references):
    candidate = normalize(value)
    if not candidate:
        return 0
    best = 0
    for reference in references:
        ref = normalize(reference)
        if not ref:
            continue
        best = max(best, ratio(candidate, ref))
        # Added service words are supported without rewarding arbitrary substring matches.
        remainder = candidate
        for word in sorted(ADDITIONS, key=len, reverse=True):
            remainder = remainder.replace(word, '')
        if remainder:
            best = max(best, ratio(remainder, ref))
    return round(best, 1)


def brand_used(text, references):
    text = unicodedata.normalize('NFKC', text).casefold().translate(SUBSTITUTIONS)
    return any(re.search(r'(?<!\w)' + re.escape(ref.casefold()) + r'(?!\w)', text) for ref in references if ref)
