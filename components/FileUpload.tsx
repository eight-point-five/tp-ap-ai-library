"use client";

import { IKImage, ImageKitProvider, IKUpload, IKVideo } from "imagekitio-next";
import Image from "next/image";
import { useRef, useState } from "react";
import config from "@/lib/config";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const {
  env: {
    imagekit: { publicKey, urlEndpoint },
  },
} = config;

const hasImageKit =
  publicKey &&
  publicKey !== "placeholder" &&
  urlEndpoint &&
  !urlEndpoint.includes("placeholder");

const authenticator = async () => {
  const response = await fetch(`${config.env.apiEndpoint}/api/imagekit`);

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`ImageKit authentication failed: ${errorText}`);
  }

  const { signature, expire, token } = await response.json();
  return { token, expire, signature };
};

interface Props {
  type: "image" | "video" | "file";
  accept: string;
  placeholder: string;
  folder: string;
  variant: "dark" | "light";
  onFileChange: (filePath: string) => void;
  value?: string;
}

const getKindLabel = (type: Props["type"]) => {
  if (type === "video") return "视频";
  if (type === "image") return "图片";
  return "文件";
};

const FileUpload = ({
  type,
  accept,
  placeholder,
  folder,
  variant,
  onFileChange,
  value,
}: Props) => {
  const ikUploadRef = useRef(null);
  const localInputRef = useRef<HTMLInputElement>(null);
  const [filePath, setFilePath] = useState(value ?? "");
  const [progress, setProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  const styles = {
    button:
      variant === "dark"
        ? "bg-dark-300"
        : "border border-gray-100 bg-light-600",
    placeholder: variant === "dark" ? "text-light-100" : "text-slate-500",
    text: variant === "dark" ? "text-light-100" : "text-dark-400",
  };

  const validateFile = (selectedFile: File) => {
    if (type === "file") {
      const isSupported =
        selectedFile.type.startsWith("image/") ||
        selectedFile.type === "application/pdf";

      if (!isSupported) {
        toast({
          title: "文件格式不支持",
          description: "校园卡材料只支持图片或 PDF。",
          variant: "destructive",
        });
        return false;
      }
    }

    if (type === "image" && !selectedFile.type.startsWith("image/")) {
      toast({
        title: "文件格式不支持",
        description: "请上传图片文件。",
        variant: "destructive",
      });
      return false;
    }

    if (type === "video" && !selectedFile.type.startsWith("video/")) {
      toast({
        title: "文件格式不支持",
        description: "请上传视频文件。",
        variant: "destructive",
      });
      return false;
    }

    const maxSize = type === "video" ? 50 * 1024 * 1024 : 20 * 1024 * 1024;
    if (selectedFile.size > maxSize) {
      toast({
        title: "文件过大",
        description:
          type === "video" ? "请上传小于 50MB 的视频。" : "请上传小于 20MB 的文件。",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const completeUpload = (nextPath: string) => {
    setFilePath(nextPath);
    onFileChange(nextPath);
    toast({
      title: `${getKindLabel(type)}上传成功`,
      description: "文件已保存，可以继续提交表单。",
    });
  };

  const uploadLocalFile = async (selectedFile: File) => {
    if (!validateFile(selectedFile)) return;

    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("folder", folder);
    formData.append("type", type);

    setIsUploading(true);
    setProgress(15);

    try {
      const response = await fetch("/api/upload/local", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (!response.ok || !result.filePath) {
        throw new Error(result.error || "本地上传失败");
      }

      setProgress(100);
      completeUpload(result.filePath);
    } catch (error) {
      console.error(error);
      toast({
        title: `${getKindLabel(type)}上传失败`,
        description: "本地保存失败，请重新选择文件后再试。",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      setTimeout(() => setProgress(0), 600);
    }
  };

  const onImageKitError = (error: unknown) => {
    console.error(error);
    toast({
      title: `${getKindLabel(type)}上传失败`,
      description: "云端上传失败，请检查 ImageKit 配置或使用本地开发配置。",
      variant: "destructive",
    });
  };

  const isPdf = filePath.toLowerCase().endsWith(".pdf");
  const canPreviewAsImage = filePath && !isPdf && (type === "image" || type === "file");

  const uploadButton = (
    <button
      className={cn("upload-btn", styles.button)}
      onClick={(event) => {
        event.preventDefault();

        if (hasImageKit && type !== "file" && ikUploadRef.current) {
          // The ImageKit component exposes click() through the forwarded ref.
          // @ts-expect-error imagekitio-next does not type this imperative API.
          ikUploadRef.current.click();
          return;
        }

        localInputRef.current?.click();
      }}
      type="button"
      disabled={isUploading}
    >
      <Image
        src="/icons/upload.svg"
        alt="upload-icon"
        width={20}
        height={20}
        className="object-contain"
      />

      <p className={cn("text-base", styles.placeholder)}>
        {isUploading ? "正在上传..." : placeholder}
      </p>

      {filePath ? (
        <p className={cn("upload-filename", styles.text)}>{filePath}</p>
      ) : null}
    </button>
  );

  const preview = isPdf ? (
    <a
      href={filePath}
      target="_blank"
      rel="noreferrer"
      className="inline-flex w-fit rounded-md bg-light-600 px-4 py-2 text-sm font-semibold text-dark-400"
    >
      查看已上传 PDF
    </a>
  ) : canPreviewAsImage ? (
    hasImageKit && !filePath.startsWith("/") ? (
      <IKImage alt="uploaded file" path={filePath} width={500} height={300} />
    ) : (
      <Image
        src={filePath}
        alt="uploaded file"
        width={500}
        height={300}
        className="rounded-xl object-cover"
      />
    )
  ) : filePath && type === "video" ? (
    hasImageKit && !filePath.startsWith("/") ? (
      <IKVideo path={filePath} controls={true} className="h-96 w-full rounded-xl" />
    ) : (
      <video src={filePath} controls className="h-96 w-full rounded-xl" />
    )
  ) : null;

  return (
    <ImageKitProvider
      publicKey={publicKey}
      urlEndpoint={urlEndpoint}
      authenticator={authenticator}
    >
      {hasImageKit && type !== "file" ? (
        <IKUpload
          ref={ikUploadRef}
          onError={onImageKitError}
          onSuccess={(response: { filePath: string }) => completeUpload(response.filePath)}
          useUniqueFileName={true}
          validateFile={validateFile}
          onUploadStart={() => setProgress(0)}
          onUploadProgress={({ loaded, total }) => {
            setProgress(Math.round((loaded / total) * 100));
          }}
          folder={folder}
          accept={accept}
          className="hidden"
        />
      ) : null}

      <input
        ref={localInputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(event) => {
          const selectedFile = event.target.files?.[0];
          if (selectedFile) void uploadLocalFile(selectedFile);
          event.target.value = "";
        }}
      />

      {uploadButton}

      {progress > 0 && progress !== 100 ? (
        <div className="w-full rounded-full bg-green-200">
          <div className="progress" style={{ width: `${progress}%` }}>
            {progress}%
          </div>
        </div>
      ) : null}

      {preview}
    </ImageKitProvider>
  );
};

export default FileUpload;
