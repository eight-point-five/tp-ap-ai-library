"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { toast } from "@/hooks/use-toast";
import { returnBook } from "@/lib/actions/book";

const ReturnBookButton = ({ recordId }: { recordId: string }) => {
  const router = useRouter();
  const [returning, setReturning] = useState(false);

  const handleReturn = async () => {
    setReturning(true);

    try {
      const result = await returnBook(recordId);

      if (result.success) {
        toast({
          title: "操作成功",
          description: "图书已归还。",
        });
        router.refresh();
      } else {
        toast({
          title: "操作失败",
          description: result.error,
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: "操作失败",
        description: "归还过程中发生错误",
        variant: "destructive",
      });
    } finally {
      setReturning(false);
    }
  };

  return (
    <Button
      className="book-btn w-full !bg-green-700 text-white hover:!bg-green-800"
      onClick={handleReturn}
      disabled={returning}
    >
      {returning ? "归还中..." : "归还"}
    </Button>
  );
};

export default ReturnBookButton;
