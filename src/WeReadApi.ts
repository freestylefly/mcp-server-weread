import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import axios from 'axios';
import dotenv from 'dotenv';
import { CacheManager, BookMark as CachedBookMark, Review as CachedReview, Notebook as CachedNotebook } from './CacheManager.js';

dotenv.config();

const WEREAD_URL = "https://weread.qq.com/";
const WEREAD_NOTEBOOKS_URL = "https://i.weread.qq.com/user/notebooks";
const WEREAD_BOOKMARKLIST_URL = "https://i.weread.qq.com/book/bookmarklist";
const WEREAD_CHAPTER_INFO = "https://i.weread.qq.com/book/chapterInfos";
const WEREAD_READ_INFO_URL = "https://i.weread.qq.com/book/readinfo";
const WEREAD_REVIEW_LIST_URL = "https://i.weread.qq.com/review/list";
const WEREAD_BOOK_INFO = "https://i.weread.qq.com/book/info";
const WEREAD_READDATA_DETAIL = "https://i.weread.qq.com/readdata/detail";
const WEREAD_HISTORY_URL = "https://i.weread.qq.com/readdata/summary?synckey=0";

interface ChapterInfo {
  chapterUid: number;
  chapterIdx: number;
  updateTime: number;
  readAhead: number;
  title: string;
  level: number;
}

interface BookMark {
  bookId: string;
  chapterUid: number;
  markText: string;
  createTime: number;
  style: number;
}

interface Review {
  bookId: string;
  chapterUid: number;
  content: string;
  createTime: number;
  type: number;
}

export class WeReadApi {
  private cookie: string = "";
  private axiosInstance: any;
  private initialized: boolean = false;
  public cacheManager: CacheManager;

  constructor() {
    this.cacheManager = new CacheManager();
    this.initAsync().catch(error => {
      console.error("初始化WeReadApi失败:", error);
    });
  }

  private async initAsync(): Promise<void> {
    if (this.initialized) return;
    
    try {
      this.cookie = await this.getCookie();
      this.axiosInstance = axios.create({
        headers: {
          'Cookie': this.cookie,
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36'
        },
        timeout: 60000  // 设置60秒超时，避免Request timed out错误
      });
      this.initialized = true;
      console.error("WeReadApi初始化成功");
    } catch (error) {
      console.error("初始化失败:", error);
      throw error;
    }
  }

  private async tryGetCloudCookie(url: string, id: string, password: string): Promise<string | null> {
    if (url.endsWith("/")) {
      url = url.slice(0, -1);
    }
    const reqUrl = `${url}/get/${id}`;
    const data = { password };
    
    try {
      console.error(`正在从Cookie Cloud获取Cookie: ${reqUrl}`);
      const response = await axios.post(reqUrl, data, { timeout: 30000 });
      
      if (response.status === 200) {
        const responseData = response.data;
        const cookieData = responseData.cookie_data;
        
        if (cookieData && "weread.qq.com" in cookieData) {
          // 从Cookie Cloud获取微信读书的cookie并使用
          console.error("从Cookie Cloud获取到微信读书Cookie");
          
          // 构建cookie字符串
          const cookieItems = [];
          for (const key in cookieData["weread.qq.com"]) {
            const cookie = cookieData["weread.qq.com"][key];
            cookieItems.push(`${cookie.name}=${cookie.value}`);
          }
          
          // 使用Cookie Cloud的数据
          if (cookieItems.length > 0) {
            return cookieItems.join("; ");
          }
          
          // 如果无法从Cookie Cloud获取有效数据，再尝试使用本地Cookie
          console.error("无法从Cookie Cloud获取有效Cookie，尝试使用本地Cookie");
          return process.env.WEREAD_COOKIE || "";
        }
      }
      console.warn("从Cookie Cloud获取数据成功，但未找到微信读书Cookie");
    } catch (error) {
      console.error("从Cookie Cloud获取Cookie失败:", error);
    }
    
    return null;
  }

  private async getCookie(): Promise<string> {
    const url = process.env.CC_URL || "https://cookiecloud.malinkang.com/";
    const id = process.env.CC_ID;
    const password = process.env.CC_PASSWORD;
    let cookie = process.env.WEREAD_COOKIE;

    // 优先尝试从Cookie Cloud获取
    if (url && id && password) {
      try {
        console.error("正在尝试从Cookie Cloud获取Cookie...");
        const cloudCookie = await this.tryGetCloudCookie(url, id, password);
        if (cloudCookie) {
          console.error("成功从Cookie Cloud获取Cookie");
          return cloudCookie;
        }
      } catch (error) {
        console.warn("从Cookie Cloud获取Cookie失败，将使用环境变量中的Cookie");
      }
    }

    // 回退到环境变量中的Cookie
    if (!cookie || !cookie.trim()) {
      throw new Error("没有找到cookie，请按照文档填写cookie或配置Cookie Cloud");
    }

    console.error("使用环境变量中的Cookie");
    return cookie;
  }

  private handleErrcode(errcode: number): void {
    if (errcode === -2012 || errcode === -2010) {
      console.error("微信读书Cookie过期了，请参考文档重新设置。https://mp.weixin.qq.com/s/B_mqLUZv7M1rmXRsMlBf7A");
    }
  }

  private async retry<T>(func: () => Promise<T>, maxAttempts = 3, waitMs = 5000): Promise<T> {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await func();
      } catch (error: any) {
        // 记录详细错误信息
        console.error(`错误详情: ${error.message || '未知错误'}`);
        if (error.response) {
          console.error(`响应状态: ${error.response.status}`);
          console.error(`响应数据: ${JSON.stringify(error.response.data || {})}`);
        }
        
        if (attempt === maxAttempts) {
          throw error;
        }
        
        // 增加随机等待时间以避免API限制
        const randomWait = waitMs + Math.floor(Math.random() * 3000);
        console.warn(`第${attempt}次尝试失败，${randomWait}ms后重试...`);
        await new Promise(resolve => setTimeout(resolve, randomWait));
      }
    }
    throw new Error("所有重试都失败了"); // This should never be reached
  }

  private async ensureInitialized(): Promise<void> {
    if (!this.initialized) {
      await this.initAsync();
    }
  }

  private getStandardHeaders(): Record<string, string> {
    return {
      'Cookie': this.cookie,
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36',
      'Connection': 'keep-alive',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
      'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
      'cache-control': 'no-cache',
      'pragma': 'no-cache',
      'sec-ch-ua': '"Google Chrome";v="135", "Not-A.Brand";v="8", "Chromium";v="135"',
      'sec-ch-ua-mobile': '?0',
      'sec-ch-ua-platform': '"Windows"',
      'sec-fetch-dest': 'document',
      'sec-fetch-mode': 'navigate',
      'sec-fetch-site': 'same-origin',
      'upgrade-insecure-requests': '1'
    };
  }

  private getApiHeaders(): Record<string, string> {
    return {
      'Cookie': this.cookie,
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36',
      'Connection': 'keep-alive',
      'Accept': 'application/json, text/plain, */*',
      'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
      'Content-Type': 'application/json;charset=UTF-8',
      'Origin': 'https://weread.qq.com',
      'Referer': 'https://weread.qq.com/',
      'sec-ch-ua': '"Google Chrome";v="135", "Not-A.Brand";v="8", "Chromium";v="135"',
      'sec-ch-ua-mobile': '?0',
      'sec-ch-ua-platform': '"Windows"'
    };
  }

  private async visitHomepage(): Promise<void> {
    try {
      const homeResponse = await axios.get(WEREAD_URL, { 
        headers: this.getStandardHeaders(),
        timeout: 30000
      });
      console.error("访问主页成功，状态码:", homeResponse.status);
    } catch (error: any) {
      console.error("访问主页失败:", error.message);
      // 即使主页访问失败，仍然继续
    }
  }

  private async makeApiRequest<T>(
    url: string, 
    method: 'get' | 'post' = 'get', 
    params: Record<string, any> = {}, 
    data: any = null
  ): Promise<T> {
    await this.ensureInitialized();
    
    // 不再先访问主页
    // await this.visitHomepage();
    
    // 向所有GET请求添加时间戳避免缓存
    if (method === 'get') {
      params._ = new Date().getTime();
    }
    
    const config: any = {
      url,
      method,
      headers: this.getApiHeaders(),
      timeout: 30000
    };
    
    if (method === 'get' && Object.keys(params).length > 0) {
      config.params = params;
    }
    
    if (method === 'post' && data) {
      config.data = data;
    }
    
    const response = await axios(config);
    
    return response.data;
  }

  public async getBookshelf(): Promise<any> {
    await this.ensureInitialized();
    return this.retry(async () => {
      console.error("正在获取书架信息...");
      
      // 使用统一的API请求方法
      const data = await this.makeApiRequest<any>("https://i.weread.qq.com/shelf/sync", "get", {
        synckey: 0,
        teenmode: 0,
        album: 1,
        onlyBookid: 0
      });
      
      console.error("获取书架信息成功");
      return data;
    });
  }

  /**
   * 获取笔记本列表
   */
  public async getNotebooklist(): Promise<CachedNotebook[]> {
    await this.ensureInitialized();
    return this.retry(async () => {
      console.error("正在获取笔记本列表...");
      
      // 使用synckey=0获取全部数据
      const data = await this.makeApiRequest<any>(WEREAD_NOTEBOOKS_URL, "get", { synckey: 0 });
      
      // 处理返回数据
      const books = data.books || [];
      
      // 添加synckey到每个笔记本
      books.forEach((book: any) => {
        book.synckey = book.synckey || 0;
      });
      
      books.sort((a: any, b: any) => a.sort - b.sort);
      
      console.error("获取笔记本列表成功，共有", books.length, "本书");
      return books;
    });
  }

  public async getBookinfo(bookId: string): Promise<any> {
    await this.ensureInitialized();
    return this.retry(async () => {
      console.error(`正在获取书籍信息: ${bookId}`);
      
      const data = await this.makeApiRequest<any>(WEREAD_BOOK_INFO, "get", { bookId });
      
      console.error(`获取书籍信息成功: ${data.title || bookId}`);
      return data;
    });
  }

  public async getBookmarkList(bookId: string): Promise<any[]> {
    await this.ensureInitialized();
    return this.retry(async () => {
      console.error(`正在获取书籍书签: ${bookId}`);
      
      const data = await this.makeApiRequest<any>(WEREAD_BOOKMARKLIST_URL, "get", { bookId });
      
      const bookmarks = data.updated || [];
      console.error(`获取书籍书签成功，共有${bookmarks.length}条书签`);
      return bookmarks;
    });
  }

  public async getReadInfo(bookId: string): Promise<any> {
    await this.ensureInitialized();
    return this.retry(async () => {
      console.error(`正在获取阅读信息: ${bookId}`);
      
      // 这个API需要特殊的请求头
      const headers = {
        ...this.getApiHeaders(),
        'baseapi': '32',
        'appver': '8.2.5.10163885',
        'basever': '8.2.5.10163885',
        'osver': '12',
        'User-Agent': 'WeRead/8.2.5 WRBrand/xiaomi Dalvik/2.1.0 (Linux; U; Android 12; Redmi Note 7 Pro Build/SQ3A.220705.004)'
      };
      
      // 不再访问主页
      // await this.visitHomepage();
      
      const params = {
        noteCount: 1,
        readingDetail: 1,
        finishedBookIndex: 1,
        readingBookCount: 1,
        readingBookIndex: 1,
        finishedBookCount: 1,
        bookId,
        finishedDate: 1,
        _: new Date().getTime()
      };
      
      const response = await axios.get(WEREAD_READ_INFO_URL, {
        headers,
        params,
        timeout: 30000
      });
      
      console.error(`获取阅读信息成功: ${bookId}`);
      return response.data;
    });
  }

  public async getReviewList(bookId: string): Promise<any[]> {
    await this.ensureInitialized();
    return this.retry(async () => {
      console.error(`正在获取书评列表: ${bookId}`);
      
      const data = await this.makeApiRequest<any>(WEREAD_REVIEW_LIST_URL, "get", {
        bookId,
        listType: 11,
        mine: 1,
        syncKey: 0
      });
      
      let reviews = data.reviews || [];
      reviews = reviews.map((x: any) => x.review);
      
      // Add chapterUid for book reviews
      reviews = reviews.map((x: any) => {
        if (x.type === 4) {
          return { chapterUid: 1000000, ...x };
        }
        return x;
      });
      
      console.error(`获取书评列表成功，共有${reviews.length}条评论`);
      return reviews;
    });
  }

  public async getApiData(): Promise<any> {
    await this.ensureInitialized();
    try {
      console.error("正在获取历史数据...");
      
      const data = await this.makeApiRequest<any>(WEREAD_HISTORY_URL);
      
      console.error("获取历史数据成功");
      return data;
    } catch (error) {
      console.error("获取历史数据失败:", error);
      throw error;
    }
  }

  public async getChapterInfo(bookId: string): Promise<Record<string, ChapterInfo>> {
    await this.ensureInitialized();
    return this.retry(async () => {
      console.error(`正在获取章节信息: ${bookId}`);
      
      const body = {
        bookIds: [bookId],
        synckeys: [0],
        teenmode: 0
      };
      
      const data = await this.makeApiRequest<any>(WEREAD_CHAPTER_INFO, "post", {}, body);
      
      if (data.data && data.data.length === 1 && data.data[0].updated) {
        const update = data.data[0].updated;
        update.push({
          chapterUid: 1000000,
          chapterIdx: 1000000,
          updateTime: 1683825006,
          readAhead: 0,
          title: "点评",
          level: 1
        });
        
        const result = update.reduce((acc: Record<string, ChapterInfo>, curr: ChapterInfo) => {
          acc[curr.chapterUid.toString()] = curr;
          return acc;
        }, {});
        
        console.error(`获取章节信息成功，共有${update.length}个章节`);
        return result;
      } else {
        throw new Error(`获取章节信息失败: ${JSON.stringify(data)}`);
      }
    });
  }

  private transformId(bookId: string): [string, string[]] {
    const idLength = bookId.length;
    
    if (/^\d*$/.test(bookId)) {
      const ary: string[] = [];
      for (let i = 0; i < idLength; i += 9) {
        ary.push(parseInt(bookId.slice(i, Math.min(i + 9, idLength)), 10).toString(16));
      }
      return ["3", ary];
    }
    
    let result = "";
    for (let i = 0; i < idLength; i++) {
      result += bookId.charCodeAt(i).toString(16);
    }
    return ["4", [result]];
  }

  public calculateBookStrId(bookId: string): string {
    const md5 = crypto.createHash('md5');
    md5.update(bookId);
    const digest = md5.digest('hex');
    let result = digest.slice(0, 3);
    
    const [code, transformedIds] = this.transformId(bookId);
    result += code + "2" + digest.slice(-2);
    
    for (let i = 0; i < transformedIds.length; i++) {
      let hexLengthStr = transformedIds[i].length.toString(16);
      if (hexLengthStr.length === 1) {
        hexLengthStr = "0" + hexLengthStr;
      }
      
      result += hexLengthStr + transformedIds[i];
      
      if (i < transformedIds.length - 1) {
        result += "g";
      }
    }
    
    if (result.length < 20) {
      result += digest.slice(0, 20 - result.length);
    }
    
    const finalMd5 = crypto.createHash('md5');
    finalMd5.update(result);
    result += finalMd5.digest('hex').slice(0, 3);
    
    return result;
  }

  public getUrl(bookId: string): string {
    return `https://weread.qq.com/web/reader/${this.calculateBookStrId(bookId)}`;
  }

  /**
   * 获取书签和评论数据，添加同步键
   */
  public async getBookNotesWithSynckey(bookId: string): Promise<{ synckey: number, bookmarks: CachedBookMark[], reviews: CachedReview[] }> {
    await this.ensureInitialized();
    
    // 获取书签
    const bookmarks = await this.getBookmarkList(bookId);
    
    // 获取评论
    const reviews = await this.getReviewList(bookId);
    
    // 获取书籍章节信息中的synckey
    const chapterData = await this.makeApiRequest<any>(WEREAD_CHAPTER_INFO, "post", {}, {
      bookIds: [bookId],
      synckeys: [0],
      teenmode: 0
    });
    
    // 提取synckey
    let synckey = 0;
    if (chapterData.data && chapterData.data.length > 0) {
      synckey = chapterData.data[0].synckey || 0;
    }
    
    return { synckey, bookmarks, reviews };
  }

  /**
   * 同步笔记本数据到缓存
   */
  public async syncNotebooks(): Promise<CachedNotebook[]> {
    console.error("开始同步笔记本数据...");
    
    try {
      // 获取最新笔记本列表
      const notebooks = await this.getNotebooklist();
      
      // 更新缓存
      this.cacheManager.updateNotebooks(notebooks);
      
      console.error(`笔记本数据同步成功，共 ${notebooks.length} 本书`);
      return notebooks;
    } catch (error) {
      console.error("同步笔记本数据失败:", error);
      
      // 如果出错，返回缓存中的数据
      return this.cacheManager.getNotebooks();
    }
  }
  
  /**
   * 同步指定书籍的数据到缓存
   */
  public async syncBookData(bookId: string): Promise<void> {
    console.error(`开始同步书籍 ${bookId} 的数据...`);
    
    try {
      // 获取本地缓存的synckey
      const cachedSynckey = this.cacheManager.getBookSynckey(bookId);
      
      // 获取服务器上的最新数据与synckey
      const { synckey, bookmarks, reviews } = await this.getBookNotesWithSynckey(bookId);
      
      // 检查synckey是否有变化
      if (synckey !== cachedSynckey) {
        console.error(`书籍 ${bookId} 数据有更新，从synckey ${cachedSynckey} 更新到 ${synckey}`);
        
        // 更新缓存
        this.cacheManager.updateBookData(bookId, synckey, bookmarks, reviews);
        this.cacheManager.saveCache();
      } else {
        console.error(`书籍 ${bookId} 数据无变化，synckey: ${synckey}`);
      }
    } catch (error) {
      console.error(`同步书籍 ${bookId} 数据失败:`, error);
    }
  }
  
  /**
   * 同步所有笔记数据
   */
  public async syncAllNotes(): Promise<void> {
    console.error("开始同步所有笔记数据...");
    
    try {
      // 1. 同步笔记本列表
      const notebooks = await this.syncNotebooks();
      
      // 2. 对每本书同步数据
      for (const notebook of notebooks) {
        const bookId = notebook.bookId;
        await this.syncBookData(bookId);
      }
      
      // 3. 更新最后同步时间
      this.cacheManager.updateLastSyncTime();
      
      // 4. 保存缓存
      this.cacheManager.saveCache();
      
      console.error("所有笔记数据同步完成");
    } catch (error) {
      console.error("同步所有笔记数据失败:", error);
    }
  }
  
  /**
   * 增量同步特定书籍的笔记数据
   */
  public async incrementalSyncBook(bookId: string): Promise<void> {
    await this.syncBookData(bookId);
  }
  
  /**
   * 增量同步笔记本列表
   * 仅获取笔记本列表信息，不同步每本书的详细数据
   */
  public async incrementalSyncNotebooks(): Promise<CachedNotebook[]> {
    const notebooks = await this.syncNotebooks();
    this.cacheManager.saveCache();
    return notebooks;
  }
  
  /**
   * 智能增量同步
   * 1. 首先只同步笔记本列表
   * 2. 只对需要查询的书籍做深度同步
   */
  public async smartSync(bookId?: string): Promise<void> {
    // 强制更新笔记本列表以获取最新的书籍synckey信息
    await this.incrementalSyncNotebooks();
    
    if (bookId) {
      // 如果指定了书籍ID，只同步这本书
      await this.incrementalSyncBook(bookId);
    }
  }
  
  /**
   * 使用缓存管理器搜索笔记
   */
  public searchCachedNotes(keyword: string): Array<{bookId: string, type: string, content: string, createTime: number, chapterUid: number}> {
    return this.cacheManager.searchNotes(keyword);
  }
}
