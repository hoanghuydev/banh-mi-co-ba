# Prompt (bản đã chạy cho chú Đạt)

Thay "Uncle Dat" và câu tả nhân vật (mặt, tóc, áo, quần, dép) theo phiếu. Giữ nguyên các câu khoá đèn/màu và camera.

## 1. Bốn mặt (chat A, đính anh-bao-list.png)

```
Generate an image. The attached image shows an existing character of the game in 8 directions: match its art style exactly (cozy stylized 3D render like a soft clay toy, big head chibi-ish proportions, face style, colour saturation, level of detail, soft studio light from the upper right). Draw a NEW character in that same style. CHARACTER: Uncle Dat, a Vietnamese man about 50 years old, a street banh mi cart vendor. Medium build with a slightly round belly, slightly hunched. Tanned warm brown skin. Short neat black hair with a little grey at the temples, slightly receding. Square face, thick eyebrows, small eyes with a sceptical, slightly sour expression, mouth closed, thin moustache. Wears a short-sleeved button-up shirt in light beige khaki (#D8C9A0), over it a long dark brick-red apron (#8D3B2F) tied at the waist and neck, reaching the knees. Dark charcoal grey trousers (#33363C). Brown plastic sandals. No glasses, no hat, nothing in his hands. LAYOUT: a character turnaround sheet, ONE single row of 4 views of the SAME character, evenly spaced, same size and same height, feet on the same baseline: 1) front view, 2) right side view (facing to the right of the image), 3) back view, 4) left side view (facing to the left of the image). POSE: relaxed idle standing pose, standing straight, arms hanging down naturally beside the body, legs straight, feet slightly apart. CAMERA: orthographic, eye level, no perspective. Full body visible in every view, nothing cropped. BACKGROUND: pure flat white, no ground, no shadow, no text, no labels. Wide landscape image.
```

## 2. Tám hướng đứng im (vẫn chat A, không đính thêm)

```
Generate an image. Perfect, keep this exact same character (same face, hair, moustache, beige shirt, brick-red apron, charcoal trousers, brown sandals, same proportions and same render style). Now make an 8-direction game sprite sheet of him in the SAME relaxed idle standing pose (arms hanging down naturally, legs straight, feet slightly apart). CAMERA for every view: orthographic, raised 30 degrees above the horizon looking slightly down at him, exactly like the camera of the 8-direction reference image I attached first (you see a bit of the top of the head and the shoulders). The character turns in place in steps of 45 degrees; the camera never moves. LAYOUT: 2 rows of 4 cells, evenly spaced, same size, feet on the same baseline in each row. Row 1, left to right: 1) facing the camera (front), 2) front three-quarter view, facing toward the lower right of the image, 3) right profile, facing the right of the image, 4) back three-quarter view, facing toward the upper right (away from camera, we see his back and the right side of his face). Row 2, left to right: 5) back view, facing away from the camera, 6) back three-quarter view, facing toward the upper left, 7) left profile, facing the left of the image, 8) front three-quarter view, facing toward the lower left. Full body in every cell, nothing cropped. BACKGROUND: pure flat white, no ground, no shadow, no text, no numbers, no labels. Landscape image.
```

## 3. Pha bước (mỗi hướng 1 chat; ảnh 1 = pose-le/<h>.png, ảnh 2 = idle/<h>.png)

Thay `<DESC>` theo bảng dưới. Câu tả nhân vật trong ngoặc cũng thay theo phiếu.

```
Generate an image. Image 1 is a POSE REFERENCE only: 4 frames of a walk cycle of another character (a boy in a grey cardigan). Image 2 is Uncle Dat standing idle in the target direction. Draw Uncle Dat in a strip of 4 frames that copy the EXACT body pose of each frame of image 1, frame by frame, in the same order: same leg positions (which leg is in front, which leg is behind, knee bends, foot angles), same arm swing, same body direction: <DESC>, exactly the direction of image 2. Look carefully: in image 1 the front leg changes between frames, keep that exactly. Do NOT copy the boy's face, hair, glasses or clothes: the character is Uncle Dat exactly as in image 2 (face, moustache, short black hair with grey temples, beige short-sleeved shirt, brick-red apron, charcoal trousers, brown sandals, body proportions). Lighting and colour lock: all 4 frames have exactly the same soft light from the upper right, same exposure and same colours as image 2, no frame darker or brighter. Orthographic camera raised 30 degrees. One single row of 4 frames, evenly spaced, same scale, feet on one baseline, full body, pure white background, no shadow, no text. Wide landscape image.
```

| Hướng | <DESC> |
|---|---|
| s | facing the camera, walking straight toward the viewer (toward the bottom of the image) |
| se | front three-quarter view, facing and walking toward the lower right of the image |
| e | right profile, facing and walking toward the right of the image |
| ne | back three-quarter view, facing and walking away toward the upper right of the image |
| n | back view, walking straight away from the camera (toward the top of the image) |
| nw | back three-quarter view, facing and walking away toward the upper left of the image |
| w | left profile, facing and walking toward the left of the image |
| sw | front three-quarter view, facing and walking toward the lower left of the image |

## 4. Pha chuyển tiếp (gửi tiếp trong chat đi của hướng đó; ảnh 1 = pose-chan/<h>.png, ảnh 2 = walk/<h>.png)

```
Generate an image. Image 1 is a new POSE REFERENCE: the 4 IN-BETWEEN frames of the same walk cycle (the moments between the steps of your previous strip, legs passing each other, body slightly up). Image 2 is your previous Uncle Dat walk strip. Draw Uncle Dat in a strip of 4 frames copying the EXACT body pose of each frame of image 1, frame by frame, in the same order: same leg positions, knee bends, foot angles and arm swing. Keep everything else identical to image 2: same character, same direction, same camera, same scale (same height in pixels), same soft light from the upper right, same exposure and same colours, no frame darker or brighter. Do NOT copy the boy's face, hair, glasses or clothes from image 1. One single row of 4 frames, evenly spaced, feet on one baseline, full body, pure white background, no shadow, no text. Wide landscape image.
```

## Hướng s và n: thêm vào cả hai dải

Tạp dề/váy/áo dài che chân thì frame gần như giống nhau, trong game trông như trượt. Chèn trước câu "Lighting and colour lock":

```
Walking straight toward (or away from) the camera hides the legs, so make the walk clearly readable: both trouser legs and both sandals must be clearly visible below the apron in every frame, the stepping foot lifted and moved clearly forward, the apron swinging with each step, shoulders and arms swinging visibly.
```

## Áo/tóc sáng màu (trắng, kem, bạc, xanh nhạt): bản đã sửa cho Khả Hân

Mặt sáng của áo chạm liền nền thì bị tách nền ăn mất. Thêm vào cả hai dải (và nên dùng ngay từ chat A):

```
Generate an image. The attached image is one of your Kha Han walk strips. Redraw it with exactly the same 4 poses, same character, same direction, same camera, same scale and same colours, with ONE fix: the white school shirt must never be pure white. Make the shirt a soft warm off-white (#ECE8DF) with gentle grey shading in its folds and on the side away from the light, and a thin slightly darker grey edge all around the shirt and sleeve silhouette, so the shirt is clearly separated from the pure white background everywhere, even on its brightest side. Everything else stays identical. One single row of 4 frames, evenly spaced, feet on one baseline, full body, pure white background, no shadow, no text. Wide landscape image.
```

## Hướng s/n vẫn trông như trượt: câu EXAGGERATE (Khả Hân)

Dải bước:

```
Generate an image. Image 1 is the POSE REFERENCE again (4 stepping frames of the boy). Image 2 is your previous Kha Han strip. Redraw the Kha Han strip copying the poses of image 1 frame by frame, same character, same direction, same camera, same scale, same soft light from the upper right and same colours as image 2, but EXAGGERATE the walk so it reads clearly at tiny size: big clear steps, the stepping foot lifted high so we see the sole of the sandal, the two legs clearly apart with a visible gap between the trouser legs, the body leaning and bobbing, arms swinging wide and far away from the body. Both trouser legs and both sandals clearly visible in every frame. The white school shirt is a soft warm off-white (#ECE8DF) with gentle grey shading and a thin slightly darker grey edge so it never blends into the white background. One single row of 4 frames, evenly spaced, feet on one baseline, full body, pure white background, no shadow, no text. Wide landscape image.
```

Dải chuyển tiếp:

```
Generate an image. Image 1 is the POSE REFERENCE for the 4 IN-BETWEEN frames (legs passing each other, body slightly up). Image 2 is your latest exaggerated Kha Han strip. Draw Kha Han in a strip of 4 frames copying the EXACT body pose of each frame of image 1, frame by frame: the passing leg lifted clearly off the ground with the knee bent so its sandal sole shows, the other leg straight, arms swinging clearly away from the body, the body slightly higher. Keep everything else identical to image 2: same character, same direction, same camera, same scale (same height in pixels), same soft light from the upper right, same colours, off-white shirt with grey shading and thin darker edge. Do NOT copy the boy's face, hair, glasses or clothes from image 1. Both trouser legs and both sandals clearly visible and separated in every frame. One single row of 4 frames, evenly spaced, feet on one baseline, full body, pure white background, no shadow, no text. Wide landscape image.
```

## Chặn giày trắng của mẫu dáng (thêm vào cả hai dải, mọi hướng)

Mẫu dáng là anh Bảo đi giày thể thao trắng; ChatGPT hay chép giày đó vào một chân (gặp ở Dì Liên, Thầy Khải). Chèn ngay sau câu "Do NOT copy the boy's …":

```
Footwear: copy ONLY the leg pose from image 1, never its white sneakers. Both feet of the character wear exactly the footwear of image 2 (<mô tả dép/giày theo phiếu>) in every frame, including the foot behind.
```
