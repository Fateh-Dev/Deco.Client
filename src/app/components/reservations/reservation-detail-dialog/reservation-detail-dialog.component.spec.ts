import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReservationDetailDialogComponent } from './reservation-detail-dialog.component';

describe('ReservationDetailDialogComponent', () => {
  let component: ReservationDetailDialogComponent;
  let fixture: ComponentFixture<ReservationDetailDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReservationDetailDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ReservationDetailDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
