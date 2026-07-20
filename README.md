# Open Source Accessible Pan-Hispanic Language Academy (OSAPHLA)

![OSAPHLA — Open Source Accessible Pan-Hispanic Language Academy](public/branding/github-social-preview.png)

An Open-Source, Accessible, & Pan-Hispanic Language Academy with two complete paths: Spanish for English speakers and English for Spanish speakers.

*Una academia de idiomas de código abierto, accesible y panhispánica con dos rutas completas: español para angloparlantes e inglés para hispanoparlantes.*

Each path contains **36 weeks, 180 assessed sections, 4,320 question-bank items,
and 88 reading activities** (360 sections total). Both target an ILR 2
core with ILR 2+/2+/2 stretch preparation; it does not claim to award an official
ILR rating.

*Cada ruta contiene **36 semanas, 180 secciones evaluadas, 4,320 elementos del banco de preguntas y 88 actividades de lectura** (360 secciones en total). Ambas apuntan a un núcleo ILR 2 con preparación de ampliación ILR 2+/2+/2; no se pretende otorgar una calificación ILR oficial.*

The course is a single-user PWA. All settings, attempts, recordings, and progress
stay in the browser. There is no account system, telemetry, advertising, remote
database, or required runtime API.

*El curso es una PWA de un solo usuario. Toda la configuración, los intentos, las grabaciones y el progreso permanecen en el navegador. No hay sistema de cuentas, telemetría, publicidad, base de datos remota ni API en tiempo de ejecución obligatoria.*

## Try the Demo / Probar la demo

A working demo can be found at https://osaphla.cryptojones.dev

*Puedes encontrar una demo funcional en https://osaphla.cryptojones.dev*

## Start the academy / Iniciar la academia

Install a current Node.js LTS release, then open a terminal in this repository.

*Instala una versión LTS reciente de Node.js y luego abre una terminal en este repositorio.*

### macOS

```bash
npm install
npm run start:local
```

### Windows (PowerShell)

```powershell
npm install
npm run start:local
```

### Linux

```bash
npm install
npm run start:local
```

`npm run start:local` prompts for a port, remembers that preference in your operating
system's user configuration directory, verifies the port is available, starts Vite,
and opens the resulting URL in Firefox when Firefox is installed. Pass a port without
the prompt using `npm run start:local -- --port 5180`. Stop the server with `Ctrl+C`.
On later runs, press Enter to reuse the remembered port. The lower-level `npm run dev`
command remains available when automatic port selection is preferable.

*`npm run start:local` pregunta por un puerto, recuerda esa preferencia en el directorio de configuración de usuario de tu sistema operativo, verifica que el puerto esté disponible, inicia Vite y abre la URL resultante en Firefox cuando Firefox está instalado. Puedes indicar un puerto sin la pregunta usando `npm run start:local -- --port 5180`. Detén el servidor con `Ctrl+C`. En ejecuciones posteriores, presiona Enter para reutilizar el puerto recordado. El comando de nivel inferior `npm run dev` sigue disponible cuando prefieres la selección automática de puerto.*

New learners first choose English or Spanish, then receive native-language guidance
to configure the visual-comfort lab and save their settings. The lab offers
system, high-contrast dark, high-contrast light, low-glare charcoal, warm paper,
and monochrome themes plus independent typography, spacing, reading-width, focus,
cursor, density, and motion controls.

*Los nuevos estudiantes eligen primero inglés o español y luego reciben orientación en su idioma nativo para configurar el laboratorio de comodidad visual y guardar su configuración. El laboratorio ofrece temas de sistema, alto contraste oscuro, alto contraste claro, carbón de bajo deslumbramiento, papel cálido y monocromo, además de controles independientes de tipografía, espaciado, ancho de lectura, enfoque, cursor, densidad y movimiento.*

Create a production PWA with `npm run build`, then preview it with
`npm run preview`. The app shell and authored course work offline after the first
load. Week media and the optional speech model use separate browser caches so they
can be managed without erasing progress. The Display page includes a one-button
offline media installer for the selected course's 180 videos and narration tracks.

*Crea una PWA de producción con `npm run build` y luego previsualízala con `npm run preview`. La estructura de la aplicación y el curso ya autorado funcionan sin conexión después de la primera carga. Los medios semanales y el modelo de voz opcional usan cachés de navegador independientes para que se puedan administrar sin borrar el progreso. La página de Pantalla incluye un instalador de medios sin conexión de un solo botón para los 180 videos y pistas de narración del curso seleccionado.*

## Instruction and assessment / Instrucción y evaluación

Every section includes:

- themeable semantic slides with optional local narration;
- a descriptive transcript and an optional rendered MP4;
- objectives, instruction, vocabulary, model sentences, and a productive task;
- an on-device microphone lab with optional local Whisper transcription;
- a 24-item bank: eight multiple choice, eight cloze, and eight ordering items;
- a randomized twelve-item attempt with four items of each type and an 85% target.

*Cada sección incluye:*

- *diapositivas semánticas con temas personalizables y narración local opcional;*
- *una transcripción descriptiva y un MP4 renderizado opcional;*
- *objetivos, instrucción, vocabulario, oraciones modelo y una tarea productiva;*
- *un laboratorio de micrófono en el dispositivo con transcripción local opcional mediante Whisper;*
- *un banco de 24 elementos: ocho de opción múltiple, ocho de completar espacios y ocho de ordenar;*
- *un intento aleatorizado de doce elementos con cuatro de cada tipo y una meta del 85%.*

Ordering works through ordinary buttons and dedicated left/right controls, so drag
precision is never required. Early cloze work warns about missing accents; later
work requires them. Regional accepted forms are explicit rather than fuzzily graded.

*El ordenamiento funciona mediante botones normales y controles dedicados de izquierda/derecha, por lo que nunca se requiere precisión de arrastre. El trabajo temprano de completar espacios advierte sobre acentos faltantes; el trabajo posterior los requiere. Las formas regionales aceptadas son explícitas en lugar de calificarse de manera imprecisa.*

## Local media rendering / Renderizado local de medios

The adaptive HTML presentation is the authoritative, fully themeable instruction.
Optional MP4 copies use the same slide data and descriptive text:

*La presentación HTML adaptable es la instrucción autorizada y completamente personalizable. Las copias MP4 opcionales usan los mismos datos de diapositivas y texto descriptivo:*

```bash
npm run render:media -- --course es --section w01-briefing
npm run render:media -- --course en --kind input --force --jobs 3
npm run render:media -- --course es --theme low-glare
npm run render:media -- --course en --force --jobs 3
```

The second command renders every section and safely skips completed files. Add
`--force` to rebuild, and use `--jobs 1` through `--jobs 4` to control parallel
local rendering. Rendered media lives under `public/media/es/` and
`public/media/en/`. The renderer uses the local Kokoro
neural model, Chrome, and FFmpeg, creates captions and transcripts, and accepts any
supported visual theme. Narration follows a deterministic, balanced rotation:
original Dora, younger Dora Y1, younger Dora Y3, original Santa, and Dora/Santa E
each narrate 36 Spanish lessons. Heart, Bella, Sky, Michael, and Liam each narrate
36 English lessons. Each lesson keeps its assigned voice across rerenders.
Both paths use phoneme-level `en-us` and `es-419` code-switching. Spanish terms inside English instruction retain Latin
American pronunciation (for example, `usted` is routed as `ustˈed`, never through
the English phonemizer). The generated Kokoro audio powers the MP4, adaptive slide
narration, and vocabulary pronunciation controls; browser system TTS is not used
for normal lesson playback.

*El segundo comando renderiza cada sección y omite de forma segura los archivos ya completados. Agrega `--force` para reconstruir, y usa `--jobs 1` hasta `--jobs 4` para controlar el renderizado local en paralelo. Los medios renderizados se encuentran en `public/media/es/` y `public/media/en/`. El renderizador usa el modelo neuronal local Kokoro, Chrome y FFmpeg, crea subtítulos y transcripciones, y acepta cualquier tema visual compatible. La narración sigue una rotación determinista y equilibrada: Dora original, Dora más joven Y1, Dora más joven Y3, Santa original y Dora/Santa E narran cada uno 36 lecciones en español. Heart, Bella, Sky, Michael y Liam narran cada uno 36 lecciones en inglés. Cada lección conserva su voz asignada en cada rerenderizado. Ambas rutas usan alternancia de código `en-us` y `es-419` a nivel de fonema. Los términos en español dentro de la instrucción en inglés conservan la pronunciación latinoamericana (por ejemplo, `usted` se enruta como `ustˈed`, nunca a través del fonemizador en inglés). El audio de Kokoro generado impulsa el MP4, la narración de diapositivas adaptables y los controles de pronunciación de vocabulario; el TTS del sistema del navegador no se usa para la reproducción normal de las lecciones.*

Set `KOKORO_PYTHON` and `KOKORO_MODEL_DIR` when the existing courseware environment
is not installed in its usual location. Python dependencies are pinned in
`requirements-tts.txt`.

*Configura `KOKORO_PYTHON` y `KOKORO_MODEL_DIR` cuando el entorno de curso existente no esté instalado en su ubicación habitual. Las dependencias de Python están fijadas en `requirements-tts.txt`.*

After a full render, run `npm run media:validate -- --course es` or
`npm run media:validate -- --course en` to verify every section's video,
adaptive slide audio, vocabulary audio, captions, transcript, balanced narrator
assignment, encoding, and phoneme-level pronunciation audit.

*Después de un renderizado completo, ejecuta `npm run media:validate -- --course es` o `npm run media:validate -- --course en` para verificar el video, el audio de diapositivas adaptables, el audio de vocabulario, los subtítulos, la transcripción, la asignación equilibrada de narradores, la codificación y la auditoría de pronunciación a nivel de fonema de cada sección.*

## Quality gates / Controles de calidad

```bash
npm run curriculum:validate
npm run bilingual:validate
npm test
npm run build
npm run test:e2e
# or run the complete suite:
npm run qa
```

The automated gates verify the complete curriculum contract, balanced assessments,
production build, first-run accessibility, WCAG scanning, and
320-pixel reflow. See `docs/ACCESSIBILITY.md` and `docs/CURRICULUM.md` for the
behavioral specification. The English-path reference methodology and bibliography
are documented in `docs/ENGLISH_SOURCES.md`; source books are never copied into the
repository or production bundle.

*Los controles automatizados verifican el contrato completo del plan de estudios, las evaluaciones equilibradas, la compilación de producción, la accesibilidad en la primera ejecución, el escaneo WCAG y el reflujo de 320 píxeles. Consulta `docs/ACCESSIBILITY.md` y `docs/CURRICULUM.md` para la especificación del comportamiento. La metodología de referencia y la bibliografía de la ruta en inglés están documentadas en `docs/ENGLISH_SOURCES.md`; los libros fuente nunca se copian en el repositorio ni en el paquete de producción.*

---

*Proudly Made in Nebraska. Go Big Red! 🌽 <https://xkcd.com/2347/>*
