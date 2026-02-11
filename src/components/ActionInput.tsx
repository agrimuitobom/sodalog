"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { CultivationAction, ActionType, FertilizerDetail } from "@/types/record";

interface ActionInputProps {
  actions: CultivationAction[];
  onChange: (actions: CultivationAction[]) => void;
}

const actionTypeLabels: Record<ActionType, string> = {
  fertilizer: "施肥",
  pruning: "剪定",
  watering: "灌水",
  other: "その他",
};

export default function ActionInput({ actions, onChange }: ActionInputProps) {
  const [showAdd, setShowAdd] = useState(false);

  const addAction = (type: ActionType) => {
    let detail: CultivationAction["detail"];
    switch (type) {
      case "fertilizer":
        detail = { name: "", amount: "", unit: "g" };
        break;
      case "pruning":
        detail = { method: "" };
        break;
      case "watering":
        detail = { amount: "" };
        break;
      case "other":
        detail = { description: "" };
        break;
    }
    onChange([...actions, { type, detail }]);
    setShowAdd(false);
  };

  const removeAction = (index: number) => {
    onChange(actions.filter((_, i) => i !== index));
  };

  const updateAction = (index: number, detail: CultivationAction["detail"]) => {
    const updated = [...actions];
    updated[index] = { ...updated[index], detail };
    onChange(updated);
  };

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700">栽培作業</label>

      {actions.map((action, index) => (
        <div key={index} className="bg-gray-50 rounded-lg p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-green-700">
              {actionTypeLabels[action.type]}
            </span>
            <button type="button" onClick={() => removeAction(index)} className="text-red-400 hover:text-red-600">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          {action.type === "fertilizer" && (
            <div className="space-y-2">
              <input
                type="text"
                placeholder="肥料名"
                value={(action.detail as FertilizerDetail).name}
                onChange={(e) =>
                  updateAction(index, { ...action.detail, name: e.target.value } as FertilizerDetail)
                }
                className="w-full px-3 py-2.5 border border-gray-300 rounded-md text-sm"
              />
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="量"
                  value={(action.detail as FertilizerDetail).amount}
                  onChange={(e) =>
                    updateAction(index, { ...action.detail, amount: e.target.value } as FertilizerDetail)
                  }
                  className="flex-1 px-3 py-2.5 border border-gray-300 rounded-md text-sm"
                />
                <select
                  value={(action.detail as FertilizerDetail).unit}
                  onChange={(e) =>
                    updateAction(index, { ...action.detail, unit: e.target.value } as FertilizerDetail)
                  }
                  className="px-3 py-2.5 border border-gray-300 rounded-md text-sm"
                >
                  <option value="g">g</option>
                  <option value="kg">kg</option>
                  <option value="ml">ml</option>
                  <option value="L">L</option>
                </select>
              </div>
            </div>
          )}

          {action.type === "pruning" && (
            <input
              type="text"
              placeholder="剪定方法"
              value={(action.detail as { method: string }).method}
              onChange={(e) => updateAction(index, { method: e.target.value })}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-md text-sm"
            />
          )}

          {action.type === "watering" && (
            <input
              type="text"
              placeholder="灌水量（例：2L）"
              value={(action.detail as { amount: string }).amount}
              onChange={(e) => updateAction(index, { amount: e.target.value })}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-md text-sm"
            />
          )}

          {action.type === "other" && (
            <input
              type="text"
              placeholder="作業内容"
              value={(action.detail as { description: string }).description}
              onChange={(e) => updateAction(index, { description: e.target.value })}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-md text-sm"
            />
          )}
        </div>
      ))}

      {showAdd ? (
        <div className="grid grid-cols-2 gap-2">
          {(Object.keys(actionTypeLabels) as ActionType[]).map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => addAction(type)}
              className="px-3 py-2.5 bg-green-50 text-green-700 rounded-md text-sm font-medium hover:bg-green-100 border border-green-200"
            >
              {actionTypeLabels[type]}
            </button>
          ))}
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-1 text-green-600 text-sm font-medium hover:text-green-800"
        >
          <Plus className="w-4 h-4" />
          作業を追加
        </button>
      )}
    </div>
  );
}
