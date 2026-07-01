# ☕ Clasificador de Nivel de Tostado de Café Colombiano

Clasificador de imágenes que identifica el **nivel de tostado de granos de café**
en tiempo real usando la webcam. El modelo se entrena con **Teachable Machine**
(transfer learning sobre MobileNet) y se ejecuta 100% en el navegador con
**TensorFlow.js**, sin servidor ni backend.

> 🎓 Proyecto académico para el curso de Inteligencia Artificial.

---

## 1. 📌 El problema y por qué importa en Colombia

Colombia es uno de los mayores productores de café del mundo, y buena parte de la
producción proviene de **pequeños caficultores**. El **nivel de tostado** determina
en gran medida el sabor, el aroma y el precio final del café; sin embargo, muchos
productores lo evalúan **a ojo**, de forma subjetiva y sin estandarización.

Un clasificador automático de tostado puede aportar en:

- **Control de calidad** accesible para pequeños productores sin equipos costosos.
- **Estandarización** del punto de tostado entre lotes y entre personas distintas.
- **Apoyo a caficultores** y tostadores artesanales para lograr un producto consistente.
- **Educación**: mostrar de forma tangible cómo la IA percibe color y textura.

Este proyecto es una **prueba de concepto educativa**: no reemplaza a un catador
profesional, pero ilustra cómo una herramienta de visión por computador podría
apoyar el proceso.

---

## 2. 👥 Integrantes del equipo

| Nombre                              | Rol (ejemplo)                     |
|-------------------------------------|-----------------------------------|
| Nicolás David Naranjo Barrios       | Desarrollo web / integración TF.js|
| Heiling                             | Dataset y entrenamiento           |
| Keyner                              | Documentación y análisis de errores|

> ✏️ Completa los apellidos de Heiling y Keyner si es necesario y ajusta los roles según su reparto real.

---

## 3. 🏷️ Clases utilizadas y justificación

El modelo distingue **4 clases**, que cubren el ciclo del grano desde crudo hasta
tostado oscuro:

| Clase             | Descripción visual                                        | Por qué se incluye |
|-------------------|-----------------------------------------------------------|--------------------|
| `verde`           | Grano sin tostar, color verdoso/grisáceo/amarillento.     | Estado inicial; base de comparación. |
| `tostado_claro`   | Marrón claro (canela), superficie seca.                   | Perfil ácido, tostado ligero. |
| `tostado_medio`   | Marrón intermedio, el más común de consumo.               | Punto de referencia habitual en Colombia. |
| `tostado_oscuro`  | Marrón muy oscuro, superficie brillante/aceitosa.         | Perfil amargo/intenso; extremo del espectro. |

Las clases forman un **gradiente continuo de color**, lo que hace el problema
interesante: las fronteras entre `claro↔medio` y `medio↔oscuro` son difusas
(ver [análisis de errores](docs/analisis_errores.md)).

---

## 4. 🖼️ Dataset

- **Fuente:** fotografías propias de granos de café tomadas por el equipo.
- **Cantidad:** mínimo **30 imágenes por clase** (recomendado 60–100 para mejores
  resultados). Total mínimo: 120 imágenes.
- **Variaciones deliberadas** para mejorar la generalización:
  - **Iluminación:** luz natural, luz cálida artificial y sombra.
  - **Fondo:** mesa clara, mesa oscura, mano, tela neutra.
  - **Ángulo y distancia:** cenital, inclinado, cerca y lejos.

Estructura de carpetas:

```
dataset/
├── verde/           (≥30 imágenes)
├── tostado_claro/   (≥30 imágenes)
├── tostado_medio/   (≥30 imágenes)
└── tostado_oscuro/  (≥30 imágenes)
```

Cada carpeta incluye un `README.md` con instrucciones específicas de esa clase.

> Consejo: **no** uses siempre el mismo fondo para una clase; si lo haces, la red
> podría aprender el fondo en vez del grano.

---

## 5. 🧪 Cómo entrenar el modelo en Teachable Machine

1. Entra a **[teachablemachine.withgoogle.com](https://teachablemachine.withgoogle.com/)**
   → **Get Started** → **Image Project** → **Standard image model**.
2. Crea **4 clases** y renómbralas exactamente:
   `verde`, `tostado_claro`, `tostado_medio`, `tostado_oscuro`.
   > ⚠️ Los nombres deben coincidir para que la web los muestre con etiquetas bonitas.
3. En cada clase, sube tus imágenes (**Upload**) o captúralas con la **webcam**.
4. Pulsa **Train Model**. Espera a que termine (segundos, gracias al transfer learning).
5. Prueba en el **Preview** con la webcam antes de exportar.

Detalle de qué ocurre internamente en [`docs/analisis_tecnico.md`](docs/analisis_tecnico.md).

---

## 6. 📦 Cómo exportar el modelo y colocarlo en `/model`

1. En Teachable Machine pulsa **Export Model**.
2. Ve a la pestaña **TensorFlow.js** → **Download my model**.
3. Descomprime el `.zip`. Obtendrás:
   - `model.json`
   - `metadata.json`
   - `weights.bin`
4. Copia esos **3 archivos** dentro de la carpeta [`/model`](model/) de este repo
   (sin subcarpetas). Estructura final:

```
model/
├── model.json
├── metadata.json
└── weights.bin
```

La app los carga desde `../model/model.json`.

---

## 7. 💻 Cómo correr la web localmente

La app es HTML + JS puro (sin bundler). Hay dos formas:

### Opción A — Servidor local (recomendada)
La cámara requiere un contexto seguro (`localhost` o `https`). Con Node instalado:

```bash
# Desde la raíz del proyecto
npx serve
# Abre la URL que aparezca (p.ej. http://localhost:3000) y navega a /web
```

O con Python:

```bash
python3 -m http.server 8000
# Luego abre http://localhost:8000/web/
```

### Opción B — Abrir el archivo directamente
Puedes abrir `web/index.html` con doble clic (`file://`), pero **algunos
navegadores bloquean la cámara** en `file://`. Si la cámara no arranca, usa la
Opción A.

### Uso
1. Espera a que el estado diga *"Modelo cargado"*.
2. Pulsa **▶ Iniciar** y concede permiso de cámara.
3. Enfoca los granos: verás las 4 barras de probabilidad en tiempo real y la
   clase ganadora resaltada.
4. En móvil, usa **🔄 Cambiar cámara** para alternar frontal/trasera.

---

## 8. 🧠 Explicación técnica: ¿qué "ve" realmente la red?

> Versión resumida. La versión profunda (con diagramas y softmax paso a paso)
> está en [`docs/analisis_tecnico.md`](docs/analisis_tecnico.md).

### La imagen se vuelve números
La foto de la webcam se convierte en un **tensor de píxeles**: una matriz con los
valores **RGB** de cada píxel, **normalizados** (de 0–255 a un rango como 0–1).
Para la red no hay "granos": hay una cuadrícula de números de forma
`[1, 224, 224, 3]`.

### Forward Pass (paso hacia adelante)
Los números fluyen así:

```
entrada (tensor RGB)
   → capas convolucionales (detectan bordes, colores, texturas)
   → funciones de activación (ReLU, aportan no linealidad)
   → capa densa final (entrenada por nosotros para 4 clases)
   → softmax
   → 4 probabilidades
```

### Pesos neuronales
Los **pesos** son los números que multiplican cada conexión. Durante el
entrenamiento, la red compara su predicción con la etiqueta correcta y, mediante
**retropropagación + descenso de gradiente**, **ajusta los pesos** para equivocarse
menos. En transfer learning solo se ajustan los de la última capa.

### Reconocimiento de patrones
Las convoluciones aprenden a responder a patrones: primero **bordes y colores**,
luego **texturas** (rugosidad, brillo aceitoso del grano oscuro), y finalmente
**combinaciones** que correlacionan con cada nivel de tostado.

### Cómo salen las probabilidades (softmax)
La última capa da un puntaje por clase; **softmax** los convierte en porcentajes
que suman 100%. El exponencial amplifica el mayor puntaje, y esa clase es la
predicción final.

### ⚠️ Aclaración importante
**La red NO "ve café".** No tiene concepto de "grano", "tostado" ni "sabor".
Solo procesa **números** y encuentra **patrones estadísticos** que correlacionan
ciertos colores/texturas con las etiquetas que le enseñamos. Es reconocimiento de
patrones, no comprensión.

---

## 9. ✅ Casos donde funciona correctamente

Con buena iluminación, fondo neutro y granos bien enfocados, el modelo distingue
con claridad los extremos del espectro (`verde` y `tostado_oscuro`).

> Añade tus capturas reales:
>
> ![Verde correcto](docs/capturas/demo_verde_ok.png)
> ![Oscuro correcto](docs/capturas/demo_oscuro_ok.png)

*(Guarda las imágenes en `docs/capturas/` — ver instrucciones ahí.)*

---

## 10. ❌ Casos donde falla y por qué

Detalle completo y tabla en [`docs/analisis_errores.md`](docs/analisis_errores.md).
Resumen de las causas típicas:

- **Calidad del dataset:** fotos poco variadas → la red aprende detalles irrelevantes.
- **Ruido visual:** fondos con textura, sombras y reflejos compiten con el grano.
- **Datos insuficientes:** con 30 imágenes hay poca diversidad; lo no visto falla.
- **Similitud entre clases:** el caso obvio es **`tostado_medio` vs `tostado_oscuro`**,
  cuya diferencia de color es gradual y ambigua.
- **Sobreajuste:** el modelo "memoriza" las fotos de entrenamiento y no generaliza.

---

## 11. 🤔 Reflexión crítica: ¿La IA realmente entiende lo que ve?

**No, no en el sentido en que un humano entiende.**

Lo que este modelo hace es **correlación estadística**, no **comprensión
semántica**. Aprendió que ciertos patrones de color y textura tienden a aparecer
junto a la etiqueta `tostado_oscuro`, pero no "sabe" qué es el café, ni que el
tostado implica una reacción química, ni por qué un grano brilla. Si le mostramos
una pastilla de chocolate oscuro, probablemente diga `tostado_oscuro` con alta
probabilidad: reconoce el **patrón visual**, no el **concepto**.

Matices importantes:

- La red **no tiene intención ni entendimiento**; es una función matemática que
  transforma píxeles en probabilidades.
- Su "confianza" (el 90%) es una **distribución relativa** entre las 4 opciones que
  conoce, no una medida real de certeza. Ante algo desconocido, igual reparte el
  100% entre clases equivocadas.
- Es **potente y útil** dentro de su dominio, pero **frágil** fuera de él y
  totalmente dependiente de la calidad de los datos con que la entrenamos.
- Antropomorfizarla ("la IA ve", "la IA entiende") es una simplificación cómoda
  pero técnicamente incorrecta que conviene evitar.

**Conclusión:** el modelo *clasifica* con eficacia, pero no *comprende*. Reconocer
esa diferencia es parte central del pensamiento crítico sobre la IA.

---

## 12. 🛠️ Tecnologías usadas

- **[Teachable Machine](https://teachablemachine.withgoogle.com/)** — entrenamiento del modelo (transfer learning sobre MobileNet).
- **[TensorFlow.js](https://www.tensorflow.org/js)** (`@tensorflow/tfjs`) — inferencia en el navegador.
- **[@teachablemachine/image](https://github.com/googlecreativelab/teachablemachine-community)** — carga del modelo y utilidades de webcam.
- **HTML5, CSS3 y JavaScript (ES6+)** — interfaz web, sin frameworks ni bundler.

---

## 🚀 Publicar la demo con GitHub Pages

Para que la web sea accesible por URL (y la cámara funcione sobre `https`):

1. Sube el repositorio a GitHub.
2. Ve a **Settings → Pages**.
3. En **Source**, elige la rama (`main`) y la carpeta **`/root`**.
4. Guarda. GitHub te dará una URL como
   `https://tu-usuario.github.io/clasificador-tostado-cafe/`.
5. Abre esa URL y navega a **`/web/`**:
   `https://tu-usuario.github.io/clasificador-tostado-cafe/web/`

> Como la app usa rutas relativas (`../model/model.json`), funciona correctamente
> servida desde `/web/` con la carpeta `/model` en la raíz del repo.
> Recuerda que **los archivos del modelo deben estar subidos** en `/model`.

---

## 13. 📄 Licencia

Distribuido bajo licencia **MIT**. Ver [`LICENSE`](LICENSE).
