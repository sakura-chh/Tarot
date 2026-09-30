# 原始素材核查与建议映射

核查日期：2026-09-30｜本表来自实际文件，不包含应用代码或生成素材。

## 1. 素材概况

- 目录：`assets/`。
- 共 79 个图片文件：78 张 JPG 牌面、1 张 PNG 牌背。
- 总大小：1,013,168,939 字节，约 1.013 GB / 966.23 MiB。
- 78 张牌面尺寸均为 2538×4208，纵向比例约 0.603。
- 牌背尺寸 1200×1200，有透明通道；目视可见水印及画布边距。
- 22 张大阿尔卡那；宝剑、权杖、星币、圣杯各 14 张。
- 78 张牌面的 SHA-256 均不同，没有发现完全相同字节的重复文件。
- 文件夹未包含牌义文本、音乐、音效、字体或素材授权说明。
- 下面的中文名和语义 ID 是开发建议；原文件名、字节数及哈希是实际核查结果。

## 2. 映射规则与异常

1. 文件数字前缀不是连续 0–77：权杖八使用 `41a`，不得用 parseInt 后做主键或自动排除。
2. 原始文件包含空格、英文标点、中文目录，以及 Card / card 大小写差异；开发生成稳定资源 URL，原图保留。
3. 正义在素材中编号 8，力量编号 11；以名称匹配牌义，显示编号沿用素材。
4. 小牌的原始前缀排序不是 Ace→2…10→宫廷牌；业务显示顺序使用单独 sort_order。
5. 牌背不属于 78 张卡牌集合，不参与洗牌或抽取。
6. 不从画风与编号直接推定牌组名称、牌义体系或授权。使用用户提供素材，出处资料状态单独记录。
7. 素材转换在后续实施阶段进行；本次未修改任何原图，也未去除水印。

## 3. 78 张牌面映射

| 顺序 | 建议 card_id | 中文名 | 原始文件 | 字节数 | SHA-256 |
|---:|---|---|---|---:|---|
| 0 | `major_fool` | 愚者 | [0_Major Arcana Tarot Card. Fool.jpg](../assets/0_Major%20Arcana%20Tarot%20Card.%20Fool.jpg) | 14405796 | `c16c3119ec0ef30366e9b3a32020d19672b1e434efc06486ea4d2c0b08e8c21e` |
| 1 | `major_magician` | 魔术师 | [1_Major Arcana Tarot Card. Magician.jpg](../assets/1_Major%20Arcana%20Tarot%20Card.%20Magician.jpg) | 13577949 | `bd149ff2d9df93129b2f6b99c1c71d10f2e57a666b8e0cfae76890ba801c2962` |
| 2 | `major_high_priestess` | 女祭司 | [2_Major Arcana Tarot Card. High Priestess.jpg](../assets/2_Major%20Arcana%20Tarot%20Card.%20High%20Priestess.jpg) | 12681982 | `a703d4ef1298359a79c1458b336d5d990ff58cf75dc003817230085b6a4c6b1c` |
| 3 | `major_empress` | 女皇 | [3_Major Arcana Tarot Card. Empress.jpg](../assets/3_Major%20Arcana%20Tarot%20Card.%20Empress.jpg) | 13119517 | `cb9f9ec9e2e2fe0de180fae673d3edc01932f9456be7a15f5305df69feb109d5` |
| 4 | `major_emperor` | 皇帝 | [4_Major Arcana Tarot card. Emperor.jpg](../assets/4_Major%20Arcana%20Tarot%20card.%20Emperor.jpg) | 12987241 | `ee7c1d09bf283316d6c4a0c3852a89d3465235781c021d605828176f36a9b87b` |
| 5 | `major_hierophant` | 教皇 | [5_Major Arcana Tarot Card. Hierophant.jpg](../assets/5_Major%20Arcana%20Tarot%20Card.%20Hierophant.jpg) | 13189381 | `57bb7bdbe2c191c7cb31a33b1a3cf66bbd45881e2385fe2d7c4d3f807a917299` |
| 6 | `major_lovers` | 恋人 | [6_Major Arcana Tarot card. Lovers.jpg](../assets/6_Major%20Arcana%20Tarot%20card.%20Lovers.jpg) | 13813350 | `17d22a9e2ecf61bfc03e833b916d1c082afc3f0bfd1fddc53176f3086206c6e8` |
| 7 | `major_chariot` | 战车 | [7_Major Arcana Tarot card. Chariot.jpg](../assets/7_Major%20Arcana%20Tarot%20card.%20Chariot.jpg) | 13545206 | `0b6b25ae549cc777e01b47d6b14174e27dfa4225a03add98f13b89913ebc5486` |
| 8 | `major_justice` | 正义 | [8_Major Arcana Tarot card. Justice.jpg](../assets/8_Major%20Arcana%20Tarot%20card.%20Justice.jpg) | 13674235 | `c6ce32967971877a9077115cf3c0994c898d2231038485651b5f926408dee6c0` |
| 9 | `major_hermit` | 隐者 | [9_Major Arcana Tarot card. Hermit.jpg](../assets/9_Major%20Arcana%20Tarot%20card.%20Hermit.jpg) | 13190743 | `743885c0181ec61330479cc5eec2f3dc0254edaaaad5dc59e44db2a4bc340cfc` |
| 10 | `major_wheel_of_fortune` | 命运之轮 | [10_Major Arcana Tarot Card. Wheel of Fortune.jpg](../assets/10_Major%20Arcana%20Tarot%20Card.%20Wheel%20of%20Fortune.jpg) | 12070723 | `a52d622b9164cca261487e768c006c4433de45b226c1e57578702ae52e1a2a25` |
| 11 | `major_strength` | 力量 | [11_Major Arcana Tarot Card. Strength.jpg](../assets/11_Major%20Arcana%20Tarot%20Card.%20Strength.jpg) | 13238809 | `cc9cc2f00852daa48fe873c1f06dc43b86e6b621c3a4f23e9529ad51949bf344` |
| 12 | `major_hanged_man` | 倒吊人 | [12_Major Arcana Tarot Card. The Hanged Man.jpg](../assets/12_Major%20Arcana%20Tarot%20Card.%20The%20Hanged%20Man.jpg) | 12855070 | `dc3c54f00ce7e356535a7dff8eff2cef412916d9f5031da418dfeb2982c011e7` |
| 13 | `major_death` | 死神 | [13_Major Arcana Tarot Card. Death.jpg](../assets/13_Major%20Arcana%20Tarot%20Card.%20Death.jpg) | 12881991 | `f770a9a599fa35b113f931e3026fd34f9771116dc9792f0471a91feaf5e120c9` |
| 14 | `major_temperance` | 节制 | [14_Major Arcana Tarot Card. Temperance.jpg](../assets/14_Major%20Arcana%20Tarot%20Card.%20Temperance.jpg) | 13244873 | `407ee7f1ff577e1cfdf5e2399b6f925eebb177517041009598b351fe920e5c53` |
| 15 | `major_devil` | 恶魔 | [15_Major Arcana Tarot Card. Devil.jpg](../assets/15_Major%20Arcana%20Tarot%20Card.%20Devil.jpg) | 11848075 | `1d4692ea45aec46c4e606037773351be5c6da100684d80b691dce891aa210a27` |
| 16 | `major_tower` | 高塔 | [16_Major Arcana Tarot Card. Tower.jpg](../assets/16_Major%20Arcana%20Tarot%20Card.%20Tower.jpg) | 12575637 | `f48d0f64b9808b87e338f70fbeea80ded95067480359f9e960905b770e93b234` |
| 17 | `major_star` | 星星 | [17_Major Arcana Tarot Card. Star.jpg](../assets/17_Major%20Arcana%20Tarot%20Card.%20Star.jpg) | 13046247 | `1b5b60349e2d598b2dc01b0f766609a4fed380a87980a42f631f0ad408f041da` |
| 18 | `major_moon` | 月亮 | [18_Major Arcana Tarot Card. Moon.jpg](../assets/18_Major%20Arcana%20Tarot%20Card.%20Moon.jpg) | 12995145 | `2ebd8ee4975ceaec5e1161f1d0881ff021cf5ec5306719cef1b1618aa91a923a` |
| 19 | `major_sun` | 太阳 | [19_Major Arcana Tarot Card. Sun.jpg](../assets/19_Major%20Arcana%20Tarot%20Card.%20Sun.jpg) | 13145050 | `7444d5f06822456712cd692e9d93631ee0b843179c95deae5d25145097e57bbb` |
| 20 | `major_judgement` | 审判 | [20_Major Arcana Tarot Card. Judgement.jpg](../assets/20_Major%20Arcana%20Tarot%20Card.%20Judgement.jpg) | 12987029 | `85d77ca438e2c3d0bd28f742e83d3d4a04398301a5229d586610f959ea6a4bf2` |
| 21 | `major_world` | 世界 | [21_Major Arcana Tarot Card. World.jpg](../assets/21_Major%20Arcana%20Tarot%20Card.%20World.jpg) | 13271854 | `f7d731003f2bd8b2f95f1a13bb6c27960a22d99b79fc56f6062ae82c5889310a` |
| 22 | `swords_ace` | 宝剑王牌 | [22_Minor Arcana Tarot Card. Ace of Swords.jpg](../assets/22_Minor%20Arcana%20Tarot%20Card.%20Ace%20of%20Swords.jpg) | 13513569 | `e8574f3ab56157d3c1e805b786d11bee61913e0c579227746d89ce0791b6d388` |
| 23 | `swords_02` | 宝剑二 | [27_Minor Arcana Tarot Card. Two of Swords.jpg](../assets/27_Minor%20Arcana%20Tarot%20Card.%20Two%20of%20Swords.jpg) | 12150829 | `5b66033256e5b4d06f142c01bf2e6fe856d6206b8cab7cf928841cb8ea8b3230` |
| 24 | `swords_03` | 宝剑三 | [28_Minor Arcana Tarot Card. Three of Swords.jpg](../assets/28_Minor%20Arcana%20Tarot%20Card.%20Three%20of%20Swords.jpg) | 12596016 | `595799439b75f9f2eb557d2c3fa081b8e545e77ff1b3962d056cb8fc0b258b95` |
| 25 | `swords_04` | 宝剑四 | [29_Minor Arcana Tarot Card. Four of Swords.jpg](../assets/29_Minor%20Arcana%20Tarot%20Card.%20Four%20of%20Swords.jpg) | 13150463 | `343511a0f18a359e64eaf609fabae1c044f9bfea4e78c6548bdbd7c1d853f41f` |
| 26 | `swords_05` | 宝剑五 | [30_Minor Arcana Tarot Card. Five of Swords.jpg](../assets/30_Minor%20Arcana%20Tarot%20Card.%20Five%20of%20Swords.jpg) | 13427397 | `df8621c07aa282e58eb273da11f09649903a6d5c8ca083a1b5a40896972dd831` |
| 27 | `swords_06` | 宝剑六 | [31_Minor Arcana Tarot Card. Six of Swords.jpg](../assets/31_Minor%20Arcana%20Tarot%20Card.%20Six%20of%20Swords.jpg) | 12699272 | `09e00006ea73f6a542838de5beb2d9074696fd166e18984c6f9450e559147dd3` |
| 28 | `swords_07` | 宝剑七 | [32_Minor Arcana Tarot Card. Seven of Swords.jpg](../assets/32_Minor%20Arcana%20Tarot%20Card.%20Seven%20of%20Swords.jpg) | 13453038 | `b3ba2488b1b2c2341aba20a566a6fbc4b1f3a2ff7b5a702bbf7ba613e13858b4` |
| 29 | `swords_08` | 宝剑八 | [33_Minor Arcana Tarot Card. Eight of Swords.jpg](../assets/33_Minor%20Arcana%20Tarot%20Card.%20Eight%20of%20Swords.jpg) | 14119248 | `4cb692ddf49363b100464deb55b733e7264c8b156e61d609ad2e42a6282145be` |
| 30 | `swords_09` | 宝剑九 | [34_Minor Arcana Tarot Card. Nine of Swords.jpg](../assets/34_Minor%20Arcana%20Tarot%20Card.%20Nine%20of%20Swords.jpg) | 12298767 | `0b586bfc09de7d39be52f3c0a4b063f0a6737f55bc01fecee237c6a1df3b4196` |
| 31 | `swords_10` | 宝剑十 | [35_Minor Arcana Tarot Card. Ten of Swords.jpg](../assets/35_Minor%20Arcana%20Tarot%20Card.%20Ten%20of%20Swords.jpg) | 12713004 | `b1be6442d4f3621d5e2ba8c2f7d4e9a2459b44d7083b40da96ebfedadc514b2b` |
| 32 | `swords_page` | 宝剑侍从 | [26_Minor Arcana Tarot Card. Page of Swords.jpg](../assets/26_Minor%20Arcana%20Tarot%20Card.%20Page%20of%20Swords.jpg) | 12270428 | `6d873129770d82b94e59d311141b1fa0f1e5d2f1d8de66937fefd93142b33f10` |
| 33 | `swords_knight` | 宝剑骑士 | [25_Minor Arcana Tarot Card. Knight of Swords.jpg](../assets/25_Minor%20Arcana%20Tarot%20Card.%20Knight%20of%20Swords.jpg) | 12881158 | `ffd96f50acb3d13addb95d099751d750f0513b26f442f81dc8523ceed8fa437b` |
| 34 | `swords_queen` | 宝剑皇后 | [24_Minor Arcana Tarot Card. Queen of Swords.jpg](../assets/24_Minor%20Arcana%20Tarot%20Card.%20Queen%20of%20Swords.jpg) | 13179851 | `0b52cd32feb77ae0a24bbf24bf9e251e170c8548732882a5a57136dda4372928` |
| 35 | `swords_king` | 宝剑国王 | [23_Minor Arcana Tarot Card. King of Swords.jpg](../assets/23_Minor%20Arcana%20Tarot%20Card.%20King%20of%20Swords.jpg) | 13108079 | `3f0502f2073e2016a33c3fb896c87ebace72644fde7469fb7cd69e3235f152d8` |
| 36 | `wands_ace` | 权杖王牌 | [37_Minor Arcana Tarot Card. Ace of Wands.jpg](../assets/37_Minor%20Arcana%20Tarot%20Card.%20Ace%20of%20Wands.jpg) | 12495775 | `125b0575898c5d392f2ab8328b840504360d23baff007568c1d2e2b850430551` |
| 37 | `wands_02` | 权杖二 | [48_Minor Arcana Tarot Card. Two of Wands.jpg](../assets/48_Minor%20Arcana%20Tarot%20Card.%20Two%20of%20Wands.jpg) | 12422043 | `693c829ddce1fcd5e9068272497c265b63fa5ab2d311b2700f5aa43e7e03d03f` |
| 38 | `wands_03` | 权杖三 | [47_Minor Arcana Tarot Card. Three of Wands.jpg](../assets/47_Minor%20Arcana%20Tarot%20Card.%20Three%20of%20Wands.jpg) | 13072854 | `766a072cc05e0e78d89da618612a1aa1bb5a33d18251bb60c44f2c12ecda1a52` |
| 39 | `wands_04` | 权杖四 | [46_Minor Arcana Tarot Card. Four of Wands.jpg](../assets/46_Minor%20Arcana%20Tarot%20Card.%20Four%20of%20Wands.jpg) | 13451981 | `44144b16669b764ae590566d6430bf2bf6fb294ea7e0e93fac84cb9befb46153` |
| 40 | `wands_05` | 权杖五 | [45_Minor Arcana Tarot Card. Five of Wands.jpg](../assets/45_Minor%20Arcana%20Tarot%20Card.%20Five%20of%20Wands.jpg) | 12832436 | `e17270e26036f3e6f123fb94474ebdf934ee53ba122dd5ccaf75bda0206de770` |
| 41 | `wands_06` | 权杖六 | [44_Minor Arcana Tarot Card. Six of Wands.jpg](../assets/44_Minor%20Arcana%20Tarot%20Card.%20Six%20of%20Wands.jpg) | 13004944 | `fb429262fc0026849ee8fcd5a5c3c59ca4b79d92439716f696abaf158d2eb670` |
| 42 | `wands_07` | 权杖七 | [43_Minor Arcana Tarot Card. Seven of Wands.jpg](../assets/43_Minor%20Arcana%20Tarot%20Card.%20Seven%20of%20Wands.jpg) | 13307112 | `b1046e6f23aa623374cf117b2dd4b6a51dd27b047ef7086593ddfa12c8249c02` |
| 43 | `wands_08` | 权杖八 | [41a_Minor Arcana Tarot Card. Eight of Wands.jpg](../assets/41a_Minor%20Arcana%20Tarot%20Card.%20Eight%20of%20Wands.jpg) | 13588081 | `3f20fc4541e732a8705eb15c442df5aad9440f1335be90d237e77f739aa5da89` |
| 44 | `wands_09` | 权杖九 | [42_Minor Arcana Tarot Card. Nine of Wands.jpg](../assets/42_Minor%20Arcana%20Tarot%20Card.%20Nine%20of%20Wands.jpg) | 13210912 | `84973332b7e484531ac834ad3e401781f9f96323950ca8aa1d303b998909f587` |
| 45 | `wands_10` | 权杖十 | [36_Minor Arcana Tarot Card. Ten of Wands.jpg](../assets/36_Minor%20Arcana%20Tarot%20Card.%20Ten%20of%20Wands.jpg) | 13214122 | `67c068c41f5d434bd08c1e0803ecfbef603fe7f7734e1cadaaf3a459e6003d62` |
| 46 | `wands_page` | 权杖侍从 | [41_Minor Arcana Tarot Card. Page of Wands.jpg](../assets/41_Minor%20Arcana%20Tarot%20Card.%20Page%20of%20Wands.jpg) | 12490754 | `5327ca4bcb8f69a8c56d0f0b3c3b8c3631e151051065125626fa8f2d58593bc2` |
| 47 | `wands_knight` | 权杖骑士 | [40_Minor Arcana Tarot Card. Knight of Wands.jpg](../assets/40_Minor%20Arcana%20Tarot%20Card.%20Knight%20of%20Wands.jpg) | 13717478 | `475e9591e8ebbbee1a4527c6ccedc8a66b5e51b413fe2a22f1c55eaf9913c92a` |
| 48 | `wands_queen` | 权杖皇后 | [39_Minor Arcana Tarot Card. Queen of Wands.jpg](../assets/39_Minor%20Arcana%20Tarot%20Card.%20Queen%20of%20Wands.jpg) | 13394119 | `f8c1293ce38b99e2f1eb2502005ff46f46ffdd9b3139e5ef8e122921fd7f9359` |
| 49 | `wands_king` | 权杖国王 | [38_Minor Arcana Tarot Card. King of Wands.jpg](../assets/38_Minor%20Arcana%20Tarot%20Card.%20King%20of%20Wands.jpg) | 12999493 | `bf30adc74a5e6e73760e8ee29fd8c6f17898806fc493f2519987e54ef5b9a23a` |
| 50 | `pentacles_ace` | 星币王牌 | [49_Minor Arcana Tarot Card. Ace of Pentacles.jpg](../assets/49_Minor%20Arcana%20Tarot%20Card.%20Ace%20of%20Pentacles.jpg) | 12581122 | `53e91dfc62499674e96fcef753e94816cb5c25e510857d84bb095d5b23300edd` |
| 51 | `pentacles_02` | 星币二 | [62_Minor Arcana Tarot Card. Two of Pentacles.jpg](../assets/62_Minor%20Arcana%20Tarot%20Card.%20Two%20of%20Pentacles.jpg) | 12623671 | `7dce8e8701a64157838cf8d9d931f329fc0ab4de1a6ef93a8ebbc968d879d61e` |
| 52 | `pentacles_03` | 星币三 | [61_Minor Arcana Tarot Card. Three of Pentacles.jpg](../assets/61_Minor%20Arcana%20Tarot%20Card.%20Three%20of%20Pentacles.jpg) | 12504620 | `25c80ffdfdd769606dcf7235bc97106e4e8a7737f37c75e8c58fe87071a4b77d` |
| 53 | `pentacles_04` | 星币四 | [60_Minor Arcana Tarot Card. Four of Pentacles.jpg](../assets/60_Minor%20Arcana%20Tarot%20Card.%20Four%20of%20Pentacles.jpg) | 12612633 | `fc2589fc957d3a484ed50862ed878b69a3f83530c6b11db3ae89c044ff77841d` |
| 54 | `pentacles_05` | 星币五 | [59_Minor Arcana Tarot Card. Five of Pentacles.jpg](../assets/59_Minor%20Arcana%20Tarot%20Card.%20Five%20of%20Pentacles.jpg) | 12546716 | `9d15950a32a78f828b8e60b4f455fa9e6d8797214f6dfb4b307add80fadd6a5e` |
| 55 | `pentacles_06` | 星币六 | [58_Minor Arcana Tarot Card. Six of Pentacles.jpg](../assets/58_Minor%20Arcana%20Tarot%20Card.%20Six%20of%20Pentacles.jpg) | 12706535 | `f4c6cdcf30b2c1adeb89951ea50bb34716a0003d8763bde8f349692550ba353e` |
| 56 | `pentacles_07` | 星币七 | [57_Minor Arcana Tarot Card. Seven of Pentacles.jpg](../assets/57_Minor%20Arcana%20Tarot%20Card.%20Seven%20of%20Pentacles.jpg) | 12038491 | `eb173f6c9f74b87f36b6dbc580816d93252c345d3a021f0de76d1de0033ae044` |
| 57 | `pentacles_08` | 星币八 | [56_Minor Arcana Tarot Card. Eight of Pentacles.jpg](../assets/56_Minor%20Arcana%20Tarot%20Card.%20Eight%20of%20Pentacles.jpg) | 12189533 | `1a8f4f18ace509039ecdee79a33347662bd948e482ba6eb9df9a659b7c13229b` |
| 58 | `pentacles_09` | 星币九 | [55_Minor Arcana Tarot Card. Nine of Pentacles.jpg](../assets/55_Minor%20Arcana%20Tarot%20Card.%20Nine%20of%20Pentacles.jpg) | 13119479 | `e7436b71e0d5a10152e290dad165a2e68e05d4c373e81d008924a9f736a227c8` |
| 59 | `pentacles_10` | 星币十 | [54_Minor Arcana Tarot Card. Ten of Pentacles.jpg](../assets/54_Minor%20Arcana%20Tarot%20Card.%20Ten%20of%20Pentacles.jpg) | 12767352 | `e8260488e7770df795b6437200e1a3cb3ad24be34ed021884957270528b1b31e` |
| 60 | `pentacles_page` | 星币侍从 | [53_Minor Arcana Tarot Card. Page of Pentacles.jpg](../assets/53_Minor%20Arcana%20Tarot%20Card.%20Page%20of%20Pentacles.jpg) | 12491568 | `08d4b731087a3dd933e03d53fc96c23c3b43ef094536df6aa3610cb6fa939ad9` |
| 61 | `pentacles_knight` | 星币骑士 | [52_Minor Arcana Tarot Card. Knight of Pentacles.jpg](../assets/52_Minor%20Arcana%20Tarot%20Card.%20Knight%20of%20Pentacles.jpg) | 13360559 | `14f1de69db38b01246d1f0703d7c427735c702dd01834cb23672834aa424fa6e` |
| 62 | `pentacles_queen` | 星币皇后 | [51_Minor Arcana Tarot Card. Queen of Pentacles.jpg](../assets/51_Minor%20Arcana%20Tarot%20Card.%20Queen%20of%20Pentacles.jpg) | 13045457 | `850982f89dab1dff6740a0c9c4bf6e92843ef772d5af5fce0d3df0f166b00acf` |
| 63 | `pentacles_king` | 星币国王 | [50_Minor Arcana Tarot Card. King of Pentacles.jpg](../assets/50_Minor%20Arcana%20Tarot%20Card.%20King%20of%20Pentacles.jpg) | 12681473 | `8f8244c211d9cca890219cbd59bfea034188f5f0a87cbe3d49d1dd8d566f95a6` |
| 64 | `cups_ace` | 圣杯王牌 | [63_Minor Arcana Tarot Card. Ace of Cups.jpg](../assets/63_Minor%20Arcana%20Tarot%20Card.%20Ace%20of%20Cups.jpg) | 13744523 | `dd533fead5b162316d46f8eb7084d43c7325fdec6cf7a1cc2c26e110d7d4283b` |
| 65 | `cups_02` | 圣杯二 | [64_Minor Arcana Tarot Card. Two of Cups.jpg](../assets/64_Minor%20Arcana%20Tarot%20Card.%20Two%20of%20Cups.jpg) | 12799736 | `c8ba0c1eb12b72a96e07b5eac2dbd7840bfeb05ace3300a5531e923a9cbf5197` |
| 66 | `cups_03` | 圣杯三 | [65_Minor Arcana Tarot Card. Three of Cups.jpg](../assets/65_Minor%20Arcana%20Tarot%20Card.%20Three%20of%20Cups.jpg) | 13339282 | `91fe35ef03ace7073f586ea2c82deaec45e1dc6ec683c6872fdc83b61462b04a` |
| 67 | `cups_04` | 圣杯四 | [66_Minor Arcana Tarot Card. Four of Cups.jpg](../assets/66_Minor%20Arcana%20Tarot%20Card.%20Four%20of%20Cups.jpg) | 12142199 | `465f7d0609dd4e9d4b89a9f3ac8abc9b3f5721eba14f2f29ed6e8bb8b260a628` |
| 68 | `cups_05` | 圣杯五 | [67_Minor Arcana Tarot Card. Five of Cups.jpg](../assets/67_Minor%20Arcana%20Tarot%20Card.%20Five%20of%20Cups.jpg) | 13798557 | `d475cf6c882b7c69047927a5930a206165b802d7767a39f5ef7c8a5a1420d3c1` |
| 69 | `cups_06` | 圣杯六 | [68_Minor Arcana Tarot Card. Six of Cups.jpg](../assets/68_Minor%20Arcana%20Tarot%20Card.%20Six%20of%20Cups.jpg) | 13190031 | `e9b0064e6e011c2fa8f12574f7e14be119e179f741bbc0b13f1be41272ad880c` |
| 70 | `cups_07` | 圣杯七 | [69_Minor Arcana Tarot Card. Seven of Cups.jpg](../assets/69_Minor%20Arcana%20Tarot%20Card.%20Seven%20of%20Cups.jpg) | 12895727 | `0755b02c89e88e0254b69d38f461f80103b0ecc051b4b78cd8592262de7b2cd3` |
| 71 | `cups_08` | 圣杯八 | [70_Minor Arcana Tarot Card. Eight of Cups.jpg](../assets/70_Minor%20Arcana%20Tarot%20Card.%20Eight%20of%20Cups.jpg) | 12002974 | `d613e6c98ca774149c3b45a8c94e78e43d7576519758eb3c370640e784b1b0af` |
| 72 | `cups_09` | 圣杯九 | [71_Minor Arcana Tarot Card. Nine of Cups.jpg](../assets/71_Minor%20Arcana%20Tarot%20Card.%20Nine%20of%20Cups.jpg) | 13150379 | `5691470d411193dabc48c5c17324bb73ad74fc06d1c03a8fc45ad393e79a04b2` |
| 73 | `cups_10` | 圣杯十 | [72_Minor Arcana Tarot Card. Ten of Cups.jpg](../assets/72_Minor%20Arcana%20Tarot%20Card.%20Ten%20of%20Cups.jpg) | 12925830 | `354b893e67f926e5426d41ab0699caac9241d225bd02cf85c4ec9c6fb05ef752` |
| 74 | `cups_page` | 圣杯侍从 | [74_Minor Arcana Tarot Card. Page of Cups.jpg](../assets/74_Minor%20Arcana%20Tarot%20Card.%20Page%20of%20Cups.jpg) | 12901604 | `6a7b06e9ac1d4547a55370728f180b7d7de49616a0a308cdf3ed7fa85a808da5` |
| 75 | `cups_knight` | 圣杯骑士 | [73_Minor Arcana Tarot Card. Knight of Cups.jpg](../assets/73_Minor%20Arcana%20Tarot%20Card.%20Knight%20of%20Cups.jpg) | 13255106 | `2ea8101fbc1a8ca51d9a100e30eb71c30e79770ff9b9ed614f93f8c13f664129` |
| 76 | `cups_queen` | 圣杯皇后 | [76_Minor Arcana Tarot Card. Queen of Cups.jpg](../assets/76_Minor%20Arcana%20Tarot%20Card.%20Queen%20of%20Cups.jpg) | 12514840 | `a8a42552917432d5870adb01d836607f8705d1a9a38c01aeb3c1e701c8b6175c` |
| 77 | `cups_king` | 圣杯国王 | [75_Minor Arcana Tarot Card. King of Cups.jpg](../assets/75_Minor%20Arcana%20Tarot%20Card.%20King%20of%20Cups.jpg) | 13300166 | `dbccc66546454fa98521cc69ba73561323ba0abbe512fdd34b694feab20ddc68` |

## 4. 牌背

原背面仅保留存档。当前网站按用户最新参考图使用 [深紫底粉金对称沙漏牌背](../design/hourglass-card-back.png)，生成提示词见 [设计记录](../design/README.md)。原始素材数量仍为 79 个。

| 建议资源 ID | 文件 | 尺寸 | 字节数 | SHA-256 |
|---|---|---|---:|---|
| `card_back` | [塔罗牌背面.png](../assets/%E5%A1%94%E7%BD%97%E7%89%8C%E8%83%8C%E9%9D%A2.png) | 1200×1200 | 829650 | `37bcb3b2e2b05abe2bef89f548295498a5c27166b21b9b9cdae92f90a1a402b4` |

## 5. 后续转换规格

展示图和缩略图另存生成目录，采用 card_id 与内容哈希命名。生成脚本输出实际尺寸、bytes、SHA-256、原图映射和下载清单。卡牌图案及图内英文牌名保持完整，正面不裁切；牌背先验证在竖版容器中的可视范围，再调整展示窗口。

资源预算和验收见 [开发与验收](05-delivery-and-acceptance.md)，图片显示方式见 [设计与交互](04-design-and-interaction.md)。
