import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Mask E.164 for display (keep country code + last 2 digits). */
export function maskPhoneE164(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length <= 4) return "••••";
  return `${phone.slice(0, Math.max(0, phone.length - 4)).replace(/\d/g, "•")}${phone.slice(-2)}`;
}
