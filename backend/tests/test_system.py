import pytest
from fastapi.testclient import TestClient
from backend.main import app
from backend.models import Candidate
from backend.services.lookalike_detector import similarity
from backend.services.risk_engine import analyze
from backend.services.trusted_asset_service import official_domain


@pytest.fixture
def client(tmp_path,monkeypatch):
    monkeypatch.setenv('BRANDSHIELD_DB',str(tmp_path/'test.db'))
    with TestClient(app) as c:
        yield c


def brand(client):
    return client.get('/api/brands').json()[0]


def candidate(b,**kwargs):
    return Candidate(brand_id=b['id'],channel='social',username='northstar_support_verify',name='Northstar',bio='Official support. Verify login password',url='https://rewards-check.example',**kwargs).model_dump()


def test_health_and_brand_creation(client):
    assert client.get('/api/health').json()['status']=='ok'
    r=client.post('/api/brands',json={'name':'Acme','website':'https://acme.example','socials':[{'username':'acme'}]})
    assert r.status_code==201
    assert client.get('/api/brands/'+r.json()['id']).json()['domains']==['acme.example']


def test_official_social_exact_platform_required(client):
    b=brand(client)
    c=candidate(b);c['username']='NORTHSTAR'
    f=client.post('/api/analyze/social',json=c).json()
    assert (f['status'],f['risk'])==('TRUSTED',0)
    c['platform']='Facebook'
    assert client.post('/api/analyze/social',json=c).json()['status']!='TRUSTED'


def test_official_app_identifier_and_developer(client):
    b=brand(client)
    c=Candidate(brand_id=b['id'],channel='app',name='Northstar',developer='Northstar Labs',package='com.northstar.mobile').model_dump()
    assert analyze(c,b)['status']=='TRUSTED'
    assert analyze(c,b)['risk']==0
    c['package']='com.unregistered.app'
    assert analyze(c,b)['status']!='TRUSTED'
    c['package']='com.northstar.mobile';c['developer']='Fake Publisher'
    assert analyze(c,b)['status']!='TRUSTED'


@pytest.mark.parametrize('value',['n0rthst4r','northstar_support_verify','northsta','north_star','north-star','north star','nоrthstar'])
def test_lookalike_variations(value):
    assert similarity(value,['Northstar'])>=85


def test_social_detection_and_explainability(client):
    b=brand(client);c=candidate(b)
    f=client.post('/api/analyze/social',json=c).json()
    assert f['status']=='SUSPICIOUS' and f['risk']>=60
    assert sum(s['points'] for s in f['signals'])==f['risk']
    assert f['threat']=='Potential credential lure'
    assert f['explanation']


def test_publisher_mismatch_changes_score(client):
    b=brand(client)
    c=Candidate(brand_id=b['id'],channel='app',name='Northstar Rewards',developer='Unknown',description='Official Northstar reward login',url='https://rewards-check.example').model_dump()
    f=analyze(c,b);c['developer']='Northstar Labs';known=analyze(c,b)
    assert f['risk']-known['risk']==20
    assert f['status']=='SUSPICIOUS' and f['risk']>=60
    assert known['status']!='TRUSTED'


def test_unrelated_not_penalized(client):
    b=brand(client)
    for channel in ['social','app']:
        c=Candidate(brand_id=b['id'],channel=channel,username='garden_diary',name='Garden Diary',developer='Garden Tools',description='Support and login for gardeners',bio='Help with plants',url='https://garden.example').model_dump()
        f=analyze(c,b)
        assert f['risk']==0 and f['status']=='NO MATCH'


def test_single_signal_cap_and_missing_evidence(client):
    b=brand(client)
    c=Candidate(brand_id=b['id'],channel='social',username='n0rthst4r').model_dump()
    f=analyze(c,b)
    assert f['risk']==19
    assert f['confidence']<50
    assert sum(s['points'] for s in f['signals'])==19


def test_demo_idempotent_bounds_and_determinism(client):
    b=brand(client);q={'brand_id':b['id']}
    client.post('/api/demo/scan',json=q)
    first=client.get('/api/findings',params=q).json()
    client.post('/api/demo/scan',json=q)
    second=client.get('/api/findings',params=q).json()
    assert len(first)==len(second)==26
    assert {f['id']:f['risk'] for f in first}=={f['id']:f['risk'] for f in second}
    assert all(0<=f['risk']<=100 and 0<=f['confidence']<=100 for f in first)
    assert all(sum(s['points'] for s in f['signals'])==f['risk'] for f in first)
    assert sum(f['status']=='TRUSTED' for f in first)==2


def test_correlation_requires_shared_domain(client):
    b=brand(client);c=candidate(b)
    first=client.post('/api/analyze/social',json=c).json()
    q={'brand_id':b['id']}
    assert client.get('/api/campaigns',params=q).json()==[]
    c['username']='northstar_rewards';c['url']='https://different.example'
    client.post('/api/analyze/social',json=c)
    assert client.get('/api/campaigns',params=q).json()==[]
    c['url']='https://rewards-check.example/path'
    client.post('/api/analyze/social',json=c)
    campaign=client.get('/api/campaigns',params=q).json()[0]
    assert first['id'] in campaign['finding_ids'] and len(campaign['finding_ids'])==2
    graph=client.get('/api/graph',params=q).json();ids={n['id'] for n in graph['nodes']}
    assert all(e['source'] in ids and e['target'] in ids for e in graph['edges'])


def test_feedback_incident_snapshot_and_restart(client):
    b=brand(client);c=candidate(b)
    f=client.post('/api/analyze/social',json=c).json()
    i=client.post('/api/incidents',json={'finding_id':f['id']}).json()
    assert client.post('/api/incidents',json={'finding_id':f['id']}).json()['id']==i['id']
    r=client.patch('/api/incidents/'+i['id'],json={'status':'Investigating','notes':'Checking identity with the brand owner.'})
    assert r.status_code==200
    client.post('/api/findings/'+f['id']+'/false-positive',json={'reason':'Verified independent fan community.'})
    with TestClient(app) as restarted:
        current=restarted.post('/api/analyze/social',json=c).json()
        assert current['status']=='ALLOWLISTED' and current['risk']==0
        incident=restarted.get('/api/incidents',params={'brand_id':b['id']}).json()[0]
        assert incident['status']=='Investigating' and incident['snapshot']['risk']==f['risk']
        assert len(incident['actions'])==2
        report=restarted.get('/api/reports/'+f['id']).json()
        assert report['incidents'][0]['notes']=='Checking identity with the brand owner.'
    assert client.delete('/api/findings/'+f['id']+'/false-positive').json()['risk']==f['risk']


def test_logo_deterministic_real_hash(client):
    b=brand(client);c=candidate(b,logo=b['logo'])
    f=analyze(c,b)
    assert f['visual_similarity']==100
    assert any(s['key']=='logo' and s['points']==18 for s in f['signals'])
    c['logo']=''
    assert analyze(c,b)['visual_similarity'] is None


def test_domain_boundaries():
    b={'domains':['brand.example']}
    assert official_domain('shop.brand.example',b)
    assert not official_domain('brand.example.attacker.example',b)
    assert not official_domain('fakebrand.example',b)


@pytest.mark.parametrize('changes',[{'username':' '},{'url':'not-a-url'},{'url':'javascript:alert(1)'},{'channel':'website'},{'logo':'invalid'},{'username':'https://profile.example'}])
def test_invalid_candidate(client,changes):
    c=candidate(brand(client));c.update(changes)
    r=client.post('/api/analyze/social',json=c)
    assert r.status_code==422 and 'error' in r.json()


def test_missing_inputs_unknown_records_and_status(client):
    assert client.post('/api/analyze/app',json={'brand_id':'x','channel':'app','name':'An App'}).status_code==422
    c=candidate(brand(client));c['brand_id']='missing'
    assert client.post('/api/analyze/social',json=c).status_code==404
    assert client.get('/api/findings/missing').status_code==404
    assert client.patch('/api/incidents/x',json={'status':'Unknown'}).status_code==422
    assert client.post('/api/brands',json={'name':'X','website':''}).status_code==422


def test_duplicate_trusted_assets_rejected(client):
    assert client.post('/api/brands',json={'name':'Acme','website':'https://acme.example','socials':[{'username':'acme'},{'username':'ACME'}]}).status_code==422


def test_brand_edit_recalculates_findings(client):
    b=brand(client);c=candidate(b)
    f=client.post('/api/analyze/social',json=c).json()
    edit={k:v for k,v in b.items() if k not in ('id','created_at')}
    edit['socials'].append({'platform':'Instagram','username':c['username']})
    assert client.put('/api/brands/'+b['id'],json=edit).status_code==200
    assert client.get('/api/findings/'+f['id']).json()['risk']==0


def test_copilot_and_dashboard(client):
    b=brand(client);f=client.post('/api/analyze/social',json=candidate(b)).json()
    reply=client.get('/api/copilot/'+f['id'],params={'question':'Show strongest evidence'}).json()
    assert 'Identity similarity' in reply['answer']
    dashboard=client.get('/api/dashboard',params={'brand_id':b['id']}).json()
    assert dashboard['social']==1 and dashboard['suspicious']==1
    assert client.get('/api/copilot/'+f['id'],params={'question':'invent answer'}).status_code==422
