import { Component, signal, computed, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SafeHtml } from '@angular/platform-browser';
import { SanitizationService } from '../services/sanitization.service';

@Component({
  selector: 'app-html-sanitizer',
  imports: [FormsModule],
  templateUrl: './html-sanitizer.html',
  styleUrl: './html-sanitizer.scss',
})
export class HtmlSanitizer {
  private sanitizationService = inject(SanitizationService);

  rawHtml = signal('');

  sanitizedHtml = computed<SafeHtml>(() =>
    this.sanitizationService.sanitizeTrusted(this.rawHtml()),
  );

  sanitizedSource = computed(() =>
    this.sanitizationService.sanitize(this.rawHtml()),
  );
}
