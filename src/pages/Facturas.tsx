import { useState } from "react";
import HeaderAdmin from "../components/HeaderAdmin";
import SideBar from "../components/SideBar";
import EncabezadoOrdenable from "../components/EncabezadoOrdenable";
import Paginador from "../components/Paginador";
import { ApiError } from "../api/client";
import { useTablaServidor } from "../hooks/useTablaServidor";
import { abrirFacturaPdf, listarFacturas, type Factura } from "../services/facturaService";

export const Facturas = () => {
  const {
    busqueda,
    setBusqueda,
    pagina,
    setPagina,
    ordenarPor,
    direccion,
    alClickearColumna,
    datos,
    cargando,
    error,
  } = useTablaServidor<Factura>(listarFacturas);

  const [abriendo, setAbriendo] = useState<number | null>(null);
  const [errorPdf, setErrorPdf] = useState<string | null>(null);

  const handleVerPdf = async (idFactura: number) => {
    setAbriendo(idFactura);
    try {
      await abrirFacturaPdf(idFactura);
    } catch (e) {
      setErrorPdf(e instanceof ApiError ? e.message : "No pudimos abrir el PDF de la factura.");
    } finally {
      setAbriendo(null);
    }
  };

  const facturas = datos?.contenido ?? [];

  return (
    <div className="min-h-screen flex flex-col">
      <HeaderAdmin />

      <div className="flex flex-1 overflow-auto">
        <SideBar />

        <main className="flex-1 py-10 px-10 pb-10 bg-gray-100">
          <h1 className="text-2xl font-semibold pb-4">Facturas</h1>

          <input
            type="text"
            placeholder="Buscar por número o cliente..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full max-w-sm mb-4 border rounded-md px-3 py-2 text-sm"
          />

          {(error || errorPdf) && <p className="text-red-600 text-sm mb-4">{error ?? errorPdf}</p>}

          <div className="overflow-x-auto rounded-lg shadow bg-white">
            <table className="min-w-full text-sm text-center">
              <thead className="bg-gray-200 text-gray-700">
                <tr>
                  <EncabezadoOrdenable campo="numeroComprobante" etiqueta="N° Factura" ordenarPor={ordenarPor} direccion={direccion} onClick={alClickearColumna} />
                  <th className="px-6 py-3">Pedido</th>
                  <th className="px-6 py-3">Cliente</th>
                  <EncabezadoOrdenable campo="fechaFacturacion" etiqueta="Fecha" ordenarPor={ordenarPor} direccion={direccion} onClick={alClickearColumna} />
                  <EncabezadoOrdenable campo="totalVenta" etiqueta="Total" ordenarPor={ordenarPor} direccion={direccion} onClick={alClickearColumna} />
                  <th className="px-6 py-3">Acciones</th>
                </tr>
              </thead>
              <tbody className="text-gray-800">
                {cargando && (
                  <tr>
                    <td colSpan={6} className="px-6 py-6 text-gray-500">
                      Cargando...
                    </td>
                  </tr>
                )}
                {!cargando && facturas.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-6 text-gray-500">
                      No hay facturas que coincidan con la búsqueda.
                    </td>
                  </tr>
                )}
                {facturas.map((f) => (
                  <tr key={f.idFactura} className="border-b hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium">{f.numeroFactura}</td>
                    <td className="px-6 py-4">#{f.idPedido}</td>
                    <td className="px-6 py-4">{f.nombreCliente ?? `Cliente #${f.idCliente}`}</td>
                    <td className="px-6 py-4">{f.fecha}</td>
                    <td className="px-6 py-4">${f.total.toLocaleString()}</td>
                    <td className="px-6 py-4">
                      <button
                        className="cursor-pointer rounded-md px-6 py-2 text-white bg-blue-500 hover:bg-blue-300 disabled:opacity-60"
                        onClick={() => handleVerPdf(f.idFactura)}
                        disabled={abriendo === f.idFactura}
                      >
                        {abriendo === f.idFactura ? "Abriendo..." : "Ver PDF"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {datos && (
              <Paginador
                pagina={pagina}
                totalPaginas={datos.totalPaginas}
                totalElementos={datos.totalElementos}
                tamanio={datos.tamanio}
                onCambiarPagina={setPagina}
              />
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Facturas;
