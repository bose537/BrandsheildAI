import hashlib
import json
import logging
import uuid
from contextlib import asynccontextmanager
from datetime import datetime, timezone
from pathlib import Path
from fastapi import FastAPI, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from . import database as db
from .models import Brand, Candidate, IncidentCreate, IncidentUpdate, Feedback, Scan
from .seed import demo_brand, candidates
from .services.risk_engine import analyze, WEIGHTS
from .services.correlation_engine import correlate
from .services.explanation_service import answer, QUESTIONS
from .services.visual_detector import fingerprint


def now():
    return datetime.now(timezone.utc).isoformat()


def require(conn, kind, key):
    record = db.get(conn, kind, key)
    if not record:
        raise HTTPException(404, f'{kind.capitalize()} not found.')
    return record


def event(conn, message, brand_id):
    db.save(conn, 'activity', {'id':str(uuid.uuid4()), 'message':message, 'brand_id':brand_id, 'time':now()})


def candidate_id(candidate):
    if candidate['channel'] == 'social':
        identity = [candidate['platform'], candidate['username'].casefold()]
    else:
        # No package provided: retain developer in the identity, avoiding collisions.
        identity = [candidate['store'], candidate['package'].casefold(), candidate['developer'].casefold()] if candidate['package'] else [candidate['store'], candidate['name'].casefold(), candidate['developer'].casefold()]
    return hashlib.sha256(json.dumps([candidate['brand_id'],candidate['channel'],identity]).encode()).hexdigest()[:24]


def store_analysis(conn, candidate, brand, source):
    fid = candidate_id(candidate)
    previous = db.get(conn, 'finding', fid)
    result = analyze(candidate, brand, bool(db.get(conn,'feedback',fid)))
    result.update(id=fid, brand_id=brand['id'], source=source, created_at=previous['created_at'] if previous else now(), updated_at=now())
    db.save(conn, 'finding', result)
    return result


def correlate_stored(conn, brand):
    findings = [f for f in db.all_records(conn,'finding') if f['brand_id']==brand['id']]
    campaigns = correlate(findings, brand)
    for old in db.all_records(conn,'campaign'):
        if old['brand_id'] == brand['id']:
            conn.execute('DELETE FROM records WHERE kind=? AND id=?',('campaign',old['id']))
    for campaign in campaigns:
        db.save(conn,'campaign',campaign)
    for finding in findings:
        db.save(conn,'finding',finding)


@asynccontextmanager
async def lifespan(app):
    with db.connection() as conn:
        if not db.all_records(conn,'brand'):
            brand = demo_brand(); brand.update(id='demo-northstar', created_at=now())
            db.save(conn,'brand',brand)
            event(conn,'Demo brand registered. No monitoring scan has run yet.',brand['id'])
    yield


app = FastAPI(title='BrandShield AI', version='1.0.0', lifespan=lifespan)


@app.exception_handler(RequestValidationError)
async def validation_error(request, exc):
    messages = ['.'.join(str(v) for v in error['loc'][1:])+': '+error['msg'] for error in exc.errors()]
    return JSONResponse(status_code=422,content={'error':'; '.join(messages)})


@app.exception_handler(HTTPException)
async def http_error(request, exc):
    return JSONResponse(status_code=exc.status_code,content={'error':exc.detail})


@app.exception_handler(ValueError)
async def value_error(request, exc):
    return JSONResponse(status_code=422,content={'error':str(exc)})


@app.exception_handler(Exception)
async def unexpected_error(request, exc):
    logging.exception('Unhandled API error')
    return JSONResponse(status_code=500,content={'error':'Unable to complete this request. Retry or check the local server log.'})


@app.get('/api/health')
def health():
    with db.connection() as conn:
        conn.execute('SELECT 1')
    return {'status':'ok','storage':'sqlite','mode':'local demo; no external APIs'}


@app.get('/api/config')
def config():
    return {'weights':WEIGHTS,'questions':QUESTIONS,'sources':[{'name':'Local monitoring feed','status':'Demo Source'},{'name':'Manual metadata analysis','status':'Available'},{'name':'External social / app APIs','status':'Unavailable','message':'Source unavailable — local/demo analysis remains available.'}]}


@app.get('/api/brands')
def brands():
    with db.connection() as conn:
        return db.all_records(conn,'brand')


@app.get('/api/brands/{brand_id}')
def brand(brand_id: str):
    with db.connection() as conn:
        return require(conn,'brand',brand_id)


@app.post('/api/brands',status_code=201)
def create_brand(payload: Brand):
    fingerprint(payload.logo)
    result = payload.model_dump(); result.update(id=str(uuid.uuid4()),created_at=now())
    with db.connection() as conn:
        db.save(conn,'brand',result); event(conn,'Brand identity registered.',result['id'])
    return result


@app.put('/api/brands/{brand_id}')
def update_brand(brand_id: str, payload: Brand):
    fingerprint(payload.logo)
    with db.connection() as conn:
        previous = require(conn,'brand',brand_id)
        result = payload.model_dump(); result.update(id=brand_id,created_at=previous['created_at'])
        db.save(conn,'brand',result)
        for finding in db.all_records(conn,'finding'):
            if finding['brand_id']==brand_id:
                store_analysis(conn,finding['candidate'],result,finding['source'])
        correlate_stored(conn,result)
        event(conn,'Trusted identity updated; stored findings recalculated.',brand_id)
    return result


@app.post('/api/analyze/{channel}')
def analyze_asset(channel: str, payload: Candidate):
    if channel not in ('social','app') or payload.channel != channel:
        raise HTTPException(422,'Unsupported or mismatched asset type.')
    with db.connection() as conn:
        b = require(conn,'brand',payload.brand_id)
        result = store_analysis(conn,payload.model_dump(),b,'Manual metadata')
        correlate_stored(conn,b)
        event(conn,'Analyzed '+(payload.username or payload.name)+'.',b['id'])
        return require(conn,'finding',result['id'])


@app.post('/api/demo/scan')
def demo_scan(payload: Scan):
    with db.connection() as conn:
        b = require(conn,'brand',payload.brand_id)
        rows = candidates(b)
        for row in rows:
            store_analysis(conn,row,b,'Demo dataset')
        correlate_stored(conn,b)
        event(conn,f'Demo scan completed: {len(rows)} candidate records processed.',b['id'])
        return {'processed':len(rows),'message':'Demo scan complete. Existing identities updated without duplicate findings.'}


@app.get('/api/findings')
def findings(brand_id: str):
    with db.connection() as conn:
        require(conn,'brand',brand_id)
        return sorted([f for f in db.all_records(conn,'finding') if f['brand_id']==brand_id], key=lambda f:(f['priority'],-f['risk']))


@app.get('/api/findings/{finding_id}')
def finding(finding_id: str):
    with db.connection() as conn:
        return require(conn,'finding',finding_id)


@app.get('/api/campaigns')
def campaigns(brand_id: str):
    with db.connection() as conn:
        require(conn,'brand',brand_id)
        return [c for c in db.all_records(conn,'campaign') if c['brand_id']==brand_id]


@app.get('/api/dashboard')
def dashboard(brand_id: str):
    rows = findings(brand_id)
    suspicious = [r for r in rows if r['status']=='SUSPICIOUS']
    with db.connection() as conn:
        activity = [a for a in db.all_records(conn,'activity') if a['brand_id']==brand_id][-8:][::-1]
    return {'social':sum(r['candidate']['channel']=='social' for r in rows),'apps':sum(r['candidate']['channel']=='app' for r in rows),'suspicious':len(suspicious),'critical':sum(r['severity']=='Critical' for r in suspicious),'trusted':sum(r['status']=='TRUSTED' for r in rows),'campaigns':len(campaigns(brand_id)), 'severity':{s:sum(r['severity']==s for r in suspicious) for s in ['Low','Medium','High','Critical']},'priorities':suspicious[:5],'recent':sorted(rows,key=lambda r:r['updated_at'],reverse=True)[:5],'activity':activity}


@app.get('/api/graph')
def graph(brand_id: str):
    rows = findings(brand_id); groups = campaigns(brand_id)
    with db.connection() as conn:
        b = require(conn,'brand',brand_id)
    nodes = [{'id':'brand','kind':'brand','label':b['name'],'column':0}]; edges=[]
    for row in rows:
        if row['status'] not in ('TRUSTED','SUSPICIOUS'):
            continue
        nodes.append({'id':row['id'],'kind':'trusted' if row['status']=='TRUSTED' else row['candidate']['channel'],'label':row['candidate']['username'] or row['candidate']['name'],'finding_id':row['id'],'risk':row['risk'],'column':1})
        edges.append({'id':'brand-'+row['id'],'source':'brand','target':row['id'],'label':'official asset' if row['status']=='TRUSTED' else 'suspected imitation'})
        if row['domain']:
            did='domain-'+row['domain']
            if not any(n['id']==did for n in nodes):
                nodes.append({'id':did,'kind':'domain','label':row['domain'],'column':2})
            edges.append({'id':row['id']+'-'+did,'source':row['id'],'target':did,'label':'links to'})
    for c in groups:
        nodes.append({'id':c['id'],'kind':'campaign','label':'Possible campaign','column':3,'evidence':c['evidence']})
        edges.append({'id':'campaign-'+c['id'],'source':'domain-'+c['domain'],'target':c['id'],'label':'shared infrastructure'})
    return {'nodes':nodes,'edges':edges}


@app.post('/api/incidents',status_code=201)
def create_incident(payload: IncidentCreate):
    with db.connection() as conn:
        f = require(conn,'finding',payload.finding_id)
        existing = next((i for i in db.all_records(conn,'incident') if i['finding_id']==f['id']),None)
        if existing:
            return existing
        item={'id':str(uuid.uuid4()),'brand_id':f['brand_id'],'finding_id':f['id'],'snapshot':f,'status':'New','notes':'','created_at':now(),'updated_at':now(),'actions':[{'time':now(),'action':'Incident opened'}]}
        db.save(conn,'incident',item); event(conn,'Incident opened for '+(f['candidate']['username'] or f['candidate']['name'])+'.',f['brand_id'])
    return item


@app.get('/api/incidents')
def incidents(brand_id: str):
    with db.connection() as conn:
        require(conn,'brand',brand_id)
        return [i for i in db.all_records(conn,'incident') if i['brand_id']==brand_id]


def apply_feedback(conn, f, reason):
    db.save(conn,'feedback',{'id':f['id'],'brand_id':f['brand_id'],'reason':reason,'created_at':now(),'original':f})
    b=require(conn,'brand',f['brand_id'])
    store_analysis(conn,f['candidate'],b,f['source']); correlate_stored(conn,b)


@app.patch('/api/incidents/{incident_id}')
def update_incident(incident_id: str,payload: IncidentUpdate):
    with db.connection() as conn:
        item=require(conn,'incident',incident_id)
        if payload.status == 'False Positive' and len(payload.notes)<3:
            raise HTTPException(422,'Explain the false-positive decision in notes (at least 3 characters).')
        if payload.status=='False Positive':
            apply_feedback(conn,require(conn,'finding',item['finding_id']),payload.notes)
        item.update(status=payload.status,notes=payload.notes,updated_at=now())
        item['actions'].append({'time':now(),'action':'Status: '+payload.status,'notes':payload.notes})
        db.save(conn,'incident',item); event(conn,'Incident status changed to '+payload.status+'.',item['brand_id'])
    return item


@app.post('/api/findings/{finding_id}/false-positive')
def false_positive(finding_id: str,payload: Feedback):
    with db.connection() as conn:
        f=require(conn,'finding',finding_id)
        if f['status']=='TRUSTED':
            raise HTTPException(422,'This is already a registered official asset.')
        apply_feedback(conn,f,payload.reason)
        event(conn,'Finding allowlisted by analyst feedback.',f['brand_id'])
        return require(conn,'finding',finding_id)


@app.delete('/api/findings/{finding_id}/false-positive')
def remove_feedback(finding_id: str):
    with db.connection() as conn:
        f=require(conn,'finding',finding_id)
        conn.execute('DELETE FROM records WHERE kind=? AND id=?',('feedback',finding_id))
        b=require(conn,'brand',f['brand_id'])
        store_analysis(conn,f['candidate'],b,f['source']); correlate_stored(conn,b)
        event(conn,'Analyst allowlist removed; finding recalculated.',f['brand_id'])
        return require(conn,'finding',finding_id)


@app.get('/api/copilot/{finding_id}')
def copilot(finding_id: str,question: str):
    if question not in QUESTIONS:
        raise HTTPException(422,'Select one of the supported evidence questions.')
    with db.connection() as conn:
        f=require(conn,'finding',finding_id)
    return {'answer':answer(f,question,campaigns(f['brand_id'])),'mode':'Deterministic evidence templates; no generative model'}


@app.get('/api/reports/{finding_id}')
def report(finding_id: str):
    with db.connection() as conn:
        f=require(conn,'finding',finding_id)
        b=require(conn,'brand',f['brand_id'])
        incidents_for_f=[i for i in db.all_records(conn,'incident') if i['finding_id']==finding_id]
    group = next((c for c in campaigns(b['id']) if c['id']==f['campaign_id']),None)
    return {'generated_at':now(),'brand':b['name'],'finding':f,'campaign':group,'incidents':incidents_for_f,'disclaimer':'Metadata-based triage. These signals do not prove fraud. Preserve original platform evidence before reporting.'}


# Build once, then serve the complete offline-capable demo on one local port.
frontend = Path(__file__).resolve().parents[1] / 'frontend' / 'dist'
if frontend.exists():
    app.mount('/',StaticFiles(directory=frontend,html=True),name='frontend')
