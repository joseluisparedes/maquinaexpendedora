# Sistema de Finanzas — Máquina Expendedora (Colegio)

Sistema web para el registro de compras, control de recaudaciones y reparto automatizado de utilidades entre socios inversionistas, operadora y espacio educativo.

---

## 🎯 Características Principales

1. **Gestión de Participantes:**
   - Socio 1, Socio 2 y Socio 3 (Socios inversionistas).
   - Operador/a de la máquina.
   - Directora del colegio (espacio institucional).
   - Distinción de atributo `es_socio` para participación exclusiva en sobrantes de compras.

2. **Reparto de Ganancias Automatizado:**
   - Esquema de porcentajes configurable con validación estricta al **100.00%**.
   - **Snapshots históricos**: cada recaudación guarda la foto de los porcentajes vigentes al momento del registro, protegiendo reportes históricos ante futuras modificaciones.
   - Ajuste de centavos por redondeo asignado al último participante para garantizar suma exacta.

3. **Registro de Movimientos:**
   - **Ganar (Recaudación)**: cálculo en vivo del reparto por participante al centavo.
   - **Comprar (Mercadería)**: 
     - Monto asignado (caja), monto adicional (de bolsillo con participante asociado) y monto sobrante.
     - Cálculo de gasto real: `monto_asignado + monto_adicional - monto_sobrante`.
     - Detalle opcional de productos con cantidad, costo unitario y subtotales.

4. **Manejo Inteligente de Sobrantes:**
   - **Devolver a caja**: se reintegra al fondo disponible para la siguiente compra.
   - **Repartir entre socios**: genera automáticamente un movimiento vinculado de reparto exclusivo entre los 3 socios (partes iguales o según esquema configurado).

5. **Auditoría Contable:**
   - Los movimientos **no se eliminan**; se anulan con motivo justificado para trazabilidad.

6. **Dashboard y Reporte de Cierre de Periodo:**
   - KPIs: Total Ganado, Total Gastado, Resultado Neto, Saldo en Caja, Aportes Extra Pendientes y Sobrantes.
   - Estado de cuenta por participante.
   - Resumen mensual con botón de **Copiar para WhatsApp** e **Imprimir / PDF**.

7. **Arquitectura Híbrida y Costo Cero:**
   - Almacenamiento dual: **Supabase** (en la nube) + **LocalStorage** (offline resiliente).
   - Coexiste dentro de un proyecto existente de Supabase con prefijo `vending_*` sin consumir slots adicionales de base de datos.
   - Exportación e importación de respaldos en JSON y exportación de movimientos en CSV/Excel.

---

## 🛠️ Tecnologías

- **Frontend:** React 19 + TypeScript + Vite + Tailwind CSS v4 + Lucide React.
- **Base de Datos:** PostgreSQL en Supabase (`@supabase/supabase-js`).
- **Control de Versiones:** Git & GitHub.

---

## 🚀 Instalación y Ejecución Local

1. Clonar el repositorio:
   ```bash
   git clone https://github.com/joseluisparedes/maquinaexpendedora.git
   cd maquinaexpendedora
   ```

2. Instalar dependencias:
   ```bash
   npm install
   ```

3. Configurar variables de entorno:
   Copiar `.env.example` a `.env` y colocar las credenciales de Supabase:
   ```env
   VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
   VITE_SUPABASE_ANON_KEY=tu-anon-key-aqui
   ```

4. Ejecutar el servidor de desarrollo:
   ```bash
   npm run dev
   ```
   Abrir en el navegador: [http://localhost:5173/](http://localhost:5173/).

5. Compilar para producción:
   ```bash
   npm run build
   ```
