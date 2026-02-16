import { useEffect } from "react";

const ADSENSE_CLIENT = (process.env.REACT_APP_GOOGLE_ADSENSE_CLIENT ?? '').trim();
const ADSENSE_SLOT = (process.env.REACT_APP_GOOGLE_ADSENSE_SLOT ?? '').trim();
const ADSENSE_ENABLED = Boolean(ADSENSE_CLIENT && ADSENSE_SLOT);

export default function AdSidebar() {
  useEffect(() => {
    if (!ADSENSE_ENABLED) {
      return;
    }

    try {
      (window as any).adsbygoogle = (window as any).adsbygoogle || [];
      (window as any).adsbygoogle.push({});
    } catch (e) {
      // Intentionally ignored for environments without Adsense bootstrap.
    }
  }, []);

  if (!ADSENSE_ENABLED) {
    return <div className="w-40 min-h-[600px]" aria-hidden="true" />;
  }

  return (
    <div className="w-40 min-h-[600px]">
      <ins className="adsbygoogle block"
        data-ad-client={ADSENSE_CLIENT}
        data-ad-slot={ADSENSE_SLOT}
        data-ad-format="auto"
        data-full-width-responsive="true" />
    </div>
  );
}
