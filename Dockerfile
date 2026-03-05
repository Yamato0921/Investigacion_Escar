FROM php:8.2-apache

# Instalar dependencias del sistema, MongoDB y herramientas de imagen
RUN apt-get update && apt-get install -y \
    libssl-dev \
    pkg-config \
    libcurl4-openssl-dev \
    libpng-dev \
    libjpeg-dev \
    libwebp-dev \
    unzip \
    && pecl install mongodb \
    && docker-php-ext-enable mongodb \
    && docker-php-ext-install gd
# gd is useful but fileinfo is usually already there. Ensuring it anyway just in case:
# RUN docker-php-ext-install fileinfo

# Habilitar mod_rewrite para Apache
RUN a2enmod rewrite

# Configurar el directorio de trabajo
WORKDIR /var/www/html

# Copiar los archivos del proyecto al contenedor
COPY . .

# Instalar dependencias de Composer
RUN if [ -f "composer.json" ]; then \
    curl -sS https://getcomposer.org/installer | php -- --install-dir=/usr/local/bin --filename=composer \
    && composer install --no-interaction --optimize-autoloader; \
    fi

# Dar permisos a las carpetas de almacenamiento, logs y uploads
RUN mkdir -p php/storage php/logs/ratelimit php/uploads/investigadores php/uploads/semilleros php/uploads/proyectos \
    && chmod -R 777 php/storage php/logs php/uploads

# Exponer el puerto 80
EXPOSE 80
