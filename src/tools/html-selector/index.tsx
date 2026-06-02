import { useState, useRef, useCallback } from "react";
import { Button, Card, Chip, Tooltip } from "@heroui/react";
import {
  SquareDashedMousePointer,
  Copy,
  RotateCcw,
  Code2,
  Eye,
} from "lucide-react";
import { CodeEditor } from "./CodeEditor";
import {
  useIframeSelector,
  type SelectionInfo,
} from "./hooks/useIframeSelector";

export function HtmlSelector() {
  const [html, setHtml] = useState(SAMPLE_HTML);
  const [selectMode, setSelectMode] = useState(false);
  const [selectedInfo, setSelectedInfo] = useState<SelectionInfo | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const handleSelected = useCallback((info: SelectionInfo) => {
    setSelectedInfo(info);
  }, []);

  const handleExit = useCallback(() => {
    setSelectMode(false);
    setSelectedInfo(null);
  }, []);

  useIframeSelector({
    iframeRef,
    selectMode,
    onSelected: handleSelected,
    onExit: handleExit,
  });

  const handleCopy = () => {
    if (selectedInfo) {
      navigator.clipboard.writeText(selectedInfo.selector);
    }
  };

  return (
    <div className="h-full flex flex-col bg-background text-foreground">
      {/* Header */}
      <header className="h-14 border-b border-separator flex items-center px-5 gap-3 shrink-0">
        <h1 className="text-sm font-semibold">HTML Selector</h1>
        <span className="text-xs text-muted">
          粘贴 HTML → 预览 → 选择元素 → Console 输出
        </span>
        <div className="flex-1" />
        <Button
          size="sm"
          className="text-xs"
          variant={selectMode ? "danger" : "primary"}
          onPress={(e) => {
            // 点击后立即失焦，防止 Enter 重复触发
            (e.target as HTMLElement)?.blur?.();
            if (selectMode) {
              setSelectMode(false);
              setSelectedInfo(null);
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
        {selectedInfo && (
          <Tooltip delay={0}>
            <Button
              isIconOnly
              size="sm"
              variant="ghost"
              onPress={() => {
                setSelectMode(false);
                setSelectedInfo(null);
              }}
            >
              <RotateCcw size={14} />
            </Button>
            <Tooltip.Content>重置选择</Tooltip.Content>
          </Tooltip>
        )}
      </header>

      {/* Main */}
      <div className="flex-1 flex min-h-0">
        {/* 左: HTML 输入 */}
        <div className="w-100 border-r border-separator flex flex-col shrink-0">
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
              }}
            />
          </div>
        </div>

        {/* 右: 预览 + 详情 */}
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
            {selectMode && selectedInfo && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10">
                <Chip size="lg" variant="primary" color="success">
                  <Chip.Label>
                    ✓ 已选中 {selectedInfo.tagName}
                    {selectedInfo.id ? `#${selectedInfo.id}` : ""}
                  </Chip.Label>
                </Chip>
              </div>
            )}
          </div>

          {selectedInfo && (
            <div className="h-55 border-t border-separator shrink-0 overflow-auto">
              <Card className="h-full rounded-none shadow-none border-0">
                <Card.Header className="px-4 py-2 flex items-center gap-2">
                  <Eye size={14} className="text-success" />
                  <span className="text-xs font-medium text-muted">
                    Selected
                  </span>
                  <Chip
                    size="sm"
                    variant="soft"
                    color="success"
                    className="font-mono"
                  >
                    <Chip.Label>{selectedInfo.selector}</Chip.Label>
                  </Chip>
                  <div className="flex-1" />
                  <Tooltip delay={0}>
                    <Button
                      isIconOnly
                      size="sm"
                      variant="ghost"
                      onPress={handleCopy}
                    >
                      <Copy size={12} />
                    </Button>
                    <Tooltip.Content>复制选择器</Tooltip.Content>
                  </Tooltip>
                </Card.Header>
                <Card.Content className="px-4 py-2 text-xs font-mono gap-1.5">
                  <div className="grid grid-cols-2 gap-x-8 gap-y-1 text-muted">
                    <div>
                      tag:{" "}
                      <span className="text-foreground">
                        {selectedInfo.tagName}
                      </span>
                    </div>
                    <div>
                      size:{" "}
                      <span className="text-foreground">
                        {selectedInfo.rect.width} × {selectedInfo.rect.height}
                      </span>
                    </div>
                    <div>
                      id:{" "}
                      <span className="text-foreground">
                        {selectedInfo.id || "-"}
                      </span>
                    </div>
                    <div>
                      class:{" "}
                      <span className="text-foreground truncate inline-block max-w-70 align-bottom">
                        {selectedInfo.className || "-"}
                      </span>
                    </div>
                    {selectedInfo.editableType && (
                      <>
                        <div>
                          editable:{" "}
                          <Chip
                            size="sm"
                            variant="soft"
                            color="warning"
                            className="font-mono"
                          >
                            <Chip.Label>{selectedInfo.editableType}</Chip.Label>
                          </Chip>
                        </div>
                        <div>
                          value:{" "}
                          <span className="text-foreground truncate inline-block max-w-70 align-bottom">
                            {selectedInfo.editableValue}
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                  <div className="mt-1 pt-1 border-t border-separator text-muted">
                    text:{" "}
                    <span className="text-foreground">
                      {selectedInfo.textContent}
                    </span>
                  </div>
                </Card.Content>
              </Card>
            </div>
          )}
        </div>
      </div>
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
