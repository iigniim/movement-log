import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 172.30.1.0/24 대역 전체 허용 - 개별 기기 IP가 DHCP로 바뀌어도 다시 설정할 필요 없음
  allowedDevOrigins: ["172.30.1.*"],
};

export default nextConfig;
