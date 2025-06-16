import { useEffect } from "react";

export default function AdSidebar() {
  useEffect(() => {
    try {
      (window as any).adsbygoogle = (window as any).adsbygoogle || [];
      (window as any).adsbygoogle.push({});
    } catch (e) {
      console.error("Adsense load error", e);
    }
  }, []);

  return (
    <div style={{ width: 160, minHeight: 600 }}>
      <ins className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client="ca-pub-3647004630291518"
        data-ad-slot="0000000000"  // ✳️ 여기에 실제 광고 슬롯 ID를 넣어야 광고가 뜸
        data-ad-format="auto"
        data-full-width-responsive="true" />
    </div>
  );
}
