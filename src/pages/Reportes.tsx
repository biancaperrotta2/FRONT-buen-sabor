import { useEffect, useState } from "react";
import HeaderAdmin from "../components/HeaderAdmin";
import SideBar from "../components/SideBar";
import { Boton } from "../components/Boton";
import { ApiError } from "../api/client";
import {
  ingresosPorPeriodo,
  ordenesPorCliente,
  rankingProductos,
  stockBajo,
  type Agrupacion,
  type ArticuloStockBajo,
  type IngresoPeriodo,
  type OrdenesPorCliente,
  type RankingProducto,
} from "../services/reporteService";

const hace30Dias = () => {
  const fecha = new Date();
  fecha.setDate(fecha.getDate() - 30);
  return fecha.toISOString().slice(0, 10);
};

const hoy = () => new Date().toISOString().slice(0, 10);

export const Reportes = () => {
  const [desde, setDesde] = useState(hace30Dias());
  const [hasta, setHasta] = useState(hoy());
  const [agrupacion, setAgrupacion] = useState<Agrupacion>("DIARIO");

  const [ranking, setRanking] = useState<RankingProducto[] | null>(null);
  const [ingresos, setIngresos] = useState<IngresoPeriodo[] | null>(null);
  const [ordenes, setOrdenes] = useState<OrdenesPorCliente[] | null>(null);
  const [bajoStock, setBajoStock] = useState<ArticuloStockBajo[] | null>(null);

  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cargarStockBajo = () => {
    stockBajo()
      .then(setBajoStock)
      .catch((e) => setError(e instanceof ApiError ? e.message : "No pudimos cargar el stock bajo."));
  };

  useEffect(() => {
    cargarStockBajo();
  }, []);

  const handleGenerar = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setCargando(true);
    try {
      const [r, i, o] = await Promise.all([
        rankingProductos(desde, hasta),
        ingresosPorPeriodo(desde, hasta, agrupacion),
        ordenesPorCliente(desde, hasta),
      ]);
      setRanking(r);
      setIngresos(i);
      setOrdenes(o);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No pudimos generar los reportes.");
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <HeaderAdmin />

      <div className="flex flex-1 overflow-auto">
        <SideBar />

        <main className="flex-1 py-10 px-10 pb-10 bg-gray-100">
          <h1 className="text-2xl font-semibold mb-6">Reportes</h1>

          {error && <p className="text-red-600 text-sm mb-4">{error}</p>}

          <form onSubmit={handleGenerar} className="flex flex-wrap items-end gap-4 mb-8 bg-white p-4 rounded-lg shadow">
            <div>
              <label className="block text-xs text-gray-600 mb-1">Desde</label>
              <input
                type="date"
                value={desde}
                onChange={(e) => setDesde(e.target.value)}
                required
                className="border rounded-md px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Hasta</label>
              <input
                type="date"
                value={hasta}
                onChange={(e) => setHasta(e.target.value)}
                required
                className="border rounded-md px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Agrupar ingresos por</label>
              <select
                value={agrupacion}
                onChange={(e) => setAgrupacion(e.target.value as Agrupacion)}
                className="border rounded-md px-3 py-2 text-sm"
              >
                <option value="DIARIO">Día</option>
                <option value="MENSUAL">Mes</option>
              </select>
            </div>
            <Boton
              tipo="submit"
              disabled={cargando}
              textoBoton={cargando ? "Generando..." : "Generar reportes"}
              estiloBoton="border rounded-md py-2 px-8 font-semibold text-sm bg-[#d6aa7b] text-white hover:bg-[#c69a69] transition disabled:opacity-60"
            />
          </form>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <section className="bg-white rounded-lg shadow p-4">
              <h2 className="font-semibold mb-3">Ranking de productos más vendidos</h2>
              {ranking === null ? (
                <p className="text-sm text-gray-500">Elegí un rango de fechas y generá el reporte.</p>
              ) : ranking.length === 0 ? (
                <p className="text-sm text-gray-500">Sin ventas en ese período.</p>
              ) : (
                <table className="w-full text-sm">
                  <thead className="text-left text-gray-600 border-b">
                    <tr>
                      <th className="py-2">Producto</th>
                      <th className="py-2 text-right">Cantidad vendida</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ranking.map((r) => (
                      <tr key={r.idArticulo} className="border-b last:border-0">
                        <td className="py-2">{r.nombreArticulo}</td>
                        <td className="py-2 text-right">{r.cantidadVendida}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </section>

            <section className="bg-white rounded-lg shadow p-4">
              <h2 className="font-semibold mb-3">Ingresos por período</h2>
              {ingresos === null ? (
                <p className="text-sm text-gray-500">Elegí un rango de fechas y generá el reporte.</p>
              ) : ingresos.length === 0 ? (
                <p className="text-sm text-gray-500">Sin ingresos en ese período.</p>
              ) : (
                <table className="w-full text-sm">
                  <thead className="text-left text-gray-600 border-b">
                    <tr>
                      <th className="py-2">Período</th>
                      <th className="py-2 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ingresos.map((i) => (
                      <tr key={i.periodo} className="border-b last:border-0">
                        <td className="py-2">{i.periodo}</td>
                        <td className="py-2 text-right">${i.total.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </section>

            <section className="bg-white rounded-lg shadow p-4">
              <h2 className="font-semibold mb-3">Órdenes por cliente</h2>
              {ordenes === null ? (
                <p className="text-sm text-gray-500">Elegí un rango de fechas y generá el reporte.</p>
              ) : ordenes.length === 0 ? (
                <p className="text-sm text-gray-500">Sin órdenes en ese período.</p>
              ) : (
                <table className="w-full text-sm">
                  <thead className="text-left text-gray-600 border-b">
                    <tr>
                      <th className="py-2">Cliente</th>
                      <th className="py-2 text-right">Órdenes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ordenes.map((o) => (
                      <tr key={o.idCliente} className="border-b last:border-0">
                        <td className="py-2">{o.nombreCliente}</td>
                        <td className="py-2 text-right">{o.cantidadOrdenes}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </section>

            <section className="bg-white rounded-lg shadow p-4">
              <h2 className="font-semibold mb-3">Insumos con stock bajo</h2>
              {bajoStock === null ? (
                <p className="text-sm text-gray-500">Cargando...</p>
              ) : bajoStock.length === 0 ? (
                <p className="text-sm text-gray-500">Ningún insumo está por debajo del mínimo.</p>
              ) : (
                <table className="w-full text-sm">
                  <thead className="text-left text-gray-600 border-b">
                    <tr>
                      <th className="py-2">Insumo</th>
                      <th className="py-2 text-right">Actual</th>
                      <th className="py-2 text-right">Mínimo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bajoStock.map((a) => (
                      <tr key={a.id} className="border-b last:border-0">
                        <td className="py-2">{a.denominacion}</td>
                        <td className="py-2 text-right text-red-600 font-semibold">
                          {a.stockActual} {a.unidadMedida?.abreviatura}
                        </td>
                        <td className="py-2 text-right">
                          {a.stockMinimo} {a.unidadMedida?.abreviatura}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </section>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Reportes;
