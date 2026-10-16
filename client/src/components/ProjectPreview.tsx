import {
    forwardRef,
    useEffect,
    useImperativeHandle,
    useRef,
    useState,
} from "react";
import { toast } from "sonner";

import type { Project, SelectedElement } from "../types";
import { iframeScript } from "../assets/assets";
import EditorPanel from "./EditorPanel";
import LoaderSteps from "./LoaderSteps";
import api from "@/config/axios";

interface ProjectPreviewProps {
    project: Project;
    isGenerating: boolean;
    device?: "phone" | "tablet" | "desktop";
    showEditorPanel?: boolean;
    onProjectCodeChange?: (newCode: string) => void;
}

export interface ProjectPreviewRef {
    getCode: () => string | undefined;
}

const ProjectPreview = forwardRef<ProjectPreviewRef, ProjectPreviewProps>(
    (
        {
            project,
            isGenerating,
            device = "desktop",
            showEditorPanel = true,
            onProjectCodeChange,
        }: ProjectPreviewProps,
        ref
    ) => {
        const iframeRef = useRef<HTMLIFrameElement>(null);
        const [selectedElement, setSelectedElement] = useState<SelectedElement | null>(null);
        const [isAiModifying, setIsAiModifying] = useState(false);

        const resolution = {
            phone: "w-[412px]",
            tablet: "w-[768px]",
            desktop: "w-full",
        };

        const getCleanHtml = () => {
            const doc = iframeRef.current?.contentDocument;
            if (!doc) return undefined;

            // 1. Remove selection class / attributes / outline from all elements
            doc.querySelectorAll(
                ".ai-selected-element, [data-ai-selected]"
            ).forEach((el) => {
                el.classList.remove("ai-selected-element");
                el.removeAttribute("data-ai-selected");
                (el as HTMLElement).style.outline = "";
            });

            // 2. Remove injected style and script from the document
            const previewStyle = doc.getElementById("ai-preview-style");
            if (previewStyle) previewStyle.remove();

            const previewScript = doc.getElementById("ai-preview-script");
            if (previewScript) previewScript.remove();

            // 3. Serialize clean HTML
            return doc.documentElement.outerHTML;
        };

        useImperativeHandle(ref, () => ({
            getCode: getCleanHtml,
        }));

        useEffect(() => {
            const handleMessage = (event: MessageEvent) => {
                if (event.data?.type === "ELEMENT_SELECTED") {
                    setSelectedElement(event.data.payload);
                } else if (event.data?.type === "CLEAR_SELECTION") {
                    setSelectedElement(null);
                } else if (event.data?.type === "ELEMENT_REPLACED") {
                    // Automatically auto-save updated HTML after DOM replacement
                    const fullCode = getCleanHtml();
                    if (fullCode) {
                        api.put(`/api/project/save/${project.id}`, { code: fullCode }).catch(console.error);
                        if (onProjectCodeChange) {
                            onProjectCodeChange(fullCode);
                        }
                    }
                }
            };

            window.addEventListener("message", handleMessage);
            return () => window.removeEventListener("message", handleMessage);
        }, [project.id, onProjectCodeChange]);

        const injectPreview = (html: string) => {
            if (!html) return "";
            if (!showEditorPanel) return html;

            if (html.includes("</body>")) {
                return html.replace("</body>", iframeScript + "</body>");
            } else {
                return html + iframeScript;
            }
        };

        const handleUpdate = (updates: any) => {
            if (iframeRef.current?.contentWindow) {
                iframeRef.current.contentWindow.postMessage(
                    {
                        type: "UPDATE_ELEMENT",
                        payload: updates,
                    },
                    "*"
                );
            }
        };

        const handleAiModifyElement = async (prompt: string) => {
            if (!selectedElement) {
                toast.error("Please click an element to select it first");
                return;
            }

            if (!selectedElement.outerHTML) {
                toast.error("Unable to read element HTML structure");
                return;
            }

            setIsAiModifying(true);
            try {
                const { data } = await api.post(
                    `/api/project/modify-element/${project.id}`,
                    {
                        prompt,
                        elementHtml: selectedElement.outerHTML,
                    }
                );

                if (data.updatedHtml && iframeRef.current?.contentWindow) {
                    iframeRef.current.contentWindow.postMessage(
                        {
                            type: "REPLACE_ELEMENT",
                            payload: { html: data.updatedHtml },
                        },
                        "*"
                    );

                    toast.success("Element modified with AI!");
                }
            } catch (error: any) {
                toast.error(
                    error?.response?.data?.message ||
                        error?.message ||
                        "Failed to modify element"
                );
                console.error(error);
            } finally {
                setIsAiModifying(false);
            }
        };

        return (
            <div className="relative h-full bg-gray-900 flex-1 rounded-xl overflow-hidden max-sm:ml-2">
                {project.current_code ? (
                    <>
                        <iframe
                            ref={iframeRef}
                            srcDoc={injectPreview(project.current_code)}
                            className={`h-full max-sm:w-full ${resolution[device]} mx-auto transition-all`}
                        />
                        {showEditorPanel && selectedElement && (
                            <EditorPanel
                                selectedElement={selectedElement}
                                onUpdate={handleUpdate}
                                onAiModify={handleAiModifyElement}
                                isAiModifying={isAiModifying}
                                onClose={() => {
                                    setSelectedElement(null);
                                    if (iframeRef.current?.contentWindow) {
                                        iframeRef.current.contentWindow.postMessage(
                                            {
                                                type: "CLEAR_SELECTION_REQUEST",
                                            },
                                            "*"
                                        );
                                    }
                                }}
                            />
                        )}
                    </>
                ) : (
                    isGenerating && <LoaderSteps />
                )}
            </div>
        );
    }
);

export default ProjectPreview;
