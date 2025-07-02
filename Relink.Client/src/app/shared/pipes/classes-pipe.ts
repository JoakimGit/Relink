import { Pipe, PipeTransform } from "@angular/core";
import { cn } from "../utils/cn";

@Pipe({
  name: "classes",
  pure: true,
})
export class ClassesPipe implements PipeTransform {
  transform(
    customClasses: string | null | undefined,
    ...defaultClasses: string[]
  ): string {
    return cn(...defaultClasses, customClasses);
  }
}
