"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

interface Props {
  userId: string;
  currentStatus: string | null;
  isSelf: boolean;
  isProtected?: boolean;
  protectedReason?: string;
}

const UserStatusControls = ({
  userId,
  currentStatus,
  isSelf,
  isProtected = false,
  protectedReason = "初始管理员受保护",
}: Props) => {
  const router = useRouter();
  const [loadingStatus, setLoadingStatus] = useState<"APPROVED" | "REJECTED" | null>(
    null,
  );

  if (isSelf) {
    return <span className="text-xs text-light-500">不能操作自己的账号</span>;
  }

  if (isProtected) {
    return <span className="text-xs text-light-500">{protectedReason}</span>;
  }

  const updateStatus = async (status: "APPROVED" | "REJECTED") => {
    setLoadingStatus(status);
    try {
      const response = await fetch(`/api/admin/users/${userId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(result.error || "status update failed");
      }

      toast({
        title: "操作成功",
        description:
          status === "REJECTED" ? "该账号已被拒绝或封禁。" : "该账号已通过审核或恢复可用。",
      });
      router.refresh();
    } catch (error) {
      toast({
        title: "操作失败",
        description:
          error instanceof Error
            ? error.message
            : "账号状态更新失败，请稍后重试。",
        variant: "destructive",
      });
    } finally {
      setLoadingStatus(null);
    }
  };

  if (currentStatus === "PENDING") {
    return (
      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          className="bg-emerald-600 text-white hover:bg-emerald-700"
          disabled={!!loadingStatus}
          onClick={() => updateStatus("APPROVED")}
        >
          {loadingStatus === "APPROVED" ? "处理中..." : "通过"}
        </Button>
        <Button
          size="sm"
          className="bg-red-600 text-white hover:bg-red-700"
          disabled={!!loadingStatus}
          onClick={() => updateStatus("REJECTED")}
        >
          {loadingStatus === "REJECTED" ? "处理中..." : "拒绝"}
        </Button>
      </div>
    );
  }

  if (currentStatus === "REJECTED") {
    return (
      <Button
        size="sm"
        className="bg-emerald-600 text-white hover:bg-emerald-700"
        disabled={!!loadingStatus}
        onClick={() => updateStatus("APPROVED")}
      >
        {loadingStatus === "APPROVED" ? "处理中..." : "恢复 / 通过"}
      </Button>
    );
  }

  return (
    <Button
      size="sm"
      className="bg-red-600 text-white hover:bg-red-700"
      disabled={!!loadingStatus}
      onClick={() => updateStatus("REJECTED")}
    >
      {loadingStatus === "REJECTED" ? "处理中..." : "封禁账号"}
    </Button>
  );
};

export default UserStatusControls;
