/* eslint-disable @typescript-eslint/no-explicit-any */

"use client";
import React, { useState, useEffect } from "react";

export function ResearchOptimizationDashboard({ missionId }: { missionId: string }) {
  const [data, setData] = useState<any>(null);
  const [forecast, setForecast] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchOptimizationData = async () => {
    setLoading(true);
    try {
      const [optRes, forecastRes] = await Promise.all([
        fetch(`/api/missions/${missionId}/optimization`),
        fetch(`/api/missions/${missionId}/optimization/forecast`),
      ]);
      setData(await optRes.json());
      setForecast(await forecastRes.json());
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchOptimizationData();
  }, [missionId]);

  const analyze = async () => {
    await fetch(`/api/missions/${missionId}/optimization/analyze`, { method: "POST" });
    fetchOptimizationData();
  };

  const approve = async (id: string) => {
    await fetch(`/api/missions/${missionId}/optimization/recommendations/${id}/approve`, {
      method: "POST",
    });
    fetchOptimizationData();
  };

  const reject = async (id: string) => {
    await fetch(`/api/missions/${missionId}/optimization/recommendations/${id}/reject`, {
      method: "POST",
    });
    fetchOptimizationData();
  };

  if (loading) return <div>Loading optimization dashboard...</div>;
  if (!data || !forecast) return <div>Error loading data.</div>;

  return (
    <div className="space-y-6">
      <div className="rounded-lg border bg-white p-4 shadow">
        <h2 className="text-xl font-bold">Optimization Forecast</h2>
        <div className="mb-2 text-2xl font-bold">Score: {forecast.score}/100</div>
        <p className="text-gray-600">{forecast.forecast}</p>
        <button onClick={analyze} className="mt-4 rounded bg-blue-600 px-4 py-2 text-white">
          Run Analysis
        </button>
      </div>

      <div>
        <h3 className="mb-4 text-lg font-bold">Recommendations</h3>
        {data.recommendations?.length === 0 && <p>No recommendations available.</p>}
        {data.recommendations?.map((rec: any) => (
          <div key={rec.id} className="mb-4 rounded-lg border bg-gray-50 p-4">
            <div className="flex items-start justify-between">
              <div>
                <h4 className="font-bold">{rec.title}</h4>
                <p className="mb-2 text-sm text-gray-500">{rec.description}</p>
                <p className="text-sm">Impact: {rec.projectedImpact}</p>
                <p className="text-sm font-semibold">Confidence: {rec.confidenceScore * 100}%</p>
              </div>
              <div>
                <span className="rounded bg-gray-200 px-2 py-1 text-xs">{rec.status}</span>
              </div>
            </div>
            {rec.status === "PENDING" && (
              <div className="mt-4 space-x-2">
                <button
                  className="rounded bg-green-600 px-3 py-1 text-white"
                  onClick={() => approve(rec.id)}
                >
                  Approve & Execute
                </button>
                <button
                  className="rounded bg-red-600 px-3 py-1 text-white"
                  onClick={() => reject(rec.id)}
                >
                  Reject
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      <div>
        <h3 className="mb-4 text-lg font-bold">Execution History</h3>
        {data.events?.length === 0 && <p>No history.</p>}
        <ul className="space-y-2">
          {data.events?.map((ev: any) => (
            <li key={ev.id} className="border-b pb-2 text-sm">
              <span className="font-semibold">{ev.actionType}</span> -{" "}
              {new Date(ev.createdAt).toLocaleString()}
              <br />
              <span className="text-gray-500">{ev.reason}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
