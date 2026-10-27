// 送信前に縮小する際の最大辺(px)。レシートの文字が読める程度を保ちつつ通信量を抑える
const MAX_EDGE = 2000;
const JPEG_QUALITY = 0.85;

/**
 * 画像を最大辺 MAX_EDGE 以内の JPEG に縮小する
 * スマホで撮影した大きな写真でも API の上限(5MB)に収まるようにするため
 * @param {File} file
 * @returns {Promise<Blob>}
 */
export async function resizeImage(file) {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  // 透過 PNG の背景が黒くならないよう白で塗っておく
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, width, height);
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("画像の変換に失敗しました。"))),
      "image/jpeg",
      JPEG_QUALITY,
    );
  });
}
