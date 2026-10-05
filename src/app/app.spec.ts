import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { App } from './app';
import { routes } from './app.routes';

describe('App', () => {
  let fixture: ComponentFixture<App>;
  let router: Router;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideRouter(routes)],
    }).compileComponents();

    router = TestBed.inject(Router);
    fixture = TestBed.createComponent(App);
  });

  it('should create the app', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should redirect the empty path to the tasks view', async () => {
    await router.navigateByUrl('/');
    expect(router.url).toBe('/tareas');
  });

  it('should redirect unknown paths to the tasks view', async () => {
    await router.navigateByUrl('/no-existe');
    expect(router.url).toBe('/tareas');
  });

  it.each(['/tareas', '/apuntes', '/calendario', '/notificaciones', '/ajustes'])(
    'should resolve the %s view',
    async (path) => {
      fixture.detectChanges();
      await router.navigateByUrl(path);
      await fixture.whenStable();

      expect(router.url).toBe(path);
    },
  );
});
