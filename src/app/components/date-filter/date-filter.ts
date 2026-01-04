import { Component, Output, EventEmitter } from '@angular/core';
import { FormGroup, FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { provideNativeDateAdapter } from '@angular/material/core';

export type FilterPeriod = 'all' | 'month' | 'year' | 'custom';

export interface DateFilterValue {
  period: FilterPeriod;
  startDate?: Date;
  endDate?: Date;
}

@Component({
  selector: 'app-date-filter',
  providers: [provideNativeDateAdapter()],
  imports: [
    ReactiveFormsModule,
    MatChipsModule,
    MatFormFieldModule,
    MatDatepickerModule,
    MatInputModule,
    MatButtonModule
  ],
  templateUrl: './date-filter.html',
  styleUrl: './date-filter.scss',
})
export class DateFilter {
  @Output() filterChange = new EventEmitter<DateFilterValue>();

  selectedFilter: FilterPeriod = 'month';
  showDatePicker = false;

  dateRangeForm = new FormGroup({
    start: new FormControl<Date | null>(null),
    end: new FormControl<Date | null>(null)
  });

  setFilter(filter: FilterPeriod): void {
    this.selectedFilter = filter;
    this.showDatePicker = filter === 'custom';

    if (filter !== 'custom') {
      this.dateRangeForm.reset();
      this.emitFilter();
    }
  }

  applyCustomRange(): void {
    const start = this.dateRangeForm.get('start')?.value;
    const end = this.dateRangeForm.get('end')?.value;

    if (start && end) {
      this.emitFilter();
    }
  }

  private emitFilter(): void {
    const value: DateFilterValue = {
      period: this.selectedFilter
    };

    if (this.selectedFilter === 'custom') {
      const start = this.dateRangeForm.get('start')?.value;
      const end = this.dateRangeForm.get('end')?.value;

      if (start && end) {
        value.startDate = start;
        value.endDate = end;
      }
    }

    this.filterChange.emit(value);
  }
}
