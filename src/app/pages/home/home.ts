import { Component } from '@angular/core';
import { CurrencyInput } from '../../components/currency-input/currency-input';

@Component({
  selector: 'app-home',
  imports: [CurrencyInput],
  templateUrl: './home.html',
  styleUrl: './home.scss'
})
export class Home {

}
