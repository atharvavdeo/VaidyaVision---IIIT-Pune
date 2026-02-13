"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Download, Printer, Loader2 } from "lucide-react";

export default function ReportViewPage() {
    const router = useRouter();
    const params = useParams();
    const id = params.id as string;
    const [report, setReport] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const printRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (id) {
            fetch(`/api/reports/${id}`)
                .then((r) => r.json())
                .then((data) => {
                    setReport(data.report);
                    setLoading(false);
                })
                .catch(() => setLoading(false));
        }
    }, [id]);

    const handlePrint = () => {
        window.print();
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="w-10 h-10 animate-spin text-emerald-600" />
            </div>
        );
    }

    if (!report) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                <p className="text-lg font-medium">Report not found</p>
                <button onClick={() => router.back()} className="mt-4 px-4 py-2 bg-gray-100 rounded-lg text-sm">
                    Go Back
                </button>
            </div>
        );
    }

    const reportDate = new Date(report.createdAt).toLocaleDateString("en-IN", {
        day: "numeric", month: "long", year: "numeric"
    });

    return (
        <div className="max-w-4xl mx-auto py-8">
            {/* Action Bar (hidden on print) */}
            <div className="print:hidden flex items-center justify-between mb-6">
                <button onClick={() => router.back()} className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition">
                    <ArrowLeft className="w-5 h-5" /> Back
                </button>
                <div className="flex gap-3">
                    <button
                        onClick={handlePrint}
                        className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white rounded-xl font-bold text-sm hover:bg-emerald-700 transition shadow-lg shadow-emerald-200"
                    >
                        <Printer className="w-4 h-4" /> Print / Save as PDF
                    </button>
                </div>
            </div>

            {/* Printable Report */}
            <div ref={printRef} className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden print:shadow-none print:border-none print:rounded-none">
                {/* Header */}
                <div className="bg-emerald-700 text-white px-10 py-8 print:bg-emerald-700 print:text-white" style={{ backgroundColor: '#059669', color: 'white' }}>
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight">VaidyaVision</h1>
                            <p className="text-emerald-100 text-sm mt-1">AI-Powered Medical Intelligence Platform</p>
                        </div>
                        <div className="text-right text-sm">
                            <p className="font-bold">Medical Report</p>
                            <p className="text-emerald-200">Report #{report.id}</p>
                            <p className="text-emerald-200">{reportDate}</p>
                        </div>
                    </div>
                </div>

                {/* Patient & Doctor Info */}
                <div className="px-10 py-6 grid grid-cols-2 gap-8 border-b border-gray-200 text-sm">
                    <div>
                        <h3 className="text-xs uppercase tracking-wider text-gray-500 font-bold mb-2">Patient Information</h3>
                        <p className="font-bold text-gray-900 text-lg">{report.patient?.name || "Patient"}</p>
                        <p className="text-gray-600">{report.patient?.email}</p>
                        {report.patient?.age && <p className="text-gray-600">Age: {report.patient.age} | Gender: {report.patient.gender || 'N/A'}</p>}
                        {report.patient?.bloodType && <p className="text-gray-600">Blood Type: {report.patient.bloodType}</p>}
                    </div>
                    <div className="text-right">
                        <h3 className="text-xs uppercase tracking-wider text-gray-500 font-bold mb-2">Reporting Physician</h3>
                        <p className="font-bold text-gray-900 text-lg">{report.doctor?.name || "Doctor"}</p>
                        <p className="text-gray-600">{report.doctor?.specialty || 'General Medicine'}</p>
                        <p className="text-gray-600">{report.doctor?.email}</p>
                    </div>
                </div>

                {/* Scan Info */}
                {report.scan && (
                    <div className="px-10 py-4 bg-gray-50 border-b border-gray-200 text-sm flex items-center gap-6">
                        <div>
                            <span className="text-gray-500 font-medium">Modality:</span>{" "}
                            <span className="font-bold uppercase">{report.scan.modality}</span>
                        </div>
                        <div>
                            <span className="text-gray-500 font-medium">AI Diagnosis:</span>{" "}
                            <span className="font-bold">{report.scan.aiDiagnosis || 'N/A'}</span>
                        </div>
                        <div>
                            <span className="text-gray-500 font-medium">Confidence:</span>{" "}
                            <span className="font-bold">{report.scan.aiConfidence ? `${(report.scan.aiConfidence * 100).toFixed(1)}%` : 'N/A'}</span>
                        </div>
                        <div>
                            <span className="text-gray-500 font-medium">Severity:</span>{" "}
                            <span className={`font-bold uppercase ${report.severity === 'critical' ? 'text-red-600' : report.severity === 'high' ? 'text-orange-600' : 'text-green-600'}`}>
                                {report.severity}
                            </span>
                        </div>
                    </div>
                )}

                {/* Scan Image + Heatmap */}
                {report.scan?.imageUrl && (
                    <div className="px-10 py-6 border-b border-gray-200">
                        <h3 className="text-xs uppercase tracking-wider text-gray-500 font-bold mb-4">Scan Images</h3>
                        <div className="flex gap-4 items-start">
                            <div className="flex-1">
                                <p className="text-xs text-gray-500 mb-2 font-medium">Original Scan</p>
                                <div className="bg-black rounded-xl overflow-hidden">
                                    <img src={report.scan.imageUrl} alt="Scan" className="w-full max-h-[300px] object-contain" />
                                </div>
                            </div>
                            {report.scan.heatmapUrl && (
                                <div className="flex-1">
                                    <p className="text-xs text-gray-500 mb-2 font-medium">GradCAM Heatmap (AI Focus Areas)</p>
                                    <div className="bg-black rounded-xl overflow-hidden">
                                        <img src={report.scan.heatmapUrl} alt="Heatmap" className="w-full max-h-[300px] object-contain" />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Diagnosis */}
                <div className="px-10 py-6 border-b border-gray-200">
                    <h3 className="text-xs uppercase tracking-wider text-gray-500 font-bold mb-3">Diagnosis</h3>
                    <p className="text-xl font-bold text-gray-900">{report.diagnosis}</p>
                </div>

                {/* Findings */}
                <div className="px-10 py-6 border-b border-gray-200">
                    <h3 className="text-xs uppercase tracking-wider text-gray-500 font-bold mb-3">Findings</h3>
                    <div className="text-gray-800 leading-relaxed whitespace-pre-wrap text-sm">
                        {report.findings}
                    </div>
                </div>

                {/* Recommendations */}
                {report.recommendations && (
                    <div className="px-10 py-6 border-b border-gray-200">
                        <h3 className="text-xs uppercase tracking-wider text-gray-500 font-bold mb-3">Recommendations</h3>
                        <div className="text-gray-800 leading-relaxed whitespace-pre-wrap text-sm">
                            {report.recommendations}
                        </div>
                    </div>
                )}

                {/* Footer */}
                <div className="px-10 py-6 bg-gray-50 text-xs text-gray-500">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="font-bold text-gray-700">VaidyaVision Medical Intelligence</p>
                            <p>This report was generated using AI-assisted analysis. Clinical correlation is advised.</p>
                        </div>
                        <div className="text-right">
                            <p>Status: <span className="font-bold uppercase text-emerald-600">{report.status}</span></p>
                            <p>Generated: {reportDate}</p>
                        </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-gray-300 text-center text-[10px] uppercase tracking-widest text-gray-400">
                        Confidential Medical Document — For authorized use only
                    </div>
                </div>
            </div>
        </div>
    );
}
