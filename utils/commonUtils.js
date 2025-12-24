import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';
import vm from 'vm';
import axios from 'axios';
import https from 'https';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 创建 require 函数（用于在 vm 上下文中使用）
const require = createRequire(import.meta.url);

// 禁用 SSL 证书验证（仅用于开发环境）
const httpsAgent = new https.Agent({
  rejectUnauthorized: false
});

class CommonUtils {
  constructor() {
    this.userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36';
    
    // 创建执行上下文，添加 require 和必要的模块
    this.xBogusContext = vm.createContext({
      console: console,
      global: globalThis,
      process: process,
      Buffer: Buffer,
      require: require,
      crypto: crypto,
      setTimeout: setTimeout,
      setInterval: setInterval,
      clearTimeout: clearTimeout,
      clearInterval: clearInterval,
      window: null,
      // 添加 buffer 模块
      buffer: require('buffer')
    });
    
    this.aBogusContext = vm.createContext({
      console: console,
      global: globalThis,
      process: process,
      Buffer: Buffer,
      require: require,
      crypto: crypto,
      setTimeout: setTimeout,
      setInterval: setInterval,
      clearTimeout: clearTimeout,
      clearInterval: clearInterval,
      // 添加 buffer 模块
      buffer: require('buffer')
    });
    
    // 加载并执行 x_bogus.js
    const xBogusPath = path.join(__dirname, 'x_bogus.js');
    const xBogusCode = fs.readFileSync(xBogusPath, 'utf-8');
    vm.runInContext(xBogusCode, this.xBogusContext);
    
    // 加载并执行 a_bogus.js
    const aBogusPath = path.join(__dirname, 'a_bogus.js');
    const aBogusCode = fs.readFileSync(aBogusPath, 'utf-8');
    vm.runInContext(aBogusCode, this.aBogusContext);
  }

  getXbogus(reqUrl, userAgent) {
    /**
     * xbogus加密
     * @param {string} reqUrl - 请求URL
     * @param {string} userAgent - User Agent
     * @returns {string} xbogus值
     */
    const urlObj = new URL(reqUrl);
    const query = urlObj.search.substring(1); // 去掉开头的 '?'
    
    // 调用 x_bogus.js 中的 sign 函数
    const signFunc = this.xBogusContext.sign;
    return signFunc(query, userAgent);
  }

  getAbogus(reqUrl, userAgent) {
    /**
     * a_bogus加密
     * @param {string} reqUrl - 请求URL
     * @param {string} userAgent - User Agent
     * @returns {string} a_bogus值
     */
    const urlObj = new URL(reqUrl);
    const query = urlObj.search.substring(1); // 去掉开头的 '?'
    
    // 调用 a_bogus.js 中的 generate_a_bogus 函数
    const generateFunc = this.aBogusContext.generate_a_bogus;
    return generateFunc(query, userAgent);
  }

  getMsToken(randomLength = 107) {
    /**
     * 根据传入长度产生随机字符串
     * @param {number} randomLength - 随机字符串长度
     * @returns {string} 随机字符串
     */
    const baseStr = 'ABCDEFGHIGKLMNOPQRSTUVWXYZabcdefghigklmnopqrstuvwxyz0123456789=';
    let randomStr = '';
    for (let i = 0; i < randomLength; i++) {
      const randomIndex = Math.floor(Math.random() * baseStr.length);
      randomStr += baseStr[randomIndex];
    }
    return randomStr;
  }

  async getTtwidWebid(reqUrl) {
    /**
     * 获取 ttwid 和 webid
     * @param {string} reqUrl - 请求URL
     * @returns {Promise<[string, string]>} [ttwid, webid]
     */
    while (true) {
      try {
        const headers = {
          'User-Agent': this.userAgent,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
          'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8'
        };

        const response = await axios.get(reqUrl, {
          headers,
          httpsAgent,
          timeout: 3000,
          validateStatus: () => true
        });

        // 获取 ttwid 从 cookies
        const cookies = response.headers['set-cookie'] || [];
        let ttwidStr = null;
        for (const cookie of cookies) {
          const match = cookie.match(/ttwid=([^;]+)/);
          if (match) {
            ttwidStr = match[1];
            break;
          }
        }

        // 从响应文本中提取 webid
        const renderDataMatch = response.data.match(/<script id="RENDER_DATA" type="application\/json">(.*?)<\/script>/);
        if (renderDataMatch) {
          let renderDataText = renderDataMatch[1];
          renderDataText = decodeURIComponent(renderDataText);
          const renderDataJson = JSON.parse(renderDataText);
          const webid = renderDataJson?.app?.odin?.user_unique_id;
          
          if (ttwidStr && webid) {
            return [ttwidStr, webid];
          }
        }
      } catch (error) {
        console.error('获取 ttwid 和 webid 失败:', error.message);
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  }
}

export default CommonUtils;

