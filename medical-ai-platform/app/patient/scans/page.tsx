"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
    Scan,
    Clock,
    CheckCircle,
    XCircle,
    RefreshCw,
    Eye,
    Brain,
    HeartPulse,
    Stethoscope,
} from "lucide-react";

interface ScanItem {
    id: number;
    imageUrl: string;
    modality: string;
    status: string;
    aiDiagnosis: string | null;
    aiConfidence: number | null;
    uploadedAt: string;
}

const MODALITY_ICONS: Record<string, React.ElementType> = {
    brain: Brain,
    lung: Stethoscope,
    skin: Scan,
    ecg: HeartPulse,
};

const STATUS_COLORS: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-700",
    processing: "bg-blue-100 text-blue-700",
    completed: "bg-green-100 text-green-700",
    rejected: "bg-red-100 text-red-700",
};

export default function PatientScansPage() {
    const router = useRouter();
    const [scans, setScans] = useState<ScanItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchScans();
    }, []);

    async function fetchScans() {
        setLoading(true);
        try {
            const res = await fetch("/api/scans");
            const data = await res.json();
            setScans(data.scans || []);
        } catch (err) {
            console.error("Failed to fetch scans:", err);
        }
        setLoading(false);
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="w-8 h-8 border-4 border-medical-200 border-t-medical-600 rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">My Scans</h1>
                    <p className="text-gray-500 text-sm mt-1">
                        Track and view all your uploaded medical scans
                    </p>
                </div>
                <button
                    onClick={fetchScans}
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50"
                >
                    <RefreshCw className="w-4 h-4" />
                    Refresh
                </button>
            </div>

            {scans.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                    <Scan className="w-16 h-16 mb-4 opacity-40" />
                    <p className="text-lg font-medium">No scans yet</p>
                    <p className="text-sm mt-1">Upload your first medical scan to get started</p>
                    <button
                        onClick={() => router.push("/patient/upload")}
                        className="mt-4 px-6 py-2 bg-medical-600 text-white rounded-lg text-sm font-medium hover:bg-medical-700"
                    >
                        Upload Scan
                    </button>
                </div>
            ) : (
                <div className="grid gap-4 md:grid-cols-2">
                    {scans.map((scan) => {
                        const ModalityIcon = MODALITY_ICONS[scan.modality] || Scan;
                        return (
                            <div
                                key={scan.id}
                                className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
                                onClick={() => router.push(`/patient/scans/${scan.id}`)}
                            >
                                <div className="h-48 bg-gray-100">
                                    <img
                                        src={scan.imageUrl}
                                        alt="Scan"
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                                <div className="p-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                                            <ModalityIcon className="w-3 h-3" />
                                            {scan.modality.toUpperCase()}
                                        </span>
                                        <span
                                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[scan.status]}`}
                                        >
                                            {scan.status}
                                        </span>
                                    </div>
                                    {scan.aiDiagnosis && (
                                        <p className="text-sm font-medium text-gray-900">
                                            {scan.aiDiagnosis}
                                            {scan.aiConfidence && (
                                                <span className="text-gray-400 font-normal ml-1">
                                                    ({(scan.aiConfidence * 100).toFixed(0)}%)
                                                </span>
                                            )}
                                        </p>
                                    )}
                                    <p className="text-xs text-gray-400 mt-1">
                                        {new Date(scan.uploadedAt).toLocaleString()}
                                    </p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
