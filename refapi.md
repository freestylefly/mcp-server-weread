# 获取书架所有书籍信息
Request:https://weread.qq.com/web/shelf/sync
Response:
{
  "pureBookCount": 369,
  "bookCount": 369,
  "bookProgress": [  // 所有书籍的阅读进度信息
    {
      "bookId": "25462590",
      "progress": 0,
      "chapterUid": 33,
      "chapterOffset": 2239,
      "chapterIdx": 33,
      "appId": "3353137241554521178831221182",
      "updateTime": 1630036453,
      "readingTime": 905,
      "synckey": 1533826208
    },
    {
      "bookId": "674048",
      "progress": 100,
      "chapterUid": -2147473635,
      "chapterOffset": 0,
      "chapterIdx": 0,
      "appId": "3353137241554521178831221182",
      "updateTime": 1691553901,
      "readingTime": 60937,
      "synckey": 622417344
    },
    {...}
  ],
  "synckey": 1746615117,
  "removed": [],
  "lectureRemoved": [],
  "archive": [  //书架的书单分类（每个书单下的bookIds就是这个书单下的书籍id）
    {
      "archiveId": 1577525704,
      "name": "思考与生活",
      "bookIds": [
        "3300038402",
        "CB_7ZE2uC2tpC4r6of6okE7DDuH",
        "26934843",
        "27371794",
        "22297605",
        "40457732",
        "3300048761",
        "695126",
        "635922",
        "22717294",
        "3300102987",
        "31144247",
        "32307641",
        "30914575",
        "27256052",
        "926781",
        "924614",
        "921080",
        "26406758",
        "856239",
        "30730465",
        "3300079777",
        "857527",
        "30887804",
        "837932",
        "908161",
        "26307930",
        "921568",
        "921826",
        "41147996",
        "41521586",
        "216212",
        "3300056238",
        "3300018688",
        "3300050528",
        "23723810",
        "23691233",
        "44000669",
        "916688",
        "CB_FjNDOrDPjB4g6Xu6YI",
        "237732",
        "42766056",
        "39136896",
        "855327"
      ],
      "removed": [],
      "lectureBookIds": [],
      "lectureRemoved": []
    },
    {
      "archiveId": 1584375687,
      "name": "思维能力",
      "bookIds": [
        "909892",
        "566431",
        ...]
    }
  ],
  "removedArchive": [],
  "books": [   //所有书籍详细信息
    {
      "bookId": "3300079777",
      "title": "佛陀之心",
      "author": "一行禅师",
      "translator": "方怡蓉",
      "cover": "https://cdn.weread.qq.com/weread/cover/38/cpplatform_1efkwdszvystemugkexfxd/t6_cpplatform_1efkwdszvystemugkexfxd1701138290.jpg",
      "version": 184669923,
      "format": "epub",
      "type": 0,
      "price": 21.99,
      "originalPrice": 0,
      "soldout": 0,
      "bookStatus": 1,
      "payingStatus": 2,
      "payType": 1048577,
      "lastChapterCreateTime": 1701138295,
      "centPrice": 2199,
      "finished": 1,
      "maxFreeChapter": 9,
      "maxFreeInfo": {
        "maxFreeChapterIdx": 9,
        "maxFreeChapterUid": 9,
        "maxFreeChapterRatio": 30
      },
      "free": 0,
      "mcardDiscount": 0,
      "ispub": 1,
      "extra_type": 7,
      "updateTime": 1701206578,
      "publishTime": "2010-10-01 00:00:00",
      "category": "哲学宗教-宗教",
      "categories": [
        {
          "categoryId": 600000,
          "subCategoryId": 600010,
          "categoryType": 0,
          "title": "哲学宗教-宗教"
        },
        {
          "categoryId": 1000000,
          "subCategoryId": 1000003,
          "categoryType": 0,
          "title": "个人成长-情绪心灵"
        }
      ],
      "hasLecture": 0,
      "lastChapterIdx": 34,
      "paperBook": {
        "skuId": ""
      },
      "copyrightChapterUids": [2],
      "blockSaveImg": 1,
      "language": "zh",
      "isTraditionalChinese": false,
      "hideUpdateTime": false,
      "isEPUBComics": 0,
      "isVerticalLayout": 0,
      "isShowTTS": 1,
      "webBookControl": 0,
      "selfProduceIncentive": false,
      "isAutoDownload": 1,
      "showLectureButton": 1,
      "secret": 0,
      "readUpdateTime": 1741506226,
      "finishReading": 1,
      "paid": 1
    },
    {
      "bookId": "921826",
      "title": "心流：最优体验心理学",
      "author": "米哈里·契克森米哈赖",
      "translator": "张定绮",
      "cover": "https://wfqqreader-1252317822.image.myqcloud.com/cover/826/921826/t6_921826.jpg",
      "version": 303293008,
      "format": "epub",
      "type": 0,
      "price": 29.4,
      "originalPrice": 0,
      "soldout": 0,
      "bookStatus": 1,
      "payingStatus": 2,
      "payType": 1048577,
      "lastChapterCreateTime": 1681145102,
      "centPrice": 2940,
      ...
      }
  ],
  "lectureBooks": [],
  "lectureSynckey": 1746623623,
  "lectureUpdate": [],
  "mp": {    //微信公众号
    "show": 1,
    "book": {
      "bookId": "mpbook",
      "title": "文章收藏",
      "cover": "https://weread-1258476243.file.myqcloud.com/app/assets/bookcover/book_cover_app_favorite_articles.png",
      "secret": 1,
      "payType": 32,
      "paid": 0,
      "updateTime": 1629705470,
      "readUpdateTime": 0,
      "isTop": false
    }
  }

# 获取有阅读笔记的书籍清单，其中sort 是该本书最后笔记更新时间。
Request:https://weread.qq.com/api/user/notebook
Response:
{
  "synckey": 1743773721,
  "totalBookCount": 208,
  "noBookReviewCount": 0,
  "books": [
    {
      "bookId": "27416212",
      "book": {
        "bookId": "27416212",
        "title": "隐藏的自我",
        "author": "大卫·伊格曼　",
        "translator": "钱静",
        "cover": "https://cdn.weread.qq.com/weread/cover/83/YueWen_27416212/s_YueWen_27416212.jpg",
        "version": 56464877,
        "format": "epub",
        "type": 0,
        "price": 39.9,
        "originalPrice": 0,
        "soldout": 0,
        "bookStatus": 1,
        "payingStatus": 2,
        "payType": 1048577,
        "centPrice": 3990,
        "finished": 1,
        "free": 0,
        "mcardDiscount": 0,
        "ispub": 1,
        "extra_type": 1,
        "cpid": 4789723,
        "publishTime": "2019-12-19 00:00:00",
        "categories": [
          {
            "categoryId": 1500000,
            "subCategoryId": 1500003,
            "categoryType": 0,
            "title": "科学技术-科学科普"
          }
        ],
        "hasLecture": 1,
        "lastChapterIdx": 58,
        "paperBook": {
          "skuId": "12610905"
        },
        "copyrightChapterUids": [2],
        "blockSaveImg": 0,
        "language": "zh",
        "isTraditionalChinese": false,
        "hideUpdateTime": false,
        "isEPUBComics": 0,
        "isVerticalLayout": 0,
        "isShowTTS": 1,
        "webBookControl": 0,
        "selfProduceIncentive": false,
        "isAutoDownload": 1
      },
      "reviewCount": 4,
      "reviewLikeCount": 0,
      "reviewCommentCount": 0,
      "noteCount": 42,
      "bookmarkCount": 0,
      "sort": 1743738132
    },
    ... //其他book信息
    ]
}

# 获取书籍详情 （似乎没什么用）
Request:https://weread.qq.com/api/book/info?bookId=27416212
Response:
{"bookId":"27416212","title":"隐藏的自我","author":"大卫·伊格曼　","translator":"钱静","cover":"https://cdn.weread.qq.com/weread/cover/83/YueWen_27416212/s_YueWen_27416212.jpg","version":56464877,"format":"epub","type":0,"price":39.9,"originalPrice":0,"soldout":0,"bookStatus":1,"payingStatus":2,"payType":1048577,"intro":"为什么在意识到前方有危险之前，你的脚已经踩上了刹车？ 为什么我们总喜欢在晚上发一些感性的文字？为什么有些人更容易发生婚外恋？所有这些问题都与你对自己的认知有关，而实际上，你并没有想象中那么了解自己。卡尔·荣格说："每个人的内心之中都有另一个自己不认识的人"。《隐藏的自我》从脑科学的角度，为你揭示人类行为、决策背后的大脑运行机制，帮你重新认识"我是谁"。《隐藏的自我》是提高自我认知的一本绝佳读物。作者大卫·伊格曼以进化的眼光，用丰富的实验、经典案例、前沿科技，辅以哲学性的思考，循序渐进，逐步深入，带我们一窥人体中复杂又重要的器官——大脑。我们的希望、梦想、 恐惧、灵感、迷恋、幽默感和欲望，都源于大脑这个奇怪的器官，当它改变时，我们也会随之改变。这本书帮我们认识到我们所看、所听、所想的局限甚至谬误，从而帮我们开辟更广阔的认知进阶空间。","centPrice":3990,"finished":1,"maxFreeChapter":10,"maxFreeInfo":{"maxFreeChapterIdx":10,"maxFreeChapterUid":10,"maxFreeChapterRatio":9},"free":0,"mcardDiscount":0,"ispub":1,"extra_type":1,"cpid":4789723,"publishTime":"2019-12-19 00:00:00","category":"科学技术-科学科普","categories":[{"categoryId":1500000,"subCategoryId":1500003,"categoryType":0,"title":"科学技术-科学科普"}],"hasLecture":1,"lastChapterIdx":58,"paperBook":{"skuId":"12610905"},"copyrightChapterUids":[2],"hasKeyPoint":true,"blockSaveImg":0,"language":"zh","hideUpdateTime":false,"isEPUBComics":0,"isVerticalLayout":0,"isShowTTS":1,"webBookControl":0,"selfProduceIncentive":false,"isAutoDownload":1,"chapterSize":58,"updateTime":1722521808,"onTime":1577702240,"unitPrice":0.05,"marketType":0,"isbn":"9787553690957","publisher":"浙江教育出版社","totalWords":140657,"publishPrice":62.9,"bookSize":552235,"recommended":0,"lectureRecommended":0,"follow":0,"secret":0,"offline":0,"lectureOffline":0,"finishReading":0,"hideReview":0,"hideFriendMark":0,"blacked":0,"bookplateId":"kexuejishu","bookplateText":"科学的精神是怀疑、质疑和追求真理，而不是盲目相信或绝对信仰。","isAutoPay":0,"availables":0,"paid":1,"showLectureButton":1,"isHideTTSButton":0,"shouldHideTTS":0,"wxtts":1,"star":82,"ratingCount":372,"ratingDetail":{"one":8,"two":1,"three":36,"four":37,"five":290,"recent":2},"newRating":826,"newRatingCount":337,"deepVRating":841,"showDeepVRatingLabel":0,"newRatingDetail":{"good":278,"fair":52,"poor":7,"recent":2,"deepV":44,"myRating":"","title":""},"ranklist":{},"copyrightInfo":{"id":4789723,"name":"湛庐CHEERS","userVid":0,"role":0,"avatar":"","cpType":0},"authorSeg":[{"words":"大卫·伊格曼","highlight":1,"authorId":"284897"},{"words":"　","highlight":0}],"translatorSeg":[{"words":"钱静","highlight":1,"authorId":"51208"}],"coverBoxInfo":{"blurhash":"KfGAkmj]9GW-kDac4Xax%K","colors":[{"key":"6/4","hex":"#6f9aa9"},{"key":"4/4","hex":"#396678"},{"key":"3/4","hex":"#1b4d60"},{"key":"3/6","hex":"#004f6c"},{"key":"3/8","hex":"#005178"},{"key":"2/4","hex":"#033547"},{"key":"2/6","hex":"#003753"},{"key":"2/8","hex":"#00395f"},{"key":"1/4","hex":"#002033"},{"key":"1/6","hex":"#00223d"},{"key":"1/8","hex":"#002449"},{"key":"6/6","hex":"#539db6"},{"key":"4/6","hex":"#126883"},{"key":"9/2","hex":"#d3e6ed"},{"key":"4/10","hex":"#006d9c"},{"key":"5/10","hex":"#0087b5"},{"key":"5/4","hex":"#548090"},{"key":"8/4","hex":"#a0cfde"},{"key":"5/8","hex":"#0085a9"},{"key":"6/8","hex":"#259fc3"},{"key":"8/6","hex":"#85d3ec"},{"key":"7/8","hex":"#4abadd"},{"key":"3/12","hex":"#005590"},{"key":"9/12","hex":"#00fbff"},{"key":"1/100","hex":"#259fc3"},{"key":"2/100","hex":"#4abadd"},{"key":"3/100","hex":"#ffffff"},{"key":"4/100","hex":"#E5F2F3"},{"key":"5/100","hex":"#E5F2F3"},{"key":"6/100","hex":"#002722"}],"dominate_color":{"hex":"#6dd0ef","hsv":[194.175868841066,54.514882727092,93.6025144106539]},"custom_cover":"https://weread-1258476243.file.myqcloud.com/bookalphacover/212/27416212/s_27416212.jpg","custom_rec_cover":"https://weread-1258476243.file.myqcloud.com/bookreccover/212/27416212/s_27416212.jpg"},"skuInfo":{"miniProgramId":"gh_78fd80800407","path":"/pages/product/product?pid=28499113&unionid=P-136100358m"},"shortTimeRead":{"active":0},"askAIBook":0,"aiBookButtonType":0,"AISummary":"本书从脑科学的角度揭示了人类行为、决策背后的大脑运行机制。\n\n通过丰富的实验、经典案例和前沿科技，作者大卫·伊格曼带领读者深入探讨意识与无意识、本能与生理限制、大脑系统间的竞争与决策等复杂主题。\n\n书中不仅揭示了大脑对世界的构建过程，还探讨了无意识如何影响我们的行为决策。\n\n通过对自由意志的质疑，作者帮助读者重新审视自我认知，理解大脑在行为控制中的多重角色。\n\n本书适合对心理学、认知科学及人类行为感兴趣的读者，帮助他们在理解大脑运作机制的过程中提升自我认知。"}

# 获取指定书籍的划线记录  synckey为最新划线的时间戳
Request: https://weread.qq.com/web/book/bookmarklist?bookId=27416212
Response:
{
  "synckey": 1745909123,
  "updated": [
    {
      "bookId": "27416212",
      "style": 2,
      "bookVersion": 56464877,
      "range": "1227-1255",
      "markText": "基因组的作用只有在与环境相互作用的情况下才能真正被理解。",
      "colorStyle": 3,
      "type": 1,
      "chapterUid": 57,
      "createTime": 1745909123,
      "bookmarkId": "27416212_57_1227-1255"
    },
    {
      "bookId": "27416212",
      "style": 2,
      "bookVersion": 56464877,
      "range": "4819-4907",
      "markText": "由于我们的大脑会出现异常的波动，有时候会发现自己更为急躁、幽默、健谈、平静、有活力，或者思维更清晰。我们的内在环境和外在行为受到生物基础的引导，既不能直接接触，也不能直接认识。",
      "colorStyle": 3,
      "type": 1,
      "chapterUid": 56,
      "createTime": 1745892075,
      "bookmarkId": "27416212_56_4819-4907"
    },
    ...//其他划线
  ]
}

# 获取指定书籍的想法记录  synckey为该书最新笔记的时间，每条review下方的create time就是该review的创建时间。
Request: https://weread.qq.com/api/review/list?bookId=27416212&listType=11&syncKey=0&mine=1
Response: 
{
  "synckey": 1745892132,
  "totalCount": 14,
  "reviews": [
    {
      "reviewId": "82355925_7ZLpqbTrm",
      "review": {
        "bookId": "27416212",
        "content": "人的性格，情绪，状态波动其实也源于大脑状态的改变。但大脑的状态对\"自我意识\"而言是不可知的",
        "bookVersion": 56464877,
        "range": "4819-4907",
        "abstract": "由于我们的大脑会出现异常的波动，有时候会发现自己更为急躁、幽默、健谈、平静、有活力，或者思维更清晰。我们的内在环境和外在行为受到生物基础的引导，既不能直接接触，也不能直接认识。",
        "type": 1,
        "chapterUid": 56,
        "reviewId": "82355925_7ZLpqbTrm",
        "userVid": 82355925,
        "topics": [],
        "createTime": 1745892132,
        "isLike": 0,
        "isReposted": 0,
        "book": {
          "bookId": "27416212",
          "format": "epub",
          "version": 56464877,
          "soldout": 0,
          "bookStatus": 1,
          "type": 0,
          "cover": "https://cdn.weread.qq.com/weread/cover/83/YueWen_27416212/s_YueWen_27416212.jpg",
          "title": "隐藏的自我",
          "author": "大卫·伊格曼　",
          "translator": "钱静",
          "payType": 1048577
        },
        "chapterIdx": 56,
        "chapterTitle": "我们是否拥有脱离物理生物基础的灵魂",
        "author": {
          "userVid": 82355925,
          "name": "陈源泉",
          "avatar": "https://thirdwx.qlogo.cn/mmopen/vi_32/PiajxSqBRaELXybYx6OXE3ZAbU2USVCibTyWLZYINDFxDnHCFmSicb7CibPLjkBn01sDmIS5dwZZ3v8wKKkTSDs3wxrJ3RDIJjbeFpHKHibX5wu7nZYGP6icIxkQ/132",
          "isFollowing": 1,
          "isFollower": 1,
          "isBlacking": 0,
          "isBlackBy": 0,
          "isHide": 0,
          "isV": 0,
          "roleTags": [],
          "followPromote": "",
          "isDeepV": true,
          "deepVTitle": "资深会员",
          "signature": "近城远山，皆是人间。https://chenge.ink",
          "medalInfo": {
            "id": "M6-0-3000",
            "desc": "收到的赞",
            "title": "收到的赞",
            "levelIndex": 3000
          }
        }
      }
    },
    {...},...
  ]
}

# 获取指定书籍的阅读状态详情
Request: https://weread.qq.com/web/book/getProgress?bookId=27416212
Response:
{
  "bookId": "27416212",
  "book": {
    "appId": "wb182564874663h1484727348",
    "bookVersion": 56464877,
    "reviewId": "",
    "chapterUid": 57,
    "chapterOffset": 7602,
    "chapterIdx": 57,
    "updateTime": 1746100898,
    "synckey": 1480012580,
    "summary": "就的模式。世界各地的实验室正在努力弄清楚",
    "repairOffsetTime": 0,
    "readingTime": 72917,  // 阅读时长，秒
    "progress": 96,   // 阅读进度，百分比
    "isStartReading": 1,
    "ttsTime": 0,
    "startReadingTime": 1740815642,
    "installId": "",
    "recordReadingTime": 0
  },
  "canFreeRead": 0,
  "timestamp": 1746100909
}

# 获取指定书籍的章节信息
Request: POST https://weread.qq.com/web/book/chapterInfos
Headers:
```
Cookie: [your_cookie]
Content-Type: application/json;charset=UTF-8
Accept: application/json, text/plain, */*
Origin: https://weread.qq.com
Referer: https://weread.qq.com/web/reader/[bookId]
```
Body: 
```json
{"bookIds":["27416212"]}
```

Response示例: 
{"data":[{"bookId":"27416212","soldOut":0,"clearAll":0,"chapterUpdateTime":1722521808,"updated":[{"chapterUid":1,"chapterIdx":1,"updateTime":0,"readAhead":0,"title":"封面","wordCount":1,"price":0,"paid":0,"isMPChapter":0,"level":1,"files":["Text/coverpage.xhtml"]},{"chapterUid":2,"chapterIdx":2,"updateTime":1659067784,"readAhead":0,"title":"版权信息","wordCount":150,"price":0,"paid":0,"isMPChapter":0,"level":1,"files":["Text/copyright.xhtml"]},
// ... 其他章节信息
]}


# 获取指定书籍的热门评论
Request： https://weread.qq.com/web/review/list/best?bookId=44112345&synckey=0&maxIdx=0&count=3 
bookId：书籍 ID
synckey：同步键，默认0
maxIdx：分页索引
count：返回条数，默认10
Response：
{
  "synckey": 1747324645,
  "reviews": [
    {
      "idx": 1,
      "review": {
        "reviewId": "329372918_7N3Q0AK97",
        "review": {
          "topics": [],
          "createTime": 1701157903,
          "bookFinderSuccessCount": 9,
          "htmlContent": "还算是一本这方面知识写的不错的书，主要是看过的前几本太一般了，显得这书有一点清新脱俗～\n感受：\n1、无意识的身体语言和内心深处的态度是互为表里的，这方面有点像中医。\n2、人生在世，谎言当道，如果不掌握一点这方面的技能，真有点像赤身裸体、手无寸铁的行走在原始森林。等孩子们渐渐懂事了，也要适当引导他们了解这方面的知识\n3、反观自己，就像个行走的信号塔。所以，还是要锻炼，学习精神内敛\n4、不知道是不是有类似的培训，总感觉有些带货直播的用到了一些这方面技能，当然也可能是人家的天赋。\n5、按照这书里提到的，有时间就静音看一些新闻现场还有语言类节目，试试练习一下读懂身体语言\n6、之前看的这类书总是有道德说教。现在发觉还是有必要的，这种技术是双刃剑，可以行善，也可作恶\n\n最后再说一下这本书：\n虽然有些废话，但总体有干货，最后那个身体信号汇总表值得表扬。打算再看一遍",
          "notVisibleToFriends": 0,
          "range": "",
          "reviewId": "329372918_7N3Q0AK97",
          "book": {
            "cover": "https://wfqqreader-1252317822.image.myqcloud.com/cover/345/44112345/s_44112345.jpg",
            "title": "身体语言读心术",
            "bookId": "44112345",
            "version": 148772139,
            "bookStatus": 1,
            "author": "彬子编著",
            "payType": 1048577,
            "format": "epub",
            "soldout": 0,
            "type": 0
          },
          "abstract": "",
          "title": "",
          "isFinish": 1,
          "newRatingLevel": 1,
          "star": 100,
          "type": 4,
          "author": {
            "name": "supercool",
            "isFollower": 0,
            "isV": 0,
            "deepVTitle": "资深会员",
            "userVid": 329372918,
            "isFollowing": 0,
            "isBlacking": 0,
            "medalInfo": {
              "title": "阅读天数",
              "levelIndex": 200,
              "id": "M3-0-200",
              "desc": "阅读天数"
            },
            "isBlackBy": 0,
            "followPromote": "",
            "isDeepV": true,
            "roleTags": [],
            "signature": "遗忘自己的需求，完全满足灵魂对真理的渴望",
            "avatar": "https://thirdwx.qlogo.cn/mmopen/vi_32/PiajxSqBRaEISCen3U59icV8iaoPpCLAp92onc53rnc4rPLwjiafstfjWZhrfdtq44J6mmiavFnD0z6GgtTR96FXSGllO6r6bicFJA8iaG0DRYhlXt1O4hHMbeqxQ/132",
            "isHide": 0,
            "vDesc": "沉下心来，让身心浸入佛法中"
          },
          "atUserVids": [],
          "bookId": "44112345",
          "content": "还算是一本这方面知识写的不错的书，主要是看过的前几本太一般了，显得这书有一点清新脱俗～\n感受：\n1、无意识的身体语言和内心深处的态度是互为表里的，这方面有点像中医。\n2、人生在世，谎言当道，如果不掌握一点这方面的技能，真有点像赤身裸体、手无寸铁的行走在原始森林。等孩子们渐渐懂事了，也要适当引导他们了解这方面的知识\n3、反观自己，就像个行走的信号塔。所以，还是要锻炼，学习精神内敛\n4、不知道是不是有类似的培训，总感觉有些带货直播的用到了一些这方面技能，当然也可能是人家的天赋。\n5、按照这书里提到的，有时间就静音看一些新闻现场还有语言类节目，试试练习一下读懂身体语言\n6、之前看的这类书总是有道德说教。现在发觉还是有必要的，这种技术是双刃剑，可以行善，也可作恶\n\n最后再说一下这本书：\n虽然有些废话，但总体有干货，最后那个身体信号汇总表值得表扬。打算再看一遍",
          "friendship": 0,
          "isReposted": 0,
          "bookVersion": 148772138,
          "isPrivate": 0,
          "userVid": 329372918,
          "isLike": 0
        },
        "likesCount": 8
      },
      "hints": "5000|5010|book_review_rank|82355925_1747324645787|5Q4maNWm6ASdijtK|;review_type=4;"
    },
    {
      "idx": 2,
      "review": {
        "reviewId": "37724239_7DmHw72T6",
        "review": {
          "isPrivate": 0,
          "range": "",
          "createTime": 1667013182,
          "newRatingLevel": 1,
          "book": {
            "type": 0,
            "cover": "https://wfqqreader-1252317822.image.myqcloud.com/cover/345/44112345/s_44112345.jpg",
            "author": "彬子编著",
            "payType": 1048577,
            "bookId": "44112345",
            "format": "epub",
            "version": 148772139,
            "soldout": 0,
            "bookStatus": 1,
            "title": "身体语言读心术"
          },
          "author": {
            "isHide": 1,
            "isDeepV": true,
            "medalInfo": {
              "levelIndex": 10,
              "id": "M13-20231204-10",
              "desc": "每周阅读挑战",
              "title": "完美阅读周"
            },
            "name": "静思",
            "avatar": "https://res.weread.qq.com/wravatar/WV0001-iMczO5v4n6BwPT9e8X_qvc1/0",
            "isBlackBy": 0,
            "isFollowing": 0,
            "isFollower": 0,
            "followPromote": "",
            "deepVTitle": "资深会员",
            "userVid": 37724239,
            "isBlacking": 0,
            "isV": 0,
            "roleTags": [],
            "signature": ""
          },
          "reviewId": "37724239_7DmHw72T6",
          "userVid": 37724239,
          "topics": [],
          "type": 4,
          "bookFinderSuccessCount": 0,
          "atUserVids": [],
          "bookId": "44112345",
          "content": "重新审视身体语言，与本书对照。",
          "friendship": 0,
          "htmlContent": "重新审视身体语言，与本书对照。",
          "star": 100,
          "abstract": "",
          "bookVersion": 148772138,
          "title": "",
          "isLike": 0,
          "isReposted": 0
        }
      },
      "hints": "5000|5010|book_review_rank|82355925_1747324645787|5Q4maNWm6ASdijtK|;review_type=4;"
    },
    {
      "idx": 3,
      "review": {
        "reviewId": "912127391_7VBD9VB4R",
        "review": {
          "friendship": 0,
          "notVisibleToFriends": 0,
          "newRatingLevel": 1,
          "book": {
            "cover": "https://wfqqreader-1252317822.image.myqcloud.com/cover/345/44112345/s_44112345.jpg",
            "payType": 1048577,
            "bookId": "44112345",
            "format": "epub",
            "version": 148772139,
            "soldout": 0,
            "bookStatus": 1,
            "type": 0,
            "title": "身体语言读心术",
            "author": "彬子编著"
          },
          "userEditTime": 1731849858,
          "isReposted": 0,
          "atUserVids": [],
          "htmlContent": "推荐不解释",
          "range": "",
          "userVid": 912127391,
          "type": 4,
          "topics": [],
          "createTime": 1731250256,
          "isLike": 0,
          "bookVersion": 148772139,
          "content": "侧重实战的一本心理学，我读过读心术秋泉的，也读过张静波的，然后就是这本了，秋泉的大致可以必须成初级认知内容全面概侧重理论，张静波的也是简要版本理论实战各自一半适合收藏阅读的版本，而这本肢体语言更像是侧重实战的版本，没有过多的理论，直接告诉你怎么看，看哪里，怎么辨别的方法。总体来说这本书适合重复阅读并且记住内容的一本。推荐！！",
          "isPrivate": 0,
          "title": "",
          "bookFinderSuccessCount": 0,
          "author": {
            "deepVTitle": "资深会员",
            "isBlacking": 0,
            "isBlackBy": 0,
            "isV": 0,
            "isDeepV": true,
            "vDesc": "俗人",
            "roleTags": [],
            "name": "Aa1简凡",
            "avatar": "https://res.weread.qq.com/wravatar/WV0019-cu3gP8r6nMFNKR94n7z7qf1/0",
            "isFollowing": 0,
            "nick": "Aa1简凡",
            "userVid": 912127391,
            "isFollower": 0,
            "isHide": 1,
            "followPromote": "",
            "signature": "孤狼，念旧，不忘初心，非善非恶，独善其身",
            "medalInfo": {
              "id": "M13-20241223-25",
              "desc": "每周阅读挑战",
              "title": "狂暴阅读周",
              "levelIndex": 25
            }
          },
          "abstract": "",
          "bookId": "44112345",
          "star": 100,
          "reviewId": "912127391_7VBD9VB4R"
        }
      },
      "hints": "5000|5010|book_review_rank|82355925_1747324645787|5Q4maNWm6ASdijtK|;review_type=4;"
    }
  ],
  "reviewsHasMore": 1,
  "reviewsHas5Star": 1,
  "reviewsHas1Star": 0,
  "reviewsHasRecent": 0,
  "reviewsCnt": 4,
  "recentTotalCnt": 0,
  "friendCommentCount": 0,
  "friendUniqueCount": 0,
  "deepVRecommendInfo": {
    "title": "",
    "subtitle": ""
  },
  "deepVUniqueCount": 4
}