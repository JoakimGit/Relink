import { Routes } from '@angular/router';
import { HomePage } from './features/links/pages/home';
import { UnlockPage } from './features/unlock/pages/unlock';

export const routes: Routes = [
    {
        path: '',
        component: HomePage,
    },
    {
        path: 'unlock/:shortcode',
        component: UnlockPage,
    },
];
