import path from "path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 工作区上层存在其他 lockfile，显式指定 root 消除 Turbopack 根目录推断警告
  turbopack: { root: path.join(__dirname) },
};

export default nextConfig;
