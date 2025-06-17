import { Component } from '@angular/core';
import { NgxCurrencyDirective} from 'ngx-currency';

@Component({
  selector: 'app-currency-input',
  imports: [NgxCurrencyDirective],
  templateUrl: './currency-input.html',
  styleUrl: './currency-input.scss'
})
export class CurrencyInput {

}
