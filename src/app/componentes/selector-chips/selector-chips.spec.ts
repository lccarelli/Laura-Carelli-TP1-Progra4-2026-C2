import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SelectorChips } from './selector-chips';

describe('SelectorChips', () => {
  let component: SelectorChips;
  let fixture: ComponentFixture<SelectorChips>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SelectorChips],
    }).compileComponents();

    fixture = TestBed.createComponent(SelectorChips);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
