import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Shell } from './shell';
import { Footer } from '../footer/footer';
import { Header } from '../header/header';
import { Sidebar } from '../sidebar/sidebar';

describe('Shell', () => {
  let fixture: ComponentFixture<Shell>;

  beforeEach(async () => {
    localStorage.clear();

    await TestBed.configureTestingModule({
      imports: [Shell],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(Shell);
    fixture.detectChanges();
  });

  it('should create the shell', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render the header, sidebar and footer', () => {
    const element = fixture.nativeElement as HTMLElement;

    expect(element.querySelector('app-header')).toBeTruthy();
    expect(element.querySelector('app-sidebar')).toBeTruthy();
    expect(element.querySelector('app-footer')).toBeTruthy();
    expect(element.querySelector('router-outlet')).toBeTruthy();
  });

  it('should compose the three chrome components', () => {
    expect(TestBed.createComponent(Shell).debugElement.children.length).toBeGreaterThan(0);
    expect(Header).toBeDefined();
    expect(Sidebar).toBeDefined();
    expect(Footer).toBeDefined();
  });

  it('should keep the mobile menu closed by default', () => {
    expect(fixture.componentInstance['menuOpen']()).toBe(false);
    expect(fixture.nativeElement.querySelector('app-sidebar').classList).not.toContain(
      'sidebar-open',
    );
  });

  it('should open and close the mobile menu', () => {
    const shell = fixture.componentInstance;

    shell['toggleMenu']();
    fixture.detectChanges();

    expect(shell['menuOpen']()).toBe(true);
    expect(fixture.nativeElement.querySelector('app-sidebar').classList).toContain('sidebar-open');
    expect(fixture.nativeElement.querySelector('.scrim')).toBeTruthy();

    shell['closeMenu']();
    fixture.detectChanges();

    expect(shell['menuOpen']()).toBe(false);
    expect(fixture.nativeElement.querySelector('.scrim')).toBeNull();
  });
});
