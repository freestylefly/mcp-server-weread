import * as crypto from 'crypto';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

// API URL常量
const WEREAD_URL = "https://weread.qq.com/";
const WEREAD_NOTEBOOKS_URL = "https://weread.qq.com/api/user/notebook";
const WEREAD_BOOK_INFO_URL = "https://weread.qq.com/api/book/info";
const WEREAD_BOOKMARKLIST_URL = "https://weread.qq.com/web/book/bookmarklist";
const WEREAD_CHAPTER_INFO_URL = "https://weread.qq.com/web/book/chapterInfos";
const WEREAD_REVIEW_LIST_URL = "https://weread.qq.com/web/review/list";
const WEREAD_READ_INFO_URL = "https://weread.qq.com/web/book/getProgress";
const WEREAD_SHELF_SYNC_URL = "https://weread.qq.com/web/shelf/sync";
const WEREAD_BEST_REVIEW_URL = "https://weread.qq.com/web/review/list/best";
const WEREAD_AI_SUMMARY_URL = "https://weread.qq.com/web/book/outline";

interface ChapterInfo {
  chapterUid: number;
  chapterIdx: number;
  updateTime: number;
  readAhead: number;
  title: string;
  level: number;
}

// 获取命令行参数
interface CommandArgs {
  WEREAD_COOKIE?: string;
  CC_URL?: string; 
  CC_ID?: string;
  CC_PASSWORD?: string;
}

export class WeReadApi {
  private cookie: string = "";
  private axiosInstance: any;
  private initialized: boolean = false;
  private commandArgs: CommandArgs = {};

  constructor() {
    this.parseCommandArgs();
    this.initAsync().catch(error => {
      console.error("初始化WeReadApi失败:", error);
    });
  }

  // 解析命令行参数
  private parseCommandArgs(): void {
    try {
      const args = process.argv;
      const argsIndex = args.findIndex(arg => arg === '--args');
      
      if (argsIndex !== -1 && argsIndex + 1 < args.length) {
        try {
          this.commandArgs = JSON.parse(args[argsIndex + 1]);
        } catch (error) {
          console.error("解析命令行参数失败:", error);
        }
      }
    } catch (error) {
      console.error("处理命令行参数时出错:", error);
    }
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
        timeout: 60000  // 设置60秒超时
      });
      this.initialized = true;
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
      const response = await axios.post(reqUrl, data, { timeout: 30000 });
      
      if (response.status === 200) {
        const responseData = response.data;

        if (responseData.cookie_data) {
          // 打印所有可用的域名
          const domains = Object.keys(responseData.cookie_data);
          
          // 首先尝试 "weread.qq.com" 域名
          if ("weread.qq.com" in responseData.cookie_data) {
            return this.extractCookiesFromDomain(responseData.cookie_data, "weread.qq.com");
          }
          
          // 然后尝试 "weread" 域名
          if ("weread" in responseData.cookie_data) {
            
            // 检查这些Cookie是否真的是weread.qq.com的Cookie
            const wereadCookies = responseData.cookie_data["weread"];
            const validWereadCookies = wereadCookies.filter((cookie: any) => 
              cookie.domain && (cookie.domain === ".weread.qq.com" || cookie.domain === "weread.qq.com")
            );
            
            if (validWereadCookies.length > 0) {
              const cookieItems = validWereadCookies.map((cookie: any) => `${cookie.name}=${cookie.value}`);
              return cookieItems.join("; ");
            } else {
              console.warn(`[CookieCloud] weread域名下的Cookie不属于微信读书`);
            }
          }
          
          // 最后尝试遍历所有域名，寻找包含weread.qq.com域名的Cookie
          console.warn(`[CookieCloud] 尝试从所有域名中查找微信读书Cookie`);
          for (const domain of domains) {
            const cookiesInDomain = responseData.cookie_data[domain];
            if (Array.isArray(cookiesInDomain)) {
              const wereadCookies = cookiesInDomain.filter((cookie: any) => 
                cookie.domain && (cookie.domain === ".weread.qq.com" || cookie.domain === "weread.qq.com")
              );
              
              if (wereadCookies.length > 0) {
                console.warn(`[CookieCloud] 在${domain}域名下找到${wereadCookies.length}个微信读书Cookie`);
                const cookieItems = wereadCookies.map((cookie: any) => `${cookie.name}=${cookie.value}`);
                return cookieItems.join("; ");
              }
            }
          }
        } else {
          console.warn(`[CookieCloud] 响应中没有cookie_data字段`);
        }
      }
      console.warn("[CookieCloud] 从Cookie Cloud获取数据成功，但未找到微信读书Cookie");
    } catch (error: any) {
      console.error("[CookieCloud] 从Cookie Cloud获取Cookie失败:", error.message);
      if (error.response) {
        console.error(`[CookieCloud] 响应状态: ${error.response.status}`);
      }
    }
    
    return null;
  }
  
  // 从指定域名提取Cookie
  private extractCookiesFromDomain(cookieData: any, domain: string): string | null {
    const cookies = cookieData[domain];
    
    if (!Array.isArray(cookies) || cookies.length === 0) {
      return null;
    }
    
    const cookieItems = [];
    for (const cookie of cookies) {
      if (cookie.name && cookie.value) {
        cookieItems.push(`${cookie.name}=${cookie.value}`);
      }
    }
    
    if (cookieItems.length === 0) {
      return null;
    }
    
    return cookieItems.join("; ");
  }

  private async getCookie(): Promise<string> {
    // 优先级：
    // 1. 命令行参数中的WEREAD_COOKIE
    // 2. 命令行参数中的Cookie Cloud配置
    // 3. 环境变量中的Cookie Cloud配置
    // 4. 环境变量中的WEREAD_COOKIE
    
    let cookie: string | null = null;
    
    // 1. 检查命令行参数中的直接Cookie
    if (this.commandArgs.WEREAD_COOKIE) {
      return this.commandArgs.WEREAD_COOKIE;
    }
    
    // 2. 检查命令行参数中的Cookie Cloud配置
    if (this.commandArgs.CC_URL && this.commandArgs.CC_ID && this.commandArgs.CC_PASSWORD) {
      try {
        cookie = await this.tryGetCloudCookie(
          this.commandArgs.CC_URL,
          this.commandArgs.CC_ID,
          this.commandArgs.CC_PASSWORD
        );
        if (cookie) {
          return cookie;
        }
      } catch (error) {
        console.warn("使用命令行参数中的Cookie Cloud配置获取Cookie失败");
      }
    }
    
    // 3. 尝试环境变量中的Cookie Cloud配置
    const envUrl = process.env.CC_URL;
    const envId = process.env.CC_ID;
    const envPassword = process.env.CC_PASSWORD;
    
    if (envUrl && envId && envPassword) {
      try {
        cookie = await this.tryGetCloudCookie(envUrl, envId, envPassword);
        if (cookie) {
          return cookie;
        }
      } catch (error) {
        console.warn("使用环境变量中的Cookie Cloud配置获取Cookie失败");
      }
    }
    
    // 4. 回退到环境变量中的直接Cookie
    const envCookie = process.env.WEREAD_COOKIE;
    if (!envCookie || !envCookie.trim()) {
      throw new Error("没有找到cookie，请按照文档填写cookie或配置Cookie Cloud");
    }
    
    return envCookie;
  }

  private handleErrcode(errcode: number): void {
    if (errcode === -2012 || errcode === -2010) {
      console.error("微信读书Cookie过期了，请参考文档重新设置。");
    }
  }

  private async retry<T>(func: () => Promise<T>, maxAttempts = 3, waitMs = 5000): Promise<T> {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await func();
      } catch (error: any) {
        if (error.response) {
          console.error(`响应状态: ${error.response.status}`);
        }
        
        if (attempt === maxAttempts) {
          throw error;
        }
        
        const randomWait = waitMs + Math.floor(Math.random() * 3000);
        console.warn(`第${attempt}次尝试失败，${randomWait}ms后重试...`);
        await new Promise(resolve => setTimeout(resolve, randomWait));
      }
    }
    throw new Error("所有重试都失败了");
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

  private async visitHomepage(): Promise<void> {
    try {
      await axios.get(WEREAD_URL, { 
        headers: this.getStandardHeaders(),
        timeout: 30000
      });
    } catch (error: any) {
      console.error("访问主页失败:", error.message);
    }
  }

  private async makeApiRequest<T>(
    url: string, 
    method: 'get' | 'post' = 'get', 
    params: Record<string, any> = {}, 
    data: any = null
  ): Promise<T> {
    await this.ensureInitialized();
    
    // 向所有GET请求添加时间戳避免缓存
    if (method === 'get') {
      params._ = new Date().getTime();
    }
    
    try {
      let response;
      
      if (method === 'get') {
        response = await this.axiosInstance.get(url, { params });
      } else {
        response = await this.axiosInstance.post(url, data, { params });
      }
      
      if (response.data.errcode !== undefined && response.data.errcode !== 0) {
        this.handleErrcode(response.data.errcode);
        throw new Error(`API返回错误: ${response.data.errmsg || 'Unknown error'} (code: ${response.data.errcode})`);
      }
      
      return response.data;
    } catch (error: any) {
      console.error(`API请求失败 (${url}):`, error.message);
      throw error;
    }
  }

  // 获取书架信息（存在笔记的书籍）
  public async getBookshelf(): Promise<any> {
    await this.ensureInitialized();
    return this.retry(async () => {
      const data = await this.makeApiRequest<any>(WEREAD_NOTEBOOKS_URL, "get");
      return data;
    });
  }

  // 获取所有书架书籍信息
  public async getEntireShelf(): Promise<any> {
    await this.ensureInitialized();
    return this.retry(async () => {
      return await this.makeApiRequest<any>(WEREAD_SHELF_SYNC_URL, "get");
    });
  }

  // 获取笔记本列表
  public async getNotebooklist(): Promise<any[]> {
    await this.ensureInitialized();
    return this.retry(async () => {
      const data = await this.makeApiRequest<any>(WEREAD_NOTEBOOKS_URL, "get");
      return data.books || [];
    });
  }

  // 获取书籍信息
  public async getBookinfo(bookId: string): Promise<any> {
    await this.ensureInitialized();
    return this.retry(async () => {
      return await this.makeApiRequest<any>(WEREAD_BOOK_INFO_URL, "get", { bookId });
    });
  }

  // 获取书籍的划线记录
  public async getBookmarkList(bookId: string): Promise<any[]> {
    await this.ensureInitialized();
    return this.retry(async () => {
      const data = await this.makeApiRequest<any>(WEREAD_BOOKMARKLIST_URL, "get", { bookId });
      let bookmarks = data.updated || [];
      // 确保每个划线对象格式一致
      bookmarks = bookmarks.filter((mark: any) => mark.markText && mark.chapterUid);
      return bookmarks;
    });
  }

  // 获取阅读进度
  public async getReadInfo(bookId: string): Promise<any> {
    await this.ensureInitialized();
    return this.retry(async () => {
      return await this.makeApiRequest<any>(WEREAD_READ_INFO_URL, "get", { bookId });
    });
  }

  // 获取笔记/想法列表
  public async getReviewList(bookId: string): Promise<any[]> {
    await this.ensureInitialized();
    return this.retry(async () => {
      const data = await this.makeApiRequest<any>(WEREAD_REVIEW_LIST_URL, "get", {
        bookId,
        listType: 4,
        maxIdx: 0,
        count: 0,
        listMode: 2,
        syncKey: 0
      });
      
      let reviews = data.reviews || [];
      // 转换成正确的格式
      reviews = reviews.map((x: any) => x.review);
      
      // 为书评添加chapterUid
      reviews = reviews.map((x: any) => {
        if (x.type === 4) {
          return { chapterUid: 1000000, ...x };
        }
        return x;
      });
      
      return reviews;
    });
  }

  // 获取热门书评
  public async getBestReviews(bookId: string, count: number = 10, maxIdx: number = 0, synckey: number = 0): Promise<any> {
    await this.ensureInitialized();
    return this.retry(async () => {
      const data = await this.makeApiRequest<any>(WEREAD_BEST_REVIEW_URL, "get", {
        bookId,
        synckey,
        maxIdx,
        count
      });
      
      return data;
    });
  }

  // 获取章节信息
  public async getChapterInfo(bookId: string): Promise<Record<string, ChapterInfo>> {
    await this.ensureInitialized();
    return this.retry(async () => {
      try {
        // 1. 首先访问主页，确保会话有效
        await this.visitHomepage();
        
        // 2. 获取笔记本列表，进一步初始化会话
        await this.getNotebooklist();
        
        // 3. 添加随机延迟，模拟真实用户行为
        const delay = 1000 + Math.floor(Math.random() * 2000);
        await new Promise(resolve => setTimeout(resolve, delay));
        
        // 4. 从cookie中提取关键信息
        let wr_vid = '';
        let wr_skey = '';
        
        // 提取wr_vid和wr_skey
        const vidMatch = this.cookie.match(/wr_vid=([^;]+)/);
        const skeyMatch = this.cookie.match(/wr_skey=([^;]+)/);
        
        if (vidMatch) wr_vid = vidMatch[1];
        if (skeyMatch) wr_skey = skeyMatch[1];
        
        // 5. 请求章节信息 - 模拟浏览器行为
        const url = `${WEREAD_CHAPTER_INFO_URL}`;
        
        // 添加请求参数
        const params: Record<string, any> = {
          _: new Date().getTime()
        };
        
        // 使用包含更多信息的请求头
        const headers = {
          'Cookie': this.cookie,
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36',
          'Content-Type': 'application/json;charset=UTF-8',
          'Accept': 'application/json, text/plain, */*',
          'Origin': 'https://weread.qq.com',
          'Referer': `https://weread.qq.com/web/reader/${bookId}`,
          'Sec-Fetch-Dest': 'empty',
          'Sec-Fetch-Mode': 'cors',
          'Sec-Fetch-Site': 'same-origin',
        };
        
        // 使用正确的请求体格式
        const body = JSON.stringify({
          bookIds: [bookId]
        });
        
        // 直接通过axios请求
        const response = await axios({
          method: 'post',
          url: url,
          params: params,
          headers: headers,
          data: body,
          timeout: 60000
        });
        
        const data = response.data;
        
        // 6. 处理结果 - 增加多种可能的响应格式处理
        let update = null;
        
        // 格式1: {data: [{bookId: "xxx", updated: []}]}
        if (data.data && data.data.length === 1 && data.data[0].updated) {
          update = data.data[0].updated;
        } 
        // 格式2: {updated: []}
        else if (data.updated && Array.isArray(data.updated)) {
          update = data.updated;
        }
        // 格式3: [{bookId: "xxx", updated: []}]
        else if (Array.isArray(data) && data.length > 0 && data[0].updated) {
          update = data[0].updated;
        }
        // 格式4: 数组本身就是章节列表
        else if (Array.isArray(data) && data.length > 0 && data[0].chapterUid) {
          update = data;
        }
        
        if (update) {
          // 添加点评章节
          update.push({
            chapterUid: 1000000,
            chapterIdx: 1000000,
            updateTime: 1683825006,
            readAhead: 0,
            title: "点评",
            level: 1
          });
          
          // 确保chapterUid始终以字符串形式作为键
          const result = update.reduce((acc: Record<string, ChapterInfo>, curr: ChapterInfo) => {
            // 显式转换为字符串
            const chapterUidStr = String(curr.chapterUid);
            acc[chapterUidStr] = curr;
            return acc;
          }, {});
          
          return result;
        } else if (data.errCode) {
          this.handleErrcode(data.errCode);
          throw new Error(`API返回错误: ${data.errMsg || 'Unknown error'} (code: ${data.errCode})`);
        } else if (data.errcode) {
          this.handleErrcode(data.errcode);
          throw new Error(`API返回错误: ${data.errmsg || 'Unknown error'} (code: ${data.errcode})`);
        } else {
          throw new Error(`获取章节信息失败，返回格式不符合预期`);
        }
      } catch (error: any) {
        console.error(`获取章节信息失败:`, error.message);
        if (error.response) {
          console.error(`状态码: ${error.response.status}`);
        }
        throw error;
      }
    });
  }

  public async getBookAISummary(bookId: string): Promise<string> {
    await this.ensureInitialized();

    const url = `${WEREAD_AI_SUMMARY_URL}?bookId=${bookId}`; // Ensure WEREAD_AI_SUMMARY_URL is defined and accessible

    try {
      const response = await this.makeApiRequest<any>(url, "get");

      if (!response || !Array.isArray(response.itemsArray) || response.itemsArray.length === 0) {
        return "No AI summary available for this book.";
      }

      let markdownSummary = "";

      for (const section of response.itemsArray) {
        if (section && Array.isArray(section.items)) {
          for (const item of section.items) {
            if (item && typeof item.text === 'string' && typeof item.level === 'number') {
              switch (item.level) {
                case 1:
                  markdownSummary += `# ${item.text}\n`;
                  break;
                case 2:
                  markdownSummary += `## ${item.text}\n`;
                  break;
                default:
                  if (item.level >= 3) {
                    const indent = "  ".repeat(item.level - 3);
                    markdownSummary += `${indent}- ${item.text}\n`;
                  }
                  break;
              }
            }
          }
        }
      }
      return markdownSummary;
    } catch (error: any) {
      console.error(`Failed to fetch or process AI summary for bookId ${bookId}:`, error.message);
      // Consider if makeApiRequest already handles console.error or if additional logging is needed here.
      // Depending on desired behavior, you might re-throw, or return a specific error message.
      return `Error fetching AI summary: ${error.message}`;
    }
  }
}