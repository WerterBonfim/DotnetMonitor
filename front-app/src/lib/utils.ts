import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
}

export function formatPercent(value: number): string {
  return `${value.toFixed(2)}%`;
}

export function formatLongPath(path: string | null, maxLength: number = 60): string {
  if (!path) return '';
  
  if (path.length <= maxLength) {
    return path;
  }

  // Extrai o nome do executável (última parte do path)
  const parts = path.split(/[/\\]/);
  const executableName = parts[parts.length - 1];
  
  // Calcula quanto espaço temos para o início
  const ellipsis = '...';
  const availableStartLength = maxLength - ellipsis.length - executableName.length;
  
  if (availableStartLength <= 0) {
    // Se não há espaço suficiente, mostra apenas o nome do executável
    return executableName;
  }
  
  // Pega o início do path
  const start = path.substring(0, availableStartLength);
  
  return `${start}${ellipsis}${executableName}`;
}

export function formatTime(ms: number): string {
  if (!isFinite(ms) || ms < 0) return '0 ms';
  if (ms < 1) {
    return `${(ms * 1000).toFixed(2)} μs`;
  }
  if (ms < 1000) {
    return `${ms.toFixed(2)} ms`;
  }
  if (ms < 60000) {
    return `${(ms / 1000).toFixed(2)} s`;
  }
  const minutes = Math.floor(ms / 60000);
  const seconds = ((ms % 60000) / 1000).toFixed(0);
  return `${minutes}m ${seconds}s`;
}

export function formatRate(bytesPerSecond: number): string {
  if (!isFinite(bytesPerSecond) || bytesPerSecond < 0) return '0 B/s';
  if (bytesPerSecond === 0) return '0 B/s';
  const k = 1024;
  const sizes = ['B/s', 'KB/s', 'MB/s', 'GB/s'];
  const i = Math.floor(Math.log(bytesPerSecond) / Math.log(k));
  return `${(bytesPerSecond / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
}

export interface ThresholdConfig {
  normal: number;
  warning: number;
  critical: number;
}

export function getThresholdColor(value: number, thresholds: ThresholdConfig): string {
  if (value >= thresholds.critical) {
    return 'text-red-500';
  }
  if (value >= thresholds.warning) {
    return 'text-yellow-500';
  }
  return 'text-green-500';
}

export function getThresholdBgColor(value: number, thresholds: ThresholdConfig): string {
  if (value >= thresholds.critical) {
    return 'bg-red-500';
  }
  if (value >= thresholds.warning) {
    return 'bg-yellow-500';
  }
  return 'bg-green-500';
}
