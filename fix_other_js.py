import codecs
import re

# Fix Script.js
with codecs.open('JS/Script.js', 'r', 'utf-8') as f:
    data = f.read()
data = data.replace("const API_URL_STATS = 'http://localhost/Investigacion_Escar/php/api.php';", "const API_URL_STATS = 'php/api_mongo.php';")
with codecs.open('JS/Script.js', 'w', 'utf-8') as f:
    f.write(data)

# Fix grupos.js
with codecs.open('JS/grupos.js', 'r', 'utf-8') as f:
    data = f.read()
data = data.replace("API_URL = 'php/api.php'", "API_URL = 'php/api_mongo.php'")
# Add getAuthHeaders
if 'getAuthHeaders' not in data:
    data = data.replace('const API_URL = \'php/api_mongo.php\';', "const API_URL = 'php/api_mongo.php';\n\nfunction getAuthHeaders(isFormData = false) {\n    const headers = {};\n    if (!isFormData) headers['Content-Type'] = 'application/json';\n    const token = localStorage.getItem('escar_token');\n    if (token) headers['Authorization'] = `Bearer ${token}`;\n    return headers;\n}")
data = data.replace("credentials: 'include'", "headers: getAuthHeaders(true)")
with codecs.open('JS/grupos.js', 'w', 'utf-8') as f:
    f.write(data)

# Fix semilleros_admin.js
with codecs.open('JS/semilleros_admin.js', 'r', 'utf-8') as f:
    data = f.read()
data = data.replace("'php/api_new.php'", "`${InvestigadoresApp.API_URL}?action=create_semillero`")
data = data.replace("credentials: 'include'", "headers: InvestigadoresApp.getAuthHeaders(true)")
with codecs.open('JS/semilleros_admin.js', 'w', 'utf-8') as f:
    f.write(data)

# Fix proyectos.js
with codecs.open('JS/proyectos.js', 'r', 'utf-8') as f:
    data = f.read()
data = data.replace("'php/api.php", "'php/api_mongo.php")
# wait, I don't know the exact syntax in proyectos.js, let's just make sure API_URL is replaced.
