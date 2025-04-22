/**
 * API クライアント
 * バックエンドAPIとの通信を一元管理するためのモジュール
 */

// 環境変数またはデフォルト値からAPIのベースURLを取得
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://your-azure-backend-url.azurewebsites.net';

/**
 * 画像URLを取得する
 * サーバーホスト名を付与する
 * @param path - 画像のパス
 * @returns 完全なURL
 */
const getImageUrl = (path: string | null) => {
  if (!path) return '';
  
  // 既にhttp://やhttps://で始まる完全URLの場合はそのまま返す
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  
  // 相対パスの場合は、ベースURLを付与
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE_URL}${normalizedPath}`;
};

/**
 * APIクライアントオブジェクト
 */
export const apiClient = {
  /**
   * 画像のアップロード
   * @param file - アップロードするファイル
   * @returns アップロード結果のレスポンス
   */
  async uploadImage(file: File) {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_BASE_URL}/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: '不明なエラー' }));
      throw new Error(`画像のアップロードに失敗しました: ${errorData.detail || response.statusText}`);
    }

    return await response.json();
  },

  /**
   * マスク処理
   * @param imageId - 画像ID
   * @param maskData - マスクデータ
   * @returns 処理結果
   */
  async processMask(imageId: string, maskData: string) {
    const response = await fetch(`${API_BASE_URL}/api/process`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ imageId, maskData }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: '不明なエラー' }));
      throw new Error(`マスク処理に失敗しました: ${errorData.detail || response.statusText}`);
    }

    return await response.json();
  },

  /**
   * 素材適用
   * @param imageId - 画像ID
   * @param maskId - マスクID
   * @param materialId - 素材ID
   * @returns 処理結果
   */
  async applyMaterial(imageId: string, maskId: string, materialId: string) {
    const response = await fetch(`${API_BASE_URL}/api/apply-material`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ imageId, maskId, materialId }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: '不明なエラー' }));
      throw new Error(`素材適用に失敗しました: ${errorData.detail || response.statusText}`);
    }

    return await response.json();
  },

  /**
   * 素材一覧取得
   * @param category - カテゴリ
   * @returns 素材一覧
   */
  async getMaterials(category: string) {
    const response = await fetch(`${API_BASE_URL}/api/materials/${category}`);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: '不明なエラー' }));
      throw new Error(`素材一覧の取得に失敗しました: ${errorData.detail || response.statusText}`);
    }

    return await response.json();
  },

  /**
   * Before画像の取得
   * @param imageId - 画像ID
   * @returns Before画像情報
   */
  async getBeforeImage(imageId: string) {
    const response = await fetch(`${API_BASE_URL}/api/preview/before/${encodeURIComponent(imageId)}`);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: '不明なエラー' }));
      throw new Error(`Before画像の取得に失敗しました: ${errorData.detail || response.statusText}`);
    }

    return await response.json();
  },

  /**
   * After画像の取得
   * @param imageId - 画像ID
   * @param maskId - マスクID
   * @returns After画像情報
   */
  async getAfterImage(imageId: string, maskId: string) {
    const response = await fetch(
      `${API_BASE_URL}/api/preview/after/${encodeURIComponent(imageId)}/${encodeURIComponent(maskId)}`
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: '不明なエラー' }));
      throw new Error(`After画像の取得に失敗しました: ${errorData.detail || response.statusText}`);
    }

    return await response.json();
  },

  // 画像URLを取得する関数をオブジェクトのメソッドとして追加
  getImageUrl
};
