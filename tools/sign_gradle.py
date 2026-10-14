p='app/android/app/build.gradle'; s=open(p).read()
sc="""    signingConfigs {
        release {
            storeFile file('upload.jks')
            storePassword System.getenv('KS_PASS')
            keyAlias System.getenv('KS_ALIAS')
            keyPassword System.getenv('KS_PASS')
        }
"""
assert '    signingConfigs {\n' in s
s=s.replace('    signingConfigs {\n',sc,1)
i=s.index('buildTypes'); j=s.index('release {',i); k=s.index('signingConfig',j); e=s.index('\n',k)
s=s[:k]+'signingConfig signingConfigs.release'+s[e:]
open(p,'w').write(s); print('release signing set')
