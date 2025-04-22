# リフォトル - リフォームシミュレーションアプリ

## 概要

リフォトルは、お客様が自分の部屋の写真をアップロードし、リフォーム後のイメージをシミュレーションできるWebアプリケーションです。壁・床・ドアなどの変更したい部分を選択し、好みの素材を適用して簡単にリフォーム後の画像を作成することができます。

## 主な機能

1. 部屋写真のアップロード
2. カテゴリー（壁・床・ドア）と範囲の選択
3. 素材の選択
4. Before/After画像の表示
5. 画像の保存・共有

## 技術スタック

- Next.js 14
- TypeScript
- TailwindCSS
- Radix UI

## 開発環境のセットアップ

```bash
# リポジトリのクローン
git clone https://github.com/yourusername/refotoru-app.git
cd refotoru-app

# 依存関係のインストール
npm install

# 開発サーバーの起動
npm run dev
```

開発サーバーは http://localhost:3000 で実行されます。

## ビルドと実行

```bash
# プロダクションビルドの作成
npm run build

# ビルドの実行
npm run start
```

## ディレクトリ構造

```
refotoru-app/
  ├── public/
  │   └── images/        # アプリで使用される画像ファイル
  ├── src/
  │   ├── app/           # Next.js 14のApp Router構造
  │   │   ├── page.tsx   # トップページ
  │   │   ├── 1-upload/  # アップロードページ
  │   │   ├── 2-category/ # カテゴリー選択ページ
  │   │   ├── 3-materials/ # 素材選択ページ
  │   │   └── 4-preview/ # プレビューページ
  │   ├── components/    # UIコンポーネント
  │   └── lib/           # ユーティリティ関数とコンテキスト
  └── ...
```

## ライセンス

このプロジェクトはMITライセンスの下で公開されています。詳細はLICENSEファイルを参照してください。