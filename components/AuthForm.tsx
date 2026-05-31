"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  DefaultValues,
  FieldValues,
  Path,
  SubmitHandler,
  useForm,
  UseFormReturn,
} from "react-hook-form";
import { ZodType } from "zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import FileUpload from "@/components/FileUpload";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";

interface Props<T extends FieldValues> {
  schema: ZodType<T>;
  defaultValues: T;
  onSubmit: (data: T) => Promise<{
    success: boolean;
    error?: string;
    message?: string;
  }>;
  type: "SIGN_IN" | "SIGN_UP";
}

const labelMap: Record<string, string> = {
  fullName: "姓名",
  email: "邮箱",
  universityId: "学号",
  password: "密码",
  universityCard: "上传校园卡",
  role: "申请角色",
};

const inputTypeMap: Record<string, string> = {
  fullName: "text",
  email: "email",
  universityId: "number",
  password: "password",
};

const AuthForm = <T extends FieldValues>({
  type,
  schema,
  defaultValues,
  onSubmit,
}: Props<T>) => {
  const router = useRouter();
  const isSignIn = type === "SIGN_IN";

  const form: UseFormReturn<T> = useForm({
    resolver: zodResolver(schema),
    defaultValues: defaultValues as DefaultValues<T>,
  });

  const handleSubmit: SubmitHandler<T> = async (data) => {
    const result = await onSubmit(data);

    if (result.success) {
      toast({
        title: "操作成功",
        description:
          result.message ||
          (isSignIn
            ? "登录成功。"
            : "注册申请已提交，请等待管理员审核后再登录。"),
      });

      router.push(isSignIn ? "/" : "/sign-in");
      return;
    }

    toast({
      title: `${isSignIn ? "登录" : "注册"}失败`,
      description: result.error ?? "发生未知错误。",
      variant: "destructive",
    });
  };

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold text-white">
        {isSignIn ? "欢迎回到 BookWise" : "创建图书馆账号"}
      </h1>
      <p className="text-light-100">
        {isSignIn
          ? "登录后继续借阅、检索和查看个人记录。"
          : "填写完整信息并上传校园卡。你可以申请普通用户或管理员账号，均需等待已有管理员审批。"}
      </p>

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(handleSubmit)}
          className="w-full space-y-6"
        >
          {Object.keys(defaultValues).map((fieldName) => (
            <FormField
              key={fieldName}
              control={form.control}
              name={fieldName as Path<T>}
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="capitalize">
                    {labelMap[field.name] || field.name}
                  </FormLabel>
                  <FormControl>
                    {field.name === "universityCard" ? (
                      <FileUpload
                        type="file"
                        accept="image/*,.pdf,application/pdf"
                        placeholder="上传校园卡图片或 PDF"
                        folder="ids"
                        variant="dark"
                        onFileChange={field.onChange}
                        value={field.value}
                      />
                    ) : field.name === "role" ? (
                      <select
                        {...field}
                        className="form-input"
                        value={String(field.value || "USER")}
                      >
                        <option value="USER">普通用户</option>
                        <option value="ADMIN">管理员</option>
                      </select>
                    ) : (
                      <Input
                        required
                        type={inputTypeMap[field.name] || "text"}
                        {...field}
                        className="form-input"
                      />
                    )}
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          ))}

          <Button type="submit" className="form-btn">
            {isSignIn ? "登录" : "提交注册申请"}
          </Button>
        </form>
      </Form>

      <p className="text-center text-base font-medium text-light-100">
        {isSignIn ? "还没有账号？" : "已经有账号？"}
        <Link
          href={isSignIn ? "/sign-up" : "/sign-in"}
          className="ml-2 font-bold text-primary"
        >
          {isSignIn ? "立即注册" : "返回登录"}
        </Link>
      </p>
    </div>
  );
};

export default AuthForm;
