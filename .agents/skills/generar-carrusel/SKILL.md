---
name: generar-carrusel
description: >-
  Genera carruseles e historias ejecutivas de ingeniería de sistemas y tecnología para LinkedIn, Instagram y Facebook con renderizado ultra-nítido en PDF y PNG. Soporta personalización total de blueprints, cantidad de slides y narrativa estructurada.
---

# Skill: Generador de Carruseles Tech Parametrizado

Esta skill permite redactar y renderizar carruseles e historias con **control total de parámetros**: cantidad de diapositivas, formato (1:1 Cuadrado, 4:5 Vertical o 9:16 Historia) y estructura del guion.

## ⚙️ Parámetros Disponibles

1. **`topic` (Tema):** Título o concepto a explicar (ej. *"Por qué Linux adoptó Rust"*, *"Vibecoding en Empresas"*).
2. **`blueprint` (Plantilla de Narrativa):**
   - `standard_executive` (6 slides): Gancho 3D -> Comparativa -> Métricas -> Pipeline 3D -> Reglas -> Cierre 3D.
   - `historical_tech_story` (5 slides): Origen -> Crisis histórica -> Punto de inflexión -> Lecciones -> Debate.
   - `deep_dive_architecture` (8 slides): Análisis exhaustivo paso a paso para sistemas de alta concurrencia.
   - `quick_contrast` (4 slides): Comparativa directa ágil entre 2 herramientas.
3. **`slideCount` (Cantidad de Diapositivas):** Cualquier número entero (ej. 4, 5, 6, 7, 8).
4. **`format` (Formato Gráfico):**
   - `square` (1080x1080 px / 1:1 o 3:3 para LinkedIn, Instagram y Facebook Feed).
   - `story` (1080x1920 px / 9:16 para Historias de Instagram/FB).
   - `portrait` (1080x1350 px / 4:5 vertical).
5. **`customStructure` (Guion Personalizado):** Definición libre de cada diapositiva paso a paso.

## 🚀 Cómo Ejecutar

En cualquier momento puedes pedir:
> *"Genera un carrusel de 5 slides con el blueprint 'historical_tech_story' sobre el origen de Kubernetes y por qué Google lo liberó como Open Source"*

O simplemente:
> *"Genera el carrusel de hoy sobre System Design con 7 slides"*
