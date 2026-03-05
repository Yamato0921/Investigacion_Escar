import codecs
with codecs.open('php/.env', 'r', 'utf-8') as f:
    data = f.read()
data = data.replace('MONGO_URI=mongodb+srv://User_Investigacion_1:User_Investigacion_1@cluster0.2f69bzs.mongodb.net/?appName=Cluster0', 'MONGO_URI=mongodb+srv://User_Investigacion_1:User_Investigacion_1@cluster0.2f69bzs.mongodb.net/test?retryWrites=true&w=majority&appName=Cluster0')
with codecs.open('php/.env', 'w', 'utf-8') as f:
    f.write(data)
