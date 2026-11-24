# VNDZ I Love Music

Aplicación web musical construida con HTML, CSS y JavaScript puro.

## Catálogo y reproducción
- Búsqueda con Deezer (JSONP) e iTunes.
- Los resultados del catálogo ofrecen adelantos de aproximadamente 30 segundos cuando el proveedor los proporciona.
- Para reproducir canciones completas se necesita un servicio de streaming autorizado y una cuenta; esta aplicación no desbloquea ni descarga canciones completas.
- Letras sincronizadas mediante LRCLIB.
- Favoritos, listas, estadísticas locales y Vendezú DJ con automix.

## Liquid Glass 2.0
- Reflejo especular localizado que sigue el puntero/dedo.
- Capas de brillo, bordes y fondos de cristal.
- Partículas ambientales ligeras mediante gradientes CSS.
- Parallax táctil del escenario 3D de Vendezú DJ y de la portada.
- Transiciones elásticas y movimiento basado principalmente en transform y opacity.

## Controles visuales
En Ajustes → Apariencia y cristal:
- Intensidad del cristal.
- Brillo y bordes.
- Refracción (solo si el navegador declara soporte; no se fuerza en navegadores incompatibles).
- Fondo animado, portada animada, 3D, fondo adaptado a la portada, desenfoque progresivo y fiesta DJ.
- Reflejos táctiles, partículas ambientales y parallax del DJ.
- Perfil de rendimiento: Máxima, Equilibrada o Ahorro.
- Interruptores de rendimiento anteriores: Mejor rendimiento del cristal, Reducir desenfoque dinámico y Reducir animaciones.

El perfil Ahorro reduce desenfoque y movimiento ambiental. Los controles son combinables; para el menor consumo, activa Ahorro y desactiva los efectos que no necesites.

## PWA
La app incluye `manifest.json` y `sw.js` para instalación y caché de archivos estáticos. El catálogo, las portadas externas, las letras y el audio requieren conexión según el proveedor.

## Pruebas pendientes
La validación de sintaxis de JavaScript no sustituye pruebas reales en un Samsung Android. Comprueba instalación PWA, búsqueda Deezer/iTunes, reproducción de adelantos, letras, automix, controles táctiles, modo Ahorro y desplazamiento con la frecuencia de pantalla disponible.
