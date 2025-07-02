import { ClassNameValue, twMerge } from "tailwind-merge";

export function cn(...inputs: Array<ClassNameValue>) {
  return twMerge(inputs);
}
