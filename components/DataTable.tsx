import React, { useState } from "react";
import { CountryData } from "../types";
import { ArrowUpDown } from "lucide-react";

interface Props {
  data: CountryData[];
}

type SortKey = keyof CountryData;
type SortOrder = "asc" | "desc";

const DataTable: React.FC<Props> = ({ data }) => {
  const [sortKey, setSortKey] = useState<SortKey>("country_code");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortOrder("asc");
    }
  };

  const sorted = [...data].sort((a, b) => {
    const valA = a[sortKey] ?? 0;
    const valB = b[sortKey] ?? 0;

    if (typeof valA === "string") {
      return sortOrder === "asc"
        ? valA.localeCompare(valB as string)
        : valB.localeCompare(valA as string);
    }

    return sortOrder === "asc" ? valA - (valB as number) : (valB as number) - valA;
  });

  const renderSortIcon = (key: SortKey) => (
    <ArrowUpDown
      size={14}
      className={`ml-2 inline ${
        sortKey === key ? "text-blue-600" : "text-slate-400"
      }`}
    />
  );

  return (
    <div className="overflow-x-auto rounded-xl bg-white border border-slate-200 shadow-sm">
      <table className="w-full text-sm text-left">
        <thead className="bg-slate-50 text-slate-600 uppercase text-xs">
          <tr>
            <th className="px-4 py-3 cursor-pointer" onClick={() => handleSort("country_code")}>
              CODE {renderSortIcon("country_code")}
            </th>
            <th className="px-4 py-3 cursor-pointer" onClick={() => handleSort("stations")}>
              Stations {renderSortIcon("stations")}
            </th>
            <th className="px-4 py-3 cursor-pointer" onClick={() => handleSort("EIRI")}>
              Readiness (EIRI) {renderSortIcon("EIRI")}
            </th>
            <th className="px-4 py-3 cursor-pointer" onClick={() => handleSort("model_availability")}>
              Model Availability {renderSortIcon("model_availability")}
            </th>
            <th className="px-4 py-3 cursor-pointer" onClick={() => handleSort("gap_value")}>
              Gap {renderSortIcon("gap_value")}
            </th>
            <th className="px-4 py-3 cursor-pointer" onClick={() => handleSort("median_power")}>
              Median Power (kW) {renderSortIcon("median_power")}
            </th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((row) => (
            <tr key={row.country_code} className="border-t hover:bg-blue-50/40 transition">
              <td className="px-4 py-3">{row.country_code}</td>
              <td className="px-4 py-3">{row.stations.toLocaleString()}</td>
              <td className="px-4 py-3">{row.EIRI.toFixed(1)}</td>
              <td className="px-4 py-3">{row.model_availability.toFixed(1)}</td>
              <td className={`px-4 py-3 font-medium ${row.gap_value > 0 ? "text-blue-600" : "text-red-500"}`}>
                {row.gap_value > 0 ? "+" : ""}
                {row.gap_value.toFixed(1)}
              </td>
              <td className="px-4 py-3">{row.median_power}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default DataTable;
