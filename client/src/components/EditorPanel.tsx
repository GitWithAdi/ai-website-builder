import { useState, useEffect } from "react";
import {
    X,
    Sparkles,
    Loader2,
    Sliders,
    ChevronDown,
    ChevronUp,
    Wand2,
} from "lucide-react";
import type { SelectedElement } from "../types";

interface EditorPanelProps {
    selectedElement: SelectedElement | null;
    onUpdate: (updates: any) => void;
    onClose: () => void;
    onAiModify?: (prompt: string) => Promise<void>;
    isAiModifying?: boolean;
}

const AI_PRESETS = [
    "✨ Glassmorphism with blur & border",
    "🎨 Dark neon gradient with glow",
    "⚡ Interactive hover bounce & shadow",
    "📱 Responsive flex grid layout",
    "🌟 Modern card with badge and accent",
    "🔘 Gradient button with smooth animation",
];

const EditorPanel = ({
    selectedElement,
    onUpdate,
    onClose,
    onAiModify,
    isAiModifying = false,
}: EditorPanelProps) => {
    const [values, setValues] = useState<SelectedElement | null>(selectedElement);
    const [aiPrompt, setAiPrompt] = useState("");
    const [showManualStyles, setShowManualStyles] = useState(true);

    useEffect(() => {
        setValues(selectedElement);
    }, [selectedElement]);

    if (!selectedElement || !values) return null;

    const handleChange = (field: string, value: string) => {
        const newValues = { ...values, [field]: value };
        if (field in values.styles) {
            newValues.styles = { ...values.styles, [field]: value };
        }
        setValues(newValues);
        onUpdate({ [field]: value });
    };

    const handleStyleChange = (styleName: string, value: string) => {
        const newStyles = { ...values.styles, [styleName]: value };
        setValues({ ...values, styles: newStyles });
        onUpdate({ styles: { [styleName]: value } });
    };

    const handleAiSubmit = async () => {
        if (!aiPrompt.trim() || isAiModifying || !onAiModify) return;
        await onAiModify(aiPrompt.trim());
        setAiPrompt("");
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleAiSubmit();
        }
    };

    const tagBadge = selectedElement.tagName.toLowerCase();

    return (
        <div className="absolute top-4 right-4 w-88 max-w-[calc(100vw-2rem)] bg-gray-900/95 backdrop-blur-md rounded-xl shadow-2xl border border-gray-700 p-4 z-50 text-white max-h-[calc(100vh-2rem)] overflow-y-auto animate-in fade-in slide-in-from-right-4 duration-200">
            {/* Header */}
            <div className="flex justify-between items-center pb-3 border-b border-gray-800">
                <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-gray-100 flex items-center gap-1.5">
                        <Wand2 className="w-4 h-4 text-indigo-400" />
                        Element Copilot
                    </span>
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                        &lt;{tagBadge}&gt;
                    </span>
                </div>
                <button
                    onClick={onClose}
                    className="p-1 hover:bg-gray-800 rounded-full text-gray-400 hover:text-gray-200 transition"
                    aria-label="Close editor panel"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>

            {/* AI Copilot Section */}
            {onAiModify && (
                <div className="mt-4 p-3.5 rounded-lg bg-gradient-to-b from-indigo-950/70 to-purple-950/40 border border-indigo-500/30 space-y-3">
                    <div className="flex items-center justify-between">
                        <label className="text-xs font-semibold text-indigo-200 flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
                            Ask AI to modify this section
                        </label>
                        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                            2 credits
                        </span>
                    </div>

                    <textarea
                        value={aiPrompt}
                        onChange={(e) => setAiPrompt(e.target.value)}
                        onKeyDown={handleKeyDown}
                        disabled={isAiModifying}
                        placeholder="e.g. Redesign into modern glassmorphism card with gradient borders & hover lift..."
                        className="w-full text-xs p-2.5 bg-gray-950/80 border border-indigo-500/30 rounded-md focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 outline-none text-gray-100 placeholder:text-gray-500 resize-none h-18 transition disabled:opacity-50"
                    />

                    {/* Quick suggestion presets */}
                    <div>
                        <p className="text-[10px] uppercase tracking-wider text-gray-400 font-medium mb-1.5">
                            Quick Enhancements
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                            {AI_PRESETS.map((preset, idx) => (
                                <button
                                    key={idx}
                                    type="button"
                                    onClick={() => setAiPrompt(preset.replace(/^[^\w\s]+\s*/, ""))}
                                    disabled={isAiModifying}
                                    className="text-[11px] px-2 py-0.5 rounded bg-gray-800/90 hover:bg-indigo-600/30 text-gray-300 hover:text-indigo-200 border border-gray-700/60 hover:border-indigo-500/40 transition active:scale-95 disabled:pointer-events-none"
                                >
                                    {preset}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Submit Button */}
                    <button
                        onClick={handleAiSubmit}
                        disabled={isAiModifying || !aiPrompt.trim()}
                        className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-medium rounded-md shadow-md shadow-indigo-900/30 transition active:scale-[0.98]"
                    >
                        {isAiModifying ? (
                            <>
                                <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                                <span>Generating element changes...</span>
                            </>
                        ) : (
                            <>
                                <Sparkles className="w-3.5 h-3.5" />
                                <span>Apply AI Changes (Enter)</span>
                            </>
                        )}
                    </button>
                </div>
            )}

            {/* Manual Tweaks Toggle */}
            <div className="mt-4 pt-3 border-t border-gray-800">
                <button
                    type="button"
                    onClick={() => setShowManualStyles(!showManualStyles)}
                    className="w-full flex items-center justify-between text-xs font-semibold text-gray-300 hover:text-white transition"
                >
                    <span className="flex items-center gap-1.5">
                        <Sliders className="w-3.5 h-3.5 text-gray-400" />
                        Manual Style & Text Tweaks
                    </span>
                    {showManualStyles ? (
                        <ChevronUp className="w-3.5 h-3.5 text-gray-400" />
                    ) : (
                        <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
                    )}
                </button>

                {showManualStyles && (
                    <div className="space-y-3 mt-3 animate-in fade-in duration-150">
                        {/* Text Content */}
                        <div>
                            <label className="block text-[11px] font-medium text-gray-400 mb-1">
                                Text Content
                            </label>
                            <textarea
                                value={values.text || ""}
                                onChange={(e) => handleChange("text", e.target.value)}
                                className="w-full text-xs p-2 bg-gray-950 border border-gray-700 rounded-md focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none min-h-16 text-gray-100 transition"
                            />
                        </div>

                        {/* Class Name */}
                        <div>
                            <label className="block text-[11px] font-medium text-gray-400 mb-1">
                                Tailwind Classes
                            </label>
                            <input
                                type="text"
                                value={values.className || ""}
                                onChange={(e) =>
                                    handleChange("className", e.target.value)
                                }
                                className="w-full text-xs p-2 bg-gray-950 border border-gray-700 rounded-md focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-gray-100 transition"
                            />
                        </div>

                        {/* Padding & Margin */}
                        <div className="grid grid-cols-2 gap-2.5">
                            <div>
                                <label className="block text-[11px] font-medium text-gray-400 mb-1">
                                    Padding
                                </label>
                                <input
                                    type="text"
                                    value={values.styles.padding}
                                    onChange={(e) =>
                                        handleStyleChange("padding", e.target.value)
                                    }
                                    className="w-full text-xs p-1.5 bg-gray-950 border border-gray-700 rounded-md focus:border-indigo-500 outline-none text-gray-100"
                                />
                            </div>

                            <div>
                                <label className="block text-[11px] font-medium text-gray-400 mb-1">
                                    Margin
                                </label>
                                <input
                                    type="text"
                                    value={values.styles.margin}
                                    onChange={(e) =>
                                        handleStyleChange("margin", e.target.value)
                                    }
                                    className="w-full text-xs p-1.5 bg-gray-950 border border-gray-700 rounded-md focus:border-indigo-500 outline-none text-gray-100"
                                />
                            </div>
                        </div>

                        {/* Font Size */}
                        <div>
                            <label className="block text-[11px] font-medium text-gray-400 mb-1">
                                Font Size
                            </label>
                            <input
                                type="text"
                                value={values.styles.fontSize}
                                onChange={(e) =>
                                    handleStyleChange("fontSize", e.target.value)
                                }
                                className="w-full text-xs p-1.5 bg-gray-950 border border-gray-700 rounded-md focus:border-indigo-500 outline-none text-gray-100"
                            />
                        </div>

                        {/* Colors */}
                        <div className="grid grid-cols-2 gap-2.5">
                            <div>
                                <label className="block text-[11px] font-medium text-gray-400 mb-1">
                                    Background Color
                                </label>
                                <div className="flex items-center gap-2 bg-gray-950 border border-gray-700 rounded-md p-1">
                                    <input
                                        type="color"
                                        value={
                                            values.styles.backgroundColor ===
                                            "rgba(0, 0, 0, 0)"
                                                ? "#000000"
                                                : values.styles.backgroundColor
                                        }
                                        onChange={(e) =>
                                            handleStyleChange(
                                                "backgroundColor",
                                                e.target.value
                                            )
                                        }
                                        className="w-5 h-5 rounded cursor-pointer border-0 bg-transparent"
                                    />
                                    <span className="text-[10px] text-gray-400 font-mono truncate">
                                        {values.styles.backgroundColor}
                                    </span>
                                </div>
                            </div>

                            <div>
                                <label className="block text-[11px] font-medium text-gray-400 mb-1">
                                    Text Color
                                </label>
                                <div className="flex items-center gap-2 bg-gray-950 border border-gray-700 rounded-md p-1">
                                    <input
                                        type="color"
                                        value={values.styles.color || "#ffffff"}
                                        onChange={(e) =>
                                            handleStyleChange("color", e.target.value)
                                        }
                                        className="w-5 h-5 rounded cursor-pointer border-0 bg-transparent"
                                    />
                                    <span className="text-[10px] text-gray-400 font-mono truncate">
                                        {values.styles.color}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default EditorPanel;
