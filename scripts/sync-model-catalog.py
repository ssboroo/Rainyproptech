"""Refresh 100 source-image model adapters from Fal's public OpenAPI catalog."""
import concurrent.futures, json, pathlib, urllib.request, urllib.parse, urllib.error, datetime, time
ALIASES=['start_image_url','image_url','image_urls','reference_image_url','reference_image_urls','input_image_url','first_frame_url']
BLOCK=['avatar','lip-sync','omnihuman','fabric','heygen','remove','rembg','birefnet','/sam-','vectorize','extract-frame','preprocessors','eraser','/fill','/expand']
def resolve(v,doc,depth=0):
 if depth>15:raise ValueError('Recursive schema')
 if not isinstance(v,dict):return v
 if '$ref'in v:
  ref=v['$ref']
  if not ref.startswith('#/'):raise ValueError('External schema')
  x=doc
  for p in ref[2:].split('/'):x=x[p.replace('~1','/').replace('~0','~')]
  return resolve(x,doc,depth+1)
 out={k:resolve(x,doc,depth+1) if isinstance(x,dict) else [resolve(a,doc,depth+1) for a in x] if isinstance(x,list) else x for k,x in v.items() if k not in ['title','description','examples','example']}
 if 'anyOf'in out:
  choices=[x for x in out['anyOf'] if x.get('type')!='null'];out={**out,**(choices[0] if choices else {})};out.pop('anyOf',None)
 return out

def fetch(category):
 result=[];cursor=None
 for page in range(20):
  q={'category':category,'status':'active','limit':10,'expand':'openapi-3.0'}
  if cursor:q['cursor']=cursor
  for attempt in range(4):
   try:
    with urllib.request.urlopen('https://api.fal.ai/v1/models?'+urllib.parse.urlencode(q),timeout=45) as r:d=json.load(r)
    break
   except urllib.error.HTTPError as e:
    if e.code!=429 or attempt==3:raise
    time.sleep(min(30,10*(attempt+1)))
  time.sleep(1)
  for m in d['models']:
   endpoint=m['endpoint_id'];doc=m.get('openapi',{});meta=m['metadata']
   if any(b in endpoint.lower() for b in BLOCK) or any(m['id']==endpoint for m in result):continue
   try:
    raw=next(v['post']['requestBody']['content']['application/json']['schema'] for v in doc.get('paths',{}).values() if 'post'in v and 'requestBody'in v['post']);schema=resolve(raw,doc)
    props=schema.get('properties',{});source=next((x for x in ALIASES if x in props and props[x].get('type')in ['string','array']),None)
    if not source:continue
    required=schema.get('required',[])
    if any(x not in ['prompt',source] and 'default'not in props.get(x,{}) and 'enum'not in props.get(x,{}) for x in required):continue
    result.append({'id':endpoint,'name':meta['display_name'],'kind':'image'if category=='image-to-image'else'video','category':category,'sourceField':source,'schema':schema,'date':meta.get('date'),'tags':meta.get('tags',[]),'docs':'https://fal.ai/models/'+endpoint+'/api'})
   except (ValueError,KeyError,StopIteration,TypeError):continue
   if len(result)>=50:return result
  cursor=d.get('next_cursor')
  if not cursor:break
 return result
with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool:models=sum(list(pool.map(fetch,['image-to-image','image-to-video'])),[])
if len(models)!=100:raise SystemExit(f'Expected 100 compatible models, received {len(models)}; existing snapshot unchanged')
p=pathlib.Path(__file__).resolve().parents[1]/'lib/model-catalog.json'
p.write_text(json.dumps({'syncedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'source':'https://api.fal.ai/v1/models','models':models},ensure_ascii=False,indent=2)+'\n')
print(json.dumps({'count':len(models),'image':sum(m['kind']=='image'for m in models),'video':sum(m['kind']=='video'for m in models),'bytes':p.stat().st_size}))
