# Rendimiento del mundo

El catálogo y los niveles son datos pequeños. El coste principal de este mundo son las ilustraciones decodificadas, las capas de luz y los elementos animados que están visibles a la vez.

Las imágenes originales se conservan como PNG. La aplicación utiliza copias WebP en `public/assets/world/optimized`: sprites de hasta 768 × 768 píxeles, paisajes de hasta 1200 × 1920 y miniaturas de hasta 128 × 128 para inventario y recompensas. Se mantiene la proporción y la transparencia; las coordenadas de colocación, anclajes y luces no cambian.

Medición del catálogo actual: 44 imágenes originales, 76.984.559 bytes; copias para la escena, 5.521.810 bytes (93 % menos); miniaturas, 307.982 bytes adicionales. Estas cifras corresponden a la colección completa, no a la descarga de entrada a una escena. El directorio público conserva también los originales y las ilustraciones antiguas, por lo que su tamaño en disco es mayor que los archivos solicitados por la aplicación.

Regenerar después de agregar ilustraciones:

```sh
npm run optimize:world
node scripts/check-world-artwork.mjs
node scripts/check-world-editor.mjs
npm run build
```

La escena carga el paisaje correspondiente a la hora; ambos se usan durante amanecer y atardecer. El inventario carga miniaturas bajo demanda. El service worker excluye el catálogo completo de la descarga inicial y conserva en caché las imágenes que se usan, con un límite de 128 entradas.

Los objetos colocados usan React.memo y una función estable de selección para evitar volver a renderizarlos todos al desplazar la cámara. Las actualizaciones cercanas de inventario y colocaciones agrupan su lectura de progreso durante 250 ms. Tras registrar con éxito la visita del usuario al bosque, las siguientes actualizaciones de esa sesión y día solo consultan el progreso. Un fallo permite volver a intentar registrar la visita.

La comprobación de imágenes mide archivos y valida proporciones y transparencia; no es una medición de FPS. Para evaluar fluidez y batería queda probar un bosque poblado en un teléfono real, de día y de noche, desplazando la cámara y abriendo el inventario. El número de objetos colocados y luces activas sigue influyendo aunque se compriman las imágenes.

## Caché de desarrollo

La aplicación usa `node_modules/.vite-app` y las comprobaciones del editor usan `tmp.local/world-editor-vite-cache`. Deben permanecer separadas: ejecutar un servidor de pruebas con otra configuración sobre la misma caché reemplazaba las dependencias de la aplicación abierta. Se reprodujo una página vacía con una respuesta HTTP 504 para `react-dom_client.js`; con la caché propia la página volvió a cargar sin errores de JavaScript. Se verificó también que ejecutar las comprobaciones no cambia el hash del manifiesto de dependencias de la aplicación.
