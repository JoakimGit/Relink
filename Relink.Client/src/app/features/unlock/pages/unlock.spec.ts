import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { vi } from 'vitest';
import { of, throwError } from 'rxjs';
import { UnlockPage } from './unlock';
import { LinkService } from '../../links/services/link-service';

describe('UnlockPage', () => {
    let fixture: ComponentFixture<UnlockPage>;
    let nativeElement: HTMLElement;
    let mockUnlockLink: ReturnType<typeof vi.fn>;

    function createMockActivatedRoute(shortcode: string) {
        return {
            snapshot: {
                paramMap: {
                    get: (key: string) => (key === 'shortcode' ? shortcode : null),
                },
            },
        };
    }

    function setUp(shortcode = 'pwlock1') {
        mockUnlockLink = vi.fn().mockReturnValue(
            of({ longUrl: 'https://example.com/target' })
        );

        TestBed.configureTestingModule({
            imports: [UnlockPage],
            providers: [
                { provide: ActivatedRoute, useValue: createMockActivatedRoute(shortcode) },
                { provide: LinkService, useValue: { unlockLink: mockUnlockLink } },
            ],
        });

        fixture = TestBed.createComponent(UnlockPage);
        nativeElement = fixture.nativeElement;
        fixture.detectChanges();
    }

    describe('initial render', () => {
        beforeEach(() => {
            setUp();
        });

        it('shows password-protected message', () => {
            const message = nativeElement.querySelector('[data-testid="protected-message"]');
            expect(message).toBeTruthy();
            expect(message!.textContent).toContain('password-protected');
        });

        it('renders password form with input and submit button', () => {
            const input = nativeElement.querySelector('[data-testid="password-input"]') as HTMLInputElement;
            const button = nativeElement.querySelector('[data-testid="submit-button"]') as HTMLButtonElement;

            expect(input).toBeTruthy();
            expect(button).toBeTruthy();
            expect(button!.textContent?.toLowerCase()).toContain('unlock');
        });

        it('has no app navigation or chrome', () => {
            expect(nativeElement.querySelector('header')).toBeNull();
            expect(nativeElement.querySelector('nav')).toBeNull();
            expect(nativeElement.querySelector('app-link-form-modal')).toBeNull();
        });
    });

    describe('password submission', () => {
        it('calls unlock API with shortcode and password', () => {
            setUp();

            fixture.componentInstance.password.set('secret123');
            fixture.detectChanges();
            fixture.componentInstance.onSubmit();

            expect(mockUnlockLink).toHaveBeenCalledWith('pwlock1', 'secret123');
        });

        it('redirects to long URL on success', () => {
            setUp();

            fixture.componentInstance.password.set('correct');
            fixture.detectChanges();
            fixture.componentInstance.onSubmit();

            expect(mockUnlockLink).toHaveBeenCalledWith('pwlock1', 'correct');
        });

        it('shows error message on incorrect password', () => {
            mockUnlockLink = vi.fn().mockReturnValue(
                throwError(() => ({ status: 403 }))
            );

            TestBed.resetTestingModule();
            TestBed.configureTestingModule({
                imports: [UnlockPage],
                providers: [
                    { provide: ActivatedRoute, useValue: createMockActivatedRoute('pwlock1') },
                    { provide: LinkService, useValue: { unlockLink: mockUnlockLink } },
                ],
            });

            fixture = TestBed.createComponent(UnlockPage);
            nativeElement = fixture.nativeElement;
            fixture.detectChanges();

            fixture.componentInstance.password.set('wrong');
            fixture.detectChanges();
            fixture.componentInstance.onSubmit();
            fixture.detectChanges();

            const error = nativeElement.querySelector('[data-testid="error-message"]');
            expect(error).toBeTruthy();
            expect(error!.textContent).toContain('Incorrect');
        });
    });
});
