export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6 px-6 py-10">
      <h1 className="text-2xl font-semibold">利用規約</h1>
      <div className="space-y-3 text-sm">
        <section className="space-y-2">
          <h2 className="text-base font-medium">適用</h2>
          <p>
            本規約は、本サービスの利用条件を定めるものです。利用者は本規約に同意の上でご利用ください。
          </p>
        </section>
        <section className="space-y-2">
          <h2 className="text-base font-medium">禁止事項</h2>
          <ul className="list-disc space-y-1 pl-5">
            <li>法令または公序良俗に反する行為</li>
            <li>不正アクセスやサービスの運営を妨げる行為</li>
          </ul>
        </section>
        <section className="space-y-2">
          <h2 className="text-base font-medium">免責</h2>
          <p>
            当サービスの利用により生じた損害について、当方は一切の責任を負いません。
          </p>
        </section>
        <section className="space-y-2">
          <h2 className="text-base font-medium">変更</h2>
          <p>本規約は必要に応じて変更される場合があります。</p>
        </section>
      </div>
    </div>
  );
}
