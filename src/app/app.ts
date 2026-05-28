import { Component } from '@angular/core';
import { HtmlSanitizer } from './html-sanitizer/html-sanitizer';

@Component({
  selector: 'app-root',
  imports: [HtmlSanitizer],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {}
