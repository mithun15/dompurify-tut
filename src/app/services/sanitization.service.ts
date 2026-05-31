import { inject, Injectable } from '@angular/core';
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

@Injectable({ providedIn: 'root' })
export class SanitizationService {
  private domSanitizer = inject(DomSanitizer);

  constructor() {
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

  sanitize(html: string): string {
    return DOMPurify.sanitize(html, PURIFY_CONFIG) as string;
  }

  sanitizeTrusted(html: string): SafeHtml {
    return this.domSanitizer.bypassSecurityTrustHtml(this.sanitize(html));
  }
}
