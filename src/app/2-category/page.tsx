'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Slider } from '@/components/ui/slider';
import { useImageContext } from '@/lib/image-context';
import { useRouter } from 'next/navigation';

export default function CategoryPage() {
  const [selectedCategory, setSelectedCategory] = useState('壁');
  const [lineWidth, setLineWidth] = useState([10]); // デフォルトを一番太く設定
  const [isDrawing, setIsDrawing] = useState(false);
  const [showDemoPopup, setShowDemoPopup] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [hasFilled, setHasFilled] = useState(false);
  const [undoStack, setUndoStack] = useState<ImageData[]>([]);
  const [redoStack, setRedoStack] = useState<ImageData[]>([]);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [activeTool, setActiveTool] = useState<'draw' | 'fill'>('draw'); // ズームを削除
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const [viewPosition, setViewPosition] = useState({ x: 0, y: 0 });
  const [paths, setPaths] = useState<Array<{ points: Array<{ x: number; y: number }>; width: number; color: string }>>([]);
  const [currentPath, setCurrentPath] = useState<{ points: Array<{ x: number; y: number }>; width: number; color: string } | null>(null);
  const [selectedAreas, setSelectedAreas] = useState<Array<{
    path: { points: Array<{ x: number; y: number }>; width: number; color: string };
    filled: boolean;
    fillColor: string;
    outlineColor: string;
  }>>([]);
  const [penColor, setPenColor] = useState<'warm' | 'cool' | 'black'>('warm');
  const [displayScale, setDisplayScale] = useState(1); // 表示スケールを追跡
  const [imageLoaded, setImageLoaded] = useState(false); // 画像ロード状態を追跡

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const { uploadedImage, uploadedImageMeta, setCategoryImage } = useImageContext();
  const router = useRouter();
  const demoPopupTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  // フッター用の状態を追加
  const [logoError, setLogoError] = useState(false);

  // ペンの色に対応するCSS変数
  const penColors = {
    warm: 'rgba(255, 119, 51, 0.5)',
    cool: 'rgba(51, 119, 255, 0.5)',
    black: 'rgba(0, 0, 0, 0.5)',
  };

  // 塗りつぶしの色に対応するCSS変数
  const fillColors = {
    warm: 'rgba(255, 119, 51, 0.2)',
    cool: 'rgba(51, 119, 255, 0.2)',
    black: 'rgba(0, 0, 0, 0.2)',
  };

  useEffect(() => {
    // 画面遷移時に最上部にスクロールする
    window.scrollTo(0, 0);

    // Check if the device is mobile
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    // 実際のアプリでは、ここでカテゴリー選択後の画像を生成/保存します
    // この例では、アップロードされた画像をそのまま使用します
    if (uploadedImage) {
      setCategoryImage(uploadedImage);
    } else {
      // 画像がない場合はアップロードページにリダイレクト
      router.push('/1-upload');
    }

    // 画面遷移時にデモポップアップを表示
    setShowDemoPopup(true);

    // 5秒後に非表示
    demoPopupTimerRef.current = setTimeout(() => {
      setShowDemoPopup(false);
    }, 5000);

    return () => {
      if (demoPopupTimerRef.current) {
        clearTimeout(demoPopupTimerRef.current);
      }
      window.removeEventListener('resize', checkMobile);
    };
  }, [uploadedImage, setCategoryImage, router]);

  // キャンバスの初期化
  const initCanvas = () => {
    const canvas = canvasRef.current;
    const image = imageRef.current;

    if (canvas && image && image.complete) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // キャンバスのサイズを画像に合わせる
        canvas.width = image.naturalWidth;
        canvas.height = image.naturalHeight;
        
        // スタイル上のサイズも合わせる（重要）
        canvas.style.width = `${image.width}px`;
        canvas.style.height = `${image.height}px`;

        // 表示スケールを計算・保存
        const displayScaleX = image.width / image.naturalWidth;
        const displayScaleY = image.height / image.naturalHeight;
        setDisplayScale(Math.min(displayScaleX, displayScaleY));

        // 透明なキャンバスを作成
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // 画像がロードされた状態にする
        setImageLoaded(true);
        
        // モバイルの場合、最初はズームレベルを調整して全体が見えるように
        if (isMobile) {
          // 画面サイズに基づいて最適なズームレベルを計算
          const container = canvasContainerRef.current;
          if (container) {
            const containerWidth = container.clientWidth;
            const containerHeight = container.clientHeight;
            const widthRatio = containerWidth / image.width;
            const heightRatio = containerHeight / image.height;
            // 画像全体が表示できる最大のズームレベル
            const optimalZoom = Math.min(widthRatio, heightRatio, 1) * 0.95; // 少し余裕を持たせる
            setZoomLevel(optimalZoom);
          }
        }
      }
    }
  };

  // 現在のキャンバス状態を保存
  const saveCanvasState = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    setUndoStack([...undoStack, imageData]);
    setRedoStack([]);
  };

  // 実際の線の太さを計算（表示スケールを考慮）
  const getScaledLineWidth = (width: number) => {
    // 表示スケールが小さいほど線は太くする必要がある
    return width / displayScale;
  };

  // 描画開始
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    // ズームモードは削除するのでここの条件分岐も削除

    if (activeTool !== 'draw') return;

    // タッチイベントの場合はスクロールを防止
    if ('touches' in e) {
      // passive: falseを設定したイベントリスナーを使わず、ここでは単に処理を進める
    }

    setIsDrawing(true);
    saveCanvasState();

    const canvas = canvasRef.current;
    if (!canvas) return;

    let x, y;
    if ('touches' in e) {
      const rect = canvas.getBoundingClientRect();
      // 実際のキャンバスサイズと表示サイズの比率を計算
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      
      x = (e.touches[0].clientX - rect.left) * scaleX;
      y = (e.touches[0].clientY - rect.top) * scaleY;
    } else {
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      
      x = e.nativeEvent.offsetX * scaleX;
      y = e.nativeEvent.offsetY * scaleY;
    }
    
    // ズームとパン効果の適用
    x = x / zoomLevel - viewPosition.x;
    y = y / zoomLevel - viewPosition.y;

    const scaledWidth = getScaledLineWidth(lineWidth[0]);

    setCurrentPath({
      points: [{ x, y }],
      width: scaledWidth,
      color: penColors[penColor],
    });
  };

  // 描画中
  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    // ズームモード関連のチェックを削除

    if (!isDrawing || activeTool !== 'draw' || !currentPath) return;

    // タッチイベントの場合はここではpreventDefaultを呼び出さない
    // e.preventDefaultは削除

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let x, y;
    if ('touches' in e) {
      const rect = canvas.getBoundingClientRect();
      // 実際のキャンバスサイズと表示サイズの比率を計算
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      
      x = (e.touches[0].clientX - rect.left) * scaleX;
      y = (e.touches[0].clientY - rect.top) * scaleY;
    } else {
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      
      x = e.nativeEvent.offsetX * scaleX;
      y = e.nativeEvent.offsetY * scaleY;
    }

    // ズームとパン効果の適用
    x = x / zoomLevel - viewPosition.x;
    y = y / zoomLevel - viewPosition.y;

    // 現在のパスに点を追加
    setCurrentPath((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        points: [...prev.points, { x, y }],
      };
    });

    // キャンバスに描画
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 既に塗りつぶされた領域を再描画
    redrawFilledAreas(ctx);

    // 既存のパスを描画
    drawAllPaths(ctx);

    // 現在描画中のパスを描画
    if (currentPath) {
      ctx.beginPath();
      ctx.strokeStyle = currentPath.color;
      ctx.lineWidth = currentPath.width; // 既に調整済みの太さを使用
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      const points = [...currentPath.points, { x, y }];
      if (points.length > 0) {
        ctx.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i++) {
          ctx.lineTo(points[i].x, points[i].y);
        }
      }

      ctx.stroke();
    }

    setHasDrawn(true);
  };

  // すべてのパスを描画
  const drawAllPaths = (ctx: CanvasRenderingContext2D) => {
    paths.forEach((path) => {
      if (path.points.length > 0) {
        ctx.beginPath();
        ctx.strokeStyle = path.color;
        ctx.lineWidth = path.width; // 保存された調整済みの太さを使用
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        ctx.moveTo(path.points[0].x, path.points[0].y);
        for (let i = 1; i < path.points.length; i++) {
          ctx.lineTo(path.points[i].x, path.points[i].y);
        }

        ctx.stroke();
      }
    });
  };

  // 塗りつぶされた領域を再描画（輪郭線も含む）
  const redrawFilledAreas = (ctx: CanvasRenderingContext2D) => {
    selectedAreas.forEach((area) => {
      if (area.filled && area.path.points.length > 0) {
        // 塗りつぶし
        ctx.beginPath();
        ctx.fillStyle = area.fillColor;

        ctx.moveTo(area.path.points[0].x, area.path.points[0].y);
        for (let i = 1; i < area.path.points.length; i++) {
          ctx.lineTo(area.path.points[i].x, area.path.points[i].y);
        }

        ctx.closePath();
        ctx.fill();

        // 輪郭線も描画
        ctx.beginPath();
        ctx.strokeStyle = area.outlineColor;
        ctx.lineWidth = area.path.width; // 保存された調整済みの太さを使用
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        ctx.moveTo(area.path.points[0].x, area.path.points[0].y);
        for (let i = 1; i < area.path.points.length; i++) {
          ctx.lineTo(area.path.points[i].x, area.path.points[i].y);
        }

        ctx.closePath();
        ctx.stroke();
      }
    });
  };

  // 描画終了
  const stopDrawing = () => {
    // ズームモード関連のチェックを削除

    if (isDrawing && currentPath) {
      setPaths((prev) => [...prev, currentPath]);
      setCurrentPath(null);
    }

    setIsDrawing(false);
  };

  // 塗りつぶし機能0422更新
  const fillArea = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (activeTool !== 'fill' || paths.length === 0) return;
  
    saveCanvasState();
  
    const canvas = canvasRef.current;
    if (!canvas) return;
  
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
  
    // 塗りつぶし処理
    const fillColor = fillColors[penColor];
  
    // パスがある場合は、パスの内側を塗りつぶす
    if (paths.length > 0) {
      // 最後のパスを使用して塗りつぶし
      const lastPath = paths[paths.length - 1];
      if (lastPath.points.length > 0) {
        ctx.beginPath();
        ctx.moveTo(lastPath.points[0].x, lastPath.points[0].y);
  
        // 最後のパスの残りの点を追加
        for (let i = 1; i < lastPath.points.length; i++) {
          ctx.lineTo(lastPath.points[i].x, lastPath.points[i].y);
        }
  
        // パスを閉じる
        ctx.closePath();
        ctx.fillStyle = fillColor;
        ctx.fill();
  
        // 輪郭線も描画
        ctx.beginPath();
        ctx.strokeStyle = lastPath.color;
        ctx.lineWidth = lastPath.width;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
  
        ctx.moveTo(lastPath.points[0].x, lastPath.points[0].y);
        for (let i = 1; i < lastPath.points.length; i++) {
          ctx.lineTo(lastPath.points[i].x, lastPath.points[i].y);
        }
  
        ctx.closePath();
        ctx.stroke();
  
        // 選択された領域を追加
        setSelectedAreas((prev) => [
          ...prev,
          {
            path: lastPath,
            filled: true,
            fillColor: fillColor,
            outlineColor: lastPath.color,
          },
        ]);
  
        // 使用済みのパスを削除
        setPaths((prev) => prev.filter((_, index) => index !== prev.length - 1));
      }
    }
  
    setHasDrawn(true);
    setHasFilled(true); // 塗りつぶし済みフラグを設定
  };

  // 画像のドラッグ機能 (パン)
  const handleDragStart = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    // タッチイベントの場合はスクロールを防止
    if ('touches' in e) {
      // ペンモードの場合はドラッグを無効に
      if (activeTool === 'draw') return;
      
      // preventDefaultは削除
      const touch = e.touches[0];
      setDragStart({ x: touch.clientX, y: touch.clientY });
    } else {
      // マウスの中ボタンまたは右ボタンの場合のみパンを有効に
      if (e.button === 1 || e.button === 2) {
        e.preventDefault();
        setDragStart({ x: e.clientX, y: e.clientY });
      }
    }
  };

  // 画像のドラッグ中 (パン)
  const handleDrag = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!dragStart) return;

    if ('touches' in e) {
      // preventDefaultは削除
      const touch = e.touches[0];
      const dx = (touch.clientX - dragStart.x) / zoomLevel;
      const dy = (touch.clientY - dragStart.y) / zoomLevel;

      setViewPosition((prev) => ({
        x: prev.x + dx,
        y: prev.y + dy,
      }));

      setDragStart({ x: touch.clientX, y: touch.clientY });
    } else {
      const dx = (e.clientX - dragStart.x) / zoomLevel;
      const dy = (e.clientY - dragStart.y) / zoomLevel;

      setViewPosition((prev) => ({
        x: prev.x + dx,
        y: prev.y + dy,
      }));

      setDragStart({ x: e.clientX, y: e.clientY });
    }
  };

  // ドラッグ終了
  const handleDragEnd = () => {
    setDragStart(null);
  };

  // ズーム機能
  const handleZoom = (direction: 'in' | 'out') => {
    if (direction === 'in') {
      setZoomLevel((prev) => Math.min(prev + 0.1, 3));
    } else {
      // 最小ズームを0.5に設定（より広く見れるように）
      setZoomLevel((prev) => Math.max(prev - 0.1, 0.5));
    }
  };

  // ズームをリセット（画像全体表示）
  const resetZoom = () => {
    // モバイルの場合は画面に合わせた最適なズームにリセット
    if (isMobile && canvasContainerRef.current && imageRef.current) {
      const container = canvasContainerRef.current;
      const image = imageRef.current;
      const containerWidth = container.clientWidth;
      const containerHeight = container.clientHeight;
      const widthRatio = containerWidth / image.width;
      const heightRatio = containerHeight / image.height;
      const optimalZoom = Math.min(widthRatio, heightRatio, 1) * 0.95;
      setZoomLevel(optimalZoom);
    } else {
      // PCの場合は等倍にリセット
      setZoomLevel(1);
    }
    setViewPosition({ x: 0, y: 0 });
  };

  // ホイールでのズーム（PC用）- キャンバスコンテナに限定する
  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    // キャンバスコンテナ内のホイールイベントのみ処理し、
    // ページ全体のスクロールは阻止しない
    if (canvasContainerRef.current && canvasContainerRef.current.contains(e.target as Node)) {
      e.preventDefault();
      const direction = e.deltaY < 0 ? 'in' : 'out';
      handleZoom(direction);
    }
  };

  // ツール切り替え（ペンと塗りつぶしのみ）
  const switchTool = (tool: 'draw' | 'fill') => {
    setActiveTool(tool);

    // 塗りつぶしツールに切り替えたときにhasFilled状態をリセット
    if (tool === 'fill') {
      setHasFilled(false);
    }
  };

  // 元に戻す
  const undo = () => {
    if (undoStack.length === 0) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const currentState = ctx.getImageData(0, 0, canvas.width, canvas.height);
    setRedoStack([...redoStack, currentState]);

    const previousState = undoStack.pop();
    if (previousState) {
      ctx.putImageData(previousState, 0, 0);
      setUndoStack([...undoStack]);
    }

    // 最後に追加された選択領域を削除
    if (selectedAreas.length > 0) {
      setSelectedAreas((prev) => prev.slice(0, -1));
    } else if (paths.length > 0) {
      // パスも一つ戻す
      setPaths((prev) => prev.slice(0, -1));
    }

    if (undoStack.length === 0 && selectedAreas.length === 0) {
      setHasDrawn(false);
      setHasFilled(false);
    }
  };

  // やり直し
  const redo = () => {
    if (redoStack.length === 0) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const currentState = ctx.getImageData(0, 0, canvas.width, canvas.height);
    setUndoStack([...undoStack, currentState]);

    const nextState = redoStack.pop();
    if (nextState) {
      ctx.putImageData(nextState, 0, 0);
      setRedoStack([...redoStack]);
      setHasDrawn(true);
    }
  };

  // ヘルプボタンクリック
  const handleHelpClick = () => {
    setShowDemoPopup((prev) => {
      // 現在表示中なら非表示に
      if (prev) {
        return false;
      } else {
        // 非表示中なら表示して、5秒後に非表示にするタイマーをセット
        if (demoPopupTimerRef.current) {
          clearTimeout(demoPopupTimerRef.current);
        }
        demoPopupTimerRef.current = setTimeout(() => {
          setShowDemoPopup(false);
        }, 5000);
        return true;
      }
    });
  };

  // キャンバスクリック
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (activeTool === 'fill') {
      fillArea(e);
    }
  };

  const handleNextClick = async (e: React.MouseEvent) => {
    e.preventDefault(); // デフォルトの動作を防止
    
    if (!hasDrawn) {
      document.getElementById('error-message')?.classList.add('show');
      setTimeout(() => {
        document.getElementById('error-message')?.classList.remove('show');
      }, 3000);
      return;
    }

    // マスク領域をサーバーに送信
    try {
      console.log("マスク保存処理を開始します");
      await saveSelectedArea();
      console.log("マスク保存成功、次の画面に進みます");
      router.push(`/3-materials?category=${selectedCategory}`);
    } catch (error) {
      console.error('マスク保存エラー:', error);
      alert('選択領域の保存に失敗しました。詳細はコンソールを確認してください。');
    }
  };
  
  // マスク領域を保存する関数を追加0422
  const saveSelectedArea = async () => {
    console.log("saveSelectedArea が呼び出されました");
    console.log("uploadedImageMeta:", uploadedImageMeta);
    
    if (!uploadedImageMeta || !uploadedImageMeta.id) {
      console.error("画像メタデータがありません");
      throw new Error('アップロードされた画像情報がありません');
    }

    const canvas = canvasRef.current;
    if (!canvas) {
      console.error("キャンバスが見つかりません");
      throw new Error('キャンバスが見つかりません');
    }

    try {
      // キャンバスの内容をBase64形式で取得
      const dataUrl = canvas.toDataURL('image/png');
      const base64Data = dataUrl.split(',')[1]; // "data:image/png;base64," を除去
      
      console.log(`APIリクエスト送信: image_id=${uploadedImageMeta.id}, mask_data長さ=${base64Data.length}`);

      // APIにリクエストを送信
      const response = await fetch('https://tech0-gen-8-step4-peak-back-gxcchbcwfaxguem.canadacentral-01.azurewebsites.net/api/process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image_id: uploadedImageMeta.id,
          mask_data: base64Data
        }),
      });

      // レスポンスステータスを確認
      console.log("APIレスポンスステータス:", response.status);
      
      if (!response.ok) {
        // エラーレスポンスのテキストを取得
        const errorText = await response.text();
        console.error("サーバーエラー:", errorText);
        throw new Error(errorText || '範囲選択の保存に失敗しました');
      }

      const data = await response.json();
      console.log("マスク保存成功:", data);

      // マスク情報をコンテキストに保存
      setCategoryImage(uploadedImage, {
        mask_id: data.mask_id,
        mask_path: data.mask_path
      });

      return data;
    } catch (error) {
      console.error("API処理エラー:", error);
      throw error;
    }
  };
  

  // タッチイベントのデフォルト動作を防止するためのハンドラ
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    // キャンバス上でのタッチ操作の場合のみスクロールを防止
    if (canvasRef.current && canvasRef.current.contains(e.target as Node)) {
      e.preventDefault();
    }
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
  
      <div className="container mx-auto px-4 py-6">
        <div className="max-w-2xl mx-auto">
          {/* ステップインジケーター */}
          <div className="step-nav mb-3">
            <div className="step-item">
              <div className="step-circle step-completed">1</div>
              <div className="step-label">部屋写真<br />アップ</div>
            </div>
            <div className="step-line line-active"></div>
            <div className="step-item">
              <div className="step-circle step-active">2</div>
              <div className="step-label">カテゴリ<br />範囲選択</div>
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
          
          {/* カテゴリ選択 */}
          <div className="mb-4">
            <div className="flex items-center mb-3">
              <div className="flex-1 flex gap-3">
                <button
                  className={`category-button flex-1 py-3 px-4 ${selectedCategory === 'ドア' ? 'category-button-active' : 'category-button-inactive'}`}
                  onClick={() => setSelectedCategory('ドア')}
                >
                  ドア
                </button>
                <button
                  className={`category-button flex-1 py-3 px-4 ${selectedCategory === '壁' ? 'category-button-active' : 'category-button-inactive'}`}
                  onClick={() => setSelectedCategory('壁')}
                >
                  壁
                </button>
                <button
                  className={`category-button flex-1 py-3 px-4 ${selectedCategory === '床' ? 'category-button-active' : 'category-button-inactive'}`}
                  onClick={() => setSelectedCategory('床')}
                >
                  床
                </button>
              </div>
            </div>
          </div>
          
          {/* 上部に配置する最低限のペン操作コントロール */}
          <div className="bg-white rounded-lg p-3 mb-3 shadow-sm">
            <div className="flex items-center justify-between">
              {/* ツールボタン（左側に配置） */}
              <div className="flex gap-2">
                <button
                  className={`tool-button ${activeTool === 'draw' ? 'tool-button-active' : ''}`}
                  onClick={() => switchTool('draw')}
                  title="ペン"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 20h9"></path>
                    <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
                  </svg>
                </button>
                <button
                  className={`tool-button ${activeTool === 'fill' ? 'tool-button-active' : ''} ${paths.length === 0 ? 'tool-button-inactive' : ''}`}
                  onClick={() => (paths.length > 0 ? switchTool('fill') : null)}
                  title="塗りつぶし"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2s-8 9.4-8 14a8 8 0 0 0 16 0c0-4.6-8-14-8-14z"></path>
                  </svg>
                </button>
              </div>
              
                  {/* ペン太さ調整スライダー（中央に配置）- PCでの幅を制限 */}
                  <div className="flex-1 mx-4 max-w-[60%]">
                    <Slider
                    value={lineWidth}
                    onValueChange={setLineWidth}
                    max={10}
                    min={1}
                    step={1}
                    className="pen-slider w-full"
                    />
                    </div>
              
              {/* ペン色選択（右側に配置） */}
              <div className="flex items-center gap-1">
                <div
                  className={`pen-color-button pen-color-warm ${penColor === 'warm' ? 'active' : ''}`}
                  onClick={() => setPenColor('warm')}
                ></div>
                <div
                  className={`pen-color-button pen-color-cool ${penColor === 'cool' ? 'active' : ''}`}
                  onClick={() => setPenColor('cool')}
                ></div>
                <div
                  className={`pen-color-button pen-color-black ${penColor === 'black' ? 'active' : ''}`}
                  onClick={() => setPenColor('black')}
                ></div>
              </div>
            </div>
          </div>
  
          {/* 描画キャンバス */}
          <div className="bg-white rounded-lg p-6 mb-6 relative shadow-sm">
            <div
              className="relative mb-4 overflow-hidden image-container"
              ref={canvasContainerRef}
              onWheel={handleWheel}
              onTouchStart={handleTouchStart}
              style={{
                height: isMobile ? '50vh' : 'calc(100vh - 250px)', // 元のサイズを維持
                width: '100%',
                position: 'relative',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center'
              }}
            >
              {uploadedImage ? (
                <div
                  style={{
                    transform: `scale(${zoomLevel})`,
                    transformOrigin: 'center center', // 中央を基点に拡大縮小
                    position: 'relative'
                  }}
                >
                  <div className="relative">
                    <Image
                      ref={imageRef}
                      src={uploadedImage}
                      alt="Room Image"
                      width={0}
                      height={0}
                      sizes="100vw"
                      style={{ 
                        width: 'auto', 
                        maxWidth: '100%',
                        height: 'auto',
                        maxHeight: isMobile ? '45vh' : 'calc(100vh - 280px)' // 元のサイズを維持
                      }}
                      className="rounded-lg"
                      onLoad={initCanvas}
                      priority
                    />
                    <canvas
                      ref={canvasRef}
                      className="drawing-canvas"
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        pointerEvents: 'all',
                      }}
                      onMouseDown={startDrawing}
                      onMouseMove={draw}
                      onMouseUp={stopDrawing}
                      onMouseLeave={stopDrawing}
                      onTouchStart={startDrawing}
                      onTouchMove={draw}
                      onTouchEnd={stopDrawing}
                      onClick={handleCanvasClick}
                      onContextMenu={(e) => e.preventDefault()} // 右クリックメニュー無効化
                    />
                  </div>
                </div>
              ) : (
                <div className="w-full h-full min-h-[300px] bg-gray-200 flex items-center justify-center rounded-lg">
                  <span className="text-gray-500">写真をアップロードしてください</span>
                </div>
              )}
  
              {/* 操作説明ポップアップ - モバイルでも見えるように位置調整 */}
              {showDemoPopup && (
                <div 
                  className="demo-popup p-4 rounded-lg bg-black bg-opacity-75 max-w-[90%] md:max-w-[80%] text-sm md:text-base"
                  style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    zIndex: 10,
                    width: 'auto',
                    maxHeight: isMobile ? '80%' : '90%',
                    overflowY: 'auto'
                  }}
                >
                  <p className="font-bold mb-2 text-white">範囲選択の方法</p>
                  <p className="mb-2 text-white">1. 指やマウスで写真をなぞって変更したい範囲を選択</p>
                  <p className="mb-2 text-white">2. 塗りつぶしボタンで囲った内側を塗りつぶせます</p>
                  <p className="mb-2 text-white">3. 選択が完了したら「次へ進む」ボタンをクリック</p>
                  <p className="text-white">ペンの太さ調整や、ひとつ戻る進む等も可能です。</p>
                </div>
              )}
            </div>

            {/* 下部に残す操作コントロール */}
            <div className="flex justify-between items-center mb-4">
              {/* ヘルプボタン */}
              <button className="bg-[#f87e42] text-white rounded-full p-1" onClick={handleHelpClick}>
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
                  <line x1="12" y1="17" x2="12.01" y2="17"></line>
                </svg>
              </button>
              
              {/* ズームコントロール */}
              <div className="flex">
                <button 
                  className="p-2 bg-gray-200 rounded-md mr-2"
                  onClick={resetZoom}
                  title="画像全体表示"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                  </svg>
                </button>
                <button 
                  className="p-2 bg-gray-200 rounded-md mr-2"
                  onClick={() => handleZoom('in')}
                  title="拡大"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8"></circle>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                    <line x1="11" y1="8" x2="11" y2="14"></line>
                    <line x1="8" y1="11" x2="14" y2="11"></line>
                  </svg>
                </button>
                <button 
                  className="p-2 bg-gray-200 rounded-md"
                  onClick={() => handleZoom('out')}
                  title="縮小"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8"></circle>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                    <line x1="8" y1="11" x2="14" y2="11"></line>
                  </svg>
                </button>
              </div>
              
              {/* 元に戻す/やり直しボタン */}
              <div className="flex gap-2">
                <button
                  className={`w-10 h-10 rounded-md flex items-center justify-center ${undoStack.length > 0 ? 'bg-gray-400' : 'bg-gray-300'}`}
                  onClick={undo}
                  disabled={undoStack.length === 0}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="19" y1="12" x2="5" y2="12"></line>
                    <polyline points="12 19 5 12 12 5"></polyline>
                  </svg>
                </button>
                <button
                  className={`w-10 h-10 rounded-md flex items-center justify-center ${redoStack.length > 0 ? 'bg-gray-400' : 'bg-gray-300'}`}
                  onClick={redo}
                  disabled={redoStack.length === 0}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                    <polyline points="12 5 19 12 12 19"></polyline>
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* ナビゲーションボタン */}
          <div className="flex justify-between mt-auto">
            <Link href="/1-upload" className="flip-button-lr flex items-center px-5 py-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                <line x1="19" y1="12" x2="5" y2="12"></line>
                <polyline points="12 19 5 12 12 5"></polyline>
              </svg>
              <span>戻る</span>
            </Link>
            <Link
              href={`/3-materials?category=${selectedCategory}`}
              onClick={handleNextClick}
              className={!hasDrawn ? 'pointer-events-none' : ''}
            >
              <div className={`flip-button-lr flex items-center px-5 py-2 ${!hasDrawn ? 'opacity-50 cursor-not-allowed' : ''}`}>
                <span>次へ進む</span>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-1">
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                  <polyline points="12 5 19 12 12 19"></polyline>
                </svg>
              </div>
            </Link>
          </div>

          {!hasDrawn && (
            <div className="error-message mt-2" id="error-message">
              範囲を選択してから次へ進んでください
            </div> 
          )}
          
        </div>
        
      </div>
      
      {/* モバイル用のスタイルを追加 */}
      <style jsx>{`
        /* モバイルでの表示調整 */
        @media (max-width: 768px) {
          .image-container {
            border: 1px solid #eee;
            border-radius: 8px;
            overflow: hidden;
          }
          
          .demo-popup {
            font-size: 14px;
          }
          
          .step-label {
            font-size: 10px;
          }
        }
        
        /* 操作説明ポップアップのスタイル */
        .demo-popup {
          animation: fadeIn 0.3s ease-in-out;
        }
        
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        /* エラーメッセージのスタイル */
        .error-message {
          color: #e53e3e;
          text-align: center;
          opacity: 0;
          transition: opacity 0.3s ease;
        }
        
        .error-message.show {
          opacity: 1;
        }
        
        /* ペン色選択ボタンのスタイル */
        .pen-color-button {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          cursor: pointer;
          transition: transform 0.2s ease;
        }
        
        .pen-color-button.active {
          transform: scale(1.2);
          box-shadow: 0 0 0 2px white, 0 0 0 4px #eb6832;
        }
        
        .pen-color-warm {
          background-color: rgba(255, 119, 51, 0.8);
        }
        
        .pen-color-cool {
          background-color: rgba(51, 119, 255, 0.8);
        }
        
        .pen-color-black {
          background-color: rgba(0, 0, 0, 0.8);
        }
        
        /* ツールボタンスタイル */
        .tool-button {
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 8px;
          background-color: #f5f5f5;
          transition: all 0.2s ease;
        }
        
        .tool-button-active {
          background-color: #eb6832;
          color: white;
        }
        
        .tool-button-inactive {
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        /* カテゴリーボタンスタイル */
        .category-button {
          border-radius: 8px;
          font-weight: 500;
          transition: all 0.2s ease;
        }
        
        .category-button-active {
          background-color: #eb6832;
          color: white;
        }
        
        .category-button-inactive {
          background-color: #f5f5f5;
          color: #333;
        }
        
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
`}</style>
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
    </div>
  );
}
