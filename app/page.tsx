"use client"

import { useState, useCallback } from "react";

// ── Types ────────────────────────────────────────────────────────────────────

interface CepData {
  cep: string;
  logradouro: string;
  complemento: string;
  bairro: string;
  localidade: string;
  uf: string;
  ibge: string;
  ddd: string;
}

type Status = "idle" | "loading" | "success" | "error";

// ── Constants ────────────────────────────────────────────────────────────────

const ESTADO_NAMES: Record<string, string> = {
  AC: "Acre", AL: "Alagoas", AP: "Amapá", AM: "Amazonas", BA: "Bahia",
  CE: "Ceará", DF: "Distrito Federal", ES: "Espírito Santo", GO: "Goiás",
  MA: "Maranhão", MT: "Mato Grosso", MS: "Mato Grosso do Sul",
  MG: "Minas Gerais", PA: "Pará", PB: "Paraíba", PR: "Paraná",
  PE: "Pernambuco", PI: "Piauí", RJ: "Rio de Janeiro",
  RN: "Rio Grande do Norte", RS: "Rio Grande do Sul", RO: "Rondônia",
  RR: "Roraima", SC: "Santa Catarina", SP: "São Paulo",
  SE: "Sergipe", TO: "Tocantins",
};

const MAX_HISTORY = 6;

// ── Sub-components ───────────────────────────────────────────────────────────

function IconPin() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M8 1.5C5.51 1.5 3.5 3.51 3.5 6c0 3.75 4.5 8.5 4.5 8.5S12.5 9.75 12.5 6c0-2.49-2.01-4.5-4.5-4.5z" />
      <circle cx="8" cy="6" r="1.5" />
    </svg>
  );
}

function IconSearch() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="6.5" cy="6.5" r="4" />
      <line x1="9.5" y1="9.5" x2="14" y2="14" />
    </svg>
  );
}

function IconCopy() {
  return (
    <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="5" y="5" width="9" height="9" rx="1.5" />
      <path d="M11 5V3.5A1.5 1.5 0 0 0 9.5 2H2A1.5 1.5 0 0 0 .5 3.5V11A1.5 1.5 0 0 0 2 12.5H3.5" />
    </svg>
  );
}

function IconCheck() {
  return (
    <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="2 8 6 12 14 4" />
    </svg>
  );
}

function Spinner() {
  return (
    <div className="w-6 h-6 rounded-full border-2 border-gray-200 border-t-gray-900 animate-spin mx-auto mb-3" />
  );
}

interface FieldProps {
  label: string;
  value?: string;
  mono?: boolean;
  fullWidth?: boolean;
}

function Field({ label, value, mono, fullWidth }: FieldProps) {
  return (
    <div className={`px-5 py-3.5 border-b border-gray-100 last:border-b-0 ${fullWidth ? "col-span-2" : ""}`}>
      <p className="text-[10px] font-semibold tracking-widest uppercase text-gray-400 mb-1">
        {label}
      </p>
      <p className={`text-sm font-medium ${mono ? "font-mono" : ""} ${value ? "text-gray-900" : "text-gray-200"}`}>
        {value || "—"}
      </p>
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────────────────────

export default function CepSearch() {
  const [input, setInput] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [data, setData] = useState<CepData | null>(null);
  const [error, setError] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);
  const [inputError, setInputError] = useState(false);

  // Mask: 00000-000
  const handleInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    let v = e.target.value.replace(/\D/g, "");
    if (v.length > 5) v = v.slice(0, 5) + "-" + v.slice(5, 8);
    setInput(v);
    setInputError(false);
    setError("");
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") handleSearch();
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [input]
  );

  const handleSearch = useCallback(
    async (cepOverride?: string) => {
      const raw = (cepOverride ?? input).replace(/\D/g, "");

      if (raw.length !== 8) {
        setInputError(true);
        setError("Informe um CEP válido com 8 dígitos.");
        return;
      }

      setStatus("loading");
      setData(null);
      setError("");

      try {
        const res = await fetch(`https://viacep.com.br/ws/${raw}/json/`);
        const json = await res.json();

        if (json.erro) {
          setStatus("error");
          setInputError(true);
          setError("CEP não encontrado. Verifique e tente novamente.");
          return;
        }

        setData(json);
        setStatus("success");
        setHistory((prev) => {
          const next = [raw, ...prev.filter((c) => c !== raw)].slice(0, MAX_HISTORY);
          return next;
        });
      } catch {
        setStatus("error");
        setError("Erro ao consultar. Verifique sua conexão.");
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [input]
  );

  const handleCopy = useCallback(() => {
    if (!data) return;
    const parts = [data.logradouro, data.complemento, data.bairro, data.localidade, data.uf, data.cep];
    navigator.clipboard.writeText(parts.filter(Boolean).join(", "));
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }, [data]);

  const handleHistoryClick = (cep: string) => {
    const fmt = cep.slice(0, 5) + "-" + cep.slice(5);
    setInput(fmt);
    handleSearch(cep);
  };

  return (
    <>
      {/* Google Fonts + custom keyframe not available natively in Tailwind */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Syne:wght@400;500;600&display=swap');
        .font-syne  { font-family: 'Syne', sans-serif; }
        .font-dm-mono { font-family: 'DM Mono', monospace; }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .animate-slide-up { animation: slideUp 0.25s ease; }
        .cep-input::placeholder { color: #d1d5db; }
      `}</style>

      <div className="font-syne max-w-2xl mx-auto px-6 py-10">

        {/* Header */}
        <div className="mb-8">
          <p className="text-[11px] font-semibold tracking-[0.12em] text-center uppercase text-gray-400 mb-1.5">
            Consulta de endereço
          </p>
          <h1 className="text-4xl font-semibold text-black text-center leading-tight">
            Busca por CEP
          </h1>
        </div>

        {/* Search row */}
        <div className={`flex gap-2.5 ${error ? "mb-2" : "mb-6"}`}>
          <div className="flex-1 relative">
            <span className={`absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none transition-colors ${inputError ? "text-red-500" : "text-gray-400"}`}>
              <IconPin />
            </span>
            <input
              className={`cep-input font-dm-mono w-full h-12 pl-10 pr-3.5 text-[15px] tracking-[0.06em] bg-white text-gray-900 rounded-lg border-[1.5px] transition-colors duration-150 focus:outline-none focus:border-gray-500 ${inputError ? "border-red-500" : "border-gray-200"}`}
              type="text"
              value={input}
              onChange={handleInput}
              onKeyDown={handleKeyDown}
              placeholder="00000-000"
              maxLength={9}
              autoComplete="off"
            />
          </div>

          <button
            onClick={() => handleSearch()}
            disabled={status === "loading"}
            className={`font-syne flex items-center gap-2 h-12 px-5 bg-gray-900 text-white text-sm font-medium rounded-lg whitespace-nowrap transition-all duration-150 hover:opacity-80 active:scale-95 ${status === "loading" ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}`}
          >
            <IconSearch />
            Buscar
          </button>
        </div>

        {/* Error message */}
        {error && (
          <p className="text-xs text-red-500 mb-5">{error}</p>
        )}

        {/* Loading */}
        {status === "loading" && (
          <div className="bg-white border border-gray-100 rounded-xl p-8 text-center">
            <Spinner />
            <p className="text-[13px] text-gray-400">Consultando CEP...</p>
          </div>
        )}

        {/* Result card */}
        {status === "success" && data && (
          <div className="bg-white border border-gray-100 rounded-xl overflow-hidden animate-slide-up">

            {/* Card header */}
            <div className="flex items-start justify-between gap-3 px-6 py-5 border-b border-gray-100">
              <div>
                <span className="font-dm-mono inline-block text-[12px] font-medium tracking-[0.08em] bg-gray-50 text-gray-500 border border-gray-100 px-2.5 py-1 rounded-full mb-2">
                  {data.cep}
                </span>
                <p className="text-[18px] font-semibold text-gray-900 leading-snug mb-0.5">
                  {data.logradouro || "Logradouro não informado"}
                </p>
                <p className="text-[13px] text-gray-400">{data.bairro}</p>
              </div>

              <button
                onClick={handleCopy}
                className="font-syne shrink-0 flex items-center gap-1.5 h-9 px-3.5 text-xs font-medium text-gray-500 border border-gray-200 rounded-lg bg-transparent transition-colors duration-150 hover:bg-gray-50 hover:text-gray-900 cursor-pointer"
              >
                {copied ? <IconCheck /> : <IconCopy />}
                {copied ? "Copiado" : "Copiar"}
              </button>
            </div>

            {/* Fields grid */}
            <div className="grid grid-cols-2 [&>div:nth-child(odd)]:border-r [&>div:nth-child(odd)]:border-gray-100 [&>div:nth-last-child(-n+2)]:border-b-0">
              <Field label="Cidade" value={data.localidade} />
              <Field label="Estado" value={data.uf ? `${data.uf} — ${ESTADO_NAMES[data.uf] ?? ""}` : undefined} />
              <Field label="IBGE" value={data.ibge} mono />
              <Field label="DDD" value={data.ddd ? `(${data.ddd})` : undefined} mono />
              {data.complemento && (
                <Field label="Complemento" value={data.complemento} fullWidth />
              )}
            </div>
          </div>
        )}

        {/* History */}
        {history.length > 0 && (
          <div className="mt-6">
            <p className="text-[10px] font-semibold tracking-widest uppercase text-gray-400 mb-2.5">
              Buscas recentes
            </p>
            <div className="flex flex-wrap gap-2">
              {history.map((cep) => (
                <button
                  key={cep}
                  onClick={() => handleHistoryClick(cep)}
                  className="font-dm-mono text-xs tracking-[0.06em] px-3.5 py-1.5 border border-gray-200 rounded-full text-gray-500 bg-white transition-colors duration-150 hover:bg-gray-100 hover:text-gray-900 hover:border-gray-400 cursor-pointer"
                >
                  {cep.slice(0, 5)}-{cep.slice(5)}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
