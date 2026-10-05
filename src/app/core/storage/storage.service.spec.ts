import { TestBed } from '@angular/core/testing';
import { StorageService } from './storage.service';

describe('StorageService', () => {
  let service: StorageService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
    service = TestBed.inject(StorageService);
  });

  afterEach(() => localStorage.clear());

  it('should return the fallback when the key is empty', () => {
    expect(service.read('ss:missing', [])).toEqual([]);
  });

  it('should round-trip a value', () => {
    service.write('ss:items', [1, 2, 3]);
    expect(service.read('ss:items', [])).toEqual([1, 2, 3]);
  });

  it('should discard malformed JSON instead of throwing', () => {
    localStorage.setItem('ss:broken', '{not json');

    expect(service.read('ss:broken', [])).toEqual([]);
    expect(localStorage.getItem('ss:broken')).toBeNull();
  });

  it('should discard values that fail validation', () => {
    localStorage.setItem('ss:typed', JSON.stringify({ not: 'an array' }));
    const isArray = (value: unknown): value is string[] => Array.isArray(value);

    expect(service.read('ss:typed', [], isArray)).toEqual([]);
    expect(localStorage.getItem('ss:typed')).toBeNull();
  });

  it('should keep values that pass validation', () => {
    localStorage.setItem('ss:typed', JSON.stringify(['a']));
    const isArray = (value: unknown): value is string[] => Array.isArray(value);

    expect(service.read('ss:typed', [], isArray)).toEqual(['a']);
  });

  it('should remove a key', () => {
    service.write('ss:gone', true);
    service.remove('ss:gone');

    expect(service.read('ss:gone', false)).toBe(false);
  });
});
