'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import { useImageContext } from '@/lib/image-context';
import { useRouter } from 'next/navigation';

// MaterialsContent コンポーネント
function MaterialsContent() {  
  const searchParams = useSearchParams();
  const categoryParam = searchParams.get('category');

  const [selectedCategory, setSelectedCategory] = useState('壁');
  const [currentPage, setCurrentPage] = useState(0);
  //const [selectedMaterial, setSelectedMaterial] = useState<number | null>(null);
  const [selectedMaterial, setSelectedMaterial] = useState<string | null>(null);
  const [showMaterialInfo, setShowMaterialInfo] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [touchStartX, setTouchStartX] = useState(0);
  const [imageHeight, setImageHeight] = useState(0); // 画像の高さを追跡
  const materialsContainerRef = useRef<HTMLDivElement>(null);
  const imageContainerRef = useRef<HTMLDivElement>(null);
  // const { categoryImage, setMaterialImage } = useImageContext(); // これ削除する必要あるかも0422　
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [logoError, setLogoError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [materialItems, setMaterialItems] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const { 
    uploadedImage, 
    uploadedImageMeta, 
    categoryImage, 
    categoryImageMeta,
    setCategoryImage 
  } = useImageContext(); // 追加した0422
  const [isApplying, setIsApplying] = useState(false); // 追加した0422


  useEffect(() => {
    // 画面遷移時に最上部にスクロールする
    window.scrollTo(0, 0);

    if (categoryParam) {
      setSelectedCategory(categoryParam);
    }

    // 画像がない場合はカテゴリーページにリダイレクト
    if (!categoryImage) {
      router.push('/2-category');
    }
  }, [categoryParam, categoryImage, router]);

  useEffect(() => {
    // Check if the device is mobile or tablet
    const checkMobile = () => {
      const isMobileView = window.innerWidth <= 768;
      setIsMobile(isMobileView);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  // カテゴリの日本語名を英語名に変換する関数
  const mapCategoryToEnglish = (japaneseCategory: string): string => {
    const categoryMap: Record<string, string> = {
      '壁': 'Wallpaper',
      '床': 'Floor',
      'ドア': 'Door'
    };
    
    return categoryMap[japaneseCategory] || japaneseCategory;
  };

  // APIから素材を取得0422
  useEffect(() => {
    const fetchMaterials = async () => {
      if (!categoryParam) return;
      
      setIsLoading(true);
      setError(null);
      
      // 日本語カテゴリを英語に変換
      const englishCategory = mapCategoryToEnglish(categoryParam);
      console.log(`カテゴリ変換: ${categoryParam} -> ${englishCategory}`);
      
      // エンコードも行う
      const encodedCategory = encodeURIComponent(englishCategory);
    
      console.log(`素材取得を開始: カテゴリ=${categoryParam}`);
      
      try {
        const response = await fetch(`https://tech0-gen-8-step4-peak-back-gxcchbcwafaxguem.canadacentral-01.azurewebsites.net/api/materials/${encodedCategory}`, {
          credentials: 'include',
          mode: 'cors',
          cache: 'no-cache'
        });
        console.log(`APIレスポンスステータス: ${response.status}`);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error(`素材取得エラー: ${errorText}`);
          throw new Error(`素材の取得に失敗しました: ${response.status}`);
        }
        
        const data = await response.json();
        console.log(`取得した素材データ: ${JSON.stringify(data)}`);
        console.log(`素材数: ${data.materials ? data.materials.length : 0}`);
        setMaterialItems(data.materials);
      } catch (err) {
        console.error('素材取得エラー:', err);
        setError('素材の読み込み中にエラーが発生しました。');
      } finally {
        setIsLoading(false);
        console.log('素材取得処理完了');
      }
    };
    
    fetchMaterials();
  }, [categoryParam]); // カテゴリが変更されたときに再取得

  // 素材データ表示のデバック用0422
  useEffect(() => {
    if (materialItems.length > 0) {
      console.log('Material items:', materialItems);
      console.log('First item image URL:', materialItems[0].image);
    }
  }, [materialItems]);

  
  // 素材データURLを整形0422
  const getFullImageUrl = (imageUrl: string) => {
    if (!imageUrl) return '';
    
    // すでに完全なURLの場合はそのまま返す
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
      return imageUrl;
    }
    
    // 相対パスの場合はベースURLを追加
    return `https://tech0-gen-8-step4-peak-back-gxcchbcwafaxguem.canadacentral-01.azurewebsites.net${imageUrl}`;
  };


  // 画像がロードされたときに高さを更新する処理
  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    setImageHeight(img.clientHeight);
  };

  // // カテゴリー別の素材データ（実際の実装ではAPIから取得するので変更！）
  // const materials = {
  //   壁: [
  //     { id: 1, name: 'ホワイトペイント', color: '白色' },
  //     { id: 2, name: 'ベージュクロス', color: 'ベージュ' },
  //     { id: 3, name: 'グレーペイント', color: 'グレー' },
  //     { id: 4, name: 'ブルーペイント', color: '青色' },
  //     { id: 5, name: 'グリーンペイント', color: '緑色' },
  //     { id: 6, name: 'イエローペイント', color: '黄色' },
  //     { id: 7, name: 'ピンククロス', color: 'ピンク' },
  //     { id: 8, name: '木目調クロス', color: '茶色' },
  //     { id: 9, name: 'モルタル調', color: 'グレー' },
  //   ],
  //   床: [
  //     {
  //       id: 1,
  //       name: 'オーク柄フローリング',
  //       color: 'ベージュ',
  //       image: '/images/FL-MD-BE-016.jpg',
  //     },
  //     {
  //       id: 2,
  //       name: '大理石調ブラックフローリング',
  //       color: '黒色',
  //       image: '/images/FL-MD-BKM-013.jpg',
  //     },
  //     {
  //       id: 3,
  //       name: 'グレーアッシュ柄フローリング',
  //       color: 'グレー',
  //       image: '/images/FL-CR-WH-011.jpg',
  //     },
  //     { id: 4, name: 'バーチ', color: '明るい茶色' },
  //     { id: 5, name: 'メープル', color: '黄茶色' },
  //     { id: 6, name: '竹フローリング', color: '薄黄色' },
  //     { id: 7, name: 'コルク', color: '茶色' },
  //     { id: 8, name: 'タイル', color: 'グレー' },
  //     { id: 9, name: 'カーペット', color: 'ベージュ' },
  //   ],
  //   ドア: [
  //     { id: 1, name: 'ホワイトドア', color: '白色' },
  //     { id: 2, name: 'ナチュラルウッド', color: '薄茶色' },
  //     { id: 3, name: 'ダークウッド', color: '濃茶色' },
  //     { id: 4, name: 'ガラスドア', color: '透明' },
  //     { id: 5, name: 'フロストガラス', color: '半透明' },
  //     { id: 6, name: '黒塗装ドア', color: '黒色' },
  //     { id: 7, name: 'グレードア', color: 'グレー' },
  //     { id: 8, name: 'ブルードア', color: '青色' },
  //     { id: 9, name: 'グリーンドア', color: '緑色' },
  //   ],
  // };

  // 安全にアクセスするためのヘルパー関数
  const getMaterialsForCategory = () => {
    return materialItems || [];
  };

  const currentMaterials = getMaterialsForCategory().slice(currentPage * 3, currentPage * 3 + 3);
  const totalPages = Math.ceil(getMaterialsForCategory().length / 3);
  
  const nextPage = () => {
    if (currentPage < totalPages - 1) {
      setCurrentPage(currentPage + 1);
    } else {
      setCurrentPage(0);
    }
  };

  const prevPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    } else {
      setCurrentPage(totalPages - 1);
    }
  };


  const handleMaterialClick = async (id: string) => {
    // 素材IDを設定
    setSelectedMaterial(id);
    setShowMaterialInfo(true);
    setIsApplying(true); // ローディング開始
    
    // 必要な情報をチェック
    if (!uploadedImageMeta || !categoryImageMeta) {
      console.error('必要な画像情報が不足しています');
      return;
    }
    
    try {
      console.log('素材適用APIを呼び出し中...');
      console.log('リクエストパラメータ:', {
        image_id: uploadedImageMeta.id,
        mask_id: categoryImageMeta.mask_id,
        material_id: id
      });
      
      const response = await fetch('https://tech0-gen-8-step4-peak-back-gxcchbcwafaxguem.canadacentral-01.azurewebsites.net/api/apply-material', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image_id: uploadedImageMeta.id,
          mask_id: categoryImageMeta.mask_id,
          material_id: id
        }),
        credentials: 'include',
        mode: 'cors',
        cache: 'no-cache'
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('APIエラーレスポンス:', errorText);
        throw new Error('素材適用に失敗しました');
      }
      
      const data = await response.json();
      console.log('素材適用成功:', data);
      
      // APIから返された合成画像URLを使って表示を更新
      // ※ここが重要0422
      if (data.public_url) {
        // 合成画像のURLを使用して表示を更新
        const fullImageUrl = `https://tech0-gen-8-step4-peak-back-gxcchbcwafaxguem.canadacentral-01.azurewebsites.net${data.public_url}`;
        setCategoryImage(fullImageUrl, categoryImageMeta);
      }
      
    } catch (error) {
      console.error('素材適用エラー:', error);

    } finally {
      setIsApplying(false); // ローディング終了
    }
    
    // 3秒後に情報を非表示にする
    setTimeout(() => {
      setShowMaterialInfo(false);
    }, 3000);
  };

  // スワイプ機能のためのイベントハンドラ
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isMobile) return;

    const touchEndX = e.touches[0].clientX;
    const diff = touchEndX - touchStartX;

    // スワイプの距離が50px以上の場合のみ処理
    if (Math.abs(diff) < 50) return;

    if (diff > 0) {
      // 右にスワイプ - 前のページ
      prevPage();
    } else {
      // 左にスワイプ - 次のページ
      nextPage();
    }

    // タッチ位置をリセット
    setTouchStartX(touchEndX);
  };


  const handleNextClick = (e: React.MouseEvent) => {
    if (selectedMaterial === null) {
      e.preventDefault();
      document.getElementById('error-message')?.classList.add('show');
      setTimeout(() => {
        document.getElementById('error-message')?.classList.remove('show');
      }, 3000);
      return;
    }
  };

  // 素材の色に対応するスタイルを取得(バックエンドと繋いだら変更して！)
  const getMaterialColorStyle = (color: string) => {
    const colorMap: Record<string, string> = {
      '白色': '#f8f9fa',
      'ベージュ': '#f5f5dc',
      'グレー': '#808080',
      '青色': '#1e90ff',
      '緑色': '#2e8b57',
      '黄色': '#ffeb3b',
      'ピンク': '#ffb6c1',
      '茶色': '#8b4513',
      '黒色': '#333333',
      '透明': '#ffffff',
      '半透明': '#f0f0f0',
      '明るい茶色': '#d2b48c',
      '黄茶色': '#cd853f',
      '薄黄色': '#f0e68c',
      '濃茶色': '#654321',
    };
    
    return colorMap[color] || '#cccccc';
  };

  // テキスト色を判定（背景色に基づく）
  const getTextColor = (color: string) => {
    const lightColors = ['白色', 'ベージュ', '半透明', '透明', '薄黄色', '黄色'];
    return lightColors.includes(color) ? 'text-gray-700' : 'text-white';
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
      <main className="container mx-auto px-4 py-2 pt-20"></main>

      <div className="container mx-auto px-4 py-2">
        <div className="grid md:grid-cols-12 gap-4">
          <div className="md:col-span-8 md:col-start-3">
            {/* ステップナビゲーション - 余白を削減 */}
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
                <div className="step-circle step-active">3</div>
                <div className="step-label">素材選択</div>
              </div>
              <div className="step-line line-inactive"></div>
              <div className="step-item">
                <div className="step-circle step-inactive">4</div>
                <div className="step-label">作成完了</div>
              </div>
            </div>          
            
            {/* 余白を削減 */}
            <div className="h-2"></div>

            <div className="bg-white rounded-lg p-4 mb-6 relative">
              {/* 選択中：カテゴリ（フォントサイズ小さく） */}
              <div className="text-sm mb-1">選択中: {selectedCategory}</div>
              
              {/* 画像コンテナ - 画像が見切れないように調整 */}
              <div 
                className="relative mb-3 image-container"
                ref={imageContainerRef}
                style={{ 
                  maxHeight: isMobile ? '42vh' : '60vh',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  width: '100%'
                }}
              >
                {isApplying ? (
                  // ローディング表示
                  <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-40 z-10">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#f87e42]"></div>
                  </div>
                ) : null}
  
                {categoryImage ? (
                  <Image
                    src={categoryImage}
                    alt="Room Image"
                    width={0}
                    height={0}
                    sizes="100vw"
                    className="max-w-full h-auto object-contain rounded-lg"
                    style={{ 
                      maxHeight: isMobile ? '40vh' : '48vh',
                      width: 'auto',
                      objectFit: 'contain'
                    }}
                    priority
                    onLoad={handleImageLoad}
                  />
                ) : (
                  <div className="w-full h-48 bg-gray-200 flex items-center justify-center rounded-lg">
                    <span className="text-gray-500">カテゴリー選択した写真</span>
                  </div>
                )}
                
                {/* 選択中の素材情報表示 */}

                {selectedMaterial && showMaterialInfo && (
                  <div className="absolute bottom-3 left-3 bg-black bg-opacity-70 text-white px-4 py-2 rounded-md text-base">
                    {getMaterialsForCategory().find((m) => m.id === selectedMaterial)?.name}
                    ({getMaterialsForCategory().find((m) => m.id === selectedMaterial)?.color})
                  </div>
                )}
              </div>

              {/* 素材選択エリア - 素材名を非表示に */}
              <div className="relative mb-2">
                {isLoading ? (
                  <div className="flex justify-center items-center h-24">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#f87e42]"></div>
                  </div>
                ) : error ? (
                  <div className="text-red-500 text-center p-4">{error}</div>
                ) : materialItems.length === 0 ? (
                  <div className="text-gray-500 text-center p-4">
                    このカテゴリの素材はありません
                  </div>
                ) : (
                  <div
                    ref={materialsContainerRef}
                    className={`material-grid ${isMobile ? 'material-grid-mobile' : ''}`}
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                  >
                    {currentMaterials.map((material) => (
                      <div
                        key={material.id}
                        className={`material-item ${selectedMaterial === material.id ? 'selected' : ''}`}
                        onClick={() => handleMaterialClick(String(material.id))}
                      >
                        {material.image ? (
                          <div className={`${isMobile ? 'h-16' : 'h-20'} overflow-hidden`}>
                            <Image
                              src={getFullImageUrl(material.image)}
                              alt={material.name}
                              width={150}
                              height={120}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                console.error(`画像ロードエラー: ${material.image}`);
                                // オプション: エラー発生時にフォールバック表示に切り替える
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                          </div>
                        ) : (  
                          <div 
                            className={`${isMobile ? 'h-16' : 'h-20'} flex items-center justify-center`}
                            style={{ 
                              backgroundColor: getMaterialColorStyle(material.color)
                            }}
                          >
                            <span className={`${getTextColor(material.color)} text-center px-2 ${isMobile ? 'text-xs' : 'text-sm'}`}>
                              {material.name}
                            </span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* ページネーション */}
                <div className="flex justify-between items-center mt-2">
                  <button
                    className="w-8 h-8 bg-[#f87e42] rounded-full flex items-center justify-center"
                    onClick={prevPage}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="15 18 9 12 15 6"></polyline>
                    </svg>
                  </button>

                  <div className="text-sm text-center">
                    {currentPage + 1} / {totalPages || 1}
                  </div>

                  <button
                    className="w-8 h-8 bg-[#f87e42] rounded-full flex items-center justify-center"
                    onClick={nextPage}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="9 18 15 12 9 6"></polyline>
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            <div className="flex justify-between mt-auto">
              <Link href="/2-category" className="flip-button-lr flex items-center px-5 py-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                  <line x1="19" y1="12" x2="5" y2="12"></line>
                  <polyline points="12 19 5 12 12 5"></polyline>
                </svg>
                <span>戻る</span>
              </Link>
              <Link
                href="/4-preview"
                onClick={handleNextClick}
                className={selectedMaterial === null ? 'pointer-events-none' : ''}
              >
                <div className={`flip-button-lr flex items-center px-5 py-2 ${selectedMaterial === null ? 'opacity-50 cursor-not-allowed' : ''}`}>
                  <span>次へ進む</span>
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-1">
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                    <polyline points="12 5 19 12 12 19"></polyline>
                  </svg>
                </div>
              </Link>
            </div>

            {selectedMaterial === null && (
              <div className="error-message mt-2" id="error-message">
                素材を選択してから次へ進んでください
              </div>
            )}
          </div>
        </div>
      </div>

      {/* スタイル定義 */}
      <style jsx>{`
      /* ステップナビゲーション */
      .step-nav {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0 10px;
      }

      .step-item {
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
      }

      .step-circle {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: bold;
        margin-bottom: 8px;
      }

      .step-completed {
        background-color: #fcb58a; /* 薄いオレンジ色（完了した工程用） */
        color: white;
      }

      .step-active {
        background-color: #f87e42; /* 濃いオレンジ色（現在の位置用） */
        color: white;
      }

      .step-inactive {
        background-color: #e2e8f0;
        color: #718096;
      }

      .step-line {
        flex-grow: 1;
        height: 2px;
        margin: 0 5px;
      }

      .line-active {
        background-color: #fcb58a; /* 薄いオレンジ色（完了した区間用） */
      }

      .line-inactive {
        background-color: #e2e8f0;
      }

        /* 素材グリッド */
        .material-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 8px;
        }
        
        /* スマホ向け素材グリッド - 高さを小さく */
        .material-grid-mobile {
          gap: 6px;
        }
        
        .material-item {
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          overflow: hidden;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          flex-direction: column;
        }
        
        .material-item:hover {
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
        }
        
        .material-item.selected {
          border: 2px solid #eb6832;
          box-shadow: 0 4px 12px rgba(235, 104, 50, 0.2);
        }
        
        /* エラーメッセージ */
        .error-message {
          color: #e53e3e;
          text-align: center;
          opacity: 0;
          transition: opacity 0.3s ease;
        }
        
        .error-message.show {
          opacity: 1;
        }
        
        /* モバイルでのスタイル調整 */
        @media (max-width: 768px) {
          .step-circle {
            width: 30px;
            height: 30px;
            font-size: 14px;
          }
          
          .step-label {
            font-size: 10px;
          }
          
          .material-info {
            padding: 2px;
            line-height: 1.2;
          }
        }
      `}</style>
            {/* フッターをインラインで追加 */}
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

// MaterialsPage
export default function MaterialsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#fff9f0] flex items-center justify-center">読み込み中...</div>}>
      <MaterialsContent />
    </Suspense>
  );
}
