# Rutina · Hipertrofia 5 días

PWA de registro de entrenamiento hecha con Angular 20 (standalone + signals).
Instalable en iPhone, Android y PC, funciona sin conexión y guarda todo en el dispositivo.

---

## Arrancar en local

Necesitas Node 20 o superior.

```bash
npm install
npm start
```

Se abre en `http://localhost:4200` y recarga sola al guardar archivos.

## Compilar

```bash
npm run build      # sale en dist/rutina/browser
npm run preview    # sirve la build para probar el service worker
```

El service worker **solo se activa en la build de producción**, no en `npm start`. Para probar la instalación
y el modo sin conexión, usa `npm run build && npm run preview`.

---

## Publicarla e instalarla

### 1. Subirla a GitHub

```bash
git init
git add .
git commit -m "Primera version"
git branch -M main
git remote add origin https://github.com/xteka11/rutina.git
git push -u origin main
```

### 2. Activar Pages

En el repositorio: **Settings → Pages → Source: GitHub Actions**.
El workflow de `.github/workflows/deploy.yml` compila y publica en cada push a `main`.

Si el repositorio no se llama `rutina`, cambia el `--base-href /rutina/` del workflow por el nombre real.

Queda en `https://xteka11.github.io/rutina/`.

### 3. Instalarla

- **iPhone:** abre la URL en Safari (tiene que ser Safari) → Compartir → Añadir a pantalla de inicio.
- **Android:** Chrome te ofrece «Instalar aplicación», o Menú → Añadir a pantalla de inicio.
- **PC:** Chrome o Edge muestran un icono de instalar en la barra de direcciones.

Queda con icono propio, a pantalla completa y sin barra del navegador.

---

## Dónde tocar cada cosa

```
src/app/
  core/
    default-routine.ts   ← LA RUTINA. Ejercicios, series, rangos, descansos, textos.
    models.ts            ← tipos (Exercise, Day, Session…)
    progression.ts       ← 1RM estimado, saltos de carga y recomendaciones
    storage.service.ts   ← localStorage, tolerante a fallos
    workout.service.ts   ← estado global con signals
  pages/
    today.ts   session.ts   summary.ts
    calendar.ts   progress.ts   plan.ts   editor.ts
  ui/
    ui.service.ts         ← diálogos y avisos
    rest-timer.service.ts ← cronómetro de descanso
    store-banner.ts  format.ts
src/styles.css            ← todo el diseño, con variables CSS arriba
```

**Para cambiar la rutina tienes dos vías:**

1. **Desde la app:** Plan → Editar la rutina. Añades, quitas y reordenas ejercicios, cambias series,
   rangos y descansos. Se guarda en el dispositivo y manda sobre el archivo.
2. **Desde el código:** edita `src/app/core/default-routine.ts`. Si ya habías tocado el editor,
   pulsa «Restaurar rutina original» para que vuelva a leer el archivo.

**Los colores** están en las variables CSS del principio de `src/styles.css` (`--acc` es el morado).

**El identificador (`id`) de cada ejercicio es lo que enlaza tus marcas anteriores.**
Cambiar el nombre no rompe nada; cambiar el `id` sí desconecta el historial de ese ejercicio.

---

## Copias de seguridad

Plan → Copia de seguridad → Descargar copia (.json). Importa el mismo archivo para restaurar.

Hazlo de vez en cuando: iOS puede borrar los datos de una PWA si pasas varias semanas sin abrirla,
y esta app guarda todo en el dispositivo, no en un servidor.

---

## Ideas para seguir (por orden de dificultad)

1. Gráfica de volumen por grupo muscular (etiqueta cada ejercicio con su músculo y agrupa).
2. Cronómetro que siga corriendo con la pantalla apagada usando la Notification API.
3. Plantillas de descarga: una semana con las series reducidas al 50 %.
4. Backend en Spring Boot con login y sincronización entre móvil y PC. La capa de datos ya está
   aislada en `storage.service.ts`, así que solo hay que sustituir esa clase por una que llame a tu API.
