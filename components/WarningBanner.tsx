"use client";

import React, { useState, useEffect } from "react";

interface Props {
  score: number;
  overdueCount: number;
}

const WarningBanner = ({ score, overdueCount }: Props) => {
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const key = `warning-dismissed-${new Date().toISOString().slice(0, 10)}`;
    const saved = localStorage.getItem(key);
    if (saved === "true") {
      setDismissed(true);
    }
  }, []);

  const handleDismiss = () => {
    const key = `warning-dismissed-${new Date().toISOString().slice(0, 10)}`;
    localStorage.setItem(key, "true");
    setDismissed(true);
  };

  if (dismissed || (score < 50 && overdueCount === 0)) {
    return null;
  }

  const hasOverdue = overdueCount > 0;
  const isHighRisk = score >= 80;
  const isMediumRisk = score >= 50 && score < 80;

  let bgColor = "bg-orange-500";
  let message = "";

  if (isHighRisk && hasOverdue) {
    bgColor = "bg-red-600";
    message = `警告：当前风险评分 ${score} 分（高风险），且有 ${overdueCount} 本图书逾期未还。请立即归还！`;
  } else if (isHighRisk) {
    bgColor = "bg-red-600";
    message = `警告：当前风险评分 ${score} 分（高风险），建议尽快归还图书避免借阅权限受限。`;
  } else if (isMediumRisk && hasOverdue) {
    bgColor = "bg-orange-600";
    message = `提示：当前风险评分 ${score} 分（中等），且有 ${overdueCount} 本图书逾期未还。请尽快归还。`;
  } else if (hasOverdue) {
    bgColor = "bg-orange-500";
    message = `您有 ${overdueCount} 本图书已逾期，请尽快归还以免影响借阅权限。`;
  } else {
    bgColor = "bg-orange-500";
    message = `当前风险评分 ${score} 分（中等），建议尽快归还图书避免风险升级。`;
  }

  return (
    <div
      className={`${bgColor} flex items-center justify-between px-6 py-3 text-white`}
    >
      <div className="flex items-center gap-3">
        <span className="text-lg">&#9888;</span>
        <p className="text-sm font-medium">{message}</p>
      </div>
      <button
        onClick={handleDismiss}
        className="ml-4 text-white hover:text-gray-200 transition-colors"
        aria-label="关闭"
      >
        &#10005;
      </button>
    </div>
  );
};

export default WarningBanner;
