import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import * as XLSX from "xlsx";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import HeaderAdmin from "../components/HeaderAdmin";
import SideBar from "../components/SideBar";
import { ApiError } from "../api/client";
import {
  ingresosPorPeriodo,
  rankingProductos,
  resumenIngresos,
  stockPorNivel,
  type ArticuloStock,
  type CategoriaStockApi,
  type IngresoPeriodo,
  type NivelStockApi,
  type RankingProducto,
  type ResumenIngresos,
} from "../services/reporteService";

type Periodo = "DIARIO" | "SEMANAL" | "MENSUAL" | "ANUAL";

const PERIODO_LABEL: Record<Periodo, string> = {
  DIARIO: "Diario",
  SEMANAL: "Semanal",
  MENSUAL: "Mensual",
  ANUAL: "Anual",
};

const NIVEL_LABEL: Record<NivelStockApi, string> = {
  SUFICIENTE: "Stock suficiente",
  ULTIMAS: "Últimas unidades",
  AGOTADO: "Stock agotado",
};

const NIVEL_COLOR: Record<NivelStockApi, string> = {
  SUFICIENTE: "#16a34a",
  ULTIMAS: "#eab308",
  AGOTADO: "#dc2626",
};

const CATEGORIA_LABEL: Record<CategoriaStockApi, string> = {
  INSUMOS: "Insumos",
  SEMIELABORADOS: "Semielaborados",
};

const aFechaISO = (fecha: Date) => fecha.toISOString().slice(0, 10);

// Diario: solo hoy. Semanal/Mensual/Anual: los últimos N días hasta hoy.
const rangoPorPeriodo = (periodo: Periodo): { desde: string; hasta: string } => {
  const hasta = new Date();
  const desde = new Date();
  if (periodo === "SEMANAL") desde.setDate(desde.getDate() - 6);
  if (periodo === "MENSUAL") desde.setDate(desde.getDate() - 29);
  if (periodo === "ANUAL") desde.setDate(desde.getDate() - 364);
  return { desde: aFechaISO(desde), hasta: aFechaISO(hasta) };
};

const exportarExcel = (nombreArchivo: string, filas: Record<string, unknown>[]) => {
  const hoja = XLSX.utils.json_to_sheet(filas);
  const libro = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(libro, hoja, "Datos");
  XLSX.writeFile(libro, `${nombreArchivo}.xlsx`);
};

export const Admin = () => {
  // --- Gráfico Stock ---
  const [stockCategoria, setStockCategoria] = useState<CategoriaStockApi>("INSUMOS");
  const [stockNivel, setStockNivel] = useState<NivelStockApi>("AGOTADO");
  const [stockData, setStockData] = useState<ArticuloStock[]>([]);
  const [stockCargando, setStockCargando] = useState(true);
  const [stockError, setStockError] = useState<string | null>(null);

  // --- Gráfico Más vendidos ---
  const [ventasPeriodo, setVentasPeriodo] = useState<Periodo>("DIARIO");
  const [rankingData, setRankingData] = useState<RankingProducto[]>([]);
  const [rankingCargando, setRankingCargando] = useState(true);
  const [rankingError, setRankingError] = useState<string | null>(null);

  // --- Gráfico Ingresos ---
  const [ingresosPeriodo, setIngresosPeriodo] = useState<Periodo>("DIARIO");
  const [ingresosSerie, setIngresosSerie] = useState<IngresoPeriodo[]>([]);
  const [resumen, setResumen] = useState<ResumenIngresos | null>(null);
  const [ingresosCargando, setIngresosCargando] = useState(true);
  const [ingresosError, setIngresosError] = useState<string | null>(null);

  useEffect(() => {
    setStockCargando(true);
    stockPorNivel(stockCategoria, stockNivel)
      .then(setStockData)
      .catch((e) => setStockError(e instanceof ApiError ? e.message : "No pudimos cargar el stock."))
      .finally(() => setStockCargando(false));
  }, [stockCategoria, stockNivel]);

  useEffect(() => {
    setRankingCargando(true);
    const { desde, hasta } = rangoPorPeriodo(ventasPeriodo);
    rankingProductos(desde, hasta)
      .then((r) => setRankingData(r.slice(0, 10)))
      .catch((e) => setRankingError(e instanceof ApiError ? e.message : "No pudimos cargar el ranking."))
      .finally(() => setRankingCargando(false));
  }, [ventasPeriodo]);

  useEffect(() => {
    setIngresosCargando(true);
    const { desde, hasta } = rangoPorPeriodo(ingresosPeriodo);
    const agrupacion = ingresosPeriodo === "ANUAL" ? "MENSUAL" : "DIARIO";
    Promise.all([
      ingresosPorPeriodo(desde, hasta, agrupacion),
      resumenIngresos(desde, hasta),
    ])
      .then(([serie, resumenIng]) => {
        setIngresosSerie(serie);
        setResumen(resumenIng);
      })
      .catch((e) => setIngresosError(e instanceof ApiError ? e.message : "No pudimos cargar los ingresos."))
      .finally(() => setIngresosCargando(false));
  }, [ingresosPeriodo]);

  return (
    <div className="min-h-screen flex flex-col">
      <HeaderAdmin />

      <div className="flex flex-1 overflow-auto">
        <SideBar />

        <main className="flex-1 py-10 px-10 pb-10 bg-gray-100 space-y-6">
          <h1 className="text-2xl font-semibold">Administración</h1>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Link
              to="/clientes"
              className="bg-white rounded-lg shadow px-6 py-8 text-center text-lg font-semibold hover:bg-gray-50"
            >
              Clientes
            </Link>
            <Link
              to="/facturas"
              className="bg-white rounded-lg shadow px-6 py-8 text-center text-lg font-semibold hover:bg-gray-50"
            >
              Facturas
            </Link>
            <Link
              to="/empleados"
              className="bg-white rounded-lg shadow px-6 py-8 text-center text-lg font-semibold hover:bg-gray-50"
            >
              Empleados
            </Link>
          </div>

          {/* Gráfico Stock */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4">
              <h2 className="text-lg font-semibold">Stock</h2>
              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={stockCategoria}
                  onChange={(e) => setStockCategoria(e.target.value as CategoriaStockApi)}
                  className="border rounded-md px-3 py-1.5 text-sm"
                >
                  {Object.entries(CATEGORIA_LABEL).map(([valor, etiqueta]) => (
                    <option key={valor} value={valor}>
                      {etiqueta}
                    </option>
                  ))}
                </select>
                <select
                  value={stockNivel}
                  onChange={(e) => setStockNivel(e.target.value as NivelStockApi)}
                  className="border rounded-md px-3 py-1.5 text-sm"
                >
                  {Object.entries(NIVEL_LABEL).map(([valor, etiqueta]) => (
                    <option key={valor} value={valor}>
                      {etiqueta}
                    </option>
                  ))}
                </select>
                <button
                  className="cursor-pointer rounded-md px-4 py-1.5 text-sm text-white bg-green-600 hover:bg-green-500 disabled:opacity-50"
                  disabled={stockData.length === 0}
                  onClick={() =>
                    exportarExcel(
                      "stock",
                      stockData.map((a) => ({
                        Nombre: a.nombre,
                        "Stock actual": a.stockActual,
                        "Stock mínimo": a.stockMinimo,
                        "Stock máximo": a.stockMaximo,
                        Nivel: NIVEL_LABEL[a.nivel],
                      }))
                    )
                  }
                >
                  Exportar a Excel
                </button>
              </div>
            </div>

            {stockError && <p className="text-red-600 text-sm mb-2">{stockError}</p>}
            {stockCargando && <p className="text-gray-500 text-sm">Cargando...</p>}
            {!stockCargando && stockData.length === 0 && !stockError && (
              <p className="text-gray-500 text-sm">
                No hay {CATEGORIA_LABEL[stockCategoria].toLowerCase()} en "{NIVEL_LABEL[stockNivel]}".
              </p>
            )}
            {stockData.length > 0 && (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={stockData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="nombre" tick={{ fontSize: 12 }} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="stockActual" name="Stock actual" fill={NIVEL_COLOR[stockNivel]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Gráfico Más vendidos */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex flex-wrap items-center justify-between gap-3 pb-4">
                <h2 className="text-lg font-semibold">Más vendidos</h2>
                <div className="flex flex-wrap items-center gap-2">
                  <select
                    value={ventasPeriodo}
                    onChange={(e) => setVentasPeriodo(e.target.value as Periodo)}
                    className="border rounded-md px-3 py-1.5 text-sm"
                  >
                    {Object.entries(PERIODO_LABEL).map(([valor, etiqueta]) => (
                      <option key={valor} value={valor}>
                        {etiqueta}
                      </option>
                    ))}
                  </select>
                  <button
                    className="cursor-pointer rounded-md px-4 py-1.5 text-sm text-white bg-green-600 hover:bg-green-500 disabled:opacity-50"
                    disabled={rankingData.length === 0}
                    onClick={() =>
                      exportarExcel(
                        "mas_vendidos",
                        rankingData.map((r) => ({
                          Producto: r.nombreArticulo,
                          "Cantidad vendida": r.cantidadVendida,
                        }))
                      )
                    }
                  >
                    Exportar a Excel
                  </button>
                </div>
              </div>

              {rankingError && <p className="text-red-600 text-sm mb-2">{rankingError}</p>}
              {rankingCargando && <p className="text-gray-500 text-sm">Cargando...</p>}
              {!rankingCargando && rankingData.length === 0 && !rankingError && (
                <p className="text-gray-500 text-sm">No se vendió nada en este período.</p>
              )}
              {rankingData.length > 0 && (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={rankingData} layout="vertical" margin={{ left: 24 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" allowDecimals={false} />
                    <YAxis dataKey="nombreArticulo" type="category" width={110} tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="cantidadVendida" name="Cantidad vendida" fill="#d97706" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Gráfico Ingresos */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex flex-wrap items-center justify-between gap-3 pb-4">
                <h2 className="text-lg font-semibold">Ingresos</h2>
                <div className="flex flex-wrap items-center gap-2">
                  <select
                    value={ingresosPeriodo}
                    onChange={(e) => setIngresosPeriodo(e.target.value as Periodo)}
                    className="border rounded-md px-3 py-1.5 text-sm"
                  >
                    {Object.entries(PERIODO_LABEL).map(([valor, etiqueta]) => (
                      <option key={valor} value={valor}>
                        {etiqueta}
                      </option>
                    ))}
                  </select>
                  <button
                    className="cursor-pointer rounded-md px-4 py-1.5 text-sm text-white bg-green-600 hover:bg-green-500 disabled:opacity-50"
                    disabled={ingresosSerie.length === 0}
                    onClick={() =>
                      exportarExcel(
                        "ingresos",
                        ingresosSerie.map((i) => ({
                          Período: i.periodo,
                          Total: i.total,
                        }))
                      )
                    }
                  >
                    Exportar a Excel
                  </button>
                </div>
              </div>

              {resumen && (
                <div className="flex gap-6 pb-4">
                  <div>
                    <p className="text-2xl font-bold">{resumen.cantidadOrdenes}</p>
                    <p className="text-xs text-gray-500 uppercase">Órdenes</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold">${resumen.totalIngresos.toLocaleString()}</p>
                    <p className="text-xs text-gray-500 uppercase">Ganancias</p>
                  </div>
                </div>
              )}

              {ingresosError && <p className="text-red-600 text-sm mb-2">{ingresosError}</p>}
              {ingresosCargando && <p className="text-gray-500 text-sm">Cargando...</p>}
              {!ingresosCargando && ingresosSerie.length === 0 && !ingresosError && (
                <p className="text-gray-500 text-sm">No hubo ingresos en este período.</p>
              )}
              {ingresosSerie.length > 0 && (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={ingresosSerie}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="periodo" tick={{ fontSize: 12 }} />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="total" name="Ingresos" fill="#2563eb" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Admin;
