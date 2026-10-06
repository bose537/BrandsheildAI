import base64
import re
from typing import Literal
from urllib.parse import urlsplit
from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator


def clean_url(value):
    value = value.strip()
    if not value:
        return value
    try:
        parsed = urlsplit(value)
        if parsed.scheme not in ('http', 'https') or not parsed.hostname or parsed.username or parsed.password:
            raise ValueError()
        _ = parsed.port
        if any(c.isspace() for c in value) or '.' not in parsed.hostname:
            raise ValueError()
    except ValueError:
        raise ValueError('Enter an absolute http(s) URL, without credentials.')
    return value


def image_value(value):
    if not value:
        return ''
    if len(value) > 1_400_000 or not re.match(r'^data:image/(png|jpeg|webp);base64,', value):
        raise ValueError('Use a PNG, JPEG or WebP image under 1 MB.')
    try:
        base64.b64decode(value.split(',', 1)[1], validate=True)
    except Exception:
        raise ValueError('Invalid image data.')
    return value


class Model(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True, extra='forbid')


class SocialIdentity(Model):
    platform: Literal['Instagram', 'X', 'Facebook', 'LinkedIn'] = 'Instagram'
    username: str = Field(min_length=1, max_length=100)

    @field_validator('username')
    @classmethod
    def handle(cls, v):
        v = v.lstrip('@').lower()
        if not v or '/' in v or any(c.isspace() for c in v):
            raise ValueError('Use a handle, without spaces or a URL.')
        return v


class OfficialApp(Model):
    name: str = Field(min_length=1, max_length=120)
    store: Literal['Google Play', 'Apple App Store'] = 'Google Play'
    package: str = Field(min_length=1, max_length=180)
    developer: str = Field(min_length=1, max_length=120)


class Brand(Model):
    name: str = Field(min_length=2, max_length=120)
    website: str
    logo: str = ''
    domains: list[str] = Field(default_factory=list, max_length=30)
    socials: list[SocialIdentity] = Field(default_factory=list, max_length=30)
    apps: list[OfficialApp] = Field(default_factory=list, max_length=30)
    publishers: list[str] = Field(default_factory=list, max_length=30)
    keywords: list[str] = Field(default_factory=list, max_length=30)
    variations: list[str] = Field(default_factory=list, max_length=30)

    _website = field_validator('website')(clean_url)
    _logo = field_validator('logo')(image_value)

    @model_validator(mode='after')
    def validate_registry(self):
        if not self.website:
            raise ValueError('An official website is required.')
        host = urlsplit(self.website).hostname.lower()
        domains = [host] + [x.strip().lower() for x in self.domains if x.strip()]
        if any(not re.fullmatch(r'[a-z0-9.-]+\.[a-z]{2,63}', x) or '..' in x for x in domains):
            raise ValueError('Domains must be hostnames such as example.com, without a path.')
        self.domains = list(dict.fromkeys(domains))
        for items in ([f'{x.platform}:{x.username}' for x in self.socials], [f'{x.store}:{x.package.lower()}' for x in self.apps]):
            if len(set(items)) != len(items):
                raise ValueError('Duplicate trusted assets are not allowed.')
        self.publishers = list(dict.fromkeys([x.strip() for x in self.publishers if x.strip()] + [x.developer for x in self.apps]))
        self.keywords = [x.strip()[:120] for x in self.keywords if x.strip()]
        self.variations = [x.strip()[:120] for x in self.variations if x.strip()]
        return self


class Candidate(Model):
    brand_id: str
    channel: Literal['social', 'app']
    platform: Literal['Instagram', 'X', 'Facebook', 'LinkedIn'] = 'Instagram'
    username: str = Field(default='', max_length=100)
    name: str = Field(default='', max_length=120)
    bio: str = Field(default='', max_length=5000)
    url: str = Field(default='', max_length=2000)
    store: Literal['Google Play', 'Apple App Store'] = 'Google Play'
    package: str = Field(default='', max_length=180)
    developer: str = Field(default='', max_length=120)
    description: str = Field(default='', max_length=5000)
    logo: str = ''
    _url = field_validator('url')(clean_url)
    _logo = field_validator('logo')(image_value)

    @model_validator(mode='after')
    def required_fields(self):
        self.username = self.username.lstrip('@')
        if self.channel == 'social' and (not self.username or '/' in self.username or any(x.isspace() for x in self.username)):
            raise ValueError('A social handle without spaces or a URL is required.')
        if self.channel == 'app' and (not self.name or not self.developer):
            raise ValueError('App name and developer are required.')
        return self


STATUSES = Literal['New', 'Investigating', 'Confirmed', 'Escalated', 'Monitoring', 'Resolved', 'False Positive']


class IncidentCreate(Model):
    finding_id: str


class IncidentUpdate(Model):
    status: STATUSES
    notes: str = Field(default='', max_length=10000)


class Feedback(Model):
    reason: str = Field(min_length=3, max_length=2000)


class Scan(Model):
    brand_id: str
