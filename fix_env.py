import codecs

with codecs.open('php/bootstrap.php', 'r', 'utf-8') as f:
    data = f.read()

# fix the $dotenv loading
# ensure we load dot env from the correct place and that putenv(true) is used or just populate $_ENV
data = data.replace("""// Cargar variables de entorno si existen
if (file_exists(__DIR__ . '/.env')) {
    $dotenv = Dotenv\Dotenv::createImmutable(__DIR__);
    $dotenv->load();
}""", """// Cargar variables de entorno si existen
if (file_exists(__DIR__ . '/.env')) {
    // createUnsafeImmutable allows putenv() and getenv() to work
    $dotenv = Dotenv\Dotenv::createUnsafeImmutable(__DIR__);
    $dotenv->load();
}""")

with codecs.open('php/bootstrap.php', 'w', 'utf-8') as f:
    f.write(data)
