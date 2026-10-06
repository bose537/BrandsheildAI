"""Run API regressions, build, DOM interactions, and an actual process restart."""
import json
import os
from pathlib import Path
import shutil
import socket
import subprocess
import sys
import tempfile
import time
from urllib.request import urlopen

ROOT = Path(__file__).resolve().parents[1]
os.chdir(ROOT)
subprocess.run([sys.executable,'-m','pytest','backend/tests','-q'],check=True)
npm = shutil.which('npm')
node = shutil.which('node')
if not npm or not node:
    raise SystemExit('Node.js and npm must be installed to check the interface.')
subprocess.run([npm,'run','build'],cwd=ROOT/'frontend',check=True)
with socket.socket() as sock:
    sock.bind(('127.0.0.1',0))
    port=sock.getsockname()[1]
base=f'http://127.0.0.1:{port}'


def get(path):
    with urlopen(base+path,timeout=5) as response:
        return json.load(response)


with tempfile.TemporaryDirectory(prefix='brandshield-qa-') as tmp:
    environment={**os.environ,'BRANDSHIELD_DB':str(Path(tmp)/'test.db'),'BRANDSHIELD_TEST_URL':base}
    log=open(Path(tmp)/'server.log','w+')
    def start():
        process=subprocess.Popen([sys.executable,'-m','uvicorn','backend.main:app','--host','127.0.0.1','--port',str(port)],env=environment,stdout=log,stderr=log)
        for _ in range(150):
            try:
                assert get('/api/health')['status']=='ok'
                return process
            except Exception:
                if process.poll() is not None:
                    log.seek(0)
                    raise RuntimeError(log.read())
                time.sleep(.05)
        process.terminate();process.wait(timeout=5)
        raise RuntimeError('API did not start within the test timeout.')
    server=start()
    try:
        with urlopen(base,timeout=5) as response:
            assert b'BrandShield AI' in response.read()
        print('PASS real HTTP health and built frontend served by FastAPI',flush=True)
        subprocess.run([node,'tests/ui-smoke.mjs'],cwd=ROOT/'frontend',env=environment,check=True,timeout=60)
        before=get('/api/incidents?brand_id=demo-northstar')
        assert any(i['status']=='Investigating' for i in before)
        server.terminate();server.wait(timeout=5)
        server=start()
        after=get('/api/incidents?brand_id=demo-northstar')
        assert before==after
        assert len(get('/api/findings?brand_id=demo-northstar'))==26
        print('PASS SQLite incident and finding persistence after process restart',flush=True)
    finally:
        server.terminate();server.wait(timeout=5);log.close()
print('Checks complete. Browser appearance, responsive layout and print output require manual QA.')
