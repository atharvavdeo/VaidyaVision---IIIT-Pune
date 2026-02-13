"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
    ArrowLeft,
    Brain,
    HeartPulse,
    Stethoscope,
    Scan,
    Eye,
    EyeOff,
    Activity,
    AlertTriangle,
    Clock,
    CheckCircle,
    FileText,
    Loader2,
} from "lucide-react";

const MODALITY_ICONS: Record<string, React.ElementType> = {
    brain: Brain,
    lung: Stethoscope,
    skin: Scan,
    ecg: HeartPulse,
};

const MODALITY_LABELS: Record<string, string> = {
    brain: "Brain MRI",
    lung: "Lung X-ray",
    skin: "Skin Lesion",
    ecg: "ECG Image",
};

export default function PatientScanDetail() {
    const router = useRouter();
    const params = useParams();
    const id = params.id as string;

    const [scan, setScan] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [showHeatmap, setShowHeatmap] = useState(false);
    const [heatmapOpacity, setHeatmapOpacity] = useState(0.6);
    const [linkedReport, setLinkedReport] = useState<any>(null);

    useEffect(() => {
        if (id) {
            fetch(`/api/scans/${id}`)
                .then((r) => r.json())
                .then((data) => {
                    setScan(data.scan);
                    setLoading(false);
                    // Fetch linked report
                    if (data.scan?.id) {
                        fetch(`/api/reports?scanId=${data.scan.id}`)
                            .then((r) => r.json())
                            .then((rData) => {
                                const match = (rData.reports || []).find((r: any) => r.scanId === data.scan.id || r.scan?.id === data.scan.id);
                                if (match) setLinkedReport(match);
                            })
                            .catch(() => {});
                    }
                })
                .catch(() => setLoading(false));
        }
    }, [id]);

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="w-10 h-10 animate-spin text-olive-600" />
            </div>
        );
    }

    if (!scan) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                <Scan className="w-16 h-16 mb-4 opacity-40" />
                <p className="text-lg font-medium">Scan not found</p>
                <button
                    onClick={() => router.back()}
                    className="mt-4 px-4 py-2 bg-gray-100 rounded-lg text-sm"
                >
                    Go Back
                </button>
            </div>
        );
    }

    const ModalityIcon = MODALITY_ICONS[scan.modality] || Scan;
    const isCompleted = scan.status === "completed";
    const confidencePercent = scan.aiConfidence
        ? (scan.aiConfidence * 100).toFixed(1)
        : null;

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <button
                    onClick={() => router.back()}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                    <ArrowLeft className="w-5 h-5 text-gray-600" />
                </button>
                <div className="flex-1">
                    <h1 className="text-2xl font-bold text-gray-900">
                        {MODALITY_LABELS[scan.modality] || "Medical Scan"} &mdash; Analysis
                    </h1>
                    <p className="text-sm text-gray-500 mt-0.5">
                        Uploaded{" "}
                        {new Date(scan.uploadedAt).toLocaleDateString(undefined, {
                            weekday: "long",
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                        })}
                    </p>
                </div>
                <span
                    className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide ${
                        isCompleted
                            ? "bg-green-100 text-green-700"
                            : scan.status === "processing"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-yellow-100 text-yellow-700"
                    }`}
                >
                    {scan.status}
                </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Image Viewer with GradCAM overlay */}
                <div className="lg:col-span-7 bg-gray-900 rounded-2xl overflow-hidden relative min-h-[450px] flex items-center justify-center">
                    {/* Original Image */}
                    <img
                        src={scan.imageUrl}
                        className="max-w-full max-h-[550px] object-contain"
                        alt="Medical Scan"
                    />

                    {/* GradCAM Heatmap Overlay */}
                    {showHeatmap && scan.heatmapUrl && (
                        <img
                            src={scan.heatmapUrl}
                            className="absolute inset-0 w-full h-full object-contain"
                            style={{ opacity: heatmapOpacity }}
                            alt="GradCAM Heatmap"
                        />
                    )}

                    {/* Controls Bar */}
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-black/80 backdrop-blur px-5 py-3 rounded-full">
                        <button
                            onClick={() => setShowHeatmap(!showHeatmap)}
                            disabled={!scan.heatmapUrl}
                            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                                !scan.heatmapUrl
                                    ? "opacity-40 cursor-not-allowed text-gray-500"
                                    : showHeatmap
                                    ? "bg-emerald-500 text-white"
                                    : "text-gray-300 hover:bg-gray-700"
                            }`}
                        >
                            {showHeatmap ? (
                                <EyeOff className="w-4 h-4" />
                            ) : (
                                <Eye className="w-4 h-4" />
                            )}
                            GradCAM
                        </button>

                        {showHeatmap && scan.heatmapUrl && (
                            <div className="flex items-center gap-2 text-gray-300 text-xs">
                                <span>Opacity</span>
                                <input
                                    type="range"
                                    min="0.1"
                                    max="1"
                                    step="0.05"
                                    value={heatmapOpacity}
                                    onChange={(e) =>
                                        setHeatmapOpacity(parseFloat(e.target.value))
                                    }
                                    className="w-24 accent-emerald-500"
                                />
                                <span>{(heatmapOpacity * 100).toFixed(0)}%</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Analysis Results */}
                <div className="lg:col-span-5 space-y-4">
                    {/* AI Diagnosis Card */}
                    <div className="bg-white rounded-2xl border border-gray-200 p-6">
                        <div className="flex items-center gap-3 mb-5">
                            <div className="p-2.5 bg-emerald-100 text-emerald-700 rounded-xl">
                                <Activity className="w-5 h-5" />
                            </div>
                            <div>
                                <h2 className="font-bold text-gray-900">AI Analysis</h2>
                                <p className="text-xs text-gray-400">
                                    {scan.expertUsed
                                        ? `${scan.expertUsed.toUpperCase()} Expert Model`
                                        : "Automated Analysis"}
                                </p>
                            </div>
                        </div>

                        {isCompleted && scan.aiDiagnosis ? (
                            <>
                                <div className="mb-4">
                                    <p className="text-2xl font-bold text-gray-900 mb-2">
                                        {scan.aiDiagnosis}
                                    </p>
                                    {confidencePercent && (
                                        <div className="flex items-center gap-3">
                                            <div className="flex-1 bg-gray-100 rounded-full h-2.5 overflow-hidden">
                                                <div
                                                    className="bg-emerald-500 h-full rounded-full transition-all duration-700"
                                                    style={{
                                                        width: `${confidencePercent}%`,
                                                    }}
                                                />
                                            </div>
                                            <span className="text-sm font-bold text-emerald-600">
                                                {confidencePercent}%
                                            </span>
                                        </div>
                                    )}
                                </div>

                                {/* Uncertainty Warning */}
                                {scan.aiUncertainty != null &&
                                    scan.aiUncertainty > 0.1 && (
                                        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3 mb-4">
                                            <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                                            <div className="text-sm">
                                                <p className="font-bold text-amber-800">
                                                    Elevated Uncertainty (
                                                    {(scan.aiUncertainty * 100).toFixed(1)}
                                                    %)
                                                </p>
                                                <p className="text-amber-700 mt-0.5">
                                                    The model flagged some uncertainty.
                                                    Please consult your doctor for
                                                    confirmation.
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                {/* Triage Score */}
                                {scan.triageScore != null && (
                                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl text-sm">
                                        <span className="text-gray-600 font-medium">
                                            Triage Priority Score
                                        </span>
                                        <span
                                            className={`font-bold ${
                                                scan.triageScore >= 80
                                                    ? "text-red-600"
                                                    : scan.triageScore >= 60
                                                    ? "text-orange-600"
                                                    : "text-green-600"
                                            }`}
                                        >
                                            {scan.triageScore}/100
                                        </span>
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="flex flex-col items-center py-6 text-gray-400">
                                <Clock className="w-10 h-10 mb-2 opacity-50" />
                                <p className="font-medium">Awaiting Analysis</p>
                                <p className="text-xs mt-1">
                                    Your scan is being processed
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Scan Details */}
                    <div className="bg-white rounded-2xl border border-gray-200 p-6">
                        <h3 className="font-bold text-gray-900 mb-4 text-sm uppercase tracking-wide">
                            Scan Details
                        </h3>
                        <div className="space-y-3 text-sm">
                            <div className="flex justify-between items-center">
                                <span className="text-gray-500">Modality</span>
                                <span className="font-medium flex items-center gap-1.5">
                                    <ModalityIcon className="w-4 h-4" />
                                    {MODALITY_LABELS[scan.modality] || scan.modality}
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-500">Priority</span>
                                <span
                                    className={`px-2 py-0.5 rounded-full text-xs font-bold uppercase ${
                                        scan.priority === "critical"
                                            ? "bg-red-100 text-red-700"
                                            : scan.priority === "high"
                                            ? "bg-orange-100 text-orange-700"
                                            : "bg-green-100 text-green-700"
                                    }`}
                                >
                                    {scan.priority || "medium"}
                                </span>
                            </div>
                            {scan.originalFilename && (
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-500">File</span>
                                    <span className="font-medium text-gray-700 truncate max-w-[200px]">
                                        {scan.originalFilename}
                                    </span>
                                </div>
                            )}
                            {scan.symptoms && (
                                <div className="pt-3 border-t border-gray-100">
                                    <span className="text-gray-500 text-xs uppercase tracking-wide">
                                        Reported Symptoms
                                    </span>
                                    <p className="text-gray-800 mt-1">
                                        {scan.symptoms}
                                    </p>
                                </div>
                            )}
                            {scan.doctorNotes && (
                                <div className="pt-3 border-t border-gray-100">
                                    <span className="text-gray-500 text-xs uppercase tracking-wide">
                                        Doctor&apos;s Notes
                                    </span>
                                    <p className="text-gray-800 mt-1">
                                        {scan.doctorNotes}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Linked Report */}
                    {linkedReport && (
                        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5">
                            <h3 className="font-bold text-emerald-900 text-sm mb-3 flex items-center gap-2">
                                <FileText className="w-4 h-4" />
                                Doctor&apos;s Report Available
                            </h3>
                            <p className="text-sm text-emerald-800 mb-1">
                                <span className="font-semibold">Diagnosis:</span> {linkedReport.diagnosis}
                            </p>
                            {linkedReport.severity && (
                                <p className="text-xs text-emerald-700 mb-3">
                                    Severity: <span className="font-bold uppercase">{linkedReport.severity}</span>
                                </p>
                            )}
                            <div className="flex gap-2">
                                <button
                                    onClick={() => router.push(`/patient/reports/${linkedReport.id}`)}
                                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700 transition-colors"
                                >
                                    <Eye className="w-4 h-4" />
                                    View Full Report
                                </button>
                            </div>
                        </div>
                    )}

                    {/* GradCAM Explanation */}
                    {scan.heatmapUrl && (
                        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5">
                            <h3 className="font-bold text-blue-900 text-sm mb-2 flex items-center gap-2">
                                <Eye className="w-4 h-4" />
                                What is GradCAM?
                            </h3>
                            <p className="text-xs text-blue-800 leading-relaxed">
                                The GradCAM heatmap shows which regions of your scan
                                the AI focused on to make its diagnosis. Warmer colors
                                (red/yellow) indicate areas of higher attention. Toggle
                                the overlay to see the AI&apos;s focus areas.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
