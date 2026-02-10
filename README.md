# Clinic SaaS Demo Prototype

LINE事前問診＋予約＋リマインドの「最速デモ用プロトタイプ」です。ローカルで動作し、患者側の予約→問診→管理確認→リマインド送信ログまで一通り体験できます。

## 技術スタック
- Next.js 14 (App Router) + TypeScript
- TailwindCSS + shadcn/ui (簡易実装)
- Prisma + SQLite
- zod

## セットアップ
```bash
pnpm install
pnpm prisma:generate
pnpm prisma:migrate -- --name init
pnpm prisma db seed
```

## 起動
```bash
pnpm dev
```

## デモ手順
1. 患者側: `http://localhost:3000/p/booking` で予約作成 → 問診入力
2. 管理側: `http://localhost:3000/admin/login` でログイン
   - ID: `admin`
   - PW: `demo123`
3. 管理画面で当日一覧・詳細・送信ログ・枠設定を確認
4. 管理画面の「今すぐリマインド送信」ボタンで送信ログが追加される

## LINE webhook モック
`/api/line/webhook` にサンプル payload をPOSTすると、MessageLog(type=confirm) を作成し、問診リンクを返します。

```bash
curl -X POST http://localhost:3000/api/line/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "reservationId": "RESERVATION_ID_HERE",
    "userId": "U123456",
    "message": "予約確認したいです"
  }'
```

レスポンス例:
```json
{
  "ok": true,
  "intakeUrl": "/p/intake/RESERVATION_ID_HERE"
}
```

## 公開API一覧
### Public
- `GET /api/public/slots?date=YYYY-MM-DD`
- `POST /api/public/reservations`
- `GET /api/public/reservations/[id]`
- `POST /api/public/intake`

### Admin
- `GET /api/admin/reservations?date=YYYY-MM-DD`
- `GET /api/admin/reservations/[id]`
- `POST /api/admin/reservations/[id]/cancel`
- `POST /api/admin/messages/send-reminder`
- `GET /api/admin/messages`
- `GET /api/admin/slot-rules`
- `POST /api/admin/slot-rules`
- `PUT /api/admin/slot-rules/[id]`
- `DELETE /api/admin/slot-rules/[id]`

## データモデル
- Clinic
- SlotRule
- Reservation
- IntakeAnswer
- MessageLog

seedで Clinic 1件 + SlotRule数件 + 予約/問診/送信ログのダミーが投入されます。
This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
