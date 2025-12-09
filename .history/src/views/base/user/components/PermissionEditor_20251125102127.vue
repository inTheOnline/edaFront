import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight } from "lucide-react";

/**
 * PermissionEditor
 * 通用权限编辑组件（树形结构：菜单 + 按钮）
 *
 * props:
 * - roles: 角色列表 [{ id, name }]
 * - permissions: 权限树 [{ id, name, type: 'menu'|'button', children: [] }]
 * - value: 当前绑定的权限 id 列表
 * - onChange: (ids) => void
 */
export default function PermissionEditor({
  roles = [],
  permissions = [],
  value = [],
  onChange
}) {
  const [currentRole, setCurrentRole] = useState(null);

  const togglePermission = (id) => {
    const newValue = value.includes(id)
      ? value.filter((x) => x !== id)
      : [...value, id];
    onChange?.(newValue);
  };

  const renderTree = (tree) => {
    return tree.map((item) => (
      <div key={item.id} className="ml-4 mt-2">
        <div
          className="flex items-center gap-2 cursor-pointer p-1 rounded hover:bg-gray-100"
          onClick={() => togglePermission(item.id)}
        >
          <input type="checkbox" checked={value.includes(item.id)} readOnly />
          <span className="text-sm">{item.name}</span>
        </div>

        {item.children?.length > 0 && (
          <div className="ml-4">{renderTree(item.children)}</div>
        )}
      </div>
    ));
  };

  return (
    <div className="grid grid-cols-[240px_1fr] gap-4 h-full p-4">
      {/* 左侧角色列表 */}
      <Card className="h-full overflow-hidden">
        <CardContent className="p-2">
          <div className="text-lg font-bold mb-3">角色列表</div>

          <div className="flex flex-col gap-1 overflow-auto h-[calc(100%-40px)]">
            {roles.map((role) => (
              <motion.div
                key={role.id}
                whileTap={{ scale: 0.97 }}
                transition={{ duration: 0.05 }}
              >
                <Button
                  variant={
                    currentRole?.id === role.id ? "default" : "ghost"
                  }
                  className="justify-start w-full"
                  onClick={() => setCurrentRole(role)}
                >
                  {role.name}
                </Button>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 右侧权限编辑面板（带动画） */}
      <AnimatePresence mode="popLayout">
        <motion.div
          key={currentRole?.id || "empty"}
          initial={{ opacity: 0, x: 40, scale: 0.96 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: -40, scale: 0.96 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="h-full"
        >
          <Card className="h-full">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-4">
                <ChevronRight />
                <div className="text-xl font-semibold">权限编辑</div>
                {currentRole && (
                  <div className="text-gray-500 ml-2">
                    （{currentRole.name}）
                  </div>
                )}
              </div>

              {!currentRole ? (
                <div className="text-gray-500 text-sm">
                  请选择左侧角色
                </div>
              ) : (
                <div className="overflow-auto h-[calc(100%-40px)] pr-2">
                  {renderTree(permissions)}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
