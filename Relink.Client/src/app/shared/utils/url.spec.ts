import { describe, it, expect } from 'vitest';
import { domainOf, faviconUrlFor } from './url';

describe('domainOf', () => {
    it('extracts the hostname from a full URL', () => {
        expect(domainOf('https://example.com/very/long/path')).toBe('example.com');
    });

    it('extracts the hostname including a port when present', () => {
        expect(domainOf('http://localhost:4200/page')).toBe('localhost');
    });

    it('returns an empty string for invalid input', () => {
        expect(domainOf('not a url')).toBe('');
    });
});

describe('faviconUrlFor', () => {
    it('builds a favicon URL for a domain', () => {
        expect(faviconUrlFor('example.com')).toBe(
            'https://www.google.com/s2/favicons?domain=example.com&sz=32',
        );
    });

    it('returns null for an empty domain', () => {
        expect(faviconUrlFor('')).toBeNull();
    });
});
