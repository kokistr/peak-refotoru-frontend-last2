'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

type ImageContextType = {
  uploadedImage: string | null;
  // 画像のメタ情報を追加
  uploadedImageMeta: {
    id: string;        // ファイル名（DBでの識別子）
    url: string;       // Blob URL
  } | null;
  setUploadedImage: (image: string | null, meta?: { id: string; url: string } | null) => void;
  categoryImage: string | null;
  // カテゴリ画面で選択されたマスク情報を追加
  categoryImageMeta: {
    mask_id: string;
    mask_path: string;
  } | null;
  setCategoryImage: (image: string | null, meta?: { mask_id: string; mask_path: string } | null) => void;
  materialImage: string | null;
  setMaterialImage: (image: string | null) => void;
  selectedArea: { x: number, y: number, width: number, height: number } | null;
  setSelectedArea: (area: { x: number, y: number, width: number, height: number } | null) => void;
  selectedCategory: string | null;
  setSelectedCategory: (category: string | null) => void;
  selectedMaterial: string | null;
  setSelectedMaterial: (material: string | null) => void;
  processedImage: string | null;
  setProcessedImage: (image: string | null) => void;
};

const ImageContext = createContext<ImageContextType | undefined>(undefined);

export function ImageProvider({ children }: { children: ReactNode }) {
  const [uploadedImage, setUploadedImageValue] = useState<string | null>(null);
  const [uploadedImageMeta, setUploadedImageMeta] = useState<{ id: string; url: string } | null>(null);
  const [categoryImage, setCategoryImageValue] = useState<string | null>(null);
  const [categoryImageMeta, setCategoryImageMeta] = useState<{ mask_id: string; mask_path: string } | null>(null);
  const [materialImage, setMaterialImage] = useState<string | null>(null);
  const [selectedArea, setSelectedArea] = useState<{ x: number, y: number, width: number, height: number } | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedMaterial, setSelectedMaterial] = useState<string | null>(null);
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const setUploadedImage = (image: string | null, meta?: { id: string; url: string } | null) => {
    setUploadedImageValue(image);
    if (meta) {
      setUploadedImageMeta(meta);
    } else if (image === null) {
      setUploadedImageMeta(null);
    }
  };
  const setCategoryImage = (image: string | null, meta?: { mask_id: string; mask_path: string } | null) => {
    setCategoryImageValue(image);
    if (meta) {
      setCategoryImageMeta(meta);
    } else if (image === null) {
      setCategoryImageMeta(null);
    }
  };


  return (
    <ImageContext.Provider
      value={{
        uploadedImage,
        uploadedImageMeta,
        setUploadedImage,
        categoryImage,
        categoryImageMeta,
        setCategoryImage,
        materialImage,
        setMaterialImage,
        selectedArea,
        setSelectedArea,
        selectedCategory,
        setSelectedCategory,
        selectedMaterial,
        setSelectedMaterial,
        processedImage,
        setProcessedImage,
      }}
    >
      {children}
    </ImageContext.Provider>
  );
}

export function useImageContext() {
  const context = useContext(ImageContext);
  if (context === undefined) {
    throw new Error('useImageContext must be used within a ImageProvider');
  }
  return context;
}