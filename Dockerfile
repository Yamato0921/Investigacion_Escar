FROM php:8.2-apache

# Instalar dependencias del sistema y la extensión de MongoDB
RUN apt-get update && apt-get install -y \
    libssl-dev \
    unzip \
    && pecl install mongodb \
    && docker-php-ext-enable mongodb

# Habilitar mod_rewrite para Apache (útil para APIs)
RUN a2enmod rewrite

# Configurar el directorio de trabajo
WORKDIR /var/www/html

# Copiar los archivos del proyecto al contenedor
COPY . .

# Instalar dependencias de Composer si existe composer.json
RUN if [ -f "composer.json" ]; then \
    curl -sS https://getcomposer.org/installer | php -- --install-dir=/usr/local/bin --filename=composer \
    && composer install --no-interaction --optimize-autoloader; \
    fi

# Dar permisos a la carpeta de almacenamiento si existe
RUN mkdir -p php/storage && chmod -R 777 php/storage

# Exponer el puerto 80
EXPOSE 80
