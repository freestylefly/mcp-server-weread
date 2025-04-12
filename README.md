# 微信读书 MCP 服务器

微信读书MCP服务器是一个桥接微信读书数据和Claude Desktop的轻量级服务器，使您可以在Claude中无缝访问微信读书的笔记和阅读数据。

## 安装和使用

### 环境准备

1. 确保您的系统已安装 Node.js (v16+)
2. 克隆本仓库：`git clone https://github.com/yourusername/mcp-server-weread.git`
3. 进入项目目录：`cd mcp-server-weread`
4. 安装依赖：`npm install`（下载慢可以用：npm install --registry=https://registry.npmmirror.com）

### 获取微信读书Cookie

1. 在浏览器中登录微信读书网页版: https://weread.qq.com/
2. 打开浏览器开发者工具（F12或右键检查）
3. 切换到"应用程序"或"Application"标签
4. 在左侧"存储"下找到"Cookies"
5. 选择"https://weread.qq.com"
6. 找到并复制所有cookie（可以全选然后复制所有值）

### 配置环境变量

1. 在项目根目录下，编辑`.env`文件
2. 设置微信读书Cookie：`WEREAD_COOKIE=你复制的cookie值`

### 启动服务器

1. 编译代码：`npm run build`
2. 启动服务器：`node build/index.js`

### 在MCP客户端中配置

以Cursor AI为例，在`~/.cursor/mcp.json`文件中添加：

```json
{
  "mcpServers": {
    "mcp-server-weread": {
      "command": "node",
      "args": ["/path/to/mcp-server-weread/build/index.js"],
      "env": {
        "WEREAD_COOKIE": "你的微信读书cookie"
      }
    }
  }
}
```

替换`/path/to/mcp-server-weread`为实际安装路径，并设置正确的cookie值。

## 支持的功能

服务器提供以下工具：

1. **get_bookshelf** - 获取用户的完整书架信息
2. **get_notebooks** - 获取带有笔记的书籍列表
3. **get_book_notes** - 获取特定书籍的所有笔记内容
4. **get_book_info** - 获取书籍的详细信息
5. **search_notes** - 搜索所有笔记中包含特定关键词的内容
6. **get_recent_reads** - 获取用户最近阅读的书籍和相关数据

## 使用示例

在支持MCP的AI客户端（如Claude Desktop）中，您可以：

1. 请求："帮我查看我的书架上有哪些书"
2. 请求："我想看看《思考，快与慢》这本书的笔记"
3. 请求："帮我找一下我笔记中关于'认知偏差'的内容"
4. 请求："获取我最近读过的书籍"

---

# 微信读书 MCP 服务器设计方案

## 产品定位与目标

**产品名称**: WeRead MCP Server

**产品定位**: 作为微信读书与Claude Desktop之间的桥梁，实现阅读笔记与AI深度交互的轻量级服务器。

**核心目标**:
1. 实现微信读书数据的实时获取与格式化
2. 通过MCP协议与Claude Desktop无缝集成
3. 支持基于读书笔记的深度对话与知识提取
4. 构建完整的"输入-整理-沉淀"知识工作流

**价值主张**:
- 将碎片化的阅读笔记转化为系统化的知识体系
- 通过AI辅助深化对阅读内容的理解与应用
- 减少知识管理的复杂性，实现轻量级知识沉淀
- 提升阅读效率与阅读质量

## 系统架构

```
+---------------+      +-----------------+      +------------------+
|               |      |                 |      |                  |
| 微信读书服务器 | <--> | WeRead MCP 服务器 | <--> | Claude Desktop |
|               |      |                 |      |                  |
+---------------+      +-----------------+      +------------------+
```

### 特点
- 轻量级设计：无本地数据库，实时API调用
- 按需获取数据：仅在用户请求时调用相关API
- 无状态服务：不维护复杂的会话状态
- 安全性：通过环境变量管理Cookie，避免明文存储

## 功能与使用场景

### 核心功能

1. **书籍与笔记浏览**
   - 获取用户书架信息
   - 获取带笔记的书籍列表
   - 获取特定书籍的详细信息

2. **笔记内容获取与处理**
   - 获取特定书籍的所有笔记（划线、评论）
   - 按章节组织笔记内容
   - 基于关键词搜索笔记内容

3. **阅读数据获取**
   - 获取最近阅读记录
   - 获取阅读进度信息

4. **AI 辅助分析**
   - 通过Claude分析笔记内容
   - 提取关键观点与见解
   - 关联不同书籍的相关概念

### 使用场景

#### 场景一：深度阅读分析与讨论

1. **开始对话**：用户打开Claude Desktop，开始一个新对话
2. **选择书籍**：用户请求："帮我查看我最近在读的书籍"
3. **获取笔记**：用户说："我想讨论《思考快与慢》这本书的笔记"
4. **深入讨论**：Claude展示笔记后，用户可以请求："帮我分析这些笔记中关于认知偏差的主要观点"
5. **关联思考**：用户可以进一步请求："将这些观点与我在《超越智商》一书中的笔记做对比"

#### 场景二：主题式笔记整合

1. **主题搜索**：用户说："查找我所有笔记中关于'领导力'的内容"
2. **跨书整合**：系统找到多本书中的相关笔记后，用户可以请求："帮我整合这些不同来源的观点，找出共同点和差异"
3. **知识地图**：用户说："基于这些笔记，帮我构建一个领导力的知识框架"

#### 场景三：写作与创作辅助

1. **素材收集**：用户说："我正在写关于'团队建设'的文章，找出我所有相关的读书笔记"
2. **结构梳理**：获取笔记后，用户可以说："帮我将这些素材组织成一个逻辑清晰的文章大纲"
3. **内容扩展**：用户说："基于这个大纲和我的笔记，帮我扩展第二部分的内容"

## MCP Tools 实现清单

### 1. 获取书架工具 (get_bookshelf)

**功能**: 获取用户的完整书架信息

**参数**: 无

**返回**: 格式化的书籍列表，包括书名、作者等基本信息

**实现逻辑**:
```python
def get_bookshelf():
    """获取用户的完整书架信息"""
    # 直接调用WeReadApi中的get_bookshelf方法
    weread_api = WeReadApi()
    bookshelf_data = weread_api.get_bookshelf()
    
    # 处理返回数据，提取有用信息
    books = []
    if "books" in bookshelf_data:
        for book in bookshelf_data["books"]:
            books.append({
                "bookId": book.get("bookId", ""),
                "title": book.get("title", ""),
                "author": book.get("author", ""),
                "cover": book.get("cover", ""),
                "category": book.get("category", ""),
                "finished": book.get("finished", False),
                "updateTime": book.get("updateTime", 0)
            })
    
    return {"books": books}
```

### 2. 获取笔记本列表工具 (get_notebooks)

**功能**: 获取所有带有笔记的书籍列表

**参数**: 无

**返回**: 带有笔记的书籍列表，按排序顺序

**实现逻辑**:
```python
def get_notebooks():
    """获取所有带有笔记的书籍列表"""
    # 直接调用WeReadApi中的get_notebooklist方法
    weread_api = WeReadApi()
    notebooks = weread_api.get_notebooklist()
    
    # 处理返回数据，提取有用信息
    formatted_notebooks = []
    for notebook in notebooks:
        formatted_notebooks.append({
            "bookId": notebook.get("bookId", ""),
            "title": notebook.get("title", ""),
            "author": notebook.get("author", ""),
            "cover": notebook.get("cover", ""),
            "noteCount": notebook.get("noteCount", 0),
            "sort": notebook.get("sort", 0),
            "bookUrl": weread_api.get_url(notebook.get("bookId", ""))
        })
    
    return {"notebooks": formatted_notebooks}
```

### 3. 获取书籍笔记工具 (get_book_notes)

**功能**: 获取特定书籍的所有笔记内容

**参数**: bookId (字符串) - 书籍ID

**返回**: 按章节组织的笔记内容，包括划线和评论

**实现逻辑**:
```python
def get_book_notes(bookId):
    """获取特定书籍的所有笔记内容"""
    weread_api = WeReadApi()
    
    # 1. 获取章节信息
    chapter_info = weread_api.get_chapter_info(bookId)
    
    # 2. 获取划线(书签)
    bookmarks = weread_api.get_bookmark_list(bookId) or []
    
    # 3. 获取评论/感想
    reviews = weread_api.get_review_list(bookId) or []
    
    # 4. 获取书籍基本信息
    book_info = weread_api.get_bookinfo(bookId) or {}
    
    # 处理章节信息
    chapters = {}
    for uid, chapter in chapter_info.items():
        chapters[uid] = {
            "title": chapter.get("title", ""),
            "level": chapter.get("level", 0),
            "chapterIdx": chapter.get("chapterIdx", 0)
        }
    
    # 处理划线和评论数据，按章节组织
    organized_notes = {}
    
    # 添加划线
    for bookmark in bookmarks:
        chapter_uid = str(bookmark.get("chapterUid", ""))
        if chapter_uid not in organized_notes:
            organized_notes[chapter_uid] = {
                "chapterTitle": chapters.get(chapter_uid, {}).get("title", "未知章节"),
                "chapterLevel": chapters.get(chapter_uid, {}).get("level", 0),
                "highlights": [],
                "reviews": []
            }
        
        organized_notes[chapter_uid]["highlights"].append({
            "text": bookmark.get("markText", ""),
            "createTime": bookmark.get("createTime", 0),
            "style": bookmark.get("style", 0)
        })
    
    # 添加评论
    for review in reviews:
        chapter_uid = str(review.get("chapterUid", ""))
        if chapter_uid not in organized_notes:
            organized_notes[chapter_uid] = {
                "chapterTitle": chapters.get(chapter_uid, {}).get("title", "未知章节"),
                "chapterLevel": chapters.get(chapter_uid, {}).get("level", 0),
                "highlights": [],
                "reviews": []
            }
        
        organized_notes[chapter_uid]["reviews"].append({
            "content": review.get("content", ""),
            "createTime": review.get("createTime", 0),
            "type": review.get("type", 0)
        })
    
    # 组织最终返回数据
    return {
        "bookInfo": {
            "bookId": bookId,
            "title": book_info.get("title", ""),
            "author": book_info.get("author", ""),
            "cover": book_info.get("cover", ""),
            "url": weread_api.get_url(bookId)
        },
        "notes": organized_notes
    }
```

### 4. 获取书籍详情工具 (get_book_info)

**功能**: 获取书籍的详细信息

**参数**: bookId (字符串) - 书籍ID

**返回**: 书籍的详细信息，包括标题、作者、简介等

**实现逻辑**:
```python
def get_book_info(bookId):
    """获取书籍的详细信息"""
    weread_api = WeReadApi()
    book_info = weread_api.get_bookinfo(bookId)
    
    # 处理并返回整理后的书籍信息
    formatted_info = {
        "bookId": bookId,
        "title": book_info.get("title", ""),
        "author": book_info.get("author", ""),
        "cover": book_info.get("cover", ""),
        "intro": book_info.get("intro", ""),
        "category": book_info.get("category", ""),
        "publisher": book_info.get("publisher", ""),
        "publishTime": book_info.get("publishTime", ""),
        "isbn": book_info.get("isbn", ""),
        "bookScore": book_info.get("newRating", {}).get("score", 0),
        "url": weread_api.get_url(bookId)
    }
    
    return formatted_info
```

### 5. 搜索笔记工具 (search_notes)

**功能**: 搜索所有笔记中包含特定关键词的内容

**参数**: keyword (字符串) - 搜索关键词

**返回**: 匹配关键词的笔记列表，包括来源书籍和内容

**实现逻辑**:
```python
def search_notes(keyword):
    """搜索所有笔记中包含特定关键词的内容"""
    weread_api = WeReadApi()
    
    # 1. 获取所有有笔记的书籍
    notebooks = weread_api.get_notebooklist()
    
    # 2. 遍历每本书的笔记，查找匹配关键词的内容
    search_results = []
    
    for notebook in notebooks:
        bookId = notebook.get("bookId", "")
        book_title = notebook.get("title", "")
        
        # 获取划线
        bookmarks = weread_api.get_bookmark_list(bookId) or []
        # 获取评论
        reviews = weread_api.get_review_list(bookId) or []
        
        # 搜索划线内容
        for bookmark in bookmarks:
            mark_text = bookmark.get("markText", "")
            if keyword.lower() in mark_text.lower():
                search_results.append({
                    "bookId": bookId,
                    "bookTitle": book_title,
                    "chapterUid": bookmark.get("chapterUid", ""),
                    "type": "highlight",
                    "content": mark_text,
                    "createTime": bookmark.get("createTime", 0)
                })
        
        # 搜索评论内容
        for review in reviews:
            review_content = review.get("content", "")
            if keyword.lower() in review_content.lower():
                search_results.append({
                    "bookId": bookId,
                    "bookTitle": book_title,
                    "chapterUid": review.get("chapterUid", ""),
                    "type": "review",
                    "content": review_content,
                    "createTime": review.get("createTime", 0)
                })
    
    # 按时间排序
    search_results.sort(key=lambda x: x["createTime"], reverse=True)
    
    return {"results": search_results, "keyword": keyword, "count": len(search_results)}
```

### 6. 最近阅读工具 (get_recent_reads)

**功能**: 获取用户最近阅读的书籍和相关数据

**参数**: 无

**返回**: 最近阅读的书籍列表，包括阅读进度和时间信息

**实现逻辑**:
```python
def get_recent_reads():
    """获取用户最近阅读的书籍和相关数据"""
    weread_api = WeReadApi()
    
    # 获取阅读历史数据
    history_data = weread_api.get_api_data()
    
    # 提取并格式化最近阅读数据
    recent_books = []
    
    if "recentBooks" in history_data:
        for book in history_data["recentBooks"]:
            # 获取每本书的阅读信息
            read_info = weread_api.get_read_info(book["bookId"])
            
            recent_books.append({
                "bookId": book.get("bookId", ""),
                "title": book.get("title", ""),
                "author": book.get("author", ""),
                "cover": book.get("cover", ""),
                "readingTime": read_info.get("readingTime", 0),  # 阅读时长(秒)
                "progress": read_info.get("progress", 0),        # 阅读进度(%)
                "lastReadingDate": read_info.get("lastReadingDate", 0),
                "noteCount": read_info.get("noteCount", 0),
                "url": weread_api.get_url(book.get("bookId", ""))
            })
    
    return {"recentBooks": recent_books}
```

## 技术实现注意事项

1. **环境变量管理**
   - 使用.env文件或系统环境变量管理敏感信息(Cookie)
   - 支持Cookie Cloud服务获取最新Cookie

2. **错误处理**
   - 完善的异常处理机制，特别是API调用失败情况
   - Cookie过期提醒与自动刷新机制

3. **性能优化**
   - 控制API调用频率，避免触发限制
   - 考虑短期缓存机制，减少重复调用

4. **MCP协议适配**
   - 确保工具输入输出符合Claude Desktop的MCP规范
   - 提供清晰的工具描述和使用示例

## 后续拓展方向

1. **增加笔记导出功能**
   - 支持Markdown、JSON等多种格式导出
   - 便于知识沉淀与分享

2. **添加笔记统计分析**
   - 提供阅读与笔记行为的数据可视化
   - 帮助用户了解自己的阅读模式

3. **个性化推荐**
   - 基于用户阅读历史和笔记内容推荐相关书籍或文章
   - 帮助用户拓展知识网络

4. **知识图谱构建**
   - 自动构建用户阅读内容的知识关联网络
   - 可视化展示不同概念和书籍之间的联系

5. **多平台整合**
   - 接入其他阅读平台的数据(如Kindle、豆瓣等)
   - 构建统一的阅读笔记管理系统