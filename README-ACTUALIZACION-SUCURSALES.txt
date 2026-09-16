ACTUALIZACION RULETA MONTERREY - SUCURSALES

1. Reemplazar el script.js actual por el script.js de este paquete.
   El selector de sucursal se crea automaticamente, por lo que no es necesario editar index.html.

2. Sucursales configuradas:
   La Paz: 15, 3, 18
   Potosi: 19
   Sucre: 17
   Tarija: 20
   Trinidad: 11
   Santa Cruz: Central, 1, 2, 4, 5, 6, 7, 8, 9, 10, 12, 16, 21, 31, 32

3. Google Apps Script:
   Reemplazar el codigo actual por apps-script-google-sheets-sucursal.gs.
   Guardar y crear una nueva implementacion/version del Web App.
   Mantener: Ejecutar como tu cuenta / acceso: cualquier persona.

4. La hoja Participaciones se migra automaticamente si actualmente tiene:
   Fecha | Hora | Regional | Factura | Premio
   En la primera consulta/registro, el script inserta Sucursal antes de Factura.
   El orden final queda:
   Fecha | Hora | Regional | Sucursal | Factura | Premio

5. El validador sigue verificando la factura globalmente. La sucursal se guarda como dato de la participacion, pero no cambia la regla de factura unica.

6. Antes de publicar:
   - Probar cada regional y confirmar que aparecen sus sucursales.
   - Probar una factura valida.
   - Confirmar en Google Sheets que aparece la sucursal correcta.
   - Hacer git add, commit y git push.
