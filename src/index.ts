#!/usr/bin/env node

/**
 * 微信读书 MCP 服务器
 * 基于微信读书API，提供书籍与笔记相关功能
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { WeReadApi } from "./WeReadApi.js";

/**
 * 创建MCP服务器，只提供tools能力
 */
const server = new Server(
  {
    name: "mcp-server-weread",
    version: "0.1.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

/**
 * 列出可用的工具
 */
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "get_bookshelf",
        description: "Get the user's bookshelf information",
        inputSchema: {
          type: "object",
          properties: {},
          required: []
        }
      },
      {
        name: "get_notebooks",
        description: "Get the list of books with notes",
        inputSchema: {
          type: "object",
          properties: {},
          required: []
        }
      },
      {
        name: "get_book_notes",
        description: "Get all notes for a specific book",
        inputSchema: {
          type: "object",
          properties: {
            bookId: {
              type: "string",
              description: "The ID of the book"
            }
          },
          required: ["bookId"]
        }
      },
      {
        name: "get_book_info",
        description: "Get detailed information about a book",
        inputSchema: {
          type: "object",
          properties: {
            bookId: {
              type: "string",
              description: "The ID of the book"
            }
          },
          required: ["bookId"]
        }
      },
      {
        name: "search_notes",
        description: "Search for notes containing a specific keyword",
        inputSchema: {
          type: "object",
          properties: {
            keyword: {
              type: "string",
              description: "The keyword to search for"
            }
          },
          required: ["keyword"]
        }
      },
      {
        name: "get_recent_reads",
        description: "Get the user's recent reading records",
        inputSchema: {
          type: "object",
          properties: {},
          required: []
        }
      }
    ]
  };
});

/**
 * 工具调用处理
 */
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  try {
    const wereadApi = new WeReadApi();

    switch (request.params.name) {
      // 获取书架
      case "get_bookshelf": {
        // 获取书架信息不需要从缓存中读取，直接调用API
        const bookshelfData = await wereadApi.getBookshelf();
        
        const books = [];
        if (bookshelfData.books) {
          for (const book of bookshelfData.books) {
            books.push({
              bookId: book.bookId || "",
              title: book.title || "",
              author: book.author || "",
              cover: book.cover || "",
              category: book.category || "",
              finished: book.finished || false,
              updateTime: book.updateTime || 0
            });
          }
        }
        
        return {
          content: [{
            type: "text",
            text: JSON.stringify({ books }, null, 2)
          }]
        };
      }

      // 获取笔记本列表
      case "get_notebooks": {
        // 先进行增量同步，仅同步笔记本列表
        await wereadApi.incrementalSyncNotebooks();
        
        // 使用缓存中的数据
        const notebooks = wereadApi.cacheManager.getNotebooks();
        
        const formattedNotebooks = notebooks.map(notebook => ({
          bookId: notebook.bookId || "",
          title: notebook.title || "",
          author: notebook.author || "",
          cover: notebook.cover || "",
          noteCount: notebook.noteCount || 0,
          sort: notebook.sort || 0,
          bookUrl: wereadApi.getUrl(notebook.bookId || "")
        }));
        
        return {
          content: [{
            type: "text",
            text: JSON.stringify({ notebooks: formattedNotebooks }, null, 2)
          }]
        };
      }

      // 获取书籍笔记
      case "get_book_notes": {
        const bookId = String(request.params.arguments?.bookId);
        if (!bookId) {
          throw new Error("BookId is required");
        }
        
        // 先进行智能同步，只同步需要的书籍数据
        await wereadApi.smartSync(bookId);
        
        // 1. 获取章节信息
        const chapterInfo = await wereadApi.getChapterInfo(bookId);
        
        // 2. 从缓存获取划线(书签)
        const bookmarks = wereadApi.cacheManager.getBookmarks(bookId) || [];
        
        // 3. 从缓存获取评论/感想
        const reviews = wereadApi.cacheManager.getReviews(bookId) || [];
        
        // 4. 获取书籍基本信息
        const bookInfo = await wereadApi.getBookinfo(bookId) || {};
        
        // 处理章节信息
        const chapters: Record<string, any> = {};
        for (const uid in chapterInfo) {
          const chapter = chapterInfo[uid];
          chapters[uid] = {
            title: chapter.title || "",
            level: chapter.level || 0,
            chapterIdx: chapter.chapterIdx || 0
          };
        }
        
        // 按章节组织笔记
        const organizedNotes: Record<string, any> = {};
        
        // 添加划线
        for (const bookmark of bookmarks) {
          const chapterUid = String(bookmark.chapterUid || "");
          if (!organizedNotes[chapterUid]) {
            organizedNotes[chapterUid] = {
              chapterTitle: chapters[chapterUid]?.title || "未知章节",
              chapterLevel: chapters[chapterUid]?.level || 0,
              highlights: [],
              reviews: []
            };
          }
          
          organizedNotes[chapterUid].highlights.push({
            text: bookmark.markText || "",
            createTime: bookmark.createTime || 0,
            style: bookmark.style || 0
          });
        }
        
        // 添加评论
        for (const review of reviews) {
          const chapterUid = String(review.chapterUid || "");
          if (!organizedNotes[chapterUid]) {
            organizedNotes[chapterUid] = {
              chapterTitle: chapters[chapterUid]?.title || "未知章节",
              chapterLevel: chapters[chapterUid]?.level || 0,
              highlights: [],
              reviews: []
            };
          }
          
          organizedNotes[chapterUid].reviews.push({
            content: review.content || "",
            createTime: review.createTime || 0,
            type: review.type || 0
          });
        }
        
        // 组织最终返回数据
        const result = {
          bookInfo: {
            bookId: bookId,
            title: bookInfo.title || "",
            author: bookInfo.author || "",
            cover: bookInfo.cover || "",
            url: wereadApi.getUrl(bookId)
          },
          notes: organizedNotes
        };
        
        return {
          content: [{
            type: "text",
            text: JSON.stringify(result, null, 2)
          }]
        };
      }

      // 获取书籍详情
      case "get_book_info": {
        const bookId = String(request.params.arguments?.bookId);
        if (!bookId) {
          throw new Error("BookId is required");
        }
        
        // 书籍详情不需要缓存，直接调用API
        const bookInfo = await wereadApi.getBookinfo(bookId);
        
        // 处理并返回整理后的书籍信息
        const formattedInfo = {
          bookId: bookId,
          title: bookInfo.title || "",
          author: bookInfo.author || "",
          cover: bookInfo.cover || "",
          intro: bookInfo.intro || "",
          category: bookInfo.category || "",
          publisher: bookInfo.publisher || "",
          publishTime: bookInfo.publishTime || "",
          isbn: bookInfo.isbn || "",
          bookScore: bookInfo.newRating?.score || 0,
          url: wereadApi.getUrl(bookId)
        };
        
        return {
          content: [{
            type: "text",
            text: JSON.stringify(formattedInfo, null, 2)
          }]
        };
      }

      // 搜索笔记
      case "search_notes": {
        const keyword = String(request.params.arguments?.keyword);
        if (!keyword) {
          throw new Error("Keyword is required");
        }
        
        // 先进行增量同步，仅同步笔记本列表
        await wereadApi.incrementalSyncNotebooks();
        
        // 使用缓存中的数据搜索
        const searchResults = wereadApi.searchCachedNotes(keyword);
        
        // 添加书名到结果中
        const notebooks = wereadApi.cacheManager.getNotebooks();
        const notebookMap = new Map();
        notebooks.forEach(notebook => {
          notebookMap.set(notebook.bookId, notebook.title);
        });
        
        const formattedResults = searchResults.map(result => ({
          bookId: result.bookId,
          bookTitle: notebookMap.get(result.bookId) || "未知书籍",
          chapterUid: result.chapterUid,
          type: result.type,
          content: result.content,
          createTime: result.createTime
        }));
        
        return {
          content: [{
            type: "text",
            text: JSON.stringify({ 
              results: formattedResults, 
              keyword: keyword, 
              count: formattedResults.length 
            }, null, 2)
          }]
        };
      }

      // 获取最近阅读
      case "get_recent_reads": {
        // 获取阅读历史数据不使用缓存，直接调用API
        const historyData = await wereadApi.getApiData();
        
        // 提取并格式化最近阅读数据
        const recentBooks = [];
        
        if (historyData.recentBooks) {
          for (const book of historyData.recentBooks) {
            // 获取每本书的阅读信息
            const readInfo = await wereadApi.getReadInfo(book.bookId);
            
            recentBooks.push({
              bookId: book.bookId || "",
              title: book.title || "",
              author: book.author || "",
              cover: book.cover || "",
              readingTime: readInfo.readingTime || 0,  // 阅读时长(秒)
              progress: readInfo.progress || 0,        // 阅读进度(%)
              lastReadingDate: readInfo.lastReadingDate || 0,
              noteCount: readInfo.noteCount || 0,
              url: wereadApi.getUrl(book.bookId || "")
            });
          }
        }
        
        return {
          content: [{
            type: "text",
            text: JSON.stringify({ recentBooks }, null, 2)
          }]
        };
      }

      default:
        throw new Error("Unknown tool");
    }
  } catch (error: any) {
    return {
      content: [{
        type: "text",
        text: `Error: ${error.message || "Unknown error"}`
      }]
    };
  }
});

/**
 * 启动服务器
 */
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});
