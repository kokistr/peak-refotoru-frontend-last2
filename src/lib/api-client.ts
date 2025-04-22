// src/lib/api-client.ts
// バックエンドAPIのベースURL
// 環境変数があれば使用し、なければAzureのURLを直接指定
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://tech0-gen-8-step4-peak-back-gxcthbcwafaxujern.canadacentral-01.azurewebsites.net';

// APIリクエスト関数
export const apiClient = {
  // 画像アップロード
  async uploadImage(file: File) {
    const formData = new FormData();
    formData.append('file', file);
    const response = await fetch(`${API_BASE_URL}/upload`, {
      method: 'POST',
      body: formData,
    });
    if (!response.ok) {
      throw new Error(`アップロードエラー: ${response.statusText}`);
    }
    return await response.json();
  },

  // マスク処理
  async processMask(imageId: string, maskData: string) {
    const response = await fetch(`${API_BASE_URL}/api/process`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        image_id: imageId,
        mask_data: maskData,
      }),
    });
    if (!response.ok) {
      throw new Error(`マスク処理エラー: ${response.statusText}`);
    }
    return await response.json();
  },

  // 素材適用
  async applyMaterial(imageId: string, maskId: string, materialId: string) {
    const response = await fetch(`${API_BASE_URL}/api/apply-material`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        image_id: imageId,
        mask_id: maskId,
        material_id: materialId,
      }),
    });
    if (!response.ok) {
      throw new Error(`素材適用エラー: ${response.statusText}`);
    }
    return await response.json();
  },

  // カテゴリ別の素材一覧を取得
  async getMaterials(category: string) {
    const response = await fetch(`${API_BASE_URL}/api/materials/${category}`);
    
    if (!response.ok) {
      throw new Error(`素材取得エラー: ${response.statusText}`);
    }
    
    return await response.json();
  },

  // 元画像（Before）を取得
  async getBeforeImage(imageId: string) {
    const response = await fetch(`${API_BASE_URL}/api/preview/before/${imageId}`);
    
    if (!response.ok) {
      throw new Error(`Before画像取得エラー: ${response.statusText}`);
    }
    
    return await response.json();
  },

  // 結果画像（After）を取得
  async getAfterImage(imageId: string, maskId: string) {
    const response = await fetch(`${API_BASE_URL}/api/preview/after/${imageId}/${maskId}`);
    
    if (!response.ok) {
      throw new Error(`After画像取得エラー: ${response.statusText}`);
    }
    
    return await response.json();
  },

  // 画像URLを取得する関数
  getImageUrl(path: string | null) {
    if (!path) return '';
    
    // 既にhttp://やhttps://で始まる完全URLの場合はそのまま返す
    if (path.startsWith('http://') || path.startsWith('https://')) {
      return path;
    }
    
    // 相対パスの場合は、ベースURLを付与
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    return `${API_BASE_URL}${normalizedPath}`;
  }
};
