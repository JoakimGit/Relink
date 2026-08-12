import { httpResource } from '@angular/common/http';
import { Service, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import type { Group } from '../types/link';

const API_URL = 'https://localhost:7445/api';

@Service()
export class GroupService {
    private readonly http = inject(HttpClient);

    readonly groupsResource = httpResource<Array<Group>>(() => `${API_URL}/groups`);

    createGroup(name: string) {
        return this.http.post<Group>(`${API_URL}/groups`, { name });
    }

    renameGroup(id: number, name: string) {
        return this.http.put<Group>(`${API_URL}/groups/${id}`, { name });
    }

    deleteGroup(id: number) {
        return this.http.delete<void>(`${API_URL}/groups/${id}`);
    }
}
