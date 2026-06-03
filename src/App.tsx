import { useState, useEffect } from "react";
import { Button, Tooltip } from "@heroui/react";
import { Code2, Wrench, PanelLeftClose, PanelLeft, Send, Database } from "lucide-react";
import { HtmlSelector } from "./tools/html-selector";
import { ApiRequest } from "./tools/api-request";
import { ResourceManager } from "./tools/resource-manager";

const TOOLS = [
  {
    id: "html-selector",
    name: "HTML Selector",
    description: "可视化选择 HTML 元素",
    icon: Code2,
    component: HtmlSelector,
  },
  {
    id: "api-request",
    name: "API Request",
    description: "发送 HTTP 请求，支持模板变量",
    icon: Send,
    component: ApiRequest,
  },
  {
    id: "resource-manager",
    name: "资源管理",
    description: "统一管理所有工具保存的数据",
    icon: Database,
    component: ResourceManager,
  },
];

export function App() {
  const [activeTool, setActiveTool] = useState(TOOLS[0].id);
  const [collapsed, setCollapsed] = useState(false);
  const current = TOOLS.find((t) => t.id === activeTool) || TOOLS[0];
  const ToolComponent = current.component;

  // 监听资源管理页面的跳转请求
  useEffect(() => {
    const handler = (e: Event) => {
      const ce = e as CustomEvent;
      if (ce.detail && TOOLS.some((t) => t.id === ce.detail)) {
        setActiveTool(ce.detail);
      }
    };
    window.addEventListener("orange-utils:navigate", handler);
    return () => window.removeEventListener("orange-utils:navigate", handler);
  }, []);

  return (
    <div className="h-screen flex bg-background text-foreground">
      {/* 侧边栏 */}
      <aside
        className={`border-r border-separator bg-surface flex flex-col shrink-0 transition-all duration-200 ${
          collapsed ? "w-14" : "w-56"
        }`}
      >
        {/* 顶部 */}
        <div className="h-14 border-b border-separator flex items-center px-3">
          {!collapsed && (
            <div className="flex items-center gap-2 flex-1">
              <Wrench size={18} className="text-accent" />
              <span className="text-sm font-semibold">orange-utils</span>
            </div>
          )}
          <Tooltip delay={0}>
            <Button
              isIconOnly
              size="sm"
              variant="ghost"
              onPress={() => setCollapsed(!collapsed)}
            >
              {collapsed ? (
                <PanelLeft size={16} />
              ) : (
                <PanelLeftClose size={16} />
              )}
            </Button>
            <Tooltip.Content placement="right">
              {collapsed ? "展开侧边栏" : "收起侧边栏"}
            </Tooltip.Content>
          </Tooltip>
        </div>

        {/* 工具列表 */}
        <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
          {TOOLS.map((tool) => {
            const Icon = tool.icon;
            const isActive = tool.id === activeTool;
            return (
              <Tooltip key={tool.id} delay={0}>
                <Button
                  fullWidth={!collapsed}
                  size="sm"
                  variant={isActive ? "secondary" : "ghost"}
                  className={collapsed ? "w-full" : "justify-start gap-3"}
                  onPress={() => setActiveTool(tool.id)}
                >
                  <Icon size={16} className={isActive ? "text-accent" : ""} />
                  {!collapsed && (
                    <span className="truncate text-xs">{tool.name}</span>
                  )}
                </Button>
                <Tooltip.Content placement="right">
                  {collapsed ? tool.name : tool.description}
                </Tooltip.Content>
              </Tooltip>
            );
          })}
        </nav>
      </aside>

      {/* 工具内容 */}
      <main className="flex-1 min-w-0">
        <ToolComponent key={current.id} />
      </main>
    </div>
  );
}
