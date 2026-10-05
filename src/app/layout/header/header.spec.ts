import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { formatLongDate, parseIsoDate, todayIso } from '../../core/utils/date';
import { Header } from './header';

describe('Header', () => {
  let fixture: ComponentFixture<Header>;

  beforeEach(async () => {
    localStorage.clear();

    await TestBed.configureTestingModule({
      imports: [Header],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(Header);
    fixture.detectChanges();
  });

  afterEach(() => localStorage.clear());

  function dateText(): string {
    return fixture.nativeElement.querySelector('.header-date').textContent?.trim() ?? '';
  }

  it("should render today's date as text, not as an uninvoked signal", () => {
    expect(dateText()).toBe(formatLongDate(parseIsoDate(todayIso())));
    expect(dateText()).not.toContain('=>');
  });

  it('should recompute the date from the clock instead of freezing it at build time', () => {
    expect(fixture.componentInstance['todayLabel']()).toBe(
      formatLongDate(parseIsoDate(todayIso())),
    );
  });

  it('should render the brand and the theme toggle', () => {
    const element = fixture.nativeElement as HTMLElement;

    expect(element.querySelector('.brand-name')?.textContent?.trim()).toBe('StudySpark');
    expect(element.querySelector('.menu-toggle')).toBeTruthy();
    expect(element.querySelectorAll('.header-actions .icon-button')).toHaveLength(2);
  });

  it('should emit menuToggle when the menu button is pressed', () => {
    let emitted = 0;
    fixture.componentInstance['menuToggle'].subscribe(() => (emitted += 1));

    (fixture.nativeElement.querySelector('.menu-toggle') as HTMLButtonElement).click();

    expect(emitted).toBe(1);
  });

  it('should show no notification badge while there is nothing pending', () => {
    expect(fixture.nativeElement.querySelector('.icon-badge')).toBeNull();
  });

  it('should flip the theme when the toggle is pressed', () => {
    const button = fixture.nativeElement.querySelectorAll('.header-actions .icon-button')[1];
    const before = fixture.componentInstance['isDark']();

    (button as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(fixture.componentInstance['isDark']()).toBe(!before);
  });
});
