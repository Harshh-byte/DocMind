import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import * as Icons from "lucide-react";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getFileIcon(fileName: string) {
  const lowerName = fileName.toLowerCase();
  
  if (lowerName.includes("resume") || lowerName.includes("cv") || lowerName.includes("portfolio")) {
    return Icons.Briefcase;
  }
  if (lowerName.includes("invoice") || lowerName.includes("receipt") || lowerName.includes("billing") || lowerName.includes("finance")) {
    return Icons.Receipt;
  }
  if (lowerName.includes("code") || lowerName.includes("script") || lowerName.includes("program")) {
    return Icons.FileCode;
  }
  if (lowerName.includes("contract") || lowerName.includes("legal") || lowerName.includes("law") || lowerName.includes("agreement")) {
    return Icons.Scale;
  }
  if (lowerName.includes("presentation") || lowerName.includes("slide") || lowerName.includes("pitch")) {
    return Icons.Presentation;
  }
  if (lowerName.includes("data") || lowerName.includes("database") || lowerName.includes("excel") || lowerName.includes("analytics")) {
    return Icons.Database;
  }
  if (lowerName.includes("medical") || lowerName.includes("health") || lowerName.includes("doctor")) {
    return Icons.HeartPulse;
  }
  if (lowerName.includes("book") || lowerName.includes("novel") || lowerName.includes("literature")) {
    return Icons.BookOpen;
  }

  const ext = fileName.split(".").pop()?.toLowerCase() || "";
  switch (ext) {
    case "pdf":
    case "doc":
    case "docx":
    case "txt":
    case "rtf":
    case "odt":
      return Icons.FileText;
    case "xls":
    case "xlsx":
    case "csv":
    case "ods":
      return Icons.FileSpreadsheet;
    case "png":
    case "jpg":
    case "jpeg":
    case "gif":
    case "svg":
    case "webp":
    case "ico":
      return Icons.FileImage;
    case "mp4":
    case "mov":
    case "avi":
    case "mkv":
    case "webm":
      return Icons.FileVideo;
    case "mp3":
    case "wav":
    case "ogg":
    case "m4a":
    case "flac":
      return Icons.FileAudio;
    case "zip":
    case "rar":
    case "7z":
    case "tar":
    case "gz":
      return Icons.FileArchive;
    case "js":
    case "jsx":
    case "ts":
    case "tsx":
    case "html":
    case "css":
    case "json":
    case "py":
    case "cpp":
    case "c":
    case "go":
    case "rs":
    case "sh":
      return Icons.FileCode;
    default:
      return Icons.FileText;
  }
}
