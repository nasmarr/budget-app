import { Component } from '@angular/core';
import { CurrencyInput } from '../../components/currency-input/currency-input';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { provideNativeDateAdapter } from '@angular/material/core';


@Component({
  selector: 'app-home',
  providers: [provideNativeDateAdapter()],
  imports: [
    CurrencyInput,
    MatButtonToggleModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
  ],
  templateUrl: './home.html',
  styleUrl: './home.scss'
})

export class Home {

}
