# 微信读书 MCP Server 基础工具设计

## 1. 书籍检索工具 (`search_books`)

### 功能描述
Search for books in the user's bookshelf by keywords, returning detailed book information and reading progress.

### 参数设计
```json
{
  "keyword": "string", // Search keyword to match book title, author, translator or category
  "exact_match": false, // Whether to perform exact matching, default is fuzzy matching
  "include_details": true, // Whether to include detailed information
  "max_results": 10 // Maximum number of results to return
}
```

### 实现逻辑
1. 调用 `/api/user/notebook` 获取用户书架上所有有笔记的书籍列表
2. 根据关键词对书名、作者、译者和分类进行匹配，筛选出符合条件的书籍
3. 若 `include_details` 为 true，则对每本匹配的书籍：
   - 调用 `/api/book/info?bookId={bookId}` 获取书籍详情
   - 调用 `/web/book/getProgress?bookId={bookId}` 获取阅读进度
4. 整合信息并按照统一格式返回结果

### 返回格式
```json
{
  "total_matches": 2,
  "books": [
    {
      "book_id": "27416212",
      "title": "隐藏的自我",
      "author": "大卫·伊格曼",
      "translator": "钱静",
      "category": "科学技术-科学科普",
      "publish_info": "浙江教育出版社 2019-12",
      "reading_status": {
        "progress": 96,
        "reading_time": 72917,
        "last_read_time": "2025-05-01T12:34:58Z",
        "note_count": 42,
        "bookmark_count": 35,
        "review_count": 14
      },
      "book_info": {
        "word_count": 140657,
        "rating": 8.2,
        "rating_count": 1234,
        "description": "为什么在意识到前方有危险之前，你的脚已经踩上了刹车？..." // 简介摘要
      }
    },
    {
      // 第二本匹配书籍
    }
  ]
}
```

### 代码示例
```javascript
// services/bookService.js
const searchBooks = async (cookies, params) => {
  try {
    // 1. 获取书架上所有有笔记的书籍
    const notebookResponse = await axios.get('https://weread.qq.com/api/user/notebook', {
      headers: { 'Cookie': cookies }
    });
    
    const allBooks = notebookResponse.data.books || [];
    
    // 2. 根据关键词筛选
    const keyword = params.keyword.toLowerCase();
    const matchedBooks = allBooks.filter(book => {
      const title = book.book.title.toLowerCase();
      const author = book.book.author.toLowerCase();
      const translator = book.book.translator ? book.book.translator.toLowerCase() : "";
      
      // 获取分类信息
      let category = "";
      if (book.book.categories && book.book.categories.length > 0) {
        category = book.book.categories[0].title.toLowerCase();
      }
      
      if (params.exact_match) {
        return title === keyword || author === keyword || 
               translator === keyword || category === keyword;
      } else {
        return title.includes(keyword) || author.includes(keyword) || 
               translator.includes(keyword) || category.includes(keyword);
      }
    }).slice(0, params.max_results);
    
    // 3. 获取详细信息
    const booksWithDetails = [];
    
    if (params.include_details) {
      for (const matchedBook of matchedBooks) {
        const bookId = matchedBook.bookId;
        
        // 3.1 获取书籍详情
        const bookInfoResponse = await axios.get(`https://weread.qq.com/api/book/info`, {
          params: { bookId },
          headers: { 'Cookie': cookies }
        });
        
        // 3.2 获取阅读进度
        const progressResponse = await axios.get(`https://weread.qq.com/web/book/getProgress`, {
          params: { bookId },
          headers: { 'Cookie': cookies }
        });
        
        // 3.3 整合信息
        booksWithDetails.push({
          book_id: bookId,
          title: matchedBook.book.title,
          author: matchedBook.book.author,
          translator: matchedBook.book.translator || "",
          cover_url: matchedBook.book.cover,
          category: bookInfoResponse.data.category || "",
          publish_info: `${bookInfoResponse.data.publisher || ""} ${bookInfoResponse.data.publishTime ? bookInfoResponse.data.publishTime.substring(0, 7) : ""}`,
          reading_status: {
            progress: progressResponse.data.book.progress || 0,
            reading_time: progressResponse.data.book.readingTime || 0,
            last_read_time: new Date(progressResponse.data.book.updateTime * 1000).toISOString(),
            note_count: matchedBook.noteCount || 0,
            bookmark_count: matchedBook.bookmarkCount || 0,
            review_count: matchedBook.reviewCount || 0
          },
          book_info: {
            word_count: bookInfoResponse.data.totalWords || 0,
            rating: bookInfoResponse.data.newRating ? bookInfoResponse.data.newRating/100 : 0,
            description: bookInfoResponse.data.intro ? bookInfoResponse.data.intro.substring(0, 100) + "..." : ""
          }
        });
      }
      
      return {
        total_matches: booksWithDetails.length,
        books: booksWithDetails
      };
    } else {
      // 简化版返回结果
      return {
        total_matches: matchedBooks.length,
        books: matchedBooks.map(book => ({
          book_id: book.bookId,
          title: book.book.title,
          author: book.book.author,
          translator: book.book.translator || "",
          cover_url: book.book.cover,
          note_count: book.noteCount,
          bookmark_count: book.bookmarkCount,
          review_count: book.reviewCount
        }))
      };
    }
  } catch (error) {
    console.error('Error searching books:', error);
    throw new Error(`书籍检索失败: ${error.message}`);
  }
};
```

## 2. 获取特定书籍的划线和笔记工具 (`get_book_notes_and_highlights`)

### 功能描述
Get all highlights and notes for a specific book, organized by chapters.

### 参数设计
```json
{
  "book_id": "string", // Required, Book ID
  "include_chapters": true, // Whether to include chapter information
  "organize_by_chapter": true, // Whether to organize by chapter
  "highlight_style": null // Highlight style filter, null means all
}
```

### 实现逻辑
1. 调用 `/web/book/chapterInfos` 获取书籍的章节信息
   - 使用POST方法，并设置正确的请求头和JSON请求体格式
2. 调用 `/web/book/bookmarklist?bookId={bookId}` 获取书籍的划线记录
3. 调用 `/api/review/list?bookId={bookId}&listType=11&syncKey=0&mine=1` 获取书籍的笔记记录
4. 整合划线和笔记信息，按章节顺序组织
5. 返回结构化的数据

### 返回格式
```json
{
  "book_id": "27416212",
  "book_title": "隐藏的自我",
  "total_highlights": 35,
  "total_notes": 14,
  "last_updated": "2025-05-01T12:34:58Z",
  "chapters": [
    {
      "chapter_id": 5,
      "chapter_idx": 5,
      "title": "01 大脑通常是以隐藏模式运行的",
      "level": 1,
      "highlights": [
        {
          "highlight_id": "27416212_5_123-456",
          "text": "基因组的作用只有在与环境相互作用的情况下才能真正被理解。",
          "style": 3,
          "create_time": "2025-04-29T10:23:43Z"
        }
      ],
      "notes": [
        {
          "note_id": "82355925_7ZLpqbTrm",
          "content": "人的性格，情绪，状态波动其实也源于大脑状态的改变。但大脑的状态对\"自我意识\"而言是不可知的",
          "highlight_text": "由于我们的大脑会出现异常的波动，有时候会发现自己更为急躁、幽默、健谈、平静、有活力，或者思维更清晰。我们的内在环境和外在行为受到生物基础的引导，既不能直接接触，也不能直接认识。",
          "create_time": "2025-04-29T10:25:32Z"
        }
      ]
    }
  ]
}
```

## 3. 获取书架信息工具 (`get_bookshelf`)

### 功能描述
Get all books in the user's WeRead bookshelf.

### 参数设计
此工具不需要参数。

### 实现逻辑
1. 调用 `/api/user/notebook` 获取用户书架上所有有笔记的书籍列表
2. 整理返回结果，提取每本书籍的关键信息

### 返回格式
```json
{
  "books": [
    {
      "bookId": "27416212",
      "title": "隐藏的自我",
      "author": "大卫·伊格曼",
      "translator": "钱静",
      "category": "科学技术-科学科普",
      "finished": true,
      "updateTime": "2025-05-01T12:34:58Z",
      "noteCount": 42,
      "reviewCount": 4,
      "bookmarkCount": 35
    },
    {
      // 第二本书籍
    }
  ]
}
```

## 工具注册与LLM调用方式

在MCP Server中，可以通过以下方式将这两个工具注册为LLM可调用的函数：

```javascript
// 工具注册配置
const tools = [
  {
    name: "search_books",
    description: "通过关键词搜索用户书架上的书籍",
    parameters: {
      type: "object",
      properties: {
        keyword: {
          type: "string",
          description: "搜索关键词，用于匹配书名或作者"
        },
        exact_match: {
          type: "boolean",
          description: "是否精确匹配，默认为模糊匹配",
          default: false
        },
        include_details: {
          type: "boolean",
          description: "是否包含详细信息",
          default: true
        },
        max_results: {
          type: "integer",
          description: "最多返回结果数",
          default: 5
        }
      },
      required: ["keyword"]
    },
    function: async (cookies, params) => {
      return await bookService.searchBooks(cookies, params);
    }
  },
  {
    name: "get_book_notes_and_highlights",
    description: "获取指定书籍的所有划线和笔记，并按章节组织返回",
    parameters: {
      type: "object",
      properties: {
        book_id: {
          type: "string",
          description: "书籍ID"
        },
        include_chapters: {
          type: "boolean",
          description: "是否包含章节信息",
          default: true
        },
        organize_by_chapter: {
          type: "boolean",
          description: "是否按章节组织",
          default: true
        },
        highlight_style: {
          type: ["integer", "null"],
          description: "划线样式筛选，null表示全部",
          default: null
        }
      },
      required: ["book_id"]
    },
    function: async (cookies, params) => {
      return await noteService.getBookNotesAndHighlights(cookies, params);
    }
  }
];
```

## 使用场景示例

### 场景1: 用户想找出关于"认知科学"的书籍
```
用户: "帮我找一下我书架上关于认知科学的书"

LLM调用: search_books({keyword: "认知科学", include_details: true})

系统响应: [返回匹配的书籍列表]

LLM回复: "我在您的书架上找到了2本关于认知科学的书:
1. 《隐藏的自我》(大卫·伊格曼) - 已阅读96%，您做了42个笔记
2. 《思考，快与慢》(丹尼尔·卡尼曼) - 已阅读75%，您做了28个笔记

您想了解哪本书的更多信息或笔记?"
```

### 场景2: 用户想查看特定书籍的笔记
```
用户: "帮我整理一下《隐藏的自我》这本书中关于'大脑决策'的笔记"

LLM首先调用: search_books({keyword: "隐藏的自我", exact_match: true})
系统响应: [返回书籍信息，包含book_id]

LLM然后调用: get_book_notes_and_highlights({book_id: "27416212", organize_by_chapter: true})
系统响应: [返回书籍的所有划线和笔记，按章节组织]

LLM处理: [分析所有笔记和划线，筛选出包含"大脑决策"相关内容]

LLM回复: "在《隐藏的自我》中，我找到了以下与'大脑决策'相关的笔记和划线:

第五章《我们的行为是大脑不同系统竞争的结果》:
1. 您的笔记: '大脑中存在多个相互竞争的决策系统，理性与情绪常常冲突'
2. 划线: '两党制：大脑是理性的还是情绪化的...'

第六章《对大脑所做的决策进行"问责"不可取》:
1. 您的笔记: '自由意志的幻觉 - 决策在意识之前就已经完成'
2. 划线: '我们是否拥有自由意志...'

这些内容主要讨论了大脑决策过程中的双系统理论、情绪与理性的关系，以及自由意志的问题。您想深入了解哪个方面？"
```

## 优势和考量

1. **模块化设计**：这两个基础工具提供了足够的基础功能，可以满足大多数用户场景

2. **性能优化**：
   - 避免了遍历所有书籍的性能问题
   - 通过参数设计允许灵活控制返回数据量
   - 支持精确匹配选项减少不必要的数据处理

3. **灵活扩展**：
   - 基于这两个基础工具，LLM可以完成许多复杂任务
   - 未来可以根据需求添加更多专用工具

4. **用户体验**：
   - 返回数据结构清晰，便于LLM理解和呈现
   - 支持按章节组织的笔记提供更好的上下文理解
