import re
import codecs

with codecs.open('JS/app.js', 'r', 'utf-8') as f:
    data = f.read()

# Replace API URL and add helper
data = data.replace("API_URL: 'php/api.php',", "API_URL: 'php/api_mongo.php',\n    getAuthHeaders(isFormData = false) {\n        const headers = {};\n        if (!isFormData) headers['Content-Type'] = 'application/json';\n        const token = localStorage.getItem('escar_token');\n        if (token) headers['Authorization'] = `Bearer ${token}`;\n        return headers;\n    },")

# Replace fetch calls with headers config
data = data.replace("credentials: 'include'", "headers: this.getAuthHeaders(true)")
# Login fetch has a specific structure:
data = data.replace("""                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ username, password }),
                    headers: this.getAuthHeaders(true)""", """                    body: JSON.stringify({ username, password }),
                    headers: this.getAuthHeaders()""")

data = data.replace("this.isAdmin = true;", "localStorage.setItem('escar_token', data.token);\n                    this.isAdmin = true;")

data = data.replace("this.isAdmin = false;", "localStorage.removeItem('escar_token');\n                this.isAdmin = false;")

with codecs.open('JS/app.js', 'w', 'utf-8') as f:
    f.write(data)
