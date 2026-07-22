import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { LoginComponent } from './login.component';
import { AuthService, SessionState } from '../../../core/services/auth.service';

describe('LoginComponent profile-aware navigation', () => {
  let fixture: ComponentFixture<LoginComponent>;
  let component: LoginComponent;
  let resolveLogin: (state: SessionState) => void;
  const router = {
    navigateByUrl: jasmine.createSpy('navigateByUrl').and.resolveTo(true),
    navigate: jasmine.createSpy('navigate').and.resolveTo(true),
  };
  const auth = { login: jasmine.createSpy('login') };

  beforeEach(async () => {
    auth.login.and.callFake(() => new Promise<SessionState>((resolve) => (resolveLogin = resolve)));
    await TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [
        provideZonelessChangeDetection(),
        { provide: AuthService, useValue: auth },
        { provide: Router, useValue: router },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    component.form.setValue({ email: 'owner@dev.test', password: 'secret1' });
    router.navigateByUrl.calls.reset();
    router.navigate.calls.reset();
  });

  it('waits for the profile result and navigates once when it is authenticated', async () => {
    const pending = component.submit();
    expect(component.loading()).toBeTrue();
    expect(router.navigateByUrl).not.toHaveBeenCalled();

    resolveLogin(authenticated());
    await pending;

    expect(router.navigateByUrl).toHaveBeenCalledTimes(1);
    expect(router.navigateByUrl).toHaveBeenCalledWith('/dashboard', { replaceUrl: true });
    expect(component.loading()).toBeFalse();
  });

  it('does not enter the dashboard when the profile is missing or inactive', async () => {
    let pending = component.submit();
    resolveLogin({ status: 'missing-profile', user: {} as never, profile: null });
    await pending;
    expect(router.navigate).toHaveBeenCalledWith(['/auth/access'], {
      replaceUrl: true,
      queryParams: { reason: 'missing-profile' },
    });

    router.navigateByUrl.calls.reset();
    router.navigate.calls.reset();
    pending = component.submit();
    resolveLogin({ status: 'inactive', user: {} as never, profile: { ...authenticated().profile!, active: false } });
    await pending;
    expect(router.navigate).toHaveBeenCalledWith(['/auth/access'], {
      replaceUrl: true,
      queryParams: { reason: 'inactive' },
    });
    expect(component.loading()).toBeFalse();
  });
});

function authenticated(): SessionState {
  return {
    status: 'authenticated',
    user: {} as never,
    profile: { uid: 'uid', email: 'owner@dev.test', displayName: 'Owner', role: 'owner', active: true },
  };
}
