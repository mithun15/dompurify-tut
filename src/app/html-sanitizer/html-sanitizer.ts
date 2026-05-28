import { Component, signal, computed, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import DOMPurify from 'dompurify';

@Component({
  selector: 'app-html-sanitizer',
  imports: [FormsModule],
  templateUrl: './html-sanitizer.html',
  styleUrl: './html-sanitizer.scss',
})
export class HtmlSanitizer {
  private domSanitizer = inject(DomSanitizer);

  rawHtml = signal('');

  sanitizedHtml = computed<SafeHtml>(() => {
    const clean = DOMPurify.sanitize(this.rawHtml(), {
      USE_PROFILES: { html: true },
    });
    return this.domSanitizer.bypassSecurityTrustHtml(clean);
  });

  sanitizedSource = computed(() =>
    DOMPurify.sanitize(this.rawHtml(), { USE_PROFILES: { html: true } })
  );
}
