from fastapi.testclient import TestClient
import pathlib, sys
sys.path.append(str(pathlib.Path(__file__).resolve().parents[2]))
from api.app.main import app

client = TestClient(app)

def test_product_margin():
    r = client.post('/api/products/test', json={'name': 'widget', 'cost': 100})
    assert r.status_code == 200
    data = r.json()
    assert data['price'] == 120.0
    assert data['marginPercent'] == 20.0
