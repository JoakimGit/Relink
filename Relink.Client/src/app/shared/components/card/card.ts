import { ChangeDetectionStrategy, Component, input } from "@angular/core";
import { cn } from "../../utils/cn";
import { ClassesPipe } from "../../pipes/classes-pipe";

@Component({
  selector: "app-card",
  imports: [ClassesPipe],
  template: `
    <div [class]="class() | classes : 'bg-card text-card-foreground flex flex-col gap-6 rounded-xl border py-6 shadow-sm'">
      <ng-content />
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Card {
  public class = input<string | null>(null);
}
