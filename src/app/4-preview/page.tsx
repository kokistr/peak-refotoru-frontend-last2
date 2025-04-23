'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useImageContext } from '@/lib/image-context';

export default function PreviewPage() {
  // State declarations
  const [activeTab, setActiveTab] = useState('after');
  const [isMobile, setIsMobile] = useState(false);
  const [showShareOptions, setShowShareOptions] = useState(false);
  const [showImagePopup, setShowImagePopup] = useState(false);
  const { uploadedImage, uploadedImageMeta, materialImage, categoryImage, categoryImageMeta } = useImageContext();
  const shareOptionsRef = useRef<HTMLDivElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  // フッター用の状態を追加
  const [logoError, setLogoError] = useState(false);
  // 追加：Before/After画像のstate
  const [beforeImage, setBeforeImage] = useState<string | null>(null);
  const [afterImage, setAfterImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);


  useEffect(() => {
    // 画面遷移時に最上部にスクロールする
    window.scrollTo(0, 0);

    // Check if the device is mobile
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    // シェアオプション外のクリックを検知
    const handleClickOutside = (event: MouseEvent) => {
      if (shareOptionsRef.current && !shareOptionsRef.current.contains(event.target as Node)) {
        setShowShareOptions(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);

    // Before/After画像の取得0422
    const fetchImages = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // uploadedImageMetaとcategoryImageMetaがある場合のみAPIを呼び出す
        if (uploadedImageMeta && categoryImageMeta) {
          console.log('APIリクエスト用データ:', { 
            imageId: uploadedImageMeta.id, 
            maskId: categoryImageMeta.mask_id 
          });
          
          // Before画像の取得 - IDはそのまま使用（拡張子を含む）
          const beforeRes = await fetch(`https://tech0-gen-8-step4-peak-back-gxcchbcwafaxguem.canadacentral-01.azurewebsites.net/api/preview/before/${encodeURIComponent(uploadedImageMeta.id)}`);
          
          if (!beforeRes.ok) {
            const errorData = await beforeRes.json().catch(() => ({ detail: '不明なエラー' }));
            throw new Error(`Before画像の取得に失敗しました: ${errorData.detail || beforeRes.statusText}`);
          }
          
          const beforeData = await beforeRes.json();
          setBeforeImage(beforeData.blob_url);
          
          // After画像の取得 - IDはそのまま使用（拡張子を含む）
          const afterRes = await fetch(
            `https://tech0-gen-8-step4-peak-back-gxcchbcwafaxguem.canadacentral-01.azurewebsites.net/api/preview/after/${encodeURIComponent(uploadedImageMeta.id)}/${encodeURIComponent(categoryImageMeta.mask_id)}`
          );
          
          if (!afterRes.ok) {
            const errorData = await afterRes.json().catch(() => ({ detail: '不明なエラー' }));
            throw new Error(`After画像の取得に失敗しました: ${errorData.detail || afterRes.statusText}`);
          }
          
          const afterData = await afterRes.json();
          setAfterImage(afterData.public_url);
        } else {
          // コンテキストから画像を使用
          console.log('メタデータが不足しているため、コンテキストから画像を使用します');
          setBeforeImage(uploadedImage);
          setAfterImage(materialImage || uploadedImage);
        }
      } catch (err) {
        console.error('画像取得エラー:', err);
        setError(err instanceof Error ? err.message : '画像の取得中にエラーが発生しました');
        
        // エラー時はコンテキストの画像にフォールバック
        setBeforeImage(uploadedImage);
        setAfterImage(materialImage || uploadedImage);
      } finally {
        setLoading(false);
      }
    };
    
    fetchImages();

    return () => {
      window.removeEventListener('resize', checkMobile);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [uploadedImage, materialImage, uploadedImageMeta, categoryImageMeta]);

  // Event handlers
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    // Store the initial touch position
    const touchStartX = e.touches[0].clientX;

    // Add a touch move event listener
    const handleTouchMove = (e: TouchEvent) => {
      const touchEndX = e.touches[0].clientX;
      const diff = touchEndX - touchStartX;

      // If swiped left to right, show before image
      if (diff > 50 && activeTab === 'after') {
        setActiveTab('before');
      }
      // If swiped right to left, show after image
      else if (diff < -50 && activeTab === 'before') {
        setActiveTab('after');
      }
    };

    // Add a touch end event listener to clean up
    const handleTouchEnd = () => {
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };

    document.addEventListener('touchmove', handleTouchMove);
    document.addEventListener('touchend', handleTouchEnd);
  };

  const handleSave = () => {
    // In a real app, this would trigger a download
    // For now, we'll just simulate it with an alert
    alert('画像を保存しています...');
  };

  const handleShare = () => {
    setShowShareOptions(!showShareOptions);
  };

  const handleImageClick = () => {
    setShowImagePopup(true);
  };

  // 画像URLを取得する関数（サーバーホスト名を付与）0422
  const getImageUrl = (path: string | null) => {
    if (!path) return '';
    
    // 既にhttp://やhttps://で始まる完全URLの場合はそのまま返す
    if (path.startsWith('http://') || path.startsWith('https://')) {
      return path;
    }
    
    // 相対パスの場合は、ベースURLを付与（ローカル開発ではhttp://localhost:8000）
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    return `https://tech0-gen-8-step4-peak-back-gxcchbcwafaxguem.canadacentral-01.azurewebsites.net${normalizedPath}`;
  };



  return (
    <div className="min-h-screen bg-[#fff9f0]">
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

      <main className="container mx-auto px-4 py-2 pt-20">{/* ← pt-24 → pt-20、py-6 → py-2 */}</main>

      {/* ステップナビゲーション */}
      <div className="step-nav mb-3">
        <div className="step-item">
          <div className="step-circle step-completed">1</div>
          <div className="step-label">
            部屋写真
            <br />
            アップ
          </div>
        </div>
        <div className="step-line line-active"></div>
        <div className="step-item">
          <div className="step-circle step-completed">2</div>
          <div className="step-label">
            カテゴリ
            <br />
            範囲選択
          </div>
        </div>
        <div className="step-line line-active"></div>
        <div className="step-item">
          <div className="step-circle step-completed">3</div>
          <div className="step-label">素材選択</div>
        </div>
        <div className="step-line line-active"></div>
        <div className="step-item">
          <div className="step-circle step-active">4</div>
          <div className="step-label">作成完了</div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="max-w-md mx-auto">
          <div className="text-center mb-4">
            {loading && <p className="text-gray-500">画像を読み込み中...</p>}
            {error && <p className="text-red-500">{error}</p>}
          </div>

          {/* Before/Afterタブ表示 */}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden mb-6">
            <div className="flex">
              <div className="w-1/2">
                <button
                  className={`w-full py-3 text-white text-center font-bold transition-colors ${activeTab === 'before' ? 'bg-[#f87e42]' : 'bg-gray-400'}`}
                  onClick={() => handleTabChange('before')}
                >
                  Before
                </button>
              </div>
              <div className="w-1/2">
                <button
                  className={`w-full py-3 text-white text-center font-bold transition-colors ${activeTab === 'after' ? 'bg-[#f87e42]' : 'bg-gray-400'}`}
                  onClick={() => handleTabChange('after')}
                >
                  After
                </button>
              </div>
            </div>

            {/* 画像表示エリア */}
            <div 
              className="relative px-4 py-4"
              onTouchStart={handleTouchStart}
              onClick={handleImageClick}
            >
              {loading ? (
                <div className="w-full h-[300px] bg-gray-200 flex items-center justify-center rounded-lg">
                  <span className="text-gray-500">読み込み中...</span>
                </div>
              ) : activeTab === 'before' ? (
                // Before画像
                beforeImage ? (
                  <Image
                    src={getImageUrl(beforeImage)}
                    alt="Before Image"
                    width={0}
                    height={0}
                    sizes="100vw"
                    className="w-full h-auto object-contain rounded-lg"
                    style={{ 
                      maxHeight: isMobile ? '40vh' : '50vh'
                    }}
                  />
                ) : (
                  <div className="w-full h-[300px] bg-gray-200 flex items-center justify-center rounded-lg">
                    <span className="text-gray-500">アップロードされた写真</span>
                  </div>
                )
              ) : (
                // After画像
                afterImage ? (
                  <Image
                    src={getImageUrl(afterImage)}
                    alt="After Image"
                    width={0}
                    height={0}
                    sizes="100vw"
                    className="w-full h-auto object-contain rounded-lg"
                    style={{ 
                      maxHeight: isMobile ? '40vh' : '50vh',
                      filter: 'contrast(1.05) brightness(1.03)' // 微妙な加工
                    }}
                  />
                ) : (
                  <div className="w-full h-[300px] bg-gray-200 flex items-center justify-center rounded-lg">
                    <span className="text-gray-500">生成された写真</span>
                  </div>
                )
              )}
            </div>
          </div>

          {/* 操作ボタン */}
          <div className="flex gap-4 mb-6">
            <button
              className="action-button w-1/2 bg-[#fff9f0] text-[#f87e42] border border-[#f87e42] py-3 rounded-lg transition-all flex items-center justify-center gap-2 shadow-sm"
              onClick={handleSave}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="7 10 12 15 17 10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
              </svg>
              <span>保存する</span>
            </button>

            <div className="relative w-1/2" ref={shareOptionsRef}>
              <button
                className="action-button w-full bg-[#fff9f0] text-[#f87e42] border border-[#f87e42] py-3 rounded-lg transition-all flex items-center justify-center gap-2 shadow-sm"
                onClick={handleShare}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="18" cy="5" r="3"></circle>
                  <circle cx="6" cy="12" r="3"></circle>
                  <circle cx="18" cy="19" r="3"></circle>
                  <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
                  <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
                </svg>
                <span>共有する</span>
              </button>
              
              {/* シェアオプション - SNSアイコンを表示 */}
              {showShareOptions && (
                <div className="absolute inset-x-4 top-full mt-2 bg-[#fff9f0] shadow-lg rounded-lg p-4 z-10 w-full max-w-xs mx-auto">
                  <p className="text-sm text-center mb-4 text-[#f87e42] font-bold">シェア先を選択</p>
                  <div className="social-icon-grid">
                    <a href="https://www.instagram.com/" className="social-icon-link">
                      <div className="social-icon-container">
                        <Image src="/images/instagram-con.png" alt="Instagram" width={36} height={36} className="social-icon" />
                        <p className="social-icon-label">Instagram</p>
                      </div>
                    </a>
                    <a href="https://x.com/" className="social-icon-link">
                      <div className="social-icon-container">
                        <Image src="/images/x-icon.png" alt="X" width={36} height={36} className="social-icon" />
                        <p className="social-icon-label">X</p>
                      </div>
                    </a>
                    <a href="https://www.facebook.com/" className="social-icon-link">
                      <div className="social-icon-container">
                        <Image src="/images/facebook-icon.png" alt="Facebook" width={36} height={36} className="social-icon" />
                        <p className="social-icon-label">Facebook</p>
                      </div>
                    </a>
                    <a href="https://jp.pinterest.com/" className="social-icon-link">
                      <div className="social-icon-container">
                        <Image src="/images/pinterest-icon.png" alt="Pinterest" width={36} height={36} className="social-icon" />
                        <p className="social-icon-label">Pinterest</p>
                      </div>
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* リフォーム会社紹介バナー - キャンペーンバナー修正 */}
          <div className="mb-6">
            <a href="https://x.gd/wlwOK" className="block">
              <div className="reform-banner border border-[#f87e42] rounded-lg p-4 text-center relative overflow-hidden">
                <div className="campaign-ribbon">
                  <span className="text-xs text-[8px]">キャンペーン中</span>
                </div>
                <div className="flex items-center justify-center h-12">
                  <p className="text-base font-medium reform-banner-text">優良リフォーム会社のご紹介はこちら</p>
                </div>
              </div>
            </a>
            <div className="text-xs text-gray-500 text-center mt-2">※国土交通大臣登録団体の事業者を最大4社までご紹介します</div>
          </div>

          {/* 統一されたナビゲーションボタン - 横並び3つ */}
          <div className="flex gap-3 mb-8">
            <Link href="/3-materials" className="w-1/3">
              <div className="flip-button-lr h-12 flex items-center justify-center text-sm">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                  <line x1="19" y1="12" x2="5" y2="12"></line>
                  <polyline points="12 19 5 12 12 5"></polyline>
                </svg>
                <span>戻る</span>
              </div>
            </Link>

            <Link href="/1-upload" className="w-1/3">
              <div className="other-room-button border border-[#f87e42] text-[#f87e42] bg-white rounded-lg font-medium text-center text-sm h-12 flex items-center justify-center transition-colors">
                他の部屋でも試す
              </div>
            </Link>

            <Link href="/" className="w-1/3">
              <div className="flip-button-lr h-12 flex items-center justify-center text-sm sm:text-base px-2 text-center whitespace-nowrap">
                トップページへ
              </div>
            </Link>
          </div>
        </div>
      </div>

      {/* 画像ポップアップ */}
      {showImagePopup && (
            <div 
              className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50"
              onClick={() => setShowImagePopup(false)}
            >
              <div 
                className="relative max-w-4xl max-h-[90vh] bg-white p-4 rounded-lg"
                onClick={(e) => e.stopPropagation()}
              >
                <button 
                  className="absolute top-2 right-2 bg-white rounded-full p-1 shadow-md"
                  onClick={() => setShowImagePopup(false)}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>

                {activeTab === 'before' ? (
                  beforeImage ? (
                    <Image
                      src={getImageUrl(beforeImage)}
                      alt="Before Image"
                      width={1200}
                      height={900}
                      className="max-w-full max-h-full object-contain"
                    />
                  ) : (
                    <div className="w-full h-[600px] bg-gray-200 flex items-center justify-center">
                      <span className="text-gray-500">アップロードされた写真</span>
                    </div>
                  )
                ) : (
                  afterImage ? (
                    <Image
                      src={getImageUrl(afterImage)}
                      alt="After Image"
                      width={1200}
                      height={900}
                      className="max-w-full max-h-full object-contain"
                      style={{ 
                        filter: 'contrast(1.05) brightness(1.03)' // 微妙な加工
                      }}
                    />
                  ) : (
                    <div className="w-full h-[600px] bg-gray-200 flex items-center justify-center">
                      <span className="text-gray-500">生成された写真</span>
                    </div>
                  )
                )}
              </div>
            </div>
          )}

      {/* フッターをインラインで追加 */}
      <footer className="bg-black text-white py-4 mt-8">
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

      {/* スタイル定義 */}
      <style jsx>{`
        /* リフォーム会社紹介バナー用スタイル */
        .reform-banner {
          position: relative;
          overflow: hidden;
          z-index: 1;
          background-color: #fff9f0;
          transition: all 0.3s ease;
        }
        
        .reform-banner::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background-color: #f87e42;
          transition: left 0.3s ease;
          z-index: -1;
        }
        
        .reform-banner:hover::before,
        .reform-banner:active::before {
          left: 0;
        }
        
        .reform-banner-text {
          color: #333;
          transition: color 0.3s ease;
        }
        
        .reform-banner:hover .reform-banner-text,
        .reform-banner:active .reform-banner-text {
          color: white;
        }
        
        /* キャンペーンリボン */
        .campaign-ribbon {
          position: absolute;
          top: 0;
          left: 0;
          background-color: #f87e42;
          color: white;
          font-weight: bold;
          text-align: center;
          width: 100px;
          transform: rotate(-45deg) translateX(-30px) translateY(-8px);
          padding: 3px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          z-index: 2;
        }
        
        /* 左から右へ色反転するボタン */
        .flip-button-lr {
          position: relative;
          background-color: #f87e42;
          color: white;
          border-radius: 0.5rem;
          font-weight: 500;
          border: 2px solid #f87e42;
          overflow: hidden;
          z-index: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: color 0.3s ease;
        }

        .flip-button-lr::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background-color: white;
          transition: left 0.3s ease;
          z-index: -1;
        }

        .flip-button-lr:hover,
        .flip-button-lr:active {
          color: #f87e42;
        }

        .flip-button-lr:hover::before,
        .flip-button-lr:active::before {
          left: 0;
        }
        
        /* 保存する・共有するボタン用スタイル */
        .action-button {
          position: relative;
          overflow: hidden;
          z-index: 1;
        }
        
        .action-button::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(248, 126, 66, 0.15);
          opacity: 0;
          z-index: -1;
          transition: opacity 0.3s ease;
        }
        
        .action-button:hover::after,
        .action-button:active::after {
          opacity: 1;
        }
        
        .action-button:active::after {
          background-color: rgba(248, 126, 66, 0.3);
        }
        
        /* 他の部屋でも試すボタン用スタイル */
        .other-room-button {
          position: relative;
          overflow: hidden;
          z-index: 1;
          color: #f87e42;
          border-color: #f87e42;
        }
        
        .other-room-button::before {
          content: '';
          position: absolute;
          top: -100%;
          left: 0;
          right: 0;
          bottom: 0;
          height: 100%;
          background-color: #f87e42;
          transition: top 0.3s ease;
          z-index: -1;
        }
        
        .other-room-button:hover,
        .other-room-button:active {
          color: white;
        }
        
        .other-room-button:hover::before,
        .other-room-button:active::before {
          top: 0;
        }
        
        /* SNSアイコン用スタイル */
        .social-icon-link {
          text-decoration: none;
          color: inherit;
          transition: transform 0.2s;
        }
        
        .social-icon-link:hover,
        .social-icon-link:active {
          transform: translateY(-2px);
        }

        .social-icon-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 8px;
        }
        
        .social-icon-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          width: 100%;
        }
        
        .social-icon {
          width: 36px;
          height: 36px;
          object-fit: contain;
          margin-bottom: 4px;
        }
        
        .social-icon-label {
          font-size: 11px;
          text-align: center;
          margin: 0;
          color: #666;
        }
        
        @media (max-width: 480px) {
          .social-icon-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 16px;
          }
          
          .social-icon {
            width: 28px;
            height: 28px;
          }
          
          .social-icon-label {
            font-size: 10px;
          }
        }
          @media (min-width: 481px) {
          .social-icon-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 16px;
          }
        }
      `}</style>
    </div>
  );
}
