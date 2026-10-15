"""Read-only audit of each existing endpoint against current official Fal OpenAPI. Never runs a generation."""
import json, pathlib, urllib.request, urllib.parse, concurrent.futures, datetime, hashlib
root=pathlib.Path(__file__).resolve().parents[1]
models=json.loads((root/'lib/model-catalog.json').read_text())['models']
def resolve(v,doc,depth=0):
 if depth>15:raise ValueError('Recursive schema')
 if not isinstance(v,dict):return v
 if '$ref' in v:
  x=doc
  for part in v['$ref'][2:].split('/'):x=x[part.replace('~1','/').replace('~0','~')]
  return resolve(x,doc,depth+1)
 out={k:resolve(x,doc,depth+1) if isinstance(x,dict) else [resolve(a,doc,depth+1) for a in x] if isinstance(x,list) else x for k,x in v.items() if k not in ['title','description','examples','example']}
 if 'anyOf' in out:
  choices=[x for x in out['anyOf'] if x.get('type')!='null'];out={**out,**(choices[0] if choices else {})};out.pop('anyOf',None)
 return out
def batch_check(batch):
 q=[('endpoint_id',m['id']) for m in batch]+[('expand','openapi-3.0'),('limit','10')]
 try:
  d=json.load(urllib.request.urlopen('https://api.fal.ai/v1/models?'+urllib.parse.urlencode(q),timeout=45))
  rows=[]
  for m in batch:
   try:
    live=next(x for x in d['models'] if x['endpoint_id']==m['id']);doc=live['openapi']
    raw=next(v['post']['requestBody']['content']['application/json']['schema'] for v in doc['paths'].values() if 'post' in v and 'requestBody' in v['post'])
    schema=resolve(raw,doc)
    rows.append({'id':m['id'],'status':'matched' if schema==m['schema'] else 'schema_changed','sourceFieldPresent':m['sourceField'] in schema.get('properties',{}),'providerStatus':live.get('metadata',{}).get('status','listed'),'liveSchema':schema})
   except Exception as e:rows.append({'id':m['id'],'status':'fetch_failed','error':str(e)})
  return rows
 except Exception as e:return [{'id':m['id'],'status':'fetch_failed','error':str(e)} for m in batch]
with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool: rows=sum(list(pool.map(batch_check,[models[i:i+10] for i in range(0,len(models),10)])),[])
payload={'checkedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'method':'Official public catalog/OpenAPI inspection only. No paid inference or visual-quality benchmark.','models':rows}
(root/'docs/model-audit.json').write_text(json.dumps(payload,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({status:sum(r['status']==status for r in rows) for status in ['matched','schema_changed','fetch_failed']}))
