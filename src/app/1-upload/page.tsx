'use client';

import { useState, useRef, ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { useImageContext } from '@/lib/image-context'; // パスを修正

export default function UploadPage() {
  const router = useRouter();
  const { setUploadedImage } = useImageContext();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  // ファイルの先頭部分で logoError 状態を追加
  const [logoError, setLogoError] = useState(false);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      const objectUrl = URL.createObjectURL(file);
      setPreviewUrl(objectUrl);
      setUploadedImage(objectUrl);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setSelectedFile(file);
      const objectUrl = URL.createObjectURL(file);
      setPreviewUrl(objectUrl);
      setUploadedImage(objectUrl);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleButtonClick = () => {
    if (fileInputRef.current) fileInputRef.current.click();
  };

  const handleNext = async () => {
    if (!selectedFile) return;
    
    // 画像のアップロード処理を追加
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      
      // FastAPIエンドポイントにアップロード
      const response = await fetch('https://tech0-gen-8-step4-peak-back-gxcchbcwafaxguem.canadacentral-01.azurewebsites.net/upload', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error('画像のアップロードに失敗しました');
      }
      
      const data = await response.json();
      console.log('アップロード成功:', data);
      
      // アップロードされた画像のIDをコンテキストに保存
      // image_idとしてfilenameを使用
      const imageContext = {
        id: data.filename,
        url: data.blob_url
      };
      
      // imageContextを使用してコンテキストを更新
      // 既存のuploadedImageに加えてDBの情報も保存
      setUploadedImage(previewUrl, imageContext);
      
      // 次の画面に進む
      router.push('/2-category');
    } catch (error) {
      console.error('アップロードエラー:', error);
      alert('画像のアップロードに失敗しました。もう一度お試しください。');
    }
  };

  return (
    <div className="min-h-screen bg-[#fff9f0] overflow-auto">
      {/* ヘッダー */}
      <header className="fixed top-0 left-0 right-0 z-50 p-4 flex justify-between items-center bg-white shadow-sm">
        <Link href="/" className="flex items-center">
          <Image 
            src="/images/logo.png" 
            alt="リフォトル" 
            width={40} 
            height={40} 
            className="mr-2"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
          <span className="text-xl font-bold">リフォトル</span>
        </Link>
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="p-2 rounded-full hover:bg-gray-100 focus:outline-none"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="3" y1="12" x2="21" y2="12"></line>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <line x1="3" y1="18" x2="21" y2="18"></line>
          </svg>
        </button>
        {menuOpen && (
          <nav className="absolute top-full left-0 w-full bg-white border-t border-orange-200 shadow-md z-50">
            <ul className="flex flex-col p-6 space-y-4">
              <li>
                <Link href="/1-upload" className="hover:text-[#f87e42] hover:border-[#f87e42] border-b-2 border-transparent font-medium">
                理想のお部屋イメージ画像を作る
                </Link>
                </li>
                <li>
                  <a href="https://x.gd/wlwOK" target="_blank" rel="noopener noreferrer" className="hover:text-[#f87e42] hover:border-[#f87e42] border-b-2 border-transparent font-medium">
                  優良リフォーム会社のご紹介はこちら
                  </a>
                  </li>
                  <li>
                    <a href="https://x.gd/pFA2q" target="_blank" rel="noopener noreferrer" className="hover:text-[#f87e42] hover:border-[#f87e42] border-b-2 border-transparent font-medium">
                    イメージ画像を探す
                    </a>
                    </li>
                    <li>
                      <a href="https://forest.toppan.com/refotoru/about/" target="_blank" rel="noopener noreferrer" className="hover:text-[#f87e42] hover:border-[#f87e42] border-b-2 border-transparent font-medium">
                      リフォトルとは
                      </a>
                      </li>
                      </ul>
          </nav>
        )}
      </header>
      <main className="container mx-auto px-4 py-2 pt-20"></main>


      <div className="container mx-auto px-4 pt-8">
        {/* ステップインジケーター */}
        <div className="step-nav mb-3">
          <div className="step-item">
            <div className="step-circle step-active">1</div>
            <div className="step-label">部屋写真<br/>アップ</div>
          </div>
          <div className="step-line line-inactive"></div>
          <div className="step-item">
            <div className="step-circle step-inactive">2</div>
            <div className="step-label">カテゴリ<br/>範囲選択</div>
          </div>
          <div className="step-line line-inactive"></div>
          <div className="step-item">
            <div className="step-circle step-inactive">3</div>
            <div className="step-label">素材選択</div>
          </div>
          <div className="step-line line-inactive"></div>
          <div className="step-item">
            <div className="step-circle step-inactive">4</div>
            <div className="step-label">作成完了</div>
          </div>
        </div>
        
        {/* 追加の余白 */}
        <div className="h-8"></div>
        
        {/* ドラッグ&ドロップエリア */}
        <div 
          className="max-w-xl mx-auto border-2 border-dashed border-orange-300 rounded-lg p-12 flex flex-col items-center justify-center bg-white cursor-pointer"
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onClick={handleButtonClick}
        >
          {previewUrl ? (
            <div className="relative w-full">
              <img 
                src={previewUrl} 
                alt="アップロードされた画像" 
                className="w-full h-auto rounded-md" 
              />
              <button 
                className="absolute top-2 right-2 bg-white p-1 rounded-full shadow"
                onClick={(e) => {
                  e.stopPropagation();
                  setPreviewUrl(null);
                  setSelectedFile(null);
                  setUploadedImage(null);
                }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
          ) : (
            <>
              <div className="flex flex-col items-center text-center">
                <div className="mb-4 text-gray-400">
                  <svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                    <circle cx="8.5" cy="8.5" r="1.5"></circle>
                    <polyline points="21 15 16 10 5 21"></polyline>
                  </svg>
                </div>
                <p className="text-lg mb-3">ここからアップロード</p>
                <p className="text-sm text-gray-500 mb-4">または下のボタンから</p>
              </div>
            </>
          )}
          <input 
            type="file" 
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/jpeg,image/png,image/svg+xml,image/heif"
            className="hidden"
          />
        </div>

        {!previewUrl && (
          <div className="max-w-xl mx-auto mt-6 mb-6">
            <button 
              onClick={handleButtonClick}
              className="w-full py-3 border-2 border-[#eb6832] text-[#eb6832] bg-[#fff9f0] rounded-md hover:-translate-y-1 transition-transform font-medium"
            >
              写真を選択
            </button>
          </div>
        )}

        {/* ナビゲーションボタン（上部に移動） */}
        <div className="max-w-xl mx-auto mb-4 flex justify-between">
          <Link href="/" className="flip-button-lr flex items-center px-5 py-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
              <line x1="19" y1="12" x2="5" y2="12"></line>
              <polyline points="12 19 5 12 12 5"></polyline>
            </svg>
            <span>戻る</span>
          </Link>
          <button 
            onClick={handleNext}
            disabled={!previewUrl}
            className={`flip-button-lr flex items-center px-5 py-2 ${!previewUrl && 'opacity-50 cursor-not-allowed'}`}
          >
            <span>次へ進む</span>
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-1">
              <line x1="5" y1="12" x2="19" y2="12"></line>
              <polyline points="12 5 19 12 12 19"></polyline>
            </svg>
          </button>
        </div>

        {/* プライバシーポリシー（下部に移動） */}
        <div className="max-w-xl mx-auto mt-4 bg-blue-50 p-4 rounded-lg">
          <div className="flex justify-center items-center mb-2">
            {/* アイコン */}
            <div className="text-blue-500 mr-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
              </svg>
            </div>
            {/* 見出しテキスト */}
            <h3 className="font-medium text-center text-base ">プライバシー保護について</h3>
          </div>

          {/* 本文テキスト */}
          <p className="text-sm text-gray-600 text-center whitespace-pre-line">
            アップロードされた写真は<br />
            安全なクラウドストレージに保存され、{'\n'}
            リフォームイメージの作成にのみ使用されます。{'\n'}
            個人情報保護のため、写真は暗号化され、{'\n'}
            第三者に共有されることはありません。
          </p>
        </div>
      </div>

      {/* フッターをインラインで追加 - 外側のdivの外に配置 */}
      <footer className="bg-black text-white py-4 mt-8 w-full">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap justify-center gap-6 mb-2 text-sm">
            <a href="https://forest.toppan.com/refotoru/terms/" className="hover:underline">利用規約</a>
            <a href="https://forest.toppan.com/refotoru/privacypolicy/" className="hover:underline">プライバシーポリシー</a>
            <a href="https://x.gd/7Tv2I" className="hover:underline">お問い合わせ</a>
            <a href="https://forest.toppan.com/refotoru/company/" className="hover:underline">企業情報</a>
          </div>
          <div className="flex justify-center items-center">
            {!logoError ? (
              <Image 
                src="/images/logo-white.png" 
                alt="リフォトル" 
                width={30} 
                height={30} 
                className="mr-2"
                onError={() => setLogoError(true)}
              />
            ) : (
              <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center mr-2">
                <span className="text-white text-xs">ロゴ</span>
              </div>
            )}
            <span className="text-sm">© 2024 TOPPAN Inc.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
