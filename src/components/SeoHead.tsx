import { useEffect } from 'react';

interface SeoHeadProps {
  title: string;
  description: string;
  canonicalPath: string;
  noIndex?: boolean;
  ogType?: 'website' | 'product' | 'article';
  gscVerificationCode?: string;
  jsonLd?: Record<string, any> | Array<Record<string, any>>;
}

export function SeoHead({
  title,
  description,
  canonicalPath,
  noIndex = false,
  ogType = 'website',
  gscVerificationCode,
  jsonLd,
}: SeoHeadProps) {
  useEffect(() => {
    const fullTitle = title.includes('DXN Organic Point')
      ? title
      : `${title} — DXN Organic Point`;
    document.title = fullTitle;

    const setMeta = (selector: string, attrName: string, attrVal: string, content: string) => {
      let el = document.head.querySelector(selector) as HTMLMetaElement | null;
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute(attrName, attrVal);
        document.head.appendChild(el);
      }
      el.setAttribute('content', content);
    };

    setMeta('meta[name="description"]', 'name', 'description', description);
    setMeta('meta[property="og:title"]', 'property', 'og:title', fullTitle);
    setMeta('meta[property="og:description"]', 'property', 'og:description', description);
    setMeta('meta[property="og:type"]', 'property', 'og:type', ogType);
    setMeta('meta[name="twitter:title"]', 'name', 'twitter:title', fullTitle);
    setMeta('meta[name="twitter:description"]', 'name', 'twitter:description', description);
    setMeta(
      'meta[name="robots"]',
      'name',
      'robots',
      noIndex ? 'noindex, nofollow' : 'index, follow'
    );

    const origin = window.location.origin;
    const cleanPath = canonicalPath.startsWith('/') ? canonicalPath : `/${canonicalPath}`;
    const canonicalUrl = `${origin}${cleanPath === '/' ? '' : cleanPath}`;

    setMeta('meta[property="og:url"]', 'property', 'og:url', canonicalUrl);

    let linkCanonical = document.head.querySelector(
      'link[rel="canonical"]'
    ) as HTMLLinkElement | null;
    if (!linkCanonical) {
      linkCanonical = document.createElement('link');
      linkCanonical.setAttribute('rel', 'canonical');
      document.head.appendChild(linkCanonical);
    }
    linkCanonical.setAttribute('href', canonicalUrl);

    if (gscVerificationCode) {
      const cleanCode = gscVerificationCode.replace('google-site-verification=', '').trim();
      setMeta(
        'meta[name="google-site-verification"]',
        'name',
        'google-site-verification',
        cleanCode
      );
    }

    let scriptJsonLd = document.head.querySelector(
      'script#dxn-dynamic-jsonld'
    ) as HTMLScriptElement | null;
    if (jsonLd) {
      if (!scriptJsonLd) {
        scriptJsonLd = document.createElement('script');
        scriptJsonLd.id = 'dxn-dynamic-jsonld';
        scriptJsonLd.type = 'application/ld+json';
        document.head.appendChild(scriptJsonLd);
      }
      scriptJsonLd.textContent = JSON.stringify(jsonLd);
    } else if (scriptJsonLd) {
      scriptJsonLd.remove();
    }
  }, [title, description, canonicalPath, noIndex, ogType, gscVerificationCode, jsonLd]);

  return null;
}
