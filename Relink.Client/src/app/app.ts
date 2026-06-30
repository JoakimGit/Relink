import { Component } from "@angular/core";
import { RouterOutlet } from "@angular/router";

@Component({
  selector: "app-root",
  imports: [RouterOutlet],
  template: `
    <div class="min-h-screen bg-background">
      <router-outlet />
    </div>
  `,
})
export class App {
  protected title = "Relink.Client";
}
