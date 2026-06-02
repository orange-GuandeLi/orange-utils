import { useState, useRef, useCallback } from "react";
import { Button, Chip, Tooltip, Modal } from "@heroui/react";
import {
  SquareDashedMousePointer,
  Copy,
  Code2,
  Eye,
  GripVertical,
  Check,
} from "lucide-react";
import { CodeEditor } from "./CodeEditor";
import {
  useIframeSelector,
  type SelectionInfo,
} from "./hooks/useIframeSelector";

// 可复制的信息项
function CopyField({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="flex items-start gap-3 py-2">
      <span className="text-xs text-muted w-20 shrink-0 pt-0.5">{label}</span>
      <span className="text-xs text-foreground font-mono flex-1 break-all min-w-0">
        {value || "-"}
      </span>
      <Tooltip delay={0}>
        <Button
          isIconOnly
          size="sm"
          variant="ghost"
          className="shrink-0"
          onPress={handleCopy}
        >
          {copied ? (
            <Check size={12} className="text-success" />
          ) : (
            <Copy size={12} />
          )}
        </Button>
        <Tooltip.Content>{copied ? "已复制" : "复制"}</Tooltip.Content>
      </Tooltip>
    </div>
  );
}

export function HtmlSelector() {
  const [html, setHtml] = useState(SAMPLE_HTML);
  const [selectMode, setSelectMode] = useState(false);
  const [selectedInfo, setSelectedInfo] = useState<SelectionInfo | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // 分隔条
  const [editorWidth, setEditorWidth] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // 预览宽度 (px)
  const [previewPx, setPreviewPx] = useState(0);

  const updatePreviewWidth = useCallback(() => {
    if (!containerRef.current) return;
    const containerW = containerRef.current.getBoundingClientRect().width;
    const dividerW = 6;
    setPreviewPx(Math.round(containerW * (1 - editorWidth / 100) - dividerW));
  }, [editorWidth]);

  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  const setContainerRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (resizeObserverRef.current) resizeObserverRef.current.disconnect();
      if (node) {
        (
          containerRef as React.MutableRefObject<HTMLDivElement | null>
        ).current = node;
        const ro = new ResizeObserver(() => updatePreviewWidth());
        ro.observe(node);
        resizeObserverRef.current = ro;
        updatePreviewWidth();
      }
    },
    [updatePreviewWidth],
  );

  const handleSelected = useCallback((info: SelectionInfo) => {
    setSelectedInfo(info);
    setModalOpen(true);
  }, []);

  const handleExit = useCallback(() => {
    setSelectMode(false);
    setSelectedInfo(null);
    setModalOpen(false);
  }, []);

  useIframeSelector({
    iframeRef,
    selectMode,
    onSelected: handleSelected,
    onExit: handleExit,
  });

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    document.body.style.pointerEvents = "none";

    const onMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const percent = ((e.clientX - rect.left) / rect.width) * 100;
      setEditorWidth(Math.min(80, Math.max(20, percent)));
      const dividerW = 6;
      setPreviewPx(Math.round(rect.width * (1 - percent / 100) - dividerW));
    };

    const onMouseUp = () => {
      setIsDragging(false);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      document.body.style.pointerEvents = "";
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    };

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  }, []);

  return (
    <div className="h-full flex flex-col bg-background text-foreground">
      {/* Header */}
      <header className="h-14 border-b border-separator flex items-center px-5 gap-3 shrink-0">
        <h1 className="text-sm font-semibold">HTML Selector</h1>
        <span className="text-xs text-muted">
          粘贴 HTML → 实时预览 → 选择元素 → 查看信息
        </span>
        <div className="flex-1" />
        <Chip size="sm" variant="soft" color="default" className="font-mono">
          <Chip.Label>{previewPx}px</Chip.Label>
        </Chip>
        <Button
          size="sm"
          variant={selectMode ? "danger" : "primary"}
          className="text-xs"
          onPress={(e) => {
            (e.target as HTMLElement)?.blur?.();
            if (selectMode) {
              setSelectMode(false);
              setSelectedInfo(null);
              setModalOpen(false);
            } else {
              setSelectMode(true);
              setSelectedInfo(null);
            }
          }}
        >
          <SquareDashedMousePointer size={14} />
          {selectMode ? "退出选择 (ESC)" : "选择元素"}
        </Button>
        {selectMode && (
          <Chip size="sm" variant="soft" color="default">
            <Chip.Label>Shift 切父级 / Tab 切重叠</Chip.Label>
          </Chip>
        )}
        {selectedInfo && selectMode && (
          <Tooltip delay={0}>
            <Button
              isIconOnly
              size="sm"
              variant="ghost"
              onPress={() => setModalOpen(true)}
            >
              <Eye size={14} />
            </Button>
            <Tooltip.Content>查看选中信息</Tooltip.Content>
          </Tooltip>
        )}
      </header>

      {/* Main */}
      <div
        ref={setContainerRef}
        className="flex-1 flex min-h-0 relative select-none"
      >
        {/* 左: HTML 输入 */}
        <div
          className="border-r border-separator flex flex-col shrink-0 overflow-hidden"
          style={{ width: `${editorWidth}%` }}
        >
          <div className="px-4 py-2.5 border-b border-separator flex items-center gap-2">
            <Code2 size={14} className="text-muted" />
            <span className="text-xs text-muted font-medium">HTML Input</span>
          </div>
          <div className="flex-1 min-h-0">
            <CodeEditor
              value={html}
              onChange={(v) => {
                setHtml(v);
                setSelectMode(false);
                setSelectedInfo(null);
                setModalOpen(false);
              }}
            />
          </div>
        </div>

        {/* 分隔条 */}
        <div
          className={`w-1.5 shrink-0 flex items-center justify-center cursor-col-resize hover:bg-accent/20 transition-colors ${
            isDragging ? "bg-accent/30" : "bg-surface"
          }`}
          onMouseDown={handleMouseDown}
        >
          <GripVertical size={12} className="text-muted" />
        </div>

        {/* 右: 预览 */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex-1 min-h-0 bg-surface relative">
            <iframe
              ref={iframeRef}
              sandbox="allow-scripts allow-same-origin"
              srcDoc={html}
              className="w-full h-full border-none"
            />
            {selectMode && !selectedInfo && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10">
                <Chip
                  size="lg"
                  variant="primary"
                  color="danger"
                  className="animate-pulse"
                >
                  <Chip.Label>点击页面中的元素进行选择</Chip.Label>
                </Chip>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 选中信息 Modal */}
      {selectedInfo && (
        <Modal.Backdrop isOpen={modalOpen} onOpenChange={setModalOpen}>
          <Modal.Container>
            <Modal.Dialog className="sm:max-w-lg">
              <Modal.CloseTrigger />
              <Modal.Header>
                <Modal.Icon className="bg-success-soft text-success">
                  <Eye className="size-5" />
                </Modal.Icon>
                <Modal.Heading>选中元素信息</Modal.Heading>
              </Modal.Header>
              <Modal.Body>
                <div className="divide-y divide-separator">
                  <CopyField label="选择器" value={selectedInfo.selector} />
                  <CopyField label="标签" value={selectedInfo.tagName} />
                  <CopyField label="ID" value={selectedInfo.id} />
                  <CopyField label="Class" value={selectedInfo.className} />
                  <CopyField
                    label="尺寸"
                    value={`${selectedInfo.rect.width} × ${selectedInfo.rect.height}`}
                  />
                  <CopyField
                    label="位置"
                    value={`top=${selectedInfo.rect.top}, left=${selectedInfo.rect.left}`}
                  />
                  {selectedInfo.editableType && (
                    <>
                      <CopyField
                        label="Editable"
                        value={selectedInfo.editableType}
                      />
                      <CopyField
                        label="Value"
                        value={selectedInfo.editableValue || ""}
                      />
                    </>
                  )}
                  <CopyField label="文本" value={selectedInfo.textContent} />
                  <CopyField label="outerHTML" value={selectedInfo.outerHTML} />
                </div>
              </Modal.Body>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      )}
    </div>
  );
}

const SAMPLE_HTML = `<!DOCTYPE html>
<html>
<head>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: system-ui, sans-serif; background: #f8fafc; color: #1e293b; }
    .hero { padding: 60px 40px; text-align: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; }
    .hero h1 { font-size: 2.5rem; margin-bottom: 12px; }
    .hero p { font-size: 1.1rem; opacity: 0.9; }
    .cards { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; padding: 40px; max-width: 900px; margin: 0 auto; }
    .card { background: white; border-radius: 12px; padding: 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    .card h3 { font-size: 1.1rem; margin-bottom: 8px; }
    .card p { font-size: 0.9rem; color: #64748b; line-height: 1.5; }
    .footer { text-align: center; padding: 30px; color: #94a3b8; font-size: 0.85rem; }
  </style>
</head>
<body>
  <div class="hero" data-block="hero">
    <h1 data-editable="text" data-name="标题">Welcome to AI Web Builder</h1>
    <p data-editable="text" data-name="副标题">Build beautiful websites with the power of AI</p>
  </div>
  <div class="cards" data-block="features">
    <div class="card" data-repeatable>
      <h3 data-editable="text" data-name="卡片标题">🚀 Fast</h3>
      <p data-editable="text" data-name="卡片描述">Lightning fast build times with optimized output.</p>
    </div>
    <div class="card" data-repeatable>
      <h3 data-editable="text" data-name="卡片标题">🎨 Beautiful</h3>
      <p data-editable="text" data-name="卡片描述">Stunning designs generated by advanced AI models.</p>
    </div>
    <div class="card" data-repeatable>
      <h3 data-editable="text" data-name="卡片标题">🔧 Flexible</h3>
      <p data-editable="text" data-name="卡片描述">Customize everything to match your brand identity.</p>
    </div>
  </div>
  <div class="footer" data-block="footer">
    <p data-editable="text" data-name="版权">© 2026 AI Web Builder. All rights reserved.</p>
  </div>
</body>
</html>`;
