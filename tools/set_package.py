import json,sys
a=json.load(open('app/app.json'))
a['expo']['android']['package']=sys.argv[1]
a['expo']['android']['versionCode']=int(sys.argv[2])
json.dump(a,open('app/app.json','w'),indent=2)
print('package',sys.argv[1],'versionCode',sys.argv[2])
