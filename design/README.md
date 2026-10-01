# 塔罗牌背设计记录

## 当前版本 · 对称沙漏

生成日期：2026-09-30。使用内置 image_gen 工具（imagegen 技能），参考用户提供的单张沙漏图制作。
源图：[hourglass-card-back.png](hourglass-card-back.png)。网站使用长边 1200 px 的哈希命名 WebP，当前数据版本 `2026.10.01.1`；该牌背最初随 `2026.09.30.4` 发布。
视觉：深紫黑底、粉金线描、紫色水晶、粉色沙堆、植物、星点和细边框。上下沙漏腔室以旋转对称构图呼应；不包含太阳、月亮或月相。

### 对称沙漏生成提示词

Use case: stylized-concept. Asset type: finished tarot card BACK, single flat portrait print artwork. Use the attached card only as the visual style and primary composition reference: dark nearly-black plum ground, pink and pale yellow delicate ornamental line drawing, purple crystals, botanical sprigs, star speckles, tiny bead borders, pink floral corner ornaments, central tall hourglass. User's exact change: make the HOURGLASS SYMMETRICAL. Make a new original high-resolution single card back, aspect ratio 3:5, entire rectangular image filled by the card artwork without white outside margins or perspective. A large centered slim hourglass occupies most of the card height. BOTH chambers have identical violet quartz crystal clusters emerging from a rose-pink sand mound, top chamber is the precise 180-degree rotated counterpart of the bottom chamber. The frame, hourglass lips, glass outlines, interior motifs, sand, crystals, side pink leaves, tiny stars and all border ornaments must have two-way 180-degree rotational symmetry, equal widths and equal heights above/below the waist, equal ornamental ends. Use a small elegant symmetrical diamond detail at its narrow central neck. Pale butter-yellow fine glass outlines, hot rose-pink floral linework, violet crystal facets with pale-yellow hatching. Dense but carefully spaced fine hand-inked vintage screenprint line art, crisp small-scale readability, matte flat color with fine hatch marks, closely matching the reference's restrained decorative density. IMPORTANT: remove all moons, lunar crescents, moon phases, suns, planetary circles and facial celestial medallions from the reference. Replace the top/bottom lunar rows with matching tiny diamond-and-dot ornaments and botanical trim. No planets and no astronomical sun/moon imagery anywhere. No text, numbers, logos, watermark, labels, gray/white external background, no multiple cards. Symmetry and reference-like hourglass composition are more important than adding extra motifs.

## v2 · 深紫底粉金太阳月亮版（保留存档）

生成日期：2026-09-30。使用内置 image_gen 工具（imagegen 技能），按用户提供的深紫色塔罗图案参考重新制作。
源图：[sun-moon-card-back-v2.png](sun-moon-card-back-v2.png)。网站采用长边 1200 px 的哈希命名 WebP，数据版本 `2026.09.30.3`。
视觉：深紫黑底、亮粉色与淡金色细线、太阳月亮、上下月相、星点、植物纹样和双边框。
参考图仅作为风格参考，不复制其水印、文字或具体角色。

### v2 生成提示词

Use case: stylized-concept. Asset type: a single finished TAROT CARD BACK image for a website, flat print artwork. The attached image is a STYLE REFERENCE ONLY: reproduce its visual language of deep near-black plum purple, luminous hot rose-pink and soft pale-yellow ink, delicate occult botanical linework, moon phases, star speckles, tiny decorative markings and a thin geometric double frame with dotted beads. Create ONE original card back, portrait aspect ratio exactly 3:5, edge-to-edge artwork, no white or gray background around the card, no perspective, no mockup, no multiple cards. Keep the Sun and Moon theme: two elegantly engraved celestial Sun-and-crescent-Moon medallions toward opposite ends, connected by original graceful pink botanical stems and star constellations, a small central celestial rosette. Two-way 180-degree rotationally symmetric composition with matching upper and lower moon-phase ornaments, identical mirrored opposing medallions and equal borders, suitable for concealing card orientation. Color language should closely match the reference: dominant dark plum black background, vivid pink ornamental strokes, pale butter yellow stars and contour lines, a little muted violet. Crisp, fine hand-inked woodcut/screenprint drawing with hatching, ornate but clearly legible at small card size, flat matte ink finish. Avoid the previous worn brown parchment and large gold color blocks. Do not copy the sample's specific animals, creatures, text or logos. No text, letters, numbers, watermark, branding or external background. Opaque high-resolution image.

## v1 · 金色旧纸版（保留存档）

生成日期：2026-09-30。使用内置 image_gen 工具，imagegen 技能。
最终源图：`design/sun-moon-card-back.png`，网站压缩版本由素材脚本输出到 `media/v1/`。
参考太阳、月亮原牌面的旧纸与版画质感；原创背面不使用原牌背文件。
原始 `assets/塔罗牌背面.png` 保留，不参与当前下载包。

## 生成提示词

Use case: stylized-concept. Asset type: production tarot card BACK illustration for a vintage parchment tarot website. Primary request: design an original Sun and Moon tarot card back, replacing the old supplied card back. Input images: image 1 and image 2 are STYLE REFERENCES ONLY, showing aged parchment and detailed hand-colored woodcut tarot art; do not copy their characters or their printed titles. Create a flat full-bleed portrait rectangular card artwork, aspect ratio 3:5, straight-on with absolutely no perspective, no table, no outside scene, no mockup. Rich antique gold engraved celestial Sun and crescent Moon forms within a precise ornamental double frame, worn cream parchment edge, deep warm umber and midnight muted indigo interior, fine stars and etched orbital lines. Composition must be elegant and legible when reduced to small playing cards. Exactly 180-degree rotationally symmetric layout: repeated identical Sun-and-Moon medallions toward both ends, celestial ornament joining them, equal margins. Match the supplied faces' vintage ink hatching and parchment character but create a calmer original celestial pattern. No letters, numbers, text, brand, watermark, or card front labels. Opaque full card background. The illustration itself fills the entire image edge to edge.

## 分享图 · 中世纪油画风格

当前实现日期：2026-10-01。背景文件为 [medieval-oil-v1.png](../frontend/src/export/assets/medieval-oil-v1.png)，效果预览见 [share-oil-preview.png](share-oil-preview.png)。背景由 Vite 打包并随应用壳离线缓存，不属于 media 清单。

Canvas 使用古金棕或勃艮第红色调，叠加暗角、金线边饰与衬线标题，保留原始牌面及逆位方向。内容组件可以勾选和排序，标题、落款、日期、牌位与边饰可调整；问题与笔记每次默认关闭。输出宽度 1200 px，按字体测量长文，高度最多 13000 px。实现见 `frontend/src/export/share.ts` 和 `share-content.ts`，交互见 `frontend/src/features/ShareComposer.tsx`。
