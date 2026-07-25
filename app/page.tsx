import Link from "next/link";

export default function HomePage() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-6 px-4 py-20 text-center">
      <h1 className="text-hero font-bold">押金侠 BondBack</h1>
      <p className="text-muted">
        澳洲租客的押金维权助手：三步整理证据、评估胜算、生成英文维权信。
      </p>
      <div className="flex w-full flex-col gap-3">
        <Link
          href="/wizard"
          className="rounded-lg bg-ink px-6 py-3 font-medium text-white"
        >
          开始我的评估
        </Link>
        <Link
          href="/sample"
          className="rounded-lg border border-line px-6 py-3 font-medium"
        >
          先看一个示例
        </Link>
      </div>
      <p className="text-caption text-muted">目前支持 NSW / VIC</p>
    </div>
  );
}
