# 牌义内容与参考资料

日期：2026-10-01｜数据版本：2026.10.01.1｜meaning_version：2

78 张牌参考用户指定的 [神婆网牌意索引](https://www.shenpowang.com/taluopai/jieshi/)及其链接文章重新整理。发布内容是项目自己的中文归纳，不是网站全文转载；每张牌的 `meaning_source` 保留对应文章名称及 URL，详情中可直接打开参考资料。

完整模式指完整展示本项目整理后的全部小节：牌义概览、传统牌面象征、当前方向综合解读、感情与关系、工作与学业、行动建议。精简模式显示相应方向的速读摘要与关键词。正逆位和详细程度独立切换；每次打开卡牌或刷新默认精简，不记忆上一次的阅读模式。

## 内容文件与契约

- `backend/content/meanings_major.json`：22 张大阿尔卡那。
- `backend/content/meanings_wands_cups.json`：28 张权杖与圣杯。
- `backend/content/meanings_swords_pentacles.json`：28 张宝剑与星币。
- `backend/content/meanings.py`：大牌中文名称、内容导入与完整性校验。
- `backend/content/cards.json`：生成后的公开卡牌数据。

源文件使用语义 ID，每牌包含 `summary_upright` / `summary_reversed`、两组关键词、`overview` / `symbolism`、`upright` / `reversed`（`general`、`love`、`career`、`advice`）、`source`。生成时摘要映射为 `meaning_upright` / `meaning_reversed`，分主题正文映射为 `meaning_details`，来源映射为 `meaning_source`。

新增字段保持兼容现有数据结构，schema_version 仍为 1。旧记录在结果页及分享中保留原文字快照；从抽牌结果、历史、图鉴或查询打开卡牌详情时，统一按语义 ID 读取当前图鉴的完整释义。当前图鉴找不到卡牌时才回退到原快照；详情查阅不会改写抽牌结果、方向、问题或笔记。当前内容的 `content_status` 仍为 `draft`，表示尚待用户内容审核，不等同于缺失数据。

## 对应关系与整理原则

按名称而非文章编号建立关联：参考站力量为 8、正义为 11；项目素材正义为 8、力量为 11。同名牌的语义 ID 保持不变。参考站“愚人 / 女祭祀 / 隐士 / 魔鬼”对应项目“愚者 / 女祭司 / 隐者 / 恶魔”，“王后 / 一”对应“皇后 / 王牌”。

牌面象征采用参考文章中的常见意象，作为理解线索；图鉴的实际图片仍使用原始素材。不同文章对逆位存在多种说法时，保留合理的可能性并结合情境表达。感情和工作内容采用反思与行动措辞；不将牌面用于断言医学状况、死亡、不忠或必然获利。

星币侍从的 [索引文章](https://www.shenpowang.com/taluopai/jieshi/d360646.html)正文不完整，逆位补充参考同站的 [星币侍从正逆位教程](https://www.shenpowang.com/taluopai/jiaocheng/d382223.html)。其卡牌主来源链接仍对应索引文章，这一补充在此单独记录。

## 更新与离线

修改上述 JSON 后，先递增 `backend/scripts/prepare_assets.py` 的 `VERSION`；否则已缓存相同数据版本的浏览器会继续复用旧内容。再执行 `.venv/bin/python backend/scripts/prepare_assets.py --content-only`，复用当前媒体，生成新哈希数据包及 `media/manifest.json`，更新 `backend/content/cards.json`。完整素材生成仍可执行不带参数的命令。

数据版本变化让在线浏览器加载新内容；完整释义与摘要进入同一离线包，不依赖运行时访问参考站。此前下载的离线包需要在设置中更新，旧历史快照保持原来的文字。

## 牌阵综合解读

`frontend/src/domain/interpretation.ts` 为 78 张牌的两种方向分别整理短主题，并以本地规则连接牌阵。三张牌阵尊重实际位置与顺序；自由抽取归纳共同主题，不把抽取顺序解释为时间线。独立正文分为整体脉络、牌间联系和行动建议，建议牌位优先用于行动段，其他模式选择需要照顾或缓解压力的角度。完整牌义中的行动建议优先使用当前图鉴内容，缺失时按已有主题回退。

综合解读是可重复的本地整理，不调用 AI、不上传个人问题或笔记，也不修改保存的抽牌快照。历史记录可使用当前图鉴主题与建议重新展示；只有所有实际卡牌都揭晓后才生成，多张牌的未揭晓内容不会提前泄露。
