import * as fs from 'fs';
import * as path from 'path';

export interface BookMark {
  bookId: string;
  chapterUid: number;
  markText: string;
  createTime: number;
  style: number;
}

export interface Review {
  bookId: string;
  chapterUid: number;
  content: string;
  createTime: number;
  type: number;
}

export interface Notebook {
  bookId: string;
  title: string;
  author: string;
  cover: string;
  noteCount: number;
  sort: number;
  synckey?: number;  // 每本书的同步键
}

export interface BookData {
  synckey: number;   // 书籍数据的同步键
  bookmarks: BookMark[];
  reviews: Review[];
  lastUpdateTime: number;
}

export interface CacheData {
  lastSyncTime: number;
  notebooks: Notebook[];
  booksData: Record<string, BookData>;  // 按书籍ID分组的数据，包含同步键
}

export class CacheManager {
  private cacheDir: string;
  private cacheFile: string;
  private cacheData: CacheData;
  private isDirty: boolean = false;

  constructor() {
    this.cacheDir = path.join(process.cwd(), '.cache');
    this.cacheFile = path.join(this.cacheDir, 'weread-cache.json');
    this.cacheData = {
      lastSyncTime: 0,
      notebooks: [],
      booksData: {}
    };
    this.initializeCache();
  }

  private initializeCache(): void {
    try {
      // 确保缓存目录存在
      if (!fs.existsSync(this.cacheDir)) {
        fs.mkdirSync(this.cacheDir, { recursive: true });
      }

      // 尝试加载缓存文件
      if (fs.existsSync(this.cacheFile)) {
        const cacheContent = fs.readFileSync(this.cacheFile, 'utf-8');
        this.cacheData = JSON.parse(cacheContent);
        
        // 兼容旧格式缓存数据
        if (!this.cacheData.booksData && (this.cacheData as any).bookmarks) {
          // 转换旧格式为新格式
          const oldData = this.cacheData as any;
          this.cacheData.booksData = {};
          
          // 整合旧的书签和评论数据
          const allBookIds = new Set<string>();
          if (oldData.bookmarks) {
            Object.keys(oldData.bookmarks).forEach(bookId => allBookIds.add(bookId));
          }
          if (oldData.reviews) {
            Object.keys(oldData.reviews).forEach(bookId => allBookIds.add(bookId));
          }
          
          // 为每本书创建新的数据结构
          allBookIds.forEach(bookId => {
            this.cacheData.booksData[bookId] = {
              synckey: 0,
              bookmarks: oldData.bookmarks?.[bookId] || [],
              reviews: oldData.reviews?.[bookId] || [],
              lastUpdateTime: oldData.lastSyncTime || Date.now()
            };
          });
          
          // 标记缓存为脏，以便保存新格式
          this.isDirty = true;
        }
        
        console.error(`缓存加载成功，上次同步时间: ${new Date(this.cacheData.lastSyncTime).toLocaleString()}`);
      } else {
        console.error('缓存文件不存在，将创建新缓存');
        this.saveCache();
      }
    } catch (error) {
      console.error('初始化缓存失败:', error);
      // 使用默认的空缓存
    }
  }

  /**
   * 保存缓存到文件系统
   */
  public saveCache(): void {
    if (!this.isDirty) return;
    
    try {
      fs.writeFileSync(this.cacheFile, JSON.stringify(this.cacheData, null, 2), 'utf-8');
      console.error(`缓存已保存，当前同步时间: ${new Date(this.cacheData.lastSyncTime).toLocaleString()}`);
      this.isDirty = false;
    } catch (error) {
      console.error('保存缓存失败:', error);
    }
  }

  /**
   * 更新笔记本列表
   */
  public updateNotebooks(notebooks: Notebook[]): void {
    this.cacheData.notebooks = notebooks;
    this.isDirty = true;
  }

  /**
   * 获取书籍的缓存同步键
   */
  public getBookSynckey(bookId: string): number {
    return this.cacheData.booksData[bookId]?.synckey || 0;
  }

  /**
   * 更新指定书籍的数据
   */
  public updateBookData(bookId: string, synckey: number, bookmarks: BookMark[], reviews: Review[]): void {
    if (!this.cacheData.booksData[bookId]) {
      this.cacheData.booksData[bookId] = {
        synckey: 0,
        bookmarks: [],
        reviews: [],
        lastUpdateTime: 0
      };
    }
    
    this.cacheData.booksData[bookId].synckey = synckey;
    this.cacheData.booksData[bookId].bookmarks = bookmarks;
    this.cacheData.booksData[bookId].reviews = reviews;
    this.cacheData.booksData[bookId].lastUpdateTime = Date.now();
    this.isDirty = true;
  }

  /**
   * 更新最后同步时间
   */
  public updateLastSyncTime(timestamp?: number): void {
    this.cacheData.lastSyncTime = timestamp || Date.now();
    this.isDirty = true;
  }

  /**
   * 获取最后同步时间
   */
  public getLastSyncTime(): number {
    return this.cacheData.lastSyncTime;
  }

  /**
   * 获取所有笔记本
   */
  public getNotebooks(): Notebook[] {
    return this.cacheData.notebooks;
  }

  /**
   * 获取指定书籍的书签
   */
  public getBookmarks(bookId: string): BookMark[] {
    return this.cacheData.booksData[bookId]?.bookmarks || [];
  }

  /**
   * 获取指定书籍的评论
   */
  public getReviews(bookId: string): Review[] {
    return this.cacheData.booksData[bookId]?.reviews || [];
  }

  /**
   * 获取所有书签
   */
  public getAllBookmarks(): BookMark[] {
    const allBookmarks: BookMark[] = [];
    for (const bookId in this.cacheData.booksData) {
      allBookmarks.push(...this.cacheData.booksData[bookId].bookmarks);
    }
    return allBookmarks;
  }

  /**
   * 获取所有评论
   */
  public getAllReviews(): Review[] {
    const allReviews: Review[] = [];
    for (const bookId in this.cacheData.booksData) {
      allReviews.push(...this.cacheData.booksData[bookId].reviews);
    }
    return allReviews;
  }

  /**
   * 搜索所有笔记内容
   */
  public searchNotes(keyword: string): Array<{bookId: string, type: string, content: string, createTime: number, chapterUid: number}> {
    const results = [];
    const lowerKeyword = keyword.toLowerCase();
    
    // 搜索书签
    for (const bookId in this.cacheData.booksData) {
      // 搜索书签
      for (const bookmark of this.cacheData.booksData[bookId].bookmarks) {
        if (bookmark.markText.toLowerCase().includes(lowerKeyword)) {
          results.push({
            bookId: bookmark.bookId,
            type: 'highlight',
            content: bookmark.markText,
            createTime: bookmark.createTime,
            chapterUid: bookmark.chapterUid
          });
        }
      }
      
      // 搜索评论
      for (const review of this.cacheData.booksData[bookId].reviews) {
        if (review.content.toLowerCase().includes(lowerKeyword)) {
          results.push({
            bookId: review.bookId,
            type: 'review',
            content: review.content,
            createTime: review.createTime,
            chapterUid: review.chapterUid
          });
        }
      }
    }
    
    // 按时间排序，最新的在前面
    results.sort((a, b) => b.createTime - a.createTime);
    
    return results;
  }
} 