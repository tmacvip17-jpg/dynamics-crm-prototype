import React, { useState, useEffect } from "react";
import { opportunitiesApi } from "../lib/api";
import type { Opportunity } from "../lib/types";

interface ParsedResult {
  id: string;
  original_topic: string;
  oes: string;
  oem: string;
  model: string;
}

interface ApiConfig {
  providerType: 'openai' | 'azure';
  baseUrl: string;
  apiKey: string;
  modelName: string;
  apiVersion: string;
}

export default function AITopicParser() {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [parsedData, setParsedData] = useState<ParsedResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [analyzeLimit, setAnalyzeLimit] = useState<number | 'all'>('all');

  // Modal State
  const [showConfig, setShowConfig] = useState(false);
  const [apiConfig, setApiConfig] = useState<ApiConfig>(() => {
    const saved = localStorage.getItem('ai_topic_parser_config');
    if (saved) return JSON.parse(saved);
    return {
      providerType: "openai",
      baseUrl: "https://api.deepseek.com/v1/chat/completions",
      apiKey: "",
      modelName: "deepseek-chat",
      apiVersion: "2024-02-15-preview"
    };
  });

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const data = await opportunitiesApi.list();
        setOpportunities(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const saveConfig = (config: ApiConfig) => {
    setApiConfig(config);
    localStorage.setItem('ai_topic_parser_config', JSON.stringify(config));
    setShowConfig(false);
  };

  const callLLM = async (topics: { id: string, topic: string }[]) => {
    const prompt = `
You are an expert CRM data analyst. Your task is to extract structural entities from a list of sales opportunity topics.
For each topic, extract the following 3 fields:
1. "oes": The Tier 1 supplier or parts manufacturer (e.g., CATL, Bosch, Denso, Magna). If not found, return "Unknown".
2. "model": The vehicle model (e.g., Model 3, Han, ET7, SUV). If not found, return "Unknown".
3. "oem": The original equipment manufacturer / car brand (e.g., Tesla, BYD, NIO, BMW). If not found, return "Unknown".

You MUST return the result strictly as a valid JSON array of objects. Do not include any markdown formatting like \`\`\`json.
Input data:
${JSON.stringify(topics, null, 2)}

Expected output format:
[
  {"id": "id1", "oes": "...", "model": "...", "oem": "..."},
  ...
]
`;

    const isAzure = apiConfig.providerType === 'azure';
    
    // Format URL for Azure
    let fetchUrl = apiConfig.baseUrl;
    if (isAzure) {
      // Clean up base url if they included /v1 or /chat/completions
      let base = apiConfig.baseUrl.replace(/\/v1\/?$/, '').replace(/\/chat\/completions\/?$/, '');
      if (base.endsWith('/')) base = base.slice(0, -1);
      fetchUrl = `${base}/deployments/${apiConfig.modelName}/chat/completions?api-version=${apiConfig.apiVersion}`;
    }

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (isAzure) {
      headers["api-key"] = apiConfig.apiKey;
    } else {
      headers["Authorization"] = `Bearer ${apiConfig.apiKey}`;
    }

    const response = await fetch(fetchUrl, {
      method: "POST",
      headers,
      body: JSON.stringify({
        model: apiConfig.modelName,
        messages: [{ role: "user", content: prompt }],
        temperature: 0.1
      })
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} - ${await response.text()}`);
    }

    const json = await response.json();
    let content = json.choices[0].message.content.trim();
    if (content.startsWith("```json")) {
      content = content.replace(/^```json/, '').replace(/```$/, '').trim();
    }
    
    return JSON.parse(content) as { id: string, oes: string, model: string, oem: string }[];
  };

  const handleStartAnalysis = async () => {
    if (!apiConfig.apiKey) {
      alert("Please configure your API Key first.");
      setShowConfig(true);
      return;
    }

    setAnalyzing(true);
    setProgress(0);
    setParsedData([]);

    // Apply limit
    const targetOpportunities = analyzeLimit === 'all' 
      ? opportunities 
      : opportunities.slice(0, analyzeLimit);

    const total = targetOpportunities.length;
    if (total === 0) {
      setAnalyzing(false);
      return;
    }

    const batchSize = 10;
    let results: ParsedResult[] = [];
    
    try {
      for (let i = 0; i < total; i += batchSize) {
        const batch = targetOpportunities.slice(i, i + batchSize);
        const inputPayload = batch.map(opp => ({ id: opp.id, topic: opp.topic || "Untitled" }));
        
        try {
          const llmResult = await callLLM(inputPayload);
          const mappedResults = llmResult.map(res => {
            const opp = batch.find(o => o.id === res.id);
            return {
              id: res.id,
              original_topic: opp?.topic || "Untitled",
              oes: res.oes || "Unknown",
              oem: res.oem || "Unknown",
              model: res.model || "Unknown"
            };
          });
          results = [...results, ...mappedResults];
        } catch (err) {
          console.error("Batch processing failed:", err);
          // Fill failed batch with unknowns
          const failedResults = batch.map(opp => ({
            id: opp.id,
            original_topic: opp.topic || "Untitled",
            oes: "Error",
            oem: "Error",
            model: "Error"
          }));
          results = [...results, ...failedResults];
        }
        
        setProgress(Math.round((Math.min(i + batchSize, total) / total) * 100));
        setParsedData([...results]);
      }
    } catch (globalErr) {
      alert("A critical error occurred during processing. Please check your API settings and console.");
    }

    setAnalyzing(false);
  };

  return (
    <div className="flex flex-col h-full bg-[#fdf8f6] relative">
      {/* Config Modal */}
      {showConfig && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded shadow-2xl w-full max-w-[400px] flex flex-col overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h2 className="text-[15px] font-semibold text-slate-800">LLM API Configuration</h2>
              <button onClick={() => setShowConfig(false)} className="text-slate-400 hover:text-slate-600"><span className="material-symbols-outlined text-[18px]">close</span></button>
            </div>
            <div className="p-5 flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[12px] font-medium text-slate-700">Provider Type</label>
                <select 
                  value={apiConfig.providerType}
                  onChange={e => setApiConfig({...apiConfig, providerType: e.target.value as 'openai' | 'azure'})}
                  className="border border-slate-300 rounded px-3 py-1.5 text-[13px] outline-none focus:border-[#0072c6] bg-white"
                >
                  <option value="openai">Standard OpenAI Compatible (OpenAI, DeepSeek, etc.)</option>
                  <option value="azure">Azure OpenAI</option>
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[12px] font-medium text-slate-700">
                  {apiConfig.providerType === 'azure' ? 'Azure OpenAI Endpoint (e.g., https://resource.openai.azure.com/openai)' : 'API Base URL'}
                </label>
                <input 
                  type="text" 
                  value={apiConfig.baseUrl}
                  onChange={e => setApiConfig({...apiConfig, baseUrl: e.target.value})}
                  className="border border-slate-300 rounded px-3 py-1.5 text-[13px] outline-none focus:border-[#0072c6]"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[12px] font-medium text-slate-700">
                  {apiConfig.providerType === 'azure' ? 'Deployment Name (e.g., gpt-5.4)' : 'Model Name'}
                </label>
                <input 
                  type="text" 
                  value={apiConfig.modelName}
                  onChange={e => setApiConfig({...apiConfig, modelName: e.target.value})}
                  className="border border-slate-300 rounded px-3 py-1.5 text-[13px] outline-none focus:border-[#0072c6]"
                />
              </div>
              {apiConfig.providerType === 'azure' && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-[12px] font-medium text-slate-700">API Version</label>
                  <input 
                    type="text" 
                    value={apiConfig.apiVersion}
                    onChange={e => setApiConfig({...apiConfig, apiVersion: e.target.value})}
                    className="border border-slate-300 rounded px-3 py-1.5 text-[13px] outline-none focus:border-[#0072c6]"
                    placeholder="2024-02-15-preview"
                  />
                </div>
              )}
              <div className="flex flex-col gap-1.5">
                <label className="text-[12px] font-medium text-slate-700">
                  {apiConfig.providerType === 'azure' ? 'API Key (api-key)' : 'API Key (Bearer Token)'}
                </label>
                <input 
                  type="password" 
                  value={apiConfig.apiKey}
                  onChange={e => setApiConfig({...apiConfig, apiKey: e.target.value})}
                  className="border border-slate-300 rounded px-3 py-1.5 text-[13px] outline-none focus:border-[#0072c6]"
                  placeholder="sk-..."
                />
              </div>
              <div className="text-[11px] text-slate-500 bg-blue-50 p-3 rounded border border-blue-100">
                {apiConfig.providerType === 'azure' 
                  ? "Configured for Azure OpenAI. The URL will be auto-formatted to include your deployment name and API version."
                  : "This config uses standard OpenAI chat completion schema. Keys are saved locally in your browser."}
              </div>
            </div>
            <div className="px-5 py-3 bg-slate-50 flex justify-end gap-2 border-t border-slate-100">
              <button onClick={() => setShowConfig(false)} className="px-4 py-1.5 text-[12px] font-medium text-slate-600 hover:bg-slate-200 rounded">Cancel</button>
              <button onClick={() => saveConfig(apiConfig)} className="px-4 py-1.5 text-[12px] font-medium text-white bg-[#0072c6] hover:bg-[#005a9e] rounded shadow-sm">Save Config</button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="px-6 py-5 flex flex-col md:flex-row md:items-center justify-between border-b border-slate-200 z-10 sticky top-0 bg-white shadow-sm">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#8a2be2] text-[24px]">smart_toy</span>
            <h1 className="text-[20px] font-semibold text-slate-900">AI Topic Extraction</h1>
          </div>
          <p className="text-[13px] text-slate-500">Extract OES, Vehicle Model, and OEM from opportunities using a real LLM.</p>
        </div>
        <div className="mt-4 md:mt-0 flex items-center gap-3">
          <select 
            value={analyzeLimit} 
            onChange={(e) => setAnalyzeLimit(e.target.value === 'all' ? 'all' : Number(e.target.value))}
            disabled={analyzing}
            className="border border-slate-300 rounded px-3 py-2 text-[13px] text-slate-700 outline-none focus:border-[#8a2be2] bg-white transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <option value={5}>Test 5 Items</option>
            <option value={10}>Test 10 Items</option>
            <option value={50}>Process 50 Items</option>
            <option value={100}>Process 100 Items</option>
            <option value="all">Process All ({opportunities.length})</option>
          </select>

          <button 
            onClick={() => setShowConfig(true)}
            className="flex items-center gap-2 px-3 py-2 rounded font-medium text-[13px] text-slate-600 border border-slate-300 hover:bg-slate-50 transition-all"
          >
            <span className="material-symbols-outlined text-[18px]">settings</span> Config API
          </button>
          <button 
            onClick={handleStartAnalysis} 
            disabled={analyzing || loading || opportunities.length === 0}
            className={`flex items-center gap-2 px-5 py-2 rounded font-medium text-[13px] transition-all shadow-sm ${analyzing || loading || opportunities.length === 0 ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-[#8a2be2] hover:bg-[#7a20c9] text-white active:scale-95'}`}
          >
            {analyzing ? (
              <><span className="material-symbols-outlined text-[18px] animate-spin">refresh</span> Processing...</>
            ) : (
              <><span className="material-symbols-outlined text-[18px]">auto_fix_high</span> Start AI Analysis</>
            )}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto p-6 bg-slate-50/50">
        <div className="max-w-6xl mx-auto flex flex-col gap-6">
          
          {/* Progress / Status Area */}
          {analyzing && (
            <div className="bg-white border border-indigo-100 rounded-lg p-6 shadow-sm flex flex-col gap-4 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-50/50 to-purple-50/50 pointer-events-none"></div>
              <div className="relative flex justify-between items-end">
                <div className="flex flex-col gap-1">
                  <span className="text-[14px] font-semibold text-indigo-900">LLM is Analyzing Records...</span>
                  <span className="text-[12px] text-indigo-600/70 font-medium">Processing {analyzeLimit === 'all' ? opportunities.length : Math.min(analyzeLimit, opportunities.length)} opportunities in batches via {apiConfig.modelName}</span>
                </div>
                <span className="text-[28px] font-bold text-[#8a2be2] tabular-nums leading-none">{progress}%</span>
              </div>
              <div className="h-2 w-full bg-indigo-100 rounded-full overflow-hidden relative">
                <div 
                  className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-300 ease-out relative" 
                  style={{ width: `${progress}%` }}
                >
                  <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(255,255,255,.2)_25%,transparent_25%,transparent_50%,rgba(255,255,255,.2)_50%,rgba(255,255,255,.2)_75%,transparent_75%,transparent)] bg-[length:15px_15px] animate-[progress_1s_linear_infinite]" />
                </div>
              </div>
            </div>
          )}

          {/* Data Grid */}
          <div className="bg-white border border-slate-200 rounded shadow-sm overflow-hidden flex flex-col">
            {loading ? (
              <div className="h-40 flex items-center justify-center text-slate-500 text-[13px]">Loading opportunities...</div>
            ) : (
              <>
                <div className="px-4 py-3 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                  <h2 className="text-[14px] font-semibold text-slate-700">Extraction Results</h2>
                  <span className="text-[12px] text-slate-500">{parsedData.length} Processed</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-[13px]">
                    <thead className="bg-white border-b-2 border-slate-200">
                      <tr>
                        <th className="py-3 px-4 font-semibold text-slate-600 uppercase tracking-widest text-[11px] w-[35%]">Original Topic</th>
                        <th className="py-3 px-4 font-semibold text-indigo-600 uppercase tracking-widest text-[11px] w-[20%]">OES</th>
                        <th className="py-3 px-4 font-semibold text-emerald-600 uppercase tracking-widest text-[11px] w-[20%]">Vehicle Model</th>
                        <th className="py-3 px-4 font-semibold text-amber-600 uppercase tracking-widest text-[11px] w-[25%]">OEM</th>
                      </tr>
                    </thead>
                    <tbody>
                      {parsedData.length === 0 && !analyzing ? (
                        <tr>
                          <td colSpan={4} className="py-12 text-center text-slate-400 text-[13px]">
                            <span className="material-symbols-outlined text-[32px] mb-2 block opacity-50">data_exploration</span>
                            Click "Start AI Analysis" to invoke the LLM
                          </td>
                        </tr>
                      ) : (
                        parsedData.map((row, i) => (
                          <tr key={row.id} className={`border-b border-slate-100 hover:bg-slate-50 transition-colors animate-in fade-in slide-in-from-bottom-2 duration-300 ${i % 2 !== 0 ? 'bg-slate-50/30' : ''}`}>
                            <td className="py-3 px-4 text-slate-800 font-medium">{row.original_topic}</td>
                            <td className="py-3 px-4">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded text-[12px] font-medium ${(row.oes && row.oes !== 'Unknown' && row.oes !== 'Error') ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' : 'text-slate-400'}`}>
                                {row.oes}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded text-[12px] font-medium ${(row.model && row.model !== 'Unknown' && row.model !== 'Error') ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'text-slate-400'}`}>
                                {row.model}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded text-[12px] font-medium ${(row.oem && row.oem !== 'Unknown' && row.oem !== 'Error') ? 'bg-amber-50 text-amber-700 border border-amber-100' : 'text-slate-400'}`}>
                                {row.oem}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
