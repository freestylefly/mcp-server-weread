<p align="center"><img src= "https://cdn.canghecode.com/blog/%E5%BE%AE%E4%BF%A1%E8%AF%BB%E4%B9%A6MCP%20bac.png" alt="MaxKB" width="300" /></p>
<h3 align="center">一个为微信读书提供 MCP 服务的工具</h3>
<p align="center">
  <a href="https://opensource.org/license/MIT"><img src="https://img.shields.io/github/license/freestylefly/mcp-server-weread?color=rgb(25%2C%20121%2C%20255)" alt="The MIT License"></a>
  <a href=""><img src="https://img.shields.io/github/forks/freestylefly/mcp-server-weread?color=green" alt="Forks"></a>
  <a href="https://canghecode.com/"><img src="https://img.shields.io/badge/介绍-%E5%AE%98%E7%BD%91-green" alt="Official"></a>
  <a href="https://github.com/laigeoffer/pmhub"><img src="https://img.shields.io/github/stars/freestylefly/mcp-server-weread?style=flat-square&color=rgb(25%2C%20121%2C%20255)" alt="Stars"></a>    
  <a href="https://mp.weixin.qq.com/s/NQslbUBgWIBMyvTIa3PfYQ"><img src="https://img.shields.io/badge/WeReadMCP-教程-blue" alt="Experience"></a>  
</p>

<hr/>

微信读书 MCP Server 是一个为微信读书提供 MCP（Model Context Protocol）服务的工具，支持将微信读书的书籍、笔记和划线数据提供给支持MCP的大语言模型客户端，如Cursor、Claude Desktop。

## 功能特点

- 从微信读书获取书架信息
- 搜索书架中的图书
- 获取图书的笔记和划线
- 获取图书的热门书评
- 支持按章节组织笔记和划线
- 与支持MCP协议的LLM客户端无缝集成

## 主要工具

1. **get_bookshelf** - 获取用户书架上所有书籍
   - 返回书籍基本信息，包括书名、作者、译者和分类等

2. **search_books** - 通过关键词检索用户书架上的书籍
   - 支持模糊匹配和精确匹配
   - 可选是否包含详细信息
   - 可设置最大结果数量

3. **get_book_notes_and_highlights** - 获取指定书籍的所有划线和笔记
   - 支持按章节组织结果
   - 支持筛选划线样式
   - 返回结构化的数据以便于LLM理解

4. **get_book_best_reviews** - 获取指定书籍的热门书评
   - 支持设置返回数量
   - 支持分页浏览
   - 包含评分、点赞数和评论者信息

## 安装与使用

### 先决条件

- Node.js 16.x 或更高版本
- 微信读书账号和有效的Cookie

### 安装教程

详见：
- [用微信读书MCP在Cursor中构建私人图书馆，太哇塞了！](https://mp.weixin.qq.com/s/NQslbUBgWIBMyvTIa3PfYQ)
- [Weread MCP Server 使用指南](https://chenge.ink/article/post20250505)

### 与Claude Desktop集成

有多种方式可以与Claude Desktop集成：

#### 方式一：通过 npx 使用（最简单，推荐）
1. 打开Claude Desktop
2. 进入设置 -> MCP配置
3. 添加工具，使用以下JSON配置：
   ```json
   {
     "mcpServers": {
       "mcp-server-weread": {
         "command": "npx",
         "args": ["-y", "mcp-server-weread"],
         "env": {
           // 方式1：使用Cookie Cloud（推荐）
           "CC_URL": "https://cc.chenge.ink",  // Cookie Cloud的URL
           "CC_ID": "您的ID",                   // Cookie Cloud的ID
           "CC_PASSWORD": "您的密码"            // Cookie Cloud的密码
           
           // 或方式2：直接提供Cookie
           // "WEREAD_COOKIE": "您的微信读书Cookie"
         }
       }
     }
   }
   ```

#### 方式二：全局安装后使用

1. 全局安装包：
   ```bash
   npm install -g mcp-server-weread
   ```

2. 在Claude配置中使用：
   ```json
   {
     "mcpServers": {
       "mcp-server-weread": {
         "command": "mcp-server-weread",
         "env": {
           // 同上方式配置环境变量
         }
       }
     }
   }
   ```

> 提示：直接在Claude配置中提供环境变量的方式更加方便，无需设置.env文件，推荐使用。

## CookieCloud 配置说明
为了解决 Cookie 频繁过期，需要重新获取并更新环境变量的问题。本项目支持 [CookieCloud](https://github.com/easychen/CookieCloud) 服务来自动同步和更新 Cookie。CookieCloud 是一个开源的跨浏览器 Cookie 同步工具，支持自建服务器。

### 配置步骤：
安装浏览器插件
Edge商店：[CookieCloud for Edge](https://microsoftedge.microsoft.com/addons/detail/cookiecloud/bffenpfpjikaeocaihdonmgnjjdpjkeo)
Chrome商店：[CookieCloud for Chrome](https://chromewebstore.google.com/detail/cookiecloud/ffjiejobkoibkjlhjnlgmcnnigeelbdl)

### 配置 CookieCloud 插件
服务器地址：使用默认服务器 https://cc.chenge.ink 或填入自建服务器地址
点击 "自动生成密码"
同步域名关键词中填入 "weread"
点击"保存" ，然后点击 "手动同步"确保配置生效
[可选] 如果需要插件自动保活，可以在保活中填入 https://weread.qq.com，插件会自动刷新 Cookie

在MCP Json中配置CookieCloud变量：
CC_URL=你的CookieCloud服务器地址 （或使用我的默认服务器地址 https://cc.chenge.ink ）
CC_ID=你的CookieCloud用户UUID
CC_PASSWORD=你的CookieCloud密码
注意：配置 CookieCloud 后，系统会优先使用 CookieCloud 获取 Cookie，获取失败才会使用 WEREAD_COOKIE 环境变量的值。

## Cookie获取方法
微信读书的Cookie可以通过以下步骤获取：
1. 使用Chrome浏览器登录[微信读书网页版](https://weread.qq.com/)
2. 按F12打开开发者工具，切换到Network标签页
3. 刷新页面，在请求列表中找到weread.qq.com的请求
4. 在Headers中找到Cookie字段，复制其完整内容
5. 将复制的内容添加到MCP Json 或 .env文件的WEREAD_COOKIE变量中

## 使用示例
以下是一些与LLM对话的示例：

**获取书架信息**
```
用户: 帮我查看我的微信读书书架
LLM: 我将获取您的微信读书书架信息。
[LLM调用get_bookshelf工具]
我从您的微信读书书架获取到了208本书籍。以下是部分书籍：
1. 《隐藏的自我》- 大卫·伊格曼
2. 《思考，快与慢》- 丹尼尔·卡尼曼
3. 《人类简史》- 尤瓦尔·赫拉利
...
```

**搜索特定书籍**
```
用户: 帮我找关于心理学的书
LLM: 我将搜索您书架上与心理学相关的书籍。
[LLM调用search_books工具，参数为keyword="心理学"]
在您的书架上，我找到了3本与心理学相关的书籍：
1. 《思考，快与慢》- 丹尼尔·卡尼曼（进度：75%）
2. 《乌合之众》- 古斯塔夫·勒庞（进度：50%）
3. 《心理学与生活》- 理查德·格里格（进度：30%）
您想了解哪一本书的更多信息？
```

**获取笔记和划线**
```
用户: 帮我整理《思考，快与慢》这本书的笔记
LLM: 我将获取《思考，快与慢》的笔记和划线。
[LLM调用search_books工具，找到书籍ID]
[LLM调用get_book_notes_and_highlights工具]
以下是您在《思考，快与慢》中的笔记和划线（按章节组织）：

第一章：系统1和系统2
- 划线：「系统1的运行是无意识且快速的，不怎么费脑力，没有感觉，完全处于自主控制状态。」
- 您的笔记：「系统1负责直觉和快速判断，系统2负责缓慢的理性思考。」

第三章：锚定效应
- 划线：「锚定效应指的是在不确定情境下进行数字估计时，会过度受到事先接触的不相干数字的影响。」
...
```

**获取热门书评**
```
用户: 这本《原则》有哪些热门书评？
LLM: 我会为您查找《原则》的热门书评。
[LLM调用search_books工具，找到书籍ID]
[LLM调用get_book_best_reviews工具]
以下是《原则》的热门书评：

1. 评论者"思考者"（评分：5星）：
   "这是一本关于如何思考的书。达利欧将自己多年的经验总结为可操作的原则，帮助我们做出更好的决策。特别喜欢他关于'痛苦+反思=进步'的观点，非常实用。"
   👍 182 | 💬 23

2. 评论者"投资学习者"（评分：4星）：
   "桥水基金创始人的思想精华，值得反复阅读。书中的工作原则部分对管理者特别有帮助，建议先读生活原则，再读工作原则。"
   👍 94 | 💬 12
...
```

## 九、友情链接

- [mcp-server-weread](https://github.com/ChenyqThu/mcp-server-weread) ：🚀一个为微信读书提供MCP（Model Context Protocol）服务的工具，支持将微信读书的书籍、笔记和划线数据提供给支持MCP的大语言模型客户端，如Claude Desktop。
- [CodeCanvas](https://github.com/freestylefly/CodeCanvas) ：📚本代码仓库是作者苍何多年从事一线互联网Java开发的学习历程技术汇总，旨在为大家提供一个清晰详细的学习教程，侧重点更倾向编写Java核心内容。💪🏻
- [PmHub](https://github.com/laigeoffer/pmhub) ：🔥PmHub 是一套基于 SpringCloud & LLM 的微服务智能项目管理系统，这个项目旨在帮助小伙伴们快速掌握微服务/分布式项目的架构设计和开发流程，如果想在校招或者社招中拿到一个满意的 offer，PmHub 将是一个非常 nice 的选择。

## 十、鸣谢

此项目 fork 自 ChenyqThu 的[mcp-server-weread](https://github.com/ChenyqThu/mcp-server-weread)项目，做了一些小修改，突然就🔥了，这里也请大家去作者GitHub原项目上star，另外ChenyqThu新的更新我也会做同步，项目也会保持使用教程的更新，感谢大家的喜欢。

## 十一、star 趋势图

[![Star History Chart](https://api.star-history.com/svg?repos=freestylefly/mcp-server-weread&type=Date)](https://star-history.com/#freestylefly/mcp-server-weread&Date)

## 十二、公众号

微信搜 **苍何** 或扫描下方二维码关注苍何的原创公众号，回复 **AI** 即可和 5000+ 好友一同探讨AI，一同学习MCP。

![苍何微信公众号](https://cdn.tobebetterjavaer.com/stutymore/%E6%89%AB%E7%A0%81_%E6%90%9C%E7%B4%A2%E8%81%94%E5%90%88%E4%BC%A0%E6%92%AD%E6%A0%B7%E5%BC%8F-%E6%A0%87%E5%87%86%E8%89%B2%E7%89%88.png)

## 十三、许可证

[MIT License (MIT)](https://opensource.org/licenses/MIT)<hr/>
The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

Copyright (c) 2025-2026 mcp-server-weread
