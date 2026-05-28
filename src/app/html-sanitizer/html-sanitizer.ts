import { Component, signal, computed, inject, OnInit, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import DOMPurify, { Config as DOMPurifyConfig } from 'dompurify';

const ALLOWED_CSS_PROPERTIES = [
  'color',
  'font',
  'font-family',
  'font-size',
  'font-style',
  'font-weight',
  'font-variant',
  'line-height',
  'letter-spacing',
  'word-spacing',
  'text-align',
  'text-decoration',
  'text-decoration-line',
  'text-decoration-style',
  'text-decoration-color',
  'text-decoration-thickness',
  'text-indent',
  'text-transform',
  'white-space',
  'vertical-align',
  'direction',
  'margin',
  'margin-top',
  'margin-right',
  'margin-bottom',
  'margin-left',
  'padding',
  'padding-top',
  'padding-right',
  'padding-bottom',
  'padding-left',
  'border',
  'border-top',
  'border-right',
  'border-bottom',
  'border-left',
  'border-color',
  'border-style',
  'border-width',
  'border-radius',
  'width',
  'height',
  'min-width',
  'min-height',
  'max-width',
  'max-height',
  'background',
  'background-color',
  'background-image',
  'background-position',
  'background-repeat',
  'background-size',
  'list-style',
  'list-style-type',
  'list-style-position',
  'list-style-image',
  'display',
  'float',
  'clear',
  'opacity',
  'overflow',
];

const PURIFY_CONFIG: DOMPurifyConfig = {
  FORBID_TAGS: ['svg'],
  USE_PROFILES: { html: true },
};

function validateStyles(output: string[], styles: CSSStyleDeclaration): void {
  Object.keys(styles).forEach((index) => {
    const camelKey = (styles as unknown as Record<string, string>)[index];
    const kebabKey = camelKey.replace(/([A-Z])/g, '-$1').toLowerCase();
    if (ALLOWED_CSS_PROPERTIES.includes(kebabKey)) {
      const value = styles.getPropertyValue(kebabKey);
      if (value) {
        output.push(`${kebabKey}:${value};`);
      }
    }
  });
}

function addCSSRules(output: string[], cssRules: CSSRuleList): void {
  Array.from(cssRules)
    .reverse()
    .forEach((rule) => {
      if (rule.type === CSSRule.STYLE_RULE) {
        const styleRule = rule as CSSStyleRule;
        output.push(`${styleRule.selectorText}{`);
        validateStyles(output, styleRule.style);
        output.push('}');
      }
    });
}

@Component({
  selector: 'app-html-sanitizer',
  imports: [FormsModule],
  templateUrl: './html-sanitizer.html',
  styleUrl: './html-sanitizer.scss',
})
export class HtmlSanitizer implements OnInit, OnDestroy {
  private domSanitizer = inject(DomSanitizer);

  rawHtml = signal('');

  sanitizedHtml = computed<SafeHtml>(() => {
    const clean = DOMPurify.sanitize(this.rawHtml(), PURIFY_CONFIG) as string;
    return this.domSanitizer.bypassSecurityTrustHtml(clean);
  });

  sanitizedSource = computed(() => DOMPurify.sanitize(this.rawHtml(), PURIFY_CONFIG));

  ngOnInit(): void {
    DOMPurify.addHook('uponSanitizeElement', (node, data) => {
      if (data.tagName === 'style') {
        const styleNode = node as HTMLStyleElement;
        if (styleNode.sheet?.cssRules) {
          const output: string[] = [];
          addCSSRules(output, styleNode.sheet.cssRules);
          styleNode.textContent = output.join('\n');
        }
      }
    });

    DOMPurify.addHook('afterSanitizeAttributes', (node) => {
      // Fix baseURI + CSS problems in Chrome
      if (!node.ownerDocument.baseURI) {
        const base = document.createElement('base');
        base.href = document.baseURI;
        node.ownerDocument.head.appendChild(base);
      }

      if (node.hasAttribute('style')) {
        const output: string[] = [];
        validateStyles(output, (node as HTMLElement).style);
        if (output.length) {
          node.setAttribute('style', output.join(''));
        } else {
          node.removeAttribute('style');
        }
      }
    });
  }

  ngOnDestroy(): void {
    DOMPurify.removeAllHooks();
  }
}
