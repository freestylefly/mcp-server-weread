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
 * 格式化阅读时间的辅助函数
 * @param seconds 阅读时间（秒）
 * @returns 格式化后的阅读时间
 */
const formatReadingTime = (seconds: number): string => {
  if (!seconds) return "0分钟";
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (hours > 0) {
    return `${hours}小时${minutes > 0 ? minutes + '分钟' : ''}`;
  } else {
    return `${minutes}分钟`;
  }
};

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
        description: "Get all books in the user's bookshelf with comprehensive statistics and categorization information",
        inputSchema: {
          type: "object",
          properties: {},
          required: []
        }
      },
      {
        name: "search_books",
        description: "Search for books in the user's bookshelf by keywords and return matching books with details and reading progress",
        inputSchema: {
          type: "object",
          properties: {
            keyword: {
              type: "string",
              description: "Search keyword to match book title, author, translator or category"
            },
            exact_match: {
              type: "boolean",
              description: "Whether to use exact matching, default is fuzzy matching",
              default: false
            },
            include_details: {
              type: "boolean",
              description: "Whether to include detailed information",
              default: true
            },
            max_results: {
              type: "integer",
              description: "Maximum number of results to return",
              default: 5
            }
          },
          required: ["keyword"]
        }
      },
      {
        name: "get_book_notes_and_highlights",
        description: "Get all highlights and notes for a specific book, organized by chapter",
        inputSchema: {
          type: "object",
          properties: {
            book_id: {
              type: "string",
              description: "Book ID"
            },
            include_chapters: {
              type: "boolean",
              description: "Whether to include chapter information",
              default: true
            },
            organize_by_chapter: {
              type: "boolean",
              description: "Whether to organize by chapter",
              default: true
            },
            highlight_style: {
              type: ["integer", "null"],
              description: "Highlight style filter, null means all",
              default: null
            }
          },
          required: ["book_id"]
        }
      },
      {
        name: "get_book_best_reviews",
        description: "Get popular reviews for a specific book",
        inputSchema: {
          type: "object",
          properties: {
            book_id: {
              type: "string",
              description: "Book ID"
            },
            count: {
              type: "integer",
              description: "Number of reviews to return",
              default: 10
            },
            max_idx: {
              type: "integer",
              description: "Pagination index",
              default: 0
            },
            synckey: {
              type: "integer",
              description: "Sync key for pagination",
              default: 0
            }
          },
          required: ["book_id"]
        }
      },
      {
        name: "get_book_best_bookmarks",
        description: "Get popular highlights/bookmarks for a specific book from the community",
        inputSchema: {
          type: "object",
          properties: {
            book_id: {
              type: "string",
              description: "Book ID"
            },
            count: {
              type: "integer",
              description: "Number of bookmarks to return (max 200)",
              default: 10
            },
            synckey: {
              type: "integer",
              description: "Sync key for pagination",
              default: 0
            }
          },
          required: ["book_id"]
        }
      },
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
        // 获取完整书架信息
        const entireShelfData = await wereadApi.getEntireShelf();
        // 获取有笔记的书籍信息
        const notebookData = await wereadApi.getBookshelf();
        
        // 提取和分析数据
        const bookProgress = entireShelfData.bookProgress || [];
        const shelfBooks = entireShelfData.books || [];
        const archiveData = entireShelfData.archive || [];
        const notebookBooks = notebookData.books || [];
        
        // 统计信息 - 阅读状态
        const totalBooks = shelfBooks.length;
        // 未读书籍：finishReading = 0 且 progress = 0
        const unreadBooks = shelfBooks.filter((book: any) => {
          const progress = bookProgress.find((p: any) => p.bookId === book.bookId);
          return book.finishReading !== 1 && (!progress || progress.progress === 0);
        }).length;
        // 在读书籍：finishReading = 0 且 progress > 0
        const readingBooks = shelfBooks.filter((book: any) => {
          const progress = bookProgress.find((p: any) => p.bookId === book.bookId);
          return book.finishReading !== 1 && progress && progress.progress > 0;
        }).length;
        // 读完书籍：finishReading = 1
        const finishedBooks = shelfBooks.filter((book: any) => book.finishReading === 1).length;
        
        // 导入书籍统计（CB开头的bookId）
        const importedBooks = shelfBooks.filter((book: any) => book.bookId.startsWith('CB_')).length;
        const wereadBooks = totalBooks - importedBooks;
        
        // 已购买书籍
        const paidBooks = shelfBooks.filter((book: any) => book.paid === 1).length;
        
        // 有笔记的书籍
        const booksWithNotes = notebookBooks.length;
        
        // 书籍分类统计
        const categoryStats: Record<string, number> = {};
        shelfBooks.forEach((book: any) => {
          if (book.categories && book.categories.length > 0) {
            book.categories.forEach((cat: any) => {
              const categoryTitle = cat.title || 'unknown';
              categoryStats[categoryTitle] = (categoryStats[categoryTitle] || 0) + 1;
            });
          }
        });
        
        // 获取主要分类（出现频率最高的前5个）
        const mainCategories = Object.entries(categoryStats)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([category, count]) => ({ category, count }));
        
        // 书单统计
        const totalCategories = archiveData.length;
        const categoryCounts = archiveData.map((archive: any) => ({
          name: archive.name,
          count: archive.bookIds ? archive.bookIds.length : 0
        }));
        
        // 排序找出最大和最小的书单
        const sortedCategories = [...categoryCounts].sort((a, b) => b.count - a.count);
        const largestCategory = sortedCategories.length > 0 ? sortedCategories[0] : null;
        const smallestCategory = sortedCategories.length > 0 ? sortedCategories[sortedCategories.length - 1] : null;
        
        // 获取书单分类信息
        const booklists = archiveData.map((archive: any) => ({
          name: archive.name,
          id: archive.archiveId,
          bookCount: archive.bookIds ? archive.bookIds.length : 0
        }));
        
        // 处理书籍数据，为每本书添加更多信息
        const books = [];
        for (const book of shelfBooks) {
          // 寻找对应的进度信息
          const progressInfo = bookProgress.find((progress: any) => progress.bookId === book.bookId);
          
          // 寻找对应的笔记信息
          const notebookInfo = notebookBooks.find((nb: any) => nb.bookId === book.bookId);
          
          // 寻找该书所属的书单
          const belongCategories = archiveData
            .filter((archive: any) => archive.bookIds && archive.bookIds.includes(book.bookId))
            .map((archive: any) => archive.name);
          
          // 提取分类信息
          let categories = [];
          if (book.categories && book.categories.length > 0) {
            categories = book.categories.map((cat: any) => cat.title);
          }
          
          // 组装书籍信息
          books.push({
            bookId: book.bookId || "",
            title: book.title || "",
            author: book.author || "",
            translator: book.translator || "",
            categories: categories,
            bookLists: belongCategories,
            publishTime: book.publishTime || "",
            finishReading: book.finishReading === 1,
            price: book.price || 0,
            paid: book.paid === 1,
            isImported: book.bookId.startsWith('CB_'),
            progress: progressInfo ? progressInfo.progress : 0,
            readingTime: progressInfo ? progressInfo.readingTime : 0, // 阅读时间（秒）
            readingTimeFormatted: formatReadingTime(progressInfo ? progressInfo.readingTime : 0),
            updateTime: progressInfo ? new Date(progressInfo.updateTime * 1000).toISOString() : "",
            noteCount: notebookInfo ? notebookInfo.noteCount || 0 : 0,
            reviewCount: notebookInfo ? notebookInfo.reviewCount || 0 : 0,
            bookmarkCount: notebookInfo ? notebookInfo.bookmarkCount || 0 : 0
          });
        }
        
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              stats: {
                totalBooks,
                readingStatus: {
                  unreadBooks,
                  readingBooks,
                  finishedBooks
                },
                bookSource: {
                  importedBooks,
                  wereadBooks
                },
                paidBooks,
                booksWithNotes,
                categories: {
                  categoryStats,
                  mainCategories
                }
              },
              booklistStats: {
                totalCategories,
                largestCategory,
                smallestCategory
              },
              booklists,
              books
            }, null, 2)
          }]
        };
      }

      // 通过关键词检索用户书架上的书籍
      case "search_books": {
        const keyword = String(request.params.arguments?.keyword || "");
        const exactMatch = Boolean(request.params.arguments?.exact_match || false);
        const includeDetails = Boolean(request.params.arguments?.include_details !== false);
        const maxResults = Number(request.params.arguments?.max_results || 5);
        
        if (!keyword) {
          throw new Error("搜索关键词不能为空");
        }
        
        // 1. 获取完整书架信息
        const entireShelfData = await wereadApi.getEntireShelf();
        const shelfBooks = entireShelfData.books || [];
        const bookProgress = entireShelfData.bookProgress || [];
        const archiveData = entireShelfData.archive || [];
        
        // 2. 获取有笔记的书籍信息
        const notebookData = await wereadApi.getBookshelf();
        const notebookBooks = notebookData.books || [];
        
        // 3. 根据关键词筛选
        const keywordLower = keyword.toLowerCase();
        const matchedBooks = shelfBooks.filter((book: any) => {
          const title = (book.title || "").toLowerCase();
          const author = (book.author || "").toLowerCase();
          const translator = (book.translator || "").toLowerCase();
          
          // 添加对类别的检索
          let categoryMatch = false;
          if (book.categories && book.categories.length > 0) {
            categoryMatch = book.categories.some((cat: any) => 
              (cat.title || "").toLowerCase().includes(keywordLower)
            );
          }
          
          // 检索书单名称
          let bookListMatch = false;
          for (const archive of archiveData) {
            if (archive.name.toLowerCase().includes(keywordLower) && 
                archive.bookIds && archive.bookIds.includes(book.bookId)) {
              bookListMatch = true;
              break;
            }
          }
          
          if (exactMatch) {
            return title === keywordLower || author === keywordLower || 
                   translator === keywordLower || categoryMatch || bookListMatch;
          } else {
            return title.includes(keywordLower) || author.includes(keywordLower) || 
                   translator.includes(keywordLower) || categoryMatch || bookListMatch;
          }
        }).slice(0, maxResults);
        
        // 4. 获取详细信息
        const booksWithDetails = [];
        
        if (includeDetails) {
          for (const matchedBook of matchedBooks) {
            const bookId = matchedBook.bookId;
            
            // 4.1 获取进度信息
            const progressInfo = bookProgress.find((progress: any) => progress.bookId === bookId);
            
            // 4.2 获取笔记信息
            const notebookInfo = notebookBooks.find((nb: any) => nb.bookId === bookId);
            
            // 4.3 获取所属书单
            const belongCategories = archiveData
              .filter((archive: any) => archive.bookIds && archive.bookIds.includes(bookId))
              .map((archive: any) => archive.name);
            
            // 4.4 提取分类信息
            let categories = [];
            if (matchedBook.categories && matchedBook.categories.length > 0) {
              categories = matchedBook.categories.map((cat: any) => cat.title);
            }
            
            // 4.5 获取书籍详细信息
            const bookInfo = await wereadApi.getBookinfo(bookId);
            
            // 4.6 获取阅读详情
            const readInfo = await wereadApi.getReadInfo(bookId);
            
            // 4.7 获取开始阅读时间
            const startReadingTime = readInfo.book?.startReadingTime || 0;
            const startReadingTimeISO = startReadingTime > 0 
              ? new Date(startReadingTime * 1000).toISOString() 
              : "";
            
            // 4.8 整合信息
            booksWithDetails.push({
              book_id: bookId,
              title: matchedBook.title || "",
              author: matchedBook.author || "",
              translator: matchedBook.translator || "",
              cover: matchedBook.cover || "",
              categories: categories,
              book_lists: belongCategories,
              publish_info: `${matchedBook.publisher || ""} ${matchedBook.publishTime ? matchedBook.publishTime.substring(0, 10) : ""}`,
              format: matchedBook.format || "",
              finish_reading: matchedBook.finishReading === 1,
              paid: matchedBook.paid === 1,
              is_imported: bookId.startsWith('CB_'),
              reading_status: {
                progress: readInfo.book?.progress || progressInfo?.progress || 0,
                reading_time: readInfo.book?.readingTime || progressInfo?.readingTime || 0,
                reading_time_formatted: formatReadingTime(readInfo.book?.readingTime || progressInfo?.readingTime || 0),
                start_reading_time: startReadingTimeISO,
                has_started_reading: startReadingTime > 0,
                last_read_time: readInfo.book?.updateTime 
                  ? new Date(readInfo.book.updateTime * 1000).toISOString() 
                  : progressInfo ? new Date(progressInfo.updateTime * 1000).toISOString() : "",
                note_count: notebookInfo ? notebookInfo.noteCount || 0 : 0,
                bookmark_count: notebookInfo ? notebookInfo.bookmarkCount || 0 : 0,
                review_count: notebookInfo ? notebookInfo.reviewCount || 0 : 0
              },
              book_info: {
                word_count: bookInfo.totalWords || 0,
                price: bookInfo.price || 0,
                rating: bookInfo.newRating ? (bookInfo.newRating / 100) : 0,
                rating_count: bookInfo.newRatingCount || 0,
                description: bookInfo.intro || "",
                publisher: bookInfo.publisher || "",
                isbn: bookInfo.isbn || "",
                category: bookInfo.category || ""
              }
            });
          }
          
          return {
            content: [{
              type: "text",
              text: JSON.stringify({
                total_matches: booksWithDetails.length,
                books: booksWithDetails
              }, null, 2)
            }]
          };
        } else {
          // 简化版返回结果
          
          return {
            content: [{
              type: "text",
              text: JSON.stringify({
                total_matches: matchedBooks.length,
                books: matchedBooks.map((book: any) => ({
                  book_id: book.bookId,
                  title: book.title || "",
                  author: book.author || "",
                  translator: book.translator || "",
                  format: book.format || "",
                  is_imported: book.bookId.startsWith('CB_'),
                  finish_reading: book.finishReading === 1,
                  paid: book.paid === 1,
                  progress: bookProgress.find((p: any) => p.bookId === book.bookId)?.progress || 0,
                  reading_time_formatted: formatReadingTime(bookProgress.find((p: any) => p.bookId === book.bookId)?.readingTime || 0)
                }))
              }, null, 2)
            }]
          };
        }
      }
        
      // 获取指定书籍的所有划线和笔记
      case "get_book_notes_and_highlights": {
        const bookId = String(request.params.arguments?.book_id || "");
        const includeChapters = Boolean(request.params.arguments?.include_chapters !== false);
        const organizeByChapter = Boolean(request.params.arguments?.organize_by_chapter !== false);
        
        // 解析highlight_style参数
        let highlightStyle = null;
        if (request.params.arguments?.highlight_style !== undefined &&
            request.params.arguments?.highlight_style !== null) {
          highlightStyle = Number(request.params.arguments.highlight_style);
        }
        
        if (!bookId) {
          throw new Error("书籍ID不能为空");
        }
        
        // 1. 获取书籍信息
        const bookInfo = await wereadApi.getBookinfo(bookId);
        const bookTitle = bookInfo.title || "";
        
        // 2. 获取书籍阅读进度信息
        const readInfo = await wereadApi.getReadInfo(bookId);
        
        // 3. 获取章节信息
        const chapterInfo = await wereadApi.getChapterInfo(bookId);
        
        // 4. 获取划线数据
        const bookmarkResponse = await wereadApi.getBookmarkList(bookId);
        
        // 确认从响应中获取正确的划线数组
        const highlights = Array.isArray(bookmarkResponse) 
          ? bookmarkResponse 
          : ((bookmarkResponse as any)?.updated || []);
        
        // 5. 获取笔记列表
        const reviews = await wereadApi.getReviewList(bookId);
        
        // 获取开始阅读时间
        const startReadingTime = readInfo.book?.startReadingTime || 0;
        const startReadingTimeISO = startReadingTime > 0 
          ? new Date(startReadingTime * 1000).toISOString() 
          : "";
        
        // 组织数据结构
        const result: any = {
          book_id: bookId,
          book_title: bookTitle,
          book_info: {
            author: bookInfo.author || "",
            translator: bookInfo.translator || "",
            publisher: bookInfo.publisher || "",
            publish_time: bookInfo.publishTime || "",
            word_count: bookInfo.totalWords || 0,
            rating: bookInfo.newRating ? (bookInfo.newRating / 100) : 0,
            category: bookInfo.category || ""
          },
          reading_status: {
            progress: readInfo.book?.progress || 0,
            reading_time: readInfo.book?.readingTime || 0,
            reading_time_formatted: formatReadingTime(readInfo.book?.readingTime || 0),
            start_reading_time: startReadingTimeISO,
            has_started_reading: startReadingTime > 0,
            last_read_time: readInfo.book?.updateTime 
              ? new Date(readInfo.book.updateTime * 1000).toISOString() 
              : "",
            finish_reading: bookInfo.finishReading === 1
          },
          total_highlights: highlights.length,
          total_notes: reviews.length,
          last_updated: new Date().toISOString()
        };
        
        // 处理未分类的内容
        if (organizeByChapter) {
          result.uncategorized = {
            highlights: [],
            notes: []
          };
        } else {
          result.highlights = [];
          result.notes = [];
        }
        
        // 如果需要按章节组织
        if (includeChapters && organizeByChapter) {
          // 第一步：创建所有章节映射 - 从原始数据
          const chapterMap: Record<string, any> = {};
          
          // 将API返回的章节信息转换为我们需要的格式
          const originalChapters = Object.values(chapterInfo);
          
          // 创建基本章节对象 - 简化结构，不保留index和level字段
          originalChapters.forEach((chapter: any) => {
            // 确保chapterUid被转换为字符串
            const chapterUidStr = String(chapter.chapterUid);
            chapterMap[chapterUidStr] = {
              uid: chapter.chapterUid,
              title: chapter.title,
              // 只在构建过程中使用level和index
              _level: chapter.level,
              _index: chapter.chapterIdx,
              children: [],
              highlights: [],
              notes: []
            };
          });
          
          // 第二步：构建章节层级关系
          const rootChapters: any[] = [];
          const chapterLevels: Record<number, any[]> = {};
          
          // 按level分组
          Object.values(chapterMap).forEach(chapter => {
            if (!chapterLevels[chapter._level]) {
              chapterLevels[chapter._level] = [];
            }
            chapterLevels[chapter._level].push(chapter);
          });
          
          // 获取可用的level并排序
          const levels = Object.keys(chapterLevels).map(Number).sort();
          
          // 第一级作为根节点
          if (levels.length > 0) {
            const topLevel = levels[0];
            rootChapters.push(...chapterLevels[topLevel].sort((a, b) => a._index - b._index));
            
            // 从第二级开始，找父章节
            for (let i = 1; i < levels.length; i++) {
              const currentLevel = levels[i];
              
              // 对当前级别的每个章节
              chapterLevels[currentLevel].sort((a, b) => a._index - b._index).forEach(chapter => {
                // 找到前一级别中最近的章节作为父章节
                const prevLevel = levels[i-1];
                const prevLevelChapters = chapterLevels[prevLevel].sort((a, b) => a._index - b._index);
                
                let parent = null;
                for (let j = prevLevelChapters.length - 1; j >= 0; j--) {
                  if (prevLevelChapters[j]._index < chapter._index) {
                    parent = prevLevelChapters[j];
                    break;
                  }
                }
                
                // 如果找到父章节，添加到其children中
                if (parent) {
                  parent.children.push(chapter);
                } else {
                  // 如果找不到父章节，直接添加到根
                  rootChapters.push(chapter);
                }
              });
            }
          }
          
          // 设置结果
          result.chapters = rootChapters;
          
          // 第三步：处理划线数据 - 根据chapterUid分配到对应章节
          let highlightsAddedCount = 0;
          let uncategorizedCount = 0;
          
          highlights.forEach((highlight: any) => {
            // 确保所有必要的字段都存在
            if (!highlight.markText) {
              return;
            }
            
            const chapterUid = highlight.chapterUid;
            if (!chapterUid) {
              return;
            }
            
            if (highlightStyle !== null && highlight.colorStyle !== highlightStyle) {
              return; // 跳过不匹配的划线样式
            }
            
            const highlightData = {
              text: highlight.markText,
              style: highlight.colorStyle || highlight.style || 0,
              create_time: new Date(highlight.createTime * 1000).toISOString()
            };
            
            // 查找对应章节 - 直接以字符串形式查找
            const chapterUidStr = String(chapterUid);
            const chapter = chapterMap[chapterUidStr];
            
            if (chapter) {
              chapter.highlights.push(highlightData);
              highlightsAddedCount++;
            } else {
              result.uncategorized.highlights.push(highlightData);
              uncategorizedCount++;
            }
          });
          
          // 第四步：处理笔记数据 - 根据chapterUid分配到对应章节
          reviews.forEach((review: any) => {
            // 确保所有必要的字段都存在
            if (!review.content) {
              return;
            }
            
            const chapterUid = review.chapterUid;
            if (!chapterUid) {
              return;
            }
            
            const noteData = {
              content: review.content,
              highlight_text: review.abstract || "",
              create_time: new Date(review.createTime * 1000).toISOString()
            };
            
            // 查找对应章节 - 直接以字符串形式查找
            const chapterUidStr = String(chapterUid);
            const chapter = chapterMap[chapterUidStr];
            
            if (chapter) {
              chapter.notes.push(noteData);
            } else {
              result.uncategorized.notes.push(noteData);
            }
          });
          
          // 第五步：清理不必要的字段并递归移除空章节
          const cleanAndRemoveEmpty = (chapters: any[]): any[] => {
            return chapters.filter(chapter => {
              // 先清理章节对象中用于构建的临时字段
              delete chapter._level;
              delete chapter._index;
              
              // 递归处理子章节
              if (chapter.children && chapter.children.length > 0) {
                chapter.children = cleanAndRemoveEmpty(chapter.children);
              }
              
              // 章节不为空的条件：有划线、有笔记或有非空子章节
              return (
                (chapter.highlights && chapter.highlights.length > 0) ||
                (chapter.notes && chapter.notes.length > 0) ||
                (chapter.children && chapter.children.length > 0)
              );
            });
          };
          
          result.chapters = cleanAndRemoveEmpty(result.chapters);
        } else if (!organizeByChapter) {
          // 非按章节组织模式
          highlights.forEach((highlight: any) => {
            if (!highlight.markText || !highlight.chapterUid) return;
            if (highlightStyle !== null && highlight.colorStyle !== highlightStyle) return;
            
            result.highlights.push({
              text: highlight.markText,
              style: highlight.colorStyle || highlight.style || 0,
              create_time: new Date(highlight.createTime * 1000).toISOString(),
              chapter_uid: highlight.chapterUid,
              chapter_title: chapterInfo[highlight.chapterUid]?.title || "未知章节"
            });
          });
          
          reviews.forEach((review: any) => {
            if (!review.content || !review.chapterUid) return;
            
            result.notes.push({
              content: review.content,
              highlight_text: review.abstract || "",
              create_time: new Date(review.createTime * 1000).toISOString(),
              chapter_uid: review.chapterUid,
              chapter_title: chapterInfo[review.chapterUid]?.title || "未知章节"
            });
          });
        }
        
        return {
          content: [{
            type: "text",
            text: JSON.stringify(result, null, 2)
          }]
        };
      }

      // 获取书籍热门书评
      case "get_book_best_reviews": {
        const bookId = String(request.params.arguments?.book_id || "");
        const count = Number(request.params.arguments?.count || 10);
        const maxIdx = Number(request.params.arguments?.max_idx || 0);
        const synckey = Number(request.params.arguments?.synckey || 0);
        
        if (!bookId) {
          throw new Error("书籍ID不能为空");
        }
        
        // 1. 获取书籍信息
        const bookInfo = await wereadApi.getBookinfo(bookId);
        
        // 2. 获取热门书评
        const bestReviewsData = await wereadApi.getBestReviews(bookId, count, maxIdx, synckey);
        
        // 控制台打印原始返回数据，方便调试
        // console.error("热门书评原始数据:", JSON.stringify(bestReviewsData, null, 2));
        
        // 3. 提取基础数据
        const hasMore = bestReviewsData.reviewsHasMore || false;
        const syncKey = bestReviewsData.synckey || 0;
        const totalCount = bestReviewsData.reviewsCnt || 0;
        
        // 4. 处理每条书评 - 根据接口确切的数据结构
        let processedReviews: any[] = [];
        
        if (bestReviewsData.reviews && Array.isArray(bestReviewsData.reviews)) {
          processedReviews = bestReviewsData.reviews
            .filter((item: any) => {
              return item && item.review && item.review.review;
            })
            .map((item: any) => {
              const reviewContainer = item.review; // {reviewId, review}
              const review = reviewContainer.review; // 实际评论内容
              const author = review.author || {};
              
              // 仅处理有内容的评论
              if (!review.content && !review.htmlContent) {
                return null;
              }
              
              // 处理评分 - 实际返回示例中用star表示评分(0-100)
              let rating = 0;
              if (review.star) {
                rating = review.star / 20; // 转换为5分制
              } else if (review.newRatingLevel) {
                // 有些评论用newRatingLevel表示评分级别
                switch(review.newRatingLevel) {
                  case 1: rating = 5; break; // "好看"
                  case 2: rating = 3; break; // "一般"
                  case 3: rating = 1; break; // "不行"
                  default: rating = 0;
                }
              }
              
              // 构建评论对象
              return {
                review_id: reviewContainer.reviewId || "",
                content: review.content || review.htmlContent || "",
                rating: rating,
                likes: review.liked || reviewContainer.likesCount || 0,
                comments: review.comments || 0,
                created_time: review.createTime ? new Date(review.createTime * 1000).toISOString() : "",
                //user_id: author.userVid || "",
                author_nickname: author.name || "",
                //avatar_url: author.avatar || ""
                is_spoiler: !!review.notVisibleToFriends,
                is_top: item.idx === 1 || !!item.isTop // 置顶评论判断
              };
            })
            .filter(Boolean); // 过滤掉null值
        }
        
        // 5. 返回结果
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              book_id: bookId,
              book_title: bookInfo.title || "",
              book_author: bookInfo.author || "",
              total_reviews: totalCount,
              has_more: hasMore,
              sync_key: syncKey,
              reviews: processedReviews
            }, null, 2)
          }]
        };
      }

      // 获取书籍热门划线
      case "get_book_best_bookmarks": {
        const bookId = String(request.params.arguments?.book_id || "");
        const count = Number(request.params.arguments?.count || 10);
        const synckey = Number(request.params.arguments?.synckey || 0);
        
        if (!bookId) {
          throw new Error("书籍ID不能为空");
        }
        
        // 1. 获取书籍信息
        const bookInfo = await wereadApi.getBookinfo(bookId);
        
        // 2. 获取热门划线
        const bestBookmarksData = await wereadApi.getBestBookmarks(bookId, count, synckey);
        
        // 3. 提取基础数据
        const bestBookMarks = bestBookmarksData.bestBookMarks || {};
        const hasMore = bestBookMarks.hasMore || false;
        const syncKey = bestBookMarks.synckey || 0;
        const totalCount = bestBookMarks.totalCount || 0;
        
        // 4. 处理每条划线
        let processedBookmarks: any[] = [];
        
        if (bestBookMarks.items && Array.isArray(bestBookMarks.items)) {
          // 创建章节映射以便获取章节标题
          const chapterMap: Record<number, string> = {};
          if (bestBookMarks.chapters && Array.isArray(bestBookMarks.chapters)) {
            bestBookMarks.chapters.forEach((chapter: any) => {
              chapterMap[chapter.chapterUid] = chapter.title;
            });
          }
          
          processedBookmarks = bestBookMarks.items
            .filter((item: any) => {
              return item && item.markText;
            })
            .map((item: any) => {
              return {
                bookmark_id: item.bookmarkId || "",
                text: item.markText || "",
                chapter_title: chapterMap[item.chapterUid] || "未知章节",
                range: item.range || "",
                total_likes: item.totalCount || 0
              };
            })
            .filter(Boolean); // 过滤掉null值
        }
        
        // 5. 返回结果
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              book_id: bookId,
              book_title: bookInfo.title || "",
              book_author: bookInfo.author || "",
              total_bookmarks: totalCount,
              has_more: hasMore,
              sync_key: syncKey,
              bookmarks: processedBookmarks
            }, null, 2)
          }]
        };
      }

      default:
        throw new Error(`未知的工具: ${request.params.name}`);
    }
  } catch (error: any) {
    return {
      error: {
        message: error.message
      }
    };
  }
});

/**
 * 启动服务器
 */
async function main() {
  try {
    // 处理可能来自Claude传递的环境变量
    processClaudeArgs();
    
    // 创建标准IO传输层
    const transport = new StdioServerTransport();
    
    // 启动服务器
    await server.connect(transport);
    
    console.error("[微信读书MCP服务器] 服务启动成功...");
  } catch (error) {
    console.error("[微信读书MCP服务器] 启动失败:", error);
    process.exit(1);
  }
}

/**
 * 处理Claude传递的环境变量参数
 * Claude可以通过环境变量传递配置信息，格式如下:
 * {
 *   "command": "node",
 *   "args": ["path/to/index.js"],
 *   "env": {
 *     "CC_URL": "...",
 *     "CC_ID": "...",
 *     "CC_PASSWORD": "..."
 *   }
 * }
 */
function processClaudeArgs(): void {
  try {
    // 获取环境变量中可能存在的Claude配置
    const ccUrl = process.env.CC_URL;
    const ccId = process.env.CC_ID;
    const ccPassword = process.env.CC_PASSWORD;
    const wereadCookie = process.env.WEREAD_COOKIE;
    
    if ((ccUrl && ccId && ccPassword) || wereadCookie) {
      // 构建命令行参数
      const args: Record<string, string> = {};
      
      if (ccUrl) args.CC_URL = ccUrl;
      if (ccId) args.CC_ID = ccId;
      if (ccPassword) args.CC_PASSWORD = ccPassword;
      if (wereadCookie) args.WEREAD_COOKIE = wereadCookie;
      
      // 将环境变量作为命令行参数传递给WeReadApi
      process.argv.push('--args');
      process.argv.push(JSON.stringify(args));
    }
  } catch (error) {
    console.error("[微信读书MCP服务器] 处理Claude参数时出错:", error);
  }
}

main().catch(error => {
  console.error("[微信读书MCP服务器] 运行时错误:", error);
  process.exit(1);
});
