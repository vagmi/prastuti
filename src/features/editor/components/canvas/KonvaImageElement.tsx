import { useEffect, useRef, useState } from 'react';
import { Image as KonvaImage, Transformer } from 'react-konva';
import { useEditorStore } from '../../store';
import { resolveAssetUrl } from '../../services/assetService';
import type { ImageElement } from '../../types';
import Konva from 'konva';

interface KonvaImageElementProps {
  element: ImageElement;
  slideId: string;
  isSelected: boolean;
  onSelect: () => void;
}

export default function KonvaImageElement({
  element,
  slideId,
  isSelected,
  onSelect,
}: KonvaImageElementProps) {
  const updateElement = useEditorStore((s) => s.updateElement);
  const imageRef = useRef<Konva.Image>(null);
  const trRef = useRef<Konva.Transformer>(null);
  const [image, setImage] = useState<HTMLImageElement | null>(null);

  // Load image - resolve asset:// URLs through the asset service
  useEffect(() => {
    const loadImage = async () => {
      let src = element.src;

      // Resolve asset:// URLs through the asset service
      if (src.startsWith('asset://')) {
        const dataUrl = await resolveAssetUrl(src);
        if (dataUrl) {
          src = dataUrl;
        } else {
          console.error('Failed to resolve asset:', src);
          return;
        }
      }

      const img = new window.Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        setImage(img);
      };
      img.src = src;
    };

    loadImage();
  }, [element.src]);

  // Attach transformer when selected
  useEffect(() => {
    if (isSelected && imageRef.current && trRef.current) {
      trRef.current.nodes([imageRef.current]);
      trRef.current.getLayer()?.batchDraw();
    }
  }, [isSelected]);

  const handleDragEnd = (e: Konva.KonvaEventObject<DragEvent>) => {
    const node = e.target;
    updateElement(slideId, element.id, {
      x: node.x(),
      y: node.y(),
    });
  };

  const handleTransformEnd = () => {
    const node = imageRef.current;
    if (!node) return;

    const scaleX = node.scaleX();
    const scaleY = node.scaleY();

    // Reset scale and update width/height instead
    node.scaleX(1);
    node.scaleY(1);

    updateElement(slideId, element.id, {
      x: node.x(),
      y: node.y(),
      width: Math.max(5, node.width() * scaleX),
      height: Math.max(5, node.height() * scaleY),
      rotation: node.rotation(),
    });
  };

  if (!image) {
    // Show placeholder while loading
    return null;
  }

  return (
    <>
      <KonvaImage
        ref={imageRef}
        image={image}
        x={element.x}
        y={element.y}
        width={element.width}
        height={element.height}
        rotation={element.rotation}
        opacity={element.opacity}
        draggable={isSelected}
        onClick={onSelect}
        onTap={onSelect}
        onDragEnd={handleDragEnd}
        onTransformEnd={handleTransformEnd}
      />

      {isSelected && (
        <Transformer
          ref={trRef}
          rotateEnabled={true}
          enabledAnchors={[
            'top-left',
            'top-right',
            'bottom-left',
            'bottom-right',
            'middle-left',
            'middle-right',
            'top-center',
            'bottom-center',
          ]}
          borderStroke="#7c3aed"
          borderStrokeWidth={2}
          anchorStroke="#7c3aed"
          anchorFill="#ffffff"
          anchorSize={8}
          anchorCornerRadius={4}
        />
      )}
    </>
  );
}
