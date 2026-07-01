# Análisis de errores

Este documento recoge los casos en los que el modelo **falla** y una hipótesis
razonada de por qué ocurre. Cubre la sección de **análisis de errores (20%)**.

> ⚠️ Los ejemplos de la tabla son **ficticios / de referencia**. Reemplázalos con
> tus casos reales tras probar la web y observar predicciones equivocadas.
> Adjunta las capturas correspondientes en `docs/capturas/`.

---

## Tabla de errores observados

| Caso | Clase real       | Clase predicha   | Probabilidad | Hipótesis de la falla |
|------|------------------|------------------|--------------|-----------------------|
| 1    | `tostado_medio`  | `tostado_oscuro` | 61%          | Iluminación cálida/baja que oscurece los granos; alta similitud de color entre ambas clases. |
| 2    | `tostado_claro`  | `tostado_medio`  | 58%          | Frontera visual difusa entre claro y medio; pocas imágenes de tostado claro con buena luz. |
| 3    | `verde`          | `tostado_claro`  | 54%          | Fondo amarillento/madera que aporta tonos cálidos y confunde el color del grano verde. |
| 4    | `tostado_oscuro` | `tostado_medio`  | 63%          | Reflejos del brillo aceitoso bajo luz directa que "aclaran" la superficie del grano. |

*(Añade más filas con tus propios casos reales.)*

---

## Factores de error y cómo se relacionan con cada caso

### 1. Calidad del dataset
Si las fotos de una clase fueron tomadas casi todas con la misma luz o fondo, la
red aprende ese detalle irrelevante en lugar del color/textura del grano.
→ Relacionado con los **casos 2 y 3**.

### 2. Ruido visual (fondos y sombras)
Fondos con textura, sombras marcadas o reflejos introducen patrones que compiten
con el grano. La red puede fijarse en el fondo, no en el café.
→ Relacionado con los **casos 3 y 4**.

### 3. Datos insuficientes
Con solo 30 imágenes por clase, hay poca diversidad. Cualquier condición no vista
durante el entrenamiento (una luz nueva, un ángulo raro) puede provocar error.
→ Afecta transversalmente a **todos los casos**.

### 4. Similitud entre clases
El caso más obvio: **`tostado_medio` vs `tostado_oscuro`** (y en menor medida
`claro` vs `medio`). Sus diferencias de color son graduales y continuas, no
categóricas; la frontera que la red debe trazar es intrínsecamente ambigua.
→ Relacionado con los **casos 1, 2 y 4**.

### 5. Sobreajuste (overfitting)
Si el modelo se entrena demasiado o con datos poco variados, "memoriza" las
imágenes de entrenamiento en lugar de generalizar. Da 99% de acierto en las fotos
usadas para entrenar, pero falla con granos nuevos.
→ Se detecta cuando funciona perfecto con tus fotos originales pero mal en vivo.

---

## Recomendaciones para reducir errores

1. **Más imágenes y más variadas** por clase (60–100 si es posible).
2. Fotografiar con **múltiples fuentes de luz** y a distintas horas del día.
3. Usar **fondos neutros y variados** (no siempre el mismo).
4. Incluir ejemplos de la **frontera** entre clases parecidas.
5. Considerar una clase extra **"ninguno / fondo"** para cuando no hay granos.
6. No sobre-entrenar; validar con imágenes que la red **no** vio.
