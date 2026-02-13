"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
    FileText, Download, Eye, Clock, CheckCircle, User,
    Brain, HeartPulse, Stethoscope, Scan, AlertTriangle,
} from "lucide-react";

interface Report {
    id: number;
    diagnosis: string;
    findings: string;
    recommendations: string | null;
    severity: string;
    status: string;
    createdAt: string;
    scan?: { id: number; modality: string; imageUrl: string };
    patient?: { name: string };
    doctor?: { name: string };
}

const SEVERITY_COLORS: Record<string, string> = {
    low: "bg-green-100 text-green-700",
    moderate: "bg-yellow-100 text-yellow-700",
    high: "bg-orange-100 text-orange-700",
    critical: "bg-red-100 text-red-700",
};

const MODALITY_ICONS: Record<string, React.ElementType> = {
    brain: Brain, lung: Stethoscope, skin: Scan, ecg: HeartPulse,
};

interface ReportListProps {
    userRole: "doctor" | "patient";
}

export default function ReportList({ userRole }: ReportListProps) {
    const router = useRouter();
    const [reports, setReports] = useState<Report[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch("/api/reports")
            .then((r) => r.json())
            .then((data) => {
                setReports(data.reports || []);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="w-8 h-8 border-4 border-medical-200 border-t-medical-600 rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Medical Reports</h1>
                <p className="text-gray-500 text-sm mt-1">
                    {userRole === "doctor" ? "Reports you've created" : "Reports from your doctors"}
                </p>
            </div>

            {reports.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                    <FileText className="w-16 h-16 mb-4 opacity-40" />
                    <p className="text-lg font-medium">No reports yet</p>
                    <p className="text-sm mt-1">
                        {userRole === "doctor"
                            ? "Reports will appear here after you review scans"
                            : "Your doctor will create reports after reviewing your scans"}
                    </p>
                </div>
            ) : (
                <div className="grid gap-4">
                    {reports.map((report) => {
                        const ModalityIcon = report.scan
                            ? MODALITY_ICONS[report.scan.modality] || FileText
                            : FileText;

                        return (
                            <div
                                key={report.id}
                                className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow"
                            >
                                <div className="flex items-start gap-4">
                                    {/* Scan Thumb */}
                                    {report.scan && (
                                        <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                                            <img
                                                src={report.scan.imageUrl}
                                                alt="Scan"
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                    )}

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-sm font-semibold text-gray-900">
                                                {report.diagnosis}
                                            </span>
                                            <span
                                                className={`px-2 py-0.5 rounded-full text-xs font-medium ${SEVERITY_COLORS[report.severity] || SEVERITY_COLORS.moderate
                                                    }`}
                                            >
                                                {report.severity}
                                            </span>
                                        </div>

                                        <p className="text-sm text-gray-600 line-clamp-2">{report.findings}</p>

                                        <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                                            {report.scan && (
                                                <span className="flex items-center gap-1">
                                                    <ModalityIcon className="w-3 h-3" />
                                                    {report.scan.modality.toUpperCase()}
                                                </span>
                                            )}
                                            <span className="flex items-center gap-1">
                                                <User className="w-3 h-3" />
                                                {userRole === "doctor" ? report.patient?.name : report.doctor?.name}
                                            </span>
                                            <span>
                                                {new Date(report.createdAt).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 flex-shrink-0">
                                        <span
                                            className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium ${report.status === "signed"
                                                    ? "bg-green-100 text-green-700"
                                                    : "bg-gray-100 text-gray-600"
                                                }`}
                                        >
                                            <CheckCircle className="w-3 h-3" />
                                            {report.status}
                                        </span>
                                        <button
                                            onClick={() => router.push(`/${userRole}/reports/${report.id}`)}
                                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-medical-600 text-white rounded-lg text-xs font-medium hover:bg-medical-700 transition-colors"
                                        >
                                            <Eye className="w-3 h-3" />
                                            View
                                        </button>
                                        <button
                                            onClick={() => {
                                                const printWindow = window.open(`/${userRole}/reports/${report.id}`, '_blank');
                                                if (printWindow) {
                                                    printWindow.addEventListener('load', () => {
                                                        setTimeout(() => printWindow.print(), 500);
                                                    });
                                                }
                                            }}
                                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-xs font-medium hover:bg-gray-200 transition-colors"
                                        >
                                            <Download className="w-3 h-3" />
                                            PDF
                                        </button>
                                    </div>
                                </div>

                                {report.recommendations && (
                                    <div className="mt-3 pt-3 border-t border-gray-100">
                                        <p className="text-xs text-gray-500">
                                            <span className="font-medium">Recommendations:</span>{" "}
                                            {report.recommendations}
                                        </p>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
