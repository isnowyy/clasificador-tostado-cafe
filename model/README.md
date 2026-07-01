# Carpeta `/model`

Aquí van los archivos del modelo **exportado desde Teachable Machine** en formato
**TensorFlow.js**. Cuando exportes, deberías obtener estos tres archivos:

| Archivo          | Qué es                                                              |
|------------------|--------------------------------------------------------------------|
| `model.json`     | Arquitectura de la red + referencias a los pesos.                  |
| `metadata.json`  | Nombres de las clases, versión de TM y parámetros del modelo.      |
| `weights.bin`    | Pesos numéricos entrenados (puede llamarse `weights.bin`).          |

> ⚠️ Sin estos archivos la web mostrará el error
> *"No se pudo cargar el modelo"*. La app los busca en `../model/model.json`.

## Cómo exportar desde Teachable Machine

1. En tu proyecto de Teachable Machine, pulsa **Export Model**.
2. Pestaña **TensorFlow.js** → **Download my model**.
3. Se descarga un `.zip`. Descomprímelo y copia `model.json`, `metadata.json`
   y `weights.bin` **directamente dentro de esta carpeta** (sin subcarpetas).

Estructura final esperada:

```
model/
├── README.md        (este archivo)
├── model.json
├── metadata.json
└── weights.bin
```
