import { Component } from '@angular/core';
import { MatInput } from '@angular/material/input';
import { MatFormField } from '@angular/material/input';
import { NgxCurrencyDirective} from 'ngx-currency';

@Component({
  selector: 'app-currency-input',
  imports: [NgxCurrencyDirective, MatInput, MatFormField],
  templateUrl: './currency-input.html',
  styleUrl: './currency-input.scss'
})
export class CurrencyInput {

}
