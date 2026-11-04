import { useEffect, useState, type InputHTMLAttributes } from "react";

interface Props
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "value" | "onChange" | "type" | "min"> {
  value: number | "";
  onChange: (valor: number | "") => void;
  decimales?: boolean;
}

const aNumero = (texto: string): number | "" =>
  texto === "" || texto === "." ? "" : Number(texto);

// Input numérico que deja el campo vacío mientras se escribe y no acumula ceros a la
// izquierda ("013000" pasa a "13000"). Un <input type="number"> controlado con un número
// no lo permite: React no pisa el texto "013000" porque Number("013000") === 13000.
export const InputNumerico = ({ value, onChange, decimales = true, ...resto }: Props) => {
  const [texto, setTexto] = useState(value === "" ? "" : String(value));

  useEffect(() => {
    setTexto((actual) => (aNumero(actual) === value ? actual : value === "" ? "" : String(value)));
  }, [value]);

  const manejarCambio = (e: React.ChangeEvent<HTMLInputElement>) => {
    const limpio = e.target.value.replace(",", ".");
    if (!(decimales ? /^\d*\.?\d*$/ : /^\d*$/).test(limpio)) return;
    const sinCeros = limpio.replace(/^0+(?=\d)/, "");
    setTexto(sinCeros);
    onChange(aNumero(sinCeros));
  };

  return (
    <input
      {...resto}
      type="text"
      inputMode={decimales ? "decimal" : "numeric"}
      value={texto}
      onChange={manejarCambio}
    />
  );
};

export default InputNumerico;
