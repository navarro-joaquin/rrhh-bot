# RR. HH. Bot

Servicio NestJS que recibe mensajes de WhatsApp mediante Evolution API y
consulta la información de empleados en la API interna de la aplicación
Laravel `rrhh`.

## Responsabilidades

- Recibir el evento `messages.upsert` de Evolution.
- Ignorar mensajes propios, grupos y mensajes sin texto.
- Evitar respuestas duplicadas por ID de mensaje durante diez minutos.
- Buscar al empleado por su número de teléfono.
- Mostrar vacaciones, compensaciones y solicitudes.
- Enviar la respuesta mediante Evolution API.

Laravel continúa siendo la fuente de verdad de los datos. Este servicio no
accede directamente a su base de datos.

## Configuración

Instala las dependencias y crea el archivo local de configuración:

```powershell
pnpm install
Copy-Item .env.example .env
```

Configura el mismo secreto de servicio en los archivos `.env` de Laravel y
NestJS mediante `RRHH_BOT_CLIENT_SECRET`. Debe ser un valor aleatorio, largo y
exclusivo para esta integración.

En el proyecto Laravel configura `RRHH_BOT_USER_EMAIL` y crea una sola vez el
usuario técnico:

```powershell
php artisan app:crear-usuario-bot
```

La cuenta recibe una contraseña aleatoria desconocida y no requiere inicio de
sesión interactivo. Al recibir el primer mensaje, NestJS solicita a Laravel un
token `bot:read` válido durante 24 horas. El token se reutiliza en memoria y se
renueva automáticamente antes de vencer o después de una respuesta `401`.

Configura también la URL de Laravel y las credenciales de Evolution indicadas
en `.env.example`.

Si `WEBHOOK_SECRET` tiene un valor, el webhook exige ese valor en la cabecera
`apikey` o `x-webhook-secret`. Es recomendable habilitarlo en producción.

## Ejecución

```powershell
# Desarrollo
pnpm run start:dev

# Compilar y ejecutar en producción
pnpm run build
pnpm run start:prod
```

El webhook que debe configurarse en Evolution es:

```text
POST /webhook/whatsapp/messages-upsert
```

Cuando NestJS se ejecuta en Windows y Evolution dentro de Docker Desktop, la
configuración habitual es:

```dotenv
# NestJS accede desde Windows al dominio servido por Herd
RRHH_API_URL=http://rrhh.test

# NestJS accede al puerto de Evolution publicado en Windows
EVOLUTION_API_URL=http://localhost:8080
```

Evolution debe llamar desde el contenedor al host de Windows:

```text
http://host.docker.internal:3000/webhook/whatsapp/messages-upsert
```

El puerto `8080` debe sustituirse si Evolution publica otro puerto en Docker.

`GET /` devuelve el estado básico del servicio.

## Pruebas y calidad

```powershell
pnpm test --runInBand
pnpm test:e2e --runInBand
pnpm run build
```

Durante la transición, el webhook de Laravel puede permanecer activo, pero
Evolution debe enviar cada instancia a un solo webhook para evitar respuestas
duplicadas entre ambos servicios.
