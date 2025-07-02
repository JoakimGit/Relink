import { Component } from "@angular/core";
import { Header } from "./core/layout/header";
import { RouterOutlet } from "@angular/router";

@Component({
  selector: "app-root",
  imports: [Header, RouterOutlet],
  template: `
    <div class="min-h-screen bg-background">
      <app-header />
      <router-outlet />
    </div>
  `,
})
export class App {
  protected title = "Relink.Client";
}
