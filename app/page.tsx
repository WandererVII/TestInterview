/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import { useState, useEffect } from "react";
import React from "react";

interface Material {
  id: string;
  name: string;
  unit: string;
  totalQty: number;
  lotCount: number;
  lots: Array<{
    lotNo: string;
    qty: number;
    expiry: string;
  }>;
}

interface IssueRecord {
  id: string;
  timestamp: string;
  jobNumber: string;
  materialId: string;
  quantity: number;
  lotsDeducted: Array<{
    lotNo: string;
    qty: number;
  }>;
}

export default function Home() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [issueHistory, setIssueHistory] = useState<IssueRecord[]>([]);
  const [selectedMaterial, setSelectedMaterial] = useState("");
  const [quantity, setQuantity] = useState("");
  const [jobNumber, setJobNumber] = useState("");
  const [notification, setNotification] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [expandedMaterial, setExpandedMaterial] = useState<string | null>(null);

  const showNotification = (type: "success" | "error", message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  const fetchStock = async () => {
    try {
      const response = await fetch("/api/stock");
      const data = await response.json();
      setMaterials(data);
    } catch {
      showNotification("error", "Failed to fetch stock data");
    }
  };

  const fetchIssueHistory = async () => {
    try {
      const response = await fetch("/api/history");
      const data = await response.json();
      setIssueHistory(data);
    } catch {
      showNotification("error", "Failed to fetch issue history");
    }
  };

  useEffect(() => {
    (async () => {
      await fetchStock();
      await fetchIssueHistory();
    })();
  }, []);

  const handleIssue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMaterial || !quantity || !jobNumber) {
      showNotification("error", "Please fill in all fields");
      return;
    }

    try {
      const response = await fetch("/api/issue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          materialId: selectedMaterial,
          quantity: parseInt(quantity),
          jobNumber,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        showNotification("success", data.message);
        setQuantity("");
        setJobNumber("");
        fetchStock();
        fetchIssueHistory();
      } else {
        showNotification("error", data.message);
      }
    } catch {
      showNotification("error", "Failed to issue material");
    }
  };

  const toggleExpand = (materialId: string) => {
    setExpandedMaterial(expandedMaterial === materialId ? null : materialId);
  };

  const formatDate = (isoString: string) => {
    return new Date(isoString).toLocaleString("th-TH");
  };

  const isLowStock = (qty: number) => qty < 30;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-black dark:text-zinc-50 mb-8">
          Mini Material Issue System
        </h1>

        {/* Stock View */}
        <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-2xl font-semibold text-black dark:text-zinc-50 mb-4">
            Stock View
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-700">
                  <th className="text-left p-3 text-black dark:text-zinc-50">
                    Material ID
                  </th>
                  <th className="text-left p-3 text-black dark:text-zinc-50">
                    Name
                  </th>
                  <th className="text-left p-3 text-black dark:text-zinc-50">
                    Unit
                  </th>
                  <th className="text-left p-3 text-black dark:text-zinc-50">
                    Total Qty
                  </th>
                  <th className="text-left p-3 text-black dark:text-zinc-50">
                    Lots
                  </th>
                  <th className="text-left p-3 text-black dark:text-zinc-50">
                    Status
                  </th>
                  <th className="text-left p-3 text-black dark:text-zinc-50">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {materials.map((material) => (
                  <React.Fragment key={material.id}>
                    <tr className="border-b border-zinc-100 dark:border-zinc-800">
                      <td className="p-3 text-black dark:text-zinc-50">
                        {material.id}
                      </td>
                      <td className="p-3 text-black dark:text-zinc-50">
                        {material.name}
                      </td>
                      <td className="p-3 text-black dark:text-zinc-50">
                        {material.unit}
                      </td>
                      <td className="p-3 text-black dark:text-zinc-50">
                        {material.totalQty}
                      </td>
                      <td className="p-3 text-black dark:text-zinc-50">
                        {material.lotCount}
                      </td>
                      <td className="p-3">
                        {isLowStock(material.totalQty) && (
                          <span className="inline-block px-2 py-1 text-xs font-semibold text-red-800 bg-red-100 rounded-full dark:bg-red-900 dark:text-red-200">
                            Low Stock
                          </span>
                        )}
                      </td>
                      <td className="p-3">
                        <button
                          onClick={() => toggleExpand(material.id)}
                          className="text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                        >
                          {expandedMaterial === material.id
                            ? "Hide"
                            : "View Lots"}
                        </button>
                      </td>
                    </tr>
                    {expandedMaterial === material.id && (
                      <tr>
                        <td
                          colSpan={7}
                          className="p-3 bg-zinc-50 dark:bg-zinc-800"
                        >
                          <table className="w-full ml-8">
                            <thead>
                              <tr className="border-b border-zinc-200 dark:border-zinc-700">
                                <th className="text-left p-2 text-black dark:text-zinc-50">
                                  Lot No
                                </th>
                                <th className="text-left p-2 text-black dark:text-zinc-50">
                                  Qty
                                </th>
                                <th className="text-left p-2 text-black dark:text-zinc-50">
                                  Expiry Date
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {material.lots.map((lot) => (
                                <tr
                                  key={lot.lotNo}
                                  className="border-b border-zinc-100 dark:border-zinc-800"
                                >
                                  <td className="p-2 text-black dark:text-zinc-50">
                                    {lot.lotNo}
                                  </td>
                                  <td className="p-2 text-black dark:text-zinc-50">
                                    {lot.qty}
                                  </td>
                                  <td className="p-2 text-black dark:text-zinc-50">
                                    {lot.expiry}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Material Issue Form */}
        <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-2xl font-semibold text-black dark:text-zinc-50 mb-4">
            Material Issue
          </h2>
          <form onSubmit={handleIssue} className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-black dark:text-zinc-50 mb-2">
                Material
              </label>
              <select
                value={selectedMaterial}
                onChange={(e) => setSelectedMaterial(e.target.value)}
                className="w-full p-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-black dark:text-zinc-50"
              >
                <option value="">Select material</option>
                {materials.map((material) => (
                  <option key={material.id} value={material.id}>
                    {material.name} ({material.id})
                  </option>
                ))}
              </select>
            </div>
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-black dark:text-zinc-50 mb-2">
                Quantity
              </label>
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                min="1"
                className="w-full p-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-black dark:text-zinc-50"
              />
            </div>
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-black dark:text-zinc-50 mb-2">
                Job Number
              </label>
              <input
                type="text"
                value={jobNumber}
                onChange={(e) => setJobNumber(e.target.value)}
                placeholder="e.g., JOB-100"
                className="w-full p-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-black dark:text-zinc-50"
              />
            </div>
            <div className="flex items-end">
              <button
                type="submit"
                className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                Issue
              </button>
            </div>
          </form>
        </div>

        {notification && (
          <div
            className={`mb-6 p-4 rounded-lg ${
              notification.type === "success"
                ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
            }`}
          >
            {notification.message}
          </div>
        )}

        {/* Issue History */}
        <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-semibold text-black dark:text-zinc-50 mb-4">
            Issue History
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-700">
                  <th className="text-left p-3 text-black dark:text-zinc-50">
                    Time
                  </th>
                  <th className="text-left p-3 text-black dark:text-zinc-50">
                    Job Number
                  </th>
                  <th className="text-left p-3 text-black dark:text-zinc-50">
                    Material
                  </th>
                  <th className="text-left p-3 text-black dark:text-zinc-50">
                    Quantity
                  </th>
                  <th className="text-left p-3 text-black dark:text-zinc-50">
                    Lots Deducted
                  </th>
                </tr>
              </thead>
              <tbody>
                {issueHistory.map((record) => (
                  <tr
                    key={record.id}
                    className="border-b border-zinc-100 dark:border-zinc-800"
                  >
                    <td className="p-3 text-black dark:text-zinc-50">
                      {formatDate(record.timestamp)}
                    </td>
                    <td className="p-3 text-black dark:text-zinc-50">
                      {record.jobNumber}
                    </td>
                    <td className="p-3 text-black dark:text-zinc-50">
                      {record.materialId}
                    </td>
                    <td className="p-3 text-black dark:text-zinc-50">
                      {record.quantity}
                    </td>
                    <td className="p-3 text-black dark:text-zinc-50">
                      {record.lotsDeducted.map((lot) => (
                        <span key={lot.lotNo} className="inline-block mr-2">
                          {lot.lotNo}: {lot.qty}
                        </span>
                      ))}
                    </td>
                  </tr>
                ))}
                {issueHistory.length === 0 && (
                  <tr>
                    <td
                      colSpan={5}
                      className="p-3 text-center text-zinc-500 dark:text-zinc-400"
                    >
                      No issue records yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
