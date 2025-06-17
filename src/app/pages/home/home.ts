import { Component } from '@angular/core';
import { CurrencyInput } from '../../components/currency-input/currency-input';
import { MatButtonToggleModule } from '@angular/material/button-toggle';

@Component({
  selector: 'app-home',
  imports: [CurrencyInput, MatButtonToggleModule],
  templateUrl: './home.html',
  styleUrl: './home.scss'
})
export class Home {

}
