import { Component, inject } from "@angular/core";
import { LinkService } from "../services/link-service";
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideLock, lucideCalendar, lucideTag } from '@ng-icons/lucide';

@Component({
    selector: "app-home-page",
    imports: [NgIcon],
    viewProviders: [provideIcons({ lucideLock, lucideCalendar, lucideTag })],
    template: `
    <div class="p-10 max-w-7xl mx-auto">
        @if (linksResource.hasValue()) {
            <div class="grid grid-cols-3 gap-6">
                
            @for (link of linksResource.value(); track link.id) {
                <div class="bg-card text-card-foreground flex flex-col shadow-sm border rounded-2xl py-3 px-4">
                    <div class="mb-3">
                        <h3 class="font-medium text-sm truncate">{{ link.id }}</h3>
                        <p class="text-xs text-muted-foreground truncate max-w-5/6">{{ link.longUrl }}</p>
                        <div class="flex items-center gap-1 text-xs text-muted-foreground">
                            <ng-icon name="lucideCalendar" />
                            22.03.2026
                        </div>
                    </div>

                    <div class="flex items-center gap-2 text-sm">
                        <div class="flex items-center gap-1">
                            <ng-icon name="lucideLock" />
                            Protected
                        </div>

                        <div class="flex items-center gap-1">
                            <ng-icon name="lucideCalendar" />
                            Expires 31.12.2027
                        </div>
                    </div>

                    <div>
                        <ng-icon name="lucideTag" />
                        <div>
                            @for (tag of link.tags; track tag.id) {
                                <div>
                                    {{ tag.name }}
                                </div>
                            }
                        </div>
                    </div>
                </div>
            }
            </div>
        }       
    </div>
  `,
})
export class HomePage {
    linksResource = inject(LinkService).linksResource;
}
