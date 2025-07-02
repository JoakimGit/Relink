import { ChangeDetectionStrategy, Component } from "@angular/core";
import { Input } from "../../shared/components/input";
import { Button } from "../../shared/components/button";
import { Card } from "../../shared/components/card/card";

@Component({
  selector: "app-header",
  imports: [Input, Button, Card],
  template: `
    <header
      class="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
    >
      <div class="container mx-auto px-4 py-4">
        <div class="flex items-center justify-between">
          <h1 class="text-2xl font-bold">ReLink</h1>

          <div class="relative max-w-sm w-full">
            <svg
              class="absolute left-3 top-1/2 transform -translate-y-1/2 size-4 text-muted-foreground"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="m21 21-4.34-4.34" />
              <circle cx="11" cy="11" r="8" />
            </svg>

            <input
              app-input
              class="pl-10"
              placeholder="Search links, tags, or URLs..."
            />
          </div>

          <button app-button class="gap-2">
            <svg
              class="size-4"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M5 12h14" />
              <path d="M12 5v14" />
            </svg>
            Create Link
          </button>
        </div>
      </div>
    </header>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Header { }
