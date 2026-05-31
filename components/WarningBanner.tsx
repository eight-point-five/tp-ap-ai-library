"use client";

import React, { useEffect, useState } from "react";

interface Props {
  score: number;
  overdueCount: number;
  controlStatus: ControlStatus;
  restrictionReason?: string | null;
}

const WarningBanner = ({
  score,
  overdueCount,
  controlStatus,
  restrictionReason,
}: Props) => {
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

  if (
    dismissed ||
    (score < 50 && overdueCount === 0 && controlStatus === "NORMAL")
  ) {
    return null;
  }

  const hasOverdue = overdueCount > 0;
  const isHighRisk = score >= 80;
  const isMediumRisk = score >= 50 && score < 80;

  let bgColor = "bg-orange-500";
  let message = "";

  if (controlStatus === "BLOCKED") {
    bgColor = "bg-red-700";
    message =
      restrictionReason ||
      "Borrowing is temporarily blocked because the account triggered severe risk rules.";
  } else if (controlStatus === "REVIEW") {
    bgColor = "bg-red-600";
    message =
      restrictionReason ||
      "Manual review is required before additional borrowing is allowed.";
  } else if (controlStatus === "WATCH") {
    bgColor = "bg-amber-600";
    message =
      restrictionReason ||
      "The account is under elevated monitoring. Please return books on time and avoid burst borrowing.";
  } else if (isHighRisk && hasOverdue) {
    bgColor = "bg-red-600";
    message = `Risk score ${score}. There are ${overdueCount} overdue borrowed books that should be returned immediately.`;
  } else if (isHighRisk) {
    bgColor = "bg-red-600";
    message = `Risk score ${score}. The account is at high risk and may soon face borrowing restrictions.`;
  } else if (isMediumRisk && hasOverdue) {
    bgColor = "bg-orange-600";
    message = `Risk score ${score}. There are ${overdueCount} overdue books, so the account should be corrected quickly.`;
  } else if (hasOverdue) {
    bgColor = "bg-orange-500";
    message = `There are ${overdueCount} overdue books. Return them soon to avoid stricter control.`;
  } else {
    message = `Risk score ${score}. Borrowing is still allowed, but the account should be watched closely.`;
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
        className="ml-4 text-white transition-colors hover:text-gray-200"
        aria-label="Dismiss"
      >
        &#10005;
      </button>
    </div>
  );
};

export default WarningBanner;
