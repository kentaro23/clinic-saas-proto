export default function PrivacyPolicyPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6 px-6 py-10">
      <h1 className="text-2xl font-semibold">プライバシーポリシー</h1>
      <p className="text-sm text-muted-foreground">
        本サービスは、予約・問診・リマインド配信の提供に必要な範囲で個人情報を取得・利用します。
      </p>
      <div className="space-y-3 text-sm">
        <section className="space-y-2">
          <h2 className="text-base font-medium">取得する情報</h2>
          <ul className="list-disc space-y-1 pl-5">
            <li>氏名、電話番号、来院目的、診察券番号（任意）</li>
            <li>予約日時、問診内容</li>
            <li>LINE連携時のユーザー識別子（LINEユーザーID）</li>
          </ul>
        </section>
        <section className="space-y-2">
          <h2 className="text-base font-medium">利用目的</h2>
          <ul className="list-disc space-y-1 pl-5">
            <li>予約受付、問診、来院案内、リマインド通知の提供</li>
            <li>お問い合わせ対応、サービス改善のための分析</li>
          </ul>
        </section>
        <section className="space-y-2">
          <h2 className="text-base font-medium">第三者提供</h2>
          <p>
            法令に基づく場合を除き、本人の同意なく第三者へ提供しません。
          </p>
        </section>
        <section className="space-y-2">
          <h2 className="text-base font-medium">お問い合わせ</h2>
          <p>お問い合わせは管理者までご連絡ください。</p>
        </section>
      </div>
    </div>
  );
}
